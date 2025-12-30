/**
 * ActivePieces API Client
 * Handles all communication with self-hosted ActivePieces backend
 */

const API_BASE_URL = import.meta.env.VITE_ACTIVEPIECES_URL || 'http://localhost:3000/api';
const API_KEY = import.meta.env.VITE_ACTIVEPIECES_API_KEY || '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Make authenticated request to ActivePieces API
 */
async function apiCall(endpoint: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || (options.body ? 'POST' : 'GET');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
    ...options.headers,
  };

  // Include user token from localStorage if present
  try {
    const userToken = localStorage.getItem('activepieces_token');
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }
  } catch (err) {
    // Ignore localStorage errors in some environments
  };


  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Authentication
 */
export const auth = {
  async login(email: string, password: string) {
    const resp = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    // Persist token for subsequent calls
    try {
      if (resp?.token) {
        localStorage.setItem('activepieces_token', resp.token);
      }
    } catch (err) {
      // ignore
    }
    return resp;
  },

  async signup(email: string, password: string, firstName?: string) {
    const resp = await apiCall('/auth/register', {
      method: 'POST',
      body: { email, password, firstName },
    });
    try {
      if (resp?.token) {
        localStorage.setItem('activepieces_token', resp.token);
      }
    } catch (err) {}
    return resp;
  },

  async logout() {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } finally {
      try { localStorage.removeItem('activepieces_token'); } catch {}
    }
  },

  async getCurrentUser() {
    return apiCall('/auth/me', { method: 'GET' });
  },
};

/**
 * Automations (Flows)
 */
export const automations = {
  async list() {
    return apiCall('/flows', { method: 'GET' });
  },

  async get(flowId: string) {
    return apiCall(`/flows/${flowId}`, { method: 'GET' });
  },

  async create(data: {
    name: string;
    trigger: string;
    triggerConfig: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
  }) {
    return apiCall('/flows', {
      method: 'POST',
      body: data,
    });
  },

  async update(flowId: string, data: Record<string, unknown>) {
    return apiCall(`/flows/${flowId}`, {
      method: 'PUT',
      body: data,
    });
  },

  async delete(flowId: string) {
    return apiCall(`/flows/${flowId}`, {
      method: 'DELETE',
    });
  },

  async execute(flowId: string, payload?: Record<string, unknown>) {
    return apiCall(`/flows/${flowId}/execute`, {
      method: 'POST',
      body: payload,
    });
  },

  async getExecutions(flowId: string) {
    return apiCall(`/flows/${flowId}/executions`, { method: 'GET' });
  },
};

/**
 * Connections (Integrations)
 */
export const connections = {
  async list() {
    return apiCall('/connections', { method: 'GET' });
  },

  async get(connectionId: string) {
    return apiCall(`/connections/${connectionId}`, { method: 'GET' });
  },

  async create(data: {
    name: string;
    appName: string;
    config: Record<string, unknown>;
  }) {
    return apiCall('/connections', {
      method: 'POST',
      body: data,
    });
  },

  async update(connectionId: string, data: Record<string, unknown>) {
    return apiCall(`/connections/${connectionId}`, {
      method: 'PUT',
      body: data,
    });
  },

  async delete(connectionId: string) {
    return apiCall(`/connections/${connectionId}`, {
      method: 'DELETE',
    });
  },

  async test(connectionId: string) {
    return apiCall(`/connections/${connectionId}/test`, {
      method: 'POST',
    });
  },
};

/**
 * Triggers
 */
export const triggers = {
  async listAvailable() {
    return apiCall('/triggers', { method: 'GET' });
  },

  async getSchema(triggerName: string) {
    return apiCall(`/triggers/${triggerName}/schema`, { method: 'GET' });
  },
};

/**
 * Actions
 */
export const actions = {
  async listAvailable() {
    return apiCall('/actions', { method: 'GET' });
  },

  async getSchema(actionName: string) {
    return apiCall(`/actions/${actionName}/schema`, { method: 'GET' });
  },
};

/**
 * Webhooks
 */
export const webhooks = {
  async list() {
    return apiCall('/webhooks', { method: 'GET' });
  },

  async create(data: {
    name: string;
    url: string;
    events: string[];
  }) {
    return apiCall('/webhooks', {
      method: 'POST',
      body: data,
    });
  },

  async delete(webhookId: string) {
    return apiCall(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  },

  async testDelivery(webhookId: string) {
    return apiCall(`/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  },
};

/**
 * Execution History / Logs
 */
export const executionLogs = {
  async list(filters?: Record<string, unknown>) {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.append(key, String(value));
      });
    }
    return apiCall(`/executions?${query.toString()}`, { method: 'GET' });
  },

  async get(executionId: string) {
    return apiCall(`/executions/${executionId}`, { method: 'GET' });
  },

  async retry(executionId: string) {
    return apiCall(`/executions/${executionId}/retry`, {
      method: 'POST',
    });
  },
};

/**
 * Approvals
 */
export const approvals = {
  async list() {
    return apiCall('/approvals', { method: 'GET' });
  },

  async get(approvalId: string) {
    return apiCall(`/approvals/${approvalId}`, { method: 'GET' });
  },

  async approve(approvalId: string, comment?: string) {
    return apiCall(`/approvals/${approvalId}/approve`, {
      method: 'POST',
      body: { comment },
    });
  },

  async reject(approvalId: string, reason?: string) {
    return apiCall(`/approvals/${approvalId}/reject`, {
      method: 'POST',
      body: { reason },
    });
  },
};

/**
 * Teams & Settings
 */
export const teams = {
  async getCurrent() {
    return apiCall('/teams/current', { method: 'GET' });
  },

  async listMembers() {
    return apiCall('/teams/current/members', { method: 'GET' });
  },

  async inviteMember(email: string, role: string = 'member') {
    return apiCall('/teams/current/invite', {
      method: 'POST',
      body: { email, role },
    });
  },

  async updateMemberRole(memberId: string, role: 'admin' | 'member' | 'viewer') {
    return apiCall(`/teams/current/members/${memberId}`, {
      method: 'PATCH',
      body: { role },
    });
  },

  async removeMember(memberId: string) {
    return apiCall(`/teams/current/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth,
  automations,
  connections,
  triggers,
  actions,
  webhooks,
  executionLogs,
  approvals,
  teams,
};
