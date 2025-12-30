/**
 * MCP Client Configuration
 * Helps users connect to Activepieces MCP server from Claude/Cursor/Windsurf
 */

export interface MCPClientSetup {
  clientType: 'claude-desktop' | 'cursor' | 'windsurf';
  configPath: string;
  instructions: string;
  configTemplate: Record<string, unknown>;
}

/**
 * Generate Claude Desktop MCP configuration
 * Users need to add this to ~/.claude_desktop_config.json
 */
export function generateClaudeDesktopConfig(activepiecesUrl: string): MCPClientSetup {
  return {
    clientType: 'claude-desktop',
    configPath: '~/.claude_desktop_config.json',
    instructions: `
1. Open ~/.claude_desktop_config.json (create if it doesn't exist)
2. Add the following to the "mcpServers" section:

{
  "mcpServers": {
    "activepieces": {
      "command": "npx",
      "args": ["activepieces-mcp-server"],
      "env": {
        "ACTIVEPIECES_URL": "${activepiecesUrl}",
        "ACTIVEPIECES_API_KEY": "your_api_key_here"
      }
    }
  }
}

3. Save and restart Claude Desktop
4. Claude will now have access to 500+ integrations via Activepieces
`,
    configTemplate: {
      mcpServers: {
        activepieces: {
          command: 'npx',
          args: ['activepieces-mcp-server'],
          env: {
            ACTIVEPIECES_URL: activepiecesUrl,
            ACTIVEPIECES_API_KEY: 'your_api_key_here',
          },
        },
      },
    },
  };
}

/**
 * Generate Cursor MCP configuration
 * Users need to add this to .cursor/mcp_server.json
 */
export function generateCursorConfig(activepiecesUrl: string): MCPClientSetup {
  return {
    clientType: 'cursor',
    configPath: '.cursor/mcp_server.json',
    instructions: `
1. Create or edit .cursor/mcp_server.json in your project root
2. Add the following configuration:

{
  "mcpServers": [
    {
      "name": "activepieces",
      "command": "npx",
      "args": ["activepieces-mcp-server"],
      "env": {
        "ACTIVEPIECES_URL": "${activepiecesUrl}",
        "ACTIVEPIECES_API_KEY": "your_api_key_here"
      }
    }
  ]
}

3. Save the file
4. Restart Cursor
5. Cursor will now have access to 500+ Activepieces integrations as tools
`,
    configTemplate: {
      mcpServers: [
        {
          name: 'activepieces',
          command: 'npx',
          args: ['activepieces-mcp-server'],
          env: {
            ACTIVEPIECES_URL: activepiecesUrl,
            ACTIVEPIECES_API_KEY: 'your_api_key_here',
          },
        },
      ],
    },
  };
}

/**
 * Generate Windsurf MCP configuration
 * Users need to add this to .windsurf/mcp_server.json
 */
export function generateWindsurfConfig(activepiecesUrl: string): MCPClientSetup {
  return {
    clientType: 'windsurf',
    configPath: '.windsurf/mcp_server.json',
    instructions: `
1. Create or edit .windsurf/mcp_server.json in your project root
2. Add the following configuration:

{
  "mcpServers": [
    {
      "name": "activepieces",
      "command": "npx",
      "args": ["activepieces-mcp-server"],
      "env": {
        "ACTIVEPIECES_URL": "${activepiecesUrl}",
        "ACTIVEPIECES_API_KEY": "your_api_key_here"
      }
    }
  ]
}

3. Save the file
4. Restart Windsurf
5. Windsurf will now have access to 500+ Activepieces integrations as tools
`,
    configTemplate: {
      mcpServers: [
        {
          name: 'activepieces',
          command: 'npx',
          args: ['activepieces-mcp-server'],
          env: {
            ACTIVEPIECES_URL: activepiecesUrl,
            ACTIVEPIECES_API_KEY: 'your_api_key_here',
          },
        },
      ],
    },
  };
}
