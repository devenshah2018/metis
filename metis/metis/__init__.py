"""Metis: Enterprise AutoML with Quantum-Enhanced Optimization."""

__version__ = "0.1.0"

from metis.exceptions import (
    MetisError,
    MetisDataError,
    MetisConfigError,
    MetisTrainingError,
    MetisQuantumError,
)
from metis._api import fit, MetisModel, add, remove, list_models

__all__ = [
    "fit",
    "add",
    "remove",
    "list_models",
    "MetisModel",
    "MetisError",
    "MetisDataError",
    "MetisConfigError",
    "MetisTrainingError",
    "MetisQuantumError",
    "__version__",
]

