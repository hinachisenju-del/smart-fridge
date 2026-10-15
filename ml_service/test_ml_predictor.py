"""
Smart List — Automated Unit Tests for Smart Restock ML Predictor
Tests model inference, cold-start handling, prediction bounds, error handling, and baseline comparison.
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from predictor import SmartRestockPredictor, METRICS_FILE, CATEGORY_CADENCE_DAYS


class TestSmartRestockPredictor(unittest.TestCase):
    def setUp(self):
        self.predictor = SmartRestockPredictor()

    def test_model_is_trained_and_loaded(self):
        self.assertTrue(self.predictor.is_trained, "Model weights should be loaded and is_trained should be True")
        self.assertIsNotNone(self.predictor.regressor)
        self.assertIsNotNone(self.predictor.classifier)

    def test_cold_start_on_empty_inventory(self):
        result = self.predictor.predict_for_inventory([])
        self.assertTrue(result['cold_start'])
        self.assertEqual(result['total_analyzed'], 0)
        self.assertEqual(len(result['suggestions']), 0)
        self.assertIn("at least 3 active pantry items", result['message'])

    def test_cold_start_on_sparse_inventory(self):
        sparse_items = [
            {"id": 1, "productName": "Milk", "category": "DAIRY", "quantity": 1.0},
            {"id": 2, "productName": "Eggs", "category": "DAIRY", "quantity": 6.0},
        ]
        result = self.predictor.predict_for_inventory(sparse_items)
        self.assertTrue(result['cold_start'])
        self.assertEqual(result['total_analyzed'], 2)
        self.assertEqual(len(result['suggestions']), 0)

    def test_predictions_for_active_inventory(self):
        active_items = [
            {"id": 10, "productName": "Whole Milk", "category": "DAIRY", "quantity": 0.3, "unit": "L", "targetQuantity": 2.0, "daysSinceRestock": 4.0},
            {"id": 11, "productName": "Sourdough Bread", "category": "BAKERY", "quantity": 0.2, "unit": "loaf", "targetQuantity": 1.0, "daysSinceRestock": 3.0},
            {"id": 12, "productName": "Bananas", "category": "PRODUCE", "quantity": 1.0, "unit": "kg", "targetQuantity": 2.0, "daysSinceRestock": 5.0},
            {"id": 13, "productName": "Basmati Rice", "category": "PANTRY", "quantity": 4.5, "unit": "kg", "targetQuantity": 5.0, "daysSinceRestock": 2.0},
        ]
        result = self.predictor.predict_for_inventory(active_items)
        self.assertFalse(result['cold_start'])
        self.assertEqual(result['total_analyzed'], 4)
        suggestions = result['suggestions']
        self.assertEqual(len(suggestions), 4)

        for s in suggestions:
            self.assertIn('name', s)
            self.assertIn('category', s)
            self.assertIn('urgency', s)
            self.assertIn(s['urgency'], ['HIGH', 'MEDIUM', 'LOW'])
            self.assertGreaterEqual(s['predictedDaysUntilDepleted'], 0.0)
            self.assertGreaterEqual(s['confidence'], 0.0)
            self.assertLessEqual(s['confidence'], 1.0)
            self.assertTrue(len(s['reasoning']) > 0)

        # Depleted whole milk (0.3L left after 4 days) should have high urgency or lower days
        milk_sug = next(s for s in suggestions if s['itemId'] == 10)
        self.assertLessEqual(milk_sug['predictedDaysUntilDepleted'], 3.0)

    def test_baseline_superiority(self):
        self.assertTrue(os.path.exists(METRICS_FILE), "Metrics file should exist")
        with open(METRICS_FILE, 'r') as f:
            metrics = json.load(f)

        mae_model = metrics['regression']['mae_model']
        mae_baseline = metrics['regression']['mae_naive_baseline']
        improvement = metrics['regression']['error_reduction_percent']

        self.assertLess(mae_model, mae_baseline, "Trained model MAE must be lower than naive baseline MAE")
        self.assertGreater(improvement, 50.0, "Model should achieve substantial improvement over naive baseline")

    def test_missing_or_corrupt_fields_handled_gracefully(self):
        messy_items = [
            {"id": 100},  # all optional missing
            {"productName": None, "category": "UNKNOWN_CAT", "quantity": "invalid"},
            {"name": "Apples", "quantity": -5.0},  # negative qty
        ]
        # Should not raise exception
        result = self.predictor.predict_for_inventory(messy_items)
        self.assertFalse(result['cold_start'])
        self.assertEqual(len(result['suggestions']), 3)


if __name__ == '__main__':
    unittest.main()
