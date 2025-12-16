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

  const { status, isLoading: isPolling } = useJobPolling(
    jobId,
    state === 'processing'
  );

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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit job';
      setError(errorMessage);
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
          setError(
            err instanceof Error ? err.message : 'Failed to fetch results'
          );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Quantum-AutoML
          </h1>
          <p className="text-gray-600">
            Quantum-Enhanced Automated Machine Learning Platform
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {state === 'upload' && (
          <div className="bg-white rounded-lg shadow p-6">
            <DatasetUploadForm
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
        )}

        {state === 'config' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <button
                onClick={() => setState('upload')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to upload
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              AutoML Configuration
            </h2>
            <AutoMLConfigForm
              onSubmit={handleConfigSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {state === 'processing' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Job
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Job ID</p>
                <p className="font-mono text-sm">{jobId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold capitalize">
                  {status?.status || 'Unknown'}
                </p>
              </div>
              {status?.progress !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {status.progress}%
                  </p>
                </div>
              )}
              {status?.message && (
                <div>
                  <p className="text-sm text-gray-600">Message</p>
                  <p className="text-sm">{status.message}</p>
                </div>
              )}
              {isPolling && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Polling for updates...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {state === 'results' && results && (
          <div>
            <div className="mb-4">
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Start New Job
              </button>
            </div>
            <ResultsDashboard results={results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

