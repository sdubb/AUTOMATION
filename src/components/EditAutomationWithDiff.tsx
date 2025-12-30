import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { computePlanDiff, formatPlanForReview, type Plan, type PlanDiff } from '../lib/planDiff';
import { sendApprovalNotification } from '../lib/notificationService';
import { startApprovalCountdown } from '../lib/approvalService';

interface EditAutomationWithDiffProps {
  automationId: string;
  currentPlan: Plan;
  onSave?: () => void;
  onCancel?: () => void;
}

export function EditAutomationWithDiff({
  automationId,
  currentPlan,
  onSave,
  onCancel,
}: EditAutomationWithDiffProps) {
  const [prompt, setPrompt] = useState('');
  const [newPlan, setNewPlan] = useState<Plan | null>(null);
  const [diff, setDiff] = useState<PlanDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'review' | 'approval' | 'complete'>('input');
  const [expandedChanges, setExpandedChanges] = useState(false);
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [requireApproval, setRequireApproval] = useState(
    currentPlan.approval?.require_approval || false
  );
  const [approvalTimeout, setApprovalTimeout] = useState(
    (currentPlan.approval?.approval_timeout_ms || 3600000) / 1000 / 60
  );

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please describe the changes you want');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const plan = await backendService.groq.planAutomation(prompt);
      setNewPlan(plan as any);

      const planDiff = computePlanDiff(currentPlan, plan as any);
      setDiff(planDiff);

      setStep('review');
    } catch (err) {
      setError(`Failed to generate plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChanges = async () => {
    if (!newPlan) return;

    setLoading(true);
    setError('');

    try {
      // Update the automation
      await backendService.automations.update(automationId, {
        ...newPlan,
        approval: {
          require_approval: requireApproval,
          approval_timeout_ms: approvalTimeout * 60 * 1000,
          approval_channels: currentPlan.approval?.approval_channels || ['email'],
          approval_recipients: currentPlan.approval?.approval_recipients || [],
          approval_instructions: currentPlan.approval?.approval_instructions || '',
        },
      });

      if (requireApproval && diff?.hasMajorChanges) {
        // Create approval request
        const approvalResp = await backendService.approvals.list();
        const newApprovalId = `approval_${Date.now()}`;
        setApprovalId(newApprovalId);

        // Start countdown timer
        startApprovalCountdown(
          newApprovalId,
          automationId,
          approvalTimeout * 60 * 1000,
          async () => {
            console.log('Approval timeout reached, auto-executing');
            setStep('complete');
          }
        );

        // Send notification (optional)
        await sendApprovalNotification({
          approvalId: newApprovalId,
          automationName: newPlan.name,
          automationDescription: newPlan.description,
          triggerData: currentPlan.triggers[0] || {},
          actionPreview: `${newPlan.actions.length} action(s)`,
          approveUrl: `${window.location.origin}/automations/${automationId}?approve=${newApprovalId}`,
          rejectUrl: `${window.location.origin}/automations/${automationId}?reject=${newApprovalId}`,
          timeoutMinutes: approvalTimeout,
          recipients: currentPlan.approval?.approval_recipients || [],
          channels: (currentPlan.approval?.approval_channels || ['email']) as any,
        });

        setStep('approval');
      } else {
        setStep('complete');
      }
    } catch (err) {
      setError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleRejectChanges = () => {
    setNewPlan(null);
    setDiff(null);
    setPrompt('');
    setStep('input');
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Automation (by Description)</h3>
          <p className="text-sm text-gray-600">
            Describe the changes you want to make. The system will generate a new plan and show you
            the differences.
          </p>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a Slack notification step when the email arrives' or 'Change the Gmail search to only look for messages from my boss'"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && (
              <div className="flex gap-2 items-start p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating plan...' : 'Generate New Plan'}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Review Changes */}
      {step === 'review' && diff && newPlan && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Changes</h3>

          {/* Change Summary */}
          <div
            className={`p-4 rounded-lg border-2 ${
              diff.hasMajorChanges
                ? 'border-amber-300 bg-amber-50'
                : 'border-green-300 bg-green-50'
            }`}
          >
            <div className="flex gap-3 items-start">
              {diff.hasMajorChanges ? (
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-semibold mb-2">
                  {diff.hasMajorChanges ? '⚠️ Major Changes Detected' : '✅ Safe Changes'}
                </h4>
                <p className="text-sm whitespace-pre-wrap font-mono">{diff.readableSummary}</p>
              </div>
            </div>
          </div>

          {/* Approval Setting */}
          {diff.hasMajorChanges && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Require approval before executing changes</span>
              </label>
              {requireApproval && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Approval timeout (minutes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={approvalTimeout}
                    onChange={(e) => setApprovalTimeout(parseInt(e.target.value) || 60)}
                    className="mt-1 px-3 py-2 border border-gray-300 rounded-lg w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If not approved, automation will auto-execute
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expandable Changes Detail */}
          <button
            onClick={() => setExpandedChanges(!expandedChanges)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ChevronDown className={`w-4 h-4 transition ${expandedChanges ? 'rotate-180' : ''}`} />
            {expandedChanges ? 'Hide' : 'Show'} Detailed Changes
          </button>

          {expandedChanges && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-sm mb-2">Current Plan</h4>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                  {formatPlanForReview(currentPlan)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">New Plan</h4>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                  {formatPlanForReview(newPlan)}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAcceptChanges}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Accept & Save'}
            </button>
            <button
              onClick={handleRejectChanges}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Cancel & Revise
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Approval */}
      {step === 'approval' && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3 items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Changes Require Approval</h4>
              <p className="text-sm mt-1">
                An approval request has been sent. The automation will auto-execute in{' '}
                <strong>{approvalTimeout} minutes</strong> if not approved.
              </p>
              {approvalId && (
                <p className="text-xs text-gray-600 mt-2">Approval ID: {approvalId}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex gap-3 items-start">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Changes Saved Successfully</h4>
              <p className="text-sm mt-1">Your automation has been updated.</p>
              {onSave && (
                <button
                  onClick={onSave}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
