import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WebhookConfig {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body_template: string;
  auth_type: string;
  retry_enabled: boolean;
  retry_max_attempts: number;
  timeout_ms: number;
  secret?: string;
}

interface WebhookLog {
  id: string;
  webhook_config_id: string;
  url: string;
  method: string;
  request_headers: Record<string, string>;
  request_body: Record<string, unknown>;
  response_status: number | null;
  processing_status: string;
  error_message: string | null;
}

// Generate HMAC signature for webhook using Web Crypto API
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256=${hashHex}`;
  } catch (error) {
    console.error('HMAC generation error:', error);
    throw error;
  }
}

// Verify HMAC signature
async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expected = await generateHmacSignature(payload, secret);
    return signature === expected;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Send outbound webhook with retry logic
async function sendWebhook(
  config: WebhookConfig,
  payload: Record<string, unknown>,
  attempt = 1
): Promise<{ status: number; body: string; error?: string }> {
  try {
    // Prepare headers with proper typing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add authentication if configured
    if (config.auth_type === 'bearer' && config.headers['Authorization']) {
      headers['Authorization'] = config.headers['Authorization'];
    } else if (config.auth_type === 'basic' && config.headers['Authorization']) {
      headers['Authorization'] = config.headers['Authorization'];
    }

    // Generate signature if secret exists
    const payloadString = JSON.stringify(payload);
    if (config.secret) {
      const signature = await generateHmacSignature(payloadString, config.secret);
      headers['X-Webhook-Signature-256'] = signature;
    }

    // Send request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

    const response = await fetch(config.url, {
      method: config.method,
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    return {
      status: response.status,
      body: responseBody.substring(0, 10000), // Limit to 10KB
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 0,
      body: '',
      error: errorMessage,
    };
  }
}

// Calculate exponential backoff delay (in ms)
function calculateBackoffDelay(attemptNumber: number): number {
  if (attemptNumber === 1) return 30 * 1000; // 30 seconds
  if (attemptNumber === 2) return 2 * 60 * 1000; // 2 minutes
  return 10 * 60 * 1000; // 10 minutes
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);

    // GET: Retrieve webhook configurations
    if (req.method === 'GET') {
      const automationId = url.searchParams.get('automation_id');
      const logId = url.searchParams.get('log_id');

      // Get webhook logs for history
      if (logId) {
        const { data: logs, error } = await supabase
          .from('webhook_logs')
          .select('*')
          .eq('id', logId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: 'Webhook log not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(logs), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get webhook configurations
      if (automationId) {
        const { data: configs, error } = await supabase
          .from('webhook_configurations')
          .select('*')
          .eq('automation_id', automationId)
          .eq('user_id', user.id);

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch configs' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ webhooks: configs }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all webhook logs for automation with pagination
      const limit = 100;
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const status = url.searchParams.get('status');

      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('processing_status', status);
      }

      const { data: logs, count, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ logs, total: count }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Create webhook configuration or send webhook
    if (req.method === 'POST') {
      const body = await req.json();
      const { action, webhook_config, payload, webhook_id } = body;

      if (action === 'create_config') {
        // Create new webhook configuration
        const { data: config, error } = await supabase
          .from('webhook_configurations')
          .insert({
            user_id: user.id,
            automation_id: webhook_config.automation_id,
            url: webhook_config.url,
            method: webhook_config.method || 'POST',
            headers: webhook_config.headers || {},
            body_template: webhook_config.body_template,
            auth_type: webhook_config.auth_type || 'none',
            secret: webhook_config.secret,
            retry_enabled: webhook_config.retry_enabled !== false,
            retry_max_attempts: webhook_config.retry_max_attempts || 3,
            timeout_ms: webhook_config.timeout_ms || 30000,
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ webhook: config }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'send_webhook') {
        // Send outbound webhook
        const { data: config } = await supabase
          .from('webhook_configurations')
          .select('*')
          .eq('id', webhook_id)
          .eq('user_id', user.id)
          .single();

        if (!config) {
          return new Response(JSON.stringify({ error: 'Webhook config not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send webhook
        const result = await sendWebhook(config, payload);

        // Log the attempt
        const { data: log, error: logError } = await supabase
          .from('webhook_logs')
          .insert({
            user_id: user.id,
            automation_id: config.automation_id,
            webhook_config_id: webhook_id,
            webhook_type: 'outbound',
            direction: 'outgoing',
            url: config.url,
            method: config.method,
            request_headers: config.headers,
            request_body: payload,
            response_status: result.status,
            processing_status: result.error ? 'failed' : (result.status >= 200 && result.status < 300 ? 'success' : 'failed'),
            error_message: result.error || null,
            processing_duration_ms: 0,
          })
          .select()
          .single();

        // Queue retry if failed and retries enabled
        if (result.error && config.retry_enabled) {
          const backoffMs = calculateBackoffDelay(1);
          const retryTime = new Date(Date.now() + backoffMs);
          
          await supabase.from('webhook_retry_queue').insert({
            webhook_log_id: log.id,
            scheduled_retry_at: retryTime.toISOString(),
            attempt_number: 1,
          });
        }

        return new Response(JSON.stringify({ 
          success: !result.error,
          status: result.status,
          log: log,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT: Update webhook configuration
    if (req.method === 'PUT') {
      const body = await req.json();
      const { webhook_id, ...updates } = body;

      const { data: config, error } = await supabase
        .from('webhook_configurations')
        .update(updates)
        .eq('id', webhook_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ webhook: config }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Remove webhook configuration
    if (req.method === 'DELETE') {
      const webhook_id = url.searchParams.get('webhook_id');

      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', webhook_id)
        .eq('user_id', user.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook management error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
