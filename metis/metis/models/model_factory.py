from typing import Dict, Any
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.linear_model import LogisticRegression, Ridge
import xgboost as xgb

from metis.exceptions import MetisTrainingError
from metis.models.registry import get_registry


def create_model(model_name: str, hyperparameters: Dict[str, Any], is_classification: bool):
    """Create a model instance based on name and hyperparameters.
    
    Args:
        model_name: Name of the model to create
        hyperparameters: Dictionary of hyperparameters
        is_classification: Whether this is a classification task
    
    Returns:
        Trained sklearn-compatible model
    
    Raises:
        MetisTrainingError: If model creation fails
    """
    try:
        registry = get_registry()
        custom_model = registry.get(model_name)
        
        if custom_model:
            return custom_model['creator'](hyperparameters, is_classification)
        
        if model_name == 'random_forest':
            if is_classification:
                return RandomForestClassifier(**hyperparameters, random_state=42)
            else:
                return RandomForestRegressor(**hyperparameters, random_state=42)
        
        elif model_name == 'xgboost':
            if is_classification:
                return xgb.XGBClassifier(**hyperparameters, random_state=42)
            else:
                return xgb.XGBRegressor(**hyperparameters, random_state=42)
        
        elif model_name == 'svm':
            if is_classification:
                return SVC(**hyperparameters, random_state=42)
            else:
                return SVR(**hyperparameters, random_state=42)
        
        elif model_name == 'logistic_regression':
            if is_classification:
                return LogisticRegression(**hyperparameters, random_state=42)
            else:
                return Ridge(**hyperparameters, random_state=42)
        
        else:
            raise MetisTrainingError(f"Unknown model: {model_name}")
    except Exception as e:
        if isinstance(e, MetisTrainingError):
            raise
        raise MetisTrainingError(f"Failed to create model {model_name}: {str(e)}") from e

