# Sample Datasets

This directory contains sample datasets for testing the Quantum-AutoML platform.

## iris_sample.csv

A classification dataset based on the classic Iris dataset:
- **Features**: sepal_length, sepal_width, petal_length, petal_width
- **Target**: target (0, 1, or 2 representing different iris species)
- **Samples**: 150
- **Task Type**: Classification (3 classes)

### Usage

1. Upload `iris_sample.csv` through the frontend
2. Select metric: `accuracy`
3. Set search budget: 20-50 trials
4. Objective: `maximize`
5. Submit and wait for results

The dataset has a clear target column, so the system should automatically detect it as a classification task.

