/**
 * MCP (Model Context Protocol) Client Integration
 * Helps users connect to Activepieces MCP server from Claude/Cursor/Windsurf
 * 
 * Activepieces provides the MCP server with 500+ integrations
 * This library helps users configure their AI tools to access it
 */

export * from './types';
export * from './config';
export * from './utils';
export * from './client';

// Re-export commonly used client-side functions
export {
  setupMCPForUser,
  getMCPConfiguration,
  listMCPTools,
  getMCPToolSchema,
  generateMCPSetupInstructions,
  checkMCPHealth,
  exportMCPConfiguration,
} from './config';

export {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateWindsurfConfig,
} from './client';

export {
  formatToolName,
  isCommonPiece,
  groupToolsByPiece,
  sortToolsByRelevance,
  generateToolDocumentation,
  validateMCPPermissions,
} from './utils';
