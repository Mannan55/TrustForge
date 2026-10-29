"""TrustForge Backend startup helper.
Run: python run.py
Equivalent to: uvicorn main:app --reload --host 127.0.0.1 --port 8000
"""
import uvicorn
from main import app

if __name__ == "__main__":
    from config import settings
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
