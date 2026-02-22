"""
Vercel Serverless Function Handler
Wraps FastAPI app with Mangum for AWS Lambda/Vercel compatibility
"""
import sys
import os
from pathlib import Path

# Get project root and add backend to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / 'backend'))

try:
    from mangum import Mangum
    from app.main import app
    
    # Wrap FastAPI app with Mangum for serverless ASGI
    handler = Mangum(app, lifespan="off")
except ImportError as e:
    print(f"Import error: {e}")
    raise

