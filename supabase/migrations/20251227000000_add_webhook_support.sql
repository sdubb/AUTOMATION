-- Add webhook support to automations table
-- This enables receiving webhooks from external services

ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS webhook_id text UNIQUE,
ADD COLUMN IF NOT EXISTS webhook_secret text,
ADD COLUMN IF NOT EXISTS webhook_url text;

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_automations_webhook_id ON automations(webhook_id) WHERE webhook_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN automations.webhook_id IS 'Unique identifier for webhook endpoint (used in URL path)';
COMMENT ON COLUMN automations.webhook_secret IS 'Secret key for webhook signature validation';
COMMENT ON COLUMN automations.webhook_url IS 'Full webhook URL that external services should call';

