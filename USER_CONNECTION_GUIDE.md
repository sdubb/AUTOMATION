# 🔗 USER CONNECTION GUIDE - Activepieces Integration

## Overview

This platform connects users to automation features through **Activepieces** and supporting services. Here's the complete user journey and all connection points.

---

## 1. User Authentication Flow

### Entry Point: Landing Page → Auth → Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                     Landing Page                            │
│              "Describe → Automate → Execute"                │
│                    ↓ "Get Started"                          │
├─────────────────────────────────────────────────────────────┤
│                  Auth Component                             │
│  ┌─────────────────┬──────────────────┐                    │
│  │   Sign In       │    Sign Up        │                    │
│  │ • Email         │ • Email           │                    │
│  │ • Password      │ • Password        │                    │
│  │                 │ • First Name      │                    │
│  └─────────────────┴──────────────────┘                    │
│         ↓ POST /auth/login (or register)                    │
├─────────────────────────────────────────────────────────────┤
│          Token Storage (localStorage)                       │
│    activepieces_token: "eyJhbGciOiJIUzI1NiI..."           │
│         ↓ Token verified with /auth/me                      │
├─────────────────────────────────────────────────────────────┤
│              Dashboard Modern                               │
│        (Authenticated Access to All Features)               │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Auth.tsx** - Login/signup form
- **AuthContext.tsx** - Global auth state
- **activepieces.ts** - API communication
- **localStorage** - Token persistence

**Code Flow:**
```typescript
// 1. User submits credentials
Auth.tsx → handleSubmit() → useAuth().signIn(email, password)

// 2. AuthContext sends to Activepieces
AuthContext.tsx → activepiecesAuth.ts → POST /auth/login

// 3. Token stored and verified
Token → localStorage.setItem('activepieces_token', token)
Token → apiCall() auto-includes Bearer header

// 4. User context populated
useAuth() returns { user, token, loading, signIn, signUp, signOut }

// 5. Dashboard renders
App.tsx → checks user ? <DashboardModern /> : <Auth />
```

---

## 2. Feature Access Points

### From Dashboard Navigation

```
┌─────────────────────────────────────────────────────────────┐
│               DashboardModern (Main Hub)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Automation│Connection│ Webhooks │Execution │Approvals │  │
│  │ Manager  │ Manager  │ Manager  │Analytics │ Manager  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│       ↓          ↓           ↓          ↓         ↓        │
├─────────────────────────────────────────────────────────────┤
│ 1. AUTOMATION TAB                                            │
│    └─ List all automations                                  │
│    └─ Create new (AutomationCreator)                        │
│    └─ Edit/Delete existing                                  │
│    └─ Execute manually                                      │
│       └─ See execution history                              │
│                                                              │
│ 2. CONNECTION TAB                                            │
│    └─ OAuth connections (Stripe, GitHub, etc.)              │
│    └─ Add new connection (Refresh token)                    │
│    └─ Revoke access                                         │
│    └─ View connection status                                │
│                                                              │
│ 3. WEBHOOKS TAB                                              │
│    └─ Inbound: Configure webhook triggers                   │
│    └─ Outbound: Send results to external URLs               │
│    └─ Test webhooks                                         │
│    └─ View delivery history                                 │
│       └─ Retry failed deliveries                            │
│                                                              │
│ 4. EXECUTION ANALYTICS TAB                                   │
│    └─ Success rates over time                               │
│    └─ Execution durations                                   │
│    └─ Automation insights                                   │
│    └─ ROI calculations (Time Saved, Cost)                   │
│    └─ Error tracking                                        │
│                                                              │
│ 5. APPROVALS TAB                                             │
│    └─ Pending approvals                                     │
│    └─ Approve/Reject actions                                │
│    └─ View approval history                                 │
│    └─ Configure approval rules                              │
│                                                              │
│ 6. SETTINGS/TEAM TAB (Admin only)                            │
│    └─ Manage team members                                   │
│    └─ Role assignments                                      │
│    └─ Audit logs                                            │
│    └─ System settings                                       │
│                                                              │
│ 7. LOGOUT                                                    │
│    └─ Clear token from localStorage                         │
│    └─ Return to landing page                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Connection Details

### Feature 1: AUTOMATION CREATION & MANAGEMENT

**User Journey:**
```
1. Click "+ New Automation"
   ↓
