"""
EVT-CLIP FastAPI Application Entry Point
Production-ready server with auto-reload for development.
"""
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.routes import app

if __name__ == "__main__":
    import uvicorn

    # Configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))
    reload = os.getenv('RELOAD', 'false').lower() == 'true'
    workers = int(os.getenv('WORKERS', '1'))

    print(f"[SERVER] Starting EVT-CLIP API on {host}:{port}")
    print(f"[SERVER] Workers: {workers}, Reload: {reload}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers if not reload else 1
    )
