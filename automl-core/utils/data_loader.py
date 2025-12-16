import pandas as pd
import numpy as np
from typing import Tuple, Optional
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


def split_data(X: pd.DataFrame, y: pd.Series, test_size: float = 0.2, val_size: float = 0.2) -> Tuple:
    """Split data into train, validation, and test sets."""
    from sklearn.model_selection import train_test_split
    
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y if y.dtype == 'int' or y.dtype == 'object' else None
    )
    
    val_size_adjusted = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_size_adjusted, random_state=42,
        stratify=y_train_val if y_train_val.dtype == 'int' or y_train_val.dtype == 'object' else None
    )
    
    return X_train, X_val, X_test, y_train, y_val, y_test

