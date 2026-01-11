# Metis

Enterprise AutoML with Quantum-Enhanced Optimization

Metis automates machine learning model selection, hyperparameter tuning, and feature selection using classical optimization and optional quantum-enhanced sampling.

## Features

- Simple API: One-line model training with `metis.fit()`
- Flexible Input: Accepts file paths (CSV, JSON, Parquet) or pandas DataFrames
- Quantum-Enhanced: Optional QAOA-based quantum sampling for exploration
- Multiple Models: Supports Random Forest, XGBoost, SVM, and Logistic Regression (Ridge for regression)
- Custom Models: Register your own models with `metis.add()`
- Automatic Feature Selection: Selects optimal feature subsets
- Production-Ready: Comprehensive error handling and validation

## Installation

```bash
pip install metis-automl
```

## Quick Start

### Basic Usage

```python
import metis
import pandas as pd

# Option 1: From file path
model = metis.fit("data.csv", metric="accuracy", search_budget=50)

# Option 2: From DataFrame
df = pd.read_csv("data.csv")
model = metis.fit(df, metric="f1", search_budget=100)

# Make predictions
predictions = model.predict(X_test)

# Get probabilities (classification only)
probabilities = model.predict_proba(X_test)

# Score on test data
score = model.score(X_test, y_test)
```

### Configuration Options

```python
model = metis.fit(
    dataset="data.csv",
    config={
        "metric": "accuracy",        # 'accuracy', 'f1', 'precision', 'recall', 'roc_auc', 'r2', 'mse', 'mae'
        "objective": "maximize",      # 'maximize' or 'minimize'
        "search_budget": 50,          # Number of optimization trials
        "max_features": 20,           # Maximum features to select (optional)
        "target_column": "target",    # Target column name (auto-detects 'target', 'label', 'y', or 'class' if not provided)
        "use_quantum": True,          # Enable quantum sampling (default: True)
    }
)
```

Or use keyword arguments:

```python
model = metis.fit("data.csv", metric="f1", search_budget=100, use_quantum=True)
```

### Accessing Results

```python
# Model metadata
print(model.hyperparameters)      # Best hyperparameters
print(model.selected_features)    # Selected feature names
print(model.metrics)              # Train/validation/test scores
print(model.metadata)             # Additional metadata
```

## Supported Metrics

### Classification
- `accuracy`: Classification accuracy
- `f1`: F1 score (weighted)
- `precision`: Precision score (weighted)
- `recall`: Recall score (weighted)
- `roc_auc`: ROC AUC score

### Regression
- `r2`: R² score
- `mse`: Mean squared error (minimized)
- `mae`: Mean absolute error (minimized)

## Supported Models

### Built-in Models
- **Random Forest**: Ensemble of decision trees
- **XGBoost**: Gradient boosting framework
- **SVM**: Support Vector Machine
- **Logistic Regression**: Linear classification (Ridge regression for regression tasks)

### Custom Models

You can register your own custom models using `metis.add()`:

```python
import metis
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor

def create_gbm(hyperparameters, is_classification):
    """Create a Gradient Boosting model."""
    if is_classification:
        return GradientBoostingClassifier(**hyperparameters, random_state=42)
    else:
        return GradientBoostingRegressor(**hyperparameters, random_state=42)

# Register the custom model
metis.add(
    model_name='gradient_boosting',
    model_creator=create_gbm,
    hyperparameter_space={
        'n_estimators': [50, 100, 200],
        'learning_rate': [0.01, 0.1, 0.3],
        'max_depth': [3, 5, 7],
        'subsample': [0.8, 0.9, 1.0]
    },
    description='Gradient Boosting Machine'
)

# Now use it in AutoML
model = metis.fit("data.csv", search_budget=50)
```

**Requirements for custom models:**
- Must be sklearn-compatible (implement `fit()`, `predict()`, and optionally `predict_proba()`)
- The `model_creator` function must accept `(hyperparameters: Dict, is_classification: bool)` and return a model instance
- Hyperparameter space must be a dictionary mapping parameter names to lists of possible values

**Managing custom models:**
```python
# List all registered models (includes built-in models)
all_models = metis.list_models()
print(all_models)  # ['random_forest', 'xgboost', 'svm', 'logistic_regression', 'gradient_boosting']

# List only custom models
custom_models = metis.list_models(include_builtin=False)
print(custom_models)  # ['gradient_boosting']

# Remove a custom model
metis.remove('gradient_boosting')
```

## Error Handling

Metis provides custom exceptions for better error handling:

```python
from metis import MetisError, MetisDataError, MetisConfigError, MetisTrainingError, MetisQuantumError

try:
    model = metis.fit("data.csv")
except MetisDataError as e:
    print(f"Data issue: {e}")
except MetisConfigError as e:
    print(f"Configuration issue: {e}")
except MetisTrainingError as e:
    print(f"Training issue: {e}")
except MetisQuantumError as e:
    print(f"Quantum sampling issue: {e}")
```

## Requirements

- Python >= 3.11
- scikit-learn >= 1.3.0
- pandas >= 2.0.0
- numpy >= 1.24.0
- optuna >= 3.5.0
- joblib >= 1.3.0
- xgboost >= 2.0.0
- pennylane >= 0.35.0 (for quantum features)
- scipy >= 1.11.0

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.