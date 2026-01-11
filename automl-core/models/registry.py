"""Model registry for custom user-defined models."""

from typing import Dict, Any, Callable, List, Optional
from sklearn.base import BaseEstimator

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
        """Register a custom model.
        
        Args:
            model_name: Unique name for the model (must be a valid Python identifier)
            model_creator: Function that creates a model instance.
                Signature: (hyperparameters: Dict[str, Any], is_classification: bool) -> BaseEstimator
            hyperparameter_space: Dictionary mapping hyperparameter names to lists of possible values.
            description: Optional description of the model
        """
        if not model_name or not isinstance(model_name, str):
            raise ValueError("model_name must be a non-empty string")
        
        if not model_name.replace('_', '').isalnum():
            raise ValueError(f"model_name must be alphanumeric with underscores only, got: {model_name}")
        
        if model_name in self._models:
            raise ValueError(f"Model '{model_name}' is already registered. Unregister it first to replace it.")
        
        if not callable(model_creator):
            raise ValueError("model_creator must be a callable function")
        
        if not isinstance(hyperparameter_space, dict):
            raise ValueError("hyperparameter_space must be a dictionary")
        
        if not hyperparameter_space:
            raise ValueError("hyperparameter_space cannot be empty")
        
        for param, values in hyperparameter_space.items():
            if not isinstance(values, list) or len(values) == 0:
                raise ValueError(f"Hyperparameter '{param}' must have a non-empty list of values")
        
        self._models[model_name] = {
            'creator': model_creator,
            'hyperparameter_space': hyperparameter_space,
            'description': description or f"Custom model: {model_name}",
        }
    
    def unregister(self, model_name: str) -> None:
        """Unregister a custom model."""
        if model_name not in self._models:
            raise ValueError(f"Model '{model_name}' is not registered")
        del self._models[model_name]
    
    def get(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get model registration information."""
        return self._models.get(model_name)
    
    def list_models(self, include_builtin: bool = False) -> List[str]:
        """List all registered custom model names."""
        custom_models = list(self._models.keys())
        if include_builtin:
            return BUILTIN_MODELS + custom_models
        return custom_models
    
    def get_all(self) -> Dict[str, Dict[str, Any]]:
        """Get all registered models."""
        return self._models.copy()
    
    def clear(self) -> None:
        """Clear all registered custom models."""
        self._models.clear()


_global_registry = ModelRegistry()


def get_registry() -> ModelRegistry:
    """Get the global model registry."""
    return _global_registry

