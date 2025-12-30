// Groq API utility for getting help with API keys
// This calls the backend Groq integration via the unified backend service
import { backendService } from './backendService';

export async function getApiKeyInstructions(serviceName: string): Promise<string> {
  try {
    // Try to use backend Groq integration first
    try {
      const prompt = `Provide step-by-step instructions a non-technical user can follow to obtain an API key for ${serviceName}. Keep it concise.`;
      const result = await backendService.groq.planAutomation(prompt);
      // If the Groq output includes explicit instructions, return them
      if (result && typeof result === 'object') {
        if ((result as any).instructions) return (result as any).instructions;
        if ((result as any).description) return (result as any).description;
      }
    } catch (err) {
      console.error('Backend Groq call failed, using defaults:', err);
    }

    return getDefaultInstructions(serviceName);
  } catch (error) {
    console.error('Failed to get instructions:', error);
    return getDefaultInstructions(serviceName);
  }
}

function getDefaultInstructions(serviceName: string): string {
  const lowerService = serviceName.toLowerCase();
  
  const instructions: Record<string, string> = {
    slack: '1. Go to https://api.slack.com/apps\n2. Click "Create New App"\n3. Choose "From scratch"\n4. Enter app name and select your workspace\n5. Go to "OAuth & Permissions"\n6. Add Bot Token Scopes (chat:write, channels:read, etc.)\n7. Install to workspace\n8. Copy "Bot User OAuth Token" (starts with xoxb-)\n9. Paste it in the API key field',
    
    github: '1. Visit https://github.com/settings/tokens\n2. Click "Generate new token"\n3. Select "Personal access tokens (classic)"\n4. Give it a name (e.g., "Automation")\n5. Select scopes:\n   - repo (full control)\n   - workflow (workflow actions)\n   - read:user (user data)\n6. Click "Generate token"\n7. Copy token immediately (won\'t show again)',
    
    stripe: '1. Go to https://dashboard.stripe.com\n2. Log in to your Stripe account\n3. Click "Developers" in left menu\n4. Go to "API Keys"\n5. You\'ll see "Publishable key" and "Secret key"\n6. Click "Reveal live key" or "Reveal test key"\n7. Copy the "Secret key" (starts with sk_live_ or sk_test_)\n8. Test keys are for development, live keys for production',
    
    openai: '1. Go to https://platform.openai.com/api-keys\n2. Log in to your OpenAI account\n3. Click "Create new secret key"\n4. Give it a descriptive name (optional)\n5. Click "Create secret key"\n6. Copy the key immediately (won\'t show again)\n7. Organization ID is optional (Settings > Organization)',
    
    airtable: '1. Go to https://airtable.com/account/tokens\n2. Click "Create new token"\n3. Name it (e.g., "Automation Token")\n4. Under "Scopes", select:\n   - data.records:read\n   - data.records:write\n   - schema.bases:read\n5. Under "Bases", select which bases can access\n6. Click "Create token" and copy it',
    
    notion: '1. Go to https://www.notion.so/my-integrations\n2. Click "Create new integration"\n3. Name your integration\n4. Select the workspace it belongs to\n5. Go to "Secrets" tab\n6. Copy "Internal Integration Token"',
    
    google_sheets: '1. Go to https://console.cloud.google.com\n2. Create a new project or select existing\n3. Search and enable "Google Sheets API"\n4. Go to "Credentials"\n5. Click "Create Credentials" > "API Key"\n6. Copy the API Key\n7. Or use OAuth2 for more security',
    
    shopify: '1. Go to your Shopify Admin (admin.shopify.com)\n2. Navigate to Settings > Apps and integrations\n3. Click "Develop apps"\n4. Click "Create app"\n5. Name your app\n6. Go to "Configuration" tab\n7. Under Admin API scopes, select needed scopes\n8. Click "Save"\n9. Go to "API credentials" and copy "Access Token"',
    
    mailchimp: '1. Log in to Mailchimp (mailchimp.com)\n2. Click your profile icon\n3. Select "Account" > "Extras" > "API Keys"\n4. Click "Create A Key"\n5. Copy the API key (format: xxxxxxxxxxxxxxxxxxxxxxxx-us1)\n6. The "-us1" part is your datacenter\n7. Keep this secret!',
    
    twilio: '1. Go to https://www.twilio.com/console\n2. Log in to Twilio Console\n3. Copy your "Account SID" (shown on dashboard)\n4. Click the eye icon to show "Auth Token"\n5. Copy both Account SID and Auth Token\n6. Store them securely',
    
    aws: '1. Log in to AWS Console\n2. Go to IAM (Identity and Access Management)\n3. Click "Users" in left menu\n4. Create new user or select existing\n5. Go to "Security credentials" tab\n6. Click "Create access key"\n7. Copy "Access Key ID" and "Secret Access Key"\n8. Save both securely',
    
    discord: '1. Go to https://discord.com/developers/applications\n2. Click "New Application"\n3. Go to "Bot" section\n4. Click "Add Bot"\n5. Under "TOKEN", click "Copy"\n6. Use this bot token (starts with MTA or NTA)\n7. Keep it secret!',
    
    twitter: '1. Go to https://developer.twitter.com/en/portal\n2. Create/select your app\n3. Go to "Keys and tokens"\n4. Generate "API Key" and "API Secret"\n5. Create "Bearer Token"\n6. Copy all three securely',
    
    microsoft_teams: '1. Go to https://dev.teams.microsoft.com/apps\n2. Create or select your app\n3. Go to "Bot features"\n4. Create a bot and copy the token from Azure Portal\n5. Go to Azure Portal > Azure AD > App registrations\n6. Copy Client ID and generate Client Secret',
    
    facebook: '1. Go to https://developers.facebook.com\n2. Create or select your app\n3. Go to "Settings" > "Basic"\n4. Copy "App ID" and "App Secret"\n5. Go to "Tools" > "Access Token Tool"\n6. Generate an access token for your page',
  };

  return instructions[lowerService] || 
    `Getting API key for ${serviceName}:\n1. Visit the official ${serviceName} website\n2. Log in to your account\n3. Find Settings, API, or Developer section\n4. Look for "API Keys", "Access Tokens", or "Credentials"\n5. Generate a new key if needed\n6. Copy it and paste here\n7. Keep your API key secret!`;
}
