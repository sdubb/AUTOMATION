import { useState, useEffect } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { backendService } from '../lib/backendService';

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  actions: Array<{
    service: string;
    action: string;
    config?: Record<string, unknown>;
  }>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  enabled?: boolean;
}

export function AutomationDashboard() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await backendService.automations.list();
      const mapped = Array.isArray(data) ? data : (data.flows || data.automations || []);
      setAutomations(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load automations';
      setError(message);
      console.error('Error loading automations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      setExecutingId(id);
      setError(null);
      await backendService.automations.execute(id, {});
      await new Promise(r => setTimeout(r, 1000));
      await loadAutomations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      setError(message);
      console.error('Error executing automation:', err);
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    try {
      setDeletingId(id);
      setError(null);
      await backendService.automations.delete(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete automation';
      setError(message);
      console.error('Error deleting automation:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTrigger = (trigger: string): string => {
    return trigger
      .split('.')
      .join(' → ')
      .split('_')
      .map(word => {
        if (word === '→') return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const formatAction = (action: { service: string; action: string }): string => {
    return `${action.service} → ${action.action.split('_').join(' ')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading automations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                Your Automations
              </h1>
              <p className="text-gray-600 mt-2">Manage and monitor your automated workflows</p>
            </div>
            <button
              onClick={loadAutomations}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {automations.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No automations yet</h2>
            <p className="text-gray-600">Create your first automation using natural language</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                  {automation.description && (
                    <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                  )}
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900 mb-1">TRIGGER</p>
                  <p className="text-sm text-blue-700">{formatTrigger(automation.trigger)}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">ACTIONS</p>
                  <div className="space-y-2">
                    {automation.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        {formatAction(action)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {automation.enabled ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {automation.createdAt && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500">
                      Created {new Date(automation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExecute(automation.id)}
                    disabled={executingId === automation.id}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center justify-center gap-2"
                  >
                    {executingId === automation.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      '▶️ Execute'
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(automation.id)}
                    disabled={deletingId === automation.id}
                    className="px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {deletingId === automation.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '🗑️'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AutomationDashboard;
