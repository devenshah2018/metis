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
          const message = err instanceof Error ? err.message : 'Failed to fetch results';
          if (!message.includes('still processing')) {
            setError(message);
          }
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
                <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">METIS <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">DevenAI</span></h1>
                <p className="text-xs text-[var(--text-muted)]">Quantum-Enhanced Machine Learning</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {state !== 'upload' && (
                <button
                  onClick={handleReset}
                  className="text-sm bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Job
                </button>
              )}
              <div className="relative group border-l border-[var(--border)] pl-4">
                <span className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors">
                  Created by Deven Shah
                </span>
                <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 shadow-xl min-w-[180px]">
                    <div className="flex flex-col gap-2">
                      <a href="https://www.linkedin.com/in/deven-a-shah/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </a>
                      <a href="https://deven-shah.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                        Portfolio
                      </a>
                      <a href="https://github.com/devenshah2018" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
      <main className={`mx-auto px-6 pb-12 ${state === 'results' ? 'max-w-6xl' : 'max-w-4xl'}`}>
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
