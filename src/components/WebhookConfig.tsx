import { useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, RefreshCw, Copy } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';

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
}

interface WebhookConfigProps {
  automationId: string;
  automationName: string;
  onSuccess: () => void;
}

export function WebhookConfig({ automationName, onSuccess }: WebhookConfigProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    url: '',
    method: 'POST',
    headers: {} as Record<string, string>,
    body_template: '{}',
    auth_type: 'none',
    retry_enabled: true,
    retry_max_attempts: 3,
    timeout_ms: 30000,
    secret: '',
  });

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const webhooks = await backendService.webhooks.list();
      setWebhooks(webhooks || []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        headers: { ...formData.headers, [headerKey]: headerValue },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url) {
      addToast('Please enter a webhook URL', 'error');
      return;
    }

    try {
      setLoading(true);
      await backendService.webhooks.create({
        name: `Webhook - ${automationName}`,
        url: formData.url,
        events: ['automation.executed'],
      });
      setFormData({
        url: '',
        method: 'POST',
        headers: {},
        body_template: '{}',
        auth_type: 'none',
        retry_enabled: true,
        retry_max_attempts: 3,
        timeout_ms: 30000,
        secret: '',
      });
      setShowForm(false);
      await loadWebhooks();
      addToast('Webhook created successfully!', 'success');
      onSuccess();
    } catch (err) {
      addToast(`Failed to create webhook: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Delete this webhook?')) return;

    try {
      await backendService.webhooks.delete(webhookId);
      await loadWebhooks();
      addToast('Webhook deleted successfully', 'success');
    } catch (err) {
      addToast(`Failed to delete webhook: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    try {
      await backendService.webhooks.testDelivery(webhook.id);
      addToast('Webhook test completed successfully!', 'success');
    } catch (err) {
      addToast(`Webhook test failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('Webhook URL copied to clipboard!', 'success');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Outbound Webhooks</h3>
        <button
          onClick={() => { setShowForm(!showForm); loadWebhooks(); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Webhook
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL *
              </label>
              <input
                type="url"
                placeholder="https://api.example.com/webhooks"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>POST</option>
                  <option>GET</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="60000"
                  value={formData.timeout_ms}
                  onChange={(e) => setFormData({ ...formData, timeout_ms: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Authentication */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Type
              </label>
              <select
                value={formData.auth_type}
                onChange={(e) => setFormData({ ...formData, auth_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="custom_header">Custom Header</option>
              </select>
            </div>

            {/* Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Headers
              </label>
              <div className="space-y-2 mb-3">
                {Object.entries(formData.headers).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm text-gray-700">
                      <strong>{key}</strong>: {value.substring(0, 30)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(key)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Header name (e.g., Authorization)"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Header value"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Retry Configuration */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.retry_enabled}
                  onChange={(e) => setFormData({ ...formData, retry_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Enable Automatic Retries</span>
              </label>
              {formData.retry_enabled && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.retry_max_attempts}
                    onChange={(e) => setFormData({ ...formData, retry_max_attempts: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Retries: 30s, 2min, 10min</p>
                </div>
              )}
            </div>

            {/* Secret for Signing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Secret for HMAC signature"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Webhook payload will be signed with X-Webhook-Signature-256 header
              </p>
            </div>

            {/* Body Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON Body Template
              </label>
              <textarea
                placeholder='{"message": "Automation completed", "status": "success"}'
                value={formData.body_template}
                onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Variables: {`{automation_id}, {automation_name}, {status}, {timestamp}`}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Create Webhook
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Webhooks List */}
      <div className="space-y-3">
        {loading && !showForm ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p>No webhooks configured yet</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                      {webhook.method}
                    </code>
                    <a href={webhook.url} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline text-sm truncate">
                      {webhook.url}
                    </a>
                    <button
                      onClick={() => handleCopyUrl(webhook.url)}
                      className="p-1 text-gray-600 hover:bg-gray-200 rounded transition"
                      title="Copy webhook URL"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Timeout: {webhook.timeout_ms}ms | Retries: {webhook.retry_max_attempts} attempts
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestWebhook(webhook)}
                    disabled={testingId === webhook.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Send test webhook"
                  >
                    {testingId === webhook.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
