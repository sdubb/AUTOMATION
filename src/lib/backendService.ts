/**
 * Unified Backend Service
 * Combines ActivePieces API + Groq AI
 * Auth token automatically included from localStorage by activepieces.ts
 */

import { api as activepiecesAPI } from './api';

// Groq API Key
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
const groqBaseUrl = 'https://api.groq.com/openai/v1';

/**
 * AUTOMATIONS - Via ActivePieces
 * NOTE: Auth token is automatically included from localStorage
 */
export const automations = {
  // Get all automations from ActivePieces (filtered by current user)
  async list() {
    return activepiecesAPI.automations.list();
  },

  // Get single automation
  async get(id: string) {
    return activepiecesAPI.automations.get(id);
  },

  // Create automation in ActivePieces
  async create(data: {
    name: string;
    trigger: string;
    triggerConfig: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
  }) {
    return activepiecesAPI.automations.create(data);
  },

  // Update automation
  async update(id: string, data: Record<string, unknown>) {
    return activepiecesAPI.automations.update(id, data);
  },

  // Delete automation
  async delete(id: string) {
    return activepiecesAPI.automations.delete(id);
  },

  // Execute automation
  async execute(id: string, payload?: Record<string, unknown>) {
    return activepiecesAPI.automations.execute(id, payload);
  },

  // Get execution history (filtered by user's automations)
  async getExecutions(id: string) {
    return activepiecesAPI.automations.getExecutions(id);
  },
};

/**
 * GROQ AI - Language-based automation planning
 * NOTE: This is a public API, doesn't need user token
 */
export const groq = {
  async planAutomation(userPrompt: string) {
    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch(`${groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: `You are an automation planning assistant. Convert user requests into automation workflows.
            
Return a JSON object with:
{
  "name": "automation name",
  "trigger": "webhook|schedule|email|form",
  "triggerConfig": { /* trigger details */ },
  "actions": [{ "service": "slack|email|sheets", "action": "send_message|send_email|add_row", "config": {} }],
  "description": "what this automation does"
}

Available services: slack, email, google_sheets, google_drive, github, notion, stripe`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      throw new Error('Failed to parse automation plan from Groq');
    }
  },

  async analyzeAutomation(automationDescription: string) {
    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch(`${groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'Analyze the automation and provide insights. Return JSON with: { "risks": [], "improvements": [], "estimatedTime": "string", "complexity": "low|medium|high" }',
          },
          {
            role: 'user',
            content: automationDescription,
          },
        ],
        temperature: 0.5,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze automation');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      return {
        risks: [],
        improvements: [],
        estimatedTime: 'Unknown',
        complexity: 'medium',
      };
    }
  },
};

/**
 * CONNECTIONS - Via ActivePieces (OAuth, API keys)
 * Auth token automatically included from localStorage
 */
export const connections = {
  async list() {
    return activepiecesAPI.connections.list();
  },

  async create(data: {
    name: string;
    appName: string;
    config: Record<string, unknown>;
  }) {
    return activepiecesAPI.connections.create(data);
  },

  async update(id: string, data: Record<string, unknown>) {
    return activepiecesAPI.connections.update(id, data);
  },

  async delete(id: string) {
    return activepiecesAPI.connections.delete(id);
  },

  async test(id: string) {
    return activepiecesAPI.connections.test(id);
  },
};

/**
 * WEBHOOKS - Via ActivePieces
 * Auth token automatically included from localStorage
 */
export const webhooks = {
  async list() {
    return activepiecesAPI.webhooks.list();
  },

  async create(data: {
    name: string;
    url: string;
    events: string[];
  }) {
    return activepiecesAPI.webhooks.create(data);
  },

  async delete(id: string) {
    return activepiecesAPI.webhooks.delete(id);
  },

  async testDelivery(id: string) {
    return activepiecesAPI.webhooks.testDelivery(id);
  },
};

/**
 * EXECUTION LOGS - Via ActivePieces
 */
export const executionLogs = {
  async list(filters?: Record<string, unknown>) {
    return activepiecesAPI.executionLogs.list(filters);
  },

  async get(id: string) {
    return activepiecesAPI.executionLogs.get(id);
  },

  async retry(id: string) {
    return activepiecesAPI.executionLogs.retry(id);
  },
};

/**
 * APPROVALS - Via ActivePieces
 */
export const approvals = {
  async list() {
    return activepiecesAPI.approvals.list();
  },

  async get(id: string) {
    return activepiecesAPI.approvals.get(id);
  },

  async approve(id: string, comment?: string) {
    return activepiecesAPI.approvals.approve(id, comment);
  },

  async reject(id: string, reason?: string) {
    return activepiecesAPI.approvals.reject(id, reason);
  },
};

/**
 * TRIGGERS - Available triggers from ActivePieces
 */
export const triggers = {
  async listAvailable() {
    return activepiecesAPI.triggers.listAvailable();
  },

  async getSchema(triggerName: string) {
    return activepiecesAPI.triggers.getSchema(triggerName);
  },
};

/**
 * ACTIONS - Available actions from ActivePieces
 */
export const actions = {
  async listAvailable() {
    return activepiecesAPI.actions.listAvailable();
  },

  async getSchema(actionName: string) {
    return activepiecesAPI.actions.getSchema(actionName);
  },
};

/**
 * EXPORT unified backend
 */
export const backendService = {
  automations,
  groq,
  connections,
  webhooks,
  executionLogs,
  approvals,
  triggers,
  actions,
  teams: activepiecesAPI.teams,
  auth: activepiecesAPI.auth,
};

export default backendService;
