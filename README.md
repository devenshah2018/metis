# Quantum-AutoML

This project implements an **end-to-end Quantum-Enhanced AutoML platform**. It integrates classical AutoML pipelines with quantum sampling for candidate generation to improve model search efficiency and performance.

## Architecture

The system consists of four main modules:

- **Frontend** (React + TypeScript + Tailwind) - User interface for dataset upload and results visualization
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

1. Start all services (API Gateway, AutoML Core, Quantum Sampler)
2. Start the frontend development server
3. Upload a dataset (CSV/JSON) through the web interface
4. Configure AutoML parameters (metrics, search budget, objectives)
5. Submit the job and monitor progress
6. View results including best model, metrics, and feature importance

## Project Structure

```
quantum-automl/
├── frontend/           # React frontend
├── api-gateway/        # Go API gateway
├── automl-core/        # Python AutoML core
├── quantum-sampler/     # Python quantum sampler
└── README.md
```

## Development

Each module is independent and communicates via HTTP/JSON. See individual module READMEs for more details.

