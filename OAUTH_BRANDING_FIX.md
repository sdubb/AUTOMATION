# 🔐 OAUTH BRANDING & UX FIX GUIDE

## The Problem

When users click "Connect Google" (or any OAuth service), they see:

```
┌──────────────────────────────────────────────────┐
│  "Activepieces is requesting access to your    │
│   Google account"                               │
│                                                  │
│  □ View and manage your email                   │
│  □ Create and manage tasks                      │
│                                                  │
│  [Cancel] [Allow]                              │
└──────────────────────────────────────────────────┘
```

**The Issue:** Users see "Activepieces" instead of your platform name, creating:
- ❌ Confusion about who's requesting access
- ❌ Lost branding opportunity
- ❌ Reduced trust/legitimacy
- ❌ Professional appearance concern

---

## Solution Options

### Option 1: Register Custom OAuth Apps (RECOMMENDED)

Create OAuth applications under your company name for each service.

**Setup Steps:**

#### Google OAuth
```
1. Go to Google Cloud Console
   https://console.cloud.google.com/

2. Create new project
   └─ Project name: "Your Platform Name"

3. Enable APIs
   ├─ Google Sheets API
   ├─ Gmail API
   ├─ Google Drive API
   └─ Google Calendar API

4. Create OAuth 2.0 Credentials
   ├─ Application type: Web application
   ├─ Name: "Your Platform Name"
   ├─ Authorized URLs: https://your-platform.com
   ├─ Authorized redirect URIs:
   │  └─ https://your-activepieces-instance.com/auth/oauth2/callback
   └─ Get: Client ID & Client Secret

5. Add to Activepieces
   ├─ Settings → OAuth Applications
   ├─ Add Google app
   └─ Input Client ID & Secret
```

#### Slack OAuth
```
1. Go to api.slack.com/apps

2. Create New App
   └─ From scratch

3. App name: "Your Platform Name"

4. OAuth & Permissions
   ├─ Scopes (Permissions needed)
   ├─ Redirect URLs:
   │  └─ https://your-activepieces-instance.com/auth/oauth2/callback
   └─ Get: Client ID & Client Secret

5. Add to Activepieces Configuration
```

#### GitHub OAuth
```
1. Go to github.com/settings/developers

2. Create OAuth App
   ├─ Application name: "Your Platform Name"
   ├─ Homepage URL: https://your-platform.com
   ├─ Authorization callback URL:
   │  └─ https://your-activepieces-instance.com/auth/oauth2/callback
   └─ Get: Client ID & Client Secret

3. Add to Activepieces Configuration
```

#### Stripe OAuth
```
1. Go to dashboard.stripe.com/settings/apps-and-integrations

2. Create connected application
   ├─ Application name: "Your Platform Name"
   ├─ Website: https://your-platform.com
   ├─ Redirect URL:
   │  └─ https://your-activepieces-instance.com/auth/oauth2/callback
   └─ Get: Client ID & Secret

3. Add to Activepieces Configuration
```

---

### Option 2: Custom Connection UI with Explanation

Enhance the user experience by explaining the OAuth flow before redirection.

**Implementation:**

```tsx
// File: src/components/OAuthAuthorizationFlow.tsx

import { AlertCircle, Lock, Shield, ArrowRight } from 'lucide-react';

interface OAuthFlowProps {
  serviceName: string;
  platformName: string;
  onAuthorize: () => void;
  onCancel: () => void;
}

export function OAuthAuthorizationFlow({
  serviceName,
  platformName,
  onAuthorize,
  onCancel,
}: OAuthFlowProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Authorize {serviceName}
          </h2>
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                You're authorizing via {serviceName}
              </p>
              <p className="text-sm text-gray-700">
                You'll be redirected to {serviceName}'s login page. 
                {platformName} will receive only a secure token, 
                never your password.
              </p>
            </div>
          </div>
        </div>

        {/* What happens */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Redirect to {serviceName}
              </p>
              <p className="text-xs text-gray-600">
                You'll log in to your {serviceName} account
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">2</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Grant permissions
              </p>
              <p className="text-xs text-gray-600">
                Review what {platformName} can access
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">3</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Return to {platformName}
              </p>
              <p className="text-xs text-gray-600">
                Secure token stored, you're connected
              </p>
            </div>
          </div>
        </div>

        {/* Security info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <div className="flex gap-2 items-start">
            <Lock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700">
              Your password is never shared. We only receive a secure token
              to perform actions on your behalf.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onAuthorize}
            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            Continue to {serviceName}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You'll see "{serviceName} is requesting access..." on the next page
        </p>
      </div>
    </div>
  );
}
```

**Usage in ConnectionManager:**

