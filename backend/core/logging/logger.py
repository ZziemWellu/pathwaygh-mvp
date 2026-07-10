"""
Unified Logging Service
Structured logging with rotation and monitoring
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
import json
from typing import Dict, Any


class StructuredLogger:
    """Structured logger with JSON support and rotation"""
    
    def __init__(self, name: str = "pathway_ai"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Create logs directory
        Path("logs").mkdir(exist_ok=True)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # File handler with rotation
        log_file = f"logs/pathway_ai_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)
        
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
    
    def info(self, message: str, extra: Dict[str, Any] = None):
        if extra:
            self.logger.info(f"{message} | {json.dumps(extra)}")
        else:
            self.logger.info(message)
    
    def error(self, message: str, extra: Dict[str, Any] = None):
        if extra:
            self.logger.error(f"{message} | {json.dumps(extra)}")
        else:
            self.logger.error(message)
    
    def warning(self, message: str, extra: Dict[str, Any] = None):
        if extra:
            self.logger.warning(f"{message} | {json.dumps(extra)}")
        else:
            self.logger.warning(message)
    
    def debug(self, message: str, extra: Dict[str, Any] = None):
        if extra:
            self.logger.debug(f"{message} | {json.dumps(extra)}")
        else:
            self.logger.debug(message)

# Singleton logger
logger = StructuredLogger()

def get_logger(name: str = "pathway_ai"):
    return StructuredLogger(name)
