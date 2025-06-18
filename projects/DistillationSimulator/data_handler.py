# Data handling for the Distillation Simulator

import pandas as pd

def load_data(file_path):
    """
    Loads data from a given file path.
    Supports CSV files for now.
    """
    # TODO: Add support for other file formats (e.g., Excel, JSON)
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Please use CSV.")

def save_data(data, output_path):
    """
    Saves data to a given output path.
    Supports CSV files for now.
    """
    # TODO: Add support for other file formats
    if output_path.endswith('.csv'):
        data.to_csv(output_path, index=False)
    else:
        raise ValueError("Unsupported file format. Please use CSV for saving.")

# TODO: Add data validation functions
# TODO: Add data preprocessing functions
