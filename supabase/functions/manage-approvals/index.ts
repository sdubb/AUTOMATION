import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApprovalRequest {
  id: string;
  automation_id: string;
  automation_run_id: string;
  status: string;
  trigger_data: Record<string, unknown>;
  actions_preview: Array<Record<string, unknown>>;
  requested_at: string;
  expires_at: string;
  approved_at: string | null;
  approved_by_user_id: string | null;
  rejection_reason: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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

    // GET: Retrieve approval requests
    if (req.method === 'GET') {
      const requestId = url.searchParams.get('request_id');
      const automationId = url.searchParams.get('automation_id');
      const status = url.searchParams.get('status');

      // Get single request
      if (requestId) {
        const { data: request, error } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('id', requestId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: 'Request not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(request), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all requests for automation
      if (automationId) {
        let query = supabase
          .from('approval_requests')
          .select('*')
          .eq('automation_id', automationId)
          .eq('user_id', user.id)
          .order('requested_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data: requests, error } = await query;

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch requests' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ requests }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all pending requests for user
      const { data: requests, error } = await supabase
        .from('approval_requests')
        .select('*, automations(name, description)')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('expires_at', { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch requests' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ requests }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Create approval request
    if (req.method === 'POST') {
      const body = await req.json();
      const { action, automation_id, trigger_data, actions_preview } = body;

      if (action === 'create_request') {
        // Verify automation exists and belongs to user
        const { data: automation, error: autoError } = await supabase
          .from('automations')
          .select('id, require_approval, approval_timeout_ms')
          .eq('id', automation_id)
          .eq('user_id', user.id)
          .single();

        if (autoError || !automation || !automation.require_approval) {
          return new Response(
            JSON.stringify({ error: 'Automation not found or approval not required' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Create approval request
        const expiresAt = new Date(
          Date.now() + (automation.approval_timeout_ms || 3600000)
        );

        const { data: request, error } = await supabase
          .from('approval_requests')
          .insert({
            user_id: user.id,
            automation_id,
            automation_run_id: crypto.randomUUID(),
            trigger_data,
            actions_preview,
            requested_by_user_id: user.id,
            expires_at: expiresAt.toISOString(),
            auto_execute_at: expiresAt.toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create history entry
        await supabase.from('approval_history').insert({
          approval_request_id: request.id,
          action: 'requested',
          reason: 'Approval required before execution',
        });

        return new Response(JSON.stringify({ request }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT: Approve or reject request
    if (req.method === 'PUT') {
      const body = await req.json();
      const { request_id, action, reason } = body;

      // Verify user has permission to approve
      const { data: request, error: reqError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', request_id)
        .eq('status', 'pending')
        .single();

      if (reqError || !request) {
        return new Response(JSON.stringify({ error: 'Request not found or not pending' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is the automation owner or an approver
      const { data: automation } = await supabase
        .from('automations')
        .select('user_id, approval_recipients')
        .eq('id', request.automation_id)
        .single();

      const isOwner = automation?.user_id === user.id;
      const isApprover = automation?.approval_recipients?.includes(user.id) ||
                         automation?.approval_recipients?.includes(user.email);

      if (!isOwner && !isApprover) {
        return new Response(JSON.stringify({ error: 'Unauthorized to approve' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'approve') {
        const { data: updated, error } = await supabase
          .from('approval_requests')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by_user_id: user.id,
            approval_method: 'manual',
          })
          .eq('id', request_id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create history entry
        await supabase.from('approval_history').insert({
          approval_request_id: request_id,
          action: 'approved',
          actor_user_id: user.id,
          reason: reason || 'Manually approved',
        });

        return new Response(JSON.stringify({ request: updated }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'reject') {
        const { data: updated, error } = await supabase
          .from('approval_requests')
          .update({
            status: 'rejected',
            approved_at: new Date().toISOString(),
            approved_by_user_id: user.id,
            approval_method: 'manual',
            rejection_reason: reason,
          })
          .eq('id', request_id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create history entry
        await supabase.from('approval_history').insert({
          approval_request_id: request_id,
          action: 'rejected',
          actor_user_id: user.id,
          reason: reason || 'Manually rejected',
        });

        return new Response(JSON.stringify({ request: updated }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Approval management error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
