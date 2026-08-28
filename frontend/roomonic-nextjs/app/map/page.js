'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';

const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://15.134.137.117/api';
const NAVER_MAP_SCRIPT_ID = 'roomonic-naver-maps-script';

const REGION_OPTIONS = [
  { label: '서울 강남구', lawdCode: '11680', center: { lat: 37.5172, lng: 127.0473 } },
  { label: '서울 마포구', lawdCode: '11440', center: { lat: 37.5663, lng: 126.9019 } },
  { label: '서울 서대문구', lawdCode: '11410', center: { lat: 37.5791, lng: 126.9368 } },
  { label: '서울 동대문구', lawdCode: '11230', center: { lat: 37.5744, lng: 127.0396 } },
  { label: '서울 성북구', lawdCode: '11290', center: { lat: 37.5894, lng: 127.0167 } },
  { label: '서울 광진구', lawdCode: '11215', center: { lat: 37.5384, lng: 127.0823 } },
  { label: '서울 동작구', lawdCode: '11590', center: { lat: 37.5124, lng: 126.9393 } },
  { label: '서울 관악구', lawdCode: '11620', center: { lat: 37.4784, lng: 126.9516 } },
  { label: '부산 금정구', lawdCode: '26410', center: { lat: 35.2429, lng: 129.092 } },
  { label: '부산 남구', lawdCode: '26290', center: { lat: 35.1365, lng: 129.0844 } },
  { label: '부산 부산진구', lawdCode: '26230', center: { lat: 35.1629, lng: 129.0532 } },
  { label: '대구 동구', lawdCode: '27140', center: { lat: 35.8867, lng: 128.6356 } },
  { label: '대구 북구', lawdCode: '27230', center: { lat: 35.8857, lng: 128.5829 } },
  { label: '대구 달서구', lawdCode: '27290', center: { lat: 35.8299, lng: 128.5327 } },
  { label: '인천 미추홀구', lawdCode: '28177', center: { lat: 37.4637, lng: 126.6505 } },
  { label: '인천 연수구', lawdCode: '28185', center: { lat: 37.4102, lng: 126.6788 } },
  { label: '대전 유성구', lawdCode: '30200', center: { lat: 36.3622, lng: 127.3568 } },
  { label: '수원 팔달구', lawdCode: '41115', center: { lat: 37.2826, lng: 127.0164 } },
  { label: '수원 영통구', lawdCode: '41117', center: { lat: 37.2596, lng: 127.0466 } },
  { label: '청주 서원구', lawdCode: '43112', center: { lat: 36.6371, lng: 127.4695 } },
  { label: '천안 동남구', lawdCode: '44131', center: { lat: 36.8065, lng: 127.1522 } },
  { label: '아산시', lawdCode: '44200', center: { lat: 36.7898, lng: 127.0018 } },
  { label: '전주 완산구', lawdCode: '45111', center: { lat: 35.8092, lng: 127.1219 } },
  { label: '전주 덕진구', lawdCode: '45113', center: { lat: 35.8468, lng: 127.1297 } },
  { label: '군산시', lawdCode: '45130', center: { lat: 35.9458, lng: 126.6821 } },
  { label: '익산시', lawdCode: '45140', center: { lat: 35.9483, lng: 126.9576 } },
  { label: '목포시', lawdCode: '46110', center: { lat: 34.8118, lng: 126.3922 } },
  { label: '여수시', lawdCode: '46130', center: { lat: 34.7604, lng: 127.6622 } },
  { label: '순천시', lawdCode: '46150', center: { lat: 34.9686, lng: 127.4801 } },
  { label: '무안군', lawdCode: '46840', center: { lat: 34.9904, lng: 126.4817 } },
  { label: '제주시', lawdCode: '50110', center: { lat: 33.4996, lng: 126.5312 } },
  { label: '서귀포시', lawdCode: '50130', center: { lat: 33.2539, lng: 126.5601 } },
  { label: '광주 동구', lawdCode: '29110', center: { lat: 35.143, lng: 126.935 } },
  { label: '광주 북구', lawdCode: '29170', center: { lat: 35.1767, lng: 126.9124 } },
  { label: '광주 서구', lawdCode: '29140', center: { lat: 35.1519, lng: 126.8903 } },
  { label: '광주 광산구', lawdCode: '29200', center: { lat: 35.1396, lng: 126.7937 } },
];

