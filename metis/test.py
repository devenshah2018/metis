import metis
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor

# Test custom model registration
def create_gbm(hyperparameters, is_classification):
    if is_classification:
        return GradientBoostingClassifier(**hyperparameters, random_state=42)
    else:
        return GradientBoostingRegressor(**hyperparameters, random_state=42)

metis.add(
    'gradient_boosting',
    create_gbm,
    {'n_estimators': [50, 100], 'learning_rate': [0.1, 0.3]}
)

print("Registered models:", metis.list_models())

# Test with a small search budget for quick testing
model = metis.fit(
    dataset="iris.csv",
    config={
        "metric": "accuracy",
        "objective": "maximize",
        "search_budget": 10,  # Small for quick testing
        "use_quantum": True,  # Disable quantum for faster testing
    }
)

print("Best model:", model.metadata['model_name'])
print("Hyperparameters:", model.hyperparameters)
print("Score:", model.metrics['validation_score'])