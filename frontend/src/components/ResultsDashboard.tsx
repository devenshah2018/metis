import { JobResults } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Tooltip } from './Tooltip';

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
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Model Name</p>
                <p className="mb-3 text-gray-200">
                  The machine learning algorithm that performed best during the search.
                </p>
                <p className="font-semibold mb-2 text-base">What it means:</p>
                <p className="mb-3 text-gray-200">
                  Different models work better for different problems. The system tried multiple models (Random Forest, XGBoost, SVM, etc.) and selected the one with the best validation score.
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  This is the algorithm you'll use for predictions. Each model has different strengths - tree-based models (Random Forest, XGBoost) are good for complex patterns, while linear models (SVM, Logistic Regression) are more interpretable.
                </p>
              </div>
            }
          >
            <div className="cursor-help">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                Model Name
                <svg
                  className="w-3 h-3 text-blue-500 hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {results.best_model.name}
              </p>
            </div>
          </Tooltip>
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Selected Features</p>
                <p className="mb-3 text-gray-200">
                  The number of features (columns) from your dataset that the model uses to make predictions.
                </p>
                <p className="font-semibold mb-2 text-base">What it means:</p>
                <p className="mb-3 text-gray-200">
                  Not all features are useful! The system automatically selected the most important features. Using fewer features can make the model faster and more interpretable.
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  Fewer features = simpler, faster model. More features = potentially more accurate but harder to understand. The system found the optimal balance for your data.
                </p>
              </div>
            }
          >
            <div className="cursor-help">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                Selected Features
                <svg
                  className="w-3 h-3 text-blue-500 hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {results.best_model.selected_features.length} features
              </p>
            </div>
          </Tooltip>
        </div>

        <div className="mt-4">
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Hyperparameters</p>
                <p className="mb-3 text-gray-200">
                  The specific settings for the selected model that were optimized during the search.
                </p>
                <p className="font-semibold mb-2 text-base">What it means:</p>
                <p className="mb-3 text-gray-200">
                  These are the "knobs" that control how the model learns. For example, for Random Forest: n_estimators (number of trees), max_depth (tree depth), etc.
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  These values were automatically tuned to get the best performance. You can use these same settings if you need to retrain the model later.
                </p>
              </div>
            }
          >
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5 cursor-help">
              Hyperparameters
              <svg
                className="w-3 h-3 text-blue-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </p>
          </Tooltip>
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
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Train Score</p>
                <p className="mb-3 text-gray-200">
                  How well the model performs on the data it was trained on.
                </p>
                <p className="font-semibold mb-2 text-base">What it means:</p>
                <p className="mb-3 text-gray-200">
                  High train score means the model learned the training patterns well. However, if it's much higher than validation score, the model may be overfitting.
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  Compare with validation score. A large gap suggests overfitting - the model memorized training data but won't generalize well to new data.
                </p>
              </div>
            }
          >
            <div className="bg-blue-50 rounded-lg p-4 cursor-help">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                Train Score
                <svg
                  className="w-3 h-3 text-blue-500 hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {results.metrics.train_score.toFixed(4)}
              </p>
            </div>
          </Tooltip>
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Validation Score</p>
                <p className="mb-3 text-gray-200">
                  How well the model performs on data it hasn't seen during training.
                </p>
                <p className="font-semibold mb-2 text-base">What it means:</p>
                <p className="mb-3 text-gray-200">
                  This is the most important metric! It shows how well your model will perform on new, unseen data. This is what the system optimized for.
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  This score determines which model was selected as "best". Higher is better (for maximize) or lower is better (for minimize). This is what you should focus on.
                </p>
              </div>
            }
          >
            <div className="bg-green-50 rounded-lg p-4 cursor-help">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                Validation Score
                <svg
                  className="w-3 h-3 text-green-500 hover:text-green-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </p>
              <p className="text-2xl font-bold text-green-600">
                {results.metrics.validation_score.toFixed(4)}
              </p>
            </div>
          </Tooltip>
          {results.metrics.test_score !== undefined && (
            <Tooltip
              position="top"
              content={
                <div>
                  <p className="font-semibold mb-2 text-base">Test Score</p>
                  <p className="mb-3 text-gray-200">
                    Final performance on completely unseen data, held out from both training and validation.
                  </p>
                  <p className="font-semibold mb-2 text-base">What it means:</p>
                  <p className="mb-3 text-gray-200">
                    This is the most realistic estimate of how your model will perform in production. It wasn't used during model selection to avoid bias.
                  </p>
                  <p className="font-semibold mb-2 text-base">Impact:</p>
                  <p className="text-gray-200">
                    Should be close to validation score. If it's much lower, the model may not generalize well. This is your final performance estimate.
                  </p>
                </div>
              }
            >
              <div className="bg-purple-50 rounded-lg p-4 cursor-help">
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  Test Score
                  <svg
                    className="w-3 h-3 text-purple-500 hover:text-purple-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {results.metrics.test_score.toFixed(4)}
                </p>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {trainingHistoryData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <Tooltip
            position="top"
            content={
              <div>
                <p className="font-semibold mb-2 text-base">Training History</p>
                <p className="mb-3 text-gray-200">
                  Shows how the model performance improved as the system tried different candidate configurations.
                </p>
                <p className="font-semibold mb-2 text-base">What it shows:</p>
                <p className="mb-3 text-gray-200">
                  Each point represents one candidate configuration that was tested. The line shows the trend - ideally going up (for maximize) or down (for minimize).
                </p>
                <p className="font-semibold mb-2 text-base">Impact:</p>
                <p className="text-gray-200">
                  A rising trend means the search is finding better models. If it plateaus, the search may have found a good solution. The highest/lowest point is your best model.
                </p>
              </div>
            }
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 cursor-help">
              Training History
              <svg
                className="w-5 h-5 text-blue-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </h2>
          </Tooltip>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingHistoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis />
              <RechartsTooltip />
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
        <Tooltip
          position="top"
          content={
            <div>
              <p className="font-semibold mb-2 text-base">Feature Importance</p>
              <p className="mb-3 text-gray-200">
                Shows which features (columns) in your dataset are most important for making predictions.
              </p>
              <p className="font-semibold mb-2 text-base">What it means:</p>
              <p className="mb-3 text-gray-200">
                Higher importance = the feature has more influence on the model's predictions. Features with low importance might be removed to simplify the model.
              </p>
              <p className="font-semibold mb-2 text-base">Impact:</p>
              <p className="text-gray-200">
                Use this to understand what drives your model's decisions. Important features are key predictors. You can use this to focus data collection or feature engineering efforts.
              </p>
            </div>
          }
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 cursor-help">
            Top Feature Importance
            <svg
              className="w-5 h-5 text-blue-500 hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </h2>
        </Tooltip>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={featureImportanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="feature" type="category" width={150} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="importance" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

