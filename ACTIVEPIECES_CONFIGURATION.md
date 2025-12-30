# 🔧 HOW TO CHANGE ACTIVEPIECES SETTINGS

## Quick Answer

You change Activepieces through **environment variables in Docker** or the **Activepieces Admin Dashboard**.

---

## Method 1: Docker Environment Variables (EASIEST)

### What's Currently Running

Your Activepieces is in **Docker** on your VM. To change settings, you need to:

1. ✅ Stop the container
2. ✅ Edit environment variables
3. ✅ Restart the container

### Location of Docker Setup

Your Activepieces Docker containers are running at:
```
Host:      172.17.0.4:3000  (Activepieces)
Database:  172.17.0.3:5432  (PostgreSQL)
Cache:     172.17.0.2:6379  (Redis)
```

### Step 1: Find Your Docker Compose File

**On Your VM/Windows Machine:**

```powershell
# Search for docker-compose file
Find-ChildItem -Path "C:\" -Name "docker-compose.yml" -Recurse

# Or check common locations:
# - C:\Users\{username}\docker-compose.yml
# - C:\docker\docker-compose.yml
# - C:\activepieces\docker-compose.yml
# - Your project root directory
```

**On Linux/VM:**

```bash
# Find docker-compose
find / -name "docker-compose.yml" 2>/dev/null

# Or check:
cd /opt/activepieces
ls -la
```

### Step 2: Edit the Docker Compose File

**Before Editing:**

```yaml
version: '3.8'

services:
  activepieces:
    image: activepieces/activepieces:latest
    ports:
      - "3000:3000"
    environment:
      AP_DATABASE_URL: postgresql://postgres:password@postgres:5432/activepieces
      AP_REDIS_URL: redis://redis:6379
      # Current settings - NO custom OAuth
```

**After Editing (Add These Lines):**

```yaml
version: '3.8'

services:
  activepieces:
    image: activepieces/activepieces:latest
    ports:
      - "3000:3000"
    environment:
      # Database
      AP_DATABASE_URL: postgresql://postgres:password@postgres:5432/activepieces
      AP_REDIS_URL: redis://redis:6379
      
      # ============= CUSTOM BRANDING =============
      
      # Display Name (shown in OAuth flow)
      AP_DISPLAY_NAME: "Your Platform Name"
      
      # Logo URL (your company logo)
      AP_LOGO_URL: "https://your-domain.com/logo.png"
      
      # Primary Brand Color (hex)
      AP_PRIMARY_COLOR: "#1F2937"
      
      # Frontend URL (where your React app is)
      AP_FRONTEND_URL: "https://your-domain.com"
      
      # ============= CUSTOM OAUTH APPS =============
      
      # GOOGLE OAUTH
      OAUTH_GOOGLE_CLIENT_ID: "your-google-client-id.apps.googleusercontent.com"
      OAUTH_GOOGLE_CLIENT_SECRET: "your-google-client-secret"
      
      # SLACK OAUTH
      OAUTH_SLACK_CLIENT_ID: "your-slack-client-id"
      OAUTH_SLACK_CLIENT_SECRET: "your-slack-client-secret"
      
      # GITHUB OAUTH
      OAUTH_GITHUB_CLIENT_ID: "your-github-client-id"
      OAUTH_GITHUB_CLIENT_SECRET: "your-github-client-secret"
      
      # STRIPE OAUTH
      OAUTH_STRIPE_CLIENT_ID: "ca_your-stripe-id"
      OAUTH_STRIPE_CLIENT_SECRET: "sk_live_your-stripe-secret"
      
      # MICROSOFT OAUTH
      OAUTH_MICROSOFT_CLIENT_ID: "your-microsoft-client-id"
      OAUTH_MICROSOFT_CLIENT_SECRET: "your-microsoft-client-secret"

  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: activepieces
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

### Step 3: Stop Current Container

```powershell
# Windows PowerShell
docker-compose down

# Or stop individual container
docker stop activepieces_app
docker stop activepieces_postgres
docker stop activepieces_redis
```

### Step 4: Restart with New Configuration

```powershell
# Navigate to directory with docker-compose.yml
cd C:\path\to\docker-compose

# Start with new config
docker-compose up -d

# Verify running
docker ps
```

### Step 5: Verify Changes

```powershell
# Check if new variables are set
docker exec activepieces_app env | grep AP_DISPLAY_NAME

# Should output: AP_DISPLAY_NAME=Your Platform Name
```

---

## Getting the OAuth Credentials

### 1️⃣ Google OAuth

**Steps:**

```
1. Go to Google Cloud Console
   https://console.cloud.google.com/

