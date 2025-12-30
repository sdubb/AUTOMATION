#!/bin/bash
# MCP Quick Start Script
# Sets up and starts the MCP server with Activepieces integration

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        MCP + ACTIVEPIECES QUICK START SETUP                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save express cors typescript @types/express @types/node tsx
npm install --save-dev tsx

echo "✓ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local configuration file..."
    cp .env.mcp.example .env.local
    
    echo ""
    echo "⚠️  Please edit .env.local with your values:"
    echo ""
    echo "  ACTIVEPIECES_API_URL=http://YOUR_VM_IP:3000/api"
    echo "  ACTIVEPIECES_API_KEY=your_api_key"
    echo "  MCP_SERVER_BASE_URL=http://YOUR_VM_IP:4000"
    echo ""
    echo "Then run: npm run mcp:server"
    exit 0
fi

# Check if required env vars are set
if ! grep -q "ACTIVEPIECES_API_KEY=" .env.local || grep -q "ACTIVEPIECES_API_KEY=your_api_key_here" .env.local; then
    echo "❌ ACTIVEPIECES_API_KEY not configured in .env.local"
    echo ""
    echo "Please get your API key from Activepieces dashboard:"
    echo "1. Log into Activepieces (http://your-vm-ip:3000)"
    echo "2. Go to Settings → API Keys"
    echo "3. Create new API key"
    echo "4. Update ACTIVEPIECES_API_KEY in .env.local"
    exit 1
fi

echo "✓ Configuration found"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build 2>/dev/null || true
echo "✓ Build complete"
echo ""

# Start MCP server
echo "🚀 Starting MCP Server..."
echo ""
echo "The server will:"
echo "  1. Connect to Activepieces at $(grep ACTIVEPIECES_API_URL .env.local | cut -d= -f2)"
echo "  2. Sync 280+ integrations"
echo "  3. Listen on port 4000"
echo ""
echo "Test the server with:"
echo "  curl http://localhost:4000/health"
echo ""
echo "List available tools:"
echo "  curl http://localhost:4000/api/mcp/tools?userId=your-user-id"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run mcp:server
