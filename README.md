# AI-Driven Automation Platform (Stage 1)

A clean, AI-powered automation platform that replaces manual workflow setup using natural language. Users describe what they want to automate in one sentence, and the system handles the rest.

## Overview

This is Stage-1 of an automation product that:
- Replaces manual workflow setup of tools like Zapier/n8n using AI
- Uses Groq for intelligent automation planning
- Uses Activepieces as execution engine with embedded UI for advanced editing
- Provides a simple, no-code interface

**Key Principle:** Activepieces is infrastructure, not product. Users never see or edit Activepieces UI. AI replaces manual workflow building.

## Architecture

```
Frontend (React + Vite)
   ↓
Backend API (Node.js/Express REST API)
   ↓
AI Planner (Groq LLM)
   ↓
Workflow Engine (Activepieces - private, headless)
   ↓
Database (PostgreSQL + Redis)
```

## Features

### Core Functionality
- **Natural Language Automation Creation**: Type what you want to automate in plain English
- **AI Planning**: Groq converts natural language into structured automation plans
- **Read-Only Visualization**: See what automations do in plain English (no editing)
- **Connection Management**: Store and manage OAuth tokens and API keys securely
- **Automation Dashboard**: View, pause, resume, and delete automations (status only, no editing)
- **Real-time Status Updates**: Track automation status (active, paused, error)
- **Optional MCP Access**: Connect Claude Desktop, Cursor, or Windsurf to Activepieces for direct integration access

### Supported Integrations

**500+ Activepieces Integrations Available**

The platform leverages Activepieces' 500+ integrations including (but not limited to):
- **Communication**: Slack, Discord, Microsoft Teams, Telegram
- **Email**: Gmail, Outlook, Mailchimp, SendGrid
- **CRM**: HubSpot, Salesforce, Pipedrive, Zoho
- **E-commerce**: Stripe, Shopify, WooCommerce, PayPal
- **Productivity**: Google Sheets, Airtable, Notion, Trello, Asana
- **Social Media**: Twitter, Facebook, LinkedIn, Instagram
- **Development**: GitHub, GitLab, Jira, Linear
- **AI**: OpenAI, Anthropic, Groq, Hugging Face
- **And 400+ more...**

The AI automatically maps your natural language requests to the appropriate Activepieces integration.

### Optional: AI Tools Integration (MCP)

Users can optionally connect their AI tools to Activepieces' MCP server for direct access to 500+ integrations:

**Supported AI Tools:**
- Claude Desktop
- Cursor
- Windsurf

See the Settings panel in the app for step-by-step MCP setup instructions for each tool.

## Setup Instructions

### Prerequisites
- Node.js 18+
- Groq API key (for AI automation planning)
- Activepieces running in Docker (on VM or local machine)

### 1. Start Activepieces (Docker)

Activepieces should already be running in Docker on your VM. Verify it's running:

```bash
# SSH into your VM and check Docker
docker ps | grep activepieces
```

**Expected output:**
```
activepieces container should be running on port 3000 (or your configured port)
```

### 2. Environment Configuration

**Frontend (.env.local)**:
```bash
# Activepieces Configuration (running in Docker)
VITE_ACTIVEPIECES_URL=http://YOUR_VM_IP:3000
VITE_ACTIVEPIECES_API_KEY=your_activepieces_api_key

# Groq AI Configuration (for natural language automation planning)
VITE_GROQ_API_KEY=your_groq_api_key
```

Replace `YOUR_VM_IP` with your VM's IP address (e.g., `192.168.1.100` or your cloud VM IP)

### 3. Build & Deploy Frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                   YOUR VM (Docker)                   │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Activepieces Container                    │    │
│  │  • Port 3000 (API)                         │    │
│  │  • 500+ Integrations                       │    │
│  │  • MCP Server (for Claude/Cursor/Windsurf)│    │
│  └────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
            ↑
            │ HTTP API Calls
            │
┌──────────────────────────────────────────────────────┐
│              Frontend (Deployed)                     │
│                                                      │
│  • React + Vite                                     │
│  • Groq AI Integration                              │
│  • Dashboard & Automation Creator                   │
│  • MCP Setup Instructions                           │
└──────────────────────────────────────────────────────┘
            ↑
            │ Browser Access
            │
      User's Browser
