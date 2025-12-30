/*
  # Automation Platform Schema
  
  Creates the foundational database structure for the AI-driven automation platform.
  
  ## New Tables
  
  ### `automations`
  Stores user-created automations with their AI-parsed configuration
  - `id` (uuid, primary key) - Unique automation identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `name` (text) - Human-readable automation name
  - `description` (text) - User's original natural language input
  - `trigger_type` (text) - The trigger service (e.g., 'stripe_payment', 'gmail_new_email')
  - `trigger_config` (jsonb) - Trigger configuration details
  - `actions` (jsonb) - Array of action steps to execute
  - `required_auth` (text[]) - List of required authentication connections
  - `status` (text) - Current status: 'active', 'paused', 'error'
  - `activepieces_flow_id` (text, nullable) - Reference to Activepieces workflow
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `connections`
  Stores encrypted OAuth tokens and API keys for external services
  - `id` (uuid, primary key) - Unique connection identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `service_name` (text) - Service identifier (e.g., 'slack', 'stripe', 'gmail')
  - `auth_type` (text) - Authentication method: 'oauth2', 'api_key'
  - `credentials` (jsonb) - Encrypted credentials (tokens, keys, etc.)
  - `metadata` (jsonb) - Additional service-specific data
  - `status` (text) - Connection status: 'active', 'expired', 'revoked'
  - `created_at` (timestamptz) - Creation timestamp
  - `expires_at` (timestamptz, nullable) - Token expiration time
  
  ### `execution_logs`
  Tracks automation execution history and results
  - `id` (uuid, primary key) - Unique log identifier
  - `automation_id` (uuid, foreign key) - References automations
  - `user_id` (uuid, foreign key) - References auth.users
  - `status` (text) - Execution result: 'success', 'failed', 'running'
  - `trigger_data` (jsonb) - Data that triggered the execution
  - `execution_data` (jsonb) - Step-by-step execution details
  - `error_message` (text, nullable) - Error details if failed
  - `started_at` (timestamptz) - Execution start time
  - `completed_at` (timestamptz, nullable) - Execution completion time
  
  ### `allowed_integrations`
  Defines the fixed allow-list of supported integrations
  - `id` (uuid, primary key) - Unique integration identifier
  - `service_name` (text, unique) - Service identifier
  - `display_name` (text) - User-facing service name
  - `category` (text) - Category: 'trigger', 'action', 'both'
  - `auth_type` (text) - Required authentication type
  - `capabilities` (jsonb) - Available triggers and actions
  - `is_active` (boolean) - Whether this integration is currently available
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  
  - Enable RLS on all tables
  - Users can only access their own automations, connections, and logs
  - allowed_integrations is read-only for all authenticated users
*/

-- Create automations table
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}'::jsonb,
  schedule text,
  conditions jsonb DEFAULT '[]'::jsonb,
  filters jsonb DEFAULT '[]'::jsonb,
  actions jsonb DEFAULT '[]'::jsonb,
  required_auth text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  activepieces_flow_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  auth_type text NOT NULL CHECK (auth_type IN ('oauth2', 'api_key')),
  credentials jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, service_name)
);

-- Create execution_logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  trigger_data jsonb DEFAULT '{}'::jsonb,
  execution_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create allowed_integrations table
CREATE TABLE IF NOT EXISTS allowed_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('trigger', 'action', 'both')),
  auth_type text NOT NULL,
  capabilities jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_service ON connections(service_name);
CREATE INDEX IF NOT EXISTS idx_execution_logs_automation_id ON execution_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_started_at ON execution_logs(started_at DESC);

-- Enable Row Level Security
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automations
CREATE POLICY "Users can view own automations"
  ON automations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own automations"
  ON automations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations"
  ON automations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations"
  ON automations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for connections
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for execution_logs
CREATE POLICY "Users can view own execution logs"
  ON execution_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own execution logs"
  ON execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for allowed_integrations (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view allowed integrations"
  ON allowed_integrations FOR SELECT
  TO authenticated
  USING (true);

-- Insert default allowed integrations
INSERT INTO allowed_integrations (service_name, display_name, category, auth_type, capabilities, is_active) VALUES
  ('slack', 'Slack', 'both', 'oauth2', 
   '{"triggers": ["new_message"], "actions": ["send_message", "send_dm"]}'::jsonb, true),
  ('stripe', 'Stripe', 'trigger', 'api_key', 
   '{"triggers": ["payment_received", "subscription_created", "payment_failed"]}'::jsonb, true),
  ('gmail', 'Gmail', 'both', 'oauth2', 
   '{"triggers": ["new_email"], "actions": ["send_email"]}'::jsonb, true),
  ('google_sheets', 'Google Sheets', 'both', 'oauth2', 
   '{"triggers": ["new_row"], "actions": ["add_row", "update_row"]}'::jsonb, true),
  ('webhook', 'Webhook', 'trigger', 'none', 
   '{"triggers": ["webhook_received"]}'::jsonb, true),
  ('http', 'HTTP Request', 'action', 'none', 
   '{"actions": ["post", "get"]}'::jsonb, true)
ON CONFLICT (service_name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automations
DROP TRIGGER IF EXISTS update_automations_updated_at ON automations;
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();