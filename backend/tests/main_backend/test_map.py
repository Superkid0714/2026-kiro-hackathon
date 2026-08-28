from fastapi.testclient import TestClient

from main_backend.app import app
from main_backend.services.map_service import map_service

client = TestClient(app)


def test_get_officetel_rents_returns_normalized_items(monkeypatch) -> None:
    xml_response = """
    <response>
      <header>
        <resultCode>00</resultCode>
      </header>
      <body>
        <items>
          <item>
            <법정동>봉천동</법정동>
            <지번>123-4</지번>
            <건물명>관악 오피스텔</건물명>
            <보증금액>1,000</보증금액>
            <월세금액>55</월세금액>
            <전용면적>18.42</전용면적>
            <층>7</층>
            <건축년도>2019</건축년도>
            <년>2026</년>
            <월>07</월>
            <일>14</일>
          </item>
          <item>
            <법정동>봉천동</법정동>
            <지번>88-1</지번>
            <건물명>서울대입구 스테이</건물명>
            <보증금액>500</보증금액>
            <월세금액>48</월세금액>
            <전용면적>16.10</전용면적>
            <층>5</층>
            <건축년도>2017</건축년도>
            <년>2026</년>
            <월>07</월>
            <일>02</일>
          </item>
        </items>
      </body>
    </response>
    """.strip()

    monkeypatch.setattr(map_service, "_request_transactions", lambda **_: xml_response)

    response = client.get("/map/officetel-rents?lawd_code=11620&deal_ymd=202607")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["source"] == "molit_officetel_rent"
    assert body["lawd_code"] == "11620"
    assert body["deal_ymd"] == "202607"
    assert body["count"] == 2
    assert body["summary"]["avg_monthly_rent"] == 52
    assert body["summary"]["avg_deposit"] == 750
    assert body["items"][0]["name"] == "관악 오피스텔"
    assert body["items"][0]["address_label"] == "봉천동 123-4"
    assert body["items"][0]["contract_date"] == "2026-07-14"


def test_get_officetel_rents_can_include_coordinates(monkeypatch) -> None:
    xml_response = """
    <response>
      <header><resultCode>000</resultCode></header>
      <body>
        <items>
          <item>
            <sggNm>관악구</sggNm>
            <umdNm>신림동</umdNm>
            <jibun>1475-23</jibun>
            <offiNm>신림 스테이</offiNm>
            <deposit>5,000</deposit>
            <monthlyRent>39</monthlyRent>
            <excluUseAr>16.13</excluUseAr>
            <floor>2</floor>
            <buildYear>2013</buildYear>
            <dealYear>2026</dealYear>
            <dealMonth>7</dealMonth>
            <dealDay>6</dealDay>
          </item>
        </items>
      </body>
    </response>
    """.strip()

    monkeypatch.setattr(map_service, "_request_transactions", lambda **_: xml_response)
    monkeypatch.setattr(
        map_service,
        "_get_cached_coordinates",
        lambda _address: {"lat": 37.4801, "lng": 126.9522},
    )

    response = client.get("/map/officetel-rents?lawd_code=11620&include_coordinates=true")
    body = response.json()

    assert response.status_code == 200
    assert body["items"][0]["lat"] == 37.4801
    assert body["items"][0]["lng"] == 126.9522


def test_geocode_lookup_address_does_not_duplicate_district() -> None:
    assert (
        map_service._build_geocode_lookup_address("서울 강남구", "강남구 자곡동 662")
        == "서울 강남구 자곡동 662"
    )
    assert (
        map_service._build_geocode_lookup_address("광주 동구", "동구 서석동 375")
        == "광주 동구 서석동 375"
    )


