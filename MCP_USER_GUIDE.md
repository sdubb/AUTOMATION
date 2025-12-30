# MCP (Model Context Protocol) - User Access Guide

## What Users Get

Users have **TWO ways** to access 500+ integrations:

### 1. **Web Interface** (Default)
- Users log into the web app
- Type what they want to automate in natural language
- Groq AI plans it automatically
- Activepieces executes it
- **No setup needed for this mode**

### 2. **Direct AI Tool Access** (Optional MCP)
- Users optionally connect Claude Desktop, Cursor, or Windsurf
- These AI tools get direct access to 500+ integrations via Activepieces' MCP server
- Users can describe automations directly in their AI tools
- **Setup required**: Users configure their AI tool with Activepieces MCP server details

---

## How Users Enable MCP

### For Claude Desktop:
1. Open Settings panel → "MCP Setup"
2. Click "Claude Desktop" tab
3. Follow instructions to update `~/.claude_desktop_config.json`
4. Add Activepieces URL and API key
5. Restart Claude Desktop

### For Cursor:
1. Open Settings panel → "MCP Setup"
2. Click "Cursor" tab
3. Follow instructions to create `.cursor/mcp_server.json`
4. Add Activepieces URL and API key
5. Restart Cursor

### For Windsurf:
1. Open Settings panel → "MCP Setup"
2. Click "Windsurf" tab
3. Follow instructions to create `.windsurf/mcp_server.json`
4. Add Activepieces URL and API key
5. Restart Windsurf

---

## What Users Need

To use MCP:
1. **Activepieces running in Docker** - Already set up on your VM
2. **Activepieces API Key** - From Activepieces Dashboard running in Docker
3. **AI tool installed** - Claude Desktop, Cursor, or Windsurf
4. **VM IP/Domain** - To connect to Activepieces MCP server

### Getting Activepieces API Key

1. Open Activepieces in browser: `http://YOUR_VM_IP:3000`
2. Log in to your account
3. Go to Settings → API Keys
4. Create or copy your API key
5. Use this key when setting up MCP in Claude/Cursor/Windsurf

---

## Getting Your VM IP

**For local VM:**
```bash
# On your VM, run:
hostname -I   # Linux
ipconfig      # Windows
```

**For cloud VM (AWS, GCP, Azure):**
- Use the public IP assigned by your cloud provider
- Usually found in your cloud dashboard

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Your Local Machine                         │
│                                                             │
│  ┌──────────────────┐      ┌─────────────────────────┐    │
│  │  Web Browser     │      │  Claude/Cursor/Windsurf │    │
│  │  (Frontend App)  │      │  (AI Tool with MCP)     │    │
│  └────────┬─────────┘      └────────────┬────────────┘    │
│           │                             │                 │
└───────────┼─────────────────────────────┼─────────────────┘
            │                             │
            ↓                             ↓
┌────────────────────────────────────────────────────────┐
│         Your VM (Docker)                               │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Activepieces Container (Port 3000)             │  │
│  │  • API Endpoints                                │  │
│  │  • MCP Server                                   │  │
│  │  • 500+ Integrations                            │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     Slack        Gmail          Stripe
    Discord      Notion         Google Sheets
     Teams        ...          ... 500+ more
```

**Connection Flow:**
1. Frontend → Activepieces API (HTTP)
2. Claude/Cursor/Windsurf → Activepieces MCP Server (MCP protocol)
3. Both connect to same Docker instance

---

## File Structure

**Frontend MCP Files:**
- `src/lib/mcp/client.ts` - Generates setup instructions for Claude/Cursor/Windsurf
- `src/lib/mcp/config.ts` - User configuration management
- `src/lib/mcp/types.ts` - TypeScript definitions
- `src/lib/mcp/utils.ts` - Helper functions
- `src/components/MCPSetupComponent.tsx` - UI for MCP setup instructions

**Not Included:**
- ❌ Backend MCP server (Activepieces provides this)
- ❌ Express/Node.js backend
- ❌ Database backend

---

## User Experience Flow

### Without MCP (Web Only)
```
User Input (web)
      ↓
Groq AI Plans
      ↓
Activepieces Executes
      ↓
Result shown in Dashboard
```

### With MCP (Optional)
```
User Input (Claude/Cursor/Windsurf)
      ↓
Activepieces MCP Server responds
      ↓
Tool execution happens
      ↓
Result shown in AI tool
```

**Both modes work independently.** Users don't have to use MCP - it's optional.

---

## Summary for Users

- ✅ **Web app works without MCP** - Full automation capability
- ✅ **MCP is optional** - For power users who want AI tool integration
- ✅ **No backend needed** - Activepieces handles execution
- ✅ **Groq powers AI planning** - Natural language to automation
- ✅ **500+ integrations** - Via Activepieces

**Next Step:** Provide users with access to the MCPSetupComponent UI in Settings to enable optional MCP access.
