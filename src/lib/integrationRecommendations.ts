/**
 * Integration Recommendations Service
 * AI analyzes automation descriptions and suggests helpful integrations
 * Improves plan quality by recommending missing pieces
 */

export interface IntegrationRecommendation {
  integrationId: string;
  name: string;
  description: string;
  category: string;
  relevanceScore: number; // 0-100
  reason: string; // why this integration is recommended
  iconUrl: string;
  setupDifficulty: 'easy' | 'medium' | 'hard';
  costPerMonth?: number;
}

// Top 50 popular integrations across various categories
export const POPULAR_INTEGRATIONS: Record<string, IntegrationRecommendation> = {
  // Email
  gmail: {
    integrationId: 'gmail',
    name: 'Gmail',
    description: 'Email automation, sending, tracking',
    category: 'Email',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.gstatic.com/images/branding/product/1x/gmail_logo_32dp.png',
    setupDifficulty: 'easy',
  },
  mailchimp: {
    integrationId: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing, campaigns, lists',
    category: 'Email',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://mailchimp.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 20,
  },
  sendgrid: {
    integrationId: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email, bulk sending',
    category: 'Email',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://sendgrid.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 10,
  },

  // CRM
  salesforce: {
    integrationId: 'salesforce',
    name: 'Salesforce',
    description: 'CRM, leads, opportunities, accounts',
    category: 'CRM',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.salesforce.com/favicon.ico',
    setupDifficulty: 'hard',
    costPerMonth: 165,
  },
  hubspot: {
    integrationId: 'hubspot',
    name: 'HubSpot',
    description: 'CRM, contacts, deals, pipelines',
    category: 'CRM',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.hubspot.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0, // Free tier
  },
  pipedrive: {
    integrationId: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales CRM, deals, pipelines',
    category: 'CRM',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.pipedrive.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 99,
  },

  // Communication
  slack: {
    integrationId: 'slack',
    name: 'Slack',
    description: 'Team messaging, notifications, alerts',
    category: 'Communication',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.slack.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  teams: {
    integrationId: 'teams',
    name: 'Microsoft Teams',
    description: 'Team chat, meetings, notifications',
    category: 'Communication',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.microsoft.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  discord: {
    integrationId: 'discord',
    name: 'Discord',
    description: 'Community chat, webhooks, bots',
    category: 'Communication',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://discord.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  twilio: {
    integrationId: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice calls, messaging',
    category: 'Communication',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.twilio.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0, // Pay as you go
  },

  // Data & Databases
  airtable: {
    integrationId: 'airtable',
    name: 'Airtable',
    description: 'Spreadsheet-database, forms, views',
    category: 'Database',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.airtable.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  postgres: {
    integrationId: 'postgres',
    name: 'PostgreSQL',
    description: 'SQL database, queries, transactions',
    category: 'Database',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.postgresql.org/favicon.ico',
    setupDifficulty: 'hard',
    costPerMonth: 0,
  },
  mongodb: {
    integrationId: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL database, collections',
    category: 'Database',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.mongodb.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0,
  },

  // Project Management
  asana: {
    integrationId: 'asana',
    name: 'Asana',
    description: 'Tasks, projects, workflows',
    category: 'Project Management',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://app.asana.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  jira: {
    integrationId: 'jira',
    name: 'Jira',
    description: 'Issue tracking, sprints, projects',
    category: 'Project Management',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.atlassian.com/favicon.ico',
    setupDifficulty: 'hard',
    costPerMonth: 0,
  },
  notion: {
    integrationId: 'notion',
    name: 'Notion',
    description: 'Docs, databases, wikis',
    category: 'Project Management',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.notion.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },

  // Social & Content
  twitter: {
    integrationId: 'twitter',
    name: 'Twitter/X',
    description: 'Tweet posting, monitoring',
    category: 'Social Media',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://twitter.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  instagram: {
    integrationId: 'instagram',
    name: 'Instagram',
    description: 'Post scheduling, insights',
    category: 'Social Media',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.instagram.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0,
  },
  stripe: {
    integrationId: 'stripe',
    name: 'Stripe',
    description: 'Payments, invoices, subscriptions',
    category: 'Payment',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.stripe.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0, // 2.9% + 30¢
  },
  paypal: {
    integrationId: 'paypal',
    name: 'PayPal',
    description: 'Payments, invoices',
    category: 'Payment',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.paypal.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0,
  },

  // Storage
  googledrive: {
    integrationId: 'googledrive',
    name: 'Google Drive',
    description: 'File storage, sharing, uploads',
    category: 'Storage',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.google.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  dropbox: {
    integrationId: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud storage, sync, sharing',
    category: 'Storage',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.dropbox.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  s3: {
    integrationId: 's3',
    name: 'AWS S3',
    description: 'Object storage, buckets',
    category: 'Storage',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://aws.amazon.com/favicon.ico',
    setupDifficulty: 'hard',
    costPerMonth: 0, // Pay per GB
  },

  // Analytics
  googleanalytics: {
    integrationId: 'googleanalytics',
    name: 'Google Analytics',
    description: 'Website analytics, events, conversion',
    category: 'Analytics',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.google.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  mixpanel: {
    integrationId: 'mixpanel',
    name: 'Mixpanel',
    description: 'User analytics, events, retention',
    category: 'Analytics',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.mixpanel.com/favicon.ico',
    setupDifficulty: 'medium',
    costPerMonth: 0,
  },

  // API & Webhooks
  zapier: {
    integrationId: 'zapier',
    name: 'Zapier',
    description: 'Workflow automation platform',
    category: 'Automation',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.zapier.com/favicon.ico',
    setupDifficulty: 'easy',
    costPerMonth: 0,
  },
  webhooks: {
    integrationId: 'webhooks',
    name: 'Webhooks',
    description: 'HTTP callbacks, real-time events',
    category: 'API',
    relevanceScore: 0,
    reason: '',
    iconUrl: 'https://www.webhook.cool/favicon.ico',
    setupDifficulty: 'hard',
    costPerMonth: 0,
  },
};

/**
 * Keyword map for matching integrations
 */
const INTEGRATION_KEYWORDS: Record<string, string[]> = {
  gmail: ['email', 'send email', 'gmail', 'mail'],
  mailchimp: ['email marketing', 'newsletter', 'campaign', 'mailchimp'],
  slack: ['slack', 'notification', 'message', 'alert', 'team chat'],
  salesforce: ['salesforce', 'crm', 'lead', 'opportunity', 'account'],
  hubspot: ['hubspot', 'crm', 'contact', 'deal', 'pipeline'],
  stripe: ['stripe', 'payment', 'invoice', 'charge', 'subscription'],
  airtable: ['airtable', 'spreadsheet', 'database', 'table', 'form'],
  googledrive: ['google drive', 'upload', 'file storage', 'drive', 'gdrive'],
  asana: ['asana', 'task', 'project management', 'workflow'],
  notion: ['notion', 'docs', 'wiki', 'knowledge base'],
  twitter: ['twitter', 'x', 'social media', 'tweet', 'post'],
  twilio: ['twilio', 'sms', 'text message', 'phone', 'voice'],
  postgres: ['postgres', 'database', 'sql', 'query', 'data'],
  zapier: ['zapier', 'automation', 'workflow', 'integration'],
  webhooks: ['webhook', 'http', 'callback', 'real-time', 'event'],
};

/**
 * Get recommended integrations based on description
 */
export function getRecommendedIntegrations(
  description: string,
  availableIntegrations: string[] = Object.keys(POPULAR_INTEGRATIONS)
): IntegrationRecommendation[] {
  const lowerDesc = description.toLowerCase();
  const recommendations: Array<IntegrationRecommendation & { score: number }> = [];

  for (const [integrationId, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    if (!availableIntegrations.includes(integrationId)) continue;

    let score = 0;
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        score += 10;
      }
    }

    if (score > 0) {
      const integration = POPULAR_INTEGRATIONS[integrationId];
      recommendations.push({
        ...integration,
        relevanceScore: Math.min(score, 100),
        reason: generateRecommendationReason(integrationId, lowerDesc),
        score,
      });
    }
  }

  // Sort by score and return top 5
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5).map(({ score, ...rest }) => rest);
}

/**
 * Generate human-readable reason
 */
function generateRecommendationReason(integrationId: string, description: string): string {
  const reasons: Record<string, string> = {
    gmail: 'Based on email in your description',
    slack: 'For team notifications and alerts',
    salesforce: 'To manage leads and opportunities',
    hubspot: 'For CRM and contact management',
    stripe: 'To process payments securely',
    airtable: 'For database and spreadsheet operations',
    googledrive: 'To handle file uploads and storage',
    asana: 'For task and project management',
    twilio: 'For SMS and messaging capabilities',
  };

  return reasons[integrationId] || 'Commonly used with similar automations';
}

/**
 * Check if integration is already configured
 */
export function isIntegrationConfigured(
  integrationId: string,
  configuredIntegrations: string[]
): boolean {
  return configuredIntegrations.includes(integrationId);
}

/**
 * Get integration setup difficulty
 */
export function getSetupDifficulty(integrationId: string): 'easy' | 'medium' | 'hard' {
  return POPULAR_INTEGRATIONS[integrationId]?.setupDifficulty || 'medium';
}

/**
 * Get total estimated monthly cost
 */
export function estimateMonthlyCost(integrationIds: string[]): number {
  let total = 0;
  for (const id of integrationIds) {
    const integration = POPULAR_INTEGRATIONS[id];
    if (integration?.costPerMonth) {
      total += integration.costPerMonth;
    }
  }
  return total;
}

/**
 * Get integrations by category
 */
export function getIntegrationsByCategory(category: string): IntegrationRecommendation[] {
  return Object.values(POPULAR_INTEGRATIONS).filter((int) => int.category === category);
}

/**
 * Get missing integrations for plan
 */
export function getMissingIntegrations(
  planSteps: any[],
  configuredIntegrations: string[]
): IntegrationRecommendation[] {
  const mentioned: string[] = [];

  // Simple heuristic: look for integration names in plan steps
  for (const step of planSteps) {
    const stepStr = JSON.stringify(step).toLowerCase();
    for (const [integrationId, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (stepStr.includes(keyword)) {
          mentioned.push(integrationId);
          break;
        }
      }
    }
  }

  // Filter to missing integrations
  const missing = mentioned.filter((int) => !configuredIntegrations.includes(int));
  const unique = Array.from(new Set(missing));

  return unique.map((id) => ({
    ...POPULAR_INTEGRATIONS[id],
    relevanceScore: 85,
    reason: 'Needed for your automation plan',
  }));
}
