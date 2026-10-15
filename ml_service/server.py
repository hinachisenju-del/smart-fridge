import json
import os
from typing import List, Optional, Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
from predictor import RestockPredictor

app = FastAPI(
    title="Smart List Restock ML Service",
    description="Intelligent pantry consumption modeling and replenishment forecasting using scikit-learn",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = RestockPredictor()

class ItemPayload(BaseModel):
    id: Optional[int] = None
    name: str
    category: str = "PANTRY"
    currentQuantity: float = 0.0
    unit: str = "items"
    minimumStockThreshold: float = 1.0
    daysToExpiry: Optional[float] = None
    consumptionHistoryCount: Optional[int] = 0
    daysSinceLastPurchase: Optional[float] = 3.0

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "Smart Restock Predictor ML",
        "modelLoaded": predictor.artifacts is not None,
        "coldStartThreshold": 3
    }

@app.get("/metrics")
def get_metrics():
    metrics_path = os.path.join(os.path.dirname(__file__), 'model_metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Metrics not found")

@app.post("/predict")
def predict_single(item: ItemPayload):
    return predictor.predict(item.dict())

@app.post("/predict/batch")
def predict_batch(items: List[ItemPayload]):
    return [predictor.predict(item.dict()) for item in items]

@app.get("/predict/from-inventory")
def predict_from_inventory():
    """
    Convenience bridge: Queries Spring Boot on port 8081, runs ML predictions,
    and returns prioritized suggestions.
    """
    try:
        req = urllib.request.Request(
            "http://localhost:8081/api/inventory",
            headers={"User-Agent": "SmartList-ML-Agent"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('items', [])
            
            predictions = []
            for it in items:
                # Add default history count if not yet recorded in legacy schema
                it_dict = {
                    'id': it.get('id'),
                    'name': it.get('name'),
                    'category': it.get('category'),
                    'currentQuantity': it.get('quantity', 0.0),
                    'unit': it.get('unit', 'items'),
                    'minimumStockThreshold': it.get('minimumStockThreshold', 1.0),
                    'daysToExpiry': it.get('daysToExpiry'),
                    'consumptionHistoryCount': it.get('consumptionHistoryCount', 0),
                    'daysSinceLastPurchase': it.get('daysSinceLastPurchase', 4.0)
                }
                pred = predictor.predict(it_dict)
                pred['inventoryItemId'] = it.get('id')
                predictions.append(pred)
                
            # Filter to those needing restock
            suggestions = [p for p in predictions if p['urgency'] in ['URGENT', 'HIGH', 'MEDIUM']]
            # Sort by urgency and predicted days
            urgency_rank = {'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
            suggestions.sort(key=lambda s: (urgency_rank.get(s['urgency'], 4), s['predictedDaysUntilDepletion']))
            
            return {
                "source": "Spring Boot Inventory (Port 8081)",
                "totalInventoryEvaluated": len(items),
                "suggestionsCount": len(suggestions),
                "suggestions": suggestions
            }
    except Exception as e:
        return {
            "source": "Fallback / Mock Inventory",
            "error": str(e),
            "suggestions": []
        }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8082)
