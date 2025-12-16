import { useState, useEffect, useRef } from 'react';
import { getJobStatus, JobStatus } from '../services/api';

interface UseJobPollingResult {
  status: JobStatus | null;
  isLoading: boolean;
  error: string | null;
  stopPolling: () => void;
}

export const useJobPolling = (jobId: string | null, enabled: boolean = true): UseJobPollingResult => {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    if (!jobId || !enabled) {
      stopPolling();
      return;
    }

    const pollStatus = async () => {
      if (isPollingRef.current) return;
      
      isPollingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const jobStatus = await getJobStatus(jobId);
        setStatus(jobStatus);

        // Stop polling if job is completed or failed
        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          stopPolling();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
        setError(errorMessage);
        stopPolling();
      } finally {
        setIsLoading(false);
        isPollingRef.current = false;
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 2 seconds
    intervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      stopPolling();
    };
  }, [jobId, enabled]);

  return { status, isLoading, error, stopPolling };
};

