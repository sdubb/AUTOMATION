import { useState } from 'react';
import { HelpCircle, X, ChevronDown, MessageCircle, BookOpen } from 'lucide-react';

type HelpContext = 'dashboard' | 'creator' | 'connections' | 'history' | 'general';

interface HelpWidget {
  title: string;
  content: string;
}

const HELP_CONTENT: Record<HelpContext, HelpWidget[]> = {
  dashboard: [
    {
      title: 'How to activate an automation?',
      content: 'Click the Play button (▶) on any automation card. Once active, it will run automatically whenever the trigger happens.',
    },
    {
      title: 'How to test an automation?',
      content: 'Click the Test button (🧪) to run the automation in dry-run mode. This shows if it will work without sending real data.',
    },
    {
      title: 'How to see execution history?',
      content: 'Click the History button (⏱) on any automation to view when it ran, if it succeeded, and any error messages.',
    },
    {
      title: 'How to pause an automation?',
      content: 'Click the Pause button (⏸) to temporarily stop it. Click Play to resume it later.',
    },
    {
      title: 'How to delete an automation?',
      content: 'Click the Delete button (🗑) to remove an automation. This cannot be undone, so be careful!',
    },
  ],
  creator: [
    {
      title: 'What should I write in the prompt?',
      content: 'Be specific and clear: "Send me a Slack message when I get an important email" or "Add new form responses to Google Sheets". The AI understands plain English.',
    },
    {
      title: 'What if the AI misunderstands?',
      content: 'The AI shows you its plan before creating. If it\'s wrong, click "Edit" to modify the trigger, action, or configuration.',
    },
    {
      title: 'Do I need to connect services first?',
      content: 'Not necessarily! If you haven\'t connected a service, you\'ll see a button to do it after the AI creates the plan.',
    },
    {
      title: 'Can I use the same automation with different accounts?',
      content: 'Each automation uses one connection. To use a different account, you\'ll need to create a new automation with that connection.',
    },
  ],
  connections: [
    {
      title: 'What does "Expiring Soon" mean?',
      content: 'Your authentication token will expire soon. Click Refresh to renew it before it expires, or automations might stop working.',
    },
    {
      title: 'Why did my connection expire?',
      content: 'OAuth tokens naturally expire (usually monthly). The system automatically refreshes them, but you can manually refresh in the Connections panel.',
    },
    {
      title: 'How do I add a new connection?',
      content: 'Click "Add Connection", select the service (Gmail, Slack, etc.), and follow the OAuth login. Your token is securely stored.',
    },
    {
      title: 'Is my password/token secure?',
      content: 'Passwords are encrypted and never stored. We only store OAuth tokens (which don\'t contain your password).',
    },
    {
      title: 'How many connections can I have?',
      content: 'You can connect as many services as you want. Each connection is independent.',
    },
  ],
  history: [
    {
      title: 'What does "Success" mean?',
      content: 'The automation ran completely. The trigger happened, and all actions were executed successfully.',
    },
    {
      title: 'What does "Failed" mean?',
      content: 'Something went wrong (connection error, permission denied, etc.). Click on the error to see details and how to fix it.',
    },
    {
      title: 'How far back does history go?',
      content: 'History is stored indefinitely. You can scroll through all past runs of an automation.',
    },
    {
      title: 'Can I re-run a past automation?',
      content: 'Not directly from history, but you can create a new test run from the main dashboard.',
    },
  ],
  general: [
    {
      title: 'Is this free?',
      content: 'Check your account settings for pricing information. We offer both free and paid plans.',
    },
    {
      title: 'How do I contact support?',
      content: 'Click "Contact Support" at the bottom of this menu, or email support@automationplatform.com',
    },
    {
      title: 'Can I cancel anytime?',
      content: 'Yes! You can delete all automations and connections anytime. No long-term contracts required.',
    },
    {
      title: 'What services are supported?',
      content: 'We support 500+ integrations including Gmail, Slack, Google Sheets, GitHub, Stripe, Shopify, and many more.',
    },
  ],
};

interface HelpWidgetProps {
  context?: HelpContext;
}

export function HelpWidget({ context = 'general' }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showFAQ, setShowFAQ] = useState(true);

  const helpItems = HELP_CONTENT[context];

  return (
    <>
      {/* Help Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center transition transform hover:scale-110 z-40 hover:shadow-purple-500/50"
        aria-label="Open help"
        title="Need help?"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden z-40 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Help Center</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1 transition"
              aria-label="Close help"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-96">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-slate-200 sticky top-0 bg-slate-50">
              <button
                onClick={() => setShowFAQ(true)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex items-center justify-center gap-2 ${
                  showFAQ
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                FAQ
              </button>
              <button
                onClick={() => setShowFAQ(false)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex items-center justify-center gap-2 ${
                  !showFAQ
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Support
              </button>
            </div>

            {showFAQ ? (
              <div className="p-4 space-y-2">
                {helpItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg transition ${
                      expandedIndex === index
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                        : 'bg-white hover:bg-slate-50 border border-transparent'
                    }`}>
                      <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-600 flex-shrink-0 transition ${
                          expandedIndex === index ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </div>
                    {expandedIndex === index && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    Live Chat Support
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Chat with our support team in real-time
                  </p>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg">
                    Start Live Chat
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span>📧</span>
                    Email Support
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Email us for detailed help (response in 24 hours)
                  </p>
                  <a
                    href="mailto:support@automationplatform.com"
                    className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2 rounded-lg text-sm font-medium transition text-center shadow-md hover:shadow-lg"
                  >
                    support@automationplatform.com
                  </a>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span>📚</span>
                    Knowledge Base
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Read detailed articles and tutorials
                  </p>
                  <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg">
                    View Knowledge Base
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
