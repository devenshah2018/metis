import numpy as np
from typing import Dict, Any, List, Tuple


def encode_search_space_to_qubo(search_space: Dict[str, Any], current_best_score: float = 0.0) -> Tuple[np.ndarray, np.ndarray]:
    """
    Encode search space to QUBO (Quadratic Unconstrained Binary Optimization) format.
    
    Returns:
        Q: QUBO matrix (symmetric)
        linear: Linear terms (diagonal of Q)
    """
    num_features = search_space['num_features']
    max_features = search_space.get('max_features', num_features)
    
    # Total number of variables: features + model selection + hyperparameters
    # Simplified: focus on feature selection first
    n_vars = num_features
    
    # Initialize QUBO matrix
    Q = np.zeros((n_vars, n_vars))
    
    # Linear terms: encourage feature selection (negative for minimization)
    # We want to maximize feature diversity while respecting max_features constraint
    linear = -np.ones(n_vars) * 0.1  # Small negative bias to encourage selection
    
    # Quadratic terms: penalize too many features
    # Constraint: sum of features <= max_features
    # This is encoded as: (sum(x_i) - max_features)^2
    # Expanding: sum(x_i^2) + 2*sum_{i<j}(x_i*x_j) - 2*max_features*sum(x_i) + max_features^2
    penalty = 1.0
    for i in range(n_vars):
        for j in range(n_vars):
            if i == j:
                Q[i, j] += penalty * (1 - 2 * max_features)
            else:
                Q[i, j] += penalty * 2
    
    # Make symmetric
    Q = (Q + Q.T) / 2
    
    return Q, linear


def encode_config_to_qubits(config: Dict[str, Any], num_features: int) -> List[int]:
    """Encode a candidate configuration to qubit state."""
    feature_mask = config.get('feature_mask', [False] * num_features)
    qubits = [1 if selected else 0 for selected in feature_mask]
    return qubits


def qubits_to_config(qubits: List[int], search_space: Dict[str, Any]) -> Dict[str, Any]:
    """Convert qubit state to candidate configuration."""
    num_features = search_space['num_features']
    model_names = search_space.get('model_names', ['random_forest'])
    
    # Decode feature mask
    feature_mask = [bool(qubits[i]) for i in range(min(len(qubits), num_features))]
    
    # Pad or truncate to match num_features
    if len(feature_mask) < num_features:
        feature_mask.extend([False] * (num_features - len(feature_mask)))
    else:
        feature_mask = feature_mask[:num_features]
    
    # Random model selection (can be enhanced)
    import random
    model = random.choice(model_names)
    
    # Default hyperparameters (can be enhanced)
    hyperparameters = {}
    
    return {
        'feature_mask': feature_mask,
        'model': model,
        'hyperparameters': hyperparameters,
    }

