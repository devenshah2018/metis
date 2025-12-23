import { useState } from 'react';

interface DatasetUploadFormProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  onSampleSelect?: (filename: string, csvData: string) => void;
  showForm?: boolean;
  onSelectDifferent?: () => void;
}

interface SampleDataset {
  filename: string;
  name: string;
  description: string;
  category: 'Medical' | 'Robotics' | 'AI Research' | 'Classic';
  taskType: string;
  samples: number;
  features: number;
}

const SAMPLE_DATASETS: SampleDataset[] = [
  {
    filename: 'ecg_heartbeat_classification.csv',
    name: 'ECG Heartbeat Classification',
    description: 'ECG heartbeat classification for arrhythmia detection',
    category: 'Medical',
    taskType: 'Classification (5 classes)',
    samples: 120,
    features: 7,
  },
  {
    filename: 'blood_glucose_prediction.csv',
    name: 'Blood Glucose Prediction',
    description: 'Blood glucose level prediction based on patient characteristics',
    category: 'Medical',
    taskType: 'Regression',
    samples: 120,
    features: 7,
  },
  {
    filename: 'patient_vital_signs.csv',
    name: 'Patient Vital Signs',
    description: 'Patient vital signs dataset for diagnosis prediction',
    category: 'Medical',
    taskType: 'Binary Classification',
    samples: 150,
    features: 8,
  },
  {
    filename: 'robot_arm_joint_angles.csv',
    name: 'Robot Arm Joint Angles',
    description: 'Robot arm joint angle data for target reaching prediction',
    category: 'Robotics',
    taskType: 'Binary Classification',
    samples: 120,
    features: 6,
  },
  {
    filename: 'sensor_fusion_imu_data.csv',
    name: 'IMU Sensor Fusion',
    description: 'IMU sensor fusion data for orientation classification',
    category: 'Robotics',
    taskType: 'Classification (4 classes)',
    samples: 100,
    features: 9,
  },
  {
    filename: 'grasp_success_prediction.csv',
    name: 'Grasp Success Prediction',
    description: 'Robotic grasp success prediction based on object characteristics',
    category: 'Robotics',
    taskType: 'Binary Classification',
    samples: 150,
    features: 6,
  },
  {
    filename: 'neural_network_convergence.csv',
    name: 'Neural Network Convergence',
    description: 'Neural network training convergence prediction',
    category: 'AI Research',
    taskType: 'Regression',
    samples: 200,
    features: 6,
  },
  {
    filename: 'model_architecture_performance.csv',
    name: 'Model Architecture Performance',
    description: 'Model architecture performance prediction',
    category: 'AI Research',
    taskType: 'Regression',
    samples: 180,
    features: 7,
  },
  {
    filename: 'training_hyperparameter_optimization.csv',
    name: 'Hyperparameter Optimization',
    description: 'Hyperparameter optimization for model training',
    category: 'AI Research',
    taskType: 'Regression',
    samples: 160,
    features: 6,
  },
  {
    filename: 'iris_sample.csv',
    name: 'Iris Classification',
    description: 'Classic Iris dataset for species classification',
    category: 'Classic',
    taskType: 'Classification (3 classes)',
    samples: 150,
    features: 4,
  },
];

export const DatasetUploadForm = ({ onFileSelect, selectedFile, onSampleSelect, showForm = true, onSelectDifferent }: DatasetUploadFormProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        onFileSelect(file);
        setSelectedSample(null);
      }
    }
  };

  const handleSampleSelect = async (dataset: SampleDataset) => {
    setLoadingSample(dataset.filename);
    setSelectedSample(dataset.filename);
    
    try {
      // Fetch the sample dataset from the public folder
      const response = await fetch(`/sample_datasets/${dataset.filename}`);
      if (!response.ok) {
        throw new Error('Failed to load sample dataset');
      }
      
      const csvData = await response.text();
      
      // Convert to File object
      const blob = new Blob([csvData], { type: 'text/csv' });
      const file = new File([blob], dataset.filename, { type: 'text/csv' });
      
      onFileSelect(file);
      
      // Also pass CSV data for preview
      if (onSampleSelect) {
        onSampleSelect(dataset.filename, csvData);
      }
    } catch (error) {
      console.error('Error loading sample dataset:', error);
      setSelectedSample(null);
    } finally {
      setLoadingSample(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Medical':
        return 'from-red-500/20 to-pink-500/20 border-red-500/40 text-red-400';
      case 'Robotics':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-400';
      case 'AI Research':
        return 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400';
      case 'Classic':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40 text-yellow-400';
      default:
        return 'from-gray-500/20 to-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const categories = Array.from(new Set(SAMPLE_DATASETS.map(d => d.category)));

  // If file is selected and we shouldn't show form, return null (preview will be shown separately)
  if (!showForm && selectedFile) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* File Upload Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-[var(--border)]"></div>
          <span className="text-sm text-[var(--text-muted)] font-medium px-3">OR</span>
          <div className="h-px flex-1 bg-[var(--border)]"></div>
        </div>
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
              : 'border-[var(--border)] hover:border-[var(--text-muted)]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="dataset-upload"
          />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Supports CSV and JSON formats
            </p>
          </div>
        </div>
      </div>

      {/* Sample Datasets Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-[var(--border)]"></div>
          <span className="text-sm text-[var(--text-muted)] font-medium px-3">SELECT SAMPLE DATASET</span>
          <div className="h-px flex-1 bg-[var(--border)]"></div>
        </div>
        
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryDatasets = SAMPLE_DATASETS.filter(d => d.category === category);
            return (
              <div key={category} className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${getCategoryColor(category)} border text-xs font-semibold`}>
                    {category}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {categoryDatasets.length} dataset{categoryDatasets.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryDatasets.map((dataset) => {
                    const isSelected = selectedSample === dataset.filename;
                    const isLoading = loadingSample === dataset.filename;
                    const isDisabled = loadingSample !== null && !isLoading;
                    
                    return (
                      <button
                        key={dataset.filename}
                        onClick={() => handleSampleSelect(dataset)}
                        disabled={isDisabled}
                        className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/20'
                            : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-elevated)]'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]/80 rounded-lg">
                            <svg className="w-5 h-5 text-[var(--primary)] animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate">
                              {dataset.name}
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mb-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {dataset.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                                {dataset.taskType}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
                                {dataset.samples} samples
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
                                {dataset.features} features
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected File Indicator */}
      {selectedFile && (
        <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{selectedFile.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={() => {
              const input = document.getElementById('dataset-upload') as HTMLInputElement;
              if (input) input.value = '';
              setSelectedSample(null);
              onFileSelect(null);
            }}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            title="Clear selection"
          >
            <svg className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
