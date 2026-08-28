from fastapi import APIRouter

from main_backend.routes.auth import router as auth_router
from main_backend.routes.chat import profiles_router as chat_profiles_router
from main_backend.routes.chat import router as chat_router
from main_backend.routes.health import router as health_router
from main_backend.routes.profiles import router as profiles_router
from main_backend.routes.sessions import router as sessions_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(chat_profiles_router)
api_router.include_router(chat_router)
api_router.include_router(sessions_router)