2. Enter natural language description
   "When GitHub pushes to main, Slack our #deploys channel"
   ↓
3. [AutomationCreator Component]
   ├─ Send to Groq AI
   ├─ Parse response (trigger + actions)
   ├─ Show user the plan
   └─ User approves/edits
   ↓
4. [Create Button]
   ├─ POST /flows
   ├─ Activepieces processes request
   ├─ Creates trigger & actions
   └─ Returns automation ID
   ↓
5. List updated automatically
   └─ Show new automation with status
```

**Components Involved:**
- `AutomationCreator.tsx` - Natural language input + Groq integration
- `DashboardModern.tsx` - List & manage automations
- `EditAutomationWithDiff.tsx` - Compare versions when editing
- `ExecutionHistory.tsx` - View past executions

**API Calls:**
```typescript
// Create automation (with AI planning)
POST /flows
{
  name: string
  trigger: { type: "webhook", config: {...} }
  actions: [ { type: "slack", config: {...} } ]
}

// List automations
GET /flows?userId={user_id}

// Execute automation
POST /flows/{id}/execute

// Get execution history
GET /flows/{id}/executions
```

**Groq AI Integration:**
```typescript
// Natural language → Automation plan
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${groqApiKey}` },
  body: JSON.stringify({
    model: 'mixtral-8x7b-32768',
    messages: [{ role: 'user', content: userDescription }]
  })
})

// Parse response to get: trigger type, actions, configs
```

---

### Feature 2: CONNECTION MANAGEMENT (OAuth)

**User Journey:**
```
1. Click "Add Connection"
   ↓
2. [ConnectionManager Component]
   ├─ Show available services (Stripe, GitHub, Slack, etc.)
   └─ User selects service
   ↓
3. Redirect to OAuth provider
   "GitHub" → github.com/login/oauth/authorize
   ├─ User logs in
   ├─ Approves permissions
   └─ Redirects back with code
   ↓
4. Exchange code for token
   POST /connections
   {
     "service": "github",
     "code": "abc123...",
     "redirectUrl": "http://localhost:5173/callback"
   }
   ↓
5. Token stored in Activepieces
   ├─ Encrypted in database
   └─ Retrieved for automations
   ↓
6. Connection shows "Active"
   └─ Ready to use in automations
```

**Components Involved:**
- `ConnectionManager.tsx` - Browse & manage connections
- `IntegrationsBrowser.tsx` - Discover available integrations

**API Calls:**
```typescript
// Get all connections (filtered by user)
GET /connections

// Create new connection (initiates OAuth)
POST /connections
{
  service: string
  code?: string
  redirectUrl?: string
}

// Delete connection (revoke)
DELETE /connections/{id}

// Available services
GET /connections/available
```

**OAuth Flow:**
```
┌─ Activepieces handles OAuth
├─ Redirects to provider (Stripe, GitHub, etc.)
├─ User authorizes
├─ Provider redirects back with code
├─ Activepieces exchanges code for token
├─ Token stored encrypted
└─ Frontend shows status
```

---

### Feature 3: WEBHOOK MANAGEMENT

**User Journey - INBOUND WEBHOOKS:**
```
1. Create automation with Webhook trigger
   ↓
2. Copy generated webhook URL
   "http://your-ip:3000/webhooks/abc123..."
   ↓
3. Paste into external service (Stripe, GitHub)
   ├─ Stripe: Settings → Webhooks → Add
   ├─ GitHub: Repo Settings → Webhooks
   └─ Zapier: Action configuration
   ↓
4. External service sends POST to URL
   └─ Body: Event data (payment, commit, etc.)
   ↓
5. Activepieces receives & processes
   ├─ Validates webhook signature
   ├─ Triggers associated automation
   ├─ Passes event data to workflow
   └─ Executes configured actions
   ↓
6. UI shows webhook execution
   └─ In WebhookHistory component
```