def test_get_officetel_rents_without_deal_ymd_collects_latest_transactions(monkeypatch) -> None:
    responses = {
        "202607": """
        <response><header><resultCode>00</resultCode></header><body><items>
          <item>
            <법정동>봉천동</법정동>
            <지번>1</지번>
            <건물명>최근 오피스텔</건물명>
            <보증금액>1,000</보증금액>
            <월세금액>60</월세금액>
            <전용면적>20</전용면적>
            <년>2026</년><월>07</월><일>30</일>
          </item>
        </items></body></response>
        """,
        "202606": """
        <response><header><resultCode>00</resultCode></header><body><items>
          <item>
            <법정동>신림동</법정동>
            <지번>2</지번>
            <건물명>이전 오피스텔 A</건물명>
            <보증금액>2,000</보증금액>
            <월세금액>50</월세금액>
            <전용면적>18</전용면적>
            <년>2026</년><월>06</월><일>29</일>
          </item>
          <item>
            <법정동>신림동</법정동>
            <지번>3</지번>
            <건물명>이전 오피스텔 B</건물명>
            <보증금액>3,000</보증금액>
            <월세금액>40</월세금액>
            <전용면적>16</전용면적>
            <년>2026</년><월>06</월><일>01</일>
          </item>
        </items></body></response>
        """,
    }

    monkeypatch.setattr(map_service, "_default_deal_ymd", lambda: "202607")
    monkeypatch.setattr(
        map_service,
        "_request_transactions",
        lambda **kwargs: responses[kwargs["deal_ymd"]],
    )

    response = client.get("/map/officetel-rents?lawd_code=11620&num_of_rows=3")
    body = response.json()

    assert response.status_code == 200
    assert body["search_mode"] == "latest"
    assert body["searched_deal_ymds"] == ["202607", "202606"]
    assert body["latest_deal_ymd"] == "202607"
    assert [item["contract_date"] for item in body["items"]] == [
        "2026-07-30",
        "2026-06-29",
        "2026-06-01",
    ]
    assert [item["deal_ymd"] for item in body["items"]] == ["202607", "202606", "202606"]


def test_get_officetel_rents_returns_bad_gateway_for_upstream_error(monkeypatch) -> None:
    def raise_error(**_kwargs):
        from main_backend.services.map_service import MapServiceError

        raise MapServiceError("molit_request_failed")

    monkeypatch.setattr(map_service, "_request_transactions", raise_error)

    response = client.get("/map/officetel-rents?lawd_code=11620")

    assert response.status_code == 502
    assert response.json() == {"detail": "molit_request_failed"}


def test_geocode_location_returns_results(monkeypatch) -> None:
    monkeypatch.setattr(
        map_service,
        "geocode",
        lambda query: {
            "query": query,
            "count": 1,
            "items": [
                {
                    "road_address": "서울특별시 관악구 관악로 1",
                    "jibun_address": "서울특별시 관악구 봉천동 산4-2",
                    "english_address": "",
                    "lat": 37.4599,
                    "lng": 126.9519,
                }
            ],
        },
    )

    response = client.get("/map/geocode?query=서울대입구")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["count"] == 1
    assert body["items"][0]["lat"] == 37.4599


def test_geocode_known_place_alias_returns_coordinates() -> None:
    response = client.get("/map/geocode?query=서울대입구역")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["count"] == 1
    assert body["items"][0]["lat"] == 37.481247


def test_geocode_honam_university_aliases_return_coordinates() -> None:
    expected = {
        "조선대": 35.142954,
        "전남대": 35.176832,
        "군산대": 35.945805,
        "순천대": 34.968606,
        "전북대": 35.846844,
    }

    for query, lat in expected.items():
        response = client.get(f"/map/geocode?query={query}")
        body = response.json()

        assert response.status_code == 200
        assert body["status"] == "ok"
        assert body["count"] == 1
        assert body["items"][0]["lat"] == lat


def test_geocode_common_place_aliases_return_region_metadata() -> None:
    expected = {
        "홍대입구역": "11440",
        "강남역": "11680",
        "부산대학교": "26410",
        "수원역": "41115",
        "인천대학교": "28185",
        "동명대학교": "26290",
    }

    for query, lawd_code in expected.items():
        response = client.get(f"/map/geocode?query={query}")
        body = response.json()

        assert response.status_code == 200
        assert body["status"] == "ok"
        assert body["count"] == 1
        assert body["items"][0]["region"]["lawd_code"] == lawd_code


def test_geocode_region_alias_returns_region_center() -> None:
    response = client.get("/map/geocode?query=광주광역시 광산구")
    body = response.json()

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["count"] == 1
    assert body["items"][0]["source"] == "known_region"
    assert body["items"][0]["region"]["lawd_code"] == "29200"
