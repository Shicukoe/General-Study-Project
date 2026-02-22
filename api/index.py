import sys
from pathlib import Path

# Add backend to Python path
backend_path = str(Path(__file__).parent.parent / "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from mangum import Mangum
from backend.app.main import app

# Wrap with Mangum for serverless ASGI support
handler = Mangum(app)


