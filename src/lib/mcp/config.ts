/**
 * MCP Configuration Service
 * Manages user MCP server setup, tokens, and permissions
 */

import { MCPServerConfig, MCPPermissions } from './types';
import { mcpManager } from './server';

/**
 * Generate unique MCP server token for user
 */
function generateMCPToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'mcp_';
  for (let i = 0; i < 40; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create MCP server configuration for user
 */
export function createMCPServerConfig(
  userId: string,
  options: {
    enabledPieces?: string[];
    permissions?: Partial<MCPPermissions>;
    expirationDays?: number;
  } = {}
): MCPServerConfig {
  const permissions: MCPPermissions = {
    canExecute: true,
    canRead: true,
    canCreate: false,
    rateLimitPerMinute: 60,
    ...options.permissions,
  };

  const expiresAt = options.expirationDays
    ? new Date(Date.now() + options.expirationDays * 24 * 60 * 60 * 1000)
    : undefined;

  const config: MCPServerConfig = {
    userId,
    token: generateMCPToken(),
    enabledPieces: options.enabledPieces || [],
    permissions,
    createdAt: new Date(),
    expiresAt,
  };

  return config;
}

/**
 * Setup MCP for user - returns configuration for Claude/Cursor/Windsurf
 */
export function setupMCPForUser(
  userId: string,
  enabledPieces: string[] = []
): {
  token: string;
  configs: {
    claudeDesktop: Record<string, unknown>;
    cursor: Record<string, unknown>;
    windsurf: Record<string, unknown>;
  };
} {
  const config = createMCPServerConfig(userId, { enabledPieces });
  const server = mcpManager.getOrCreateServer(config);

  return {
    token: config.token,
    configs: {
      claudeDesktop: server.getClaudeDesktopConfig(),
      cursor: server.getCursorConfig(),
      windsurf: server.getWindsurfConfig(),
    },
  };
}

/**
 * Get MCP configuration for existing user
 */
export function getMCPConfiguration(userId: string): {
  token?: string;
  tools: Array<{ name: string; description: string }>;
  config?: Record<string, unknown>;
} {
  const server = mcpManager.getServer(userId);
  if (!server) {
    return {
      tools: [],
    };
  }

  const tools = server.getTools().map(t => ({
    name: t.name,
    description: t.description,
  }));

  return {
    token: server.getConfig().token,
    tools,
    config: server.getConfig(),
  };
}

/**
 * Update MCP permissions for user
 */
export function updateMCPPermissions(
  userId: string,
  permissions: Partial<MCPPermissions>
): boolean {
  const server = mcpManager.getServer(userId);
  if (!server) {
    return false;
  }

  const config = server.getConfig();
  config.permissions = {
    ...config.permissions,
    ...permissions,
  };

  return true;
}

/**
 * Revoke MCP access for user
 */
export function revokeMCPAccess(userId: string): boolean {
  mcpManager.removeServer(userId);
  return true;
}

/**
 * Get Claude Desktop config as JSON
 */
export function getClaudeDesktopConfigJson(userId: string): string {
  const server = mcpManager.getServer(userId);
  if (!server) {
    throw new Error('MCP not configured for user');
  }

  const config = {
    mcpServers: {
      activepieces: server.getClaudeDesktopConfig(),
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Get Cursor config as JSON
 */
export function getCursorConfigJson(userId: string): string {
  const server = mcpManager.getServer(userId);
  if (!server) {
    throw new Error('MCP not configured for user');
  }

  const config = {
    mcpServers: {
      activepieces: server.getCursorConfig(),
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Get Windsurf config as JSON
 */
export function getWindsurfConfigJson(userId: string): string {
  const server = mcpManager.getServer(userId);
  if (!server) {
    throw new Error('MCP not configured for user');
  }

  const config = {
    mcpServers: {
      activepieces: server.getWindsurfConfig(),
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Get all available tools for user
 */
export function listMCPTools(userId: string): Array<{
  name: string;
  description: string;
  pieceName: string;
  actionName: string;
}> {
  const server = mcpManager.getServer(userId);
  if (!server) {
    return [];
  }

  return server.getTools().map(tool => {
    const parts = tool.name.split('__');
    return {
      name: tool.name,
      description: tool.description,
      pieceName: parts[0],
      actionName: parts[1],
    };
  });
}

/**
 * Get tool schema (input specification)
 */
export function getMCPToolSchema(userId: string, toolName: string): Record<string, unknown> | null {
  const server = mcpManager.getServer(userId);
  if (!server) {
    return null;
  }

  const tool = server.getTool(toolName);
  if (!tool) {
    return null;
  }

  return tool.inputSchema;
}

/**
 * Generate setup instructions for user
 */
export function generateMCPSetupInstructions(userId: string, clientType: 'claude-desktop' | 'cursor' | 'windsurf'): string {
  const server = mcpManager.getServer(userId);
  if (!server) {
    return 'MCP not configured. Please set up MCP first.';
  }

  const instructions: Record<string, string> = {
    'claude-desktop': `
# Claude Desktop Setup

1. Open your Claude Desktop configuration file:
   - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   - Windows: %APPDATA%\\Claude\\claude_desktop_config.json
   - Linux: ~/.config/Claude/claude_desktop_config.json

2. Add this MCP server configuration:

\`\`\`json
${getClaudeDesktopConfigJson(userId)}
\`\`\`

3. Restart Claude Desktop

4. In Claude, you should now see a "Tools" section with 280+ Activepieces integrations available
`,

    'cursor': `
# Cursor Setup

1. Open Cursor Settings > Tools & Integrations

2. Click "New MCP Server"

3. Add this configuration:

\`\`\`json
${getCursorConfigJson(userId)}
\`\`\`

4. Click "Add"

5. Restart Cursor

6. You should now see Activepieces tools available in your AI context
`,

    'windsurf': `
# Windsurf Setup

1. Open Windsurf Settings > Tools & Integrations

2. Click "Add MCP Server"

3. Paste this configuration:

\`\`\`json
${getWindsurfConfigJson(userId)}
\`\`\`

4. Click "Connect"

5. Restart Windsurf

6. Activepieces tools should now be available in your AI context
`,
  };

  return instructions[clientType] || 'Unknown client type';
}

/**
 * Get MCP status/health check
 */
export function checkMCPHealth(userId: string): {
  configured: boolean;
  toolCount: number;
  tokenValid: boolean;
  permissionsGranted: string[];
} {
  const server = mcpManager.getServer(userId);

  if (!server) {
    return {
      configured: false,
      toolCount: 0,
      tokenValid: false,
      permissionsGranted: [],
    };
  }

  const config = server.getConfig();
  const permissions = config.permissions;
  const grantedPermissions: string[] = [];

  if (permissions.canExecute) grantedPermissions.push('execute');
  if (permissions.canRead) grantedPermissions.push('read');
  if (permissions.canCreate) grantedPermissions.push('create');

  return {
    configured: true,
    toolCount: server.getTools().length,
    tokenValid: server.isTokenValid(),
    permissionsGranted,
  };
}

/**
 * Export MCP configuration as file (for backup/sharing)
 */
export function exportMCPConfiguration(userId: string): {
  config: MCPServerConfig;
  claudeDesktopConfig: Record<string, unknown>;
  cursorConfig: Record<string, unknown>;
  windsurfConfig: Record<string, unknown>;
} {
  const server = mcpManager.getServer(userId);
  if (!server) {
    throw new Error('MCP not configured for user');
  }

  const config = server.getConfig();

  return {
    config,
    claudeDesktopConfig: server.getClaudeDesktopConfig(),
    cursorConfig: server.getCursorConfig(),
    windsurfConfig: server.getWindsurfConfig(),
  };
}
