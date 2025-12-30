/**
 * Modern Landing Page
 * Hero, features, pricing, testimonials, CTA
 */

import { Zap, ArrowRight, Check, Users, Zap as ZapIcon, Cpu, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [darkMode, setDarkMode] = useState(false);

  const features = [
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: 'AI-Powered',
      description: 'Describe what you want to automate. AI builds the workflow instantly.',
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Smart Retry Logic',
      description: 'Automatic retry with exponential backoff. Handles flakiness gracefully.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Execution Analytics',
      description: 'Track ROI: time saved, success rates, cost estimates, and trends.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Role-based access, approvals, and audit logs for enterprise teams.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '330+ Integrations',
      description: 'Connect to all your favorite tools: Slack, Gmail, Salesforce, and more.',
    },
    {
      icon: <Check className="w-6 h-6" />,
      title: 'Version Control',
      description: 'Version history, diffs, and one-click rollbacks for safe editing.',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Perfect for individuals',
      features: [
        'Up to 10 automations',
        '100 executions/month',
        'Email support',
        'Basic analytics',
        'No team collaboration',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'For growing teams',
      features: [
        'Unlimited automations',
        '100K executions/month',
        'Priority support',
        'Advanced analytics',
        'Team collaboration (5 members)',
        'Custom integrations',
        'Approval workflows',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Unlimited executions',
        'Dedicated support',
        'Unlimited team members',
        'SSO & advanced security',
        'Audit logs',
        'On-premise option',
        'SLA guarantees',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const testimonials = [
    {
      quote: 'AutoFlow saved us 20 hours per week. The AI makes automation accessible to non-technical users.',
      author: 'Sarah Chen',
      role: 'Operations Manager',
      company: 'TechStartup Inc',
      avatar: '👩‍💼',
    },
    {
      quote: 'The smart retry logic is a game-changer. No more manual fixes for flaky automations.',
      author: 'James Rodriguez',
      role: 'DevOps Lead',
      company: 'CloudServices Co',
      avatar: '👨‍💻',
    },
    {
      quote: 'Version control for workflows? Game-changing! We feel safe experimenting with edits now.',
      author: 'Emily Watson',
      role: 'Process Manager',
      company: 'RetailBrand LLC',
      avatar: '👩‍🔬',
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <Zap className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AutoFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`${darkMode ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-b from-blue-50 via-white to-white'} py-20 sm:py-32`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-semibold">
            🎉 Join 10,000+ teams automating their workflows
          </div>

          <h1 className={`text-5xl sm:text-6xl font-black mb-6 leading-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Automate <span className="text-blue-600">anything</span> with AI
          </h1>

          <p className={`text-xl sm:text-2xl mb-8 max-w-2xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Describe what you want to automate. Our AI builds the workflow. Watch it run flawlessly with smart retries, version control, and team collaboration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Create Your First Automation
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className={`px-8 py-4 rounded-xl font-bold text-lg transition ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
            }`}>
              Watch Demo (2 min)
            </button>
          </div>

          {/* Hero Image */}
          <div className={`rounded-2xl overflow-hidden shadow-2xl border ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`aspect-video ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-100 to-purple-100'} flex items-center justify-center`}>
              <div className="text-center">
                <Zap className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Everything you need
            </h2>
            <p className={`text-xl ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Built for automation excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 transition ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                    : 'bg-white hover:shadow-lg border border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center ${
                  darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Simple, transparent pricing
            </h2>
            <p className={`text-xl ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl overflow-hidden transition ${
                  plan.popular
                    ? `shadow-2xl ring-2 ring-blue-500 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`
                    : `${
                        darkMode
                          ? 'bg-gray-800 hover:shadow-xl'
                          : 'bg-gray-50 hover:shadow-lg border border-gray-200'
                      }`
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 text-white py-2 text-center font-bold text-sm">
                    MOST POPULAR ⭐
                  </div>
                )}

                <div className="p-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className={`text-sm ml-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        /month
                      </span>
                    )}
                  </div>

                  <button
                    onClick={onGetStarted}
                    className={`w-full py-3 font-bold rounded-lg transition mb-8 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Loved by teams
            </h2>
            <p className={`text-xl ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              See what people are building
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 ${
                  darkMode
                    ? 'bg-gray-700 border border-gray-600'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{testimonial.avatar}</span>
                  <div>
                    <p className={`font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {testimonial.author}
                    </p>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className={`italic ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${
        darkMode
          ? 'bg-gradient-to-r from-blue-900 to-purple-900'
          : 'bg-gradient-to-r from-blue-600 to-purple-600'
      } py-20`}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to automate?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams saving hours every week.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold text-lg rounded-xl transition shadow-lg flex items-center gap-2 mx-auto"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
      } border-t py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            © 2025 AutoFlow. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <a href="#" className={`transition ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}>Privacy</a>
            <a href="#" className={`transition ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}>Terms</a>
            <a href="#" className={`transition ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
