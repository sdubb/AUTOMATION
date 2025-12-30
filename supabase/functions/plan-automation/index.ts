import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompt for automation planning
const AUTOMATION_SYSTEM_PROMPT = `You are an AI automation planner. Your ONLY job is to convert natural language automation requests into structured JSON for Activepieces (which has 500+ integrations).

You work with Activepieces integrations. Map natural language to Activepieces piece names and actions.

Common Activepieces pieces (examples, but you can use ANY of 500+):
- Communication: slack, discord, telegram, teams, twilio, sendgrid, mailchimp
- E-commerce: stripe, paypal, shopify, woocommerce, square, gumroad
- Productivity: notion, airtable, monday, asana, jira, trello, clickup, todoist
- CRM: hubspot, salesforce, pipedrive, zoho, freshsales
- Social: twitter, linkedin, instagram, facebook, tiktok, pinterest
- Dev: github, gitlab, aws, heroku, vercel, digitalocean
- Storage: google_drive, dropbox, onedrive, s3, box
- Database: firebase, mongodb, postgresql, mysql, supabase
- Analytics: google_analytics, mixpanel, amplitude, segment
- And 450+ more...

You MUST respond with ONLY valid JSON in this exact format:
{
  "name": "Short descriptive name",
  "description": "What this automation does",
  "trigger": "piece_name.trigger_name",
  "trigger_config": {},
  "schedule": null,
  "conditions": [],
  "filters": [],
  "actions": [
    {
      "service": "piece_name",
      "action": "action_name",
      "config": {}
    }
  ],
  "required_auth": ["piece1", "piece2"]
}

Fields:
- "schedule": null for event-based, or "daily_9am", "hourly", "weekly_monday", "cron:0 9 * * *"
- "conditions": [{"field": "amount", "operator": "greater_than", "value": "100"}] for if/then logic
- "filters": [{"field": "status", "operator": "equals", "value": "pending"}] for data filtering

RULES:
1. Map natural language to Activepieces piece names (use common service names)
2. Use Activepieces naming: piece_name.trigger_name or piece_name.action_name
3. Return ONLY JSON, no explanations or markdown
4. trigger format: "piece_name.trigger_name" (e.g., "stripe.payment_received", "gmail.new_email")
5. action format: service="piece_name", action="action_name" (e.g., "slack.send_message", "google_sheets.add_row")
6. Include ALL pieces in required_auth array
7. Be creative - Activepieces has 500+ integrations, so map user requests appropriately
8. SMART SCHEDULING: Parse "daily at 9am", "every monday", "hourly" from natural language
9. IF/THEN LOGIC: Parse "only if amount > 100" or "when status is pending" into conditions
10. DATA FILTERING: Parse "only new emails" or "only high priority" into filters
11. WEBHOOK TRIGGERS: Recognize "when I receive a webhook", "trigger on webhook", "listen for webhook events" → Use trigger: "webhook.webhook_received"
12. If truly impossible, return: {"error": "This automation requires integrations not available"}

Examples:
Input: "Notify Slack when Stripe payment arrives"
Output: {"name":"Stripe to Slack","trigger":"stripe.payment_received","trigger_config":{},"actions":[{"service":"slack","action":"send_message","config":{"channel":"#payments","message":"Payment: ${{amount}}"}}],"required_auth":["stripe","slack"]}`;

// System prompt for API key instructions
const API_KEY_SYSTEM_PROMPT = `You are a helpful guide for getting API keys. When asked about a specific service, provide clear, step-by-step instructions for obtaining their API key.

Be concise but thorough. Format with numbered steps. Include:
1. Where to go (exact URL if possible)
2. What to click/do
3. What credentials to copy
4. Any important notes

Keep it under 10 steps. Be practical and user-friendly.`;

const SYSTEM_PROMPT = AUTOMATION_SYSTEM_PROMPT;

const EXAMPLE_PROMPT = `
Input: "Post to Twitter when I publish a new blog post"
Output:
{
  "name": "Blog to Twitter automation",
  "trigger": "rss.new_item",
  "trigger_config": {
    "url": "{{blog_rss_feed}}"
  },
  "actions": [
    {
      "service": "twitter",
      "action": "create_tweet",
      "config": {
        "text": "New blog post: {{title}} {{link}}"
      }
    }
  ],
  "required_auth": ["twitter"]
}`;

interface PlanRequest {
  prompt: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const body: any = await req.json();
    const prompt = body.prompt || body.user_request || '';
    const isApiKeyHelp = body.type === 'api_key_help' || 
                        (body.user_request && (
                          body.user_request.toLowerCase().includes('api key') ||
                          body.user_request.toLowerCase().includes('credentials') ||
                          body.user_request.toLowerCase().includes('how to get') ||
                          body.user_request.toLowerCase().includes('obtain key')
                        ));

    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Choose appropriate system prompt based on request type
    const systemPrompt = isApiKeyHelp ? API_KEY_SYSTEM_PROMPT : AUTOMATION_SYSTEM_PROMPT;
    const temperature = isApiKeyHelp ? 0.7 : 0.1;
    const maxTokens = isApiKeyHelp ? 800 : 1000;

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${errorText}`);
    }

    const groqData: GroqResponse = await groqResponse.json();
    const content = groqData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Groq');
    }

    // For API key help, return as text; for automation planning, parse as JSON
    if (isApiKeyHelp) {
      return new Response(
        JSON.stringify({ 
          instructions: content,
          type: 'api_key_help'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For automation planning, parse JSON response
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(content.trim());
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Groq response as JSON');
      }
    }

    return new Response(
      JSON.stringify(parsedPlan),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in plan-automation:', error);
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