import { useState, useEffect } from 'react';
import { JobResults } from '../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: JobResults;
  datasetFilename?: string;
}

type ExportFormat = 'json' | 'python' | 'go' | 'cpp';

export const ExportModal = ({ isOpen, onClose, results, datasetFilename }: ExportModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const generateJSONExport = (): string => {
    const exportData = {
      job_id: results.job_id,
      dataset: datasetFilename || 'dataset.csv',
      best_model: {
        name: results.best_model.name,
        hyperparameters: results.best_model.hyperparameters,
        selected_features: results.best_model.selected_features,
      },
      metrics: results.metrics,
      feature_importance: results.feature_importance,
      data_splits: results.data_splits,
      training_history: results.training_history,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const generatePythonCode = (): string => {
    const modelName = results.best_model.name.toLowerCase();
    const hyperparams = results.best_model.hyperparameters;
    const features = results.best_model.selected_features;
    
    // Determine model class and import based on model name
    let modelClass = '';
    let importPath = '';
    
    if (modelName === 'random_forest') {
      modelClass = 'RandomForestClassifier'; // or RandomForestRegressor based on task
      importPath = 'from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor';
    } else if (modelName === 'xgboost') {
      modelClass = 'XGBClassifier'; // or XGBRegressor based on task
      importPath = 'import xgboost as xgb\nfrom xgboost import XGBClassifier, XGBRegressor';
    } else if (modelName === 'svm') {
      modelClass = 'SVC'; // or SVR based on task
      importPath = 'from sklearn.svm import SVC, SVR';
    } else if (modelName === 'logistic_regression') {
      modelClass = 'LogisticRegression'; // or Ridge based on task
      importPath = 'from sklearn.linear_model import LogisticRegression, Ridge';
    } else {
      modelClass = 'RandomForestClassifier';
      importPath = 'from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor';
    }
    
    let code = `# AutoML Model Export - Python\n`;
    code += `# Generated from job: ${results.job_id}\n`;
    code += `# Dataset: ${datasetFilename || 'dataset.csv'}\n`;
    code += `# Model: ${results.best_model.name}\n\n`;
    code += `import pandas as pd\n`;
    code += `import numpy as np\n`;
    code += `${importPath}\n\n`;
    code += `# Load dataset\n`;
    code += `df = pd.read_csv('${datasetFilename || 'dataset.csv'}')\n\n`;
    code += `# Prepare features (using selected features from AutoML)\n`;
    code += `selected_features = ${JSON.stringify(features)}\n`;
    code += `X = df[selected_features]\n`;
    code += `# Adjust target column name as needed (common names: 'target', 'label', 'y', 'class')\n`;
    code += `y = df['target']  # TODO: Replace 'target' with your actual target column name\n\n`;
    code += `# Initialize model with optimized hyperparameters\n`;
    code += `hyperparameters = ${JSON.stringify(hyperparams, null, 2)}\n`;
    code += `# Note: Use ${modelClass} for classification, or corresponding Regressor for regression\n`;
    code += `model = ${modelClass}(**hyperparameters, random_state=42)\n\n`;
    code += `# Train the model\n`;
    code += `model.fit(X, y)\n\n`;
    code += `# Make predictions\n`;
    code += `predictions = model.predict(X)\n`;
    code += `print(f"Model trained with {len(selected_features)} features")\n`;
    code += `print(f"Training score: ${results.metrics.train_score.toFixed(4)}")\n`;
    code += `print(f"Validation score: ${results.metrics.validation_score.toFixed(4)}")\n`;
    return code;
  };

  const generateGoCode = (): string => {
    const modelName = results.best_model.name;
    const hyperparams = results.best_model.hyperparameters;
    const features = results.best_model.selected_features;
    
    let code = `// AutoML Model Export - Go\n`;
    code += `// Generated from job: ${results.job_id}\n`;
    code += `// Dataset: ${datasetFilename || 'dataset.csv'}\n\n`;
    code += `package main\n\n`;
    code += `import (\n`;
    code += `\t"encoding/csv"\n`;
    code += `\t"fmt"\n`;
    code += `\t"log"\n`;
    code += `\t"os"\n`;
    code += `)\n\n`;
    code += `// Hyperparameters from AutoML optimization\n`;
    code += `var hyperparameters = map[string]interface{}{\n`;
    Object.entries(hyperparams).forEach(([key, value]) => {
      code += `\t"${key}": ${JSON.stringify(value)},\n`;
    });
    code += `}\n\n`;
    code += `// Selected features from AutoML\n`;
    code += `var selectedFeatures = []string{\n`;
    features.forEach(feature => {
      code += `\t"${feature}",\n`;
    });
    code += `}\n\n`;
    code += `func main() {\n`;
    code += `\t// Load dataset\n`;
    code += `\tfile, err := os.Open("${datasetFilename || 'dataset.csv'}")\n`;
    code += `\tif err != nil {\n`;
    code += `\t\tlog.Fatal(err)\n`;
    code += `\t}\n`;
    code += `\tdefer file.Close()\n\n`;
    code += `\treader := csv.NewReader(file)\n`;
    code += `\trecords, err := reader.ReadAll()\n`;
    code += `\tif err != nil {\n`;
    code += `\t\tlog.Fatal(err)\n`;
    code += `\t}\n\n`;
    code += `\tfmt.Printf("Loaded dataset with %d features\\n", len(selectedFeatures))\n`;
    code += `\tfmt.Printf("Model: %s\\n", "${modelName}")\n`;
    code += `\tfmt.Printf("Hyperparameters: %+v\\n", hyperparameters)\n`;
    code += `\t// TODO: Implement model training using a Go ML library\n`;
    code += `\t// Recommended: goml, gorgonia, or gonum\n`;
    code += `}\n`;
    return code;
  };

  const generateCppCode = (): string => {
    const modelName = results.best_model.name;
    const hyperparams = results.best_model.hyperparameters;
    const features = results.best_model.selected_features;
    
    let code = `// AutoML Model Export - C++\n`;
    code += `// Generated from job: ${results.job_id}\n`;
    code += `// Dataset: ${datasetFilename || 'dataset.csv'}\n\n`;
    code += `#include <iostream>\n`;
    code += `#include <vector>\n`;
    code += `#include <string>\n`;
    code += `#include <map>\n\n`;
    code += `// Hyperparameters from AutoML optimization\n`;
    code += `std::map<std::string, double> hyperparameters = {\n`;
    Object.entries(hyperparams).forEach(([key, value]) => {
      const numValue = typeof value === 'number' ? value : 0;
      code += `\t{"${key}", ${numValue}},\n`;
    });
    code += `};\n\n`;
    code += `// Selected features from AutoML\n`;
    code += `std::vector<std::string> selectedFeatures = {\n`;
    features.forEach(feature => {
      code += `\t"${feature}",\n`;
    });
    code += `};\n\n`;
    code += `int main() {\n`;
    code += `\tstd::cout << "Loading dataset: ${datasetFilename || 'dataset.csv'}" << std::endl;\n`;
    code += `\tstd::cout << "Model: ${modelName}" << std::endl;\n`;
    code += `\tstd::cout << "Features: " << selectedFeatures.size() << std::endl;\n`;
    code += `\t\n`;
    code += `\t// TODO: Implement CSV loading and model training\n`;
    code += `\t// Recommended libraries:\n`;
    code += `\t// - CSV: csv-parser or fast-cpp-csv-parser\n`;
    code += `\t// - ML: mlpack, dlib, or OpenCV\n`;
    code += `\t\n`;
    code += `\treturn 0;\n`;
    code += `}\n`;
    return code;
  };

  const getExportContent = (): string => {
    switch (selectedFormat) {
      case 'json':
        return generateJSONExport();
      case 'python':
        return generatePythonCode();
      case 'go':
        return generateGoCode();
      case 'cpp':
        return generateCppCode();
      default:
        return '';
    }
  };

  const handleCopy = () => {
    const content = getExportContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const extension = selectedFormat === 'json' ? 'json' : selectedFormat === 'python' ? 'py' : selectedFormat === 'go' ? 'go' : 'cpp';
    const filename = `automl_export_${results.job_id.slice(0, 8)}.${extension}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formats: { value: ExportFormat; label: string }[] = [
    { value: 'json', label: 'JSON' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'cpp', label: 'C++' },
  ];

  const formatIcons: Record<ExportFormat, JSX.Element> = {
    json: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    python: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    go: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    cpp: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  };

  const formatColors: Record<ExportFormat, string> = {
    json: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    python: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    go: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    cpp: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-5xl w-full flex flex-col shadow-2xl border border-[var(--border)]/50 animate-scale-in overflow-hidden" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Export Results</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Export model configuration and code in your preferred format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all p-2 hover:bg-[var(--bg-elevated)] rounded-lg active:scale-95"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-5">
          {/* Format Selection */}
          <div className="mb-5 shrink-0">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4 block">
              Select Export Format
            </label>
            <div className="grid grid-cols-4 gap-3">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={`relative px-4 py-3.5 text-sm font-medium rounded-lg transition-all duration-200 border ${
                    selectedFormat === format.value
                      ? `bg-gradient-to-br ${formatColors[format.value]} text-[var(--text-primary)] shadow-lg scale-[1.02] border-current`
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--border)]/80 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`${selectedFormat === format.value ? 'text-current' : 'text-[var(--text-muted)]'}`}>
                      {formatIcons[format.value]}
                    </div>
                    <span>{format.label}</span>
                  </div>
                  {selectedFormat === format.value && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-card)]"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Export Preview */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Code Preview
              </label>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Read-only preview</span>
              </div>
            </div>
            <div className="flex-1 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] overflow-hidden shadow-inner">
              <div className="h-full overflow-auto p-4 custom-scrollbar">
                <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre leading-relaxed">
                  <code>{getExportContent()}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[var(--bg-elevated)]/50 border-t border-[var(--border)] shrink-0">
          <div className="text-xs text-[var(--text-muted)]">
            <span className="font-medium">Job ID:</span> <span className="font-mono">{results.job_id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-elevated)]"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border ${
                copied
                  ? 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border)]/80'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

