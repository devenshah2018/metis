import { useState } from 'react';

interface DatasetUploadFormProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const DatasetUploadForm = ({ onFileSelect, selectedFile }: DatasetUploadFormProps) => {
  const [dragActive, setDragActive] = useState(false);

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
      } else {
        alert('Please upload a CSV or JSON file');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        onFileSelect(file);
      } else {
        alert('Please upload a CSV or JSON file');
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Dataset Upload
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
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
          className="hidden"
          id="dataset-upload"
        />
        <label
          htmlFor="dataset-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your dataset here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports CSV and JSON files
          </p>
        </label>
      </div>
      {selectedFile && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Selected:</span> {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}
    </div>
  );
};