**User Journey - OUTBOUND WEBHOOKS:**
```
1. Configure automation actions
   ↓
2. Add "Webhook" action
   └─ Click WebhookConfig component
   ↓
3. Set target URL
   "https://api.example.com/webhooks/deliver"
   ↓
4. Configure settings
   ├─ HTTP method: POST, PUT, GET, DELETE
   ├─ Headers: Add custom headers
   ├─ Auth: Bearer token, Basic auth, API key
   ├─ Body: JSON template for payload
   ├─ Retry: Enable + max attempts
   └─ Timeout: 5-60 seconds
   ↓
5. Test webhook
   └─ Click "Test" → See result
   ↓
6. Save configuration
   ↓
7. When automation executes
   ├─ Webhook action runs
   ├─ Sends POST to target URL
   ├─ Receives response
   └─ If failed: Retry logic kicks in
   ↓
8. View delivery history
   └─ In WebhookHistory component
```

**Components Involved:**
- `GlobalWebhooksManager.tsx` - Manage all webhooks
- `WebhookConfig.tsx` - Configure outbound webhooks
- `WebhookHistory.tsx` - View delivery logs
- `WebhooksManager.tsx` - Unified interface

**API Calls:**
```typescript
// Get all webhooks
GET /webhooks

// Create webhook
POST /webhooks
{
  automation_id: string
  url: string
  method: string
  headers?: Record<string, string>
  auth?: { type: string, token?: string, ... }
  body_template?: string
  retry?: { enabled: boolean, max_attempts: number }
  timeout?: number
}

// Test webhook delivery
POST /webhooks/{id}/test

// Delete webhook
DELETE /webhooks/{id}

// Get webhook history
GET /webhooks/{id}/history

// Retry failed delivery
POST /webhooks/{id}/history/{execution_id}/retry
```

---

### Feature 4: EXECUTION ANALYTICS

**User Journey:**
```
1. Click "Analytics" tab
   ↓
2. [ExecutionAnalytics Component]
   ├─ Fetch execution data
   ├─ Calculate metrics
   └─ Display visualizations
   ↓
3. View metrics
   ├─ Success Rate (%)
   │  └─ "95% of automations succeeded"
   │
   ├─ Execution Duration
   │  └─ "Avg 2.3s, Max 15s, Min 0.5s"
   │
   ├─ Automation Performance
   │  └─ Ranking by success/speed
   │
   ├─ ROI Calculation
   │  ├─ Time Saved: "50 hours/month"
   │  ├─ Cost Estimation: "$1,250 value"
   │  └─ Error Rate: "5%"
   │
   └─ Trends Over Time
      ├─ Last 7 days
      ├─ Last 30 days
      └─ Custom date range
```

**Components Involved:**
- `ExecutionAnalytics.tsx` - Main analytics dashboard
- `Summaries.tsx` - Key metrics cards
- `SmartRetryVisualizer.tsx` - Show retry attempts & backoff

**Data Sources:**
```typescript
// Fetch execution history
GET /flows/{id}/executions?limit=100&offset=0

// Calculate metrics in frontend
├─ Success: count(status === 'success') / total
├─ Duration: Calculate min/max/avg from execution times
├─ Trending: Group by date, compare periods
└─ ROI: hours_saved * hourly_rate
```

---

### Feature 5: APPROVAL WORKFLOWS

