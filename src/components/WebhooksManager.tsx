import React, { useState } from 'react';
import { useWebhooks } from '@/hooks/useActivepieces';
import { Copy, Trash2, Plus, Loader } from 'lucide-react';

interface WebhooksManagerProps {
  workflowId: string | null;
}

export function WebhooksManager({ workflowId }: WebhooksManagerProps) {
  const { webhooks, loading, error, createWebhook, deleteWebhook } = useWebhooks(workflowId);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newWebhookName) return;
    setCreating(true);
    try {
      await createWebhook(newWebhookName);
      setNewWebhookName('');
    } catch (err) {
      console.error('Failed to create webhook:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!workflowId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">Select a workflow to manage webhooks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Webhook name (e.g., Form Submission)"
          value={newWebhookName}
          onChange={(e) => setNewWebhookName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newWebhookName}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !webhooks.length ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
          No webhooks yet. Create one to trigger your workflow.
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook) => (
            <WebhookItem key={webhook.id} webhook={webhook} workflowId={workflowId!} onDelete={deleteWebhook} />
          ))}
        </div>
      )}
    </div>
  );
}

interface WebhookItemProps {
  webhook: any;
  workflowId: string;
  onDelete: (id: string) => Promise<void>;
}

function WebhookItem({ webhook, onDelete }: WebhookItemProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const webhookUrl = `${window.location.origin}/webhooks/${webhook.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this webhook?')) {
      setDeleting(true);
      try {
        await onDelete(webhook.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{webhook.displayName}</h3>
          <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs text-gray-700 break-all">
            {webhookUrl}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-200 rounded text-gray-600 transition"
            title="Copy webhook URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 hover:bg-red-100 rounded text-red-600 transition disabled:opacity-50"
            title="Delete webhook"
          >
            {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
