# Utility functions for the Distillation Simulator

import logging

def setup_logger(log_level=logging.INFO):
    """
    Sets up a basic logger.
    """
    logging.basicConfig(level=log_level,
                        format='%(asctime)s - %(levelname)s - %(message)s')
    return logging.getLogger(__name__)

def validate_positive_number(value, name="parameter"):
    """
    Validates if a value is a positive number.
    Raises ValueError if not.
    """
    if not isinstance(value, (int, float)):
        raise TypeError(f"{name} must be a number.")
    if value <= 0:
        raise ValueError(f"{name} must be positive.")

# TODO: Add more utility functions as needed (e.g., unit conversions, plotting)
