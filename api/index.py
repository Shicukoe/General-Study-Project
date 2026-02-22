import sys
import os
from pathlib import Path

# Add backend to Python path
path = Path(__file__).parent.parent
sys.path.append(str(path))

from backend.app.main import app
app = app


