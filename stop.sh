#!/bin/bash

# Quantum-AutoML Stop Script
# This script stops all running services

echo "Stopping Quantum-AutoML services..."

# Function to kill process on a port
kill_port() {
    local port=$1
    local service_name=$2
    
    # Find and kill process on the port
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "Stopping $service_name on port $port (PID: $pid)..."
        kill $pid 2>/dev/null
        sleep 1
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            kill -9 $pid 2>/dev/null
        fi
    else
        echo "$service_name on port $port: not running"
    fi
}

# Stop AutoML Core (port 8000)
kill_port 8000 "AutoML Core"

# Stop Quantum Sampler (port 8001)
kill_port 8001 "Quantum Sampler"

# Stop API Gateway (port 8080)
kill_port 8080 "API Gateway"

# Stop Frontend (port 3000)
kill_port 3000 "Frontend"

# Also kill any remaining Python processes related to the project
echo ""
echo "Checking for remaining processes..."

# Kill Python processes running main.py
pkill -f "python.*main.py" 2>/dev/null && echo "Stopped Python main.py processes" || echo "No Python main.py processes found"

# Kill Go processes
pkill -f "go run cmd/main.go" 2>/dev/null && echo "Stopped Go API Gateway processes" || echo "No Go API Gateway processes found"

# Kill npm/vite processes
pkill -f "vite" 2>/dev/null && echo "Stopped Vite processes" || echo "No Vite processes found"

echo ""
echo "All services stopped."

