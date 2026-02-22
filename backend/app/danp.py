import numpy as np


def normalize_by_row(T: np.ndarray) -> np.ndarray:
    row_sum = np.sum(T, axis=1)
    return T / row_sum[:, None]


def compute_danp_weights(T: np.ndarray, power: int = 50):
    T_norm = normalize_by_row(T)
    W = T_norm.T
    limit = np.linalg.matrix_power(W, power)
    weights = limit[:, 0]
    weights = weights / np.sum(weights)
    return weights
