# METIS

This project integrates classical AutoML pipelines with quantum sampling for candidate generation to improve model search efficiency and performance.

## Architecture

The system consists of four main modules:

- **Frontend** (React + Vite) - User interface for dataset upload and results visualization
- **API Gateway** (Go + Gin) - Request routing and job management
- **AutoML Core** (Python + FastAPI) - Classical AutoML training and orchestration
- **Quantum Sampler** (Python + FastAPI + PennyLane) - Quantum-enhanced candidate generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Go 1.21+
- Python 3.11+
- pip

### Installation

1. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

2. **API Gateway:**
```bash
cd api-gateway
go mod download
go run cmd/main.go
```

3. **AutoML Core:**
```bash
cd automl-core
pip install -r requirements.txt
python main.py
```

4. **Quantum Sampler:**
```bash
cd quantum-sampler
pip install -r requirements.txt
python main.py
```

### Usage

Use the provided scripts to start/stop all services:

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh
```

## Development

Each module is independent and communicates via HTTP/JSON. See individual module READMEs for more details:

- [Frontend README](frontend/README.md)
- [API Gateway README](api-gateway/README.md)
- [AutoML Core README](automl-core/README.md)
- [Quantum Sampler README](quantum-sampler/README.md)

