import numpy as np
from typing import Dict, List, Any, Optional
import pandas as pd
from metis.models.registry import get_registry


class SearchSpace:
    """Encapsulates the search space for AutoML optimization."""
    
    def __init__(self, feature_names: List[str], is_classification: bool, 
                 max_features: Optional[int] = None):
        self.feature_names = feature_names
        self.num_features = len(feature_names)
        self.is_classification = is_classification
        self.max_features = max_features or self.num_features
        
        registry = get_registry()
        custom_models = registry.get_all()
        
        self.model_spaces = {
            'random_forest': {
                'n_estimators': [50, 100, 200, 300],
                'max_depth': [None, 5, 10, 20, 30],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
            },
            'xgboost': {
                'n_estimators': [50, 100, 200],
                'max_depth': [3, 5, 7, 9],
                'learning_rate': [0.01, 0.1, 0.3],
                'subsample': [0.8, 0.9, 1.0],
            },
            'svm': {
                'C': [0.1, 1.0, 10.0, 100.0],
                'gamma': ['scale', 'auto', 0.001, 0.01, 0.1],
                'kernel': ['rbf', 'linear', 'poly'],
            },
            'logistic_regression': {
                'C': [0.1, 1.0, 10.0, 100.0],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'lbfgs'],
            },
        }
        
        for model_name, model_info in custom_models.items():
            self.model_spaces[model_name] = model_info['hyperparameter_space']
        
        self.model_names = list(self.model_spaces.keys())
    
    def get_feature_mask_size(self) -> int:
        """Get the number of bits needed for feature selection."""
        return self.num_features
    
    def decode_feature_mask(self, feature_mask: List[bool]) -> List[str]:
        """Decode binary feature mask to list of selected feature names."""
        return [self.feature_names[i] for i, selected in enumerate(feature_mask) if selected]
    
    def encode_feature_mask(self, selected_features: List[str]) -> List[bool]:
        """Encode list of selected feature names to binary mask."""
        return [feature in selected_features for feature in self.feature_names]
    
    def sample_random_config(self) -> Dict[str, Any]:
        """Sample a random candidate configuration."""
        num_selected = np.random.randint(1, min(self.max_features + 1, self.num_features + 1))
        selected_indices = np.random.choice(self.num_features, size=num_selected, replace=False)
        feature_mask = [i in selected_indices for i in range(self.num_features)]
        
        model_name = np.random.choice(self.model_names)
        
        hyperparameters = {}
        for param, values in self.model_spaces[model_name].items():
            hyperparameters[param] = np.random.choice(values)
        
        return {
            'feature_mask': feature_mask,
            'model': model_name,
            'hyperparameters': hyperparameters,
        }
    
    def get_config_dict(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert internal config format to dictionary."""
        return {
            'feature_mask': config['feature_mask'],
            'model': config['model'],
            'hyperparameters': config['hyperparameters'],
        }
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate a candidate configuration."""
        if 'feature_mask' not in config or 'model' not in config:
            return False
        
        if len(config['feature_mask']) != self.num_features:
            return False
        
        if sum(config['feature_mask']) == 0:
            return False
        
        if sum(config['feature_mask']) > self.max_features:
            return False
        
        if config['model'] not in self.model_names:
            return False
        
        if 'hyperparameters' not in config:
            return False
        
        model_space = self.model_spaces[config['model']]
        for param, value in config['hyperparameters'].items():
            if param not in model_space:
                return False
            if value not in model_space[param]:
                return False
        
        return True

