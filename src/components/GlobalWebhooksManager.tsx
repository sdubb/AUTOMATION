import { useState, useEffect } from 'react';
import { Copy, Trash2, TestTube, Loader, AlertCircle } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { EmptyState } from './EmptyState';

interface Webhook {
  id: string;
  name: string;
  url: string;
  workflow_id?: string;
  workflow_name?: string;
  created_at: string;
  last_triggered?: string;
  status: 'active' | 'inactive' | 'error';
}

export function GlobalWebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await backendService.webhooks.list();
      setWebhooks(data || []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDelivery = async (webhookId: string) => {
    setTestingId(webhookId);
    try {
      await backendService.webhooks.testDelivery(webhookId);
      addToast('Webhook test delivered successfully!', 'success');
    } catch (err) {
      addToast(`Failed to send test webhook: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    setDeletingId(webhookId);
    try {
      await backendService.webhooks.delete(webhookId);
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
      addToast('Webhook deleted successfully', 'success');
    } catch (err) {
      addToast(`Failed to delete webhook: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('Webhook URL copied to clipboard!', 'success');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            Inactive
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="font-medium text-red-900">Error Loading Webhooks</h3>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={loadWebhooks}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Active Webhooks</h3>
          <p className="text-sm text-gray-600 mt-1">
            {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={loadWebhooks}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <EmptyState
          icon="ExternalLink"
          title="No Webhooks Configured"
          description="Webhooks allow external services to trigger your automations. Create webhooks from individual automation workflows."
          action={{
            label: 'Learn More',
            onClick: () => {
              addToast('Create webhooks from the Automations tab by selecting an automation and clicking "Webhooks"', 'info');
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{webhook.name}</h4>
                    {getStatusBadge(webhook.status)}
                  </div>

                  {webhook.workflow_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      Workflow: <span className="font-medium">{webhook.workflow_name}</span>
                    </p>
                  )}

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 break-all">
                        {webhook.url}
                      </code>
                      <button
                        onClick={() => handleCopyUrl(webhook.url)}
                        className="p-2 hover:bg-gray-100 rounded transition"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {formatDate(webhook.created_at)}</span>
                    {webhook.last_triggered && (
                      <span>Last triggered: {formatDate(webhook.last_triggered)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleTestDelivery(webhook.id)}
                    disabled={testingId === webhook.id}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition text-sm"
                    title="Send test webhook"
                  >
                    {testingId === webhook.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Test
                  </button>

                  <button
                    onClick={() => handleDelete(webhook.id)}
                    disabled={deletingId === webhook.id}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition text-sm"
                    title="Delete webhook"
                  >
                    {deletingId === webhook.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How to create webhooks</h4>
        <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
          <li>Go to the Automations tab and select an automation</li>
          <li>Click on the "Webhooks" section in the automation details</li>
          <li>Create a new webhook with a descriptive name</li>
          <li>Copy the generated URL to your external service</li>
          <li>Test the webhook to ensure it's working</li>
        </ol>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}