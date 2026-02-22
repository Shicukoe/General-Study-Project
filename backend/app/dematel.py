import numpy as np


def normalize_matrix(A: np.ndarray) -> np.ndarray:
    row_sum = np.max(np.sum(A, axis=1))
    col_sum = np.max(np.sum(A, axis=0))
    
    if row_sum == 0 or col_sum == 0:
        raise ValueError("Cannot normalize: matrix has zero sums")
    
    s = 1 / max(row_sum, col_sum)
    D = s * A
    
    if np.any(np.isnan(D)) or np.any(np.isinf(D)):
        raise ValueError("Normalization resulted in invalid values")
    
    return D


def total_influence_matrix(D: np.ndarray) -> np.ndarray:
    I = np.eye(D.shape[0])
    return D @ np.linalg.inv(I - D)


def simplify_matrix(T: np.ndarray) -> np.ndarray:
    alpha = np.mean(T)
    Ts = np.where(T >= alpha, T, 0.0)
    # Zero diagonal entries that are below alpha (they were already zeroed above);
    # entries >= alpha on diagonal are intentionally kept (per paper convention)
    return Ts


def prominence_relation(T: np.ndarray):
    d = np.sum(T, axis=1)
    r = np.sum(T, axis=0)
    prominence = d + r
    relation = d - r
    return d, r, prominence, relation
