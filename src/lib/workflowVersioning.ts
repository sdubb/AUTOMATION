/**
 * Workflow Versioning Service
 * Maintains automation version history for safe editing
 * Allows rollback to previous working versions
 */

export interface WorkflowVersion {
  versionId: string; // UUIDv4
  automationId: string;
  versionNumber: number; // 1, 2, 3, etc.
  prompt: string; // original user prompt
  plan: any; // Groq-generated plan
  config: any; // automation config
  createdAt: string; // ISO timestamp
  createdBy: string; // user ID
  changeNote?: string; // "Updated email condition", etc.
  isActive: boolean;
  isSnapshot: boolean; // true = user-created checkpoint
  size: number; // bytes
}

export interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

/**
 * Create a new version
 */
export function createVersion(
  automationId: string,
  versionNumber: number,
  prompt: string,
  plan: any,
  config: any,
  userId: string,
  changeNote?: string,
  isSnapshot: boolean = false
): WorkflowVersion {
  const version: WorkflowVersion = {
    versionId: crypto.randomUUID?.() || `version_${Date.now()}_${Math.random()}`,
    automationId,
    versionNumber,
    prompt,
    plan,
    config,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    changeNote,
    isActive: false,
    isSnapshot,
    size: JSON.stringify({ prompt, plan, config }).length,
  };

  return version;
}

/**
 * Compare two versions
 */
export function compareVersions(versionA: WorkflowVersion, versionB: WorkflowVersion): VersionDiff[] {
  const diffs: VersionDiff[] = [];

  // Compare prompts
  if (versionA.prompt !== versionB.prompt) {
    diffs.push({
      field: 'Prompt',
      oldValue: versionA.prompt,
      newValue: versionB.prompt,
      type: 'modified',
    });
  }

  // Compare plan structure
  if (JSON.stringify(versionA.plan) !== JSON.stringify(versionB.plan)) {
    diffs.push({
      field: 'Plan',
      oldValue: versionA.plan,
      newValue: versionB.plan,
      type: 'modified',
    });
  }

  // Compare config
  if (JSON.stringify(versionA.config) !== JSON.stringify(versionB.config)) {
    // Deep comparison to show specific config changes
    const configDiff = compareObjects(versionA.config, versionB.config, 'config');
    diffs.push(...configDiff);
  }

  return diffs;
}

/**
 * Deep object comparison helper
 */
function compareObjects(obj1: any, obj2: any, path: string): VersionDiff[] {
  const diffs: VersionDiff[] = [];
  const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  for (const key of keys) {
    const newPath = `${path}.${key}`;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (val1 === undefined) {
      diffs.push({
        field: newPath,
        oldValue: undefined,
        newValue: val2,
        type: 'added',
      });
    } else if (val2 === undefined) {
      diffs.push({
        field: newPath,
        oldValue: val1,
        newValue: undefined,
        type: 'removed',
      });
    } else if (typeof val1 === 'object' && typeof val2 === 'object') {
      diffs.push(...compareObjects(val1, val2, newPath));
    } else if (val1 !== val2) {
      diffs.push({
        field: newPath,
        oldValue: val1,
        newValue: val2,
        type: 'modified',
      });
    }
  }

  return diffs;
}

/**
 * Get version history (latest first)
 */
export function getVersionHistory(versions: WorkflowVersion[]): WorkflowVersion[] {
  return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get active version
 */
export function getActiveVersion(versions: WorkflowVersion[]): WorkflowVersion | null {
  return versions.find((v) => v.isActive) || null;
}

/**
 * Activate a version (deactivate current, activate new)
 */
export function activateVersion(versions: WorkflowVersion[], versionId: string): WorkflowVersion[] {
  return versions.map((v) => ({
    ...v,
    isActive: v.versionId === versionId,
  }));
}

/**
 * Keep only last N versions (auto-cleanup)
 */
export function pruneVersions(versions: WorkflowVersion[], keepCount: number = 10): WorkflowVersion[] {
  const sorted = getVersionHistory(versions);
  // Always keep snapshots
  const snapshots = sorted.filter((v) => v.isSnapshot);
  const regular = sorted.filter((v) => !v.isSnapshot).slice(0, keepCount - snapshots.length);
  return [...snapshots, ...regular];
}

/**
 * Export version as JSON (for backup)
 */
export function exportVersion(version: WorkflowVersion): string {
  return JSON.stringify(
    {
      ...version,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * Import version from JSON
 */
export function importVersion(json: string, automationId: string, userId: string): WorkflowVersion {
  const imported = JSON.parse(json);
  return {
    ...imported,
    versionId: crypto.randomUUID?.() || `version_${Date.now()}_${Math.random()}`,
    automationId,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    isActive: false,
  };
}

/**
 * Get human-readable changelog
 */
export function getChangelog(versions: WorkflowVersion[]): string[] {
  return getVersionHistory(versions)
    .filter((v) => v.changeNote)
    .map(
      (v) =>
        `v${v.versionNumber} (${new Date(v.createdAt).toLocaleDateString()}): ${v.changeNote}`
    );
}

/**
 * Estimate storage used by versions
 */
export function calculateStorageUsed(versions: WorkflowVersion[]): { total: number; byVersion: Record<string, number> } {
  const byVersion: Record<string, number> = {};
  let total = 0;

  for (const version of versions) {
    const size = version.size;
    byVersion[`v${version.versionNumber}`] = size;
    total += size;
  }

  return { total, byVersion };
}
