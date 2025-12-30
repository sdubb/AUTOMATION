-- Add webhook support to automation platform
-- Creates tables for webhook configurations and execution history

-- webhook_configurations: Store webhook URLs, headers, and settings for outbound webhooks
CREATE TABLE webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST', -- POST, GET, PUT, DELETE, PATCH
  headers JSONB DEFAULT '{}', -- Custom headers like Authorization, Content-Type
  body_template TEXT, -- JSON template for request body
  auth_type TEXT DEFAULT 'none', -- none, basic, bearer, custom_header
  auth_config JSONB, -- Stores auth details (encrypted in app)
  retry_enabled BOOLEAN DEFAULT TRUE,
  retry_max_attempts INT DEFAULT 3,
  retry_backoff TEXT DEFAULT 'exponential', -- linear, exponential
  timeout_ms INT DEFAULT 30000, -- 30 second timeout
  secret TEXT, -- For HMAC signature generation
  ip_whitelist TEXT ARRAY DEFAULT '{}', -- For IP-based whitelisting
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

-- webhook_logs: Complete execution history for all webhooks (inbound and outbound)
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL,
  webhook_config_id UUID, -- NULL for inbound webhooks
  webhook_type TEXT NOT NULL, -- 'inbound' or 'outbound'
  direction TEXT NOT NULL, -- 'incoming' or 'outgoing'
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  request_headers JSONB, -- Headers sent/received
  request_body JSONB, -- Full payload
  request_body_hash TEXT, -- SHA256 hash if payload is large (>1MB)
  response_status INT, -- HTTP status code
  response_headers JSONB,
  response_body TEXT, -- First 10KB of response
  processing_status TEXT NOT NULL, -- 'success', 'failed', 'retrying', 'queued', 'timeout'
  error_message TEXT, -- Detailed error if failed
  retry_count INT DEFAULT 0,
  retry_attempts JSONB DEFAULT '[]', -- Array of {timestamp, status, error}
  processing_duration_ms INT, -- Time spent processing
  signature_verified BOOLEAN DEFAULT NULL, -- NULL for unsigned, true/false for verified
  signature_algorithm TEXT, -- SHA256, SHA1
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  CONSTRAINT fk_webhook_config FOREIGN KEY (webhook_config_id) REFERENCES webhook_configurations(id) ON DELETE SET NULL
);

-- webhook_retry_queue: Queue for webhooks pending retry
CREATE TABLE webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_log_id UUID NOT NULL,
  scheduled_retry_at TIMESTAMP NOT NULL,
  attempt_number INT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_webhook_log FOREIGN KEY (webhook_log_id) REFERENCES webhook_logs(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_webhook_configs_user_automation ON webhook_configurations(user_id, automation_id);
CREATE INDEX idx_webhook_logs_automation ON webhook_logs(automation_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(processing_status, created_at DESC);
CREATE INDEX idx_webhook_logs_user ON webhook_logs(user_id, created_at DESC);
CREATE INDEX idx_webhook_retry_queue_scheduled ON webhook_retry_queue(scheduled_retry_at, status);

-- Add column to automations table if not already present
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS webhook_trigger_secret TEXT, -- Secret for validating inbound webhooks
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhook_path TEXT; -- /webhooks/{user_id}/{automation_id}

-- Create RLS policies for webhook_configurations
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook configs" 
ON webhook_configurations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create webhook configs" 
ON webhook_configurations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs" 
ON webhook_configurations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs" 
ON webhook_configurations FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook logs" 
ON webhook_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook logs" 
ON webhook_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for webhook_retry_queue (read-only for users)
ALTER TABLE webhook_retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view retry queue for their webhooks" 
ON webhook_retry_queue FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM webhook_logs wl
    WHERE wl.id = webhook_log_id
    AND wl.user_id = auth.uid()
  )
);
