import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any, Union
import io
import base64
from pathlib import Path

from metis.exceptions import MetisDataError


def load_dataset(dataset: Union[str, pd.DataFrame], dataset_format: Optional[str] = None) -> pd.DataFrame:
    """Load dataset from file path or return DataFrame if already provided.
    
    Args:
        dataset: File path (str) or pandas DataFrame
        dataset_format: Optional format hint ('csv', 'json', 'parquet'). Auto-detected if not provided.
    
    Returns:
        Loaded pandas DataFrame
    
    Raises:
        MetisDataError: If dataset cannot be loaded
    """
    if isinstance(dataset, pd.DataFrame):
        if dataset.empty:
            raise MetisDataError("Dataset is empty")
        return dataset.copy()
    
    if not isinstance(dataset, str):
        raise MetisDataError(f"Dataset must be a file path (str) or pandas DataFrame, got {type(dataset)}")
    
    dataset_path = Path(dataset)
    if not dataset_path.exists():
        raise MetisDataError(f"Dataset file not found: {dataset}")
    
    if dataset_format is None:
        suffix = dataset_path.suffix.lower()
        if suffix == '.csv':
            dataset_format = 'csv'
        elif suffix == '.json':
            dataset_format = 'json'
        elif suffix in ['.parquet', '.pq']:
            dataset_format = 'parquet'
        else:
            dataset_format = 'csv'
    
    try:
        if dataset_format == 'csv':
            df = pd.read_csv(dataset_path)
        elif dataset_format == 'json':
            df = pd.read_json(dataset_path)
        elif dataset_format == 'parquet':
            df = pd.read_parquet(dataset_path)
        else:
            raise MetisDataError(f"Unsupported dataset format: {dataset_format}")
        
        if df.empty:
            raise MetisDataError("Loaded dataset is empty")
        
        return df
    except Exception as e:
        raise MetisDataError(f"Failed to load dataset: {str(e)}") from e


def preprocess_dataset(df: pd.DataFrame, target_column: Optional[str] = None) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
    """Preprocess dataset: handle missing values, encode categorical variables.
    
    Args:
        df: Input DataFrame
        target_column: Optional target column name. Auto-detected if not provided.
    
    Returns:
        Tuple of (X, y) where X is features DataFrame and y is target Series (or None)
    
    Raises:
        MetisDataError: If preprocessing fails
    """
    try:
        df = df.copy()
        
        if target_column is None:
            for col in ['target', 'label', 'y', 'class']:
                if col in df.columns:
                    target_column = col
                    break
        
        if target_column and target_column in df.columns:
            y = df[target_column].copy()
            X = df.drop(columns=[target_column])
        else:
            y = None
            X = df
        
        if X.empty:
            raise MetisDataError("No features remaining after target column removal")
        
        X = X.fillna(X.mean(numeric_only=True))
        X = X.fillna('')
        
        for col in X.select_dtypes(include=['object']).columns:
            X[col] = pd.Categorical(X[col]).codes
        
        X = X.apply(pd.to_numeric, errors='coerce').fillna(0)
        
        return X, y
    except Exception as e:
        if isinstance(e, MetisDataError):
            raise
        raise MetisDataError(f"Failed to preprocess dataset: {str(e)}") from e


def split_data(X: pd.DataFrame, y: pd.Series, test_size: float = 0.2, val_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, Dict[str, Any]]:
    """Split data into train, validation, and test sets.
    
    Returns:
        Tuple of (X_train, X_val, X_test, y_train, y_val, y_test, adjustments)
        where adjustments is a dict tracking any auto-adjustments made
    
    Raises:
        MetisDataError: If data splitting fails
    """
    from sklearn.model_selection import train_test_split
    adjustments = {}
    
    if len(X) < 10:
        raise MetisDataError("Dataset too small: need at least 10 samples")
    
    use_stratify = (y.dtype == 'int' or y.dtype == 'object' or y.dtype.name == 'category')
    
    if use_stratify:
        value_counts = y.value_counts()
        min_class_size = value_counts.min()
        if min_class_size < 2:
            use_stratify = False
            adjustments['stratified_split'] = {
                'attempted': True,
                'reason': f'Some classes have fewer than 2 samples (minimum: {min_class_size})',
                'fallback': 'non-stratified split'
            }
    
    try:
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, 
            stratify=y if use_stratify else None
        )
    except ValueError as e:
        if 'least populated class' in str(e) or 'groups' in str(e):
            use_stratify = False
            adjustments['stratified_split'] = {
                'attempted': True,
                'reason': str(e),
                'fallback': 'non-stratified split'
            }
            X_train_val, X_test, y_train_val, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=None
            )
        else:
            raise MetisDataError(f"Failed to split data: {str(e)}") from e
    
    val_size_adjusted = val_size / (1 - test_size)
    
    use_stratify_val = use_stratify
    if use_stratify_val:
        value_counts_val = y_train_val.value_counts()
        min_class_size_val = value_counts_val.min()
        if min_class_size_val < 2:
            use_stratify_val = False
            if 'stratified_split' not in adjustments:
                adjustments['stratified_split'] = {}
            adjustments['stratified_split']['train_val_split'] = {
                'attempted': True,
                'reason': f'Some classes have fewer than 2 samples in train+val set (minimum: {min_class_size_val})',
                'fallback': 'non-stratified split'
            }
    
    try:
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=val_size_adjusted, random_state=42,
            stratify=y_train_val if use_stratify_val else None
        )
    except ValueError as e:
        if 'least populated class' in str(e) or 'groups' in str(e):
            if 'stratified_split' not in adjustments:
                adjustments['stratified_split'] = {}
            adjustments['stratified_split']['train_val_split'] = {
                'attempted': True,
                'reason': str(e),
                'fallback': 'non-stratified split'
            }
            X_train, X_val, y_train, y_val = train_test_split(
                X_train_val, y_train_val, test_size=val_size_adjusted, random_state=42, stratify=None
            )
        else:
            raise MetisDataError(f"Failed to split data: {str(e)}") from e
    
    return X_train, X_val, X_test, y_train, y_val, y_test, adjustments

