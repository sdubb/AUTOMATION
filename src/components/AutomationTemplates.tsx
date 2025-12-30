import { useState } from 'react';
import { Copy, Lightbulb, X } from 'lucide-react';

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  services: string[];
}

export const AUTOMATION_TEMPLATES: Template[] = [
  {
    id: 'save-emails-to-drive',
    title: 'Save Important Emails to Google Drive',
    description: 'Automatically save Gmail attachments to a Google Drive folder',
    category: 'Email & Storage',
    prompt: 'When I receive an email with attachments, save them to a folder in Google Drive',
    icon: '💾',
    difficulty: 'easy',
    services: ['Gmail', 'Google Drive'],
  },
  {
    id: 'slack-email-notifications',
    title: 'Get Slack Notifications for Important Emails',
    description: 'Receive a Slack message when important emails arrive',
    category: 'Communication',
    prompt: 'Send me a Slack message when I receive an email from my boss or important contacts',
    icon: '🔔',
    difficulty: 'easy',
    services: ['Gmail', 'Slack'],
  },
  {
    id: 'form-to-sheets',
    title: 'Log Form Submissions to Google Sheets',
    description: 'Automatically add form responses to a spreadsheet',
    category: 'Productivity',
    prompt: 'When someone submits a form, add their response to a Google Sheets spreadsheet',
    icon: '📊',
    difficulty: 'easy',
    services: ['Google Forms', 'Google Sheets'],
  },
  {
    id: 'daily-reminder',
    title: 'Daily Slack Reminder',
    description: 'Get a reminder in Slack at a specific time each day',
    category: 'Productivity',
    prompt: 'Send me a Slack reminder every morning at 9 AM',
    icon: '⏰',
    difficulty: 'easy',
    services: ['Slack'],
  },
  {
    id: 'twitter-mentions-alert',
    title: 'Get Notified of Twitter Mentions',
    description: 'Receive alerts when someone mentions you on Twitter',
    category: 'Social Media',
    prompt: 'Send me a Slack message when someone mentions me on Twitter',
    icon: '📱',
    difficulty: 'easy',
    services: ['Twitter', 'Slack'],
  },
  {
    id: 'github-issue-tracking',
    title: 'GitHub Issues to Spreadsheet',
    description: 'Track new GitHub issues in a Google Sheets',
    category: 'Development',
    prompt: 'When a new GitHub issue is created, add it to a Google Sheets issue tracker',
    icon: '🐙',
    difficulty: 'medium',
    services: ['GitHub', 'Google Sheets'],
  },
  {
    id: 'stripe-notification',
    title: 'Get Alerted on New Stripe Payments',
    description: 'Receive Slack notification when you get a new payment',
    category: 'E-commerce',
    prompt: 'Send me a Slack notification when I receive a payment in Stripe',
    icon: '💳',
    difficulty: 'medium',
    services: ['Stripe', 'Slack'],
  },
  {
    id: 'hubspot-slack-sync',
    title: 'HubSpot Deals to Slack',
    description: 'Get notified in Slack when a HubSpot deal is updated',
    category: 'CRM',
    prompt: 'Send a Slack message to sales channel when a HubSpot deal status changes',
    icon: '🤝',
    difficulty: 'medium',
    services: ['HubSpot', 'Slack'],
  },
  {
    id: 'shopify-airtable',
    title: 'Sync Shopify Orders to Airtable',
    description: 'Add new Shopify orders to an Airtable base',
    category: 'E-commerce',
    prompt: 'When a new order is placed in Shopify, add it to an Airtable base',
    icon: '🛍️',
    difficulty: 'medium',
    services: ['Shopify', 'Airtable'],
  },
  {
    id: 'linkedin-slack',
    title: 'LinkedIn Post Notifications',
    description: 'Get Slack alert when someone engages with your LinkedIn post',
    category: 'Social Media',
    prompt: 'Send me a Slack message when someone likes or comments on my LinkedIn post',
    icon: '💼',
    difficulty: 'medium',
    services: ['LinkedIn', 'Slack'],
  },
  {
    id: 'notion-email-archive',
    title: 'Archive Important Emails to Notion',
    description: 'Save important emails as Notion database entries',
    category: 'Productivity',
    prompt: 'When I star an email in Gmail, create an entry in my Notion email archive',
    icon: '📝',
    difficulty: 'advanced',
    services: ['Gmail', 'Notion'],
  },
  {
    id: 'trello-slack-sync',
    title: 'Trello Card Updates to Slack',
    description: 'Get Slack notifications for Trello card updates',
    category: 'Project Management',
    prompt: 'Send a Slack message when a Trello card is moved to Done column',
    icon: '📌',
    difficulty: 'advanced',
    services: ['Trello', 'Slack'],
  },
];

interface AutomationTemplatesProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export function AutomationTemplates({ onSelectTemplate, onClose }: AutomationTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', ...new Set(AUTOMATION_TEMPLATES.map((t) => t.category))];
  const filteredTemplates =
    selectedCategory === 'All'
      ? AUTOMATION_TEMPLATES
      : AUTOMATION_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Automation Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 hover:bg-slate-200 rounded transition"
            aria-label="Close templates"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Category Filter */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Filter by category:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition transform hover:scale-105 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-500 hover:shadow-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition p-5 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{template.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 mb-1 text-lg">{template.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{template.description}</p>

                {/* Services */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.services.map((service) => (
                      <span
                        key={service}
                        className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-lg text-xs text-slate-700 font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Prompt Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-mono text-blue-900 italic leading-relaxed">"{template.prompt}"</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyPrompt(template.prompt, template.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition text-sm font-medium ${
                      copiedId === template.id
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedId === template.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 rounded-lg transition font-medium text-sm shadow-md hover:shadow-lg"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
