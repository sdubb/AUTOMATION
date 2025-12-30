-- Add Human-in-the-Loop approval system
-- Enables users to require approval before automations execute

-- Add approval columns to automations table
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approval_timeout_ms INT DEFAULT 3600000, -- 1 hour default
ADD COLUMN IF NOT EXISTS approval_channels TEXT[] DEFAULT '{}', -- email, slack, sms
ADD COLUMN IF NOT EXISTS approval_recipients TEXT[] DEFAULT '{}', -- emails or user IDs
ADD COLUMN IF NOT EXISTS approval_instructions TEXT; -- Instructions shown to approver

-- approval_requests: Track all approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL,
  automation_run_id UUID NOT NULL,
  trigger_data JSONB, -- What triggered the automation
  actions_preview JSONB, -- Preview of actions that will execute
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired, auto_executed
  requested_at TIMESTAMP DEFAULT NOW(),
  requested_by_user_id UUID NOT NULL, -- System user or automation user
  approved_at TIMESTAMP, -- When approved
  approved_by_user_id UUID, -- Who approved it (NULL if auto-executed)
  approval_method TEXT, -- email, slack, in_app, sms, auto
  rejection_reason TEXT, -- Why rejected
  auto_execute_at TIMESTAMP, -- When to auto-execute if not approved
  expires_at TIMESTAMP, -- Request expires at this time
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  CONSTRAINT fk_approver FOREIGN KEY (approved_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- approval_notifications: Track approval notifications sent
CREATE TABLE approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL,
  recipient_address TEXT NOT NULL, -- email@example.com or slack_user_id
  notification_channel TEXT NOT NULL, -- email, slack, sms
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP, -- When recipient opened (email tracking)
  clicked_at TIMESTAMP, -- When they clicked approve/reject
  status TEXT DEFAULT 'sent', -- sent, delivered, bounced, opened, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_approval_request FOREIGN KEY (approval_request_id) 
    REFERENCES approval_requests(id) ON DELETE CASCADE
);

-- approval_history: Audit log of all approvals
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL,
  action TEXT NOT NULL, -- requested, approved, rejected, expired, auto_executed
  actor_user_id UUID, -- Who performed the action
  reason TEXT, -- Why they took the action
  metadata JSONB DEFAULT '{}', -- Additional context
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_approval_request FOREIGN KEY (approval_request_id) 
    REFERENCES approval_requests(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_approval_requests_user_status ON approval_requests(user_id, status);
CREATE INDEX idx_approval_requests_automation ON approval_requests(automation_id, status);
CREATE INDEX idx_approval_requests_expires_at ON approval_requests(expires_at) 
  WHERE status = 'pending';
CREATE INDEX idx_approval_notifications_request ON approval_notifications(approval_request_id);
CREATE INDEX idx_approval_history_request ON approval_history(approval_request_id);
CREATE INDEX idx_automations_require_approval ON automations(require_approval) 
  WHERE require_approval = TRUE;

-- Create RLS policies for approval_requests
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own approval requests" 
ON approval_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can approve requests sent to them" 
ON approval_requests FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT CAST(recipient AS UUID) FROM (
      SELECT unnest(approval_recipients) as recipient 
      FROM automations 
      WHERE id = automation_id
    ) t
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT CAST(recipient AS UUID) FROM (
      SELECT unnest(approval_recipients) as recipient 
      FROM automations 
      WHERE id = automation_id
    ) t
  )
);

-- Create RLS policies for approval_notifications
ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their approval requests" 
ON approval_notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM approval_requests ar
    WHERE ar.id = approval_request_id
    AND ar.user_id = auth.uid()
  )
);

-- Create RLS policies for approval_history
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for their approval requests" 
ON approval_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM approval_requests ar
    WHERE ar.id = approval_request_id
    AND ar.user_id = auth.uid()
  )
);

-- Function to auto-approve expired requests
CREATE OR REPLACE FUNCTION auto_approve_expired_requests()
RETURNS void AS $$
BEGIN
  UPDATE approval_requests
  SET 
    status = 'auto_executed',
    approved_at = NOW(),
    approval_method = 'auto'
  WHERE 
    status = 'pending'
    AND expires_at < NOW()
    AND auto_execute_at IS NOT NULL;

  INSERT INTO approval_history (approval_request_id, action, reason)
  SELECT 
    id,
    'auto_executed',
    'Approval timeout expired'
  FROM approval_requests
  WHERE 
    status = 'auto_executed'
    AND updated_at > NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Function to create approval request
CREATE OR REPLACE FUNCTION create_approval_request(
  p_user_id UUID,
  p_automation_id UUID,
  p_trigger_data JSONB,
  p_actions_preview JSONB
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_timeout_ms INT;
  v_expires_at TIMESTAMP;
BEGIN
  SELECT approval_timeout_ms INTO v_timeout_ms
  FROM automations
  WHERE id = p_automation_id AND user_id = p_user_id;

  v_expires_at := NOW() + (v_timeout_ms || ' milliseconds')::INTERVAL;

  INSERT INTO approval_requests (
    user_id,
    automation_id,
    automation_run_id,
    trigger_data,
    actions_preview,
    requested_by_user_id,
    expires_at,
    auto_execute_at
  )
  VALUES (
    p_user_id,
    p_automation_id,
    gen_random_uuid(),
    p_trigger_data,
    p_actions_preview,
    p_user_id,
    v_expires_at,
    v_expires_at
  )
  RETURNING id INTO v_request_id;

  INSERT INTO approval_history (approval_request_id, action, reason)
  VALUES (v_request_id, 'requested', 'Approval required before execution');

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve request
CREATE OR REPLACE FUNCTION approve_approval_request(
  p_request_id UUID,
  p_approver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE approval_requests
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by_user_id = p_approver_id,
    approval_method = 'manual'
  WHERE id = p_request_id AND status = 'pending';

  INSERT INTO approval_history (
    approval_request_id,
    action,
    actor_user_id,
    reason
  )
  VALUES (
    p_request_id,
    'approved',
    p_approver_id,
    'Manually approved'
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to reject request
CREATE OR REPLACE FUNCTION reject_approval_request(
  p_request_id UUID,
  p_rejecter_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE approval_requests
  SET 
    status = 'rejected',
    approved_at = NOW(),
    approved_by_user_id = p_rejecter_id,
    approval_method = 'manual',
    rejection_reason = p_reason
  WHERE id = p_request_id AND status = 'pending';

  INSERT INTO approval_history (
    approval_request_id,
    action,
    actor_user_id,
    reason
  )
  VALUES (
    p_request_id,
    'rejected',
    p_rejecter_id,
    p_reason
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
