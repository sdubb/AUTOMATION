import { useState } from 'react';
import { X, ChevronRight, CheckCircle2, Sparkles, Zap } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const EXAMPLE_AUTOMATIONS = [
  {
    id: 1,
    title: 'Save Important Emails',
    description: 'Save Gmail emails with attachments to Google Drive',
    prompt: 'Save emails with attachments from Gmail to a Google Drive folder',
    icon: '📧',
    category: 'Productivity',
  },
  {
    id: 2,
    title: 'Get Slack Notifications',
    description: 'Get notified in Slack when you receive important emails',
    prompt: 'Send me a Slack message when I receive an email from my boss',
    icon: '🔔',
    category: 'Communication',
  },
  {
    id: 3,
    title: 'Backup to Spreadsheet',
    description: 'Log form submissions to Google Sheets automatically',
    prompt: 'Add new form responses to a Google Sheets spreadsheet',
    icon: '📊',
    category: 'Productivity',
  },
  {
    id: 4,
    title: 'Social Media Alerts',
    description: 'Get notified when someone mentions you on Twitter',
    prompt: 'Send me a Slack message when someone mentions me on Twitter',
    icon: '📱',
    category: 'Social Media',
  },
  {
    id: 5,
    title: 'Daily Reminders',
    description: 'Get a daily reminder at a specific time',
    prompt: 'Send me a Slack reminder every morning at 9 AM',
    icon: '⏰',
    category: 'Productivity',
  },
];

type Step = 'welcome' | 'features' | 'examples' | 'how-it-works' | 'get-started';

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  const handleNext = () => {
    const steps: Step[] = ['welcome', 'features', 'examples', 'how-it-works', 'get-started'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: Step[] = ['welcome', 'features', 'examples', 'how-it-works', 'get-started'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome to Automation Platform</h2>
          <button
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-700 p-1"
            aria-label="Close onboarding"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="text-7xl mb-4 animate-bounce">✨</div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Automate Your Work in One Sentence
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto">
                No coding. No complex workflows. Just describe what you want to automate, and our AI handles the rest.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 mt-6 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-slate-900">
                  <strong className="text-blue-600">💡 Example:</strong> "Send me a Slack message when I get a Gmail from my boss"
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-6">
                This tour takes 2 minutes • You can skip anytime
              </p>
            </div>
          )}

          {/* Features Step */}
          {currentStep === 'features' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">What You Can Do</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
                    title: 'Create Automations',
                    description: 'Type what you want, AI builds it',
                    color: 'from-purple-50 to-purple-100'
                  },
                  {
                    icon: <Zap className="w-6 h-6 text-yellow-500" />,
                    title: 'Test Before Activating',
                    description: 'Try it safely with no real data affected',
                    color: 'from-yellow-50 to-yellow-100'
                  },
                  {
                    icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
                    title: 'See Execution History',
                    description: 'View when automations run and results',
                    color: 'from-green-50 to-green-100'
                  },
                  {
                    icon: <Zap className="w-6 h-6 text-blue-500" />,
                    title: 'Manage Connections',
                    description: 'Connect Gmail, Slack, Google Sheets, etc.',
                    color: 'from-blue-50 to-blue-100'
                  },
                ].map((feature, index) => (
                  <div key={index} className={`bg-gradient-to-br ${feature.color} rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all hover:scale-105`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{feature.icon}</div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{feature.title}</h4>
                        <p className="text-sm text-slate-600 mt-1.5">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples Step */}
          {currentStep === 'examples' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Popular Automations</h3>
              <p className="text-slate-600 text-sm">
                Here are some ideas to get you started. Click any to see the prompt:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {EXAMPLE_AUTOMATIONS.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedExample(selectedExample === example.id ? null : example.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      selectedExample === example.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl mt-1">{example.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{example.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{example.description}</p>
                        {selectedExample === example.id && (
                          <div className="mt-3 pt-3 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-xs font-mono text-blue-900 italic leading-relaxed">
                              "{example.prompt}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* How It Works Step */}
          {currentStep === 'how-it-works' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How It Works</h3>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Describe Your Automation',
                    description: 'Type what you want in plain English. No technical knowledge needed.',
                    icon: '✍️'
                  },
                  {
                    step: 2,
                    title: 'Review the Plan',
                    description: 'See what the AI understood. It shows the trigger and action in simple language.',
                    icon: '👀'
                  },
                  {
                    step: 3,
                    title: 'Connect Services',
                    description: 'Link your Gmail, Slack, Google Sheets, etc. (Only if you haven\'t already)',
                    icon: '🔗'
                  },
                  {
                    step: 4,
                    title: 'Test It',
                    description: 'Click "Test" to verify it works. No real data is affected.',
                    icon: '🧪'
                  },
                  {
                    step: 5,
                    title: 'Activate',
                    description: 'Turn it on and it runs automatically whenever the trigger happens.',
                    icon: '⚡'
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 group hover:bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg transition">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm shadow-lg group-hover:shadow-purple-500/50 group-hover:scale-110 transition">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Get Started Step */}
          {currentStep === 'get-started' && (
            <div className="text-center space-y-6">
              <div className="text-7xl mb-4 animate-bounce">🚀</div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ready to Get Started?</h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                You're all set! Here's what to do next:
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-3 text-left border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3 bg-white rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 flex-shrink-0 mt-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Connect your services</p>
                    <p className="text-sm text-slate-600 mt-0.5">Click "Add Connection" to link Gmail, Slack, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 flex-shrink-0 mt-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Create your first automation</p>
                    <p className="text-sm text-slate-600 mt-0.5">Type what you want to automate in one sentence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 flex-shrink-0 mt-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Test it first</p>
                    <p className="text-sm text-slate-600 mt-0.5">Always test before activating to verify it works</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Need help? Click the help icon (?) anywhere in the app
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <button
            onClick={handleSkip}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm transition hover:scale-105"
          >
            Skip Tour
          </button>

          <div className="flex gap-3">
            {currentStep !== 'welcome' && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition font-medium text-sm border border-slate-200"
              >
                Back
              </button>
            )}
            <button
              onClick={currentStep === 'get-started' ? handleSkip : handleNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
            >
              {currentStep === 'get-started' ? 'Start Using' : 'Next'}
              {currentStep !== 'get-started' && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 flex gap-2 justify-center border-t border-slate-200">
          {(['welcome', 'features', 'examples', 'how-it-works', 'get-started'] as const).map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-2.5 rounded-full transition-all hover:scale-125 ${
                currentStep === step ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-8 shadow-lg' : 'bg-slate-300 w-2 hover:bg-slate-400'
              }`}
              aria-label={`Go to ${step}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
