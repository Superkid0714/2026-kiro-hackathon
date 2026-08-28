from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from typing import Any
from urllib.parse import unquote
from xml.etree import ElementTree

import httpx


class MapServiceError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class RegionCenter:
    lat: float
    lng: float


REGION_CENTERS: dict[str, RegionCenter] = {
    "29110": RegionCenter(lat=35.1430, lng=126.9350),  # 광주 동구
    "29170": RegionCenter(lat=35.1767, lng=126.9124),  # 광주 북구
    "29140": RegionCenter(lat=35.1519, lng=126.8903),  # 광주 서구
    "29155": RegionCenter(lat=35.1330, lng=126.9024),  # 광주 남구
    "29200": RegionCenter(lat=35.1396, lng=126.7937),  # 광주 광산구
    "11110": RegionCenter(lat=37.5735, lng=126.9788),  # 서울 종로구
    "11200": RegionCenter(lat=37.5633, lng=127.0369),  # 서울 성동구
    "11215": RegionCenter(lat=37.5384, lng=127.0823),  # 서울 광진구
    "11230": RegionCenter(lat=37.5744, lng=127.0396),  # 서울 동대문구
    "11290": RegionCenter(lat=37.5894, lng=127.0167),  # 서울 성북구
    "11410": RegionCenter(lat=37.5791, lng=126.9368),  # 서울 서대문구
    "11440": RegionCenter(lat=37.5663, lng=126.9019),  # 서울 마포구
    "11590": RegionCenter(lat=37.5124, lng=126.9393),  # 서울 동작구
    "11620": RegionCenter(lat=37.4784, lng=126.9516),  # 서울 관악구
    "11680": RegionCenter(lat=37.5172, lng=127.0473),  # 서울 강남구
    "26230": RegionCenter(lat=35.1629, lng=129.0532),  # 부산 부산진구
    "26290": RegionCenter(lat=35.1365, lng=129.0844),  # 부산 남구
    "26350": RegionCenter(lat=35.1631, lng=129.1636),  # 부산 해운대구
    "26410": RegionCenter(lat=35.2429, lng=129.0920),  # 부산 금정구
    "26530": RegionCenter(lat=35.1526, lng=128.9914),  # 부산 사상구
    "27110": RegionCenter(lat=35.8695, lng=128.6062),  # 대구 중구
    "27140": RegionCenter(lat=35.8867, lng=128.6356),  # 대구 동구
    "27230": RegionCenter(lat=35.8857, lng=128.5829),  # 대구 북구
    "27290": RegionCenter(lat=35.8299, lng=128.5327),  # 대구 달서구
    "28177": RegionCenter(lat=37.4637, lng=126.6505),  # 인천 미추홀구
    "28185": RegionCenter(lat=37.4102, lng=126.6788),  # 인천 연수구
    "30110": RegionCenter(lat=36.3122, lng=127.4549),  # 대전 동구
    "30170": RegionCenter(lat=36.3554, lng=127.3838),  # 대전 서구
    "30200": RegionCenter(lat=36.3622, lng=127.3568),  # 대전 유성구
    "41111": RegionCenter(lat=37.3039, lng=127.0106),  # 수원 장안구
    "41113": RegionCenter(lat=37.2576, lng=126.9719),  # 수원 권선구
    "41115": RegionCenter(lat=37.2826, lng=127.0164),  # 수원 팔달구
    "41117": RegionCenter(lat=37.2596, lng=127.0466),  # 수원 영통구
    "41461": RegionCenter(lat=37.2343, lng=127.2011),  # 용인 처인구
    "41463": RegionCenter(lat=37.2804, lng=127.1147),  # 용인 기흥구
    "41465": RegionCenter(lat=37.3222, lng=127.0975),  # 용인 수지구
    "43112": RegionCenter(lat=36.6371, lng=127.4695),  # 청주 서원구
    "43113": RegionCenter(lat=36.6410, lng=127.4316),  # 청주 흥덕구
    "43114": RegionCenter(lat=36.6510, lng=127.4867),  # 청주 청원구
    "44131": RegionCenter(lat=36.8065, lng=127.1522),  # 천안 동남구
    "44133": RegionCenter(lat=36.8786, lng=127.1549),  # 천안 서북구
    "44200": RegionCenter(lat=36.7898, lng=127.0018),  # 아산시
    "45111": RegionCenter(lat=35.8092, lng=127.1219),  # 전주 완산구
    "45113": RegionCenter(lat=35.8468, lng=127.1297),  # 전주 덕진구
    "45130": RegionCenter(lat=35.9458, lng=126.6821),  # 군산시
    "45140": RegionCenter(lat=35.9483, lng=126.9576),  # 익산시
    "46110": RegionCenter(lat=34.8118, lng=126.3922),  # 목포시
    "46130": RegionCenter(lat=34.7604, lng=127.6622),  # 여수시
    "46150": RegionCenter(lat=34.9686, lng=127.4801),  # 순천시
    "46170": RegionCenter(lat=35.0158, lng=126.7109),  # 나주시
    "46840": RegionCenter(lat=34.9904, lng=126.4817),  # 무안군
    "47111": RegionCenter(lat=35.9899, lng=129.3593),  # 포항 남구
    "47113": RegionCenter(lat=36.0417, lng=129.3650),  # 포항 북구
    "47290": RegionCenter(lat=35.8251, lng=128.7415),  # 경산시
    "50110": RegionCenter(lat=33.4996, lng=126.5312),  # 제주시
    "50130": RegionCenter(lat=33.2539, lng=126.5601),  # 서귀포시
    "51110": RegionCenter(lat=37.8813, lng=127.7298),  # 춘천시
    "51130": RegionCenter(lat=37.3422, lng=127.9202),  # 원주시
    "51150": RegionCenter(lat=37.7519, lng=128.8761),  # 강릉시
}