**User Journey:**
```
1. Configure automation with approval step
   ├─ Set approval triggers
   └─ Specify approval conditions
   ↓
2. Automation executes & reaches approval
   └─ Pauses for approval
   ↓
3. [ApprovalRequests Component]
   ├─ Shows pending approvals
   ├─ Displays automation details
   ├─ Shows execution data
   └─ Shows who requested approval
   ↓
4. User reviews & decides
   ├─ [Approve Button] → Continue execution
   ├─ [Reject Button] → Stop execution
   └─ [Add Comment] → Leave notes
   ↓
5. Approval recorded
   └─ Execution continues or stops
   ↓
6. View approval history
   └─ In ApprovalConfig component
```

**Components Involved:**
- `ApprovalRequests.tsx` - View pending approvals
- `ApprovalConfig.tsx` - Configure approval rules

**API Calls:**
```typescript
// Get pending approvals
GET /approvals?status=pending

// Approve action
POST /approvals/{id}/approve
{
  comment?: string
}

// Reject action
POST /approvals/{id}/reject
{
  reason?: string
}

// Get approval history
GET /approvals/history
```

---

### Feature 6: TEAM MANAGEMENT (Admin Only)

**User Journey (Admin):**
```
1. Click Settings/Team tab
   ↓
2. [ManageTeam Component]
   ├─ List all team members
   ├─ Show roles
   └─ Show permissions
   ↓
3. Manage members
   ├─ [Add Member] → Invite email
   ├─ [Edit Role] → Change to Admin/Member
   ├─ [Remove] → Revoke access
   └─ [Audit Log] → View activity
   ↓
4. View team audit trail
   ├─ Who changed what
   ├─ When changes occurred
   └─ What permissions changed
```

**Components Involved:**
- `ManageTeam.tsx` - Team management interface

**API Calls:**
```typescript
// Get team members
GET /teams/{team_id}/members

// Add team member
POST /teams/{team_id}/members
{
  email: string
  role: 'admin' | 'member'
}

// Update member role
PUT /teams/{team_id}/members/{member_id}
{
  role: 'admin' | 'member'
}

// Remove member
DELETE /teams/{team_id}/members/{member_id}

// Get audit logs
GET /teams/{team_id}/audit-logs
```

---

### Feature 7: MCP CLIENT (Optional)

**User Journey - For AI Tools:**
```
1. User has Claude, Cursor, or Windsurf installed
   ↓
2. Open [MCPSetupComponent] for instructions
   ├─ Shows setup commands
   ├─ Explains MCP protocol
   └─ Provides example usage
   ↓
3. User configures their AI tool
   └─ Adds MCP server connection to Activepieces
   ↓
4. User can now
   ├─ Query automations via Claude
   ├─ Create automations via Cursor
   ├─ Modify workflows via Windsurf
   └─ All through natural conversation
```

