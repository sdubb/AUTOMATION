import { useState, useEffect, useCallback } from 'react';
import * as ap from '@/lib/activepieces';

export function useWebhooks(workflowId: string | null) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ap.getWebhooks(workflowId);
      setWebhooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = useCallback(async (displayName: string) => {
    if (!workflowId) return;
    try {
      const webhook = await ap.createWebhook(workflowId, displayName);
      setWebhooks([...webhooks, webhook]);
      return webhook;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
      throw err;
    }
  }, [workflowId, webhooks]);

  const deleteWebhook = useCallback(async (webhookId: string) => {
    if (!workflowId) return;
    try {
      await ap.deleteWebhook(workflowId, webhookId);
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
      throw err;
    }
  }, [workflowId, webhooks]);

  return { webhooks, loading, error, createWebhook, deleteWebhook, refresh: fetchWebhooks };
}

export function useIntegrations() {
  const [pieces, setPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ap.getPieces()
      .then(setPieces)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load integrations'))
      .finally(() => setLoading(false));
  }, []);

  return { pieces, loading, error };
}

export function useExecutions(workflowId: string | null) {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ap.getExecutions(workflowId);
      setExecutions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchExecutions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, [fetchExecutions]);

  return { executions, loading, error, refresh: fetchExecutions };
}

export function useConnections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ap.getConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const createConnection = useCallback(async (name: string, type: string, credentials: any) => {
    try {
      const connection = await ap.createConnection(name, type, credentials);
      setConnections([...connections, connection]);
      return connection;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
      throw err;
    }
  }, [connections]);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      await ap.deleteConnection(id);
      setConnections(connections.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
      throw err;
    }
  }, [connections]);

  return { 
    connections, 
    loading, 
    error, 
    createConnection, 
    deleteConnection, 
    refresh: fetchConnections 
  };
}
