#!/bin/bash

# Quantum-AutoML Start Script
# This script starts all services in separate terminal windows

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Quantum-AutoML services..."

# Function to open a new terminal window and run a command
open_terminal() {
    local dir=$1
    local cmd=$2
    local title=$3
    
    osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/$dir' && $cmd\""
}

# Start AutoML Core
echo "Starting AutoML Core on port 8000..."
open_terminal "automl-core" "source .venv/bin/activate && pip install -q -r requirements.txt && python main.py" "AutoML Core"

# Wait a moment for venv activation
sleep 2

# Start Quantum Sampler
echo "Starting Quantum Sampler on port 8001..."
open_terminal "quantum-sampler" "source .venv/bin/activate && pip install -q -r requirements.txt && python main.py" "Quantum Sampler"

# Wait a moment
sleep 2

# Start API Gateway
echo "Starting API Gateway on port 8080..."
open_terminal "api-gateway" "go mod download && go run cmd/main.go" "API Gateway"

# Wait a moment
sleep 2

# Start Frontend
echo "Starting Frontend on port 3000..."
open_terminal "frontend" "npm install && npm run dev" "Frontend"

echo ""
echo "All services are starting in separate terminal windows."
echo ""
echo "Services:"
echo "  - AutoML Core:      http://localhost:8000"
echo "  - Quantum Sampler:  http://localhost:8001"
echo "  - API Gateway:      http://localhost:8080"
echo "  - Frontend:          http://localhost:3000"
echo ""
echo "Wait a few seconds for all services to start, then open http://localhost:3000 in your browser."

