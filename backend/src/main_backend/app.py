import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from main_backend.routes.api import api_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="RoomPACT Main Backend",
        version="0.1.0",
        description="Main backend API for RoomPACT Campus",
        servers=[
            {"url": "/api", "description": "Public API behind nginx on EC2"},
            {"url": "http://localhost:8000", "description": "Direct local development"},
        ],
    )
    allowed_origins = [
        origin.strip()
        for origin in os.getenv("ROOMPACT_CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins or ["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    return app


app = create_app()
