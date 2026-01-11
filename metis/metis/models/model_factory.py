"""
Model factory imported from automl-core.

This module imports from automl-core/models/model_factory.py to maintain a single
source of truth. The automl-core directory is added to sys.path to enable the import.
METIS's registry is used instead of automl-core's registry for custom model support.
"""
import sys
from pathlib import Path
from typing import Dict, Any
import importlib.util

# Add parent directories to path to import from automl-core
_metis_dir = Path(__file__).parent.parent.parent
_repo_root = _metis_dir.parent
_automl_core = _repo_root / "automl-core"

if str(_automl_core) not in sys.path:
    sys.path.insert(0, str(_automl_core))

# Import METIS registry to use instead of automl-core's registry
from metis.exceptions import MetisTrainingError
from metis.models.registry import get_registry as get_metis_registry

# Temporarily patch automl-core's registry module to use METIS registry
# This allows automl-core's model_factory to work with METIS's registry
import types
_metis_registry_module = types.ModuleType('models.registry')
_metis_registry_module.get_registry = get_metis_registry
sys.modules['models.registry'] = _metis_registry_module

# Now import from automl-core (it will use METIS registry via the patch)
from models.model_factory import create_model as _automl_create_model

# Wrap to convert ValueError to MetisTrainingError
def create_model(model_name: str, hyperparameters: Dict[str, Any], is_classification: bool):
    """Create a model instance based on name and hyperparameters.
    
    This wraps automl-core's model_factory.create_model to use METIS exceptions.
    The function uses METIS's registry for custom model support.
    """
    try:
        return _automl_create_model(model_name, hyperparameters, is_classification)
    except ValueError as e:
        raise MetisTrainingError(str(e)) from e
    except Exception as e:
        raise MetisTrainingError(f"Failed to create model {model_name}: {str(e)}") from e

__all__ = ['create_model']
