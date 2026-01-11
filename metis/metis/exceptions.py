"""Custom exceptions for Metis package."""


class MetisError(Exception):
    """Base exception for all Metis errors."""
    pass


class MetisDataError(MetisError):
    """Raised when there are issues with data loading or preprocessing."""
    pass


class MetisConfigError(MetisError):
    """Raised when configuration is invalid."""
    pass


class MetisTrainingError(MetisError):
    """Raised when model training fails."""
    pass


class MetisQuantumError(MetisError):
    """Raised when quantum sampling fails."""
    pass

