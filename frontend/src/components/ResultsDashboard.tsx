import { useState } from 'react';
import { JobResults } from '../services/api';
import { Tooltip } from './Tooltip';
import { ExportModal } from './ExportModal';
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
  datasetFilename?: string;
}

const InfoIcon = () => (
  <svg className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ResultsDashboard = ({ results, datasetFilename }: ResultsDashboardProps) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const autoAdjustments = results.auto_adjustments;

  return (
    <div className="space-y-5">
      {/* Auto-Adjustments Notification */}
      {autoAdjustments && Object.keys(autoAdjustments).length > 0 && (
        <div className="card p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Settings Auto-Adjusted
              </h3>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                {autoAdjustments.stratified_split && (
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      Data Splitting Method
                    </p>
                    <p className="mb-1">
                      {autoAdjustments.stratified_split.reason || 'Stratified splitting was attempted but failed'}
                    </p>
                    <p className="text-[var(--text-muted)]">
                      Fallback: Using non-stratified split to ensure successful processing
                    </p>
                  </div>
                )}
                {autoAdjustments.max_features && (
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      Maximum Features
                    </p>
                    <p>
                      Adjusted from <span className="font-mono font-semibold">{autoAdjustments.max_features.original}</span> to{' '}
                      <span className="font-mono font-semibold">{autoAdjustments.max_features.adjusted}</span>
                    </p>
                    {autoAdjustments.max_features.reason && (
                      <p className="text-[var(--text-muted)] mt-1">
                        {autoAdjustments.max_features.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        results={results}
        datasetFilename={datasetFilename}
      />
      {/* Best Model Section - Prominent and Clear */}
      <div className="card p-6 border-2 border-[var(--accent)]/40 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)]">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center shrink-0 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Best Model Selected</h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/20 border-2 border-[var(--accent)] rounded-lg">
                <span className="text-2xl font-bold text-[var(--accent)]">{results.best_model.name}</span>
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)] mb-1">Trials Completed</p>
              <p className="text-lg font-semibold text-[var(--accent)]">{trainingHistoryData.length}</p>
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hyperparameters - Right next to model */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Hyperparameters</h3>
            <Tooltip 
              content={
                <div className="space-y-2">
                  <p className="font-medium">Hyperparameters</p>
                  <p className="text-[var(--text-secondary)] text-xs">These are configuration settings that control how the model learns from your data. Unlike model parameters (which are learned during training), hyperparameters are set before training begins.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2">Examples include learning rate (how fast the model learns), regularization strength (prevents overfitting), and tree depth (for decision trees). Our quantum-enhanced optimization automatically finds the best values for your specific dataset.</p>
                </div>
              } 
              position="right"
            >
              <InfoIcon />
            </Tooltip>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-lg p-4 overflow-x-auto border border-[var(--border)]">
              <pre className="text-xs text-[var(--text-secondary)] font-mono">
                {JSON.stringify(results.best_model.hyperparameters, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Model Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Model Details</h3>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-lg p-4 space-y-3 border border-[var(--border)]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Selected Features</span>
                <span className="text-lg font-bold text-[var(--accent)]">{results.best_model.selected_features.length}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-2">Feature List:</p>
                <div className="flex flex-wrap gap-1.5">
                  {results.best_model.selected_features.slice(0, 6).map((feature) => (
                    <span key={feature} className="feature-tag text-xs">{feature}</span>
                  ))}
                  {results.best_model.selected_features.length > 6 && (
                    <span className="feature-tag text-xs opacity-60">+{results.best_model.selected_features.length - 6} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Row: Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Performance Metrics - 3 cards */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Train Score</span>
            </div>
            <Tooltip 
              content={
                <div className="space-y-2">
                  <p className="font-medium">Training Score</p>
                  <p className="text-[var(--text-secondary)] text-xs">This measures how well the model performs on the data it was trained on. The model sees this data during learning, so it can memorize patterns.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Formula:</strong> For accuracy, it's (Correct Predictions / Total Predictions). For regression, it's typically R² or MSE.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Warning:</strong> If this score is much higher than validation score, the model may be overfitting—memorizing training data instead of learning general patterns.</p>
                </div>
              } 
              position="bottom"
            >
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
            <Tooltip 
              content={
                <div className="space-y-2">
                  <p className="font-medium">Validation Score</p>
                  <p className="text-[var(--text-secondary)] text-xs">This measures performance on data the model hasn't seen during training. This set is used to tune hyperparameters and select the best model configuration.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2">The model never learns from validation data—it only uses it to evaluate different configurations. This score is the primary metric used to choose which model and settings work best.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Why it matters:</strong> A good validation score indicates the model can generalize to new, unseen data, which is the goal of machine learning.</p>
                </div>
              } 
              position="bottom"
            >
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
              <Tooltip 
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Test Score</p>
                    <p className="text-[var(--text-secondary)] text-xs"><strong>How it's determined:</strong> After all model selection and hyperparameter tuning is complete, the final model is evaluated once on the test set—data that was completely held out and never used during training or validation.</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-2">This is the most reliable estimate of how the model will perform in production. The test set acts as a final, unbiased check before deploying the model.</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Important:</strong> The test set is only used once at the very end. If you use it multiple times to make decisions, it becomes part of the training process and loses its reliability.</p>
                  </div>
                } 
                position="bottom"
              >
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
            <Tooltip 
              content={
                <div className="space-y-2">
                  <p className="font-medium">Data Splits</p>
                  <p className="text-[var(--text-secondary)] text-xs">Your dataset is divided into three separate parts to prevent data leakage and ensure honest evaluation:</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2"><strong>Training (60-70%):</strong> The model learns patterns from this data. It sees examples and adjusts its internal parameters.</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>Validation (15-20%):</strong> Used during training to tune hyperparameters and select the best model. The model never learns from this.</p>
                  <p className="text-[var(--text-secondary)] text-xs"><strong>Test (15-20%):</strong> Completely held out until the very end. Used once for final evaluation to estimate real-world performance.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2">This separation ensures the model's performance estimate is realistic and not inflated by seeing the test data during development.</p>
                </div>
              } 
              position="right"
            >
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
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.train.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.train.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-blue-400">{dataSplits && totalSamples > 0 ? ((dataSplits.train.samples / totalSamples) * 100).toFixed(0) : '0'}%</span>
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
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.validation.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.validation.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-purple-400">{dataSplits && totalSamples > 0 ? ((dataSplits.validation.samples / totalSamples) * 100).toFixed(0) : '0'}%</span>
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
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.test.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Features</span>
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{dataSplits?.test.features}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Ratio</span>
                    <span className="text-xs font-mono font-semibold text-cyan-400">{dataSplits && totalSamples > 0 ? ((dataSplits.test.samples / totalSamples) * 100).toFixed(0) : '0'}%</span>
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
              <Tooltip 
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Training History</p>
                    <p className="text-[var(--text-secondary)] text-xs">This chart shows the validation score achieved in each optimization trial. Each trial tests a different combination of hyperparameters and features.</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-2">An upward trend means the optimization is finding better configurations. The best-performing trial (highest point) is selected as your final model.</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-2">Our system uses 70% classical optimization (fast exploration) and 30% quantum-enhanced sampling (finding optimal configurations) to efficiently search the space of possible models.</p>
                  </div>
                } 
                position="right"
              >
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
            <Tooltip 
              content={
                <div className="space-y-2">
                  <p className="font-medium">Feature Importance</p>
                  <p className="text-[var(--text-secondary)] text-xs">This shows which input columns (features) from your dataset had the most influence on the model's predictions.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2">Higher percentages mean those features contribute more to making accurate predictions. Features with low importance might be noise or redundant.</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-2">Understanding feature importance helps you: (1) identify what drives predictions, (2) remove irrelevant features to speed up the model, and (3) gain insights into your problem domain.</p>
                </div>
              } 
              position="right"
            >
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

      {/* Bottom Row: All Selected Features */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">All Selected Features</h3>
          <Tooltip 
            content={
              <div className="space-y-2">
                <p className="font-medium">Selected Features</p>
                <p className="text-[var(--text-secondary)] text-xs">This is the complete list of input columns (features) that the model uses to make predictions. Not all columns from your dataset may be included.</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">Feature selection automatically removes irrelevant or redundant columns, which: (1) speeds up training and prediction, (2) reduces overfitting risk, (3) makes models easier to interpret, and (4) can improve performance by focusing on what matters.</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">The selection process uses statistical methods and model-based importance to identify the most valuable features for your specific problem.</p>
              </div>
            } 
            position="right"
          >
            <InfoIcon />
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {results.best_model.selected_features.map((feature) => (
            <span key={feature} className="feature-tag text-xs">{feature}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
