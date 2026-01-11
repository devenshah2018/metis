from typing import Dict, Any, Tuple, List
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator
from metis.models.model_factory import create_model
from metis.utils.feature_engineering import select_features
from metis.exceptions import MetisTrainingError


class ModelTrainer:
    """Handles model training and evaluation."""
    
    def __init__(self, X_train: pd.DataFrame, X_val: pd.DataFrame, 
                 y_train: pd.Series, y_val: pd.Series, is_classification: bool):
        self.X_train = X_train
        self.X_val = X_val
        self.y_train = y_train
        self.y_val = y_val
        self.is_classification = is_classification
    
    def train_and_evaluate(self, config: Dict[str, Any], metric: str) -> Tuple[float, BaseEstimator, Dict[str, float]]:
        """Train a model with given configuration and return validation score.
        
        Args:
            config: Configuration dictionary with model, hyperparameters, and feature_mask
            metric: Metric to use for evaluation
        
        Returns:
            Tuple of (validation_score, trained_model, metrics_dict)
        
        Raises:
            MetisTrainingError: If training fails
        """
        try:
            feature_mask = config['feature_mask']
            X_train_selected, selected_features = select_features(
                self.X_train, self.y_train, feature_mask=feature_mask
            )
            X_val_selected, _ = select_features(
                self.X_val, self.y_val, feature_mask=feature_mask
            )
            
            model = create_model(
                config['model'],
                config['hyperparameters'],
                self.is_classification
            )
            
            model.fit(X_train_selected, self.y_train)
            
            train_score = self._compute_score(model, X_train_selected, self.y_train, metric)
            val_score = self._compute_score(model, X_val_selected, self.y_val, metric)
            
            feature_importance = self._get_feature_importance(model, selected_features)
            
            metrics = {
                'train_score': train_score,
                'validation_score': val_score,
                'feature_importance': feature_importance,
            }
            
            return val_score, model, metrics
        except Exception as e:
            if isinstance(e, MetisTrainingError):
                raise
            raise MetisTrainingError(f"Failed to train model: {str(e)}") from e
    
    def _compute_score(self, model: BaseEstimator, X: pd.DataFrame, y: pd.Series, metric: str) -> float:
        """Compute score based on metric."""
        from sklearn.metrics import (
            accuracy_score, f1_score, precision_score, recall_score,
            roc_auc_score, r2_score, mean_squared_error, mean_absolute_error
        )
        
        try:
            y_pred = model.predict(X)
            
            if self.is_classification:
                if metric == 'accuracy':
                    return accuracy_score(y, y_pred)
                elif metric == 'f1':
                    return f1_score(y, y_pred, average='weighted')
                elif metric == 'precision':
                    return precision_score(y, y_pred, average='weighted', zero_division=0)
                elif metric == 'recall':
                    return recall_score(y, y_pred, average='weighted', zero_division=0)
                elif metric == 'roc_auc':
                    try:
                        if hasattr(model, 'predict_proba'):
                            y_pred_proba = model.predict_proba(X)[:, 1]
                            return roc_auc_score(y, y_pred_proba)
                        else:
                            return 0.0
                    except:
                        return 0.0
                else:
                    return accuracy_score(y, y_pred)
            else:
                if metric == 'r2':
                    return r2_score(y, y_pred)
                elif metric == 'mse':
                    return -mean_squared_error(y, y_pred)
                elif metric == 'mae':
                    return -mean_absolute_error(y, y_pred)
                else:
                    return r2_score(y, y_pred)
        except Exception as e:
            raise MetisTrainingError(f"Failed to compute score: {str(e)}") from e
    
    def _get_feature_importance(self, model: BaseEstimator, feature_names: List[str]) -> Dict[str, float]:
        """Extract feature importance from model."""
        importance_dict = {}
        
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                for i, feature in enumerate(feature_names):
                    importance_dict[feature] = float(importances[i])
            elif hasattr(model, 'coef_'):
                coef = model.coef_
                if coef.ndim > 1:
                    coef = np.abs(coef[0])
                else:
                    coef = np.abs(coef)
                for i, feature in enumerate(feature_names):
                    importance_dict[feature] = float(coef[i])
            else:
                for feature in feature_names:
                    importance_dict[feature] = 1.0 / len(feature_names)
        except Exception:
            for feature in feature_names:
                importance_dict[feature] = 1.0 / len(feature_names)
        
        return importance_dict

