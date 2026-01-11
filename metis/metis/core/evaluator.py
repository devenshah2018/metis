from typing import Dict, Any, List
import pandas as pd
from metis.core.trainer import ModelTrainer


class Evaluator:
    """Handles model evaluation and scoring."""
    
    def __init__(self, trainer: ModelTrainer, metric: str, objective: str):
        self.trainer = trainer
        self.metric = metric
        self.objective = objective
    
    def evaluate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a candidate configuration."""
        score, model, metrics = self.trainer.train_and_evaluate(config, self.metric)
        
        if self.objective == 'minimize':
            score = -score
        
        return {
            'score': score,
            'model': model,
            'metrics': metrics,
            'config': config,
        }
    
    def compare_configs(self, configs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare multiple configurations and return the best one."""
        results = []
        for config in configs:
            try:
                result = self.evaluate_config(config)
                results.append(result)
            except Exception as e:
                continue
        
        if not results:
            raise ValueError("No valid configurations evaluated")
        
        best_result = max(results, key=lambda x: x['score'])
        
        return best_result