```tsx
const [showOAuthExplainer, setShowOAuthExplainer] = useState<string | null>(null);
const [selectedService, setSelectedService] = useState('');

// When user clicks OAuth service
const handleOAuthConnect = (serviceName: string) => {
  setSelectedService(serviceName);
  setShowOAuthExplainer(serviceName); // Show explainer first
};

// When user confirms in explainer
const handleConfirmOAuth = async () => {
  // Initiate actual OAuth flow
  const authUrl = await getOAuthAuthorizationUrl(selectedService);
  window.location.href = authUrl;
};

// In render:
{showOAuthExplainer && (
  <OAuthAuthorizationFlow
    serviceName={selectedService}
    platformName="Your Platform Name"
    onAuthorize={handleConfirmOAuth}
    onCancel={() => setShowOAuthExplainer(null)}
  />
)}
```

---

### Option 3: Whitelabel Activepieces

Host Activepieces with your own branding.

**Activepieces Whitelabel Features:**
```
1. Custom logo
   └─ Replace Activepieces logo everywhere

2. Custom colors
   └─ Match your brand colors

3. Custom domain
   └─ https://your-domain.com/api (instead of activepieces.com)

4. Custom OAuth apps
   └─ Register under your company name

5. Custom UI strings
   └─ "Your Platform" instead of "Activepieces"

6. Embedded dashboard
   └─ Integrate directly into your app
```

**Implementation:**

```bash
# Docker Compose for Whitelabeled Activepieces
docker-compose.yml:

version: '3.8'
services:
  activepieces:
    image: activepieces/activepieces:latest
    environment:
      # Branding
      AP_DISPLAY_NAME="Your Platform Name"
      AP_LOGO_URL="https://your-domain.com/logo.png"
      AP_PRIMARY_COLOR="#1F2937"
      
      # OAuth
      AP_OAUTH_APPS: |
        {
          "google": {
            "clientId": "your-google-client-id",
            "clientSecret": "your-google-client-secret"
          },
          "slack": {
            "clientId": "your-slack-client-id",
            "clientSecret": "your-slack-client-secret"
          },
          "github": {
            "clientId": "your-github-client-id",
            "clientSecret": "your-github-client-secret"
          }
        }
      
      # Domain
      AP_FRONTEND_URL="https://your-platform.com"
      
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
```

---

## Current Implementation Analysis

### What's Happening Now

```tsx
// src/components/ConnectionManager.tsx - Line 250+

// User clicks "Add Connection" button
{showAddForm && (
  <AddConnectionForm
    onClose={() => setShowAddForm(false)}
    onSuccess={() => {
      setShowAddForm(false);
      loadConnections();
    }}
  />
)}

// AddConnectionForm shows list of services
const services = ['slack', 'github', 'stripe', 'google_sheets', ...];

// When user selects a service, it makes API call
const handleSubmit = async (e: React.FormEvent) => {
  await backendService.connections.create({
    name: service,
    appName: service,
    config: credentials,
  });
  // This redirects to Activepieces' OAuth endpoint
  // Which shows "Activepieces is requesting access"
};
```

### The Issue

```
Flow: User Click → ConnectionManager → Activepieces OAuth → Google/Slack
      "Connect Google" ↓
      POST /connections → Activepieces OAuth
      ↓
      OAuth Provider sees: "Activepieces (clientId)"
      ↓
      Shows: "Activepieces is requesting access to your account"
```

---

## Recommended Solution: HYBRID APPROACH

### Step 1: Add OAuth Explainer Modal (Quick Win - No Backend Changes)

```tsx
// src/components/ConnectionManager.tsx - Enhanced

import { OAuthAuthorizationFlow } from './OAuthAuthorizationFlow';

function AddConnectionForm() {
  const [showOAuthExplainer, setShowOAuthExplainer] = useState<string | null>(null);
  
  // OAuth services that need explainer
  const oauthServices = ['slack', 'github', 'stripe', 'google_sheets', 'gmail'];

  const handleOAuthService = (serviceName: string) => {
    if (oauthServices.includes(serviceName)) {
      setShowOAuthExplainer(serviceName);
      // Don't submit yet - show explainer first
    } else {
      // API key services, proceed normally
      handleSubmit();
    }
  };

  return (
    <>
      {/* Existing form */}
      
      {/* OAuth Explainer Modal */}
      {showOAuthExplainer && (
        <OAuthAuthorizationFlow
          serviceName={showOAuthExplainer}
          platformName="Your Platform Name"
          onAuthorize={() => {
            setShowOAuthExplainer(null);
            handleSubmit(); // Now proceed with OAuth
          }}
          onCancel={() => setShowOAuthExplainer(null)}
        />
      )}
    </>
  );
}
```

### Step 2: Register Custom OAuth Apps

Create OAuth credentials under your company name for:
- ✅ Google (Gmail, Sheets, Calendar, Drive)
- ✅ Slack
- ✅ GitHub
- ✅ Stripe
- ✅ Shopify
- ✅ Microsoft (Outlook, Teams)

