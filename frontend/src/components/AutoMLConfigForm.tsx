import { useState, useEffect } from 'react';
import { AutoMLConfig } from '../services/api';
import { Tooltip } from './Tooltip';
import { analyzeDataset, getRecommendedConfig } from '../utils/datasetAnalyzer';

interface AutoMLConfigFormProps {
  onSubmit: (config: AutoMLConfig) => void;
  isSubmitting: boolean;
  selectedFile: File | null;
  csvData?: string;
}

const InfoIcon = () => (
  <svg className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const AutoMLConfigForm = ({ onSubmit, isSubmitting, selectedFile, csvData }: AutoMLConfigFormProps) => {
  const [config, setConfig] = useState<AutoMLConfig>({
    metric: 'accuracy',
    search_budget: 50,
    objective: 'maximize',
    max_features: undefined,
    models: undefined,
  });

  // Auto-set recommended configs based on dataset analysis
  useEffect(() => {
    const setRecommendedConfigs = async () => {
      if (selectedFile || csvData) {
        const analysis = await analyzeDataset(selectedFile, csvData);
        if (analysis) {
          const recommended = getRecommendedConfig(analysis);
          setConfig(prev => ({
            ...prev,
            ...recommended,
          }));
        }
      }
    };

    setRecommendedConfigs();
  }, [selectedFile, csvData]);

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
                <p className="text-[var(--text-secondary)] text-xs">The metric used to evaluate and compare model performance. Choose based on your problem type and business requirements.</p>
                <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-2">
                  <p className="text-[var(--text-secondary)] text-xs font-semibold">Classification Metrics:</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>Accuracy:</strong> (TP + TN) / (TP + TN + FP + FN) - Overall correctness</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>F1:</strong> 2 × (Precision × Recall) / (Precision + Recall) - Balanced metric</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>Precision:</strong> TP / (TP + FP) - Of predicted positives, how many are correct?</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>Recall:</strong> TP / (TP + FN) - Of actual positives, how many did we find?</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>ROC AUC:</strong> Area under ROC curve - Measures separability between classes</p>
                </div>
                <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
                  <p className="text-[var(--text-secondary)] text-xs font-semibold">Regression Metrics:</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>R²:</strong> 1 - (SS_res / SS_tot) - Proportion of variance explained (0-1, higher is better)</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>MSE:</strong> (1/n) × Σ(y_true - y_pred)² - Mean squared error (lower is better)</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>MAE:</strong> (1/n) × Σ|y_true - y_pred| - Mean absolute error (lower is better)</p>
                </div>
              </div>
            }
          >
            <InfoIcon />
          </Tooltip>
        </label>
        <select
          value={config.metric}
          onChange={(e) => {
            const newMetric = e.target.value;
            // Auto-set objective based on metric
            const shouldMinimize = newMetric === 'mse' || newMetric === 'mae';
            setConfig({ 
              ...config, 
              metric: newMetric,
              objective: shouldMinimize ? 'minimize' : 'maximize'
            });
          }}
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
                <p className="font-medium">Search Budget (Number of Trials)</p>
                <p className="text-[var(--text-secondary)] text-xs">This determines how many different model configurations will be tested. Each trial evaluates a unique combination of hyperparameters and features.</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>How it works:</strong> Our system uses a hybrid approach:</p>
                <p className="text-[var(--text-secondary)] text-xs">• <strong>70% Classical Optimization:</strong> Fast, efficient exploration using traditional algorithms (Bayesian optimization, random search)</p>
                <p className="text-[var(--text-secondary)] text-xs">• <strong>30% Quantum-Enhanced Sampling:</strong> Uses quantum algorithms (QAOA) to find optimal configurations in complex search spaces where classical methods struggle</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Trade-off:</strong> More trials = better chance of finding optimal model, but longer runtime. 50-100 trials is typically a good balance.</p>
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
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          Objective
          <Tooltip
            position="right"
            content={
              <div className="space-y-2">
                <p className="font-medium">Optimization Direction</p>
                <p className="text-[var(--text-secondary)] text-xs">This tells the optimization algorithm whether to seek higher or lower values for your chosen metric.</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Maximize ↑:</strong> Use for metrics where higher is better:</p>
                <p className="text-[var(--text-secondary)] text-xs">• Accuracy, F1, Precision, Recall, ROC AUC, R² Score</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Minimize ↓:</strong> Use for error metrics where lower is better:</p>
                <p className="text-[var(--text-secondary)] text-xs">• Mean Squared Error (MSE), Mean Absolute Error (MAE)</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">The system will automatically try different configurations to push the metric in your chosen direction.</p>
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
          <Tooltip
            position="right"
            content={
              <div className="space-y-2">
                <p className="font-medium">Maximum Features</p>
                <p className="text-[var(--text-secondary)] text-xs">Limit the maximum number of input columns (features) the model can use for predictions.</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Why limit features?</strong> Using fewer features can:</p>
                <p className="text-[var(--text-secondary)] text-xs">• Reduce overfitting (memorizing data instead of learning patterns)</p>
                <p className="text-[var(--text-secondary)] text-xs">• Speed up training and prediction</p>
                <p className="text-[var(--text-secondary)] text-xs">• Improve model interpretability</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">If left empty, the system will automatically select the optimal number of features based on your data and problem type.</p>
              </div>
            }
          >
            <InfoIcon />
          </Tooltip>
        </label>
        <input
          type="number"
          min="1"
          value={config.max_features || ''}
          onChange={(e) => setConfig({ ...config, max_features: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="No limit"
          className="w-full px-4 py-3 rounded-lg text-sm"
        />
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
