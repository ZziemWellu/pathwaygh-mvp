"""
Train Random Forest Classifier for Career Recommendation
Includes SHAP for explainability
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
import shap

def train_model():
    """Train the career recommendation model"""
    
    # Load training data
    df = pd.read_csv('ml/training_data.csv')
    
    # Prepare features
    feature_cols = [col for col in df.columns if col != 'target']
    X = df[feature_cols]
    y = df['target']
    
    # Encode target labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Train Random Forest
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print(f"Cross-validation score: {cross_val_score(model, X_train, y_train, cv=5).mean():.4f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save model and encoder
    joblib.dump(model, 'ml/career_model.pkl')
    joblib.dump(label_encoder, 'ml/label_encoder.pkl')
    
    # Save feature list
    with open('ml/feature_columns.json', 'w') as f:
        json.dump(feature_cols, f)
    
    # Calculate and save SHAP explainer
    print("\nCalculating SHAP values for explainability...")
    background_sample = X_train.sample(n=100, random_state=42)
    explainer = shap.TreeExplainer(model, background_sample)
    
    # Save SHAP explainer (using joblib for TreeExplainer)
    joblib.dump(explainer, 'ml/shap_explainer.pkl')
    
    # Save test sample for demo
    test_sample = X_test.iloc[0].to_dict()
    with open('ml/test_sample.json', 'w') as f:
        json.dump(test_sample, f)
    
    print("\n✅ Model training complete!")
    print(f"Model saved to: ml/career_model.pkl")
    print(f"Label encoder saved to: ml/label_encoder.pkl")
    print(f"SHAP explainer saved to: ml/shap_explainer.pkl")
    
    return model, label_encoder, feature_importance

if __name__ == "__main__":
    train_model()
