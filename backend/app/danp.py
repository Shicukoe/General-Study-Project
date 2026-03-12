import numpy as np
EPS = 1e-12

def _validate_square_matrix(T: np.ndarray):
    if T.ndim != 2 or T.shape[0] != T.shape[1]:
        raise ValueError("DANP expects a square total influence matrix")


def _canonicalize_dimension_mapping(dimension_mapping, n: int) -> np.ndarray:
    """
    Convert user mapping into compact ids [0..m-1].
    If no mapping is provided, treat all indicators as one cluster.
    """
    if dimension_mapping is None:
        return np.zeros(n, dtype=int)

    if len(dimension_mapping) != n:
        raise ValueError("dimension_mapping length must match matrix size")

    compact = {}
    next_id = 0
    out = []
    for raw in dimension_mapping:
        idx = int(raw)
        if idx < 0:
            raise ValueError("dimension_mapping values must be non-negative integers")
        if idx not in compact:
            compact[idx] = next_id
            next_id += 1
        out.append(compact[idx])
    return np.array(out, dtype=int)


def build_unweighted_supermatrix(Tc: np.ndarray, dimension_mapping=None):
    """
    Build indicator-level unweighted supermatrix W.

    Step: normalize Tc within each dimension block per row,
    then transpose to get W.
    """
    _validate_square_matrix(Tc)
    n = Tc.shape[0]
    dim_ids = _canonicalize_dimension_mapping(dimension_mapping, n)
    m = int(np.max(dim_ids)) + 1

    Tc_star = np.zeros_like(Tc, dtype=float)
    for i in range(n):
        for dim in range(m):
            cols = np.where(dim_ids == dim)[0]
            block_sum = float(np.sum(Tc[i, cols]))
            if block_sum > EPS:
                Tc_star[i, cols] = Tc[i, cols] / block_sum
            else:
                # Keep stochastic structure even if a block has zero influence.
                Tc_star[i, cols] = 1.0 / len(cols)

    W = Tc_star.T
    return Tc_star, W, dim_ids


def build_dimension_total_influence(Tc: np.ndarray, dim_ids: np.ndarray):
    """
    Aggregate indicator-level total influence Tc into dimension-level matrix T_D
    using block means, then normalize rows to obtain T_D*.
    """
    _validate_square_matrix(Tc)
    m = int(np.max(dim_ids)) + 1
    T_D = np.zeros((m, m), dtype=float)

    for i in range(m):
        rows = np.where(dim_ids == i)[0]
        for j in range(m):
            cols = np.where(dim_ids == j)[0]
            block = Tc[np.ix_(rows, cols)]
            T_D[i, j] = float(np.mean(block))

    v = np.sum(T_D, axis=1)
    if np.any(v <= EPS):
        raise ValueError("Cannot normalize dimension matrix: at least one dimension row-sum is zero")

    T_D_star = T_D / v[:, None]
    return T_D, T_D_star


def build_weighted_supermatrix(W: np.ndarray, T_D_star: np.ndarray, dim_ids: np.ndarray):
    """
    Build weighted supermatrix S by block-wise weighting:
    S_block(i,j) = W_block(i,j) * (T_D*)^T[i,j] = W_block(i,j) * T_D*[j,i]
    """
    _validate_square_matrix(W)
    n = W.shape[0]
    S = np.zeros_like(W, dtype=float)

    for i in range(n):
        for j in range(n):
            S[i, j] = W[i, j] * T_D_star[dim_ids[j], dim_ids[i]]
    return S


def compute_limit_supermatrix(S: np.ndarray, tol: float = 1e-10, max_iter: int = 500):
    """
    Compute limit supermatrix L = lim_{k->inf} S^k using iterative multiplication.
    """
    _validate_square_matrix(S)

    prev = S.copy()
    for step in range(2, max_iter + 1):
        curr = prev @ S
        if np.max(np.abs(curr - prev)) < tol:
            return curr, step
        prev = curr

    return prev, max_iter


def compute_danp_weights(
    Tc: np.ndarray,
    dimension_mapping=None,
    tol: float = 1e-10,
    max_iter: int = 500,
    return_details: bool = False,
):
    """
    Full DANP process:
    1) Build Tc* and unweighted supermatrix W
    2) Build dimension matrix T_D and normalized T_D*
    3) Build weighted supermatrix S
    4) Compute limit supermatrix L = lim S^k
    5) Extract normalized indicator weights

    If return_details=False, returns only weights (backward compatible).
    """
    Tc = np.array(Tc, dtype=float)
    _validate_square_matrix(Tc)

    Tc_star, W, dim_ids = build_unweighted_supermatrix(Tc, dimension_mapping=dimension_mapping)
    T_D, T_D_star = build_dimension_total_influence(Tc, dim_ids)
    S = build_weighted_supermatrix(W, T_D_star, dim_ids)
    L, iterations = compute_limit_supermatrix(S, tol=tol, max_iter=max_iter)

    # In a converged supermatrix, columns become identical. Averaging columns is robust.
    weights = np.mean(L, axis=1)
    weight_sum = float(np.sum(weights))
    if weight_sum <= EPS:
        raise ValueError("Invalid DANP weights: zero-sum result")
    weights = weights / weight_sum

    if not return_details:
        return weights

    return {
        "weights": weights,
        "indicator_normalized_matrix": Tc_star,
        "unweighted_supermatrix": W,
        "dimension_matrix": T_D,
        "normalized_dimension_matrix": T_D_star,
        "weighted_supermatrix": S,
        "limit_matrix": L,
        "dimension_mapping": dim_ids,
        "iterations": iterations,
    }
