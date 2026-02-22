"""
Vercel Serverless Function Handler
Wraps FastAPI app with Mangum for serverless
"""
import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from mangum import Mangum
from app.main import app

# Wrap FastAPI app with Mangum for serverless ASGI
handler = Mangum(app, lifespan="off")

