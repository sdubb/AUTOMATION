import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { backendService } from '../lib/backendService';

interface ApprovalRequest {
  id: string;
  automation_id: string;
  automation?: { name: string; description: string };
  status: string;
  trigger_data: Record<string, unknown>;
  actions_preview: Array<Record<string, unknown>>;
  requested_at: string;
  expires_at: string;
  approved_at: string | null;
  approved_by_user_id: string | null;
  rejection_reason: string | null;
}

interface ApprovalRequestsProps {
  userId?: string;
  onApprovalChange?: () => void;
}

export function ApprovalRequests({ userId, onApprovalChange }: ApprovalRequestsProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApprovalRequests();
    const interval = setInterval(loadApprovalRequests, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadApprovalRequests = async () => {
    try {
      const approvals = await backendService.approvals.list();
      setRequests(approvals || []);
    } catch (err) {
      console.error('Failed to load approval requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await backendService.approvals.approve(requestId);
      await loadApprovalRequests();
      onApprovalChange?.();
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Error approving request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    setProcessingId(requestId);
    try {
      await backendService.approvals.reject(requestId, reason);
      await loadApprovalRequests();
      onApprovalChange?.();
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Error rejecting request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            Expired
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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff < 0) return 'Expired';
    if (diff < 60000) return 'Less than 1 minute';
    if (diff < 3600000) return `${Math.round(diff / 60000)} minutes`;
    return `${Math.round(diff / 3600000)} hours`;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle size={24} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Approval Requests</h3>
        {pendingRequests.length > 0 && (
          <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {pendingRequests.length} Pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : pendingRequests.length === 0 && otherRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
          <p>No approval requests</p>
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">Pending Your Approval</h4>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border-2 border-yellow-200 bg-yellow-50 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                      className="w-full p-4 hover:bg-yellow-100 transition text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm font-medium text-gray-600">
                              {request.automation?.name || 'Automation'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Requested:</strong> {formatTime(request.requested_at)}
                          </p>
                          <p className="text-sm text-yellow-800 font-medium">
                            <Clock size={14} className="inline mr-1" />
                            Expires in: {getTimeRemaining(request.expires_at)}
                          </p>
                        </div>
                        {expandedId === request.id ? (
                          <ChevronUp size={20} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-600" />
                        )}
                      </div>
                    </button>

                    {expandedId === request.id && (
                      <div className="border-t border-yellow-200 p-4 bg-white space-y-4">
                        {/* Trigger Data */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Trigger Data</h5>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-150 font-mono">
                            {JSON.stringify(request.trigger_data, null, 2)}
                          </pre>
                        </div>

                        {/* Actions Preview */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Actions That Will Execute</h5>
                          <div className="space-y-2">
                            {request.actions_preview?.map((action: Record<string, unknown>, idx: number) => {
                              const service = String(action?.service || 'Unknown');
                              const actionName = String(action?.action || 'Unknown');
                              const config = action?.config;
                              let configStr = '';
                              if (config) {
                                configStr = typeof config === 'string' ? String(config) : JSON.stringify(config, null, 2);
                              }
                              return (
                                <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {service} → {actionName}
                                  </p>
                                  {!!config && (
                                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-100 font-mono text-gray-700">
                                      {configStr}
                                    </pre>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Approve/Reject Buttons */}
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
                          >
                            {processingId === request.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                            Approve & Execute
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection (optional):');
                              if (reason !== null) {
                                handleReject(request.id, reason);
                              }
                            }}
                            disabled={processingId === request.id}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
                          >
                            {processingId === request.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <XCircle size={18} />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Requests */}
          {otherRequests.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Request History</h4>
              <div className="space-y-2">
                {otherRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-gray-700">
                            {request.automation?.name || 'Automation'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {formatTime(request.requested_at)}
                        </p>
                      </div>
                      {request.rejection_reason && (
                        <div className="text-xs text-red-700 italic max-w-xs text-right">
                          {request.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