REGION_LABELS: dict[str, str] = {
    "29110": "광주 동구",
    "29170": "광주 북구",
    "29140": "광주 서구",
    "29155": "광주 남구",
    "29200": "광주 광산구",
    "11110": "서울 종로구",
    "11200": "서울 성동구",
    "11215": "서울 광진구",
    "11230": "서울 동대문구",
    "11290": "서울 성북구",
    "11410": "서울 서대문구",
    "11440": "서울 마포구",
    "11590": "서울 동작구",
    "11620": "서울 관악구",
    "11680": "서울 강남구",
    "26230": "부산 부산진구",
    "26290": "부산 남구",
    "26350": "부산 해운대구",
    "26410": "부산 금정구",
    "26530": "부산 사상구",
    "27110": "대구 중구",
    "27140": "대구 동구",
    "27230": "대구 북구",
    "27290": "대구 달서구",
    "28177": "인천 미추홀구",
    "28185": "인천 연수구",
    "30110": "대전 동구",
    "30170": "대전 서구",
    "30200": "대전 유성구",
    "41111": "수원 장안구",
    "41113": "수원 권선구",
    "41115": "수원 팔달구",
    "41117": "수원 영통구",
    "41461": "용인 처인구",
    "41463": "용인 기흥구",
    "41465": "용인 수지구",
    "43112": "청주 서원구",
    "43113": "청주 흥덕구",
    "43114": "청주 청원구",
    "44131": "천안 동남구",
    "44133": "천안 서북구",
    "44200": "아산시",
    "45111": "전주 완산구",
    "45113": "전주 덕진구",
    "45130": "군산시",
    "45140": "익산시",
    "46110": "목포시",
    "46130": "여수시",
    "46150": "순천시",
    "46170": "나주시",
    "46840": "무안군",
    "47111": "포항 남구",
    "47113": "포항 북구",
    "47290": "경산시",
    "50110": "제주시",
    "50130": "서귀포시",
    "51110": "춘천시",
    "51130": "원주시",
    "51150": "강릉시",
}


def _place(
    *,
    road_address: str,
    jibun_address: str,
    lat: float,
    lng: float,
    lawd_code: str,
) -> dict[str, Any]:
    return {
        "road_address": road_address,
        "jibun_address": jibun_address,
        "lat": lat,
        "lng": lng,
        "lawd_code": lawd_code,
    }


