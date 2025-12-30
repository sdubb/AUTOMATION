import { useState, useEffect } from 'react';
import { Link2, Plus, Trash2, Loader2, CheckCircle2, XCircle, RefreshCw, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { getApiKeyInstructions } from '../lib/groq';

interface Connection {
  id: string;
  service_name: string;
  auth_type: string;
  status: string;
  created_at: string;
  expires_at?: string | null;
}

export function ConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
    
    // Auto-check for expiring connections every 5 minutes
    const interval = setInterval(() => {
      loadConnections();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadConnections = async () => {
    try {
      const data = await backendService.connections.list();
      const connections = Array.isArray(data) ? data : data.connections || [];
      setConnections(connections);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await backendService.connections.delete(id);
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete connection:', err);
      alert('Failed to delete connection');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      await backendService.connections.test(id);
      alert('Connection is valid! ✅');
      loadConnections();
    } catch (err) {
      console.error('Failed to test connection:', err);
      alert('Connection validation failed. Please try again.');
    }
  };

  const handleAutoRefreshToken = async (id: string) => {
    setRefreshingId(id);
    try {
      await backendService.connections.update(id, { action: 'refresh' });
      loadConnections();
      alert('Token refreshed successfully! ✅');
    } catch (err) {
      console.error('Failed to refresh token:', err);
      alert('Failed to refresh token. Please reconnect.');
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Connections</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>Add Connection</span>
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12">
          <Link2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No connections yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add connections to start creating automations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => {
            const isExpired = conn.expires_at && new Date(conn.expires_at) < new Date();
            const isActive = conn.status === 'active' && !isExpired;
            const isExpiring = conn.expires_at && 
              new Date(conn.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
            const daysUntilExpiry = conn.expires_at 
              ? Math.floor((new Date(conn.expires_at).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
              : null;

            return (
              <div
                key={conn.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition ${
                  isExpired
                    ? 'border-red-200 bg-red-50/30'
                    : isExpiring
                    ? 'border-yellow-200 bg-yellow-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-green-100' : isExpired ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : isExpired ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 capitalize">
                        {conn.service_name.replace(/_/g, ' ')}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : isExpired
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {conn.auth_type === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
                      {conn.expires_at && (
                        <span className={`ml-2 font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-slate-600'}`}>
                          • Expires: {new Date(conn.expires_at).toLocaleDateString()}
                          {daysUntilExpiry !== null && isExpiring && !isExpired && (
                            <span className="text-yellow-600"> ({daysUntilExpiry} days left)</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpired && (
                    <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Action Required
                    </div>
                  )}
                  {isExpiring && !isExpired && (
                    <button
                      onClick={() => handleAutoRefreshToken(conn.id)}
                      disabled={refreshingId === conn.id}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition flex items-center gap-1"
                      title="Auto-refresh token"
                    >
                      {refreshingId === conn.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(conn.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Test connection"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {((conn as any).mutable === true) && (
                    <button
                      onClick={() => handleDeleteConnection(conn.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete connection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddForm && (
        <AddConnectionForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadConnections();
          }}
        />
      )}
    </div>
  );
}

function AddConnectionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpText, setHelpText] = useState('');

  const services = [
    // Communication
    'slack', 'microsoft_teams', 'discord', 'telegram', 'twilio', 'sendgrid', 'mailchimp', 'gmail',
    // E-commerce & Payments
    'stripe', 'paypal', 'shopify', 'woocommerce', 'bigcommerce', 'square', 'gumroad',
    // Productivity & Management
    'google_sheets', 'notion', 'airtable', 'monday', 'asana', 'jira', 'trello', 'clickup', 'todoist',
    // CRM & Sales
    'hubspot', 'salesforce', 'pipedrive', 'zoho_crm', 'freshsales', 'copper',
    // Social Media & Marketing
    'twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'reddit',
    // Development & Code
    'github', 'gitlab', 'bitbucket', 'aws', 'heroku', 'digitalocean', 'vercel',
    // Cloud Storage
    'google_drive', 'dropbox', 'onedrive', 's3', 'box', 'nextcloud',
    // Analytics & Reporting
    'google_analytics', 'mixpanel', 'amplitude', 'segment', 'datadog',
    // Forms & Surveys
    'google_forms', 'typeform', 'jotform', 'formstack', 'getresponse',
    // Email & Calendar
    'outlook', 'microsoft_exchange', 'google_calendar', 'calendly',
    // Database & APIs
    'firebase', 'mongodb', 'postgresql', 'mysql', 'supabase', 'hasura',
    // HR & Finance
    'guidepoint', 'workday', 'bamboohr', 'namely', 'quickbooks', 'freshbooks',
    // Other Popular
    'zendesk', 'intercom', 'slack_bot', 'zapier', 'make', 'pabbly', 'n8n'
  ];

  // Service-specific field configurations
  const serviceConfigs: Record<string, { fields: Array<{ name: string; label: string; type: string; placeholder: string; optional?: boolean; helpText?: string }> }> = {
    slack: { fields: [{ name: 'api_key', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', helpText: 'Get from https://api.slack.com/apps' }] },
    stripe: { fields: [{ name: 'api_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', helpText: 'From Stripe Dashboard > Developers > API Keys' }] },
    github: { fields: [{ name: 'api_key', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...', helpText: 'Create at github.com/settings/tokens' }] },
    openai: { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-...', helpText: 'Get from https://platform.openai.com/api-keys' }, { name: 'org_id', label: 'Organization ID (optional)', type: 'text', placeholder: 'org-...', optional: true }] },
    airtable: { fields: [{ name: 'api_key', label: 'Personal Access Token', type: 'password', placeholder: 'pat...', helpText: 'Create at airtable.com/account/tokens' }] },
    notion: { fields: [{ name: 'api_key', label: 'Internal Integration Token', type: 'password', placeholder: 'secret_...', helpText: 'From notion.so/my-integrations' }] },
    hubspot: { fields: [{ name: 'api_key', label: 'Private App Access Token', type: 'password', placeholder: 'pat-na1-...', helpText: 'Create at app.hubspot.com/l/private-apps' }] },
    shopify: { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'shppa_...', helpText: 'From Shopify Admin > Settings > Apps and integrations' }, { name: 'store_url', label: 'Store URL', type: 'text', placeholder: 'yourstore.myshopify.com', helpText: 'Your Shopify store domain' }] },
    mailchimp: { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx-us1', helpText: 'From Account > Extras > API Keys' }] },
    google_sheets: { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'AIzaSy...', helpText: 'From Google Cloud Console' }] },
    twilio: { fields: [{ name: 'account_sid', label: 'Account SID', type: 'password', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxx', helpText: 'From Twilio Console' }, { name: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'your_auth_token', helpText: 'From Twilio Console' }] },
    sendgrid: { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'SG.xxxxxxx...', helpText: 'From Settings > API Keys' }] },
    aws: { fields: [{ name: 'access_key_id', label: 'Access Key ID', type: 'password', placeholder: 'AKIA...', helpText: 'From AWS IAM' }, { name: 'secret_access_key', label: 'Secret Access Key', type: 'password', placeholder: 'aws_secret_access_key', helpText: 'From AWS IAM' }] },
  };

  const currentConfig = serviceConfigs[service] || { fields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your API key', helpText: 'Check the service documentation for how to get your API key' }] };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    setLoading(true);
    setValidating(true);

    try {
      await backendService.connections.create({
        name: service,
        appName: service,
        config: credentials,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add connection');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleCredentialChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleGetHelp = async () => {
    setHelpLoading(true);
    try {
      const instructions = await getApiKeyInstructions(service);
      setHelpText(instructions);
      setShowHelpModal(true);
    } catch (err) {
      console.error('Failed to get help:', err);
      setHelpText('Failed to load instructions. Please check the service documentation.');
      setShowHelpModal(true);
    } finally {
      setHelpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h3 className="text-2xl font-bold text-white">Add Connection</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Select Service
            </label>
            <select
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setCredentials({}); // Reset credentials when service changes
              }}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Choose a service...</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Fields */}
          {service && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Authentication Details</h4>
                <button
                  type="button"
                  onClick={handleGetHelp}
                  disabled={helpLoading}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  {helpLoading ? 'Loading...' : 'Get Help'}
                </button>
              </div>
              <div className="space-y-4">
                {currentConfig.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {field.label}
                      {field.optional && <span className="text-slate-500 text-xs ml-1">(optional)</span>}
                    </label>
                    <input
                      type={field.type}
                      value={credentials[field.name] || ''}
                      onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                      required={!field.optional}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder={field.placeholder}
                    />
                    {field.helpText && (
                      <p className="text-xs text-slate-600 mt-1">
                        💡 {field.helpText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validating && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating connection...</span>
            </div>
          )}
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="font-semibold mb-1">❌ Validation Failed</div>
              <div className="text-sm">{validationError}</div>
              <div className="text-xs mt-2 text-red-600">
                Please check your credentials and try again.
              </div>
            </div>
          )}
          {error && !validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || validating || !service}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                '✓ Add Connection'
              )}
            </button>
          </div>
        </form>

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">How to Get Your API Key</h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {helpText}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition"
                  >
                    Got it! Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
