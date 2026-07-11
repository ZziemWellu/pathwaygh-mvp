"""
Logging Configuration
"""

import logging
import sys
from datetime import datetime
import os

def setup_logging():
    """Setup logging"""
    os.makedirs("logs", exist_ok=True)
    
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(f'logs/pathway_{datetime.now().strftime("%Y%m%d")}.log')
        ]
    )
    
    return logging.getLogger(__name__)

def get_logger(name: str):
    """Get logger instance"""
    return logging.getLogger(name)
