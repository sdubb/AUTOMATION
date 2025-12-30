import { useState, useEffect } from 'react';
import {
  getRecommendedIntegrations,
  IntegrationRecommendation,
  estimateMonthlyCost,
} from '../lib/integrationRecommendations';

interface IntegrationRecommendationsProps {
  automationDescription: string;
  configuredIntegrations?: string[];
  onSelectIntegration?: (integrationId: string) => void;
}

export function IntegrationRecommendationsUI({
  automationDescription,
  configuredIntegrations = [],
  onSelectIntegration,
}: IntegrationRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<IntegrationRecommendation[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (!automationDescription) return;

    const recommended = getRecommendedIntegrations(automationDescription);
    setRecommendations(recommended);
  }, [automationDescription]);

  const handleToggle = (integrationId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(integrationId)) {
      newSelected.delete(integrationId);
    } else {
      newSelected.add(integrationId);
    }
    setSelected(newSelected);
    setEstimatedCost(estimateMonthlyCost(Array.from(newSelected)));
  };

  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">Describe your automation to get integration recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recommendations List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-700">Recommended Integrations</h3>

        {recommendations.map((rec) => {
          const isConfigured = configuredIntegrations.includes(rec.integrationId);
          const isSelected = selected.has(rec.integrationId);

          return (
            <div
              key={rec.integrationId}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                isConfigured
                  ? 'bg-gray-100 border-gray-300'
                  : isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !isConfigured && handleToggle(rec.integrationId)}
            >
              <div className="flex items-start gap-3">
                {/* Icon/Logo */}
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  {rec.iconUrl && (
                    <img
                      src={rec.iconUrl}
                      alt={rec.name}
                      className="w-6 h-6 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  {!rec.iconUrl && <span className="text-xs text-gray-500">📦</span>}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-800">{rec.name}</h4>
                    <span className="px-2 py-0.5 text-xs bg-gray-200 rounded text-gray-700">{rec.category}</span>
                    {rec.relevanceScore > 90 && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-200 rounded text-yellow-800">🔥 High Match</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  <p className="text-xs text-gray-500 mt-1 italic">{rec.reason}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        rec.setupDifficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : rec.setupDifficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {rec.setupDifficulty === 'easy' && '✓ Easy Setup'}
                      {rec.setupDifficulty === 'medium' && '⚠ Medium Setup'}
                      {rec.setupDifficulty === 'hard' && '🔧 Complex Setup'}
                    </span>
                    {rec.costPerMonth !== undefined && rec.costPerMonth > 0 && (
                      <span className="text-xs text-gray-600">${rec.costPerMonth}/mo</span>
                    )}
                    {rec.costPerMonth === 0 && <span className="text-xs text-green-600">Free</span>}
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {isConfigured ? (
                    <div className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded">Configured</div>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost Estimate */}
      {selected.size > 0 && estimatedCost > 0 && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-700">
            <span className="font-semibold">Estimated monthly cost:</span> ${estimatedCost.toFixed(2)} for selected
            integrations
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {selected.size > 0 && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              selected.forEach((id) => onSelectIntegration?.(id));
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add {selected.size} Integration{selected.size > 1 ? 's' : ''}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 italic">
        We've analyzed your automation description and found these integrations. Select the ones you want to enable.
      </p>
    </div>
  );
}
