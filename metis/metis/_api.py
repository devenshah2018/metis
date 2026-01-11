"""Main API for Metis package."""

from typing import Union, Dict, Any, Optional
import pandas as pd
from sklearn.base import BaseEstimator

from typing import Callable, List as ListType
from metis.exceptions import MetisError, MetisDataError, MetisConfigError, MetisTrainingError
from metis.utils.data_loader import load_dataset, preprocess_dataset, split_data
from metis.core.search_space import SearchSpace
from metis.core.orchestrator import Orchestrator
from metis.utils.feature_engineering import select_features
from metis.models.registry import get_registry


class MetisModel:
    """Wrapper for trained Metis model with convenient access methods."""
    
    def __init__(self, model: BaseEstimator, hyperparameters: Dict[str, Any],
                 selected_features: list, metrics: Dict[str, float],
                 metadata: Dict[str, Any]):
        self.model = model
        self.hyperparameters = hyperparameters
        self.selected_features = selected_features
        self.metrics = metrics
        self.metadata = metadata
        self._is_classification = metadata.get('is_classification', False)
    
    def predict(self, X: pd.DataFrame) -> Any:
        """Make predictions on new data.
        
        Args:
            X: Feature DataFrame (must include all selected features)
        
        Returns:
            Predictions array
        """
        X_selected = X[self.selected_features]
        return self.model.predict(X_selected)
    
    def predict_proba(self, X: pd.DataFrame) -> Any:
        """Make probability predictions (classification only).
        
        Args:
            X: Feature DataFrame (must include all selected features)
        
        Returns:
            Probability predictions array
        
        Raises:
            ValueError: If model doesn't support predict_proba
        """
        if not self._is_classification:
            raise ValueError("predict_proba is only available for classification models")
        
        if not hasattr(self.model, 'predict_proba'):
            raise ValueError("Model does not support predict_proba")
        
        X_selected = X[self.selected_features]
        return self.model.predict_proba(X_selected)
    
    def score(self, X: pd.DataFrame, y: pd.Series) -> float:
        """Score the model on test data.
        
        Args:
            X: Feature DataFrame
            y: Target Series
        
        Returns:
            Score value
        """
        X_selected = X[self.selected_features]
        return self.model.score(X_selected, y)
    
    def __repr__(self) -> str:
        return f"MetisModel(model={self.metadata.get('model_name')}, metric={self.metadata.get('metric')}, score={self.metrics.get('validation_score', 0):.4f})"


def fit(dataset: Union[str, pd.DataFrame], config: Optional[Dict[str, Any]] = None, **kwargs) -> MetisModel:
    """Train an AutoML model on the provided dataset.
    
    Args:
        dataset: File path (str) or pandas DataFrame
        config: Optional configuration dictionary. Can also pass parameters as kwargs.
        **kwargs: Configuration parameters (metric, objective, search_budget, etc.)
    
    Configuration options:
        metric (str): Metric to optimize ('accuracy', 'f1', 'r2', 'mse', 'mae', etc.)
        objective (str): 'maximize' or 'minimize' (default: 'maximize')
        search_budget (int): Number of optimization trials (default: 50)
        max_features (int): Maximum number of features to select (default: all)
        target_column (str): Target column name (auto-detected if not provided)
        use_quantum (bool): Enable quantum sampling (default: True)
    
    Returns:
        MetisModel: Trained model with metadata
    
    Raises:
        MetisDataError: If dataset loading/preprocessing fails
        MetisConfigError: If configuration is invalid
        MetisTrainingError: If model training fails
    
    Example:
        >>> import metis
        >>> import pandas as pd
        >>> 
        >>> # From file path
        >>> model = metis.fit("data.csv", metric="accuracy", search_budget=50)
        >>> 
        >>> # From DataFrame
        >>> df = pd.read_csv("data.csv")
        >>> model = metis.fit(df, metric="f1", search_budget=100)
        >>> 
        >>> # Make predictions
        >>> predictions = model.predict(X_test)
    """
    if config is None:
        config = {}
    
    config = {**config, **kwargs}
    
    default_config = {
        'metric': 'accuracy',
        'objective': 'maximize',
        'search_budget': 50,
        'max_features': None,
        'target_column': None,
        'use_quantum': True,
    }
    
    for key, value in default_config.items():
        if key not in config:
            config[key] = value
    
    if config['metric'] not in ['accuracy', 'f1', 'precision', 'recall', 'roc_auc', 'r2', 'mse', 'mae']:
        raise MetisConfigError(f"Invalid metric: {config['metric']}")
    
    if config['objective'] not in ['maximize', 'minimize']:
        raise MetisConfigError(f"Invalid objective: {config['objective']}. Must be 'maximize' or 'minimize'")
    
    if not isinstance(config['search_budget'], int) or config['search_budget'] < 1:
        raise MetisConfigError(f"search_budget must be a positive integer, got {config['search_budget']}")
    
    try:
        df = load_dataset(dataset)
    except MetisDataError:
        raise
    except Exception as e:
        raise MetisDataError(f"Failed to load dataset: {str(e)}") from e
    
    try:
        X, y = preprocess_dataset(df, target_column=config.get('target_column'))
    except MetisDataError:
        raise
    except Exception as e:
        raise MetisDataError(f"Failed to preprocess dataset: {str(e)}") from e
    
    if y is None:
        raise MetisDataError("Target column not found in dataset. Please ensure dataset has a 'target', 'label', 'y', or 'class' column, or specify target_column in config.")
    
    if len(X) < 10:
        raise MetisDataError("Dataset too small: need at least 10 samples")
    
    try:
        X_train, X_val, X_test, y_train, y_val, y_test, split_adjustments = split_data(X, y)
    except MetisDataError:
        raise
    except Exception as e:
        raise MetisDataError(f"Failed to split data: {str(e)}") from e
    
    max_features = config.get('max_features')
    if max_features and max_features > X.shape[1]:
        max_features = X.shape[1]
    
    is_classification = y.dtype == 'object' or y.dtype.name == 'category' or \
                       (y.dtype in ['int64', 'int32'] and y.nunique() < 20)
    
    search_space = SearchSpace(
        list(X.columns),
        is_classification,
        max_features=max_features
    )
    
    try:
        orchestrator = Orchestrator(
            X_train, X_val, X_test,
            y_train, y_val, y_test,
            search_space,
            config['metric'],
            config['objective'],
            config['search_budget'],
            use_quantum=config.get('use_quantum', True)
        )
        
        results = orchestrator.run()
    except MetisTrainingError:
        raise
    except Exception as e:
        raise MetisTrainingError(f"Training failed: {str(e)}") from e
    
    model = MetisModel(
        model=orchestrator.best_model,
        hyperparameters=results['best_model']['hyperparameters'],
        selected_features=results['best_model']['selected_features'],
        metrics=results['metrics'],
        metadata={
            'model_name': results['best_model']['name'],
            'metric': config['metric'],
            'objective': config['objective'],
            'is_classification': is_classification,
            'feature_importance': results.get('feature_importance', {}),
            'training_history': results.get('training_history', []),
        }
    )
    
    return model


