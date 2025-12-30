import { useState } from 'react';
import { WorkflowVersion, compareVersions, activateVersion, pruneVersions } from '../lib/workflowVersioning';
import { backendService } from '../lib/backendService';

interface WorkflowVersionsProps {
  automationId: string;
  versions: WorkflowVersion[];
  onActivate: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
}

export function WorkflowVersions({ automationId, versions: initialVersions, onActivate, onDelete }: WorkflowVersionsProps) {
  const [versions, setVersions] = useState(initialVersions);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    initialVersions.find((v) => v.isActive)?.versionId || null
  );
  const [showComparison, setShowComparison] = useState(false);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  const selectedVersion = selectedVersionId ? versions.find((v) => v.versionId === selectedVersionId) : null;
  const compareVersion = compareWithId ? versions.find((v) => v.versionId === compareWithId) : null;

  const handleActivate = async (versionId: string) => {
    try {
      const updated = activateVersion(versions, versionId);
      setVersions(updated);
      
      // Call backend service to persist version activation
      await backendService.automations.update(automationId, {
        versionId: versionId,
      });
      
      onActivate(versionId);
    } catch (err) {
      console.error('Failed to activate version:', err);
      // Revert on error
      setVersions(versions);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (confirm('Delete this version? This cannot be undone.')) {
      try {
        const updated = versions.filter((v) => v.versionId !== versionId);
        setVersions(updated);
        if (selectedVersionId === versionId) setSelectedVersionId(null);
        
        // Call backend service to delete version
        // Note: Activepieces handles version history internally
        // This is a soft delete in our tracking system
        onDelete?.(versionId);
      } catch (err) {
        console.error('Failed to delete version:', err);
      }
    }
  };

  const handleCreateSnapshot = () => {
    const latest = versions[0];
    if (!latest) return;

    const snapshot: WorkflowVersion = {
      ...latest,
      versionId: crypto.randomUUID?.() || `v_${Date.now()}`,
      versionNumber: Math.max(...versions.map((v) => v.versionNumber), 0) + 1,
      isSnapshot: true,
      isActive: false,
      createdAt: new Date().toISOString(),
      changeNote: prompt('Snapshot name (optional):') || undefined,
    };

    const updated = pruneVersions([snapshot, ...versions]);
    setVersions(updated);
  };

  const diffs =
    selectedVersion && compareVersion ? compareVersions(selectedVersion, compareVersion) : [];

  return (
    <div className="space-y-4">
      {/* Version List */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Version History ({versions.length})</h3>
          <button
            onClick={handleCreateSnapshot}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Snapshot
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {versions.map((version) => (
            <div
              key={version.versionId}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                version.isActive ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } ${selectedVersionId === version.versionId ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => setSelectedVersionId(version.versionId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">v{version.versionNumber}</span>
                    {version.isActive && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">ACTIVE</span>}
                    {version.isSnapshot && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">📌 SNAPSHOT</span>}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{version.changeNote || 'No notes'}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(version.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-600 ml-2">{(version.size / 1024).toFixed(1)}KB</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Version Details */}
      {selectedVersion && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-sm mb-3">Version Details</h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="font-medium text-gray-600">Prompt:</label>
              <p className="mt-1 p-2 bg-gray-50 rounded text-gray-700 break-words">{selectedVersion.prompt}</p>
            </div>

            <div className="flex gap-2">
              {!selectedVersion.isActive && (
                <button
                  onClick={() => handleActivate(selectedVersion.versionId)}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  ✓ Activate
                </button>
              )}
              <button
                onClick={() => {
                  setShowComparison(!showComparison);
                  if (!showComparison && !compareWithId) {
                    // Find previous version to compare with
                    const currentIdx = versions.findIndex((v) => v.versionId === selectedVersion.versionId);
                    if (currentIdx < versions.length - 1) {
                      setCompareWithId(versions[currentIdx + 1].versionId);
                    }
                  }
                }}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Compare
              </button>
              <button
                onClick={() => handleDelete(selectedVersion.versionId)}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {showComparison && selectedVersion && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Compare with:</label>
            <select
              value={compareWithId || ''}
              onChange={(e) => setCompareWithId(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">Select version...</option>
              {versions
                .filter((v) => v.versionId !== selectedVersionId)
                .map((v) => (
                  <option key={v.versionId} value={v.versionId}>
                    v{v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                  </option>
                ))}
            </select>
          </div>

          {diffs.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-gray-700">Changes ({diffs.length}):</h4>
              {diffs.slice(0, 10).map((diff, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-xs border-l-2 border-gray-300">
                  <div className="font-mono text-gray-700">{diff.field}</div>
                  {diff.type === 'modified' && (
                    <div className="mt-1 space-y-1 text-gray-600">
                      <div className="text-red-600">- {String(diff.oldValue).substring(0, 100)}</div>
                      <div className="text-green-600">+ {String(diff.newValue).substring(0, 100)}</div>
                    </div>
                  )}
                  {diff.type === 'added' && <div className="text-green-600 mt-1">+ Added</div>}
                  {diff.type === 'removed' && <div className="text-red-600 mt-1">- Removed</div>}
                </div>
              ))}
              {diffs.length > 10 && <p className="text-xs text-gray-500 italic">+{diffs.length - 10} more changes</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
