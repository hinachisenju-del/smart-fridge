"""
Smart List — Synthetic Dataset Generator, Model Training & Baseline Evaluation
Generates 1,000 realistic household consumption events, trains Scikit-learn pipelines,
measures regression and classification metrics vs naive baselines, and persists weights.
"""

import json
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    classification_report,
)
from predictor import build_pipeline, SmartRestockPredictor, MODEL_FILE, METRICS_FILE, CATEGORY_CADENCE_DAYS


def generate_synthetic_household_data(n_samples: int = 1000, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic, reproducible synthetic dataset of grocery consumption patterns.
    """
    np.random.seed(seed)
    categories = list(CATEGORY_CADENCE_DAYS.keys())
    # Weighted by common shopping frequency: Dairy, Produce, Bakery make up most events
    cat_weights = [0.22, 0.18, 0.20, 0.10, 0.05, 0.08, 0.07, 0.05, 0.03, 0.02]

    records = []
    for _ in range(n_samples):
        cat = np.random.choice(categories, p=cat_weights)
        cadence_mean = CATEGORY_CADENCE_DAYS[cat]

        # Target stock usually 1 to 5 units for dairy/bakery, 1 to 10 for pantry
        if cat in ['PANTRY', 'HOUSEHOLD']:
            target_qty = float(np.random.choice([2.0, 3.0, 5.0, 10.0]))
        else:
            target_qty = float(np.random.choice([1.0, 2.0, 3.0, 4.0]))

        # Consumption rate per day
        base_rate = target_qty / cadence_mean
        consumption_rate = max(0.05, float(np.random.normal(base_rate, base_rate * 0.15)))

        # Days since restocked
        days_since = float(np.random.uniform(0.5, cadence_mean * 1.2))
        past_purchases = int(np.random.geometric(p=0.15))

        # Current remaining quantity with noise
        consumed = consumption_rate * days_since
        current_qty = max(0.0, target_qty - consumed)
        # Random fractional top-ups or consumption spikes
        current_qty = round(max(0.0, current_qty + np.random.normal(0, 0.1)), 2)

        # Ground truth days until depleted
        if current_qty <= 0.05:
            days_until_depleted = 0.0
        else:
            true_rate = max(0.08, consumption_rate + np.random.normal(0, 0.02))
            days_until_depleted = max(0.0, current_qty / true_rate)

        days_until_depleted = round(days_until_depleted, 2)

        # Ground truth urgency
        if days_until_depleted <= 2.0:
            urgency = 'HIGH'
        elif days_until_depleted <= 5.0:
            urgency = 'MEDIUM'
        else:
            urgency = 'LOW'

        records.append(
            {
                'category': cat,
                'current_quantity': current_qty,
                'target_quantity': target_qty,
                'days_since_restock': round(days_since, 1),
                'past_purchase_count': past_purchases,
                'avg_consumption_rate': round(consumption_rate, 3),
                'days_until_depleted': days_until_depleted,
                'urgency': urgency,
            }
        )

    return pd.DataFrame(records)


def train_and_evaluate(n_samples: int = 1000):
    print(f"Generating {n_samples} synthetic household grocery events...")
    df = generate_synthetic_household_data(n_samples=n_samples, seed=42)

    feature_cols = [
        'category',
        'current_quantity',
        'target_quantity',
        'days_since_restock',
        'past_purchase_count',
        'avg_consumption_rate',
    ]
    X = df[feature_cols]
    y_reg = df['days_until_depleted']
    y_clf = df['urgency']

    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf, test_size=0.20, random_state=42, stratify=y_clf
    )

    print("Building and training regression and classification pipelines...")
    regressor, classifier = build_pipeline()
    regressor.fit(X_train, y_reg_train)
    classifier.fit(X_train, y_clf_train)

    # Predictions
    pred_reg = regressor.predict(X_test)
    pred_clf = classifier.predict(X_test)

    # 1. Regression Metrics vs Naive Baseline
    mae_model = float(mean_absolute_error(y_reg_test, pred_reg))
    rmse_model = float(np.sqrt(mean_squared_error(y_reg_test, pred_reg)))
    r2 = float(r2_score(y_reg_test, pred_reg))

    # Naive baseline: predict mean days by category
    category_means = y_reg_train.groupby(X_train['category']).mean().to_dict()
    global_mean = float(y_reg_train.mean())
    pred_baseline = X_test['category'].map(lambda c: category_means.get(c, global_mean))

    mae_baseline = float(mean_absolute_error(y_reg_test, pred_baseline))
    rmse_baseline = float(np.sqrt(mean_squared_error(y_reg_test, pred_baseline)))
    improvement = float(((mae_baseline - mae_model) / mae_baseline) * 100)

    # 2. Classification Metrics
    accuracy = float(accuracy_score(y_clf_test, pred_clf))
    clf_report = classification_report(y_clf_test, pred_clf, output_dict=True)

    metrics = {
        'samples_total': n_samples,
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'regression': {
            'mae_model': round(mae_model, 3),
            'rmse_model': round(rmse_model, 3),
            'r2_score': round(r2, 3),
            'mae_naive_baseline': round(mae_baseline, 3),
            'rmse_naive_baseline': round(rmse_baseline, 3),
            'error_reduction_percent': round(improvement, 2),
        },
        'classification': {
            'accuracy': round(accuracy, 3),
            'macro_precision': round(clf_report['macro avg']['precision'], 3),
            'macro_recall': round(clf_report['macro avg']['recall'], 3),
            'macro_f1': round(clf_report['macro avg']['f1-score'], 3),
        },
    }

    # Save model weights and metrics
    predictor = SmartRestockPredictor()
    predictor.regressor = regressor
    predictor.classifier = classifier
    predictor.is_trained = True
    predictor.save()

    with open(METRICS_FILE, 'w') as f:
        json.dump(metrics, f, indent=2)

    print("\n=== Smart Restock ML Evaluation Results ===")
    print(f"Dataset Size:           {n_samples} events (80% Train, 20% Test)")
    print(f"Model MAE:              {mae_model:.3f} days")
    print(f"Naive Baseline MAE:     {mae_baseline:.3f} days")
    print(f"MAE Error Reduction:    {improvement:.1f}% improvement over baseline")
    print(f"Regression R²:          {r2:.3f}")
    print(f"Urgency Accuracy:       {accuracy * 100:.1f}%")
    print(f"Macro F1 Score:         {clf_report['macro avg']['f1-score']:.3f}")
    print(f"Model saved to:         {MODEL_FILE}")
    print(f"Metrics saved to:       {METRICS_FILE}")

    return metrics


if __name__ == '__main__':
    train_and_evaluate(1000)
