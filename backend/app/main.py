from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from .dematel import normalize_matrix, total_influence_matrix, prominence_relation, simplify_matrix
from .danp import compute_danp_weights
from .schemas import MatrixInput
from .utils import validate_matrix

app = FastAPI(title="Hospitality Innovation DSS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze")
def analyze(data: MatrixInput):
    try:
        A = np.array(data.matrix)
        validate_matrix(A)

        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        T_simplified = simplify_matrix(T)

        d, r, prominence, relation = prominence_relation(T)
        weights = compute_danp_weights(T)
        
        # Check for NaN or Inf values
        if (np.any(np.isnan(d)) or np.any(np.isinf(d)) or
            np.any(np.isnan(r)) or np.any(np.isinf(r)) or
            np.any(np.isnan(prominence)) or np.any(np.isinf(prominence)) or
            np.any(np.isnan(relation)) or np.any(np.isinf(relation)) or
            np.any(np.isnan(weights)) or np.any(np.isinf(weights))):
            raise ValueError("Calculation resulted in invalid values. Check your input matrix.")

        ranking = sorted(
            zip(data.labels, weights),
            key=lambda x: x[1],
            reverse=True
        )

        return {
            "total_influence_matrix": T.tolist(),
            "simplified_total_influence_matrix": T_simplified.tolist(),
            "d": d.tolist(),
            "r": r.tolist(),
            "prominence": prominence.tolist(),
            "relation": relation.tolist(),
            "weights": weights.tolist(),
            "ranking": ranking
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

from mangum import Mangum

handler = Mangum(app)