const GUIDE_PLACE_OPTIONS = [
  {
    label: '조선대',
    query: '조선대학교',
    region: { label: '광주 동구', lawdCode: '29110', center: { lat: 35.143, lng: 126.935 } },
  },
  {
    label: '전남대',
    query: '전남대학교',
    region: { label: '광주 북구', lawdCode: '29170', center: { lat: 35.1767, lng: 126.9124 } },
  },
  {
    label: '군산대',
    query: '군산대학교',
    region: { label: '군산시', lawdCode: '45130', center: { lat: 35.9458, lng: 126.6821 } },
  },
  {
    label: '순천대',
    query: '순천대학교',
    region: { label: '순천시', lawdCode: '46150', center: { lat: 34.9686, lng: 127.4801 } },
  },
  {
    label: '전북대',
    query: '전북대학교',
    region: { label: '전주 덕진구', lawdCode: '45113', center: { lat: 35.8468, lng: 127.1297 } },
  },
];

const MONTHLY_RENT_FILTERS = [
  { label: '전체 월세', value: 'all' },
  { label: '40만 이하', value: 'under40' },
  { label: '40~60만', value: '40to60' },
  { label: '60만 이상', value: 'over60' },
];

const DEPOSIT_FILTERS = [
  { label: '전체 보증금', value: 'all' },
  { label: '1000만 이하', value: 'under1000' },
  { label: '1000~5000만', value: '1000to5000' },
  { label: '5000만 이상', value: 'over5000' },
];

function loadNaverMapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window_unavailable'));
  }

  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps);
  }

  const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        if (window.naver?.maps) resolve(window.naver.maps);
        else reject(new Error('naver_maps_load_failed'));
      });
      existingScript.addEventListener('error', () => reject(new Error('naver_maps_script_error')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = NAVER_MAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      NAVER_MAP_CLIENT_ID
    )}`;
    script.onload = () => {
      if (window.naver?.maps) resolve(window.naver.maps);
      else reject(new Error('naver_maps_load_failed'));
    };
    script.onerror = () => reject(new Error('naver_maps_script_error'));
    document.head.appendChild(script);
  });
}

function getStatusMessage(status) {
  if (status === 'missing_key') return '네이버 지도 Client ID가 필요해요.';
  if (status === 'fetching_data') return '실거래가 데이터를 불러오는 중이에요.';
  if (status === 'loading') return '지도를 불러오는 중이에요.';
  if (status === 'error') return '지도 연결을 확인해주세요.';
  if (status === 'data_error') return '실거래가 데이터를 가져오지 못했어요.';
  return '지도 위에서 실거래가를 비교할 수 있어요.';
}

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
        active
          ? 'bg-[#6D52E1] text-white shadow-[0_10px_20px_rgba(109,82,225,0.22)]'
          : 'border border-[#E6DEFF] bg-white text-[#6C668D]'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-[20px] px-4 py-4 ${tone}`}>
      <p className="text-[11px] font-semibold text-[#7D74A6]">{label}</p>
      <p className="mt-1 text-[20px] font-black text-[#2A214A]">{value}</p>
    </div>
  );
}

function normalizeApiRegion(region) {
  if (!region?.lawd_code || !region?.label || !region?.center) return null;
  return {
    label: region.label,
    lawdCode: region.lawd_code,
    center: region.center,
  };
}

function formatDealPeriod(marketData) {
  if (marketData.search_mode === 'latest') {
    const latest = marketData.latest_deal_ymd || marketData.deal_ymd;
    if (!latest || latest.length !== 6) return '최근 실거래';
    return `최근 실거래 · ${latest.slice(0, 4)}년 ${Number(latest.slice(4))}월까지`;
  }

  if (!marketData.deal_ymd || marketData.deal_ymd.length !== 6) return '최근 거래';
  return `${marketData.deal_ymd.slice(0, 4)}년 ${Number(marketData.deal_ymd.slice(4))}월 거래`;
}

