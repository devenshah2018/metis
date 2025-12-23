import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any
import io
import base64


def load_dataset(dataset_base64: str, dataset_format: str) -> pd.DataFrame:
    """Load dataset from base64 encoded string."""
    dataset_bytes = base64.b64decode(dataset_base64)
    
    if dataset_format == 'csv':
        df = pd.read_csv(io.BytesIO(dataset_bytes))
    elif dataset_format == 'json':
        df = pd.read_json(io.BytesIO(dataset_bytes))
    else:
        raise ValueError(f"Unsupported dataset format: {dataset_format}")
    
    return df


def preprocess_dataset(df: pd.DataFrame, target_column: Optional[str] = None) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
    """Preprocess dataset: handle missing values, encode categorical variables."""
    df = df.copy()
    
    if target_column is None:
        for col in ['target', 'label', 'y', 'class']:
            if col in df.columns:
                target_column = col
                break
    
    if target_column and target_column in df.columns:
        y = df[target_column]
        X = df.drop(columns=[target_column])
    else:
        y = None
        X = df
    
    X = X.fillna(X.mean(numeric_only=True))
    X = X.fillna('')
    
    for col in X.select_dtypes(include=['object']).columns:
        X[col] = pd.Categorical(X[col]).codes
    
    X = X.apply(pd.to_numeric, errors='coerce').fillna(0)
    
    return X, y


def split_data(X: pd.DataFrame, y: pd.Series, test_size: float = 0.2, val_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, Dict[str, Any]]:
    """Split data into train, validation, and test sets.
    
    Returns:
        Tuple of (X_train, X_val, X_test, y_train, y_val, y_test, adjustments)
        where adjustments is a dict tracking any auto-adjustments made
    """
    from sklearn.model_selection import train_test_split
    adjustments = {}
    
    # Determine if we should use stratified splitting
    use_stratify = (y.dtype == 'int' or y.dtype == 'object' or y.dtype.name == 'category')
    
    # Check if stratified splitting is feasible
    if use_stratify:
        value_counts = y.value_counts()
        min_class_size = value_counts.min()
        # Need at least 2 samples per class for stratified split
        if min_class_size < 2:
            use_stratify = False
            adjustments['stratified_split'] = {
                'attempted': True,
                'reason': f'Some classes have fewer than 2 samples (minimum: {min_class_size})',
                'fallback': 'non-stratified split'
            }
    
    # First split: train+val vs test
    try:
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, 
            stratify=y if use_stratify else None
        )
    except ValueError as e:
        # If stratified split fails, fall back to non-stratified
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
            raise
    
    # Second split: train vs val
    val_size_adjusted = val_size / (1 - test_size)
    
    # Check if stratified splitting is feasible for train/val split
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
        # If stratified split fails, fall back to non-stratified
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
            raise
    
    return X_train, X_val, X_test, y_train, y_val, y_test, adjustments

