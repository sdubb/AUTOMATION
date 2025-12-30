import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Connection validation functions
async function validateSlackConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.ok) {
      return { valid: true };
    } else {
      return { valid: false, error: data.error || 'Invalid Slack API key' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to validate Slack connection' };
  }
}

async function validateStripeConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid Stripe API key' };
    } else {
      return { valid: false, error: 'Failed to validate Stripe connection' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to validate Stripe connection' };
  }
}

async function validateGmailConnection(credentials: any): Promise<{ valid: boolean; error?: string }> {
  // For Gmail, we need OAuth token
  // If it's an API key, it's likely a service account key
  try {
    if (credentials.access_token) {
      // OAuth token
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: 'Invalid Gmail OAuth token' };
      }
    } else if (credentials.api_key) {
      // Service account - basic validation
      return { valid: true }; // Service accounts need more complex validation
    } else {
      return { valid: false, error: 'Invalid Gmail credentials format' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to validate Gmail connection' };
  }
}

async function validateGoogleSheetsConnection(credentials: any): Promise<{ valid: boolean; error?: string }> {
  // Similar to Gmail
  try {
    if (credentials.access_token) {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: 'Invalid Google Sheets OAuth token' };
      }
    } else if (credentials.api_key) {
      return { valid: true }; // Service account
    } else {
      return { valid: false, error: 'Invalid Google Sheets credentials format' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to validate Google Sheets connection' };
  }
}

async function validateConnection(serviceName: string, credentials: any): Promise<{ valid: boolean; error?: string }> {
  const apiKey = credentials.api_key || credentials.access_token;

  if (!apiKey) {
    return { valid: false, error: 'No API key or token provided' };
  }

  switch (serviceName.toLowerCase()) {
    case 'slack':
      return await validateSlackConnection(apiKey);
    
    case 'stripe':
      return await validateStripeConnection(apiKey);
    
    case 'gmail':
      return await validateGmailConnection(credentials);
    
    case 'google_sheets':
    case 'googlesheets':
      return await validateGoogleSheetsConnection(credentials);
    
    default:
      // For unknown services, we can't validate, so allow it
      return { valid: true };
  }
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
    const path = url.pathname;

    if (req.method === 'GET') {
      const { data: connections, error } = await supabase
        .from('connections')
        .select('id, service_name, auth_type, status, created_at, expires_at, metadata')
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ connections }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      const { service_name, auth_type, credentials, metadata, skip_validation } = await req.json();

      if (!service_name || !auth_type || !credentials) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate connection unless explicitly skipped
      if (!skip_validation) {
        const validation = await validateConnection(service_name, credentials);
        
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: validation.error || 'Connection validation failed',
              validation_error: validation.error 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      const { data: connection, error } = await supabase
        .from('connections')
        .upsert({
          user_id: user.id,
          service_name,
          auth_type,
          credentials,
          metadata: metadata || {},
          status: 'active',
        }, {
          onConflict: 'user_id,service_name',
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ connection }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'PUT') {
      // Test/validate existing connection
      const connectionId = url.searchParams.get('id');
      const { action } = await req.json();

      if (!connectionId) {
        return new Response(
          JSON.stringify({ error: 'Connection ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'test') {
        // Get connection
        const { data: connection, error: connError } = await supabase
          .from('connections')
          .select('*')
          .eq('id', connectionId)
          .eq('user_id', user.id)
          .single();

        if (connError || !connection) {
          return new Response(
            JSON.stringify({ error: 'Connection not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate connection
        const validation = await validateConnection(connection.service_name, connection.credentials);
        
        // Update status based on validation
        const newStatus = validation.valid ? 'active' : 'expired';
        
        const { data: updatedConnection, error: updateError } = await supabase
          .from('connections')
          .update({ status: newStatus })
          .eq('id', connectionId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ 
            valid: validation.valid,
            error: validation.error,
            connection: updatedConnection 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'refresh') {
        // Get connection
        const { data: connection, error: connError } = await supabase
          .from('connections')
          .select('*')
          .eq('id', connectionId)
          .eq('user_id', user.id)
          .single();

        if (connError || !connection) {
          return new Response(
            JSON.stringify({ error: 'Connection not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Only OAuth2 connections can be refreshed
        if (connection.auth_type !== 'oauth2') {
          return new Response(
            JSON.stringify({ error: 'Only OAuth2 connections can be refreshed. Please reconnect manually.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // For OAuth2, we would typically use a refresh token to get a new access token
        // Since we don't store refresh tokens in this implementation, we'll validate the current token
        // In a production system, you'd implement proper OAuth2 refresh flow
        const validation = await validateConnection(connection.service_name, connection.credentials);
        
        if (validation.valid) {
          // Token is still valid, update expires_at if provided
          const updateData: any = { status: 'active' };
          if (validation.expires_at) {
            updateData.expires_at = validation.expires_at;
          }
          
          const { data: updatedConnection, error: updateError } = await supabase
            .from('connections')
            .update(updateData)
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Token is still valid',
              connection: updatedConnection 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          // Token expired, user needs to reconnect
          const { error: updateError } = await supabase
            .from('connections')
            .update({ status: 'expired' })
            .eq('id', connectionId)
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Token has expired. Please reconnect the service.',
              requires_reconnect: true
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'DELETE') {
      const connectionId = url.searchParams.get('id');
      
      if (!connectionId) {
        return new Response(
          JSON.stringify({ error: 'Connection ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)
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
    console.error('Error in manage-connections:', error);
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