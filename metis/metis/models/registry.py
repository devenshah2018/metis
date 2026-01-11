"""Model registry for custom user-defined models."""

from typing import Dict, Any, Callable, List, Optional
from sklearn.base import BaseEstimator
from metis.exceptions import MetisConfigError

BUILTIN_MODELS = ['random_forest', 'xgboost', 'svm', 'logistic_regression']


class ModelRegistry:
    """Registry for custom models that can be used in AutoML optimization."""
    
    def __init__(self):
        self._models: Dict[str, Dict[str, Any]] = {}
    
    def register(
        self,
        model_name: str,
        model_creator: Callable[[Dict[str, Any], bool], BaseEstimator],
        hyperparameter_space: Dict[str, List[Any]],
        description: Optional[str] = None
    ) -> None:
        """Register a custom model with Metis.
        
        Args:
            model_name: Unique name for the model (must be a valid Python identifier)
            model_creator: Function that creates a model instance.
                Signature: (hyperparameters: Dict[str, Any], is_classification: bool) -> BaseEstimator
                The function should return a sklearn-compatible model with fit(), predict(), and optionally predict_proba() methods.
            hyperparameter_space: Dictionary mapping hyperparameter names to lists of possible values.
                Example: {'n_estimators': [50, 100, 200], 'max_depth': [3, 5, 7]}
            description: Optional description of the model
        
        Raises:
            MetisConfigError: If model_name is invalid or already registered
        
        Example:
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
            ...     {'n_estimators': [50, 100, 200], 'learning_rate': [0.01, 0.1, 0.3]}
            ... )
        """
        if not model_name or not isinstance(model_name, str):
            raise MetisConfigError("model_name must be a non-empty string")
        
        if not model_name.replace('_', '').isalnum():
            raise MetisConfigError(f"model_name must be alphanumeric with underscores only, got: {model_name}")
        
        if model_name in self._models:
            raise MetisConfigError(f"Model '{model_name}' is already registered. Use metis.remove('{model_name}') first to replace it.")
        
        if not callable(model_creator):
            raise MetisConfigError("model_creator must be a callable function")
        
        if not isinstance(hyperparameter_space, dict):
            raise MetisConfigError("hyperparameter_space must be a dictionary")
        
        if not hyperparameter_space:
            raise MetisConfigError("hyperparameter_space cannot be empty")
        
        for param, values in hyperparameter_space.items():
            if not isinstance(values, list) or len(values) == 0:
                raise MetisConfigError(f"Hyperparameter '{param}' must have a non-empty list of values")
        
        self._models[model_name] = {
            'creator': model_creator,
            'hyperparameter_space': hyperparameter_space,
            'description': description or f"Custom model: {model_name}",
        }
    
    def unregister(self, model_name: str) -> None:
        """Unregister a custom model.
        
        Args:
            model_name: Name of the model to unregister
        
        Raises:
            MetisConfigError: If model is not registered
        """
        if model_name not in self._models:
            raise MetisConfigError(f"Model '{model_name}' is not registered")
        del self._models[model_name]
    
    def get(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get model registration information.
        
        Args:
            model_name: Name of the model
        
        Returns:
            Model registration dict or None if not found
        """
        return self._models.get(model_name)
    
    def list_models(self, include_builtin: bool = False) -> List[str]:
        """List all registered custom model names.
        
        Args:
            include_builtin: If True, include built-in models in the list
        
        Returns:
            List of registered model names (and built-in models if include_builtin=True)
        """
        custom_models = list(self._models.keys())
        if include_builtin:
            return BUILTIN_MODELS + custom_models
        return custom_models
    
    def get_all(self) -> Dict[str, Dict[str, Any]]:
        """Get all registered models.
        
        Returns:
            Dictionary mapping model names to their registration info
        """
        return self._models.copy()
    
    def clear(self) -> None:
        """Clear all registered custom models."""
        self._models.clear()


_global_registry = ModelRegistry()


def get_registry() -> ModelRegistry:
    """Get the global model registry."""
    return _global_registry

