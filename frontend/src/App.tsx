import { useState, useEffect } from 'react';
import { DatasetUploadForm } from './components/DatasetUploadForm';
import { AutoMLConfigForm } from './components/AutoMLConfigForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { useJobPolling } from './hooks/useJobPolling';
import { submitJob, getJobResults, AutoMLConfig, JobResults } from './services/api';

type AppState = 'upload' | 'config' | 'processing' | 'results';

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<JobResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { status, isLoading: isPolling } = useJobPolling(jobId, state === 'processing');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setState('config');
    setError(null);
  };

  const handleConfigSubmit = async (config: AutoMLConfig) => {
    if (!selectedFile) {
      setError('Please select a dataset first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newJobId = await submitJob(selectedFile, config);
      setJobId(newJobId);
      setState('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (status?.status === 'completed' && jobId && !results) {
      getJobResults(jobId)
        .then((jobResults) => {
          setResults(jobResults);
          setState('results');
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch results');
        });
    } else if (status?.status === 'failed') {
      setError(status.message || 'Job failed');
    }
  }, [status, jobId, results]);

  const handleReset = () => {
    setState('upload');
    setSelectedFile(null);
    setJobId(null);
    setResults(null);
    setError(null);
  };

  const steps = [
    { id: 'upload', label: 'Upload', num: 1 },
    { id: 'config', label: 'Configure', num: 2 },
    { id: 'processing', label: 'Process', num: 3 },
    { id: 'results', label: 'Results', num: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === state);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Quantum-AutoML</h1>
                <p className="text-xs text-[var(--text-muted)]">Quantum-Enhanced Machine Learning</p>
              </div>
            </div>
            {state !== 'upload' && (
              <button
                onClick={handleReset}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Job
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index <= currentStepIndex
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span className={`text-sm hidden sm:block ${index <= currentStepIndex ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-3 ${index < currentStepIndex ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        {error && (
          <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          </div>
        )}

        {state === 'upload' && (
          <div className="card p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Upload Your Dataset</h2>
              <p className="text-[var(--text-secondary)]">Start by uploading a CSV or JSON file containing your data</p>
            </div>
            <DatasetUploadForm onFileSelect={handleFileSelect} selectedFile={selectedFile} />
          </div>
        )}

        {state === 'config' && (
          <div className="card p-8 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Configure AutoML</h2>
              <p className="text-[var(--text-secondary)]">
                Set your optimization parameters for <span className="text-[var(--accent)] font-medium">{selectedFile?.name}</span>
              </p>
            </div>
            <AutoMLConfigForm onSubmit={handleConfigSubmit} isSubmitting={isSubmitting} />
          </div>
        )}

        {state === 'processing' && (
          <div className="card p-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center animate-pulse-glow">
                <svg className="w-8 h-8 text-[var(--primary)] animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Processing Your Job</h2>
              <p className="text-[var(--text-secondary)]">Quantum-enhanced optimization in progress</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Status</span>
                <span className="text-[var(--text-primary)] font-medium capitalize">{status?.status || 'Initializing'}</span>
              </div>

              {status?.progress !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">Progress</span>
                    <span className="text-[var(--accent)] font-medium">{status.progress}%</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div className="progress-fill" style={{ width: `${status.progress}%` }} />
                  </div>
                </div>
              )}

              {status?.message && (
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">{status.message}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] font-mono">Job ID: {jobId}</p>
              </div>
            </div>
          </div>
        )}

        {state === 'results' && results && (
          <div className="animate-fade-in">
            <ResultsDashboard results={results} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
