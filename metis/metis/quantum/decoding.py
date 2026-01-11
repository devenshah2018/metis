import numpy as np
from typing import Dict, Any, List
import random


def decode_samples(samples: List[List[int]], search_space: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert quantum samples to candidate configurations."""
    candidates = []
    num_features = search_space['num_features']
    model_names = search_space.get('model_names', ['random_forest', 'xgboost', 'svm', 'logistic_regression'])
    
    model_spaces = {
        'random_forest': {
            'n_estimators': [50, 100, 200, 300],
            'max_depth': [None, 5, 10, 20, 30],
            'min_samples_split': [2, 5, 10],
        },
        'xgboost': {
            'n_estimators': [50, 100, 200],
            'max_depth': [3, 5, 7, 9],
            'learning_rate': [0.01, 0.1, 0.3],
        },
        'svm': {
            'C': [0.1, 1.0, 10.0, 100.0],
            'gamma': ['scale', 'auto', 0.001, 0.01],
            'kernel': ['rbf', 'linear', 'poly'],
        },
        'logistic_regression': {
            'C': [0.1, 1.0, 10.0, 100.0],
            'penalty': ['l1', 'l2'],
        },
    }
    
    for sample in samples:
        feature_mask = [bool(sample[i]) if i < len(sample) else False for i in range(num_features)]
        
        if not any(feature_mask):
            idx = random.randint(0, num_features - 1)
            feature_mask[idx] = True
        
        model = random.choice(model_names)
        
        hyperparameters = {}
        for param, values in model_spaces.get(model, {}).items():
            hyperparameters[param] = random.choice(values)
        
        candidate = {
            'feature_mask': feature_mask,
            'model': model,
            'hyperparameters': hyperparameters,
        }
        
        candidates.append(candidate)
    
    return candidates

