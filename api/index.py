import sys
import os
from pathlib import Path

# Add backend to Python path
backend_path = str(Path(__file__).parent.parent / "backend")
sys.path.insert(0, backend_path)

# Import and expose FastAPI app directly
from app.main import app

# Vercel Python runtime will auto-detect this as ASGI app


