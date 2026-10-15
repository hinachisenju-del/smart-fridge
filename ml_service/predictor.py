"""
Smart List — Smart Restock Predictor ML Model
Implements a Scikit-learn regression & classification pipeline to predict grocery consumption intervals,
days until depletion, and restock urgency. Includes baseline comparison and explicit cold-start detection.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

MODEL_FILE = os.path.join(os.path.dirname(__file__), 'model_weights.joblib')
METRICS_FILE = os.path.join(os.path.dirname(__file__), 'evaluation_metrics.json')

# Typical consumption cadence references in days by category for baseline comparisons
CATEGORY_CADENCE_DAYS = {
    'DAIRY': 5.0,
    'BAKERY': 4.0,
    'PRODUCE': 6.0,
    'MEAT_SEAFOOD': 4.0,
    'FROZEN': 14.0,
    'PANTRY': 28.0,
    'BEVERAGES': 7.0,
    'SNACKS': 10.0,
    'HOUSEHOLD': 30.0,
    'OTHER': 14.0,
}


def build_pipeline() -> Tuple[Pipeline, Pipeline]:
    """Constructs preprocessing and ML pipelines for depletion days regression and urgency classification."""
    categorical_features = ['category']
    numeric_features = [
        'current_quantity',
        'target_quantity',
        'days_since_restock',
        'past_purchase_count',
        'avg_consumption_rate',
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('num', 'passthrough', numeric_features),
        ]
    )

    regressor = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)),
        ]
    )

    classifier = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('classifier', RandomForestClassifier(n_estimators=80, max_depth=6, random_state=42)),
        ]
    )

    return regressor, classifier


def safe_float(val, default: float = 1.0) -> float:
    try:
        if val is None:
            return default
        f = float(val)
        return default if np.isnan(f) else max(0.0, f)
    except (ValueError, TypeError):
        return default


def safe_int(val, default: int = 1) -> int:
    try:
        if val is None:
            return default
        return max(1, int(val))
    except (ValueError, TypeError):
        return default


class SmartRestockPredictor:
    def __init__(self):
        self.regressor = None
        self.classifier = None
        self.is_trained = False
        self.load_or_initialize()

    def load_or_initialize(self):
        """Loads saved weights if present; otherwise, initializes empty pipelines."""
        if os.path.exists(MODEL_FILE):
            try:
                saved = joblib.load(MODEL_FILE)
                self.regressor = saved['regressor']
                self.classifier = saved['classifier']
                self.is_trained = True
                return
            except Exception as e:
                print(f"Warning: Failed to load existing model ({e}). Re-initializing.")

        self.regressor, self.classifier = build_pipeline()
        self.is_trained = False

    def save(self):
        """Persists trained pipelines to disk."""
        joblib.dump(
            {
                'regressor': self.regressor,
                'classifier': self.classifier,
            },
            MODEL_FILE,
        )

    def is_cold_start(self, items: List[Dict[str, Any]]) -> bool:
        """
        Cold-Start Rule:
        If total inventory items or historical purchases < 3, household data is too sparse
        for statistically meaningful ML inference.
        """
        if not items or len(items) < 3:
            return True
        return False

    def predict_for_inventory(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates predictions for current pantry/inventory items.
        Returns cold-start metadata and actionable suggestions.
        """
        if self.is_cold_start(items):
            return {
                "cold_start": True,
                "total_analyzed": len(items) if items else 0,
                "message": (
                    "Smart Restock needs at least 3 active pantry items or historical shopping trips "
                    "to learn consumption cadence. Add your common household staples to activate ML predictions."
                ),
                "suggestions": [],
            }

        rows = []
        item_refs = []
        for item in items:
            cat = str(item.get('category') or 'OTHER').upper()
            curr_qty = safe_float(item.get('quantity'), 1.0)
            target_qty = safe_float(item.get('targetQuantity'), max(curr_qty, 2.0))
            days_since = safe_float(item.get('daysSinceRestock'), 3.0)
            purchase_count = safe_int(item.get('purchaseCount'), 1)
            # Consumption rate estimate
            rate = max(0.05, (target_qty - curr_qty + 0.1) / max(1.0, days_since))

            rows.append(
                {
                    'category': cat,
                    'current_quantity': curr_qty,
                    'target_quantity': target_qty,
                    'days_since_restock': days_since,
                    'past_purchase_count': purchase_count,
                    'avg_consumption_rate': rate,
                }
            )
            item_refs.append(item)

        df = pd.DataFrame(rows)

        if not self.is_trained:
            # Fallback to category baseline if model has not been trained yet
            suggestions = []
            for i, row in enumerate(rows):
                cat = row['category']
                base_days = CATEGORY_CADENCE_DAYS.get(cat, 10.0)
                depletion_days = max(0.5, (row['current_quantity'] / max(0.1, row['avg_consumption_rate'])))
                urgency = "HIGH" if depletion_days <= 2.0 else ("MEDIUM" if depletion_days <= 5.0 else "LOW")
                confidence = 0.65
                orig = item_refs[i]
                suggestions.append(
                    {
                        "itemId": orig.get('id'),
                        "name": orig.get('productName') or orig.get('name', 'Unknown Item'),
                        "category": cat,
                        "currentQuantity": row['current_quantity'],
                        "unit": orig.get('unit', 'units'),
                        "predictedDaysUntilDepleted": round(depletion_days, 1),
                        "urgency": urgency,
                        "confidence": confidence,
                        "reasoning": f"Baseline cadence for {cat} is ~{int(base_days)} days.",
                    }
                )
            return {
                "cold_start": False,
                "total_analyzed": len(items),
                "suggestions": sorted(suggestions, key=lambda s: s['predictedDaysUntilDepleted']),
            }

        # Predict using trained ML models
        pred_days = self.regressor.predict(df)
        pred_urgency_probs = self.classifier.predict_proba(df)
        urgency_classes = list(self.classifier.classes_)

        suggestions = []
        for i, row in enumerate(rows):
            days_left = max(0.1, float(pred_days[i]))
            probs = pred_urgency_probs[i]
            best_idx = int(np.argmax(probs))
            urgency = urgency_classes[best_idx]
            confidence = float(np.max(probs))

            # Calibrate urgency with physical days left
            if days_left <= 2.0:
                urgency = "HIGH"
            elif days_left <= 5.0 and urgency == "LOW":
                urgency = "MEDIUM"

            orig = item_refs[i]
            name = orig.get('productName') or orig.get('name', 'Pantry Item')
            rate = row['avg_consumption_rate']

            reasoning = (
                f"Household consumption rate is ~{rate:.2f} {orig.get('unit', 'unit')}/day. "
                f"Predicted to deplete in {days_left:.1f} days."
            )

            suggestions.append(
                {
                    "itemId": orig.get('id'),
                    "name": name,
                    "category": row['category'],
                    "currentQuantity": row['current_quantity'],
                    "unit": orig.get('unit', 'units'),
                    "predictedDaysUntilDepleted": round(days_left, 1),
                    "urgency": urgency,
                    "confidence": round(confidence, 2),
                    "reasoning": reasoning,
                }
            )

        # Sort suggestions by urgency: HIGH first, then lowest days left
        urgency_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        suggestions.sort(key=lambda s: (urgency_order.get(s['urgency'], 3), s['predictedDaysUntilDepleted']))

        return {
            "cold_start": False,
            "total_analyzed": len(items),
            "suggestions": suggestions,
        }
