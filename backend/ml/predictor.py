"""
ML Career Predictor with Graceful Loading
API stays up even if model fails to load
"""

import numpy as np
import joblib
import json
import os
from src.path_config import MODEL_PATH, LABEL_ENCODER_PATH, FEATURES_PATH
import logging

logger = logging.getLogger(__name__)

class CareerPredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.is_loaded = False
        self.load_error = None
        
        try:
            self._load_model()
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load ML model: {e}")
            print(f"⚠️ ML Model not loaded: {e}")
            print("   API will still run but /api/ml/recommend will return 503")
    
    def _load_model(self):
        """Load model with error handling"""
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        
        self.model = joblib.load(MODEL_PATH)
        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)
        
        with open(FEATURES_PATH, 'r') as f:
            self.feature_columns = json.load(f)
        
        self.is_loaded = True
        print(f"✅ Model loaded from {MODEL_PATH}")
    
    def predict(self, aggregate: int, subject_scores: dict, interest_scores: dict):
        """Predict with graceful failure"""
        if not self.is_loaded:
            return {
                "error": "ML model not available",
                "message": self.load_error or "Model failed to load",
                "predictions": []
            }
        
        # ... rest of prediction logic ...
        return {"predictions": []}

predictor = CareerPredictor()