PLACE_ALIASES: dict[str, dict[str, Any]] = {
    "서울대입구": {
        "road_address": "서울특별시 관악구 관악로 1",
        "jibun_address": "서울특별시 관악구 신림동 산56-1",
        "lat": 37.464007,
        "lng": 126.9522394,
        "lawd_code": "11620",
    },
    "서울대입구역": {
        "road_address": "서울특별시 관악구 남부순환로 1822",
        "jibun_address": "서울특별시 관악구 봉천동 979-2",
        "lat": 37.481247,
        "lng": 126.952739,
        "lawd_code": "11620",
    },
    "서울대학교": {
        "road_address": "서울특별시 관악구 관악로 1",
        "jibun_address": "서울특별시 관악구 신림동 산56-1",
        "lat": 37.464007,
        "lng": 126.9522394,
        "lawd_code": "11620",
    },
    "전남대": {
        "road_address": "광주광역시 북구 용봉로 77",
        "jibun_address": "광주광역시 북구 용봉동 300",
        "lat": 35.176832,
        "lng": 126.908535,
        "lawd_code": "29170",
    },
    "전남대학교": {
        "road_address": "광주광역시 북구 용봉로 77",
        "jibun_address": "광주광역시 북구 용봉동 300",
        "lat": 35.176832,
        "lng": 126.908535,
        "lawd_code": "29170",
    },
    "조선대": {
        "road_address": "광주광역시 동구 조선대길 146",
        "jibun_address": "광주광역시 동구 서석동 375",
        "lat": 35.142954,
        "lng": 126.934962,
        "lawd_code": "29110",
    },
    "조선대학교": {
        "road_address": "광주광역시 동구 조선대길 146",
        "jibun_address": "광주광역시 동구 서석동 375",
        "lat": 35.142954,
        "lng": 126.934962,
        "lawd_code": "29110",
    },
    "군산대": {
        "road_address": "전북특별자치도 군산시 대학로 558",
        "jibun_address": "전북특별자치도 군산시 미룡동 산68",
        "lat": 35.945805,
        "lng": 126.682063,
        "lawd_code": "45130",
    },
    "군산대학교": {
        "road_address": "전북특별자치도 군산시 대학로 558",
        "jibun_address": "전북특별자치도 군산시 미룡동 산68",
        "lat": 35.945805,
        "lng": 126.682063,
        "lawd_code": "45130",
    },
    "순천대": {
        "road_address": "전라남도 순천시 중앙로 255",
        "jibun_address": "전라남도 순천시 석현동 313",
        "lat": 34.968606,
        "lng": 127.480069,
        "lawd_code": "46150",
    },
    "순천대학교": {
        "road_address": "전라남도 순천시 중앙로 255",
        "jibun_address": "전라남도 순천시 석현동 313",
        "lat": 34.968606,
        "lng": 127.480069,
        "lawd_code": "46150",
    },
    "광주송정역": {
        "road_address": "광주광역시 광산구 상무대로 201",
        "jibun_address": "광주광역시 광산구 송정동 1003-1",
        "lat": 35.137789,
        "lng": 126.791353,
        "lawd_code": "29200",
    },
    "광주역": {
        "road_address": "광주광역시 북구 무등로 235",
        "jibun_address": "광주광역시 북구 중흥동 611-1",
        "lat": 35.165105,
        "lng": 126.909949,
        "lawd_code": "29170",
    },
    "서면역": {
        "road_address": "부산광역시 부산진구 중앙대로 730",
        "jibun_address": "부산광역시 부산진구 부전동 573-1",
        "lat": 35.157949,
        "lng": 129.059229,
        "lawd_code": "26230",
    },
    "부산서면역": {
        "road_address": "부산광역시 부산진구 중앙대로 730",
        "jibun_address": "부산광역시 부산진구 부전동 573-1",
        "lat": 35.157949,
        "lng": 129.059229,
        "lawd_code": "26230",
    },
    "경북대학교": {
        "road_address": "대구광역시 북구 대학로 80",
        "jibun_address": "대구광역시 북구 산격동 1370-1",
        "lat": 35.888859,
        "lng": 128.610752,
        "lawd_code": "27230",
    },
    "충남대학교": {
        "road_address": "대전광역시 유성구 대학로 99",
        "jibun_address": "대전광역시 유성구 궁동 220",
        "lat": 36.368341,
        "lng": 127.346683,
        "lawd_code": "30200",
    },
    "전북대": {
        "road_address": "전북특별자치도 전주시 덕진구 백제대로 567",
        "jibun_address": "전북특별자치도 전주시 덕진구 금암동 664-14",
        "lat": 35.846844,
        "lng": 127.12972,
        "lawd_code": "45113",
    },
    "전북대학교": {
        "road_address": "전북특별자치도 전주시 덕진구 백제대로 567",
        "jibun_address": "전북특별자치도 전주시 덕진구 금암동 664-14",
        "lat": 35.846844,
        "lng": 127.12972,
        "lawd_code": "45113",
    },
    "제주대학교": {
        "road_address": "제주특별자치도 제주시 제주대학로 102",
        "jibun_address": "제주특별자치도 제주시 아라일동 1",
        "lat": 33.456859,
        "lng": 126.561758,
        "lawd_code": "50110",
    },
    "홍대입구역": _place(
        road_address="서울특별시 마포구 양화로 160",
        jibun_address="서울특별시 마포구 동교동 165",
        lat=37.557527,
        lng=126.925464,
        lawd_code="11440",
    ),
    "홍익대학교": _place(
        road_address="서울특별시 마포구 와우산로 94",
        jibun_address="서울특별시 마포구 상수동 72-1",
        lat=37.551464,
        lng=126.925011,
        lawd_code="11440",
    ),
    "홍대": _place(
        road_address="서울특별시 마포구 와우산로 94",
        jibun_address="서울특별시 마포구 상수동 72-1",
        lat=37.551464,
        lng=126.925011,
        lawd_code="11440",
    ),
    "강남역": _place(
        road_address="서울특별시 강남구 강남대로 396",
        jibun_address="서울특별시 강남구 역삼동 858",
        lat=37.497952,
        lng=127.027619,
        lawd_code="11680",
    ),
    "신촌역": _place(
        road_address="서울특별시 서대문구 신촌로 90",
        jibun_address="서울특별시 서대문구 창천동 72-14",
        lat=37.555134,
        lng=126.936893,
        lawd_code="11410",
    ),
    "연세대학교": _place(
        road_address="서울특별시 서대문구 연세로 50",
        jibun_address="서울특별시 서대문구 신촌동 134",
        lat=37.565784,
        lng=126.938572,
        lawd_code="11410",
    ),
    "이화여대": _place(
        road_address="서울특별시 서대문구 이화여대길 52",
        jibun_address="서울특별시 서대문구 대현동 11-1",
        lat=37.561793,
        lng=126.946825,
        lawd_code="11410",
    ),
    "고려대학교": _place(
        road_address="서울특별시 성북구 안암로 145",
        jibun_address="서울특별시 성북구 안암동5가 1-2",
        lat=37.589387,
        lng=127.032477,
        lawd_code="11290",
    ),
    "건국대학교": _place(
        road_address="서울특별시 광진구 능동로 120",
        jibun_address="서울특별시 광진구 화양동 1",
        lat=37.540762,
        lng=127.079343,
        lawd_code="11215",
    ),
    "건대입구역": _place(
        road_address="서울특별시 광진구 아차산로 243",
        jibun_address="서울특별시 광진구 화양동 7-3",
        lat=37.540408,
        lng=127.069231,
        lawd_code="11215",
    ),
    "중앙대학교": _place(
        road_address="서울특별시 동작구 흑석로 84",
        jibun_address="서울특별시 동작구 흑석동 221",
        lat=37.505088,
        lng=126.957101,
        lawd_code="11590",
    ),
    "숭실대학교": _place(
        road_address="서울특별시 동작구 상도로 369",
        jibun_address="서울특별시 동작구 상도동 511",
        lat=37.496372,
        lng=126.957459,
        lawd_code="11590",
    ),
    "한양대학교": _place(
        road_address="서울특별시 성동구 왕십리로 222",
        jibun_address="서울특별시 성동구 사근동 110",
        lat=37.557232,
        lng=127.045321,
        lawd_code="11200",
    ),
    "경희대학교": _place(
        road_address="서울특별시 동대문구 경희대로 26",
        jibun_address="서울특별시 동대문구 회기동 1-5",
        lat=37.596228,
        lng=127.052657,
        lawd_code="11230",
    ),
    "한국외대": _place(
        road_address="서울특별시 동대문구 이문로 107",
        jibun_address="서울특별시 동대문구 이문동 270",
        lat=37.597319,
        lng=127.057843,
        lawd_code="11230",
    ),
    "서울시립대학교": _place(
        road_address="서울특별시 동대문구 서울시립대로 163",
        jibun_address="서울특별시 동대문구 전농동 90",
        lat=37.583866,
        lng=127.058777,
        lawd_code="11230",
    ),
    "부산대학교": _place(
        road_address="부산광역시 금정구 부산대학로63번길 2",
        jibun_address="부산광역시 금정구 장전동 40",
        lat=35.233897,
        lng=129.079553,
        lawd_code="26410",
    ),
    "부산대": _place(
        road_address="부산광역시 금정구 부산대학로63번길 2",
        jibun_address="부산광역시 금정구 장전동 40",
        lat=35.233897,
        lng=129.079553,
        lawd_code="26410",
    ),
    "부경대학교": _place(
        road_address="부산광역시 남구 용소로 45",
        jibun_address="부산광역시 남구 대연동 599-1",
        lat=35.134712,
        lng=129.103006,
        lawd_code="26290",
    ),
    "동명대학교": _place(
        road_address="부산광역시 남구 신선로 428",
        jibun_address="부산광역시 남구 용당동 535",
        lat=35.122328,
        lng=129.101585,
        lawd_code="26290",
    ),
    "계명대학교": _place(
        road_address="대구광역시 달서구 달구벌대로 1095",
        jibun_address="대구광역시 달서구 신당동 1000",
        lat=35.857991,
        lng=128.489001,
        lawd_code="27290",
    ),
    "동대구역": _place(
        road_address="대구광역시 동구 동대구로 550",
        jibun_address="대구광역시 동구 신암동 294",
        lat=35.879727,
        lng=128.628779,
        lawd_code="27140",
    ),
    "인하대학교": _place(
        road_address="인천광역시 미추홀구 인하로 100",
        jibun_address="인천광역시 미추홀구 용현동 253",
        lat=37.450022,
        lng=126.653488,
        lawd_code="28177",
    ),
    "인천대학교": _place(
        road_address="인천광역시 연수구 아카데미로 119",
        jibun_address="인천광역시 연수구 송도동 12-1",
        lat=37.375235,
        lng=126.632718,
        lawd_code="28185",
    ),
    "수원역": _place(
        road_address="경기도 수원시 팔달구 덕영대로 924",
        jibun_address="경기도 수원시 팔달구 매산로1가 18",
        lat=37.266173,
        lng=126.999702,
        lawd_code="41115",
    ),
    "아주대학교": _place(
        road_address="경기도 수원시 영통구 월드컵로 206",
        jibun_address="경기도 수원시 영통구 원천동 산5",
        lat=37.282534,
        lng=127.043533,
        lawd_code="41117",
    ),
    "경기대학교": _place(
        road_address="경기도 수원시 영통구 광교산로 154-42",
        jibun_address="경기도 수원시 영통구 이의동 산94-6",
        lat=37.300638,
        lng=127.035367,
        lawd_code="41117",
    ),
    "충북대학교": _place(
        road_address="충청북도 청주시 서원구 충대로 1",
        jibun_address="충청북도 청주시 서원구 개신동 12",
        lat=36.628197,
        lng=127.456368,
        lawd_code="43112",
    ),
    "단국대학교": _place(
        road_address="충청남도 천안시 동남구 단대로 119",
        jibun_address="충청남도 천안시 동남구 안서동 522",
        lat=36.840613,
        lng=127.168971,
        lawd_code="44131",
    ),
    "선문대학교": _place(
        road_address="충청남도 아산시 탕정면 선문로221번길 70",
        jibun_address="충청남도 아산시 탕정면 갈산리 100",
        lat=36.797372,
        lng=127.074349,
        lawd_code="44200",
    ),
    "원광대학교": _place(
        road_address="전북특별자치도 익산시 익산대로 460",
        jibun_address="전북특별자치도 익산시 신동 272",
        lat=35.968872,
        lng=126.957687,
        lawd_code="45140",
    ),
    "목포대학교": _place(
        road_address="전라남도 무안군 청계면 영산로 1666",
        jibun_address="전라남도 무안군 청계면 도림리 61",
        lat=34.910047,
        lng=126.438079,
        lawd_code="46840",
    ),
    "목포역": _place(
        road_address="전라남도 목포시 영산로 98",
        jibun_address="전라남도 목포시 호남동 1-1",
        lat=34.791564,
        lng=126.386665,
        lawd_code="46110",
    ),
    "여수엑스포역": _place(
        road_address="전라남도 여수시 망양로 2",
        jibun_address="전라남도 여수시 덕충동 2005",
        lat=34.752563,
        lng=127.748148,
        lawd_code="46130",
    ),
    "전주역": _place(
        road_address="전북특별자치도 전주시 덕진구 동부대로 680",
        jibun_address="전북특별자치도 전주시 덕진구 우아동3가 235-10",
        lat=35.849654,
        lng=127.161645,
        lawd_code="45113",
    ),
    "군산역": _place(
        road_address="전북특별자치도 군산시 내흥2길 197",
        jibun_address="전북특별자치도 군산시 내흥동 455",
        lat=35.998353,
        lng=126.761618,
        lawd_code="45130",
    ),
    "순천역": _place(
        road_address="전라남도 순천시 팔마로 135",
        jibun_address="전라남도 순천시 조곡동 139-1",
        lat=34.946103,
        lng=127.502681,
        lawd_code="46150",
    ),
    "제주공항": _place(
        road_address="제주특별자치도 제주시 공항로 2",
        jibun_address="제주특별자치도 제주시 용담이동 2002",
        lat=33.506543,
        lng=126.492769,
        lawd_code="50110",
    ),
}


