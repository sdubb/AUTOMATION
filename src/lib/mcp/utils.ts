/**
 * MCP Integration Utilities
 * Helper functions for common MCP operations
 */

/**
 * Format MCP URL for AI client configuration
 */
export function formatMCPServerUrl(baseUrl: string, userId: string, token: string): string {
  return `${baseUrl}/mcp/server/${userId}?token=${token}`;
}

/**
 * Parse MCP server URL to extract components
 */
export function parseMCPServerUrl(url: string): {
  baseUrl: string;
  userId: string;
  token: string;
} | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/mcp\/server\/([^/?]+)/);
    const token = urlObj.searchParams.get('token');

    if (!match || !match[1] || !token) {
      return null;
    }

    return {
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      userId: match[1],
      token,
    };
  } catch {
    return null;
  }
}

/**
 * Validate MCP token format
 */
export function isValidMCPToken(token: string): boolean {
  return token.startsWith('mcp_') && token.length === 45;
}

/**
 * Generate QR code data for MCP setup
 * Returns data URL that can be used with QR code generator
 */
export function generateMCPSetupQRData(mcpUrl: string): string {
  return `${mcpUrl}`;
}

/**
 * Format tool name for display
 */
export function formatToolName(toolName: string): {
  pieceName: string;
  actionName: string;
  displayName: string;
} {
  const parts = toolName.split('__');
  if (parts.length !== 2) {
    return {
      pieceName: toolName,
      actionName: '',
      displayName: toolName,
    };
  }

  const pieceName = parts[0];
  const actionName = parts[1];

  // Convert snake_case to Title Case
  const toTitleCase = (str: string) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return {
    pieceName,
    actionName,
    displayName: `${toTitleCase(pieceName)} - ${toTitleCase(actionName)}`,
  };
}

/**
 * Check if piece is commonly used
 */
export function isCommonPiece(pieceName: string): boolean {
  const commonPieces = [
    'gmail',
    'slack',
    'salesforce',
    'hubspot',
    'stripe',
    'airtable',
    'sheets',
    'monday',
    'asana',
    'trello',
    'zapier',
    'webhook',
    'http',
    'delay',
    'conditional',
  ];

  return commonPieces.includes(pieceName.toLowerCase());
}

/**
 * Group tools by piece
 */
export function groupToolsByPiece(
  tools: Array<{ name: string; description: string }>
): Record<string, Array<{ name: string; description: string }>> {
  const grouped: Record<string, Array<{ name: string; description: string }>> = {};

  tools.forEach(tool => {
    const parts = tool.name.split('__');
    const pieceName = parts[0];

    if (!grouped[pieceName]) {
      grouped[pieceName] = [];
    }

    grouped[pieceName].push(tool);
  });

  return grouped;
}

/**
 * Sort tools by relevance (common pieces first)
 */
export function sortToolsByRelevance(
  tools: Array<{ name: string; description: string }>
): Array<{ name: string; description: string }> {
  return [...tools].sort((a, b) => {
    const aPieceName = a.name.split('__')[0];
    const bPieceName = b.name.split('__')[0];

    const aIsCommon = isCommonPiece(aPieceName) ? 1 : 0;
    const bIsCommon = isCommonPiece(bPieceName) ? 1 : 0;

    return bIsCommon - aIsCommon;
  });
}

/**
 * Generate documentation for MCP tool
 */
export function generateToolDocumentation(
  toolName: string,
  schema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  }
): string {
  const { pieceName, actionName, displayName } = formatToolName(toolName);

  let doc = `# ${displayName}\n\n`;
  doc += `**Tool Name:** \`${toolName}\`\n\n`;

  doc += `## Input Parameters\n\n`;

  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    doc += 'No parameters required.\n\n';
  } else {
    doc += '| Parameter | Type | Required | Description |\n';
    doc += '|-----------|------|----------|-------------|\n';

    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const isRequired = schema.required?.includes(key) ? '✓' : '';
      const type = value.type || 'unknown';
      const description = value.description || '';

      doc += `| \`${key}\` | ${type} | ${isRequired} | ${description} |\n`;
    });
  }

  doc += `\n## Usage Example\n\n`;
  doc += `\`\`\`json\n`;
  doc += `{\n`;
  doc += `  "tool": "${toolName}",\n`;
  doc += `  "input": {\n`;

  if (schema.properties) {
    const properties = Object.entries(schema.properties)
      .map(([key]) => `    "${key}": "value"`)
      .join(',\n');
    doc += properties;
  }

  doc += `\n  }\n`;
  doc += `}\n`;
  doc += `\`\`\`\n`;

  return doc;
}

/**
 * Get installation command for different OS
 */
export function getInstallCommand(os: 'mac' | 'windows' | 'linux'): string {
  const commands: Record<string, string> = {
    mac: 'npm install -g @activepieces/cli',
    windows: 'npm install -g @activepieces/cli',
    linux: 'npm install -g @activepieces/cli',
  };

  return commands[os] || commands['linux'];
}

/**
 * Create MCP setup deep link for web UI
 */
export function createMCPSetupDeepLink(
  baseUrl: string,
  userId: string,
  clientType: 'claude-desktop' | 'cursor' | 'windsurf'
): string {
  const params = new URLSearchParams({
    userId,
    clientType,
  });

  return `${baseUrl}/setup/mcp?${params.toString()}`;
}

/**
 * Validate MCP permissions
 */
export function validateMCPPermissions(permissions: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (permissions.canExecute !== undefined && typeof permissions.canExecute !== 'boolean') {
    errors.push('canExecute must be a boolean');
  }

  if (permissions.canRead !== undefined && typeof permissions.canRead !== 'boolean') {
    errors.push('canRead must be a boolean');
  }

  if (permissions.canCreate !== undefined && typeof permissions.canCreate !== 'boolean') {
    errors.push('canCreate must be a boolean');
  }

  if (
    permissions.rateLimitPerMinute !== undefined &&
    (typeof permissions.rateLimitPerMinute !== 'number' || permissions.rateLimitPerMinute <= 0)
  ) {
    errors.push('rateLimitPerMinute must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create MCP deep link for sharing configuration
 */
export function createMCPShareLink(
  baseUrl: string,
  exportedConfig: unknown
): string {
  const encoded = btoa(JSON.stringify(exportedConfig));
  return `${baseUrl}/setup/mcp/import?config=${encoded}`;
}

/**
 * Decode MCP shared configuration
 */
export function decodeMCPSharedConfig(encoded: string): unknown {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}
