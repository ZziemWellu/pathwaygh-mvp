"""
Centralized path configuration for PathwayGH
Ensures all file paths work in both development and production
"""

from pathlib import Path
import os

# Project root (backend directory)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Data directories
DATA_DIR = PROJECT_ROOT / "data"
UNIVERSITY_DIR = DATA_DIR / "universities"
PROGRAMS_DIR = DATA_DIR / "programs"
EMPLOYMENT_DIR = DATA_DIR / "employment"
WASSCE_DIR = DATA_DIR / "wassce"

# ML directories
ML_DIR = PROJECT_ROOT / "ml"

# Model paths
MODEL_PATH = ML_DIR / "career_model.pkl"
LABEL_ENCODER_PATH = ML_DIR / "label_encoder.pkl"
FEATURES_PATH = ML_DIR / "feature_columns.json"
SHAP_EXPLAINER_PATH = ML_DIR / "shap_explainer.pkl"

# Data file paths
SOURCES_FILE = DATA_DIR / "sources.json"
ADMISSION_CUTOFFS = DATA_DIR / "admission_cutoffs.csv"
WASSCE_GRADING = WASSCE_DIR / "grading_system.json"
JOB_MARKET_FILE = EMPLOYMENT_DIR / "job_market.json"
PROGRAM_REQUIREMENTS = PROGRAMS_DIR / "complete_requirements.json"

# Ensure all directories exist
def ensure_directories():
    """Create all necessary directories if they don't exist"""
    directories = [
        DATA_DIR, UNIVERSITY_DIR, PROGRAMS_DIR, 
        EMPLOYMENT_DIR, WASSCE_DIR, ML_DIR
    ]
    for d in directories:
        d.mkdir(parents=True, exist_ok=True)

# Function to get file path with fallback
def get_file_path(file_path: Path, fallback_description: str = ""):
    """Get file path and raise helpful error if missing"""
    if not file_path.exists():
        raise FileNotFoundError(
            f"Required file not found: {file_path}\n"
            f"Please ensure {fallback_description or file_path.name} exists in the correct location."
        )
    return file_path

ensure_directories()
