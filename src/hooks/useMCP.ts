/**
 * MCP React Hooks
 * UI integration hooks for MCP management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  setupMCPForUser,
  getMCPConfiguration,
  listMCPTools,
  getMCPToolSchema,
  generateMCPSetupInstructions,
  checkMCPHealth,
  exportMCPConfiguration,
  revokeMCPAccess,
} from '../lib/mcp';

export function useMCPSetup(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  const setup = useCallback(async (enabledPieces: string[] = []) => {
    setLoading(true);
    setError(null);

    try {
      const result = setupMCPForUser(userId, enabledPieces);
      setData(result);
      return result;
    } catch (err) {
      const message = String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { setup, loading, error, data };
}

export function useMCPConfiguration(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = getMCPConfiguration(userId);
        if (mounted) {
          setConfig(result);
        }
      } catch (err) {
        if (mounted) {
          setError(String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { config, loading, error };
}

export function useMCPTools(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = listMCPTools(userId);
        if (mounted) {
          setTools(result);
        }
      } catch (err) {
        if (mounted) {
          setError(String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { tools, loading, error };
}

export function useMCPToolSchema(userId: string, toolName: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = getMCPToolSchema(userId, toolName);
        if (mounted) {
          setSchema(result);
        }
      } catch (err) {
        if (mounted) {
          setError(String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [userId, toolName]);

  return { schema, loading, error };
}

export function useMCPSetupInstructions(userId: string, clientType: 'claude-desktop' | 'cursor' | 'windsurf') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    try {
      const result = generateMCPSetupInstructions(userId, clientType);
      if (mounted) {
        setInstructions(result);
      }
    } catch (err) {
      if (mounted) {
        setError(String(err));
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [userId, clientType]);

  return { instructions, loading, error };
}

export function useMCPHealth(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const result = checkMCPHealth(userId);
      if (mounted) {
        setHealth(result);
      }
    } catch (err) {
      if (mounted) {
        setError(String(err));
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [userId]);

  return { health, loading, error };
}

export function useMCPExport(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = exportMCPConfiguration(userId);
      return result;
    } catch (err) {
      const message = String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { exportConfig, loading, error };
}

export function useMCPRevoke(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = revokeMCPAccess(userId);
      return result;
    } catch (err) {
      const message = String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { revoke, loading, error };
}
