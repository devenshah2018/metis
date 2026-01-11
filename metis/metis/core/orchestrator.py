import optuna
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from metis.core.search_space import SearchSpace
from metis.core.trainer import ModelTrainer
from metis.core.evaluator import Evaluator
from metis.quantum.qaoa_sampler import QAOASampler
from metis.exceptions import MetisTrainingError, MetisQuantumError
import logging

logger = logging.getLogger(__name__)


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
                 search_budget: int, use_quantum: bool = True):
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
        self.use_quantum = use_quantum
        
        self.trainer = ModelTrainer(X_train, X_val, y_train, y_val, search_space.is_classification)
        self.evaluator = Evaluator(self.trainer, metric, objective)
        
        self.best_score = float('-inf') if objective == 'maximize' else float('inf')
        self.best_config = None
        self.best_model = None
        self.best_metrics = None
        self.training_history = []
        
        self.quantum_sampler = None
        if use_quantum:
            try:
                self.quantum_sampler = QAOASampler(num_layers=2)
            except Exception as e:
                logger.warning(f"Failed to initialize quantum sampler: {e}. Continuing with classical optimization only.")
                self.use_quantum = False
    
    def run(self) -> Dict[str, Any]:
        """Run the AutoML optimization loop.
        
        Returns:
            Dictionary containing best model, metrics, and training history
        
        Raises:
            MetisTrainingError: If optimization fails
        """
        try:
            study = optuna.create_study(
                direction='maximize' if self.objective == 'maximize' else 'minimize'
            )
            
            def objective(trial):
                model_name = trial.suggest_categorical('model', tuple(self.search_space.model_names))
                
                config = {
                    'model': model_name,
                    'hyperparameters': {},
                }
                
                model_space = self.search_space.model_spaces[model_name]
                for param, values in model_space.items():
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
                        config['hyperparameters'][param] = trial.suggest_categorical(
                                f'{model_name}_{param}', tuple(values)
                        )
                
                num_features = trial.suggest_int('num_features', 1, self.search_space.max_features)
                import random
                selected_indices = random.sample(range(self.search_space.num_features), min(num_features, self.search_space.num_features))
                feature_mask = [i in selected_indices for i in range(self.search_space.num_features)]
                config['feature_mask'] = feature_mask
                
                try:
                    result = self.evaluator.evaluate_config(config)
                    score = result['score']
                    
                    self.training_history.append({
                        'iteration': len(self.training_history) + 1,
                        'score': float(result['metrics']['validation_score']),
                        'config': convert_to_json_serializable(config),
                    })
                    
                    if (self.objective == 'maximize' and score > self.best_score) or \
                       (self.objective == 'minimize' and score < self.best_score):
                        self.best_score = score
                        self.best_config = config
                        self.best_model = result['model']
                        self.best_metrics = result['metrics']
                    
                    return score
                except Exception as e:
                    logger.warning(f"Error in trial: {e}")
                    return float('-inf') if self.objective == 'maximize' else float('inf')
            
            classical_budget = int(self.search_budget * 0.7)
            study.optimize(objective, n_trials=classical_budget)
            
            if self.use_quantum and self.quantum_sampler:
                quantum_budget = self.search_budget - classical_budget
                self._run_quantum_sampling(quantum_budget)
            
            if self.best_model is None:
                raise MetisTrainingError("No valid model found during optimization")
            
            from metis.utils.feature_engineering import select_features
            X_test_selected, _ = select_features(
                self.X_test, self.y_test, feature_mask=self.best_config['feature_mask']
            )
            test_score = self.trainer._compute_score(
                self.best_model, X_test_selected, self.y_test, self.metric
            )
            
            selected_features = self.search_space.decode_feature_mask(self.best_config['feature_mask'])
            
            feature_importance = self.best_metrics.get('feature_importance', {})
            
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
                'training_history': convert_to_json_serializable(self.training_history[:50]),
                'data_splits': {
                    'train': {
                        'samples': len(self.X_train),
                        'features': len(self.X_train.columns),
                        'columns': list(self.X_train.columns)[:20],
                    },
                    'validation': {
                        'samples': len(self.X_val),
                        'features': len(self.X_val.columns),
                        'columns': list(self.X_val.columns)[:20],
                    },
                    'test': {
                        'samples': len(self.X_test),
                        'features': len(self.X_test.columns),
                        'columns': list(self.X_test.columns)[:20],
                    },
                },
            }
            
            return result
        except Exception as e:
            if isinstance(e, MetisTrainingError):
                raise
            raise MetisTrainingError(f"Optimization failed: {str(e)}") from e
    
    def _run_quantum_sampling(self, budget: int):
        """Query quantum sampler for additional candidates."""
        if not self.quantum_sampler:
            return
        
        try:
            request_data = {
                'num_features': self.search_space.num_features,
                'max_features': self.search_space.max_features,
                'model_names': self.search_space.model_names,
            }
            
            candidates = self.quantum_sampler.generate_candidates(
                request_data, 
                num_candidates=min(budget, 10)
            )
            
            for candidate in candidates:
                try:
                    if not self.search_space.validate_config(candidate):
                        continue
                    
                    result = self.evaluator.evaluate_config(candidate)
                    score = result['score']
                    
                    self.training_history.append({
                        'iteration': len(self.training_history) + 1,
                        'score': float(result['metrics']['validation_score']),
                        'config': convert_to_json_serializable(candidate),
                    })
                    
                    if (self.objective == 'maximize' and score > self.best_score) or \
                       (self.objective == 'minimize' and score < self.best_score):
                        self.best_score = score
                        self.best_config = candidate
                        self.best_model = result['model']
                        self.best_metrics = result['metrics']
                except Exception as e:
                    logger.warning(f"Error evaluating quantum candidate: {e}")
                    continue
        except MetisQuantumError as e:
            logger.warning(f"Quantum sampling failed: {e}. Continuing with classical results only.")
        except Exception as e:
            logger.warning(f"Error in quantum sampling: {e}")

