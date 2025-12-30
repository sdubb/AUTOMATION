/**
 * Plan Diffing & Comparison
 * Compares old and new automation plans and provides readable diffs
 */

export interface Plan {
  id?: string;
  name: string;
  description: string;
  triggers: any[];
  actions: any[];
  approval?: {
    require_approval: boolean;
    approval_timeout_ms: number;
    approval_channels: string[];
  };
}

export interface PlanDiff {
  oldPlan: Plan;
  newPlan: Plan;
  nameChanged: boolean;
  descriptionChanged: boolean;
  triggersAdded: any[];
  triggersRemoved: any[];
  actionsAdded: any[];
  actionsRemoved: any[];
  approvalSettingsChanged: boolean;
  hasMajorChanges: boolean;
  readableSummary: string;
}

export function computePlanDiff(oldPlan: Plan, newPlan: Plan): PlanDiff {
  const triggersAdded = newPlan.triggers.filter(
    (newTrig) =>
      !oldPlan.triggers.some(
        (oldTrig) =>
          oldTrig.type === newTrig.type &&
          JSON.stringify(oldTrig.config) === JSON.stringify(newTrig.config)
      )
  );

  const triggersRemoved = oldPlan.triggers.filter(
    (oldTrig) =>
      !newPlan.triggers.some(
        (newTrig) =>
          oldTrig.type === newTrig.type &&
          JSON.stringify(oldTrig.config) === JSON.stringify(newTrig.config)
      )
  );

  const actionsAdded = newPlan.actions.filter(
    (newAction) =>
      !oldPlan.actions.some(
        (oldAction) =>
          oldAction.type === newAction.type &&
          JSON.stringify(oldAction.config) === JSON.stringify(newAction.config)
      )
  );

  const actionsRemoved = oldPlan.actions.filter(
    (oldAction) =>
      !newPlan.actions.some(
        (newAction) =>
          oldAction.type === newAction.type &&
          JSON.stringify(oldAction.config) === JSON.stringify(newAction.config)
      )
  );

  const nameChanged = oldPlan.name !== newPlan.name;
  const descriptionChanged = oldPlan.description !== newPlan.description;
  const approvalSettingsChanged =
    JSON.stringify(oldPlan.approval) !== JSON.stringify(newPlan.approval);

  const hasMajorChanges =
    triggersRemoved.length > 0 ||
    actionsRemoved.length > 0 ||
    approvalSettingsChanged;

  const changes: string[] = [];
  if (nameChanged) {
    changes.push(`📝 Name changed: "${oldPlan.name}" → "${newPlan.name}"`);
  }
  if (descriptionChanged) {
    changes.push(`📄 Description updated`);
  }
  if (triggersAdded.length > 0) {
    changes.push(`➕ Added ${triggersAdded.length} trigger(s)`);
  }
  if (triggersRemoved.length > 0) {
    changes.push(`➖ Removed ${triggersRemoved.length} trigger(s)`);
  }
  if (actionsAdded.length > 0) {
    changes.push(`➕ Added ${actionsAdded.length} action(s)`);
  }
  if (actionsRemoved.length > 0) {
    changes.push(`➖ Removed ${actionsRemoved.length} action(s)`);
  }
  if (approvalSettingsChanged) {
    changes.push(`🔒 Approval settings changed`);
  }

  const readableSummary =
    changes.length > 0
      ? changes.join('\n')
      : 'No changes detected (automation already current)';

  return {
    oldPlan,
    newPlan,
    nameChanged,
    descriptionChanged,
    triggersAdded,
    triggersRemoved,
    actionsAdded,
    actionsRemoved,
    approvalSettingsChanged,
    hasMajorChanges,
    readableSummary,
  };
}

export function formatPlanForReview(plan: Plan): string {
  return `
**${plan.name}**
${plan.description}

**Triggers:** ${plan.triggers.length}
${plan.triggers.map((t) => `  • ${t.type} (${t.config?.event || 'manual'})`).join('\n')}

**Actions:** ${plan.actions.length}
${plan.actions.map((a) => `  • ${a.type}`).join('\n')}

**Approval Required:** ${plan.approval?.require_approval ? 'Yes' : 'No'}
  `;
}
