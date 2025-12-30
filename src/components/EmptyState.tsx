import React from 'react';
import { Inbox, AlertCircle, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  isDark?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  isDark = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed ${
      isDark 
        ? 'border-gray-600 bg-gray-800/30' 
        : 'border-gray-300 bg-gray-50'
    }`}>
      <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
        {icon || <Inbox className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />}
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-6 text-center max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{ 
  title?: string; 
  description?: string; 
  retry?: () => void;
  isDark?: boolean;
}> = ({ 
  title = 'Something went wrong',
  description = 'We encountered an error. Please try again.',
  retry,
  isDark = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed ${
      isDark 
        ? 'border-red-600/50 bg-red-900/20' 
        : 'border-red-300 bg-red-50'
    }`}>
      <AlertCircle className={`w-8 h-8 mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-6 text-center max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
