from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from main_backend.services.auth_service import AuthServiceError, auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class KakaoExchangeRequest(BaseModel):
    code: str = Field(min_length=1)


@router.post("/kakao/exchange")
def exchange_kakao_code(payload: KakaoExchangeRequest) -> dict[str, object]:
    try:
        result = auth_service.exchange_kakao_code(payload.code)
    except AuthServiceError as exc:
        if exc.code in {"code_required", "authorization_required"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
        if exc.code in {"kakao_config_missing", "jwt_secret_missing"}:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=exc.code,
            ) from exc
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.code) from exc

    return {"status": "ok", **result}


@router.get("/me")
def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, object]:
    try:
        user = auth_service.get_current_user(authorization)
    except AuthServiceError as exc:
        if exc.code in {"authorization_required", "invalid_access_token", "access_token_expired"}:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.code) from exc
        if exc.code == "user_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.code) from exc
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=exc.code) from exc

    return {"status": "ok", "user": user}
