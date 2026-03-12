import numpy as np


def validate_matrix(A: np.ndarray):
    if A.shape[0] != A.shape[1]:
        raise ValueError("Matrix must be square")

    if np.any(~np.isfinite(A)):
        raise ValueError("Matrix contains invalid numeric values.")

    if np.any(A < 0) or np.any(A > 4):
        raise ValueError("All matrix values must be within the 0-4 impact scale.")

    if np.any(np.diag(A) != 0):
        raise ValueError("Diagonal values must be 0.")
    
    # Check if matrix is all zeros
    if np.allclose(A, 0):
        raise ValueError("Matrix cannot be all zeros. Please enter some values.")
    
    # Check if any row sum and column sum are all zero
    row_sum = np.sum(A, axis=1)
    col_sum = np.sum(A, axis=0)
    
    if np.any(row_sum == 0) or np.any(col_sum == 0):
        raise ValueError("All rows and columns must have at least one non-zero value.")