2. Create new project
   └─ Name it: "Your Platform Name"

3. Enable APIs
   ├─ Google Sheets API
   ├─ Gmail API
   ├─ Google Drive API
   ├─ Google Calendar API
   └─ Google Contacts API

4. Create OAuth 2.0 Credential
   ├─ Click "Create Credentials"
   ├─ Choose "OAuth 2.0 Client ID"
   ├─ Application type: "Web application"
   ├─ Name: "Your Platform Name"
   
5. Authorized JavaScript origins:
   └─ https://your-vm-ip:3000
   └─ https://your-domain.com

6. Authorized redirect URIs:
   └─ https://your-vm-ip:3000/auth/oauth2/callback
   └─ https://your-domain.com/auth/oauth2/callback
   └─ https://172.17.0.4:3000/auth/oauth2/callback

7. Copy the credentials
   ├─ Client ID: xxx.apps.googleusercontent.com
   └─ Client Secret: xxx-xxxxxx
```

**Result:**
```
OAUTH_GOOGLE_CLIENT_ID=12345678.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
```

### 2️⃣ Slack OAuth

**Steps:**

```
1. Go to api.slack.com
   https://api.slack.com/apps

2. Create New App
   ├─ Choose: "From scratch"
   ├─ App name: "Your Platform Name"
   └─ Pick workspace (your test workspace)

3. Go to "OAuth & Permissions"

4. Scopes (Add these permissions)
   ├─ chat:write
   ├─ files:write
   ├─ users:read
   ├─ channels:read
   └─ etc. (based on what you need)

5. Redirect URLs
   ├─ https://your-vm-ip:3000/auth/oauth2/callback
   ├─ https://your-domain.com/auth/oauth2/callback
   └─ https://172.17.0.4:3000/auth/oauth2/callback

6. Copy credentials
   ├─ Client ID
   └─ Client Secret

7. Install app to workspace
   └─ Button at top of page
```

**Result:**
```
OAUTH_SLACK_CLIENT_ID=123456.abcdef
OAUTH_SLACK_CLIENT_SECRET=abc123xyz789
```

### 3️⃣ GitHub OAuth

**Steps:**

```
1. Go to github.com/settings/developers

2. OAuth Apps → New OAuth App

3. Fill form:
   ├─ Application name: "Your Platform Name"
   ├─ Homepage URL: https://your-domain.com
   ├─ Application description: "Automation platform"
   └─ Authorization callback URL:
      └─ https://172.17.0.4:3000/auth/oauth2/callback

