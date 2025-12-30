/**
 * Main Dashboard
 * View and manage automations with ActivePieces backend
 */

import { useEffect, useState } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useAutomations } from '../hooks/useAutomations';
import { AutomationCreator } from './AutomationCreator';
import { ApprovalRequests } from './ApprovalRequests';
import { ApprovalConfig } from './ApprovalConfig';
import { EditAutomationWithDiff } from './EditAutomationWithDiff';
import { Summaries } from './Summaries';
import { ManageTeam } from './ManageTeam';
import { LogOut, Plus, Play, Trash2, Edit2, Loader2, Settings, AlertCircle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, hasRole } = useApi();
  const isAdmin = hasRole('admin');
  const { automations, isLoading, error, fetchAutomations, deleteAutomation, executeAutomation } = useAutomations();
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [currentAutomationPlan, setCurrentAutomationPlan] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'automations' | 'approvals' | 'summaries' | 'settings'>('automations');

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  async function handleExecute(id: string) {
    setExecuting(id);
    try {
      await executeAutomation(id);
      alert('Automation executed successfully');
    } catch {
      alert('Failed to execute automation');
    } finally {
      setExecuting(null);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this automation?')) {
      try {
        await deleteAutomation(id);
      } catch {
        alert('Failed to delete automation');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Dashboard</h1>
            <p className="text-gray-600 mt-1">Connected to ActivePieces Backend</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">{user?.email}{isAdmin ? ' • Admin' : ''}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
                Manage Team
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('automations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'automations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Automations
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Approvals
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summaries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Summaries
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'automations' && (
          <>
            {/* Create Button */}
            <div className="mb-8">
              <button
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Create New Automation
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Loading automations...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && automations.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No automations yet</p>
                <p className="text-gray-500 mb-6">Create your first automation to get started</p>
                <button
                  onClick={() => setShowCreator(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  Create Automation
                </button>
              </div>
            )}

            {/* Automations Grid */}
            {!isLoading && automations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {automations.map((automation) => (
                  <div
                    key={automation.id}
                    className={`bg-white rounded-lg shadow p-6 cursor-pointer transition ${
                      selectedAutomation === automation.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedAutomation(automation.id)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Trigger: {automation.trigger}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          automation.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {automation.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600">
                        {automation.actions?.length || 0} actions
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecute(automation.id);
                        }}
                        disabled={executing === automation.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 rounded-lg transition text-sm font-medium"
                      >
                        {executing === automation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Run
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAutomationId(automation.id);
                          setCurrentAutomationPlan(automation);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      { (isAdmin || (user && (automation as any).created_by === user.id)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(automation.id);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'approvals' && (
          <ApprovalRequests userId={user?.id} />
        )}

        {activeTab === 'summaries' && selectedAutomation && (
          <Summaries automationId={selectedAutomation} />
        )}

        {activeTab === 'summaries' && !selectedAutomation && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Select an automation to view summaries</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <ApprovalConfig
              initialConfig={{
                require_approval: false,
                approval_timeout_ms: 3600000,
                approval_channels: ['email'],
                approval_recipients: [],
                approval_instructions: '',
              }}
              onSave={async (config) => {
                console.log('Approval config saved:', config);
              }}
            />
          </div>
        )}
      </main>

      {/* Automation Creator Modal */}
      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Automation</h2>
              <button
                onClick={() => setShowCreator(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <AutomationCreator
                onAutomationCreated={() => {
                  setShowCreator(false);
                  fetchAutomations();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Automation with Diff Modal */}
      {editingAutomationId && currentAutomationPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Automation</h2>
              <button
                onClick={() => setEditingAutomationId(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <EditAutomationWithDiff
                automationId={editingAutomationId}
                currentPlan={currentAutomationPlan as any}
                onSave={() => {
                  setEditingAutomationId(null);
                  fetchAutomations();
                }}
                onCancel={() => setEditingAutomationId(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manage Team Modal */}
      {showTeamModal && (
        <ManageTeam
          onClose={() => setShowTeamModal(false)}
          currentUserRole={isAdmin ? 'admin' : 'member'}
        />
      )}
    </div>
  );
}
