import numpy as np
import pandas as pd
from typing import List, Tuple, Optional
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.preprocessing import StandardScaler


def select_features(X: pd.DataFrame, y: pd.Series, max_features: Optional[int] = None, 
                   feature_mask: Optional[List[bool]] = None) -> Tuple[pd.DataFrame, List[str]]:
    """Select features based on feature mask or mutual information."""
    if feature_mask is not None:
        selected_features = [X.columns[i] for i, selected in enumerate(feature_mask) if selected]
        X_selected = X[selected_features]
    else:
        selected_features = list(X.columns)
        X_selected = X.copy()
    
    if max_features and len(selected_features) > max_features:
        if y.dtype == 'object' or y.dtype.name == 'category':
            mi_scores = mutual_info_classif(X_selected, y, random_state=42)
        else:
            mi_scores = mutual_info_regression(X_selected, y, random_state=42)
        
        top_indices = np.argsort(mi_scores)[-max_features:]
        selected_features = [selected_features[i] for i in top_indices]
        X_selected = X_selected[selected_features]
    
    return X_selected, selected_features


def scale_features(X_train: pd.DataFrame, X_val: pd.DataFrame, X_test: pd.DataFrame) -> Tuple:
    """Scale features using StandardScaler."""
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index
    )
    X_val_scaled = pd.DataFrame(
        scaler.transform(X_val),
        columns=X_val.columns,
        index=X_val.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test),
        columns=X_test.columns,
        index=X_test.index
    )
    
    return X_train_scaled, X_val_scaled, X_test_scaled, scaler

