/**
 * Automation Templates
 * Pre-built templates users can customize
 * Reduces friction for new users
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'messaging' | 'database' | 'workflow' | 'analytics' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  prompt: string; // The natural language description for Groq
  estimatedTime: string; // e.g. "5 minutes"
  tags: string[];
  usageCount: number; // How many users have used this
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'email-daily-summary',
    name: 'Daily Email Summary',
    description: 'Get a daily digest of emails with specific keywords',
    category: 'email',
    difficulty: 'easy',
    icon: '📧',
    prompt:
      'Every morning at 9 AM, send me an email summarizing all the messages I received yesterday with [keyword]. Include sender, subject, and a 1-line summary.',
    estimatedTime: '2 minutes',
    tags: ['email', 'daily', 'productivity'],
    usageCount: 1243,
  },

  {
    id: 'slack-to-database',
    name: 'Save Slack Messages to Database',
    description: 'Automatically archive important Slack messages to a database',
    category: 'messaging',
    difficulty: 'medium',
    icon: '💾',
    prompt:
      'When someone posts a message in Slack #[channel] with [emoji reaction], save it to a Google Sheet with: timestamp, user, message, channel.',
    estimatedTime: '5 minutes',
    tags: ['slack', 'database', 'automation'],
    usageCount: 892,
  },

  {
    id: 'form-to-email',
    name: 'Form Submission Alert',
    description: 'Get notified when someone submits a form',
    category: 'workflow',
    difficulty: 'easy',
    icon: '📋',
    prompt:
      'When someone submits [form name], send me an email with all their responses and a Slack notification to #[channel].',
    estimatedTime: '3 minutes',
    tags: ['forms', 'email', 'notification'],
    usageCount: 2156,
  },

  {
    id: 'lead-enrichment',
    name: 'Lead Enrichment Pipeline',
    description: 'Automatically enrich new leads with company info',
    category: 'analytics',
    difficulty: 'hard',
    icon: '🔍',
    prompt:
      'When a new lead is added to [CRM], look up their company using [data source], fetch company size, industry, and funding, then update the CRM record.',
    estimatedTime: '10 minutes',
    tags: ['crm', 'leads', 'enrichment'],
    usageCount: 456,
  },

  {
    id: 'social-monitor',
    name: 'Social Media Monitoring',
    description: 'Track mentions of your brand across social media',
    category: 'social',
    difficulty: 'medium',
    icon: '📱',
    prompt:
      'Every hour, search Twitter and LinkedIn for mentions of [keyword]. If more than [count] mentions found, send me a Slack notification with links.',
    estimatedTime: '7 minutes',
    tags: ['social', 'monitoring', 'marketing'],
    usageCount: 678,
  },

  {
    id: 'invoice-automation',
    name: 'Invoice Generation & Payment Reminder',
    description: 'Auto-generate invoices and send payment reminders',
    category: 'workflow',
    difficulty: 'hard',
    icon: '💰',
    prompt:
      'When a new order is created in [platform], generate an invoice with itemized details, send it to the customer email, and set a reminder to follow up if unpaid after 7 days.',
    estimatedTime: '15 minutes',
    tags: ['invoicing', 'payment', 'automation'],
    usageCount: 523,
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: AutomationTemplate['category']
): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): AutomationTemplate[] {
  const lower = query.toLowerCase();
  return AUTOMATION_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

/**
 * Get top trending templates (sorted by usage)
 */
export function getTrendingTemplates(limit: number = 5): AutomationTemplate[] {
  return [...AUTOMATION_TEMPLATES]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Get recommended templates based on user's existing automations
 */
export function getRecommendedTemplates(
  userCategories: AutomationTemplate['category'][]
): AutomationTemplate[] {
  const recommended = new Set<AutomationTemplate>();

  // Get templates from complementary categories
  const categoryMap: Record<AutomationTemplate['category'], AutomationTemplate['category'][]> = {
    email: ['messaging', 'workflow'],
    messaging: ['email', 'database'],
    database: ['analytics', 'workflow'],
    workflow: ['email', 'messaging'],
    analytics: ['database', 'social'],
    social: ['analytics', 'email'],
  };

  for (const category of userCategories) {
    const complementary = categoryMap[category] || [];
    for (const comp of complementary) {
      getTemplatesByCategory(comp).forEach((t) => recommended.add(t));
    }
  }

  return Array.from(recommended).slice(0, 5);
}
