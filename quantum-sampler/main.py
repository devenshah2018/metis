from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import logging

from qaoa_sampler import QAOASampler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Quantum-AutoML Sampler")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    search_space: Dict[str, Any]
    current_best_score: Optional[float] = 0.0
    num_candidates: int = 5


class GenerateResponse(BaseModel):
    candidates: List[Dict[str, Any]]


@app.post("/generate", response_model=GenerateResponse)
async def generate_candidates(request: GenerateRequest):
    """Generate candidate configurations using QAOA."""
    try:
        # Validate request
        if 'num_features' not in request.search_space:
            raise ValueError("search_space.num_features is required")
        if request.num_candidates < 1 or request.num_candidates > 50:
            raise ValueError("num_candidates must be between 1 and 50")
        
        num_features = request.search_space['num_features']
        if num_features < 1 or num_features > 100:
            raise ValueError("num_features must be between 1 and 100")
        
        logger.info(f"Generating {request.num_candidates} candidates for {num_features} features")
        
        sampler = QAOASampler(num_layers=2)
        candidates = sampler.generate_candidates(
            request.search_space,
            num_candidates=request.num_candidates
        )
        
        logger.info(f"Generated {len(candidates)} candidates")
        return GenerateResponse(candidates=candidates)
    
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
