import { JobResults } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface ResultsDashboardProps {
  results: JobResults;
}

export const ResultsDashboard = ({ results }: ResultsDashboardProps) => {
  const featureImportanceData = Object.entries(results.feature_importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([feature, importance]) => ({
      feature: feature.length > 15 ? feature.slice(0, 15) + '...' : feature,
      importance: Number((importance * 100).toFixed(1)),
    }));

  const trainingHistoryData = results.training_history || [];

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Optimization Complete</h2>
            <p className="text-sm text-[var(--text-secondary)]">Best model found after {trainingHistoryData.length || 'N/A'} trials</p>
          </div>
        </div>

        {/* Model Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-elevated p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Model</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{results.best_model.name}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Features</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{results.best_model.selected_features.length}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Validation Score</p>
            <p className="text-lg font-semibold text-[var(--accent)]">{results.metrics.validation_score.toFixed(4)}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Train</span>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{results.metrics.train_score.toFixed(4)}</p>
          </div>
          <div className="metric-card border-[var(--accent)]/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Validation</span>
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--accent)]">{results.metrics.validation_score.toFixed(4)}</p>
          </div>
          {results.metrics.test_score !== undefined && (
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Test</span>
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{results.metrics.test_score.toFixed(4)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Training History Chart */}
      {trainingHistoryData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Training History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trainingHistoryData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="iteration" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="url(#scoreGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature Importance */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Feature Importance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <YAxis dataKey="feature" type="category" stroke="var(--text-muted)" fontSize={12} width={120} />
            <RechartsTooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [`${value}%`, 'Importance']}
            />
            <Bar dataKey="importance" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Features */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Selected Features</h3>
        <div className="flex flex-wrap gap-2">
          {results.best_model.selected_features.map((feature) => (
            <span key={feature} className="feature-tag">{feature}</span>
          ))}
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Hyperparameters</h3>
        <div className="bg-[var(--bg-elevated)] rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-[var(--text-secondary)] font-mono">
            {JSON.stringify(results.best_model.hyperparameters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
