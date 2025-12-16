import { useState } from 'react';
import { AutoMLConfig } from '../services/api';

interface AutoMLConfigFormProps {
  onSubmit: (config: AutoMLConfig) => void;
  isSubmitting: boolean;
}

export const AutoMLConfigForm = ({ onSubmit, isSubmitting }: AutoMLConfigFormProps) => {
  const [config, setConfig] = useState<AutoMLConfig>({
    metric: 'accuracy',
    search_budget: 50,
    objective: 'maximize',
    max_features: undefined,
    models: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metric
        </label>
        <select
          value={config.metric}
          onChange={(e) => setConfig({ ...config, metric: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="accuracy">Accuracy</option>
          <option value="f1">F1 Score</option>
          <option value="precision">Precision</option>
          <option value="recall">Recall</option>
          <option value="roc_auc">ROC AUC</option>
          <option value="r2">R² Score</option>
          <option value="mse">Mean Squared Error</option>
          <option value="mae">Mean Absolute Error</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Budget (number of trials)
        </label>
        <input
          type="number"
          min="10"
          max="1000"
          value={config.search_budget}
          onChange={(e) =>
            setConfig({ ...config, search_budget: parseInt(e.target.value) || 50 })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Number of candidate configurations to evaluate
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objective
        </label>
        <select
          value={config.objective}
          onChange={(e) =>
            setConfig({
              ...config,
              objective: e.target.value as 'maximize' | 'minimize',
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="maximize">Maximize</option>
          <option value="minimize">Minimize</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Features (optional)
        </label>
        <input
          type="number"
          min="1"
          value={config.max_features || ''}
          onChange={(e) =>
            setConfig({
              ...config,
              max_features: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="No limit"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Maximum number of features to select (leave empty for no limit)
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Job'}
      </button>
    </form>
  );
};

