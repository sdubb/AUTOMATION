/**
 * Unified Backend Service WITH AUTH HEADERS
 * Combines ActivePieces API + Groq AI + Local services
 * NOW: Includes auth token in all API calls for multi-user support
 */

import { api as activepiecesAPI } from './api';
import { getAuthHeaders } from './activepiecesAuth';

// Groq API Key
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
const groqBaseUrl = 'https://api.groq.com/openai/v1';

/**
 * Helper to add auth headers to API calls
 */
function getHeaders(additionalHeaders: Record<string, string> = {}) {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
}

/**
 * AUTOMATIONS - Via ActivePieces
 * NOW: All calls include user's auth token
 */
export const automations = {
  // Get all automations from ActivePieces (filtered by current user)
  async list() {
    return activepiecesAPI.automations.list({
      headers: getHeaders(),
    });
  },

  // Get single automation
  async get(id: string) {
    return activepiecesAPI.automations.get(id, {
      headers: getHeaders(),
    });
  },

  // Create automation in ActivePieces
  async create(data: {
    name: string;
    trigger: string;
    triggerConfig: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
  }) {
    return activepiecesAPI.automations.create(data, {
      headers: getHeaders(),
    });
  },

  // Update automation
  async update(id: string, data: Record<string, unknown>) {
    return activepiecesAPI.automations.update(id, data, {
      headers: getHeaders(),
    });
  },

  // Delete automation
  async delete(id: string) {
    return activepiecesAPI.automations.delete(id, {
      headers: getHeaders(),
    });
  },

  // Execute automation
  async execute(id: string, payload?: Record<string, unknown>) {
    return activepiecesAPI.automations.execute(id, payload, {
      headers: getHeaders(),
    });
  },

  // Get execution history (filtered by user's automations)
  async getExecutions(id: string) {
    return activepiecesAPI.automations.getExecutions(id, {
      headers: getHeaders(),
    });
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
 * NOW: Filtered by user, can only access own connections
 */
export const connections = {
  async list() {
    return activepiecesAPI.connections.list({
      headers: getHeaders(),
    });
  },

  async create(data: {
    name: string;
    appName: string;
    config: Record<string, unknown>;
  }) {
    return activepiecesAPI.connections.create(data, {
      headers: getHeaders(),
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return activepiecesAPI.connections.update(id, data, {
      headers: getHeaders(),
    });
  },

  async delete(id: string) {
    return activepiecesAPI.connections.delete(id, {
      headers: getHeaders(),
    });
  },

  async test(id: string) {
    return activepiecesAPI.connections.test(id, {
      headers: getHeaders(),
    });
  },
};

/**
 * WEBHOOKS - Via ActivePieces
 * NOW: Filtered by user's automations
 */
export const webhooks = {
  async list() {
    return activepiecesAPI.webhooks.list({
      headers: getHeaders(),
    });
  },

  async create(data: {
    name: string;
    url: string;
    events: string[];
  }) {
    return activepiecesAPI.webhooks.create(data, {
      headers: getHeaders(),
    });
  },

  async delete(id: string) {
    return activepiecesAPI.webhooks.delete(id, {
      headers: getHeaders(),
    });
  },

  async testDelivery(id: string) {
    return activepiecesAPI.webhooks.testDelivery(id, {
      headers: getHeaders(),
    });
  },

  async getHistory(webhookId: string) {
    return activepiecesAPI.webhooks.getHistory(webhookId, {
      headers: getHeaders(),
    });
  },
};

/**
 * EXECUTION LOGS - Via ActivePieces
 * NOW: Only shows user's execution history
 */
export const executionLogs = {
  async list(filters?: Record<string, unknown>) {
    return activepiecesAPI.executionLogs.list(filters, {
      headers: getHeaders(),
    });
  },

  async get(id: string) {
    return activepiecesAPI.executionLogs.get(id, {
      headers: getHeaders(),
    });
  },

  async retry(id: string) {
    return activepiecesAPI.executionLogs.retry(id, {
      headers: getHeaders(),
    });
  },
};

/**
 * APPROVALS - Via ActivePieces
 * NOW: Only shows user's approval requests
 */
export const approvals = {
  async list() {
    return activepiecesAPI.approvals.list({
      headers: getHeaders(),
    });
  },

  async get(id: string) {
    return activepiecesAPI.approvals.get(id, {
      headers: getHeaders(),
    });
  },

  async approve(id: string, comment?: string) {
    return activepiecesAPI.approvals.approve(id, comment, {
      headers: getHeaders(),
    });
  },

  async reject(id: string, reason?: string) {
    return activepiecesAPI.approvals.reject(id, reason, {
      headers: getHeaders(),
    });
  },
};

/**
 * TRIGGERS - Available triggers from ActivePieces
 */
export const triggers = {
  async listAvailable() {
    return activepiecesAPI.triggers.listAvailable({
      headers: getHeaders(),
    });
  },

  async getSchema(triggerName: string) {
    return activepiecesAPI.triggers.getSchema(triggerName, {
      headers: getHeaders(),
    });
  },
};

/**
 * ACTIONS - Available actions from ActivePieces
 */
export const actions = {
  async listAvailable() {
    return activepiecesAPI.actions.listAvailable({
      headers: getHeaders(),
    });
  },

  async getSchema(actionName: string) {
    return activepiecesAPI.actions.getSchema(actionName, {
      headers: getHeaders(),
    });
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
};

export default backendService;
