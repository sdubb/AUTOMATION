import { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface WebhookTemplate {
  id: string;
  name: string;
  service: string;
  description: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body_template: string;
  auth_type: string;
  secret_instructions: string;
  setup_steps: string[];
  example_payload: Record<string, unknown>;
  field_mappings: Array<{
    field: string;
    description: string;
    example: string;
  }>;
}

const WEBHOOK_TEMPLATES: WebhookTemplate[] = [
  {
    id: 'github',
    name: '🐙 GitHub',
    service: 'github',
    description: 'Receive webhooks from GitHub push, pull request, and release events',
    url: 'https://your-domain.com/webhooks/github',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body_template: '{"event": "github_event", "repository": "{repository}", "branch": "{branch}"}',
    auth_type: 'custom_header',
    secret_instructions: '1. Go to Repository Settings → Webhooks → Add Webhook\n2. Paste your webhook URL\n3. Select "application/json" for Content Type\n4. Generate a secret in your automation settings\n5. Paste the secret in GitHub webhook settings',
    setup_steps: [
      'Navigate to your GitHub repository',
      'Go to Settings → Webhooks → Add Webhook',
      'Enter your webhook URL from this automation',
      'Select "application/json" content type',
      'Generate a secret (copy from your webhook config)',
      'Paste the secret in GitHub (same secret in both places)',
      'Select events to trigger on (push, pull_request, etc)',
      'Click Add Webhook to save',
    ],
    example_payload: {
      ref: 'refs/heads/main',
      before: '9049503b3c3f8c9f',
      after: '6113728f27ae82e36',
      repository: {
        id: 123456,
        name: 'my-repo',
        full_name: 'user/my-repo',
      },
      pusher: {
        name: 'user',
        email: 'user@example.com',
      },
      commits: [
        {
          id: '6113728f27ae82e36',
          message: 'Update README',
          author: { name: 'user', email: 'user@example.com' },
        },
      ],
    },
    field_mappings: [
      { field: 'repository.name', description: 'Repository name', example: 'my-repo' },
      { field: 'ref', description: 'Git branch reference', example: 'refs/heads/main' },
      { field: 'pusher.name', description: 'Who pushed the code', example: 'john' },
      { field: 'commits[0].message', description: 'Commit message', example: 'Update README' },
    ],
  },
  {
    id: 'stripe',
    name: '💳 Stripe',
    service: 'stripe',
    description: 'Process webhook events from Stripe (payments, subscriptions, charges)',
    url: 'https://your-domain.com/webhooks/stripe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body_template: '{"event_type": "{type}", "customer_id": "{customer}", "amount": "{amount}"}',
    auth_type: 'custom_header',
    secret_instructions: '1. Go to Stripe Dashboard → Webhooks\n2. Add Endpoint with your webhook URL\n3. Select events to receive (charge.succeeded, payment_intent.succeeded, etc)\n4. Copy the signing secret\n5. Paste it in your webhook configuration\n6. Stripe will sign requests with this secret',
    setup_steps: [
      'Go to Stripe Dashboard (dashboard.stripe.com)',
      'Navigate to Developers → Webhooks',
      'Click "Add Endpoint"',
      'Enter your webhook URL',
      'Select events: charge.succeeded, payment_intent.succeeded, customer.subscription.created',
      'Click "Add Endpoint"',
      'Copy the signing secret (Reveal secret)',
      'Paste secret in your webhook configuration',
    ],
    example_payload: {
      id: 'evt_1234567890',
      object: 'event',
      api_version: '2023-10-16',
      created: 1234567890,
      type: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_1234567890',
          object: 'charge',
          amount: 2000,
          currency: 'usd',
          customer: 'cus_1234567890',
          description: 'Order #12345',
          status: 'succeeded',
        },
      },
    },
    field_mappings: [
      { field: 'type', description: 'Event type', example: 'charge.succeeded' },
      { field: 'data.object.amount', description: 'Amount in cents', example: '2000' },
      { field: 'data.object.currency', description: 'Currency code', example: 'usd' },
      { field: 'data.object.customer', description: 'Customer ID', example: 'cus_1234567890' },
    ],
  },
  {
    id: 'shopify',
    name: '🛒 Shopify',
    service: 'shopify',
    description: 'Receive webhooks from Shopify store events (orders, payments, shipments)',
    url: 'https://your-domain.com/webhooks/shopify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body_template: '{"shop": "{shop}", "order_id": "{order_id}", "total": "{total}"}',
    auth_type: 'custom_header',
    secret_instructions: '1. Go to your Shopify Admin → Settings → Webhooks\n2. Create Webhook with your URL\n3. Select topics (orders/create, payments/capture, etc)\n4. Copy API credentials\n5. Paste them in your webhook configuration',
    setup_steps: [
      'Log in to your Shopify Admin',
      'Go to Settings → Notifications (or Webhooks)',
      'Scroll to Webhooks section',
      'Click "Create Webhook"',
      'Select event (e.g., Orders → Order created)',
      'Paste your webhook URL',
      'Format: JSON',
      'Add webhook and note the API key/credentials',
    ],
    example_payload: {
      id: 12345678901234,
      email: 'customer@example.com',
      created_at: '2024-01-15T10:30:00-05:00',
      updated_at: '2024-01-15T10:30:00-05:00',
      number: 1001,
      note: 'Customer notes',
      token: 'abc123def456',
      gateway: 'bogus',
      test: false,
      total_price: '99.99',
      currency: 'USD',
      customer: {
        id: 99887766,
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      line_items: [
        {
          id: 12345,
          title: 'Product Name',
          quantity: 1,
          price: '99.99',
        },
      ],
    },
    field_mappings: [
      { field: 'id', description: 'Order ID', example: '12345678901234' },
      { field: 'number', description: 'Order number', example: '1001' },
      { field: 'total_price', description: 'Total order amount', example: '99.99' },
      { field: 'customer.email', description: 'Customer email', example: 'john@example.com' },
    ],
  },
  {
    id: 'slack_webhook',
    name: '💬 Slack (Incoming Webhook)',
    service: 'slack',
    description: 'Send automation results to Slack channels as webhooks',
    url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body_template: '{"text": "Automation completed: {automation_name}", "blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": "*Status:* {status}"}}]}',
    auth_type: 'none',
    secret_instructions: '1. Go to Slack App Directory → Incoming Webhooks\n2. Click "Add to Slack"\n3. Select channel for webhook posts\n4. Copy the Webhook URL\n5. Paste into your webhook URL field',
    setup_steps: [
      'Go to Slack App Directory (api.slack.com/apps)',
      'Create New App → From scratch',
      'Give it a name (e.g., "Automation Notifications")',
      'Go to "Incoming Webhooks"',
      'Toggle "Activate Incoming Webhooks" ON',
      'Click "Add New Webhook to Workspace"',
      'Select channel to post to',
      'Click "Allow"',
      'Copy the Webhook URL',
      'Paste into your webhook configuration',
    ],
    example_payload: {
      text: 'Automation completed: Send Daily Report',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Automation:* Send Daily Report\n*Status:* ✅ Success\n*Time:* 2024-01-15 10:30 AM',
          },
        },
      ],
    },
    field_mappings: [
      { field: 'text', description: 'Message text', example: 'Automation completed' },
      { field: 'blocks[0].text.text', description: 'Rich formatted message', example: '*Bold* text' },
    ],
  },
  {
    id: 'custom_api',
    name: '🔌 Custom API',
    service: 'custom_api',
    description: 'Send webhook to any custom REST API endpoint',
    url: 'https://api.yoursystem.com/automations/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your_api_key_here',
    },
    body_template: '{"automation_id": "{automation_id}", "automation_name": "{automation_name}", "status": "{status}", "timestamp": "{timestamp}", "data": {}}',
    auth_type: 'bearer',
    secret_instructions: '1. Determine your API\'s webhook URL\n2. Get your API key/token from your system\n3. Set authentication type to Bearer Token\n4. Paste your API key in the Authorization header\n5. Customize the JSON body template with your fields',
    setup_steps: [
      'Identify your API endpoint that accepts webhooks',
      'Determine authentication method (Bearer, Basic, API Key)',
      'Get your API credentials from your system',
      'Create Bearer token if required',
      'Customize the body template to match your API',
      'Add any custom headers your API requires',
      'Test the webhook with a test payload',
      'Monitor webhook logs for successful delivery',
    ],
    example_payload: {
      automation_id: 'auto_abc123',
      automation_name: 'Send Daily Report',
      status: 'success',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        records_processed: 150,
        errors: 0,
        duration_ms: 3420,
      },
    },
    field_mappings: [
      { field: 'automation_id', description: 'Unique automation identifier', example: 'auto_abc123' },
      { field: 'automation_name', description: 'Automation display name', example: 'Send Daily Report' },
      { field: 'status', description: 'Execution status', example: 'success' },
      { field: 'data', description: 'Custom automation results', example: '{}' },
    ],
  },
];

