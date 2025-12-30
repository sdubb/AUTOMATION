import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "npm:crypto@^1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Signature",
};

// Rate limiting: Simple in-memory store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per webhook

function checkRateLimit(webhookId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = webhookId;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // New window or expired
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetAt: record.resetAt,
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const webhookId = pathParts[pathParts.length - 1];

    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: 'Webhook ID required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find automation by webhook_id
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('webhook_id', webhookId)
      .eq('status', 'active')
      .single();

    if (fetchError || !automation) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found or automation is inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(webhookId);
    if (!rateLimit.allowed) {
      const resetSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${resetSeconds} seconds.`,
          retry_after: resetSeconds,
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            'Retry-After': String(resetSeconds),
          },
        }
      );
    }

    // Get request body
    const body = await req.text();
    let payload: any;
    
    try {
      payload = JSON.parse(body);
    } catch {
      // If not JSON, store as raw text
      payload = { raw_body: body };
    }

    // Validate webhook signature if secret exists
    if (automation.webhook_secret) {
      const signature = req.headers.get('X-Webhook-Signature') || 
                       req.headers.get('X-Hub-Signature-256') ||
                       req.headers.get('Authorization')?.replace('Bearer ', '');
      
      if (signature) {
        // Common signature formats: HMAC SHA256
        const hmac = createHmac('sha256', automation.webhook_secret);
        hmac.update(body);
        const expectedSignature = hmac.digest('hex');
        
        // Handle different signature formats
        const receivedSignature = signature.includes('=') 
          ? signature.split('=')[1] 
          : signature;
        
        if (receivedSignature !== expectedSignature) {
          return new Response(
            JSON.stringify({ error: 'Invalid webhook signature' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Log webhook receipt
    const { error: logError } = await supabase
      .from('execution_logs')
      .insert({
        automation_id: automation.id,
        user_id: automation.user_id,
        status: 'running',
        trigger_data: {
          webhook_id: webhookId,
          payload: payload,
          headers: Object.fromEntries(req.headers.entries()),
          method: req.method,
          timestamp: new Date().toISOString(),
        },
        execution_data: {},
        started_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Trigger automation execution
    // In a full implementation, this would:
    // 1. Evaluate conditions/filters
    // 2. Execute actions
    // 3. Update execution log with results
    // For now, we'll just acknowledge receipt
    
    // Update execution log as success (simplified)
    const { data: latestLog } = await supabase
      .from('execution_logs')
      .select('id')
      .eq('automation_id', automation.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (latestLog) {
      await supabase
        .from('execution_logs')
        .update({
          status: 'success',
          execution_data: {
            message: 'Webhook received and processed',
            actions_executed: automation.actions?.length || 0,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', latestLog.id);
    }

    // Return success response with rate limit headers
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook received',
        automation_id: automation.id,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

