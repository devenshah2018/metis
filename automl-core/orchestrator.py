import optuna
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from search_space import SearchSpace
from trainer import ModelTrainer
from evaluator import Evaluator
import requests
import json


def convert_to_json_serializable(obj):
    """Convert numpy types and other non-serializable types to JSON-compatible types."""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_json_serializable(item) for item in obj]
    elif pd.isna(obj):
        return None
    else:
        return obj


class Orchestrator:
    """Orchestrates classical and quantum search for AutoML."""
    
    def __init__(self, X_train: pd.DataFrame, X_val: pd.DataFrame, X_test: pd.DataFrame,
                 y_train: pd.Series, y_val: pd.Series, y_test: pd.Series,
                 search_space: SearchSpace, metric: str, objective: str,
                 search_budget: int, quantum_sampler_url: Optional[str] = None):
        self.X_train = X_train
        self.X_val = X_val
        self.X_test = X_test
        self.y_train = y_train
        self.y_val = y_val
        self.y_test = y_test
        self.search_space = search_space
        self.metric = metric
        self.objective = objective
        self.search_budget = search_budget
        self.quantum_sampler_url = quantum_sampler_url
        
        self.trainer = ModelTrainer(X_train, X_val, y_train, y_val, search_space.is_classification)
        self.evaluator = Evaluator(self.trainer, metric, objective)
        
        self.best_score = float('-inf') if objective == 'maximize' else float('inf')
        self.best_config = None
        self.best_model = None
        self.best_metrics = None
        self.training_history = []
    
    def run(self) -> Dict[str, Any]:
        """Run the AutoML optimization loop."""
        # Classical optimization with Optuna
        study = optuna.create_study(
            direction='maximize' if self.objective == 'maximize' else 'minimize'
        )
        
        def objective(trial):
            # Sample model name
            model_name = trial.suggest_categorical('model', tuple(self.search_space.model_names))
            
            # Initialize config with empty hyperparameters
            config = {
                'model': model_name,
                'hyperparameters': {},
            }
            
            # Sample hyperparameters with Optuna for the selected model
            model_space = self.search_space.model_spaces[model_name]
            for param, values in model_space.items():
                # Filter out None values for numeric suggestions
                numeric_values = [v for v in values if v is not None and isinstance(v, (int, float))]
                if numeric_values:
                    if isinstance(numeric_values[0], int):
                        config['hyperparameters'][param] = trial.suggest_int(
                            f'{model_name}_{param}', min(numeric_values), max(numeric_values)
                        )
                    else:
                        config['hyperparameters'][param] = trial.suggest_float(
                            f'{model_name}_{param}', min(numeric_values), max(numeric_values)
                        )
                else:
                    # Handle None and string values
                    config['hyperparameters'][param] = trial.suggest_categorical(
                        f'{model_name}_{param}', tuple(values)
                    )
            
            # Sample feature mask
            num_features = trial.suggest_int('num_features', 1, self.search_space.max_features)
            # Randomly select features
            import random
            selected_indices = random.sample(range(self.search_space.num_features), min(num_features, self.search_space.num_features))
            feature_mask = [i in selected_indices for i in range(self.search_space.num_features)]
            config['feature_mask'] = feature_mask
            
            # Evaluate
            try:
                result = self.evaluator.evaluate_config(config)
                score = result['score']
                
                # Track history
                self.training_history.append({
                    'iteration': len(self.training_history) + 1,
                    'score': float(result['metrics']['validation_score']),
                    'config': convert_to_json_serializable(config),
                })
                
                # Update best
                if (self.objective == 'maximize' and score > self.best_score) or \
                   (self.objective == 'minimize' and score < self.best_score):
                    self.best_score = score
                    self.best_config = config
                    self.best_model = result['model']
                    self.best_metrics = result['metrics']
                
                return score
            except Exception as e:
                print(f"Error in trial: {e}")
                return float('-inf') if self.objective == 'maximize' else float('inf')
        
        # Run classical optimization
        classical_budget = int(self.search_budget * 0.7)  # 70% classical
        study.optimize(objective, n_trials=classical_budget)
        
        # Quantum sampling (if available)
        if self.quantum_sampler_url:
            quantum_budget = self.search_budget - classical_budget
            self._run_quantum_sampling(quantum_budget)
        
        # Return results
        if self.best_model is None:
            raise ValueError("No valid model found")
        
        # Evaluate on test set
        from utils.feature_engineering import select_features
        X_test_selected, _ = select_features(
            self.X_test, self.y_test, feature_mask=self.best_config['feature_mask']
        )
        test_score = self.trainer._compute_score(
            self.best_model, X_test_selected, self.y_test, self.metric
        )
        
        # Get selected features
        selected_features = self.search_space.decode_feature_mask(self.best_config['feature_mask'])
        
        # Aggregate feature importance
        all_feature_importance = {}
        for entry in self.training_history:
            if 'feature_importance' in entry.get('config', {}):
                # Aggregate importance from all trials
                pass
        
        # Use best model's feature importance
        feature_importance = self.best_metrics.get('feature_importance', {})
        
        # Convert to JSON-serializable format
        result = {
            'best_model': {
                'name': self.best_config['model'],
                'hyperparameters': convert_to_json_serializable(self.best_config['hyperparameters']),
                'selected_features': selected_features,
            },
            'metrics': {
                'train_score': float(self.best_metrics['train_score']),
                'validation_score': float(self.best_metrics['validation_score']),
                'test_score': float(test_score) if test_score is not None else None,
            },
            'feature_importance': convert_to_json_serializable(feature_importance),
            'training_history': convert_to_json_serializable(self.training_history[:50]),  # Limit to 50 entries
        }
        
        return result
    
    def _run_quantum_sampling(self, budget: int):
        """Query quantum sampler for additional candidates."""
        if not self.quantum_sampler_url:
            return
        
        try:
            # Prepare request
            request_data = {
                'search_space': {
                    'num_features': self.search_space.num_features,
                    'max_features': self.search_space.max_features,
                    'model_names': self.search_space.model_names,
                },
                'current_best_score': self.best_score,
                'num_candidates': min(budget, 10),  # Request up to 10 candidates at a time
            }
            
            # Call quantum sampler
            response = requests.post(
                f"{self.quantum_sampler_url}/generate",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                candidates = response.json().get('candidates', [])
                
                # Evaluate quantum candidates
                for candidate in candidates:
                    try:
                        # Validate candidate
                        if not self.search_space.validate_config(candidate):
                            continue
                        
                        result = self.evaluator.evaluate_config(candidate)
                        score = result['score']
                        
                        # Track history
                        self.training_history.append({
                            'iteration': len(self.training_history) + 1,
                            'score': float(result['metrics']['validation_score']),
                            'config': convert_to_json_serializable(candidate),
                        })
                        
                        # Update best
                        if (self.objective == 'maximize' and score > self.best_score) or \
                           (self.objective == 'minimize' and score < self.best_score):
                            self.best_score = score
                            self.best_config = candidate
                            self.best_model = result['model']
                            self.best_metrics = result['metrics']
                    except Exception as e:
                        print(f"Error evaluating quantum candidate: {e}")
                        continue
        except Exception as e:
            print(f"Error calling quantum sampler: {e}")
            # Continue without quantum sampling

