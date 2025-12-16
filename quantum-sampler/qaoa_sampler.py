import pennylane as qml
import numpy as np
from typing import Dict, Any, List
from utils.encoding import encode_search_space_to_qubo
from utils.decoding import decode_samples


class QAOASampler:
    """QAOA-based sampler for generating candidate configurations."""
    
    def __init__(self, num_layers: int = 2):
        self.num_layers = num_layers
    
    def generate_candidates(self, search_space: Dict[str, Any], num_candidates: int = 5) -> List[Dict[str, Any]]:
        """
        Generate candidate configurations using QAOA.
        
        Args:
            search_space: Dictionary containing search space information
            num_candidates: Number of candidates to generate
            
        Returns:
            List of candidate configurations
        """
        num_features = search_space['num_features']
        
        Q, linear = encode_search_space_to_qubo(search_space)
        
        dev = qml.device("default.qubit", wires=num_features)
        
        @qml.qnode(dev)
        def qaoa_circuit(params):
            """QAOA circuit for feature selection."""
            for i in range(num_features):
                qml.Hadamard(wires=i)
            
            gamma = params[:self.num_layers]
            beta = params[self.num_layers:]
            
            for layer in range(self.num_layers):
                for i in range(num_features):
                    for j in range(i, num_features):
                        if i == j:
                            qml.RZ(2 * gamma[layer] * linear[i], wires=i)
                        else:
                            if abs(Q[i, j]) > 1e-10:
                                qml.CNOT(wires=[i, j])
                                qml.RZ(2 * gamma[layer] * Q[i, j], wires=j)
                                qml.CNOT(wires=[i, j])
                
                for i in range(num_features):
                    qml.RX(2 * beta[layer], wires=i)
            
            return [qml.expval(qml.PauliZ(i)) for i in range(num_features)]
        
        np.random.seed(42)
        params = np.random.uniform(0, np.pi, size=2 * self.num_layers)
        
        samples = []
        for _ in range(num_candidates * 2):
            expectations = qaoa_circuit(params)
            
            sample = [1 if exp > 0 else 0 for exp in expectations]
            samples.append(sample)
        
        candidates = decode_samples(samples, search_space)
        
        unique_candidates = []
        seen = set()
        for candidate in candidates:
            feature_tuple = tuple(candidate['feature_mask'])
            if feature_tuple not in seen:
                seen.add(feature_tuple)
                unique_candidates.append(candidate)
                if len(unique_candidates) >= num_candidates:
                    break
        
        return unique_candidates[:num_candidates]

