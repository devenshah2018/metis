import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SubmitJobRequest {
  dataset: string;
  dataset_format: 'csv' | 'json';
  config: AutoMLConfig;
}

export interface AutoMLConfig {
  metric: string;
  search_budget: number;
  objective: 'maximize' | 'minimize';
  max_features?: number;
  models?: string[];
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

export interface JobResults {
  job_id: string;
  status: 'completed';
  best_model: {
    name: string;
    hyperparameters: Record<string, any>;
    selected_features: string[];
  };
  metrics: {
    train_score: number;
    validation_score: number;
    test_score?: number;
  };
  feature_importance: Record<string, number>;
  training_history?: Array<{
    iteration: number;
    score: number;
    config: Record<string, any>;
  }>;
}

export const submitJob = async (dataset: File, config: AutoMLConfig): Promise<string> => {
  const formData = new FormData();
  formData.append('dataset', dataset);
  formData.append('dataset_format', dataset.name.endsWith('.json') ? 'json' : 'csv');
  formData.append('config', JSON.stringify(config));

  const response = await api.post<{ job_id: string }>('/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.job_id;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get<JobStatus>(`/status/${jobId}`);
  return response.data;
};

export const getJobResults = async (jobId: string): Promise<JobResults> => {
  try {
    const response = await api.get<JobResults>(`/results/${jobId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error === 'Job is not completed yet') {
      throw new Error('Job is still processing. Please wait.');
    }
    throw error;
  }
};

export default api;

