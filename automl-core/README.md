# AutoML Core

Python service that orchestrates classical AutoML training and integrates with the Quantum Sampler for enhanced candidate generation.

## Tech Stack

- **Python 3.11+** - Runtime
- **FastAPI** - Web framework
- **scikit-learn** - Machine learning models
- **Optuna** - Hyperparameter optimization
- **pandas** - Data manipulation
- **numpy** - Numerical operations
- **XGBoost** - Gradient boosting models

## Features

- Dataset loading and preprocessing
- Search space construction (features + hyperparameters)
- Classical ML model training (RandomForest, XGBoost, SVM, Logistic Regression)
- Hyperparameter optimization with Optuna
- Integration with Quantum Sampler for candidate generation
- Model evaluation and scoring
- Feature importance extraction

## Setup

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running

```bash
source .venv/bin/activate
python main.py
```

The service will start on `http://localhost:8000` (configurable via `PORT` environment variable).

## API Endpoints

### `POST /process`

Process an AutoML job.

**Request Body:**
```json
{
  "job_id": "string",
  "dataset": "base64_encoded_string",
  "dataset_format": "csv" | "json",
  "config": {
    "metric": "accuracy" | "f1" | "precision" | "recall" | "roc_auc" | "r2" | "mse" | "mae",
    "search_budget": 50,
    "objective": "maximize" | "minimize",
    "max_features": 10  // optional
  }
}
```

**Response:**
```json
{
  "status": "completed",
  "job_id": "string"
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 8000)
- `API_GATEWAY_URL` - API Gateway URL for callbacks (default: http://localhost:8080)
- `QUANTUM_SAMPLER_URL` - Quantum Sampler URL (default: http://localhost:8001)

## Project Structure

```
automl-core/
├── main.py                    # FastAPI server
├── search_space.py           # Search space definition
├── trainer.py                # Model training
├── evaluator.py              # Model evaluation
├── orchestrator.py           # Main orchestration loop
├── models/
│   └── model_factory.py      # Model creation
├── utils/
│   ├── data_loader.py        # Dataset loading
│   └── feature_engineering.py # Feature selection
└── tests/
    └── test_search_space.py  # Unit tests
```

## Supported Models

- **RandomForest** - Random Forest Classifier/Regressor
- **XGBoost** - Gradient Boosting
- **SVM** - Support Vector Machine
- **Logistic Regression** - Linear classification/regression

## Workflow

1. Receive job request from API Gateway
2. Load and preprocess dataset
3. Build search space (features + hyperparameters)
4. Run classical optimization (70% of budget)
5. Query Quantum Sampler for additional candidates (30% of budget)
6. Evaluate all candidates
7. Return best model, metrics, and feature importance

## Testing

```bash
pytest tests/
```