function getDisplayCoordinate(item, index, center) {
  if (typeof item.lat === 'number' && typeof item.lng === 'number') {
    const angle = (((index % 8) / 8) * Math.PI * 2) + 0.25;
    const offset = 0.00018 * (Math.floor(index / 8) + 1);
    return {
      lat: item.lat + Math.sin(angle) * offset,
      lng: item.lng + Math.cos(angle) * offset,
    };
  }

  const ring = Math.floor(index / 6) + 1;
  const angle = (((index % 6) / 6) * Math.PI * 2) + 0.35;
  const distance = 0.0045 * ring;

  return {
    lat: center.lat + Math.sin(angle) * distance,
    lng: center.lng + Math.cos(angle) * distance,
  };
}

function getItemAddress(item) {
  return item.address || item.address_label || item.district || '주소 정보 없음';
}

function uniqueRegionOptions(options) {
  const seen = new Set();
  return options.filter((option) => {
    if (!option?.region?.lawdCode || seen.has(option.region.lawdCode)) return false;
    seen.add(option.region.lawdCode);
    return true;
  });
}

export default function MapPage() {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapsApiRef = useRef(null);
  const markerRefs = useRef([]);

  const [mapStatus, setMapStatus] = useState(NAVER_MAP_CLIENT_ID ? 'loading' : 'missing_key');
  const [selectedRegion, setSelectedRegion] = useState(REGION_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState('');
  const [marketData, setMarketData] = useState({
    items: [],
    summary: { avg_monthly_rent: 0, avg_deposit: 0, avg_area_m2: 0 },
    deal_ymd: '',
    latest_deal_ymd: '',
    searched_deal_ymds: [],
    search_mode: 'latest',
    region_center: REGION_OPTIONS[0].center,
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [monthlyRentFilter, setMonthlyRentFilter] = useState('all');
  const [depositFilter, setDepositFilter] = useState('all');
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [regionPickerOptions, setRegionPickerOptions] = useState([]);
  const [pendingSearchKeyword, setPendingSearchKeyword] = useState('');

  const filteredProperties = useMemo(() => {
    return (marketData.items || []).filter((item) => {
      const monthlyRent = item.monthly_rent ?? 0;
      const deposit = item.deposit ?? 0;

      const monthlyMatch =
        monthlyRentFilter === 'all' ||
        (monthlyRentFilter === 'under40' && monthlyRent <= 40) ||
        (monthlyRentFilter === '40to60' && monthlyRent > 40 && monthlyRent <= 60) ||
        (monthlyRentFilter === 'over60' && monthlyRent > 60);

      const depositMatch =
        depositFilter === 'all' ||
        (depositFilter === 'under1000' && deposit <= 1000) ||
        (depositFilter === '1000to5000' && deposit > 1000 && deposit <= 5000) ||
        (depositFilter === 'over5000' && deposit > 5000);

      return monthlyMatch && depositMatch;
    });
  }, [depositFilter, marketData.items, monthlyRentFilter]);

  const selectedProperty = useMemo(() => {
    return filteredProperties.find((item) => item.id === selectedPropertyId) || filteredProperties[0] || null;
  }, [filteredProperties, selectedPropertyId]);

  const mapCenter = useMemo(() => {
    return searchedPlace || marketData.region_center || selectedRegion.center;
  }, [marketData.region_center, searchedPlace, selectedRegion.center]);

  const displayProperties = useMemo(() => {
    return filteredProperties.map((item, index) => ({
      ...item,
      ...getDisplayCoordinate(item, index, mapCenter),
    }));
  }, [filteredProperties, mapCenter]);

  const hideMarketDetails = regionPickerOpen || searchingPlace;
  const visibleDisplayProperties = useMemo(() => {
    return hideMarketDetails ? [] : displayProperties;
  }, [displayProperties, hideMarketDetails]);
  const visibleSelectedProperty = hideMarketDetails ? null : selectedProperty;
  const visibleSummary = hideMarketDetails
    ? { avg_monthly_rent: 0, avg_deposit: 0, avg_area_m2: 0, count: 0 }
    : marketData.summary;

  useEffect(() => {
    let cancelled = false;

    setMarketLoading(true);
    setMarketError('');
    setMapStatus((current) => (current === 'missing_key' ? current : 'fetching_data'));

    fetch(
      `${API_BASE_URL}/map/officetel-rents?lawd_code=${encodeURIComponent(
        selectedRegion.lawdCode
      )}&include_coordinates=true&num_of_rows=12`
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.detail || 'map_data_fetch_failed');
        }
        return body;
      })
      .then((body) => {
        if (cancelled) return;

        setMarketData({
          items: body.items || [],
          summary: body.summary || { avg_monthly_rent: 0, avg_deposit: 0, avg_area_m2: 0 },
          deal_ymd: body.deal_ymd || '',
          latest_deal_ymd: body.latest_deal_ymd || body.deal_ymd || '',
          searched_deal_ymds: body.searched_deal_ymds || [],
          search_mode: body.search_mode || 'latest',
          region_center: body.region_center || selectedRegion.center,
        });
        setSelectedPropertyId(body.items?.[0]?.id || '');
        setMapStatus((current) => (current === 'missing_key' ? current : 'ready'));
      })
      .catch((error) => {
        if (cancelled) return;

        setMarketError(error.message || '실거래가 데이터를 준비하지 못했어요.');
        setMarketData({
          items: [],
          summary: { avg_monthly_rent: 0, avg_deposit: 0, avg_area_m2: 0 },
          deal_ymd: '',
          latest_deal_ymd: '',
          searched_deal_ymds: [],
          search_mode: 'latest',
          region_center: selectedRegion.center,
        });
        setSelectedPropertyId('');
        setMapStatus((current) => (current === 'missing_key' ? current : 'data_error'));
      })
      .finally(() => {
        if (!cancelled) setMarketLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  useEffect(() => {
    if (!NAVER_MAP_CLIENT_ID || !mapElementRef.current) {
      return undefined;
    }

    let mounted = true;
    setMapStatus('loading');

    loadNaverMapScript()
      .then((maps) => {
        if (!mounted || !mapElementRef.current || mapInstanceRef.current) return;

        const center = new maps.LatLng(selectedRegion.center.lat, selectedRegion.center.lng);
        mapInstanceRef.current = new maps.Map(mapElementRef.current, {
          center,
          zoom: 12,
          minZoom: 8,
          zoomControl: true,
          zoomControlOptions: {
            position: maps.Position.TOP_RIGHT,
          },
        });
        mapsApiRef.current = maps;
        setMapStatus('ready');
      })
      .catch(() => {
        if (mounted) setMapStatus('error');
      });

    return () => {
      mounted = false;
    };
  }, [selectedRegion.center.lat, selectedRegion.center.lng]);

  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapInstanceRef.current;
    if (!maps || !map || !['ready', 'data_error', 'fetching_data'].includes(mapStatus)) return;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    visibleDisplayProperties.forEach((item) => {
      const active = item.id === visibleSelectedProperty?.id;
      const width = active ? 104 : 94;
      const height = active ? 50 : 44;
      const marker = new maps.Marker({
        position: new maps.LatLng(item.lat, item.lng),
        map,
        title: item.name,
        zIndex: active ? 130 : 80,
        icon: {
          content: `
            <div style="
              position:relative;
              display:flex;
              flex-direction:column;
              align-items:center;
              width:${width}px;
              transform:translateY(-2px);
            ">
              <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                gap:4px;
                width:${width}px;
                min-height:${height}px;
                padding:7px 12px 8px;
                border-radius:18px;
                background:${active ? 'linear-gradient(135deg,#6D52E1,#9B7BFF)' : '#FFFFFF'};
                color:${active ? '#FFFFFF' : '#35245F'};
                border:2px solid ${active ? '#FFFFFF' : '#D8CCFF'};
                box-shadow:${active ? '0 18px 38px rgba(91,63,209,0.36)' : '0 14px 30px rgba(91,63,209,0.22)'};
                font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                white-space:nowrap;
              ">
                <span style="font-size:10px;font-weight:800;opacity:${active ? '0.82' : '0.58'};">월</span>
                <span style="font-size:${active ? '16px' : '14px'};font-weight:950;letter-spacing:0;">${item.monthly_rent ?? '-'}</span>
                <span style="font-size:10px;font-weight:850;opacity:${active ? '0.9' : '0.68'};">만</span>
              </div>
              <div style="
                width:12px;
                height:12px;
                margin-top:-6px;
                transform:rotate(45deg);
                border-right:2px solid ${active ? '#FFFFFF' : '#D8CCFF'};
                border-bottom:2px solid ${active ? '#FFFFFF' : '#D8CCFF'};
                background:${active ? '#7B60EA' : '#FFFFFF'};
                box-shadow:6px 6px 16px rgba(91,63,209,0.13);
              "></div>
              <div style="
                width:${active ? '10px' : '8px'};
                height:${active ? '10px' : '8px'};
                margin-top:3px;
                border-radius:9999px;
                background:${active ? '#6D52E1' : '#8A73F2'};
                border:2px solid #FFFFFF;
                box-shadow:0 4px 10px rgba(91,63,209,0.24);
              "></div>
            </div>
          `,
          anchor: new maps.Point(width / 2, active ? 72 : 66),
        },
      });

      maps.Event.addListener(marker, 'click', () => setSelectedPropertyId(item.id));
      markerRefs.current.push(marker);
    });

    if (searchedPlace) {
      markerRefs.current.push(
        new maps.Marker({
          position: new maps.LatLng(searchedPlace.lat, searchedPlace.lng),
          map,
          title: searchedPlace.label,
          zIndex: 160,
          icon: {
            content: `
              <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
                <div style="
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  width:94px;
                  height:34px;
                  padding:0 12px;
                  border-radius:9999px;
                  background:#201A3C;
                  color:#FFFFFF;
                  border:2px solid #FFFFFF;
                  box-shadow:0 14px 30px rgba(32,26,60,0.28);
                  font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                  font-size:12px;
                  font-weight:900;
                  white-space:nowrap;
                ">
                  검색 위치
                </div>
                <div style="
                  width:16px;
                  height:16px;
                  margin-top:-5px;
                  transform:rotate(45deg);
                  border-right:2px solid #FFFFFF;
                  border-bottom:2px solid #FFFFFF;
                  background:#201A3C;
                  box-shadow:6px 6px 16px rgba(32,26,60,0.18);
                "></div>
                <div style="
                  width:10px;
                  height:10px;
                  margin-top:3px;
                  border-radius:9999px;
                  background:#201A3C;
                  border:2px solid #FFFFFF;
                  box-shadow:0 4px 10px rgba(32,26,60,0.22);
                "></div>
              </div>
            `,
            anchor: new maps.Point(47, 68),
          },
        })
      );
    }

    maps.Event.trigger(map, 'resize');
    map.panTo(new maps.LatLng(mapCenter.lat, mapCenter.lng));
    map.setZoom(searchedPlace ? 14 : 12);
  }, [mapCenter, mapStatus, searchedPlace, visibleDisplayProperties, visibleSelectedProperty?.id]);

  function openRegionPicker({ keyword, options }) {
    const nextOptions = uniqueRegionOptions(options).slice(0, 5);
    if (nextOptions.length === 0) {
      throw new Error('연결할 지역을 찾지 못했어요.');
    }
    setSelectedPropertyId('');
    setPendingSearchKeyword(keyword);
    setRegionPickerOptions(nextOptions);
    setRegionPickerOpen(true);
  }

  function applyRegionChoice(option) {
    setSelectedRegion(option.region);
    setSearchedPlace(option.place || null);
    setSearchQuery(option.place?.label || option.region.label);
    setMarketError('');
    setRegionPickerOpen(false);
  }

  async function searchPlace(nextKeyword) {
    const keyword = nextKeyword.trim();
    if (!keyword) return;

    const matchedGuidePlace = GUIDE_PLACE_OPTIONS.find(
      (item) => item.label.includes(keyword) || item.query.includes(keyword) || keyword.includes(item.label)
    );
    const matchedRegions = REGION_OPTIONS.filter((item) => {
      const compactLabel = item.label.replace(/\s/g, '');
      const compactKeyword = keyword.replace(/\s/g, '');
      return item.label.includes(keyword) || keyword.includes(item.label) || compactLabel.includes(compactKeyword);
    });

    setSearchingPlace(true);
    setMarketError('');
    setSelectedPropertyId('');
    setRegionPickerOpen(false);

    try {
      const response = await fetch(`${API_BASE_URL}/map/geocode?query=${encodeURIComponent(keyword)}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'geocode_failed');

      const placeOptions = (body.items || [])
        .map((item) => {
          const apiRegion = normalizeApiRegion(item.region) || normalizeApiRegion(item.nearest_region);
          if (!apiRegion) return null;
          const label = item.road_address || item.jibun_address || keyword;
          return {
            region: apiRegion,
            place: {
              lat: item.lat,
              lng: item.lng,
              label,
            },
            title: apiRegion.label,
            subtitle: label,
          };
        })
        .filter(Boolean);

      const regionOptions = matchedRegions.map((region) => ({
        region,
        place: {
          lat: region.center.lat,
          lng: region.center.lng,
          label: region.label,
        },
        title: region.label,
        subtitle: '이 지역 최신 실거래가 보기',
      }));

      const guideOptions = matchedGuidePlace
        ? [
            {
              region: matchedGuidePlace.region,
              place: {
                lat: matchedGuidePlace.region.center.lat,
                lng: matchedGuidePlace.region.center.lng,
                label: matchedGuidePlace.query,
              },
              title: matchedGuidePlace.region.label,
              subtitle: `${matchedGuidePlace.label} 주변 최신 실거래가 보기`,
            },
          ]
        : [];

      openRegionPicker({
        keyword,
        options: [...placeOptions, ...guideOptions, ...regionOptions],
      });
    } catch (error) {
      setMarketError(error.message || '위치를 찾지 못했어요.');
    } finally {
      setSearchingPlace(false);
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await searchPlace(searchQuery.trim());
  }

  function selectRegion(region) {
    setSelectedRegion(region);
    setSearchQuery(region.label);
    setSearchedPlace(null);
    setMarketError('');
  }

  return (
    <Shell>
      <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2FF_42%,#F3EEFF_100%)] pb-28">
        <section className="px-[18px] pt-5">
          <div className="rounded-[30px] border border-[#EEE7FF] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(109,82,225,0.10)]">
            <p className="text-[12px] font-bold text-[#8B7FD8]">지도 탐색</p>
            <h1 className="mt-1 text-[25px] font-black leading-tight text-[#17132B]">
              위치를 검색하고
              <br />
              주변 전월세를 비교해요
            </h1>
            <form onSubmit={handleSearchSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="지역, 학교, 역 이름 검색"
                  className="h-12 min-w-0 flex-1 rounded-[18px] border border-[#E7DEFF] bg-[#FCFAFF] px-4 text-[14px] font-semibold text-[#241B44] outline-none placeholder:text-[#A9A0C9]"
                />
                <button
                  type="submit"
                  className="h-12 rounded-[18px] bg-[#6D52E1] px-4 text-[13px] font-black text-white shadow-[0_10px_24px_rgba(109,82,225,0.24)]"
                >
                  {searchingPlace ? '검색 중' : '검색'}
                </button>
              </div>
            </form>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <StatCard
                label="평균 월세"
                value={hideMarketDetails ? '-' : `${visibleSummary.avg_monthly_rent || 0}만`}
                tone="bg-[#F7F2FF]"
              />
              <StatCard
                label="평균 보증금"
                value={hideMarketDetails ? '-' : `${visibleSummary.avg_deposit || 0}만`}
                tone="bg-[#F5FAFF]"
              />
              <StatCard
                label="거래 건수"
                value={hideMarketDetails ? '-' : `${visibleSummary.count || marketData.items?.length || 0}건`}
                tone="bg-[#FFF7F3]"
              />
            </div>
          </div>
        </section>

        <section className="mt-4 px-[18px]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MONTHLY_RENT_FILTERS.map((item) => (
              <FilterChip
                key={item.value}
                active={monthlyRentFilter === item.value}
                label={item.label}
                onClick={() => setMonthlyRentFilter(item.value)}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {DEPOSIT_FILTERS.map((item) => (
              <FilterChip
                key={item.value}
                active={depositFilter === item.value}
                label={item.label}
                onClick={() => setDepositFilter(item.value)}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 px-[18px]">
          <div className="rounded-[28px] border border-[#E7DEFF] bg-white p-4 shadow-[0_14px_34px_rgba(98,81,168,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-black text-[#1A1730]">
                  {hideMarketDetails ? '검색 지역 선택 중' : searchedPlace ? '검색한 위치' : selectedRegion.label}
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-[#7A74A8]">{getStatusMessage(mapStatus)}</p>
                {searchedPlace ? (
                  <p className="mt-1 text-[11px] text-[#9088B4]">{searchedPlace.label}</p>
                ) : null}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                  mapStatus === 'ready'
                    ? 'bg-[#EAF9F2] text-[#19805A]'
                    : mapStatus === 'error' || mapStatus === 'data_error'
                      ? 'bg-[#FDE8EF] text-[#C22A5A]'
                      : 'bg-[#F2EDFF] text-[#5B3FD1]'
                }`}
              >
                {mapStatus === 'ready'
                  ? 'LIVE'
                  : mapStatus === 'error' || mapStatus === 'data_error'
                    ? 'ERROR'
                    : mapStatus === 'missing_key'
                      ? 'KEY'
                      : 'LOADING'}
              </span>
            </div>

            <div className="relative mt-4 h-[68vh] min-h-[520px] overflow-hidden rounded-[26px] border border-[#ECE5FF] bg-[#F3EEFF]">
              <div ref={mapElementRef} className="h-full w-full" />

              {mapStatus !== 'ready' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
                  <div className="max-w-[280px] rounded-[24px] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(98,81,168,0.14)]">
                    <p className="text-[15px] font-black text-[#1F2937]">
                      {mapStatus === 'missing_key'
                        ? '네이버 지도 키가 필요해요'
                        : mapStatus === 'error'
                          ? '지도 연결을 확인해주세요'
                          : '지도를 준비하고 있어요'}
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#6B7280]">
                      {mapStatus === 'missing_key'
                        ? 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 값을 설정하면 지도가 표시됩니다.'
                        : mapStatus === 'error'
                          ? '네이버 클라우드의 허용 도메인과 Client ID를 확인해주세요.'
                          : '잠시만 기다려주세요.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {mapStatus === 'ready' && visibleSelectedProperty ? (
                <div className="absolute bottom-4 left-4 right-4 rounded-[22px] bg-white/95 p-4 shadow-[0_16px_36px_rgba(17,24,39,0.16)] backdrop-blur">
                  <p className="text-[13px] font-black text-[#201A3C]">{visibleSelectedProperty.name}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[14px] bg-[#F7F2FF] py-2">
                      <p className="text-[10px] text-[#8177A8]">월세</p>
                      <p className="text-[13px] font-black text-[#5B3FD1]">{visibleSelectedProperty.monthly_rent ?? '-'}만</p>
                    </div>
                    <div className="rounded-[14px] bg-[#F5FAFF] py-2">
                      <p className="text-[10px] text-[#8177A8]">보증금</p>
                      <p className="text-[13px] font-black text-[#4265D9]">{visibleSelectedProperty.deposit ?? '-'}만</p>
                    </div>
                    <div className="rounded-[14px] bg-[#FFF7F3] py-2">
                      <p className="text-[10px] text-[#8177A8]">면적</p>
                      <p className="text-[13px] font-black text-[#C66A3D]">{visibleSelectedProperty.area_m2 ?? '-'}m²</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-4 px-[18px]">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[15px] font-black text-[#1A1730]">실거래가 목록</p>
              <p className="mt-1 text-[11.5px] font-semibold text-[#7A74A8]">
                {hideMarketDetails ? '검색 지역을 먼저 선택해 주세요' : `${selectedRegion.label} 기준 ${formatDealPeriod(marketData)}`}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#6D52E1] shadow-[0_8px_18px_rgba(109,82,225,0.10)]">
              {hideMarketDetails ? '선택 전' : `${filteredProperties.length}건`}
            </span>
          </div>

          {hideMarketDetails ? (
            <div className="mt-3 rounded-[24px] bg-white px-4 py-6 text-center shadow-[0_12px_30px_rgba(98,81,168,0.08)]">
              <p className="text-[14px] font-black text-[#2A214A]">
                {searchingPlace ? '검색 결과를 확인하고 있어요' : '지역을 선택하면 최신 거래가 보여요'}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#7A74A8]">
                이전 지역의 실거래 목록은 잠시 숨겨둘게요.
              </p>
            </div>
          ) : marketError ? (
            <div className="mt-3 rounded-[22px] border border-[#F3C7D4] bg-[#FFF4F7] px-4 py-4 text-[13px] font-semibold text-[#B32652]">
              {marketError}
            </div>
          ) : null}

          {!hideMarketDetails && marketLoading ? (
            <div className="mt-3 rounded-[24px] bg-white px-4 py-6 text-center text-[13px] font-bold text-[#7A74A8] shadow-[0_12px_30px_rgba(98,81,168,0.08)]">
              실거래가를 불러오는 중이에요
            </div>
          ) : null}

          {!hideMarketDetails && !marketLoading && filteredProperties.length === 0 ? (
            <div className="mt-3 rounded-[24px] bg-white px-4 py-6 text-center shadow-[0_12px_30px_rgba(98,81,168,0.08)]">
              <p className="text-[14px] font-black text-[#2A214A]">조건에 맞는 거래가 아직 없어요</p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#7A74A8]">
                다른 지역이나 가격 필터로 다시 확인해보세요.
              </p>
            </div>
          ) : null}

          <div className="mt-3 space-y-2.5">
            {!hideMarketDetails && filteredProperties.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPropertyId(item.id)}
                className={`w-full rounded-[24px] border bg-white px-4 py-4 text-left shadow-[0_12px_28px_rgba(98,81,168,0.07)] transition ${
                  selectedProperty?.id === item.id
                    ? 'border-[#8A73F2] ring-2 ring-[#E4DCFF]'
                    : 'border-[#EEE8FF]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#201A3C]">{item.name}</p>
                    <p className="mt-1 truncate text-[11.5px] font-semibold text-[#8177A8]">{getItemAddress(item)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F4F0FF] px-2.5 py-1 text-[10px] font-black text-[#6D52E1]">
                    {item.contract_date || '최근'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[14px] bg-[#F7F2FF] py-2">
                    <p className="text-[10px] text-[#8177A8]">월세</p>
                    <p className="text-[13px] font-black text-[#5B3FD1]">{item.monthly_rent ?? '-'}만</p>
                  </div>
                  <div className="rounded-[14px] bg-[#F5FAFF] py-2">
                    <p className="text-[10px] text-[#8177A8]">보증금</p>
                    <p className="text-[13px] font-black text-[#4265D9]">{item.deposit ?? '-'}만</p>
                  </div>
                  <div className="rounded-[14px] bg-[#FFF7F3] py-2">
                    <p className="text-[10px] text-[#8177A8]">층/면적</p>
                    <p className="text-[13px] font-black text-[#C66A3D]">
                      {item.floor ?? '-'}층 · {item.area_m2 ?? '-'}m²
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
      {regionPickerOpen ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-[rgba(17,14,35,0.34)] px-5 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
          <div className="max-h-[74vh] w-full max-w-[380px] overflow-y-auto rounded-[30px] border border-[#F0E9FF] bg-white px-5 py-5 shadow-[0_24px_70px_rgba(30,21,69,0.24)]">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E9E1FF]" />
            <p className="text-[12px] font-bold text-[#8B7FD8]">검색 지역 선택</p>
            <h3 className="mt-1 text-[19px] font-black leading-tight text-[#17132B]">
              어느 지역의 최신 거래를
              <br />
              지도에 띄울까요?
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#7A74A8]">
              `{pendingSearchKeyword}` 검색 결과와 가까운 지역을 골라주세요.
            </p>

            <div className="mt-4 space-y-2.5">
              {regionPickerOptions.map((option) => (
                <button
                  key={`${option.region.lawdCode}-${option.subtitle}`}
                  type="button"
                  onClick={() => applyRegionChoice(option)}
                  className="w-full rounded-[20px] border border-[#EEE8FF] bg-[#FCFAFF] px-4 py-3.5 text-left transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-black text-[#241B44]">{option.title}</p>
                      <p className="mt-1 truncate text-[11.5px] font-semibold text-[#8B83AB]">
                        {option.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#6D52E1] px-3 py-1.5 text-[11px] font-black text-white">
                      선택
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setRegionPickerOpen(false)}
              className="mt-3 w-full rounded-[18px] border border-[#E6DEFF] bg-white px-4 py-3 text-[13px] font-bold text-[#6C668D]"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
