import { JobResults } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ResultsDashboardProps {
  results: JobResults;
}

export const ResultsDashboard = ({ results }: ResultsDashboardProps) => {
  const featureImportanceData = Object.entries(results.feature_importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([feature, importance]) => ({
      feature,
      importance: Number(importance.toFixed(4)),
    }));

  const trainingHistoryData = results.training_history || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Model</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Model Name</p>
            <p className="text-lg font-semibold text-gray-900">
              {results.best_model.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected Features</p>
            <p className="text-lg font-semibold text-gray-900">
              {results.best_model.selected_features.length} features
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Hyperparameters</p>
          <div className="bg-gray-50 rounded p-3">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(results.best_model.hyperparameters, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Selected Features</p>
          <div className="flex flex-wrap gap-2">
            {results.best_model.selected_features.map((feature) => (
              <span
                key={feature}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Train Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {results.metrics.train_score.toFixed(4)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Validation Score</p>
            <p className="text-2xl font-bold text-green-600">
              {results.metrics.validation_score.toFixed(4)}
            </p>
          </div>
          {results.metrics.test_score !== undefined && (
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Test Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {results.metrics.test_score.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {trainingHistoryData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Training History
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingHistoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Top Feature Importance
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={featureImportanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="feature" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="importance" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

