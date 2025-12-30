/**
 * MCP Setup Component
 * Helps users connect Claude/Cursor/Windsurf to Activepieces MCP server
 * Uses VITE_ACTIVEPIECES_URL from environment
 */

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateWindsurfConfig,
} from '../lib/mcp/client';

interface MCPSetupProps {
  activepiecesUrl?: string;
}

const defaultActivepiecesUrl = import.meta.env.VITE_ACTIVEPIECES_URL || 'http://localhost:3000';

export function MCPSetupComponent({ activepiecesUrl = defaultActivepiecesUrl }: MCPSetupProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'claude' | 'cursor' | 'windsurf'>('overview');

  const claudeConfig = generateClaudeDesktopConfig(activepiecesUrl);
  const cursorConfig = generateCursorConfig(activepiecesUrl);
  const windsurfConfig = generateWindsurfConfig(activepiecesUrl);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const ConfigBlock = ({ config }: { config: any }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
      <code>{JSON.stringify(config.configTemplate, null, 2)}</code>
    </pre>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-6 dark:border-blue-900 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Connect AI Tools to Activepieces
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Use Activepieces MCP server to access 500+ integrations from Claude Desktop, Cursor, or Windsurf
        </p>
        <a
          href="https://docs.activepieces.com/mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Read Activepieces MCP Documentation
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'claude', label: 'Claude Desktop' },
            { id: 'cursor', label: 'Cursor' },
            { id: 'windsurf', label: 'Windsurf' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">What is MCP?</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Model Context Protocol (MCP) allows AI tools like Claude, Cursor, and Windsurf to access external tools and integrations. With Activepieces MCP, your AI tools gain access to 500+ pre-built integrations for automations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">How it works:</h4>
              <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                <li>1. You configure your AI tool with Activepieces MCP server details</li>
                <li>2. Your AI tool connects to Activepieces' MCP server</li>
                <li>3. All 500+ integrations become available as tools in your AI</li>
                <li>4. You can describe what you want to automate in natural language</li>
              </ol>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Note:</strong> You need to have Activepieces running and get your API key from Activepieces Dashboard
              </p>
            </div>
          </div>
        )}

        {activeTab === 'claude' && (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {claudeConfig.instructions}
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Configuration:</h4>
              <ConfigBlock config={claudeConfig} />
              <button
                onClick={() => handleCopy(JSON.stringify(claudeConfig.configTemplate, null, 2), 'claude')}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedField === 'claude' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'claude' ? 'Copied!' : 'Copy Configuration'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cursor' && (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {cursorConfig.instructions}
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Configuration:</h4>
              <ConfigBlock config={cursorConfig} />
              <button
                onClick={() => handleCopy(JSON.stringify(cursorConfig.configTemplate, null, 2), 'cursor')}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedField === 'cursor' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'cursor' ? 'Copied!' : 'Copy Configuration'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'windsurf' && (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {windsurfConfig.instructions}
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Configuration:</h4>
              <ConfigBlock config={windsurfConfig} />
              <button
                onClick={() => handleCopy(JSON.stringify(windsurfConfig.configTemplate, null, 2), 'windsurf')}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedField === 'windsurf' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'windsurf' ? 'Copied!' : 'Copy Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
