import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from qaoa_sampler import QAOASampler


def test_qaoa_sampler_initialization():
    """Test QAOASampler initialization."""
    sampler = QAOASampler(num_layers=2)
    assert sampler.num_layers == 2


def test_generate_candidates():
    """Test candidate generation."""
    sampler = QAOASampler(num_layers=2)
    
    search_space = {
        'num_features': 5,
        'max_features': 3,
        'model_names': ['random_forest', 'xgboost']
    }
    
    candidates = sampler.generate_candidates(search_space, num_candidates=3)
    
    assert len(candidates) <= 3
    assert len(candidates) > 0
    
    for candidate in candidates:
        assert 'feature_mask' in candidate
        assert 'model' in candidate
        assert 'hyperparameters' in candidate
        assert len(candidate['feature_mask']) == 5
        assert sum(candidate['feature_mask']) > 0
        assert sum(candidate['feature_mask']) <= 3


if __name__ == '__main__':
    pytest.main([__file__])

