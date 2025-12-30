import { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { backendService } from '../lib/backendService';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  schedule?: string | null;
  status: string;
  actions: Array<{
    service: string;
    action: string;
    config?: Record<string, unknown>;
  }>;
  required_auth: string[];
  conditions?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  filters?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface EditAutomationModalProps {
  automation: Automation;
  onClose: () => void;
  onSuccess: () => void;
}

function formatServiceName(service: string): string {
  const serviceMap: Record<string, string> = {
    // Google Services
    google_sheets: 'Google Sheets',
    google_drive: 'Google Drive',
    google_gmail: 'Gmail',
    google_calendar: 'Google Calendar',
    google_forms: 'Google Forms',
    
    // Microsoft Services
    microsoft_teams: 'Microsoft Teams',
    microsoft_excel: 'Microsoft Excel',
    microsoft_outlook: 'Microsoft Outlook',
    microsoft_sharepoint: 'Microsoft SharePoint',
    microsoft_one_drive: 'OneDrive',
    
    // Communication
    slack: 'Slack',
    discord: 'Discord',
    telegram: 'Telegram',
    twilio: 'Twilio',
    sendgrid: 'SendGrid',
    mailchimp: 'Mailchimp',
    
    // Project Management
    asana: 'Asana',
    monday: 'Monday.com',
    jira: 'Jira',
    trello: 'Trello',
    clickup: 'ClickUp',
    
    // CRM
    salesforce: 'Salesforce',
    hubspot: 'HubSpot',
    pipedrive: 'Pipedrive',
    zendesk: 'Zendesk',
    
    // Analytics & Data
    google_analytics: 'Google Analytics',
    mixpanel: 'Mixpanel',
    amplitude: 'Amplitude',
    segment: 'Segment',
    
    // Cloud Storage
    dropbox: 'Dropbox',
    box: 'Box',
    aws_s3: 'AWS S3',
    azure_blob: 'Azure Blob Storage',
    
    // Databases
    airtable: 'Airtable',
    notion: 'Notion',
    mongodb: 'MongoDB',
    supabase: 'Supabase',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    
    // E-commerce
    shopify: 'Shopify',
    stripe: 'Stripe',
    square: 'Square',
    paypal: 'PayPal',
    woocommerce: 'WooCommerce',
    
    // Social Media
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    
    // Code & DevOps
    github: 'GitHub',
    gitlab: 'GitLab',
    bitbucket: 'Bitbucket',
    docker: 'Docker',
    jenkins: 'Jenkins',
    
    // APIs & Webhooks
    zapier: 'Zapier',
    ifttt: 'IFTTT',
    webhook: 'Webhook',
    rest_api: 'REST API',
    graphql_api: 'GraphQL API',
  };
  
  if (serviceMap[service.toLowerCase()]) {
    return serviceMap[service.toLowerCase()];
  }
  
  // Fallback: capitalize words separated by underscores
  return service
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function EditAutomationModal({ automation, onClose, onSuccess }: EditAutomationModalProps) {
  const [editMode, setEditMode] = useState<'language' | 'ui'>('language');
  const [showComparison, setShowComparison] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPlan, setNewPlan] = useState<any>(null);

  // UI-based editing state
  const [uiChanges, setUiChanges] = useState({
    schedule: automation.schedule || null,
    frequency: automation.schedule?.split('_')[0] || 'event-based',
    primaryService: automation.actions[0]?.service || '',
  });

  const handleLanguageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewPlan(null);
    setLoading(true);

    try {
      // Context-aware prompt for editing
      const currentActions = automation.actions.map(a => `${formatServiceName(a.service)}: ${a.action}`).join(', ');
      const contextPrompt = `
Current automation setup:
- Trigger: ${automation.trigger_type}
- Actions: ${currentActions}
- Schedule: ${automation.schedule || 'Event-based'}
- Status: ${automation.status}

User's requested change: "${editPrompt}"

Generate the updated automation plan that incorporates this change. Keep the abstraction simple and user-friendly.`;

      const newAutomationPlan = await backendService.groq.planAutomation(contextPrompt);

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setNewPlan(data);
      setShowComparison(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate automation');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!newPlan) return;

    setLoading(true);
    setError('');

    try {
      await backendService.automations.update(automation.id, {
        name: newPlan.name,
        description: editPrompt || automation.description,
        trigger: newPlan.trigger,
        triggerConfig: newPlan.trigger_config,
        actions: newPlan.actions,
      });
          schedule: newPlan.schedule || null,
          conditions: newPlan.conditions || [],
          filters: newPlan.filters || [],
          actions: newPlan.actions,
          required_auth: newPlan.required_auth,
        }),
      });

      const data = await response.json();

      if (data.error) {
        if (data.missing_connections) {
          setError(`Please connect these services first: ${data.missing_connections.join(', ')}`);
        } else {
          setError(data.error);
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Edit Automation</h3>
              <p className="text-sm text-slate-600 mt-1">Make changes in plain English or use quick toggles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Automation Info */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 mb-6 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current automation</p>
          <p className="text-slate-900 font-medium">{automation.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {automation.actions.map((action, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {formatServiceName(action.service)}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setEditMode('language')}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              editMode === 'language'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            ✨ Edit in Plain English
          </button>
          <button
            onClick={() => setEditMode('ui')}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              editMode === 'ui'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            ⚙️ Quick Settings
          </button>
        </div>

        {/* Language Edit Mode */}
        {editMode === 'language' && !showComparison && (
          <form onSubmit={handleLanguageEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe your change
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Examples: 'Change to email instead of Slack', 'Make it weekly', 'Add filters', 'Remove this condition', 'Send to Discord instead'"
                rows={4}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 You can say things like: "only alert on weekdays", "send daily reports at 9am", "change recipient", "simplify this"
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !editPrompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your change...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Show me the new plan
                </>
              )}
            </button>
          </form>
        )}

        {/* Comparison View (Before/After) */}
        {editMode === 'language' && showComparison && newPlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-900 mb-3">Before</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Name</span>
                    <p className="text-slate-900 mt-1">{automation.name}</p>
                  </div>
                  {automation.schedule && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Schedule</span>
                      <p className="text-slate-900 mt-1">🕐 {automation.schedule}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Actions</span>
                    <div className="mt-1 space-y-1">
                      {automation.actions.map((action, idx) => (
                        <p key={idx} className="text-slate-900">
                          → {formatServiceName(action.service)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-slate-900 mb-3">After ✨</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Name</span>
                    <p className="text-slate-900 mt-1">{newPlan.name}</p>
                  </div>
                  {newPlan.schedule && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Schedule</span>
                      <p className="text-slate-900 mt-1">🕐 {newPlan.schedule}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Actions</span>
                    <div className="mt-1 space-y-1">
                      {newPlan.actions.map((action: any, idx: number) => (
                        <p key={idx} className="text-slate-900">
                          → {formatServiceName(action.service)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900 mb-2">Your change:</p>
              <p className="text-sm text-slate-700 italic">"{editPrompt}"</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowComparison(false);
                  setNewPlan(null);
                  setEditPrompt('');
                }}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Apply changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* UI Edit Mode - Bounded Controls */}
        {editMode === 'ui' && (
          <div className="space-y-6">
            {/* Frequency Control */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                When should this run?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['event-based', 'hourly', 'daily', 'weekly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setUiChanges({ ...uiChanges, frequency: freq, schedule: freq === 'event-based' ? null : freq })}
                    className={`px-4 py-3 rounded-lg font-medium transition border-2 ${
                      uiChanges.frequency === freq
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {freq === 'event-based' ? '🔔 Event' : freq === 'hourly' ? '⏰ Hourly' : freq === 'daily' ? '📅 Daily' : '📆 Weekly'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Choose how often this automation runs</p>
            </div>

            {/* Status Control */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Status</label>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-3 border-2 border-green-600 bg-green-50 text-green-700 rounded-lg font-medium"
                >
                  ✅ Active
                </button>
                <button
                  className="flex-1 px-4 py-3 border-2 border-slate-300 bg-white text-slate-700 rounded-lg font-medium hover:border-slate-400"
                  disabled
                >
                  ⏸️ Paused
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Pause this automation to temporarily stop it</p>
            </div>

            {/* Actions Control */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Where should it send data?</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <select
                    value={uiChanges.primaryService}
                    onChange={(e) => setUiChanges({ ...uiChanges, primaryService: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Choose destination...</option>
                    {automation.actions.map((action) => (
                      <option key={action.service} value={action.service}>
                        {formatServiceName(action.service)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Tip: Use 'Edit in Plain English' to switch to a different service</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={handleLanguageEdit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

