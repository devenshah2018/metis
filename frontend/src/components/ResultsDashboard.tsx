import { JobResults } from '../services/api';
import { Tooltip } from './Tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ResultsDashboardProps {
  results: JobResults;
}

const InfoIcon = () => (
  <svg className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ResultsDashboard = ({ results }: ResultsDashboardProps) => {
  const featureImportanceData = Object.entries(results.feature_importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([feature, importance]) => ({
      feature: feature.length > 12 ? feature.slice(0, 12) + '…' : feature,
      importance: Number((importance * 100).toFixed(1)),
    }));

  const trainingHistoryData = results.training_history || [];

  const dataSplits = results.data_splits;
  const totalSamples = dataSplits
    ? dataSplits.train.samples + dataSplits.validation.samples + dataSplits.test.samples
    : 0;

  const splitPieData = dataSplits
    ? [
        { name: 'Train', value: dataSplits.train.samples, color: '#3b82f6' },
        { name: 'Validation', value: dataSplits.validation.samples, color: '#8b5cf6' },
        { name: 'Test', value: dataSplits.test.samples, color: '#06b6d4' },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Top Row: Summary + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Summary Card */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Complete</h2>
              <p className="text-xs text-[var(--text-muted)]">{trainingHistoryData.length} trials</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--text-muted)]">Model</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{results.best_model.name}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-[var(--text-muted)]">Features</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{results.best_model.selected_features.length}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics - 3 cards */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Train Score</span>
            </div>
            <Tooltip content="How well the model fits the training data. Higher is better, but too high may indicate overfitting." position="bottom">
              <InfoIcon />
            </Tooltip>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{results.metrics.train_score.toFixed(4)}</p>
          <div className="mt-2 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(results.metrics.train_score * 100, 100)}%` }} />
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between border-[var(--accent)]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Validation</span>
            </div>
            <Tooltip content="Performance on held-out data during training. This is the primary metric for model selection." position="bottom">
              <InfoIcon />
            </Tooltip>
          </div>
          <p className="text-3xl font-bold text-[var(--accent)] tabular-nums">{results.metrics.validation_score.toFixed(4)}</p>
          <div className="mt-2 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.min(results.metrics.validation_score * 100, 100)}%` }} />
          </div>
        </div>

        {results.metrics.test_score !== undefined && (
          <div className="card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Test Score</span>
              </div>
              <Tooltip content="Final performance on unseen test data. This is the most reliable estimate of real-world performance." position="bottom">
                <InfoIcon />
              </Tooltip>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{results.metrics.test_score.toFixed(4)}</p>
            <div className="mt-2 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(results.metrics.test_score * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Data Splits Section */}
      {dataSplits && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Data Splits</h3>
            <Tooltip content="Your data is split into 3 parts: training (to learn), validation (to tune), and test (to evaluate final performance)." position="right">
              <InfoIcon />
            </Tooltip>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={splitPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {splitPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} (${((value / totalSamples) * 100).toFixed(0)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-[var(--text-muted)]">{totalSamples.toLocaleString()} total</p>
            </div>

            {/* Split Tables */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-4">
              {/* Train Split */}
              <div className="bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Training</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Samples</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.train.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.train.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-blue-400">{((dataSplits.train.samples / totalSamples) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Validation Split */}
              <div className="bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Validation</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Samples</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.validation.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.validation.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-purple-400">{((dataSplits.validation.samples / totalSamples) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Test Split */}
              <div className="bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Test</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Samples</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.test.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits.test.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-cyan-400">{((dataSplits.test.samples / totalSamples) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Training History Chart */}
        {trainingHistoryData.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Training History</h3>
              <Tooltip content="Shows how model performance improved over each optimization trial. Upward trend indicates successful learning." position="right">
                <InfoIcon />
              </Tooltip>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trainingHistoryData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="iteration" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Feature Importance */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Feature Importance</h3>
            <Tooltip content="Shows which input features had the most impact on predictions. Higher percentage means more influential." position="right">
              <InfoIcon />
            </Tooltip>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="feature" type="category" stroke="var(--text-muted)" fontSize={10} width={90} />
              <RechartsTooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value}%`, 'Importance']}
              />
              <Bar dataKey="importance" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Features + Hyperparameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Selected Features */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Selected Features</h3>
            <Tooltip content="The subset of input columns the model uses for predictions. Fewer features often means faster, more interpretable models." position="right">
              <InfoIcon />
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {results.best_model.selected_features.map((feature) => (
              <span key={feature} className="feature-tag text-xs">{feature}</span>
            ))}
          </div>
        </div>

        {/* Hyperparameters */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Hyperparameters</h3>
            <Tooltip content="Configuration settings that control how the model learns. These were automatically optimized for your data." position="right">
              <InfoIcon />
            </Tooltip>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg p-3 overflow-x-auto max-h-40">
            <pre className="text-xs text-[var(--text-secondary)] font-mono">
              {JSON.stringify(results.best_model.hyperparameters, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
