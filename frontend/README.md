# Frontend - Quantum-AutoML

React + TypeScript frontend for the Quantum-AutoML platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Recharts** - Data visualization

## Features

- Dataset upload (CSV/JSON) with drag-and-drop
- AutoML configuration (metrics, search budget, objectives)
- Real-time job status polling
- Results dashboard with:
  - Best model information
  - Performance metrics
  - Feature importance visualization
  - Training history charts

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── DatasetUploadForm.tsx    # File upload component
│   │   ├── AutoMLConfigForm.tsx     # Configuration form
│   │   └── ResultsDashboard.tsx      # Results visualization
│   ├── services/
│   │   └── api.ts                    # API client
│   ├── hooks/
│   │   └── useJobPolling.ts          # Job status polling hook
│   ├── App.tsx                       # Main application
│   └── main.tsx                      # Entry point
├── package.json
└── vite.config.ts
```

## API Integration

The frontend communicates with the API Gateway at `http://localhost:8080` (configurable via `VITE_API_URL` environment variable).

### Endpoints Used

- `POST /submit` - Submit a new AutoML job
- `GET /status/{job_id}` - Get job status
- `GET /results/{job_id}` - Get job results

## Configuration

Set the API Gateway URL via environment variable:

```bash
VITE_API_URL=http://localhost:8080 npm run dev
```

Or create a `.env` file:

```
VITE_API_URL=http://localhost:8080
```

## Usage

1. Start the API Gateway, AutoML Core, and Quantum Sampler services
2. Start the frontend: `npm run dev`
3. Open `http://localhost:3000` in your browser
4. Upload a dataset (CSV or JSON format)
5. Configure AutoML parameters
6. Submit the job and monitor progress
7. View results when complete

