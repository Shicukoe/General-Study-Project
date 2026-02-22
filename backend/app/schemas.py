from pydantic import BaseModel
from typing import List


class MatrixInput(BaseModel):
    matrix: List[List[float]]
    labels: List[str]
