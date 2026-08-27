from fastapi import FastAPI

from main_backend.routes.health import router as health_router
from main_backend.routes.sessions import router as sessions_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="RoomPACT Main Backend",
        version="0.1.0",
        description="Main backend skeleton for RoomPACT Campus",
    )
    app.include_router(health_router)
    app.include_router(sessions_router)
    return app


app = create_app()
