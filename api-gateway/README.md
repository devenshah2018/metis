# API Gateway

Go-based API gateway that routes requests, manages jobs, and coordinates communication between the frontend, AutoML Core, and Quantum Sampler.

## Tech Stack

- **Go 1.21+** - Runtime
- **Gin** - Web framework
- **UUID** - Job ID generation

## Features

- Request validation and routing
- Async job queue management
- Communication with AutoML Core
- CORS support for frontend
- Health check endpoint
- Error handling and logging

## Setup

### Prerequisites

- Go 1.21+

### Installation

```bash
# Download dependencies
go mod download

# Or use go mod tidy to update
go mod tidy
```

## Running

```bash
go run cmd/main.go
```

The service will start on `http://localhost:8080` (configurable via `PORT` environment variable).

## API Endpoints

### `POST /submit`

Submit a new AutoML job.

**Request:** `multipart/form-data`
- `dataset` (file) - CSV or JSON dataset file
- `dataset_format` (string) - "csv" or "json"
- `config` (string) - JSON string with AutoML configuration

**Response:**
```json
{
  "job_id": "uuid-string"
}
```

### `GET /status/{job_id}`

Get job status.

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "pending" | "running" | "completed" | "failed",
  "progress": 50,
  "message": "Processing..."
}
```

### `GET /results/{job_id}`

Get job results (only when status is "completed").

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "best_model": {
    "name": "random_forest",
    "hyperparameters": {...},
    "selected_features": ["feature1", "feature2"]
  },
  "metrics": {
    "train_score": 0.95,
    "validation_score": 0.92,
    "test_score": 0.91
  },
  "feature_importance": {...},
  "training_history": [...]
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

### Internal Endpoints (for AutoML Core)

- `POST /update-status` - Update job status
- `POST /complete` - Complete job with results

## Configuration

Environment variables:

- `PORT` - Server port (default: 8080)
- `AUTOML_CORE_URL` - AutoML Core service URL (default: http://localhost:8000)

## Project Structure

```
api-gateway/
├── cmd/
│   └── main.go              # Entry point
├── internal/
│   ├── handlers/
│   │   ├── job_handler.go   # Job endpoints
│   │   └── health_handler.go # Health check
│   ├── routes/
│   │   └── routes.go        # Route setup
│   ├── middleware/
│   │   ├── cors.go          # CORS middleware
│   │   ├── logger.go        # Request logging
│   │   └── error_handler.go # Error handling
│   ├── models/
│   │   └── job.go           # Job data structures
│   ├── queue/
│   │   └── job_queue.go     # In-memory job queue
│   └── client/
│       └── automl_client.go # AutoML Core HTTP client
└── go.mod
```

## Job Queue

Currently uses an in-memory job queue. For production, consider:
- Redis for distributed job queue
- Database for job persistence
- Message queue (RabbitMQ, Kafka) for async processing

## Testing

```bash
go test ./...
```

## Building

```bash
go build -o api-gateway cmd/main.go
```

