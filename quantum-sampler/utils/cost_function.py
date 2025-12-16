import numpy as np
from typing import Dict, Any, List


def build_cost_function(search_space: Dict[str, Any], current_best_score: float = 0.0) -> callable:
    """
    Build a cost function for the search space.
    
    The cost function should:
    1. Encourage diverse feature selections
    2. Respect max_features constraint
    3. Consider current best score for exploration/exploitation balance
    """
    num_features = search_space['num_features']
    max_features = search_space.get('max_features', num_features)
    
    def cost_function(qubits: List[int]) -> float:
        """Compute cost for a given qubit configuration."""
        if len(qubits) < num_features:
            return float('inf')
        
        feature_mask = qubits[:num_features]
        num_selected = sum(feature_mask)
        
        if num_selected > max_features:
            return float('inf')
        
        if num_selected == 0:
            return float('inf')
        
        base_cost = abs(num_selected - max_features / 2) / max_features
        
        return base_cost
    
    return cost_function

