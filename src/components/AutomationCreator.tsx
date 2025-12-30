import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { AutomationTemplates, Template } from './AutomationTemplates';

// Helper functions for plain English formatting (reused from dashboard)
function formatServiceName(service: string): string {
  const serviceMap: Record<string, string> = {
    google_sheets: 'Google Sheets',
    google_drive: 'Google Drive',
    microsoft_teams: 'Microsoft Teams',
  };
  
  if (serviceMap[service]) {
    return serviceMap[service];
  }
  
  return service
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTrigger(triggerType: string): string {
  const parts = triggerType.split('.');
  const service = parts[0];
  const event = parts[1]?.replace(/_/g, ' ') || '';
  
  const serviceName = formatServiceName(service);
  let eventName = event;
  if (!eventName.startsWith('a ') && !eventName.startsWith('an ')) {
    eventName = `a ${eventName}`;
  }
  
  return `${eventName} in ${serviceName}`;
}

function formatAction(action: { service: string; action: string }): string {
  const serviceName = formatServiceName(action.service);
  let actionName = action.action.replace(/_/g, ' ');
  
  const actionMap: Record<string, string> = {
    'send message': 'send a message',
    'send dm': 'send a direct message',
    'send email': 'send an email',
    'add row': 'add a row',
    'update row': 'update a row',
    'create contact': 'create a contact',
    'add subscriber': 'add a subscriber',
    'create ticket': 'create a ticket',
    'post': 'make a POST request',
    'get': 'make a GET request',
  };
  
  actionName = actionMap[actionName] || actionName;
  return `${actionName} in ${serviceName}`;
}

interface AutomationPlan {
  name: string;
  description?: string;
  trigger: string;
  trigger_config: Record<string, unknown>;
  schedule?: string | null;
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
  actions: Array<{
    service: string;
    action: string;
    config: Record<string, unknown>;
  }>;
  required_auth: string[];
  error?: string;
}

interface AutomationCreatorProps {
  onAutomationCreated: () => void;
}

export function AutomationCreator({ onAutomationCreated }: AutomationCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AutomationPlan | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handlePlanAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPlan(null);
    setSuccess(false);
    setLoading(true);

    try {
      const planData = await backendService.groq.planAutomation(prompt);
      setPlan(planData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to plan automation');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateAutomation = async () => {
    if (!plan) return;

    setError('');
    setLoading(true);

    try {
      const automationData = {
        name: plan.name,
        trigger: plan.trigger,
        triggerConfig: plan.trigger_config || {},
        actions: plan.actions,
      };

      await backendService.automations.create(automationData);

      setSuccess(true);
      setPrompt('');
      setPlan(null);
      setTimeout(() => {
        setSuccess(false);
        onAutomationCreated();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create automation');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setPrompt(template.prompt);
    setShowTemplates(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
      {/* Template Modal */}
      {showTemplates && (
        <AutomationTemplates
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">Create Automation</h2>
        </div>
      </div>

      <form onSubmit={handlePlanAutomation} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
            What do you want to automate?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Notify me on Slack when I get a Stripe payment"
            rows={3}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm sm:text-base"
          />
        </div>

        {!plan && (
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  Plan Automation
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="w-full border-2 border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
              View Templates
            </button>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">Automation created successfully!</span>
        </div>
      )}

      {plan && !success && (
        <div className="mt-6 border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-white space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-600">Review your automation plan below</p>
            </div>
          </div>

          {/* Plain English Workflow Preview */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-700">1</span>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">When</span>
                <p className="text-slate-900 mt-1 font-medium">
                  {formatTrigger(plan.trigger)}
                </p>
                {plan.schedule && (
                  <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                    🕐 <span>Scheduled: {plan.schedule}</span>
                  </p>
                )}
              </div>
            </div>

            {(plan.filters && plan.filters.length > 0) && (
              <div className="flex items-start gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-yellow-700">📊</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters</span>
                  <div className="mt-1 space-y-1">
                    {plan.filters.map((filter, idx) => (
                      <p key={idx} className="text-sm text-slate-700">
                        Only if {filter.field} {filter.operator} {filter.value}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(plan.conditions && plan.conditions.length > 0) && (
              <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-700">🔄</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conditions</span>
                  <div className="mt-1 space-y-1">
                    {plan.conditions.map((condition, idx) => (
                      <p key={idx} className="text-sm text-slate-700">
                        {condition.field} {condition.operator} {condition.value}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {plan.actions && plan.actions.length > 0 && (
              <>
                <div className="flex items-center justify-center py-1">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">2</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Then</span>
                    <div className="mt-1 space-y-2">
                      {plan.actions.map((action, idx) => (
                        <p key={idx} className="text-slate-900 font-medium">
                          {formatAction(action)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Required Connections */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Required Connections
            </span>
            <div className="flex flex-wrap gap-2">
              {plan.required_auth.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium capitalize border border-slate-200"
                >
                  {formatServiceName(service)}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateAutomation}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Automation...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Create Automation
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
