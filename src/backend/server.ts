/**
 * Backend Server File
 * NOTE: This file is not used in current setup
 * Activepieces MCP server is provided by Activepieces itself
 * Frontend connects directly to Activepieces running in Docker
 */

import express, { Express } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = parseInt(process.env.MCP_SERVER_PORT || '4000');
const HOST = process.env.MCP_SERVER_HOST || 'localhost';

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-MCP-Token'],
};

app.use(cors(corsOptions));

// ==========================================
// HEALTH & STATUS ROUTES
// ==========================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mcp-server',
    timestamp: new Date().toISOString(),
  });
});

app.get('/status', (_req, res) => {
  res.json({
    service: 'mcp-server',
    uptime: process.uptime(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      activepiecesUrl: process.env.ACTIVEPIECES_API_URL,
      mcpServerUrl: process.env.MCP_SERVER_BASE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    // Note: MCP server is provided by Activepieces
    // This frontend connects to Activepieces Docker instance

    // Start Express server
    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         MCP SERVER STARTED SUCCESSFULLY ✓                ║
║                                                          ║
║  URL:        http://${HOST}:${PORT}                      ║
║  Health:     http://${HOST}:${PORT}/health             ║
║  Status:     http://${HOST}:${PORT}/status             ║
║                                                          ║
║  Endpoints:                                              ║
║  • /api/mcp/tools                  - List tools          ║
║  • /api/mcp/execute                - Execute tool       ║
║  • /api/mcp/setup                  - Setup user         ║
║  • /api/mcp/sync/manual            - Manual sync        ║
║                                                          ║
║  Activepieces:  ${process.env.ACTIVEPIECES_API_URL}    ║
║  Base URL:      ${process.env.MCP_SERVER_BASE_URL}     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('[MCP] Failed to start server:', err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[MCP] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[MCP] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
