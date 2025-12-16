import { useState } from 'react';
import { AutoMLConfig } from '../services/api';
import { Tooltip } from './Tooltip';

interface AutoMLConfigFormProps {
  onSubmit: (config: AutoMLConfig) => void;
  isSubmitting: boolean;
}

const InfoIcon = () => (
  <svg className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          Metric
          <Tooltip
            position="right"
            content={
              <div className="space-y-2">
                <p className="font-medium">Evaluation Metric</p>
                <p className="text-[var(--text-secondary)]">The metric used to evaluate and compare model performance. Choose based on your problem type and business requirements.</p>
              </div>
            }
          >
            <InfoIcon />
          </Tooltip>
        </label>
        <select
          value={config.metric}
          onChange={(e) => setConfig({ ...config, metric: e.target.value })}
          className="w-full px-4 py-3 rounded-lg text-sm"
        >
          <optgroup label="Classification">
            <option value="accuracy">Accuracy</option>
            <option value="f1">F1 Score</option>
            <option value="precision">Precision</option>
            <option value="recall">Recall</option>
            <option value="roc_auc">ROC AUC</option>
          </optgroup>
          <optgroup label="Regression">
            <option value="r2">R² Score</option>
            <option value="mse">Mean Squared Error</option>
            <option value="mae">Mean Absolute Error</option>
          </optgroup>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          Search Budget
          <Tooltip
            position="right"
            content={
              <div className="space-y-2">
                <p className="font-medium">Number of Trials</p>
                <p className="text-[var(--text-secondary)]">How many different configurations to evaluate. Higher values explore more options but take longer. 70% classical + 30% quantum sampling.</p>
              </div>
            }
          >
            <InfoIcon />
          </Tooltip>
        </label>
        <input
          type="number"
          min="10"
          max="500"
          value={config.search_budget}
          onChange={(e) => setConfig({ ...config, search_budget: parseInt(e.target.value) || 50 })}
          className="w-full px-4 py-3 rounded-lg text-sm"
        />
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">Recommended: 50–100 trials</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          Objective
          <Tooltip
            position="right"
            content={
              <div className="space-y-2">
                <p className="font-medium">Optimization Direction</p>
                <p className="text-[var(--text-secondary)]">Maximize for metrics where higher is better (accuracy, F1). Minimize for error metrics (MSE, MAE).</p>
              </div>
            }
          >
            <InfoIcon />
          </Tooltip>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfig({ ...config, objective: 'maximize' })}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              config.objective === 'maximize'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            Maximize ↑
          </button>
          <button
            type="button"
            onClick={() => setConfig({ ...config, objective: 'minimize' })}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              config.objective === 'minimize'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            Minimize ↓
          </button>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          Max Features
          <span className="text-xs text-[var(--text-muted)] font-normal">(optional)</span>
        </label>
        <input
          type="number"
          min="1"
          value={config.max_features || ''}
          onChange={(e) => setConfig({ ...config, max_features: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="No limit"
          className="w-full px-4 py-3 rounded-lg text-sm"
        />
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">Limit the number of features to select</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            Start Optimization
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
};