**Components Involved:**
- `MCPSetupComponent.tsx` - Setup instructions

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER BROWSER                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │                   React Application                          │   │
│ │  ┌─────────┐  ┌──────────┐  ┌──────────────┐              │   │
│ │  │ Landing │→ │   Auth   │→ │  Dashboard   │              │   │
│ │  │  Page   │  │Component │  │  (All Tabs)  │              │   │
│ │  └─────────┘  └──────────┘  └──────────────┘              │   │
│ │       ↓              ↓              ↓                       │   │
│ │   localStorage: activepieces_token (JWT)                   │   │
│ │                     ↓                                       │   │
│ │  ┌──────────────────────────────────────────────────────┐ │   │
│ │  │  All API Calls Include:                              │ │   │
│ │  │  Headers: {                                          │ │   │
│ │  │    'Authorization': 'Bearer {token}',                │ │   │
│ │  │    'Content-Type': 'application/json'                │ │   │
│ │  │  }                                                   │ │   │
│ │  └──────────────────────────────────────────────────────┘ │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                           ↓ HTTPS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                     ACTIVEPIECES BACKEND                            │
│                  (Docker: http://172.17.0.4:3000)                  │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │  API Endpoints:                                              │   │
│ │  ├─ POST   /auth/login        → Login user                  │   │
│ │  ├─ POST   /auth/register     → Create user                 │   │
│ │  ├─ GET    /auth/me           → Get current user            │   │
│ │  │                                                           │   │
│ │  ├─ GET    /flows             → List automations            │   │
│ │  ├─ POST   /flows             → Create automation           │   │
│ │  ├─ PUT    /flows/:id         → Update automation           │   │
│ │  ├─ DELETE /flows/:id         → Delete automation           │   │
│ │  ├─ POST   /flows/:id/execute → Execute automation          │   │
│ │  ├─ GET    /flows/:id/execs   → Execution history           │   │
│ │  │                                                           │   │
│ │  ├─ GET    /connections       → List OAuth connections      │   │
│ │  ├─ POST   /connections       → Create connection           │   │
│ │  │                                                           │   │
│ │  ├─ GET    /webhooks          → List webhooks               │   │
│ │  ├─ POST   /webhooks          → Create webhook              │   │
│ │  ├─ POST   /webhooks/:id/test → Test webhook                │   │
│ │  ├─ GET    /webhooks/history  → Webhook logs                │   │
│ │  │                                                           │   │
│ │  ├─ GET    /approvals         → List pending approvals      │   │
│ │  ├─ POST   /approvals/:id/ok  → Approve action              │   │
│ │  │                                                           │   │
│ │  └─ GET    /teams             → List team members           │   │
│ └──────────────────────────────────────────────────────────────┘   │
│            ↓                        ↓                        ↓       │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL DB   │  │    Redis Cache  │  │ External APIs    │  │
│  │  (Port 5432)     │  │  (Port 6379)    │  │ (Stripe, etc)    │  │
│  └──────────────────┘  └─────────────────┘  └──────────────────┘  │
│         ↓                       ↓                      ↓            │
│  Automations, Users,   Session tokens,      OAuth connections     │
│  Connections, Webhooks Caching               External integrations │
│  Approvals, Logs                                                   │
└─────────────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (When Automations Run)               │
│  ├─ Slack (Send messages)                                           │
│  ├─ GitHub (Create issues, push code)                               │
│  ├─ Stripe (Process payments)                                       │
│  ├─ Google Sheets (Read/write data)                                 │
│  ├─ Webhooks (Send to user's external endpoints)                    │
│  └─ Groq AI (Generate automation plans)                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Authentication Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Signup/Login                               │
└─────────────────────────────────────────────────────────────┘
         ↓
    Auth.tsx:handleSubmit()
         ↓
    useAuth().signIn(email, password)
         ↓
    AuthContext:
    └─ Call activepiecesAuth.loginToActivePieces()
         ↓
    activepiecesAuth.ts:
    └─ POST http://172.17.0.4:3000/api/auth/login
       {
         email: "user@example.com",
         password: "secure123"
       }
         ↓
    Activepieces Response:
    {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      user: {
        id: "user_123",
        email: "user@example.com",
        firstName: "John"
      }
    }
         ↓
    Store Token:
    localStorage.setItem('activepieces_token', token)
         ↓
    Update Auth Context:
    { user: {...}, token, loading: false }
         ↓
    App.tsx renders: <DashboardModern />
         ↓
    All Subsequent API Calls Include:
    {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiI...'
      }
    }
```

---

## 6. Service Integration Map

```
┌────────────────────────────────────────────────────────────┐
│                    USER SESSION                            │
└────────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │      Authentication            │
        │  (Token stored in localStorage) │
        └────────────────────────────────┘
                ↙          ↓         ↖
        ┌───────────┐ ┌────────┐ ┌─────────┐
        │ Activepieces │ Groq │ Redis │
        │   (API)   │   (AI)  │(Cache) │
        └───────────┘ └────────┘ └─────────┘
             ↓             ↓          ↓
        ┌─────────────────────────────────┐
        │      Automation Features        │
        ├─────────────────────────────────┤
        │  • Create & Manage Workflows    │
        │  • Connect OAuth Services       │
        │  • Configure Webhooks           │
        │  • View Execution History       │
        │  • Manage Approvals             │
        │  • Analytics & Reporting        │
        │  • Team Collaboration           │
        └─────────────────────────────────┘
             ↙        ↓         ↘
        ┌──────┐ ┌────────┐ ┌──────────┐
        │Slack │ │GitHub  │ │ Stripe   │
        └──────┘ └────────┘ └──────────┘
        
        + 100+ other integrations
```

---

## 7. User Connection Checklist

### New User Onboarding

- [ ] **1. Create Account**
  - [ ] Visit landing page
  - [ ] Click "Get Started"
  - [ ] Enter email and password
  - [ ] Submit signup form
  - [ ] Redirected to dashboard
  - [ ] Token stored in localStorage

- [ ] **2. Create First Automation**
  - [ ] Click "+ New Automation"
  - [ ] Enter description (e.g., "Slack when GitHub pushes")
  - [ ] AI generates plan
  - [ ] Review and approve
  - [ ] Click "Create"
  - [ ] Automation appears in list

- [ ] **3. Connect External Service (OAuth)**
  - [ ] Click "Connections" tab
  - [ ] Click "Add Connection"
  - [ ] Select service (GitHub, Slack, etc.)
  - [ ] Click "Authorize"
  - [ ] Redirect to provider's login
  - [ ] User authorizes
  - [ ] Return to dashboard
  - [ ] Connection shows "Active"

- [ ] **4. Configure Webhooks**
  - [ ] Click "Webhooks" tab
  - [ ] Configure inbound webhook (optional)
  - [ ] Copy webhook URL
  - [ ] Paste into external service
  - [ ] Configure outbound webhook
  - [ ] Set target URL, auth, headers
  - [ ] Click "Test"
  - [ ] Verify delivery successful

- [ ] **5. View Analytics**
  - [ ] Click "Analytics" tab
  - [ ] View success rates
  - [ ] View execution durations
  - [ ] Check ROI calculations
  - [ ] Review error trends

- [ ] **6. Execute & Monitor**
  - [ ] Click automation
  - [ ] Click "Execute" or wait for trigger
  - [ ] Check execution history
  - [ ] View logs and results

---

## 8. Connection Types Summary

| Connection Type | Purpose | Direction | Example |
|---|---|---|---|
| **OAuth** | Connect external accounts | Outbound (Activepieces → Service) | GitHub, Stripe, Slack |
| **Inbound Webhook** | Receive external events | Inbound (Service → Activepieces) | GitHub push, Stripe payment |
| **Outbound Webhook** | Send results to endpoints | Outbound (Activepieces → URL) | Custom API, webhook.site |
| **Groq AI** | Natural language planning | Outbound (Activepieces → Groq) | Generate automation plans |
| **JWT Token** | User authentication | Session (localStorage) | API authorization |
| **PostgreSQL** | Data persistence | Internal | Store automations, users |
| **Redis** | Caching & sessions | Internal | Session tokens, cache |

---

## 9. Feature Access by User Role

### Regular User
- ✅ Create automations
- ✅ Manage own connections
- ✅ Configure own webhooks
- ✅ View own execution history
- ✅ Request approvals
- ❌ Approve automations (if approval role)
- ❌ Manage team
- ❌ View audit logs

### Approver
- ✅ All Regular User features
- ✅ Approve/reject automation actions
- ✅ View approval history
- ❌ Manage team
- ❌ View all users' automations

### Admin
- ✅ All features
- ✅ Manage team members
- ✅ Assign roles
- ✅ View audit logs
- ✅ Configure system settings
- ✅ View all automations

---

## 10. API Connection Reference

### Base Configuration

```typescript
// File: src/lib/activepieces.ts
const API_BASE_URL = import.meta.env.VITE_ACTIVEPIECES_URL 
  || 'http://172.17.0.4:3000/api';

// All requests automatically include:
headers: {
  'Authorization': `Bearer ${localStorage.getItem('activepieces_token')}`,
  'Content-Type': 'application/json'
}
```

### Environment Variables Required

```bash
VITE_ACTIVEPIECES_URL=http://your-vm-ip:3000/api
VITE_ACTIVEPIECES_API_KEY=your-api-key
VITE_GROQ_API_KEY=your-groq-api-key
```

### Service Layer (Single Source of Truth)

```typescript
// File: src/lib/backendService.ts
export const automations = { list, get, create, update, delete, execute };
export const connections = { list, create, delete };
export const webhooks = { list, create, delete, testDelivery };
export const groq = { generatePlan };
export const executionLogs = { get, list };
export const approvals = { list, approve, reject };
export const teams = { list, addMember, updateMember, removeMember };
```

---

## 11. Common User Workflows

### Workflow 1: Auto-Slack on GitHub Push
```
1. Create automation "Slack when GitHub pushes"
   ↓
2. Groq generates: Trigger=GitHub push, Action=Send Slack message
   ↓
3. Connect to GitHub OAuth (if not already connected)
   ↓
4. Configure Slack message template
   ↓
5. Save automation
   ↓
6. Set GitHub webhook to our URL (inbound webhook)
   ↓
7. Test: Push to main branch
   ↓
8. Slack message appears automatically
   ↓
9. View analytics in Dashboard
```

### Workflow 2: Email on Form Submission
```
1. Create automation "Email me on form submission"
   ↓
2. Configure inbound webhook
   └─ Copy URL: http://your-ip:3000/webhooks/{id}
   ↓
3. Add webhook to form service (Typeform, Formspree)
   ↓
4. Add Send Email action
   ↓
5. User submits form
   ↓
6. Form service POSTs to our webhook URL
   ↓
7. Activepieces receives event
   ↓
8. Email action executes
   ↓
9. Email sent to recipient
```

### Workflow 3: Approval Before Payment
```
1. Create automation "Payment processing"
   ↓
2. Trigger: Webhook (from payment form)
   ↓
3. Action: Stripe charge
   ├─ Add approval step first
   └─ Wait for approval
   ↓
4. User submits payment
   ↓
5. Webhook received
   ↓
6. Automation pauses at approval
   ↓
7. Admin notified: "Payment pending approval"
   ↓
8. Admin reviews details
   ↓
9. Admin clicks "Approve"
   ↓
10. Automation continues
    └─ Charges card
    └─ Sends confirmation email
```

---

## 12. Production Deployment Connections

### Environment Setup

```bash
# Docker containers running
- Activepieces API: http://172.17.0.4:3000
- PostgreSQL: 172.17.0.3:5432
- Redis: 172.17.0.2:6379

# Frontend deployment
- React app: https://your-production-domain.com
- API calls: https://your-production-domain.com:3000/api

# External services configured
- Slack: OAuth app created
- GitHub: OAuth app created
- Stripe: Live keys configured
- Groq: API key configured
```

### Security Connections

```
✅ All API calls use HTTPS (in production)
✅ JWT tokens stored in httpOnly cookies (recommended)
✅ OAuth tokens encrypted in database
✅ Webhook signatures verified
✅ Rate limiting per user
✅ CORS configured
✅ CSP headers set
✅ Secrets in environment variables
```

---

## Summary

**Users connect to features through:**

1. **Authentication** → localStorage token-based JWT
2. **Dashboard** → Tabbed interface for all features
3. **Activepieces API** → All operations go through REST API
4. **External Services** → OAuth or webhooks
5. **Groq AI** → Natural language automation generation
6. **User Sessions** → Maintained via JWT in localStorage

**Data flows:**
- User → Browser (React) → Activepieces API → Database/External Services
- External Services → Webhooks → Activepieces → Automation Execution

**Key integration points:**
- Token management (localStorage)
- API authentication (Bearer token)
- OAuth connections (third-party services)
- Webhooks (inbound/outbound)
- WebSocket (real-time updates)
- Session management (Activepieces)

🚀 **System ready for production deployment and user onboarding**
