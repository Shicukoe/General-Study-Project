from pydantic import BaseModel
from typing import List, Optional


class MatrixInput(BaseModel):
    matrix: List[List[float]]
    labels: List[str]
    # Optional cluster id for each indicator, e.g. [0, 0, 1, 1, 2, 2, 3, 3]
    dimension_mapping: Optional[List[int]] = None


class GapAnalysisInput(BaseModel):
    labels: List[str]
    prominence: List[float]
    relation: List[float]
    mode: str  # "4x4" | "8x8"


class InterpretDanpInput(BaseModel):
    ranking: List[List]   # [[label, weight], ...] sorted descending
    labels: List[str]
    model: Optional[str] = None   # override Ollama model name
