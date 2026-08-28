from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from main_backend.services.map_service import MapServiceError, map_service

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/officetel-rents")
def get_officetel_rents(
    lawd_code: str = Query(..., pattern=r"^\d{5}$"),
    deal_ymd: str | None = Query(default=None, pattern=r"^\d{6}$"),
    num_of_rows: int = Query(default=30, ge=1, le=100),
    include_coordinates: bool = Query(default=False),
) -> dict[str, object]:
    try:
        result = map_service.list_officetel_rent_transactions(
            lawd_code=lawd_code,
            deal_ymd=deal_ymd,
            num_of_rows=num_of_rows,
            include_coordinates=include_coordinates,
        )
    except MapServiceError as exc:
        if exc.code == "molit_service_key_missing":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=exc.code,
            ) from exc
        if exc.code in {
            "molit_request_failed",
            "molit_response_invalid_xml",
            "molit_response_error",
        }:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=exc.code,
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc

    return {"status": "ok", **result}


@router.get("/geocode")
def geocode_location(
    query: str = Query(..., min_length=1, max_length=120),
) -> dict[str, object]:
    try:
        result = map_service.geocode(query)
    except MapServiceError as exc:
        if exc.code == "naver_geocode_key_missing":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=exc.code,
            ) from exc
        if exc.code == "naver_geocode_failed":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=exc.code,
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code) from exc
    return {"status": "ok", **result}