```

**Key Points:**
- **Activepieces in Docker** - All 500+ integrations + MCP server in one container
- **Frontend connects to Activepieces** - Via HTTP API calls to `VITE_ACTIVEPIECES_URL`
- **Groq handles AI planning** - Converts natural language to automation workflows
- **MCP optional** - Users can connect Claude/Cursor/Windsurf to Activepieces MCP server
ACTIVEPIECES_URL=http://localhost:3000
ACTIVEPIECES_API_KEY=your_activepieces_api_key

# JWT & Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE_IN=7d

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_SIGNING_ALGORITHM=sha256
```
- `automations` - Stores user automation configurations
- `connections` - Stores encrypted OAuth tokens and API keys
- `execution_logs` - Tracks automation execution history
- `allowed_integrations` - Defines supported integrations

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Guide

### Creating Your First Automation

1. **Sign Up/Sign In**: Create an account or sign in
2. **Add Connections**: Click "Add Connection" and provide API keys for services you want to use
3. **Create Automation**: Type what you want to automate in plain English

Example prompts:
```
"Notify me on Slack when I get a Stripe payment"
"Add new Gmail emails to Google Sheets"
"Send a Slack message when a webhook is received"
```

4. **Review Plan**: The AI will show you the planned automation structure
5. **Confirm**: Click "Create Automation" to activate it

### Managing Automations

- **Pause/Resume**: Click the pause/play button on any automation
- **Delete**: Remove automations you no longer need
- **Monitor Status**: View real-time status (active, paused, error)

## API Endpoints

### Edge Functions

#### 1. `plan-automation`
Converts natural language to structured automation plan using Groq.

**Request:**
```json
{
  "prompt": "Notify me on Slack when I get a Stripe payment"
}
```

**Response:**
```json
{
  "name": "Stripe payment to Slack notification",
  "trigger": "stripe.payment_received",
  "trigger_config": {},
  "actions": [
    {
      "service": "slack",
      "action": "send_message",
      "config": {
        "channel": "#general",
        "message": "New payment received: {{amount}}"
      }
    }
  ],
  "required_auth": ["stripe", "slack"]
}
```

#### 2. `manage-connections`
Manage OAuth tokens and API keys.

**GET**: List all connections
**POST**: Create/update a connection
**DELETE**: Remove a connection

#### 3. `manage-automations`
Manage user automations.

**GET**: List all automations
**POST**: Create a new automation
**PUT**: Update automation status (pause/resume)
**DELETE**: Delete an automation

## Database Schema

### `automations` Table
Stores automation configurations with AI-parsed structure.

### `connections` Table
Securely stores encrypted credentials for external services.

### `execution_logs` Table
Tracks automation runs and results for debugging and monitoring.

### `allowed_integrations` Table
Defines the fixed allow-list of supported integrations.

## Security

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Encrypted Credentials**: All API keys and tokens stored securely
- **JWT Authentication**: All API calls require valid authentication

## Activepieces Integration

**Activepieces is infrastructure, not product.**

1. **Backend-Only**: Activepieces runs on your server, users never see it
2. **API Integration**: Backend creates workflows via Activepieces API
3. **Execution Engine**: Activepieces executes workflows automatically
4. **No UI Exposure**: Users never see Activepieces UI, nodes, or editors

### Setup

1. Self-host Activepieces on a server (VPS, cloud instance, etc.)
2. Configure environment variables in Supabase Edge Functions:
   - `ACTIVEPIECES_URL` - Your Activepieces instance URL
   - `ACTIVEPIECES_API_KEY` - API key for creating workflows
3. Keep Activepieces UI completely hidden from users
4. Users only see: automation name, status (Running/Failed), and what it does (plain English)

## Limitations (Stage 1)

This is NOT:
- An agent system
- Self-healing
- A full V3/V4 platform

This IS:
- A clean replacement of manual workflow setup
- AI-powered automation planning
- Simple one-sentence automation creation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: Groq (mixtral-8x7b-32768)
- **Execution Engine**: Activepieces (headless)
- **Icons**: Lucide React

## Future Enhancements (Beyond Stage 1)

- OAuth 2.0 flow for supported services
- Real-time execution monitoring
- Execution history and logs UI
- More integration options
- Conditional logic and branching
- Error handling and retries
- Webhook URLs for trigger-based automations

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
