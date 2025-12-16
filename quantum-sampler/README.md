# Quantum Sampler

Python service that generates candidate configurations using Quantum Approximate Optimization Algorithm (QAOA) with PennyLane.

## Tech Stack

- **Python 3.11+** - Runtime
- **FastAPI** - Web framework
- **PennyLane** - Quantum computing framework
- **numpy** - Numerical operations
- **scipy** - Scientific computing

## Features

- QUBO encoding of search space
- QAOA-based candidate generation
- Search space to qubit mapping
- Candidate decoding to classical configurations
- Diverse candidate sampling

## Setup

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Note:** PennyLane requires `numpy<1.24` for version 0.32.0, but we use `pennylane>=0.35.0` which supports newer numpy versions.

## Running

```bash
source .venv/bin/activate
python main.py
```

The service will start on `http://localhost:8001` (configurable via `PORT` environment variable).

## API Endpoints

### `POST /generate`

Generate candidate configurations using QAOA.

**Request Body:**
```json
{
  "search_space": {
    "num_features": 10,
    "max_features": 5,
    "model_names": ["random_forest", "xgboost", "svm"]
  },
  "current_best_score": 0.85,
  "num_candidates": 5
}
```

**Response:**
```json
{
  "candidates": [
    {
      "feature_mask": [true, false, true, ...],
      "model": "random_forest",
      "hyperparameters": {
        "n_estimators": 100,
        "max_depth": 10
      }
    },
    ...
  ]
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 8001)

## Project Structure

```
quantum-sampler/
├── main.py                    # FastAPI server
├── qaoa_sampler.py           # QAOA implementation
└── utils/
    ├── encoding.py           # Search space to QUBO encoding
    ├── decoding.py           # Qubit states to configs
    └── cost_function.py      # Cost function construction
```

## How It Works

1. **Encoding**: Convert search space constraints to QUBO (Quadratic Unconstrained Binary Optimization) format
2. **QAOA Circuit**: Create quantum circuit with cost and mixer Hamiltonians
3. **Sampling**: Generate quantum samples from the circuit
4. **Decoding**: Convert qubit states back to candidate configurations
5. **Return**: Send diverse candidates to AutoML Core for evaluation

## QAOA Parameters

- **num_layers**: Number of QAOA layers (default: 2)
  - More layers = better approximation but slower
  - Can be adjusted in `QAOASampler` initialization

## Limitations

- Currently uses PennyLane's default.qubit simulator
- For real quantum hardware, configure PennyLane with appropriate device
- Large search spaces (>20 features) may require circuit optimization

## Testing

```bash
pytest tests/
```

