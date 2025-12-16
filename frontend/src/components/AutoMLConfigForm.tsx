import { useState } from 'react';
import { AutoMLConfig } from '../services/api';
import { Tooltip } from './Tooltip';

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
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">What is a Metric?</p>
                <p className="mb-3 text-gray-200">
                  A metric measures how well your model performs. Different metrics are suited for different problems.
                </p>
                <p className="font-semibold mb-2 text-base">How it affects the objective:</p>
                <p className="mb-3 text-gray-200">
                  The system will optimize to maximize or minimize this metric based on your objective setting.
                </p>
                <p className="font-semibold mb-2 text-base">Impact on results:</p>
                <p className="text-gray-200">
                  Choosing the right metric ensures the model performs well for your specific use case. For example, use F1 Score for imbalanced datasets, or R² for regression problems.
                </p>
              </div>
            }
          >
            <span className="flex items-center gap-1.5 cursor-help">
              Metric
              <svg
                className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </Tooltip>
        </label>
        <select
          value={config.metric}
          onChange={(e) => setConfig({ ...config, metric: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="accuracy">Accuracy - % of correct predictions (classification)</option>
          <option value="f1">F1 Score - Balance of precision and recall (classification)</option>
          <option value="precision">Precision - % of positive predictions that are correct (classification)</option>
          <option value="recall">Recall - % of actual positives found (classification)</option>
          <option value="roc_auc">ROC AUC - Ability to distinguish classes (classification)</option>
          <option value="r2">R² Score - How well model fits data (regression)</option>
          <option value="mse">Mean Squared Error - Average squared difference (regression)</option>
          <option value="mae">Mean Absolute Error - Average absolute difference (regression)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">What is Search Budget?</p>
                <p className="mb-3 text-gray-200">
                  The number of different model configurations (candidates) the system will try. Each candidate tests a different combination of features, models, and hyperparameters.
                </p>
                <p className="font-semibold mb-2 text-base">How it affects the objective:</p>
                <p className="mb-3 text-gray-200">
                  More trials = better chance of finding the optimal model, but takes longer. 70% use classical optimization, 30% use quantum sampling for diverse candidates.
                </p>
                <p className="font-semibold mb-2 text-base">Impact on results:</p>
                <p className="text-gray-200">
                  Higher budget (100-200) typically finds better models but takes more time. Lower budget (20-50) is faster but may miss optimal solutions. Recommended: 50-100 for most problems.
                </p>
              </div>
            }
          >
            <span className="flex items-center gap-1.5 cursor-help">
              Search Budget (number of trials)
              <svg
                className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </Tooltip>
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
          Number of candidate configurations to evaluate (recommended: 50-100)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">What is Objective?</p>
                <p className="mb-3 text-gray-200">
                  Whether to maximize (make higher) or minimize (make lower) the selected metric.
                </p>
                <p className="font-semibold mb-2 text-base">How it affects the objective:</p>
                <p className="mb-3 text-gray-200">
                  Maximize: Use for metrics like Accuracy, F1, R² (higher is better). Minimize: Use for error metrics like MSE, MAE (lower is better).
                </p>
                <p className="font-semibold mb-2 text-base">Impact on results:</p>
                <p className="text-gray-200">
                  The system will search for models that increase (maximize) or decrease (minimize) your metric accordingly. Most metrics should be maximized, except error metrics.
                </p>
              </div>
            }
          >
            <span className="flex items-center gap-1.5 cursor-help">
              Objective
              <svg
                className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </Tooltip>
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
          <option value="maximize">Maximize (for Accuracy, F1, R², etc.)</option>
          <option value="minimize">Minimize (for MSE, MAE, etc.)</option>
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

