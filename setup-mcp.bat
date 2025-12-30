@echo off
REM MCP Quick Start Script (Windows)
REM Sets up and starts the MCP server with Activepieces integration

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        MCP + ACTIVEPIECES QUICK START SETUP                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --save express cors typescript @types/express @types/node tsx >nul 2>&1
call npm install --save-dev tsx >nul 2>&1

echo ✓ Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist ".env.local" (
    echo 📝 Creating .env.local configuration file...
    type .env.mcp.example > .env.local
    
    echo.
    echo ⚠️  Please edit .env.local with your values:
    echo.
    echo  ACTIVEPIECES_API_URL=http://YOUR_VM_IP:3000/api
    echo  ACTIVEPIECES_API_KEY=your_api_key
    echo  MCP_SERVER_BASE_URL=http://YOUR_VM_IP:4000
    echo.
    echo Then run: npm run mcp:server
    exit /b 0
)

REM Check if required env vars are set
findstr /M "ACTIVEPIECES_API_KEY=your_api_key_here" .env.local >nul
if %errorlevel% equ 0 (
    echo ❌ ACTIVEPIECES_API_KEY not configured in .env.local
    echo.
    echo Please get your API key from Activepieces dashboard:
    echo 1. Log into Activepieces (http://your-vm-ip:3000)
    echo 2. Go to Settings ^→ API Keys
    echo 3. Create new API key
    echo 4. Update ACTIVEPIECES_API_KEY in .env.local
    exit /b 1
)

echo ✓ Configuration found
echo.

REM Build TypeScript
echo 🔨 Building TypeScript...
call npm run build >nul 2>&1
echo ✓ Build complete
echo.

REM Extract config values
for /f "tokens=2 delims==" %%a in ('type .env.local ^| findstr "ACTIVEPIECES_API_URL"') do set AP_URL=%%a

REM Start MCP server
echo 🚀 Starting MCP Server...
echo.
echo The server will:
echo  1. Connect to Activepieces at %AP_URL%
echo  2. Sync 280+ integrations
echo  3. Listen on port 4000
echo.
echo Test the server with:
echo  curl http://localhost:4000/health
echo.
echo List available tools:
echo  curl http://localhost:4000/api/mcp/tools?userId=your-user-id
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run mcp:server
