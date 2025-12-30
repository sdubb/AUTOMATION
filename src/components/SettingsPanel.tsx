import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Mail, Lock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { backendService } from '../lib/backendService';
import { Tooltip } from './Tooltip';

interface AccountSettings {
  email?: string;
  fullName?: string;
  enableEmailNotifications?: boolean;
  enableSlackNotifications?: boolean;
  twoFactorEnabled?: boolean;
}

interface AutomationSettings {
  defaultTimeout?: number;
  maxRetries?: number;
  enableAutoRetry?: boolean;
  defaultApprovalTimeout?: number;
}

interface SettingsPanelProps {
  darkMode?: boolean;
}

export function SettingsPanel({ darkMode = false }: SettingsPanelProps) {
  const [tab, setTab] = useState<'account' | 'automation' | 'notifications' | 'security'>('account');
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({});
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationSuccess, setValidationSuccess] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load current user settings - get from localStorage or API
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      const userName = localStorage.getItem('userName') || 'User';
      
      setAccountSettings({
        email: userEmail,
        fullName: userName,
        enableEmailNotifications: true,
        enableSlackNotifications: false,
        twoFactorEnabled: false,
      });

      // Load automation defaults
      setAutomationSettings({
        defaultTimeout: 300000,
        maxRetries: 3,
        enableAutoRetry: true,
        defaultApprovalTimeout: 3600000,
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    if (isValid) {
      setValidationSuccess((prev) => ({ ...prev, email: true }));
      setValidationErrors((prev) => ({ ...prev, email: '' }));
    } else {
      setValidationSuccess((prev) => ({ ...prev, email: false }));
      setValidationErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
    }
    return isValid;
  };

  const validateFullName = (name: string): boolean => {
    const isValid = name.trim().length >= 2;
    if (isValid) {
      setValidationSuccess((prev) => ({ ...prev, fullName: true }));
      setValidationErrors((prev) => ({ ...prev, fullName: '' }));
    } else {
      setValidationSuccess((prev) => ({ ...prev, fullName: false }));
      setValidationErrors((prev) => ({ ...prev, fullName: 'Name must be at least 2 characters' }));
    }
    return isValid;
  };

  const validateTimeout = (timeout: number): boolean => {
    const isValid = timeout >= 1000 && timeout <= 3600000;
    if (isValid) {
      setValidationSuccess((prev) => ({ ...prev, defaultTimeout: true }));
      setValidationErrors((prev) => ({ ...prev, defaultTimeout: '' }));
    } else {
      setValidationSuccess((prev) => ({ ...prev, defaultTimeout: false }));
      setValidationErrors((prev) => ({ ...prev, defaultTimeout: 'Timeout must be between 1s and 1 hour' }));
    }
    return isValid;
  };

  const saveAccountSettings = async () => {
    const errors = [];
    
    if (!validateEmail(accountSettings.email || '')) {
      errors.push('email');
    }
    if (!validateFullName(accountSettings.fullName || '')) {
      errors.push('fullName');
    }

    if (errors.length > 0) {
      setMessage('Please fix the errors above');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      // Call backend to save account settings
      if (accountSettings.email) {
        await backendService.automations.update?.('settings', {
          accountEmail: accountSettings.email,
          fullName: accountSettings.fullName,
        });
      }
      setMessage('Account settings saved! ✅');
      setValidationSuccess({ email: false, fullName: false });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAutomationSettings = async () => {
    if (!validateTimeout(automationSettings.defaultTimeout || 300000)) {
      setMessage('Please fix the errors above');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      // Call backend to save automation settings
      await backendService.automations.update?.('settings', {
        defaultTimeout: automationSettings.defaultTimeout,
        maxRetries: automationSettings.maxRetries,
        enableAutoRetry: automationSettings.enableAutoRetry,
        defaultApprovalTimeout: automationSettings.defaultApprovalTimeout,
      });
      setMessage('Automation settings saved! ✅');
      setValidationSuccess({ defaultTimeout: false });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const generateAPIToken = async () => {
    try {
      const token = `ap_${Math.random().toString(36).substr(2, 32)}`;
      setApiToken(token);
      setMessage('API token generated! Copy it now - you won\'t see it again');
    } catch (err) {
      setMessage('Failed to generate API token');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied to clipboard! ✅');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('Failed to copy');
    }
  };

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`rounded-lg ${bgClass} shadow`}>
      {/* Tabs */}
      <div className={`flex border-b ${borderClass}`}>
        {(['account', 'automation', 'notifications', 'security'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : `border-transparent ${textClass} hover:text-blue-600`
            }`}
          >
            {t === 'account' && '👤 Account'}
            {t === 'automation' && '⚙️ Automation'}
            {t === 'notifications' && '🔔 Notifications'}
            {t === 'security' && '🔒 Security'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 space-y-6">
        {/* Account Settings */}
        {tab === 'account' && (
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textClass}`}>Account Settings</h3>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${textClass}`}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                {validationSuccess.email && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {validationErrors.email && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
              <input
                type="email"
                value={accountSettings.email || ''}
                onChange={(e) => {
                  setAccountSettings({ ...accountSettings, email: e.target.value });
                  if (e.target.value) validateEmail(e.target.value);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.email
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950'
                    : validationSuccess.email
                      ? 'border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-950'
                      : `${borderClass} focus:ring-blue-500`
                }`}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-xs mt-1 text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.email}
                </p>
              )}
              {!validationErrors.email && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your login email address
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${textClass}`}>Full Name</label>
                {validationSuccess.fullName && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {validationErrors.fullName && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
              <input
                type="text"
                value={accountSettings.fullName || ''}
                onChange={(e) => {
                  setAccountSettings({ ...accountSettings, fullName: e.target.value });
                  if (e.target.value) validateFullName(e.target.value);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.fullName
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950'
                    : validationSuccess.fullName
                      ? 'border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-950'
                      : `${borderClass} focus:ring-blue-500`
                }`}
                disabled={loading}
              />
              {validationErrors.fullName && (
                <p className="text-xs mt-1 text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.fullName}
                </p>
              )}
            </div>

            <button
              onClick={saveAccountSettings}
              disabled={saving || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Account Settings'}
            </button>
          </div>
        )}

        {/* Automation Settings */}
        {tab === 'automation' && (
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textClass}`}>Automation Defaults</h3>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className={`block text-sm font-medium ${textClass}`}>
                    <Zap className="w-4 h-4 inline mr-2" />
                    Default Execution Timeout (ms)
                  </label>
                  <Tooltip content="Maximum time in milliseconds for automation execution (1 second to 1 hour)" position="right">
                    <span className={`text-xs cursor-help ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>?</span>
                  </Tooltip>
                </div>
                {validationSuccess.defaultTimeout && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {validationErrors.defaultTimeout && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
              <input
                type="number"
                value={automationSettings.defaultTimeout || 300000}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setAutomationSettings({ ...automationSettings, defaultTimeout: value });
                  if (value) validateTimeout(value);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.defaultTimeout
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950'
                    : validationSuccess.defaultTimeout
                      ? 'border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-950'
                      : `${borderClass} focus:ring-blue-500`
                }`}
                disabled={loading}
              />
              {validationErrors.defaultTimeout && (
                <p className="text-xs mt-1 text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.defaultTimeout}
                </p>
              )}
              {!validationErrors.defaultTimeout && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {automationSettings.defaultTimeout ? `${(automationSettings.defaultTimeout / 1000).toFixed(1)} seconds` : 'Maximum time for automation execution'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className={`block text-sm font-medium ${textClass}`}>Max Retry Attempts</label>
                <Tooltip content="Number of times to automatically retry failed automation runs (1-10)" position="right">
                  <span className={`text-xs cursor-help ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>?</span>
                </Tooltip>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={automationSettings.maxRetries || 3}
                onChange={(e) => setAutomationSettings({ ...automationSettings, maxRetries: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border ${borderClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={loading}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                How many times to retry failed automations
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-3 p-3 rounded border ${borderClass} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex-1 transition`}>
                  <input
                    type="checkbox"
                    checked={automationSettings.enableAutoRetry || false}
                    onChange={(e) => setAutomationSettings({ ...automationSettings, enableAutoRetry: e.target.checked })}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className={`text-sm font-medium ${textClass}`}>Enable Auto-Retry</span>
                </label>
                <Tooltip content="Automatically retry failed runs using exponential backoff strategy" position="left">
                  <span className={`text-xs cursor-help ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>?</span>
                </Tooltip>
              </div>
              <p className={`text-xs mt-1 ml-7 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Automatically retry failed automations using exponential backoff
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>Default Approval Timeout (ms)</label>
              <input
                type="number"
                value={automationSettings.defaultApprovalTimeout || 3600000}
                onChange={(e) => setAutomationSettings({ ...automationSettings, defaultApprovalTimeout: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border ${borderClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={loading}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                How long to wait for approvals before auto-executing
              </p>
            </div>

            <button
              onClick={saveAutomationSettings}
              disabled={saving || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Automation Settings'}
            </button>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textClass}`}>Notification Preferences</h3>

            <label className={`flex items-center gap-3 p-3 rounded border ${borderClass} cursor-pointer hover:bg-gray-50`}>
              <input
                type="checkbox"
                checked={accountSettings.enableEmailNotifications || false}
                onChange={(e) => setAccountSettings({ ...accountSettings, enableEmailNotifications: e.target.checked })}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${textClass}`}>Email Notifications</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Get notified via email for approval requests and automation failures
                </p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded border ${borderClass} cursor-pointer hover:bg-gray-50`}>
              <input
                type="checkbox"
                checked={accountSettings.enableSlackNotifications || false}
                onChange={(e) => setAccountSettings({ ...accountSettings, enableSlackNotifications: e.target.checked })}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${textClass}`}>Slack Notifications</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Get notified on Slack for approval requests and automation failures (coming soon)
                </p>
              </div>
            </label>

            <button
              onClick={saveAccountSettings}
              disabled={saving || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textClass}`}>Security Settings</h3>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" />
                <label className={`text-sm font-medium ${textClass}`}>Two-Factor Authentication</label>
              </div>
              <div className={`p-3 rounded border ${borderClass}`}>
                <p className={`text-sm ${textClass} mb-3`}>
                  {accountSettings.twoFactorEnabled ? '✅ 2FA is enabled' : '❌ 2FA is not enabled'}
                </p>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  {accountSettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-3`}>API Token</label>
              <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use this token to authenticate API requests
              </p>
              {apiToken ? (
                <div className={`p-3 rounded border ${borderClass} bg-blue-50 flex items-center gap-2 mb-3`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={apiToken}
                    readOnly
                    className="flex-1 bg-transparent focus:outline-none font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiToken)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateAPIToken}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Generate New Token
                </button>
              )}
            </div>

            <div className={`p-3 rounded ${darkMode ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-900'} mb-2`}>Danger Zone</p>
              <button className={`text-sm font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition`}>
                Reset All Settings to Default
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded ${message.includes('Failed') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
