from typing import Dict, Any
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.linear_model import LogisticRegression, Ridge
import xgboost as xgb


def create_model(model_name: str, hyperparameters: Dict[str, Any], is_classification: bool):
    """Create a model instance based on name and hyperparameters."""
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
        raise ValueError(f"Unknown model: {model_name}")

