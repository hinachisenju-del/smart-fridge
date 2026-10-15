"""
Smart List — Smart Restock ML FastAPI Service
Runs on port 8082 to serve restock predictions, cold-start telemetry, and evaluation metrics.
"""

import json
import os
import sys
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(__file__))
from predictor import SmartRestockPredictor, METRICS_FILE

app = FastAPI(
    title="Smart List Restock ML Predictor",
    description="Machine learning depletion and restock urgency service for household inventory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
predictor = SmartRestockPredictor()


class InventoryItemInput(BaseModel):
    id: Optional[int] = None
    productName: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = 'OTHER'
    quantity: Optional[float] = 1.0
    unit: Optional[str] = 'units'
    targetQuantity: Optional[float] = None
    daysSinceRestock: Optional[float] = None
    purchaseCount: Optional[int] = None


class PredictRequest(BaseModel):
    items: List[Dict[str, Any]] = []


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "smart-list-ml",
        "version": "1.0.0",
        "is_trained": predictor.is_trained,
        "uptime_seconds": round(time.time() - START_TIME, 1),
    }


@app.post("/predict")
def predict(payload: PredictRequest):
    try:
        result = predictor.predict_for_inventory(payload.items)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/evaluate")
def evaluate():
    if not os.path.exists(METRICS_FILE):
        return {
            "status": "NOT_EVALUATED",
            "message": "Evaluation metrics not yet computed. Run train_and_evaluate.py to compute.",
        }
    with open(METRICS_FILE, 'r') as f:
        metrics = json.load(f)
    return metrics


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
