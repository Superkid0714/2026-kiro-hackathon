from fastapi import APIRouter

from main_backend.routes.health import router as health_router
from main_backend.routes.profiles import router as profiles_router
from main_backend.routes.sessions import router as sessions_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(profiles_router)
api_router.include_router(sessions_router)
