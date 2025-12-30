/**
 * useAutomations Hook
 * Manages automation CRUD operations with ActivePieces backend
 */

import { useState, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';

interface Automation {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  actions: Array<Record<string, unknown>>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAutomations() {
  const { api } = useApi();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.automations.list();
      setAutomations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch automations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const createAutomation = useCallback(
    async (data: {
      name: string;
      trigger: string;
      triggerConfig: Record<string, unknown>;
      actions: Array<Record<string, unknown>>;
    }) => {
      setError(null);
      try {
        const newAutomation = await api.automations.create(data);
        setAutomations((prev) => [...prev, newAutomation]);
        return newAutomation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create automation';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const updateAutomation = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setError(null);
      try {
        const updated = await api.automations.update(id, data);
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update automation';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const deleteAutomation = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await api.automations.delete(id);
        setAutomations((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete automation';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  const executeAutomation = useCallback(
    async (id: string, payload?: Record<string, unknown>) => {
      setError(null);
      try {
        return await api.automations.execute(id, payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute automation';
        setError(message);
        throw err;
      }
    },
    [api]
  );

  return {
    automations,
    isLoading,
    error,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    executeAutomation,
  };
}