### Step 3: Add to Activepieces Configuration

Update Activepieces Docker environment:

```bash
docker-compose.yml:

environment:
  # Custom OAuth Apps
  OAUTH_GOOGLE_CLIENT_ID=your-google-id
  OAUTH_GOOGLE_CLIENT_SECRET=your-google-secret
  
  OAUTH_SLACK_CLIENT_ID=your-slack-id
  OAUTH_SLACK_CLIENT_SECRET=your-slack-secret
  
  OAUTH_GITHUB_CLIENT_ID=your-github-id
  OAUTH_GITHUB_CLIENT_SECRET=your-github-secret
  
  # Display name shown in OAuth flow
  PLATFORM_NAME="Your Platform Name"
```

### Step 4: Update Frontend Copy

```tsx
// src/components/ConnectionManager.tsx

const serviceLabels: Record<string, string> = {
  slack: '📱 Slack',
  github: '🐙 GitHub',
  stripe: '💳 Stripe',
  google_sheets: '📊 Google Sheets',
  gmail: '📧 Gmail',
  // ... etc
};

// Show better descriptions
{service === 'slack' && (
  <p className="text-xs text-gray-600">
    Connect your Slack workspace. You'll authorize via Slack OAuth.
  </p>
)}
```

---

## Security Considerations

### ✅ Safe to Show Platform Name in Explainer

```
Why it's safe:
┌─────────────────────────────────────┐
│ "Authorize Slack"                   │
│ (Your Platform Name) needs access   │
│ to your Slack workspace              │
│                                      │
│ [Continue] [Cancel]                │
└─────────────────────────────────────┘

↓ User clicks Continue

┌─────────────────────────────────────┐
│ OAuth Provider (Slack/Google/etc)   │
│                                      │
│ "Slack is requesting access"        │
│ Permissions: View emails, etc       │
│ [Authorize] [Cancel]                │
└─────────────────────────────────────┘

✅ Two-step process:
   1. You explain context (platform name)
   2. OAuth provider shows their flow
```

---

## Implementation Checklist

- [ ] **Step 1: Add OAuth Explainer Modal**
  - [ ] Create `OAuthAuthorizationFlow.tsx` component
  - [ ] Integrate into `ConnectionManager.tsx`
  - [ ] Test with all OAuth services

- [ ] **Step 2: Create OAuth Apps**
  - [ ] Google: Create OAuth app in Cloud Console
  - [ ] Slack: Create OAuth app in api.slack.com
  - [ ] GitHub: Create OAuth app in github.com/settings
  - [ ] Stripe: Create OAuth app in dashboard
  - [ ] Document credentials in secure location

- [ ] **Step 3: Configure Activepieces**
  - [ ] Add OAuth credentials to docker-compose.yml
  - [ ] Restart Activepieces container
  - [ ] Test each OAuth connection

- [ ] **Step 4: Update UI**
  - [ ] Add service icons and labels
  - [ ] Add helpful descriptions
  - [ ] Show "Powered by Activepieces" in footer (transparency)

- [ ] **Step 5: Test & Deploy**
  - [ ] Test each OAuth flow end-to-end
  - [ ] Verify tokens stored correctly
  - [ ] Test token refresh
  - [ ] Deploy to production

---

## What Users Will See (After Fix)

### Before (Current)
```
User clicks: "Connect Google"
     ↓
Sees: "Activepieces is requesting access to your Google account"
     ↓
Confusion: "Who is Activepieces? Why do I need them?"
```

### After (With Fix)
```
User clicks: "Connect Google"
     ↓
Sees Modal: "[Your Platform Name] needs to access your Google account"
            "You'll authorize via Google OAuth"
            [Continue] [Cancel]
     ↓
User clicks: Continue
     ↓
Sees: "Google is requesting access to your account"
      "Authorize your account to [Your Platform]"
     ↓
User authorizes
     ↓
Sees: "Successfully connected Google! ✅"
```

---

## Cost & Effort

| Solution | Effort | Cost | Branding Impact |
|----------|--------|------|-----------------|
| **Option 1** (Explainer Modal) | 2-3 hours | $0 | Medium ⭐⭐ |
| **Option 2** (Custom OAuth Apps) | 4-6 hours | $0 | High ⭐⭐⭐ |
| **Option 3** (Whitelabel) | 8+ hours | $0 | Very High ⭐⭐⭐⭐ |
| **All Combined** | 12-16 hours | $0 | Maximum ⭐⭐⭐⭐⭐ |

**Recommended:** Start with Options 1 + 2 for best ROI.

---

## Next Steps

1. ✅ Create `OAuthAuthorizationFlow.tsx` component
2. ✅ Register custom OAuth apps with major services
3. ✅ Update `ConnectionManager.tsx` to use explainer
4. ✅ Update Activepieces configuration
5. ✅ Test all OAuth flows
6. ✅ Deploy and monitor
