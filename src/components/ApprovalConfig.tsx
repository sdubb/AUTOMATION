import { useState } from 'react';
import { Clock, Users, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { backendService } from '../lib/backendService';

interface ApprovalConfig {
  require_approval: boolean;
  approval_timeout_ms: number;
  approval_channels: string[];
  approval_recipients: string[];
  approval_instructions: string;
}

interface ApprovalConfigProps {
  automationId?: string;
  initialConfig: ApprovalConfig;
  onSave: (config: ApprovalConfig) => Promise<void>;
  disabled?: boolean;
}

export function ApprovalConfig({ automationId, initialConfig, onSave, disabled = false }: ApprovalConfigProps) {
  const [config, setConfig] = useState<ApprovalConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      if (automationId) {
        await backendService.automations.update(automationId, {
          requireApproval: config.require_approval,
          approvalTimeoutMs: config.approval_timeout_ms,
          approvalChannels: config.approval_channels,
          approvalRecipients: config.approval_recipients,
          approvalInstructions: config.approval_instructions,
        });
      }
      await onSave(config);
      alert('Approval settings saved! ✅');
    } catch (err) {
      console.error('Failed to save approval config:', err);
      alert('Failed to save approval settings');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeout = (ms: number) => {
    const minutes = ms / 60000;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60)}h`;
  };

  const addRecipient = () => {
    if (newRecipient && !config.approval_recipients.includes(newRecipient)) {
      setConfig({
        ...config,
        approval_recipients: [...config.approval_recipients, newRecipient],
      });
      setNewRecipient('');
    }
  };

  const removeRecipient = (recipient: string) => {
    setConfig({
      ...config,
      approval_recipients: config.approval_recipients.filter(r => r !== recipient),
    });
  };

  const toggleChannel = (channel: string) => {
    setConfig({
      ...config,
      approval_channels: config.approval_channels.includes(channel)
        ? config.approval_channels.filter(c => c !== channel)
        : [...config.approval_channels, channel],
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle size={24} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Human-in-the-Loop Approvals</h3>
      </div>

      {/* Enable/Disable */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Require Approval Before Execution</h4>
            <p className="text-sm text-gray-600">
              {config.require_approval
                ? 'Approvers must approve before automation runs'
                : 'Automation runs automatically without approval'}
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, require_approval: !config.require_approval })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              config.require_approval
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
            disabled={disabled}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                config.require_approval ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {config.require_approval && (
        <>
          {/* Approval Timeout */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock size={16} className="inline mr-2" />
              Approval Timeout
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Automation auto-executes if not approved within this time
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 900000, label: '15m' },
                { value: 1800000, label: '30m' },
                { value: 3600000, label: '1h' },
                { value: 7200000, label: '2h' },
                { value: 86400000, label: '24h' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, approval_timeout_ms: option.value })}
                  className={`px-3 py-2 rounded border transition ${
                    config.approval_timeout_ms === option.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={disabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                <strong>Current timeout:</strong> {formatTimeout(config.approval_timeout_ms)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                If approvers don't respond, automation will auto-execute
              </p>
            </div>
          </div>

          {/* Approval Channels */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <MessageSquare size={16} className="inline mr-2" />
              Notification Channels
            </label>
            <p className="text-xs text-gray-600 mb-3">
              How to notify approvers (coming soon: SMS)
            </p>
            <div className="space-y-2">
              {[
                { id: 'email', label: 'Email', description: 'Send approval request via email' },
                { id: 'slack', label: 'Slack', description: 'Send Slack message with approve/reject buttons' },
              ].map((channel) => (
                <label key={channel.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={config.approval_channels.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    className="w-4 h-4"
                    disabled={disabled}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{channel.label}</p>
                    <p className="text-xs text-gray-600">{channel.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {config.approval_channels.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Select at least one notification channel
              </div>
            )}
          </div>

          {/* Approval Recipients */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users size={16} className="inline mr-2" />
              Approval Recipients
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Who can approve this automation (email addresses or user IDs)
            </p>
            <div className="space-y-2 mb-3">
              {config.approval_recipients.length === 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  You (automation owner) will approve requests
                </div>
              ) : (
                config.approval_recipients.map((recipient) => (
                  <div
                    key={recipient}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200"
                  >
                    <span className="text-sm text-gray-700">{recipient}</span>
                    <button
                      onClick={() => removeRecipient(recipient)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="user@example.com or user_id"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={disabled}
              />
              <button
                onClick={addRecipient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                disabled={disabled || !newRecipient}
              >
                Add
              </button>
            </div>
          </div>

          {/* Approval Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions for Approvers
            </label>
            <p className="text-xs text-gray-600 mb-2">
              What should approvers know before approving? (optional)
            </p>
            <textarea
              value={config.approval_instructions || ''}
              onChange={(e) => setConfig({ ...config, approval_instructions: e.target.value })}
              placeholder="e.g., 'Please verify the data before approving. Check for any anomalies in the customer list.'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={3}
              disabled={disabled}
            />
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle2 size={18} />
              How It Works
            </h4>
            <ol className="text-sm text-blue-900 space-y-1 ml-6 list-decimal">
              <li>Automation triggers and prepares to execute</li>
              <li>Approval request created and sent to {config.approval_recipients.length > 0 ? 'selected approvers' : 'you'}</li>
              <li>Notification sent via {config.approval_channels.length > 0 ? config.approval_channels.join(' & ') : 'email'}</li>
              <li>Approver reviews trigger data and action preview</li>
              <li>Approver clicks Approve or Reject</li>
              <li>If approved: automation executes immediately</li>
              <li>If not approved within {formatTimeout(config.approval_timeout_ms)}: automation auto-executes</li>
              <li>Full audit trail created</li>
            </ol>
          </div>

          {/* Examples */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <h4 className="font-medium text-amber-900 mb-2">Good Use Cases for Approval</h4>
            <ul className="text-sm text-amber-900 space-y-1 ml-4 list-disc">
              <li>Sending emails to customers (verify content first)</li>
              <li>Posting to social media (review before publishing)</li>
              <li>Large financial transactions (confirm amounts)</li>
              <li>Deleting records (verify before removal)</li>
              <li>Bulk user operations (check for errors)</li>
            </ul>
          </div>
        </>
      )}

      {/* Save Button */}
      {config.require_approval && (
        <button
          onClick={handleSave}
          disabled={saving || disabled || config.approval_channels.length === 0}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {saving ? 'Saving...' : 'Save Approval Settings'}
        </button>
      )}
    </div>
  );
}