REGION_ALIASES: dict[str, str] = {}
for _lawd_code, _label in REGION_LABELS.items():
    _compact_label = _label.replace(" ", "")
    REGION_ALIASES[_compact_label] = _lawd_code
    REGION_ALIASES[_label] = _lawd_code
    if _label.endswith("시"):
        REGION_ALIASES[_label.removesuffix("시")] = _lawd_code
    if " " in _label:
        REGION_ALIASES[_label.split(" ", 1)[1]] = _lawd_code

REGION_ALIASES.update(
    {
        "서울": "11110",
        "부산": "26230",
        "대구": "27110",
        "인천": "28185",
        "광주": "29110",
        "대전": "30200",
        "수원": "41115",
        "용인": "41463",
        "청주": "43113",
        "천안": "44131",
        "아산": "44200",
        "전주": "45113",
        "군산": "45130",
        "익산": "45140",
        "목포": "46110",
        "여수": "46130",
        "순천": "46150",
        "나주": "46170",
        "포항": "47113",
        "경산": "47290",
        "제주": "50110",
        "서귀포": "50130",
        "춘천": "51110",
        "원주": "51130",
        "강릉": "51150",
    }
)


class MapService:
    def __init__(self) -> None:
        self._geocode_cache: dict[str, dict[str, float] | None] = {}

    def list_officetel_rent_transactions(
        self,
        *,
        lawd_code: str,
        deal_ymd: str | None = None,
        num_of_rows: int = 30,
        include_coordinates: bool = False,
    ) -> dict[str, Any]:
        service_key = unquote(os.getenv("MOLIT_OFFIRENT_SERVICE_KEY", "").strip())
        endpoint = os.getenv(
            "MOLIT_OFFIRENT_ENDPOINT",
            "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
        ).strip()

        if not service_key:
            raise MapServiceError("molit_service_key_missing")

        items: list[dict[str, Any]] = []
        searched_deal_ymds: list[str] = []

        if deal_ymd is not None:
            xml_text = self._request_transactions(
                endpoint=endpoint,
                service_key=service_key,
                lawd_code=lawd_code,
                deal_ymd=deal_ymd,
                num_of_rows=num_of_rows,
            )
            searched_deal_ymds.append(deal_ymd)
            items = self._tag_month_items(self._parse_transactions(xml_text), deal_ymd)
            search_mode = "monthly"
            target_ymd = deal_ymd
        else:
            searched_ymd = self._default_deal_ymd()
            search_mode = "latest"

            for _attempt in range(24):
                searched_deal_ymds.append(searched_ymd)
                xml_text = self._request_transactions(
                    endpoint=endpoint,
                    service_key=service_key,
                    lawd_code=lawd_code,
                    deal_ymd=searched_ymd,
                    num_of_rows=num_of_rows,
                )
                month_items = self._tag_month_items(
                    self._parse_transactions(xml_text),
                    searched_ymd,
                )
                items.extend(month_items)
                if len(items) >= num_of_rows:
                    break
                searched_ymd = self._shift_month(searched_ymd, -1)

            items = self._sort_latest_items(items)[:num_of_rows]
            target_ymd = items[0]["deal_ymd"] if items else searched_deal_ymds[0]

        if include_coordinates:
            items = self._attach_coordinates(items, lawd_code=lawd_code)

        summary = self._build_summary(items)
        center = REGION_CENTERS.get(lawd_code)

        return {
            "source": "molit_officetel_rent",
            "search_mode": search_mode,
            "lawd_code": lawd_code,
            "deal_ymd": target_ymd,
            "latest_deal_ymd": items[0]["deal_ymd"] if items else target_ymd,
            "searched_deal_ymds": searched_deal_ymds,
            "summary": summary,
            "region_center": (
                {"lat": center.lat, "lng": center.lng}
                if center is not None
                else None
            ),
            "items": items,
            "count": len(items),
        }

    @staticmethod
    def _tag_month_items(items: list[dict[str, Any]], deal_ymd: str) -> list[dict[str, Any]]:
        tagged_items = []
        for index, item in enumerate(items, start=1):
            next_item = dict(item)
            next_item["deal_ymd"] = deal_ymd
            next_item["id"] = f"offi-rent-{deal_ymd}-{index}"
            tagged_items.append(next_item)
        return tagged_items

    @staticmethod
    def _sort_latest_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return sorted(
            items,
            key=lambda item: item.get("contract_date") or f"{item.get('deal_ymd', '')}-00",
            reverse=True,
        )

    def geocode(self, query: str) -> dict[str, Any]:
        client_id = os.getenv("NAVER_MAP_CLIENT_ID", "").strip()
        client_secret = os.getenv("NAVER_MAP_CLIENT_SECRET", "").strip()

        if not client_id or not client_secret:
            raise MapServiceError("naver_geocode_key_missing")

        normalized = query.strip()
        if not normalized:
            raise MapServiceError("geocode_query_required")

        alias = self._find_place_alias(normalized)
        if alias is not None:
            return {
                "query": normalized,
                "count": 1,
                "items": [alias],
            }

        region = self._find_region_alias(normalized)
        if region is not None and self._is_region_only_query(normalized):
            return {
                "query": normalized,
                "count": 1,
                "items": [region],
            }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
                    params={"query": normalized, "count": 5},
                    headers={
                        "X-NCP-APIGW-API-KEY-ID": client_id,
                        "X-NCP-APIGW-API-KEY": client_secret,
                    },
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise MapServiceError("naver_geocode_failed") from exc

        addresses = payload.get("addresses") or []
        if not addresses:
            if region is not None:
                return {
                    "query": normalized,
                    "count": 1,
                    "items": [region],
                }
            return {
                "query": normalized,
                "count": 0,
                "items": [],
            }

        items = []
        for item in addresses:
            if not item.get("x") or not item.get("y"):
                continue
            lat = float(item["y"])
            lng = float(item["x"])
            items.append(
                {
                    "road_address": item.get("roadAddress") or "",
                    "jibun_address": item.get("jibunAddress") or "",
                    "english_address": item.get("englishAddress") or "",
                    "lat": lat,
                    "lng": lng,
                    "nearest_region": self._nearest_region(lat, lng),
                }
            )
        return {
            "query": normalized,
            "count": len(items),
            "items": items,
        }

    @staticmethod
    def _find_place_alias(query: str) -> dict[str, Any] | None:
        compact_query = query.replace(" ", "")
        for name, place in sorted(
            PLACE_ALIASES.items(),
            key=lambda item: len(item[0]),
            reverse=True,
        ):
            compact_name = name.replace(" ", "")
            if compact_name in compact_query or compact_query in compact_name:
                result = {
                    "road_address": place["road_address"],
                    "jibun_address": place["jibun_address"],
                    "english_address": "",
                    "lat": place["lat"],
                    "lng": place["lng"],
                    "source": "known_place",
                }
                region = MapService._region_payload(place.get("lawd_code"))
                if region is not None:
                    result["region"] = region
                return result
        return None

    @staticmethod
    def _find_region_alias(query: str) -> dict[str, Any] | None:
        compact_query = query.replace(" ", "")
        matched_code = None
        for alias, lawd_code in sorted(
            REGION_ALIASES.items(),
            key=lambda item: len(item[0]),
            reverse=True,
        ):
            compact_alias = alias.replace(" ", "")
            if compact_alias and (compact_alias in compact_query or compact_query in compact_alias):
                matched_code = lawd_code
                break

        if matched_code is None:
            return None

        center = REGION_CENTERS.get(matched_code)
        label = REGION_LABELS.get(matched_code)
        if center is None or label is None:
            return None

        return {
            "road_address": label,
            "jibun_address": label,
            "english_address": "",
            "lat": center.lat,
            "lng": center.lng,
            "source": "known_region",
            "region": MapService._region_payload(matched_code),
        }

    @staticmethod
    def _is_region_only_query(query: str) -> bool:
        if any(char.isdigit() for char in query):
            return False

        tokens = [token for token in query.split() if token]
        if len(tokens) > 2:
            return False

        compact_query = query.replace(" ", "")
        normalized_query = (
            compact_query.replace("특별자치도", "")
            .replace("특별시", "")
            .replace("광역시", "")
            .replace("특별자치시", "")
        )

        for alias in REGION_ALIASES:
            compact_alias = alias.replace(" ", "")
            normalized_alias = (
                compact_alias.replace("특별자치도", "")
                .replace("특별시", "")
                .replace("광역시", "")
                .replace("특별자치시", "")
            )
            if normalized_query == normalized_alias or compact_query == compact_alias:
                return True
        return False

    @staticmethod
    def _region_payload(lawd_code: str | None) -> dict[str, Any] | None:
        if lawd_code is None:
            return None
        center = REGION_CENTERS.get(lawd_code)
        label = REGION_LABELS.get(lawd_code)
        if center is None or label is None:
            return None
        return {
            "label": label,
            "lawd_code": lawd_code,
            "center": {"lat": center.lat, "lng": center.lng},
        }

    @staticmethod
    def _nearest_region(lat: float, lng: float) -> dict[str, Any] | None:
        best_code = None
        best_distance = None
        for lawd_code, center in REGION_CENTERS.items():
            distance = (center.lat - lat) ** 2 + (center.lng - lng) ** 2
            if best_distance is None or distance < best_distance:
                best_code = lawd_code
                best_distance = distance
        return MapService._region_payload(best_code)

    @staticmethod
    def _default_deal_ymd() -> str:
        today = date.today()
        if today.month == 1:
            return f"{today.year - 1}12"
        return f"{today.year}{today.month - 1:02d}"

    @staticmethod
    def _shift_month(value: str, delta: int) -> str:
        year = int(value[:4])
        month = int(value[4:])
        absolute = year * 12 + (month - 1) + delta
        next_year = absolute // 12
        next_month = absolute % 12 + 1
        return f"{next_year}{next_month:02d}"

    def _request_transactions(
        self,
        *,
        endpoint: str,
        service_key: str,
        lawd_code: str,
        deal_ymd: str,
        num_of_rows: int,
    ) -> str:
        try:
            with httpx.Client(timeout=12.0) as client:
                response = client.get(
                    endpoint,
                    params={
                        "serviceKey": service_key,
                        "LAWD_CD": lawd_code,
                        "DEAL_YMD": deal_ymd,
                        "numOfRows": num_of_rows,
                        "pageNo": 1,
                    },
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise MapServiceError("molit_request_failed") from exc

        return self._decode_xml_bytes(response.content)

    @staticmethod
    def _decode_xml_bytes(raw: bytes) -> str:
        for encoding in ("utf-8", "cp949", "euc-kr"):
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                continue
        return raw.decode("utf-8", errors="replace")

    def _attach_coordinates(
        self,
        items: list[dict[str, Any]],
        *,
        lawd_code: str | None = None,
    ) -> list[dict[str, Any]]:
        next_items: list[dict[str, Any]] = []
        region_label = REGION_LABELS.get(lawd_code or "")
        for item in items:
            address = item.get("address_label") or item.get("district") or ""
            lookup_address = self._build_geocode_lookup_address(region_label, address)
            coordinates = self._get_cached_coordinates(lookup_address)
            if coordinates is None and lookup_address != address:
                coordinates = self._get_cached_coordinates(address)
            enriched = dict(item)
            if coordinates is not None:
                enriched["lat"] = coordinates["lat"]
                enriched["lng"] = coordinates["lng"]
            next_items.append(enriched)
        return next_items

    @staticmethod
    def _build_geocode_lookup_address(region_label: str | None, address: str) -> str:
        normalized_address = address.strip()
        normalized_region = (region_label or "").strip()
        if not normalized_region or not normalized_address:
            return normalized_address
        if normalized_address.startswith(normalized_region):
            return normalized_address

        region_parts = normalized_region.split()
        if len(region_parts) >= 2 and normalized_address.startswith(region_parts[-1]):
            return f"{region_parts[0]} {normalized_address}"

        return f"{normalized_region} {normalized_address}"

    def _get_cached_coordinates(self, address: str) -> dict[str, float] | None:
        normalized = address.strip()
        if not normalized:
            return None
        if normalized in self._geocode_cache:
            return self._geocode_cache[normalized]

        try:
            result = self.geocode(normalized)
        except MapServiceError:
            self._geocode_cache[normalized] = None
            return None

        first = (result.get("items") or [None])[0]
        if first is None:
            self._geocode_cache[normalized] = None
            return None

        coordinates = {"lat": float(first["lat"]), "lng": float(first["lng"])}
        self._geocode_cache[normalized] = coordinates
        return coordinates

    def _parse_transactions(self, xml_text: str) -> list[dict[str, Any]]:
        try:
            root = ElementTree.fromstring(xml_text)
        except ElementTree.ParseError as exc:
            raise MapServiceError("molit_response_invalid_xml") from exc

        result_code = self._find_text(root, ["header/resultCode", "cmmMsgHeader/returnReasonCode"])
        if result_code and result_code not in {"000", "00", "0"}:
            raise MapServiceError("molit_response_error")

        transactions: list[dict[str, Any]] = []
        for index, item in enumerate(root.findall(".//item"), start=1):
            city_district = self._get_first_text(item, ["sggNm", "시군구", "시군구명"])
            legal_dong = self._get_first_text(item, ["법정동", "umdNm", "법정동명", "umdNmNm"])
            district = " ".join(part for part in [city_district, legal_dong] if part).strip()
            building_name = self._get_first_text(
                item, ["단지", "건물명", "offiNm", "aptNm", "buildingName"]
            )
            jibun = self._get_first_text(item, ["지번", "jibun"])
            floor = self._to_int(self._get_first_text(item, ["층", "floor"]))
            build_year = self._to_int(
                self._get_first_text(item, ["건축년도", "buildYear"])
            )
            area_m2 = self._to_float(
                self._get_first_text(item, ["전용면적", "excluUseAr"])
            )
            deposit = self._to_int(
                self._get_first_text(item, ["보증금액", "deposit"])
            )
            monthly_rent = self._to_int(
                self._get_first_text(item, ["월세금액", "monthlyRent"])
            )
            contract_year = self._get_first_text(item, ["년", "contractYear", "dealYear"])
            contract_month = self._get_first_text(item, ["월", "contractMonth", "dealMonth"])
            contract_day = self._get_first_text(item, ["일", "contractDay", "dealDay"])

            address_parts = [part for part in [district, jibun] if part]
            name = (
                building_name
                if building_name and building_name not in {jibun, f"({jibun})" if jibun else ""}
                else f"{district or '오피스텔'} 실거래"
            )
            transactions.append(
                {
                    "id": f"offi-rent-{index}",
                    "name": name,
                    "district": district or "",
                    "address_label": " ".join(address_parts).strip(),
                    "deposit": deposit,
                    "monthly_rent": monthly_rent,
                    "area_m2": area_m2,
                    "floor": floor,
                    "build_year": build_year,
                    "contract_date": self._format_contract_date(
                        contract_year, contract_month, contract_day
                    ),
                }
            )

        return transactions

    @staticmethod
    def _find_text(root: ElementTree.Element, paths: list[str]) -> str | None:
        for path in paths:
            node = root.find(path)
            if node is not None and node.text and node.text.strip():
                return node.text.strip()
        return None

    @staticmethod
    def _get_first_text(item: ElementTree.Element, names: list[str]) -> str | None:
        for name in names:
            node = item.find(name)
            if node is not None and node.text and node.text.strip():
                return node.text.strip()
        return None

    @staticmethod
    def _to_int(value: str | None) -> int | None:
        if not value:
            return None
        normalized = value.replace(",", "").replace(" ", "")
        if not normalized:
            return None
        try:
            return int(float(normalized))
        except ValueError:
            return None

    @staticmethod
    def _to_float(value: str | None) -> float | None:
        if not value:
            return None
        normalized = value.replace(",", "").replace(" ", "")
        if not normalized:
            return None
        try:
            return round(float(normalized), 1)
        except ValueError:
            return None

    @staticmethod
    def _format_contract_date(
        year: str | None, month: str | None, day: str | None
    ) -> str | None:
        if not year or not month or not day:
            return None
        return f"{year}-{int(month):02d}-{int(day):02d}"

    @staticmethod
    def _build_summary(items: list[dict[str, Any]]) -> dict[str, Any]:
        if not items:
            return {
                "avg_monthly_rent": 0,
                "avg_deposit": 0,
                "avg_area_m2": 0,
                "count": 0,
            }

        monthly_values = [
            item["monthly_rent"] for item in items if item["monthly_rent"] is not None
        ]
        deposit_values = [item["deposit"] for item in items if item["deposit"] is not None]
        area_values = [item["area_m2"] for item in items if item["area_m2"] is not None]

        return {
            "avg_monthly_rent": (
                round(sum(monthly_values) / len(monthly_values)) if monthly_values else 0
            ),
            "avg_deposit": (
                round(sum(deposit_values) / len(deposit_values)) if deposit_values else 0
            ),
            "avg_area_m2": round(sum(area_values) / len(area_values), 1) if area_values else 0,
            "count": len(items),
        }


map_service = MapService()