def add(
    model_name: str,
    model_creator: Callable[[Dict[str, Any], bool], BaseEstimator],
    hyperparameter_space: Dict[str, ListType[Any]],
    description: Optional[str] = None
) -> None:
    """Register a custom model with Metis for use in AutoML optimization.
    
    Args:
        model_name: Unique name for the model (must be alphanumeric with underscores)
        model_creator: Function that creates a model instance.
            Signature: (hyperparameters: Dict[str, Any], is_classification: bool) -> BaseEstimator
            The function should return a sklearn-compatible model with fit(), predict(), and optionally predict_proba() methods.
        hyperparameter_space: Dictionary mapping hyperparameter names to lists of possible values.
            Example: {'n_estimators': [50, 100, 200], 'max_depth': [3, 5, 7]}
        description: Optional description of the model
    
    Raises:
        MetisConfigError: If model_name is invalid or already registered
    
    Example:
        >>> import metis
        >>> from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
        >>> 
        >>> def create_gbm(hyperparameters, is_classification):
        ...     if is_classification:
        ...         return GradientBoostingClassifier(**hyperparameters, random_state=42)
        ...     else:
        ...         return GradientBoostingRegressor(**hyperparameters, random_state=42)
        >>> 
        >>> metis.add(
        ...     'gradient_boosting',
        ...     create_gbm,
        ...     {'n_estimators': [50, 100, 200], 'learning_rate': [0.01, 0.1, 0.3], 'max_depth': [3, 5, 7]}
        ... )
        >>> 
        >>> # Now you can use it in AutoML
        >>> model = metis.fit("data.csv", search_budget=50)
    """
    registry = get_registry()
    registry.register(model_name, model_creator, hyperparameter_space, description)


def remove(model_name: str) -> None:
    """Unregister a custom model.
    
    Args:
        model_name: Name of the model to unregister
    
    Raises:
        MetisConfigError: If model is not registered
    
    Example:
        >>> metis.remove('gradient_boosting')
    """
    registry = get_registry()
    registry.unregister(model_name)


def list_models(include_builtin: bool = True) -> ListType[str]:
    """List all available model names.
    
    Args:
        include_builtin: If True, include built-in models (default: True)
    
    Returns:
        List of available model names (built-in + custom if include_builtin=True)
    
    Example:
        >>> all_models = metis.list_models()
        >>> print(all_models)
        ['random_forest', 'xgboost', 'svm', 'logistic_regression', 'gradient_boosting']
        
        >>> custom_only = metis.list_models(include_builtin=False)
        >>> print(custom_only)
        ['gradient_boosting']
    """
    from metis.models.registry import BUILTIN_MODELS
    
    registry = get_registry()
    custom_models = registry.list_models(include_builtin=False)
    
    if include_builtin:
        return BUILTIN_MODELS + custom_models
    return custom_models

