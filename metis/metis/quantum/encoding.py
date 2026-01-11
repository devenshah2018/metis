import numpy as np
from typing import Dict, Any, Tuple


def encode_search_space_to_qubo(search_space: Dict[str, Any], current_best_score: float = 0.0) -> Tuple[np.ndarray, np.ndarray]:
    """Encode search space to QUBO (Quadratic Unconstrained Binary Optimization) format.
    
    Returns:
        Q: QUBO matrix (symmetric)
        linear: Linear terms (diagonal of Q)
    """
    num_features = search_space['num_features']
    max_features = search_space.get('max_features', num_features)
    
    n_vars = num_features
    
    Q = np.zeros((n_vars, n_vars))
    
    linear = -np.ones(n_vars) * 0.1
    
    penalty = 1.0
    for i in range(n_vars):
        for j in range(n_vars):
            if i == j:
                Q[i, j] += penalty * (1 - 2 * max_features)
            else:
                Q[i, j] += penalty * 2
    
    Q = (Q + Q.T) / 2
    
    return Q, linear

