from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from main_backend.services.storage import get_storage_backend


class AuthServiceError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class AuthService:
    token_ttl_days = 7

    def build_login_state(self) -> str:
        return secrets.token_urlsafe(24)

    def get_kakao_authorize_url(self) -> str:
        client_id = os.getenv("KAKAO_REST_API_KEY", "").strip()
        redirect_uri = os.getenv("KAKAO_REDIRECT_URI", "").strip()
        if not client_id or not redirect_uri:
            raise AuthServiceError("kakao_config_missing")
        query = urlencode(
            {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
            }
        )
        return f"https://kauth.kakao.com/oauth/authorize?{query}"

    def exchange_kakao_code(self, code: str) -> dict[str, Any]:
        if not code.strip():
            raise AuthServiceError("code_required")

        token_response = self._request_kakao_token(code.strip())
        access_token = token_response.get("access_token")
        if not access_token:
            raise AuthServiceError("kakao_access_token_missing")

        kakao_user = self._request_kakao_user(access_token)
        user = self._upsert_kakao_user(kakao_user)
        service_token = self._issue_service_token(user["user_id"])

        return {
            "access_token": service_token,
            "token_type": "Bearer",
            "expires_in": int(timedelta(days=self.token_ttl_days).total_seconds()),
            "user": self._serialize_user(user),
            "next_step": "complete-profile" if user.get("profile_id") is None else "enter-service",
        }

    def get_current_user(self, authorization: str | None) -> dict[str, Any]:
        token = self._extract_bearer_token(authorization)
        payload = self._verify_service_token(token)
        user = get_storage_backend().get_user(payload["sub"])
        if user is None:
            raise AuthServiceError("user_not_found")
        return self._serialize_user(user)

    def ensure_profile_not_linked(self, authorization: str | None) -> None:
        if not authorization:
            return
        token = self._extract_bearer_token(authorization)
        payload = self._verify_service_token(token)
        user = get_storage_backend().get_user(payload["sub"])
        if user is None:
            raise AuthServiceError("user_not_found")
        if user.get("profile_id"):
            raise AuthServiceError("profile_already_linked")

    def link_profile(self, authorization: str | None, profile_id: str) -> None:
        if not authorization:
            return
        try:
            token = self._extract_bearer_token(authorization)
            payload = self._verify_service_token(token)
        except AuthServiceError:
            return
        get_storage_backend().link_user_profile(payload["sub"], profile_id)

    def _request_kakao_token(self, code: str) -> dict[str, Any]:
        client_id = os.getenv("KAKAO_REST_API_KEY", "").strip()
        client_secret = os.getenv("KAKAO_CLIENT_SECRET", "").strip()
        redirect_uri = os.getenv("KAKAO_REDIRECT_URI", "").strip()
        if not client_id or not redirect_uri:
            raise AuthServiceError("kakao_config_missing")

        payload = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "code": code,
        }
        if client_secret:
            payload["client_secret"] = client_secret

        return self._request_json(
            Request(
                "https://kauth.kakao.com/oauth/token",
                data=urlencode(payload).encode("utf-8"),
                headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
                method="POST",
            ),
            "kakao_token_request_failed",
        )

    def _request_kakao_user(self, access_token: str) -> dict[str, Any]:
        return self._request_json(
            Request(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"},
                method="GET",
            ),
            "kakao_user_request_failed",
        )

    def _request_json(self, request: Request, error_code: str) -> dict[str, Any]:
        try:
            with urlopen(request, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise AuthServiceError(error_code) from exc

    def _upsert_kakao_user(self, kakao_user: dict[str, Any]) -> dict[str, Any]:
        provider_user_id = str(kakao_user.get("id", "")).strip()
        if not provider_user_id:
            raise AuthServiceError("kakao_user_id_missing")

        account = kakao_user.get("kakao_account", {}) or {}
        profile = account.get("profile", {}) or {}
        nickname = (
            profile.get("nickname")
            or kakao_user.get("properties", {}).get("nickname")
            or f"카카오회원-{provider_user_id[-4:]}"
        )
        now = datetime.now(UTC).isoformat()
        storage = get_storage_backend()
        existing = storage.get_user_by_provider("kakao", provider_user_id)

        user = {
            "user_id": existing["user_id"] if existing else f"user-{uuid4().hex[:10]}",
            "provider": "kakao",
            "provider_user_id": provider_user_id,
            "nickname": nickname,
            "email": account.get("email"),
            "profile_image_url": profile.get("profile_image_url"),
            "profile_id": existing.get("profile_id") if existing else None,
            "created_at": existing["created_at"] if existing else now,
            "updated_at": now,
            "last_login_at": now,
        }
        user["payload"] = {
            "kakao_account": deepcopy(account),
            "properties": deepcopy(kakao_user.get("properties", {})),
        }
        storage.save_user(user)
        return user

    def _issue_service_token(self, user_id: str) -> str:
        secret = os.getenv("JWT_SECRET", "").strip()
        if not secret:
            raise AuthServiceError("jwt_secret_missing")

        payload = {
            "sub": user_id,
            "exp": int((datetime.now(UTC) + timedelta(days=self.token_ttl_days)).timestamp()),
        }
        encoded_payload = self._b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
        signature = hmac.new(
            secret.encode("utf-8"),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        return f"{encoded_payload}.{self._b64url_encode(signature)}"

    def _verify_service_token(self, token: str) -> dict[str, Any]:
        secret = os.getenv("JWT_SECRET", "").strip()
        if not secret:
            raise AuthServiceError("jwt_secret_missing")

        try:
            encoded_payload, encoded_signature = token.split(".", 1)
        except ValueError as exc:
            raise AuthServiceError("invalid_access_token") from exc

        expected_signature = hmac.new(
            secret.encode("utf-8"),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        provided_signature = self._b64url_decode(encoded_signature)
        if not hmac.compare_digest(expected_signature, provided_signature):
            raise AuthServiceError("invalid_access_token")

        try:
            payload = json.loads(self._b64url_decode(encoded_payload).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise AuthServiceError("invalid_access_token") from exc

        if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
            raise AuthServiceError("access_token_expired")
        return payload

    @staticmethod
    def _extract_bearer_token(authorization: str | None) -> str:
        if not authorization:
            raise AuthServiceError("authorization_required")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            raise AuthServiceError("authorization_required")
        return token.strip()

    @staticmethod
    def _serialize_user(user: dict[str, Any]) -> dict[str, Any]:
        return {
            "user_id": user["user_id"],
            "provider": user["provider"],
            "provider_user_id": user["provider_user_id"],
            "nickname": user["nickname"],
            "email": user.get("email"),
            "profile_image_url": user.get("profile_image_url"),
            "profile_id": user.get("profile_id"),
            "created_at": user["created_at"],
            "updated_at": user["updated_at"],
            "last_login_at": user["last_login_at"],
        }

    @staticmethod
    def _b64url_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

    @staticmethod
    def _b64url_decode(data: str) -> bytes:
        padding = "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode((data + padding).encode("ascii"))


auth_service = AuthService()
