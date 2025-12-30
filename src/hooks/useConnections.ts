/**
 * useConnections Hook
 * Manages connection/integration operations with ActivePieces backend
 */

import { useState, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';

interface Connection {
  id: string;
  name: string;
  appName: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useConnections() {
  const { api } = useApi();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.connections.list();
      setConnections(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const createConnection = useCallback(
    async (data: {
      name: string;
      appName: string;
      config: Record<string, unknown>;
    }) => {
      setError(null);
      try {
        const newConnection = await api.connections.create(data);
        setConnections((prev) => [...prev, newConnection]);
        return newConnection;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create connection';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const updateConnection = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setError(null);
      try {
        const updated = await api.connections.update(id, data);
        setConnections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update connection';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await api.connections.delete(id);
        setConnections((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete connection';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const testConnection = useCallback(
    async (id: string) => {
      setError(null);
      try {
        return await api.connections.test(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection test failed';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  return {
    connections,
    isLoading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
  };
}