4. Generate new client secret
   └─ Copy it immediately (you can't see it again)

5. Save credentials
   ├─ Client ID
   └─ Client Secret
```

**Result:**
```
OAUTH_GITHUB_CLIENT_ID=abc123def456
OAUTH_GITHUB_CLIENT_SECRET=ghp_abcdefghijklmnopqrstuvwxyz123456
```

### 4️⃣ Stripe OAuth

**Steps:**

```
1. Go to dashboard.stripe.com

2. Settings → Apps and Integrations

3. Create connected application
   ├─ App name: "Your Platform Name"
   ├─ Permissions: 
   │  ├─ Read access to customers
   │  ├─ Write access to invoices
   │  └─ etc.
   └─ Redirect URL:
      └─ https://172.17.0.4:3000/auth/oauth2/callback

4. Get credentials
   ├─ Client ID
   └─ Client Secret

5. Use these for TEST and LIVE mode separately
   ├─ Test: sk_test_...
   └─ Live: sk_live_...
```

**Result:**
```
OAUTH_STRIPE_CLIENT_ID=ca_abc123def456
OAUTH_STRIPE_CLIENT_SECRET=sk_live_abc123def456
```

---

## Method 2: Activepieces Admin Dashboard

### Access Admin Dashboard

```
1. Go to http://172.17.0.4:3000/admin

2. Login with admin credentials
   ├─ Username: admin@activepieces.com
   ├─ Password: (your admin password)

3. Navigate to "Settings"

4. Find sections:
   ├─ Branding
   ├─ OAuth Applications
   ├─ OAuth Providers
   └─ Webhook Configuration
```

### Change Settings Via Dashboard

```
Settings → Branding:
├─ Logo URL: [your-domain.com/logo.png]
├─ Display Name: [Your Platform Name]
├─ Primary Color: [#1F2937]
└─ Save

Settings → OAuth:
├─ Google
│  ├─ Client ID: [paste here]
│  ├─ Client Secret: [paste here]
│  └─ Save
├─ Slack
│  ├─ Client ID: [paste here]
│  ├─ Client Secret: [paste here]
│  └─ Save
└─ GitHub (same pattern)
```

---

## Complete Configuration Example

### Full Docker Compose File

```yaml
version: '3.8'

services:
  activepieces:
    image: activepieces/activepieces:latest
    container_name: activepieces_app
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      # Core Configuration
      AP_DATABASE_URL: postgresql://postgres:secure_password@postgres:5432/activepieces
      AP_REDIS_URL: redis://redis:6379
      AP_NODE_ENV: production
      
      # Branding (This is the KEY CHANGE)
      AP_DISPLAY_NAME: "AutoFlow"
      AP_LOGO_URL: "https://autoflow.io/logo.png"
      AP_PRIMARY_COLOR: "#2563EB"
      AP_FRONTEND_URL: "https://autoflow.io"
      
      # Google OAuth (CREATE IN GOOGLE CLOUD CONSOLE)
      OAUTH_GOOGLE_CLIENT_ID: "123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
      OAUTH_GOOGLE_CLIENT_SECRET: "GOCSPX-abcdefghijklmnop_qrstuvwxyz"
      
      # Slack OAuth (CREATE IN API.SLACK.COM)
      OAUTH_SLACK_CLIENT_ID: "123456.789012"
      OAUTH_SLACK_CLIENT_SECRET: "abcdefghijklmnopqrstuvwxyz123456"
      
      # GitHub OAuth (CREATE IN GITHUB.COM/SETTINGS)
      OAUTH_GITHUB_CLIENT_ID: "Iv1.abcdefg123456"
      OAUTH_GITHUB_CLIENT_SECRET: "abcdefghijklmnopqrstuvwxyz123456789abcd"
      
      # Stripe OAuth (CREATE IN STRIPE DASHBOARD)
      OAUTH_STRIPE_CLIENT_ID: "ca_KkLmNoPqRsT"
      OAUTH_STRIPE_CLIENT_SECRET: "sk_live_abcdefghijklmnopqrstuvwxyz123456"
      
      # Microsoft OAuth (CREATE IN AZURE PORTAL)
      OAUTH_MICROSOFT_CLIENT_ID: "12345678-abcd-efgh-ijkl-mnopqrstuvwx"
      OAUTH_MICROSOFT_CLIENT_SECRET: "abcdefghij~klmnopqrstuvwxyz123456789"
      
      # Webhook Configuration
      AP_WEBHOOK_TIMEOUT_SECONDS: 30
      AP_WEBHOOK_RETRY_ATTEMPTS: 3
      AP_WEBHOOK_RETRY_DELAY_MS: 1000

  postgres:
    image: postgres:14
    container_name: activepieces_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: activepieces
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    container_name: activepieces_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

---

## Step-by-Step: Apply Changes

### Windows PowerShell

```powershell
# 1. Navigate to your docker-compose directory
cd "C:\Users\lenovo\docker-compose"

# 2. Open docker-compose.yml in text editor
notepad docker-compose.yml

# 3. Edit the file (add branding + OAuth credentials)
# Save the file

# 4. Stop current containers
docker-compose down

# 5. Restart with new configuration
docker-compose up -d

# 6. Check logs to verify startup
docker logs activepieces_app

# 7. Verify container is running
docker ps | grep activepieces
```

### PowerShell: Full Script

```powershell
# Copy-paste this whole script to automate

$composeFile = "C:\Users\lenovo\docker-compose\docker-compose.yml"

# 1. Backup original
Copy-Item $composeFile "$composeFile.backup"
Write-Host "✅ Backup created: $composeFile.backup"

# 2. Stop containers
Write-Host "Stopping containers..."
docker-compose -f $composeFile down

# 3. Update environment variables in compose file
Write-Host "Updating configuration..."
$content = Get-Content $composeFile -Raw

# Add/update display name
$content = $content -replace 
    'AP_DISPLAY_NAME:.*',
    'AP_DISPLAY_NAME: "Your Platform Name"'

# Add/update logo
$content = $content -replace
    'AP_LOGO_URL:.*',
    'AP_LOGO_URL: "https://your-domain.com/logo.png"'

# Save updated file
Set-Content -Path $composeFile -Value $content
Write-Host "✅ Configuration updated"

# 4. Start containers
Write-Host "Starting containers..."
docker-compose -f $composeFile up -d

# 5. Wait for startup
Start-Sleep -Seconds 5

# 6. Verify
Write-Host "Verifying..."
docker ps | grep activepieces
Write-Host "✅ Activepieces restarted with new configuration"

# 7. Check logs
Write-Host "Recent logs:"
docker logs --tail 20 activepieces_app
```

---

## After Making Changes

### What Changes You'll See

**1. In OAuth Flow:**
```
Before:
"Activepieces is requesting access to your Google account"

After:
"Your Platform Name is requesting access to your Google account"
```

**2. In Activepieces Dashboard:**
```
Before: Activepieces logo + blue color

After: Your logo + your brand color
```

**3. In Webhook Responses:**
```
Headers include your platform name
```

### Verification Checklist

- [ ] Docker containers restarted successfully
- [ ] http://172.17.0.4:3000 loads
- [ ] Login works
- [ ] Create connection
- [ ] Select "Google"
- [ ] Verify OAuth shows your platform name (not Activepieces)
- [ ] Complete OAuth flow
- [ ] Connection saved successfully

---

## Troubleshooting

### Container Won't Start

```powershell
# Check logs
docker logs activepieces_app

# Look for errors like:
# - Invalid environment variable syntax
# - Missing Redis connection
# - Database connection failed
```

**Fix:**
```yaml
# Make sure no special characters in values
# If value has quotes, escape them:
AP_DISPLAY_NAME: "Your \"Platform\" Name"  # Correct

# Or use single quotes:
AP_DISPLAY_NAME: 'Your "Platform" Name'    # Also correct
```

### OAuth Still Shows "Activepieces"

**Cause:** Environment variables not applied

**Fix:**
```powershell
# 1. Verify variable is set
docker exec activepieces_app env | grep AP_DISPLAY_NAME

# 2. Should see: AP_DISPLAY_NAME=Your Platform Name

# 3. If not, restart again
docker-compose down
docker-compose up -d

# 4. Wait 10 seconds
Start-Sleep -Seconds 10

# 5. Check again
docker exec activepieces_app env | grep AP_DISPLAY_NAME
```

### Can't Find Docker Compose File

```powershell
# Search your entire system
Get-ChildItem -Path "C:\" -Name "docker-compose.yml" -Recurse -ErrorAction SilentlyContinue

# Or find where containers are defined
docker inspect activepieces_app | grep -i "composeproject"
```

---

## All Available Activepieces Settings

```yaml
# Display & Branding
AP_DISPLAY_NAME: "Your Platform Name"
AP_LOGO_URL: "https://example.com/logo.png"
AP_PRIMARY_COLOR: "#2563EB"
AP_FAVICON_URL: "https://example.com/favicon.ico"

# Network & URLs
AP_FRONTEND_URL: "https://your-domain.com"
AP_API_URL: "https://api.your-domain.com"
AP_WEBHOOK_URL: "https://your-domain.com/webhook"

# Database & Cache
AP_DATABASE_URL: "postgresql://user:pass@host:5432/db"
AP_REDIS_URL: "redis://host:6379"

# Security
AP_ENCRYPTION_KEY: "your-encryption-key"
AP_JWT_SECRET: "your-jwt-secret"

# Email (for notifications)
SMTP_HOST: "smtp.gmail.com"
SMTP_PORT: "587"
SMTP_USERNAME: "your-email@gmail.com"
SMTP_PASSWORD: "your-app-password"
SMTP_FROM: "noreply@your-domain.com"

# Rate Limiting
AP_RATE_LIMIT_REQUESTS: "100"
AP_RATE_LIMIT_WINDOW_MS: "60000"

# Webhook Configuration
AP_WEBHOOK_TIMEOUT_SECONDS: "30"
AP_WEBHOOK_RETRY_ATTEMPTS: "3"
AP_WEBHOOK_RETRY_DELAY_MS: "1000"
```

---

## Summary

### To Fix OAuth Branding in Activepieces:

**1️⃣ Add Environment Variables**
```
AP_DISPLAY_NAME=Your Platform Name
OAUTH_GOOGLE_CLIENT_ID=your-id
OAUTH_GOOGLE_CLIENT_SECRET=your-secret
```

**2️⃣ Edit docker-compose.yml**
- Add the variables to the `activepieces` service
- Save the file

**3️⃣ Restart Container**
```
docker-compose down
docker-compose up -d
```

**4️⃣ Verify**
- Test OAuth flow
- Verify platform name shows instead of "Activepieces"

✅ **Done! Users will now see your platform name in OAuth flows!**
