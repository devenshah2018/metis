import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from search_space import SearchSpace


def test_search_space_initialization():
    """Test SearchSpace initialization."""
    feature_names = ['feature1', 'feature2', 'feature3']
    search_space = SearchSpace(feature_names, is_classification=True)
    
    assert search_space.num_features == 3
    assert search_space.feature_names == feature_names
    assert search_space.is_classification == True


def test_feature_mask_encoding_decoding():
    """Test feature mask encoding and decoding."""
    feature_names = ['feature1', 'feature2', 'feature3', 'feature4']
    search_space = SearchSpace(feature_names, is_classification=True)
    
    selected_features = ['feature1', 'feature3']
    feature_mask = search_space.encode_feature_mask(selected_features)
    
    assert feature_mask == [True, False, True, False]
    
    decoded = search_space.decode_feature_mask(feature_mask)
    assert set(decoded) == set(selected_features)


def test_sample_random_config():
    """Test random configuration sampling."""
    feature_names = ['feature1', 'feature2', 'feature3']
    search_space = SearchSpace(feature_names, is_classification=True, max_features=2)
    
    config = search_space.sample_random_config()
    
    assert 'feature_mask' in config
    assert 'model' in config
    assert 'hyperparameters' in config
    assert sum(config['feature_mask']) <= 2
    assert sum(config['feature_mask']) > 0


def test_validate_config():
    """Test configuration validation."""
    feature_names = ['feature1', 'feature2', 'feature3']
    search_space = SearchSpace(feature_names, is_classification=True, max_features=2)
    
    # Valid config
    valid_config = {
        'feature_mask': [True, False, True],
        'model': 'random_forest',
        'hyperparameters': {'n_estimators': 100, 'max_depth': 10}
    }
    assert search_space.validate_config(valid_config) == True
    
    # Invalid: no features selected
    invalid_config = {
        'feature_mask': [False, False, False],
        'model': 'random_forest',
        'hyperparameters': {'n_estimators': 100}
    }
    assert search_space.validate_config(invalid_config) == False


if __name__ == '__main__':
    pytest.main([__file__])