interface WebhookTemplatesProps {
  onSelectTemplate: (template: WebhookTemplate) => void;
}

export function WebhookTemplates({ onSelectTemplate }: WebhookTemplatesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTemplate = (template: WebhookTemplate) => {
    const text = `URL: ${template.url}\nMethod: ${template.method}\nHeaders: ${JSON.stringify(template.headers)}\nBody: ${template.body_template}`;
    navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Webhook Templates</h3>
      <p className="text-sm text-gray-600 mb-6">
        Select a template to quickly configure webhooks for popular services. Each template includes setup instructions and field mappings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WEBHOOK_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
          >
            <button
              onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
              className="w-full p-4 hover:bg-gray-50 transition text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                {expandedId === template.id ? (
                  <ChevronUp size={18} className="text-gray-600 flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-600 flex-shrink-0" />
                )}
              </div>
            </button>

            {expandedId === template.id && (
              <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                {/* Setup Steps */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Setup Steps:</h5>
                  <ol className="space-y-1">
                    {template.setup_steps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        <strong>{idx + 1}.</strong> {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* URL Preview */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Webhook URL:</h5>
                  <div className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-auto font-mono">
                    {template.url}
                  </div>
                </div>

                {/* Example Payload */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Example Payload:</h5>
                  <pre className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(template.example_payload, null, 2)}
                  </pre>
                </div>

                {/* Field Mappings */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Field Mappings:</h5>
                  <div className="space-y-2">
                    {template.field_mappings.map((mapping, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                        <p className="text-xs font-mono text-blue-600 mb-1">{mapping.field}</p>
                        <p className="text-xs text-gray-700 mb-1">{mapping.description}</p>
                        <code className="text-xs text-gray-600">Example: {mapping.example}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => copyTemplate(template)}
                    className="flex items-center gap-2 flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Config
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> You can customize any template by modifying the URL, headers, and body after selection. 
          Always test with the "Send Test" button before deploying to production.
        </p>
      </div>
    </div>
  );
}
