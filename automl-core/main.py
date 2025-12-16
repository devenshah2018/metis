from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import base64
import pandas as pd
import logging
import traceback
from utils.data_loader import load_dataset, preprocess_dataset, split_data

from search_space import SearchSpace
from orchestrator import Orchestrator
import requests

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(title="Quantum-AutoML Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8080")
QUANTUM_SAMPLER_URL = os.getenv("QUANTUM_SAMPLER_URL", "http://localhost:8001")


class ProcessJobRequest(BaseModel):
    job_id: str
    dataset: str
    dataset_format: str
    config: Dict[str, Any]


def update_status(job_id: str, status: str, progress: int, message: str):
    """Update job status in API Gateway."""
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/update-status",
            json={
                "job_id": job_id,
                "status": status,
                "progress": progress,
                "message": message,
            },
            timeout=5
        )
        response.raise_for_status()
        logger.info(f"Updated status for job {job_id}: {status} ({progress}%)")
    except Exception as e:
        logger.error(f"Failed to update status for job {job_id}: {e}")


def complete_job(job_id: str, results: Dict[str, Any]):
    """Complete job and send results to API Gateway."""
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/complete",
            json={
                "job_id": job_id,
                "results": results,
            },
            timeout=5
        )
        response.raise_for_status()
        logger.info(f"Completed job {job_id} successfully")
    except Exception as e:
        logger.error(f"Failed to complete job {job_id}: {e}")


@app.post("/process")
async def process_job(request: ProcessJobRequest):
    """Process an AutoML job."""
    job_id = request.job_id
    logger.info(f"Processing job {job_id}")
    
    try:
        if not request.job_id:
            raise ValueError("job_id is required")
        if not request.dataset:
            raise ValueError("dataset is required")
        if request.dataset_format not in ['csv', 'json']:
            raise ValueError("dataset_format must be 'csv' or 'json'")
        if 'metric' not in request.config:
            raise ValueError("config.metric is required")
        if 'search_budget' not in request.config:
            raise ValueError("config.search_budget is required")
        if 'objective' not in request.config:
            raise ValueError("config.objective is required")
        if request.config['objective'] not in ['maximize', 'minimize']:
            raise ValueError("config.objective must be 'maximize' or 'minimize'")
        
        update_status(job_id, "running", 5, "Loading dataset...")
        
        try:
            df = load_dataset(request.dataset, request.dataset_format)
            logger.info(f"Loaded dataset with shape {df.shape}")
        except Exception as e:
            raise ValueError(f"Failed to load dataset: {str(e)}")
        
        try:
            X, y = preprocess_dataset(df)
            logger.info(f"Preprocessed dataset: {X.shape[1]} features")
        except Exception as e:
            raise ValueError(f"Failed to preprocess dataset: {str(e)}")
        
        if y is None:
            raise ValueError("Target column not found in dataset. Please ensure dataset has a 'target', 'label', 'y', or 'class' column.")
        
        if len(X) < 10:
            raise ValueError("Dataset too small: need at least 10 samples")
        
        is_classification = y.dtype == 'object' or y.dtype.name == 'category' or \
                           (y.dtype in ['int64', 'int32'] and y.nunique() < 20)
        logger.info(f"Task type: {'classification' if is_classification else 'regression'}")
        
        update_status(job_id, "running", 10, "Splitting data...")
        try:
            X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)
            logger.info(f"Data split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
        except Exception as e:
            raise ValueError(f"Failed to split data: {str(e)}")
        
        update_status(job_id, "running", 15, "Building search space...")
        max_features = request.config.get('max_features')
        if max_features and max_features > X.shape[1]:
            max_features = X.shape[1]
            logger.warning(f"max_features adjusted to {max_features}")
        
        search_space = SearchSpace(
            list(X.columns),
            is_classification,
            max_features=max_features
        )
        
        update_status(job_id, "running", 20, "Starting optimization...")
        orchestrator = Orchestrator(
            X_train, X_val, X_test,
            y_train, y_val, y_test,
            search_space,
            request.config['metric'],
            request.config['objective'],
            request.config['search_budget'],
            quantum_sampler_url=QUANTUM_SAMPLER_URL if QUANTUM_SAMPLER_URL else None
        )
        
        update_status(job_id, "running", 30, "Running optimization...")
        try:
            results = orchestrator.run()
            logger.info(f"Optimization completed for job {job_id}")
        except Exception as e:
            logger.error(f"Optimization failed for job {job_id}: {e}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Optimization failed: {str(e)}")
        
        update_status(job_id, "running", 100, "Job completed successfully")
        complete_job(job_id, results)
        
        return {"status": "completed", "job_id": job_id}
    
    except ValueError as e:
        error_message = str(e)
        logger.error(f"Validation error for job {job_id}: {error_message}")
        update_status(job_id, "failed", 0, f"Error: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        error_message = str(e)
        logger.error(f"Unexpected error for job {job_id}: {error_message}")
        logger.error(traceback.format_exc())
        update_status(job_id, "failed", 0, f"Error: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

