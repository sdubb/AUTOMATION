/**
 * MCP (Model Context Protocol) Type Definitions
 * Standardizes types for AI client integrations (Claude Desktop, Cursor, Windsurf)
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface MCPServer {
  protocol: 'stdio' | 'sse';
  name: string;
  version: string;
  tools: MCPTool[];
}

export interface MCPToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
  userId: string;
}

export interface MCPToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface MCPServerConfig {
  userId: string;
  token: string;
  enabledPieces: string[];
  permissions: MCPPermissions;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MCPPermissions {
  canExecute: boolean;
  canRead: boolean;
  canCreate: boolean;
  allowedPieces?: string[];
  rateLimitPerMinute?: number;
}

export interface MCPClientConfig {
  clientType: 'claude-desktop' | 'cursor' | 'windsurf';
  serverUrl: string;
  config?: Record<string, unknown>;
}

/**
 * Activepieces Piece definition
 * Represents an integration that can be exposed as MCP tool
 */
export interface ActivepiecesPiece {
  name: string;
  displayName: string;
  description: string;
  logoUrl?: string;
  docUrl?: string;
  version?: string;
  triggers?: PieceTrigger[];
  actions: PieceAction[];
  auth?: PieceAuth[];
}

export interface PieceTrigger {
  name: string;
  displayName: string;
  description: string;
  props?: Record<string, PropertyDefinition>;
  sampleData?: Record<string, unknown>;
}

export interface PieceAction {
  name: string;
  displayName: string;
  description: string;
  props: Record<string, PropertyDefinition>;
  sampleData?: Record<string, unknown>;
}

export interface PieceAuth {
  name: string;
  displayName: string;
  type: 'oauth2' | 'api_key' | 'basic' | 'custom';
  props?: Record<string, PropertyDefinition>;
}

export interface PropertyDefinition {
  displayName: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}
