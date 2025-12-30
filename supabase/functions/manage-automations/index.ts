import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ACTIVEPIECES_URL = Deno.env.get('ACTIVEPIECES_URL') || '';
const ACTIVEPIECES_API_KEY = Deno.env.get('ACTIVEPIECES_API_KEY') || '';

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
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const automationId = url.searchParams.get('automation_id');
      const includeLogs = url.searchParams.get('logs') === 'true';

      // If requesting logs for specific automation
      if (automationId && includeLogs) {
        // Verify automation belongs to user
        const { data: automation, error: authError } = await supabase
          .from('automations')
          .select('id')
          .eq('id', automationId)
          .eq('user_id', user.id)
          .single();

        if (authError || !automation) {
          return new Response(
            JSON.stringify({ error: 'Automation not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: logs, error: logsError } = await supabase
          .from('execution_logs')
          .select('*')
          .eq('automation_id', automationId)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(50);

        if (logsError) throw logsError;

        return new Response(
          JSON.stringify({ logs }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get automations with execution stats
      const { data: automations, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get execution stats for each automation
      const automationsWithStats = await Promise.all(
        automations.map(async (automation) => {
          const { data: latestLog } = await supabase
            .from('execution_logs')
            .select('started_at, status, error_message')
            .eq('automation_id', automation.id)
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from('execution_logs')
            .select('*', { count: 'exact', head: true })
            .eq('automation_id', automation.id)
            .eq('user_id', user.id);

          return {
            ...automation,
            last_run_at: latestLog?.started_at || null,
            last_run_status: latestLog?.status || null,
            last_error_message: latestLog?.error_message || null,
            execution_count: count || 0,
          };
        })
      );

      return new Response(
        JSON.stringify({ automations: automationsWithStats }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      const automationId = url.searchParams.get('id');
      const isTest = url.searchParams.get('test') === 'true';
      const isTestWebhook = url.searchParams.get('test_webhook') === 'true';
      
      // Handle test webhook request
      if (isTestWebhook && automationId) {
        const { action, test_payload } = await req.json();
        
        if (action !== 'test_webhook') {
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get automation
        const { data: automation, error: fetchError } = await supabase
          .from('automations')
          .select('*')
          .eq('id', automationId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !automation) {
          return new Response(
            JSON.stringify({ error: 'Automation not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!automation.webhook_url || !automation.webhook_id) {
          return new Response(
            JSON.stringify({ error: 'This automation does not have a webhook URL' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Send test webhook to the receive-webhook endpoint
        try {
          const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/receive-webhook/${automation.webhook_id}`;
          const testPayload = test_payload || {
            event: 'test.webhook',
            timestamp: new Date().toISOString(),
            data: { message: 'This is a test webhook event', test: true },
          };

          // Generate signature if webhook_secret exists
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (automation.webhook_secret) {
            const crypto = await import('npm:crypto@^1.0.0');
            const hmac = crypto.createHmac('sha256', automation.webhook_secret);
            const payloadString = JSON.stringify(testPayload);
            hmac.update(payloadString);
            const signature = hmac.digest('hex');
            headers['X-Webhook-Signature'] = `sha256=${signature}`;
          }

          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(testPayload),
          });

          const webhookData = await webhookResponse.json();

          if (!webhookResponse.ok) {
            return new Response(
              JSON.stringify({ error: webhookData.error || 'Failed to send test webhook' }),
              {
                status: webhookResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Test webhook sent successfully',
              webhook_response: webhookData,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ error: `Failed to send test webhook: ${e instanceof Error ? e.message : 'Unknown error'}` }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      // Handle test automation request
      if (isTest && automationId) {
        const { action } = await req.json();
        
        if (action !== 'test') {
          return new Response(
            JSON.stringify({ error: 'Invalid test action' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get automation
        const { data: automation, error: fetchError } = await supabase
          .from('automations')
          .select('*')
          .eq('id', automationId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !automation) {
          return new Response(
            JSON.stringify({ error: 'Automation not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Verify connections exist
        const { data: connections, error: connError } = await supabase
          .from('connections')
          .select('service_name, status')
          .eq('user_id', user.id)
          .in('service_name', automation.required_auth);

        if (connError) throw connError;

        const connectedServices = connections.map(c => c.service_name);
        const missingConnections = automation.required_auth.filter(
          (service: string) => !connectedServices.includes(service)
        );

        if (missingConnections.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Missing required connections',
              missing_connections: missingConnections 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check for inactive connections
        const inactiveConnections = connections
          .filter(c => c.status !== 'active')
          .map(c => c.service_name);

        if (inactiveConnections.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Some connections are inactive',
              inactive_connections: inactiveConnections 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Test successful (dry-run - no actual execution)
        return new Response(
          JSON.stringify({ 
            message: 'Test successful! All connections are valid and automation is ready to run.',
            automation: {
              id: automation.id,
              name: automation.name,
              trigger: automation.trigger_type,
              actions: automation.actions
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Normal POST - create automation
      const { name, description, trigger, trigger_config, schedule, conditions, filters, actions, required_auth } = await req.json();

      if (!name || !trigger || !actions || !required_auth) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: connections, error: connError } = await supabase
        .from('connections')
        .select('service_name')
        .eq('user_id', user.id)
        .in('service_name', required_auth);

      if (connError) throw connError;

      const connectedServices = connections.map(c => c.service_name);
      const missingConnections = required_auth.filter(
        (service: string) => !connectedServices.includes(service)
      );

      if (missingConnections.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required connections',
            missing_connections: missingConnections 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let activepiecesFlowId = null;
      
      if (ACTIVEPIECES_URL && ACTIVEPIECES_API_KEY) {
        try {
          const apResponse = await fetch(`${ACTIVEPIECES_URL}/api/v1/flows`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ACTIVEPIECES_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              displayName: name,
              trigger: {
                type: trigger,
                settings: trigger_config,
              },
              actions: actions,
            }),
          });

          if (apResponse.ok) {
            const apData = await apResponse.json();
            activepiecesFlowId = apData.id;
          }
        } catch (e) {
          console.warn('Activepieces integration not available:', e);
        }
      }

      // Generate webhook URL if trigger is webhook-based
      let webhookId: string | null = null;
      let webhookSecret: string | null = null;
      let webhookUrl: string | null = null;
      
      if (trigger.startsWith('webhook.') || trigger === 'webhook.webhook_received') {
        // Generate unique webhook ID (using crypto for better uniqueness)
        const crypto = await import('npm:crypto@^1.0.0');
        webhookId = crypto.randomBytes(16).toString('hex');
        webhookSecret = crypto.randomBytes(32).toString('hex');
        
        // Construct webhook URL
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        webhookUrl = `${supabaseUrl}/functions/v1/receive-webhook/${webhookId}`;
      }

      const { data: automation, error } = await supabase
        .from('automations')
        .insert({
          user_id: user.id,
          name,
          description: description || name,
          trigger_type: trigger,
          trigger_config,
          schedule: schedule || null,
          conditions: conditions || [],
          filters: filters || [],
          actions,
          required_auth,
          status: 'active',
          activepieces_flow_id: activepiecesFlowId,
          webhook_id: webhookId,
          webhook_secret: webhookSecret,
          webhook_url: webhookUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ automation }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'PUT') {
      const automationId = url.searchParams.get('id');
      const body = await req.json();
      
      if (!automationId) {
        return new Response(
          JSON.stringify({ error: 'Automation ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // If only status update (pause/resume)
      if (body.status && !body.trigger) {
        const { data: automation, error } = await supabase
          .from('automations')
          .update({ status: body.status })
          .eq('id', automationId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ automation }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Full update (regenerate/edit)
      const { name, description, trigger, trigger_config, actions, required_auth } = body;

      if (!name || !trigger || !actions || !required_auth) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate connections
      const { data: connections, error: connError } = await supabase
        .from('connections')
        .select('service_name')
        .eq('user_id', user.id)
        .in('service_name', required_auth);

      if (connError) throw connError;

      const connectedServices = connections.map(c => c.service_name);
      const missingConnections = required_auth.filter(
        (service: string) => !connectedServices.includes(service)
      );

      if (missingConnections.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required connections',
            missing_connections: missingConnections 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update Activepieces workflow if exists
      const { data: existingAutomation } = await supabase
        .from('automations')
        .select('activepieces_flow_id, webhook_id, webhook_url')
        .eq('id', automationId)
        .eq('user_id', user.id)
        .single();

      let activepiecesFlowId = existingAutomation?.activepieces_flow_id || null;
      
      // Handle webhook URL generation/update
      let webhookId: string | null = existingAutomation?.webhook_id || null;
      let webhookSecret: string | null = null;
      let webhookUrl: string | null = existingAutomation?.webhook_url || null;
      
      // If trigger changed to webhook or is webhook, generate URL
      if ((trigger.startsWith('webhook.') || trigger === 'webhook.webhook_received') && !webhookId) {
        const crypto = await import('npm:crypto@^1.0.0');
        webhookId = crypto.randomBytes(16).toString('hex');
        webhookSecret = crypto.randomBytes(32).toString('hex');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        webhookUrl = `${supabaseUrl}/functions/v1/receive-webhook/${webhookId}`;
      }
      
      // If trigger changed away from webhook, clear webhook fields
      if (!trigger.startsWith('webhook.') && trigger !== 'webhook.webhook_received' && webhookId) {
        webhookId = null;
        webhookSecret = null;
        webhookUrl = null;
      }
      
      if (ACTIVEPIECES_URL && ACTIVEPIECES_API_KEY && activepiecesFlowId) {
        try {
          // Update existing flow
          const apResponse = await fetch(`${ACTIVEPIECES_URL}/api/v1/flows/${activepiecesFlowId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${ACTIVEPIECES_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              displayName: name,
              trigger: {
                type: trigger,
                settings: trigger_config,
              },
              actions: actions,
            }),
          });

          if (!apResponse.ok) {
            // If update fails, try creating new flow
            const createResponse = await fetch(`${ACTIVEPIECES_URL}/api/v1/flows`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${ACTIVEPIECES_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                displayName: name,
                trigger: {
                  type: trigger,
                  settings: trigger_config,
                },
                actions: actions,
              }),
            });

            if (createResponse.ok) {
              const apData = await createResponse.json();
              activepiecesFlowId = apData.id;
            }
          }
        } catch (e) {
          console.warn('Activepieces update failed:', e);
        }
      }

      const updatePayload: any = {
        name,
        description: description || name,
        trigger_type: trigger,
        trigger_config,
        actions,
        required_auth,
        activepieces_flow_id: activepiecesFlowId,
      };
      
      // Update webhook fields if changed
      if (webhookId !== null) {
        updatePayload.webhook_id = webhookId;
        updatePayload.webhook_url = webhookUrl;
        if (webhookSecret) {
          updatePayload.webhook_secret = webhookSecret;
        }
      } else if (webhookId === null && existingAutomation?.webhook_id) {
        // Clear webhook fields if trigger changed away from webhook
        updatePayload.webhook_id = null;
        updatePayload.webhook_secret = null;
        updatePayload.webhook_url = null;
      }

      const { data: automation, error } = await supabase
        .from('automations')
        .update(updatePayload)
        .eq('id', automationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ automation }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'DELETE') {
      const automationId = url.searchParams.get('id');
      
      if (!automationId) {
        return new Response(
          JSON.stringify({ error: 'Automation ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in manage-automations:', error);
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