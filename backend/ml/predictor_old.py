"""
ML Career Predictor with GPT Enhancement
Random Forest + GPT-4o-mini for personalized guidance
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from typing import Dict, List, Optional

class CareerPredictor:
    def __init__(self):
        # Load model if exists, otherwise train
        model_path = 'ml/career_model.pkl'
        encoder_path = 'ml/label_encoder.pkl'
        features_path = 'ml/feature_columns.json'
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.label_encoder = joblib.load(encoder_path)
            with open(features_path, 'r') as f:
                self.feature_columns = json.load(f)
            print(f"✅ Model loaded from {model_path}")
        else:
            print("⚠️ Model not found. Training new model...")
            from train_model import train_model
            train_model()
            self.model = joblib.load(model_path)
            self.label_encoder = joblib.load(encoder_path)
            with open(features_path, 'r') as f:
                self.feature_columns = json.load(f)
        
        # Career metadata for recommendations
        self.career_metadata = self._load_metadata()
        
        # Try to load GPT enhancer
        try:
            from gpt_enhancer import gpt_enhancer
            self.gpt = gpt_enhancer
        except:
            self.gpt = None
    
    def _load_metadata(self):
        return {
            'Medical Doctor': {
                'universities': ['University of Ghana', 'KNUST', 'UHAS'],
                'salary_range': 'GH₵5,000-15,000',
                'duration_years': 10,
                'typical_aggregate': 12
            },
            'Software Engineer': {
                'universities': ['University of Ghana', 'KNUST', 'Ashesi'],
                'salary_range': 'GH₵3,000-12,000',
                'duration_years': 4,
                'typical_aggregate': 18
            },
            'Civil Engineer': {
                'universities': ['KNUST', 'University of Ghana'],
                'salary_range': 'GH₵4,000-12,000',
                'duration_years': 5,
                'typical_aggregate': 16
            },
            'Lawyer': {
                'universities': ['University of Ghana', 'KNUST', 'Central'],
                'salary_range': 'GH₵5,000-20,000',
                'duration_years': 7,
                'typical_aggregate': 12
            },
            'Accountant': {
                'universities': ['University of Ghana', 'UPSA', 'KNUST'],
                'salary_range': 'GH₵3,000-15,000',
                'duration_years': 4,
                'typical_aggregate': 16
            },
            'Nurse': {
                'universities': ['University of Ghana', 'UHAS', 'UCC'],
                'salary_range': 'GH₵2,500-8,000',
                'duration_years': 4,
                'typical_aggregate': 18
            },
            'Pharmacist': {
                'universities': ['KNUST', 'University of Ghana', 'UCC'],
                'salary_range': 'GH₵4,000-10,000',
                'duration_years': 6,
                'typical_aggregate': 15
            },
            'Teacher': {
                'universities': ['UEW', 'UCC', 'University of Ghana'],
                'salary_range': 'GH₵1,500-5,000',
                'duration_years': 4,
                'typical_aggregate': 24
            }
        }
    
    def predict(self, aggregate: int, subject_scores: Dict, interest_scores: Dict) -> Dict:
        """Predict top 3 careers with confidence scores"""
        
        # Build feature vector
        features = {'aggregate': aggregate}
        for subj in ['biology', 'chemistry', 'physics', 'math', 'english',
                     'government', 'literature', 'accounting', 'business_management',
                     'art', 'agriculture', 'ict']:
            features[f'score_{subj}'] = subject_scores.get(subj, 50)
        
        for interest in ['healthcare', 'technology', 'business', 'creative',
                        'engineering', 'law', 'education', 'agriculture']:
            features[f'interest_{interest}'] = interest_scores.get(interest, 5)
        
        # Create feature vector in correct order
        X = np.array([[features.get(col, 0) for col in self.feature_columns]])
        
        # Get probabilities
        probs = self.model.predict_proba(X)[0]
        top_indices = np.argsort(probs)[-3:][::-1]
        
        predictions = []
        for idx in top_indices:
            career = self.label_encoder.inverse_transform([idx])[0]
            metadata = self.career_metadata.get(career, {})
            predictions.append({
                'career': career,
                'confidence': round(probs[idx] * 100, 1),
                'field': metadata.get('field', 'N/A'),
                'universities': metadata.get('universities', ['UG', 'KNUST']),
                'salary_range': metadata.get('salary_range', 'Varies'),
                'duration_years': metadata.get('duration_years', 4),
                'typical_aggregate': metadata.get('typical_aggregate', 18)
            })
        
        # Add GPT enhancement for top career
        gpt_guidance = None
        if self.gpt and predictions:
            gpt_guidance = self.gpt.generate_personalized_guidance(
                student_aggregate=aggregate,
                student_interests=list(interest_scores.keys()),
                student_subjects=list(subject_scores.keys()),
                top_career=predictions[0]
            )
        
        return {
            'predictions': predictions,
            'gpt_guidance': gpt_guidance,
            'aggregate': aggregate
        }

predictor = CareerPredictor()
