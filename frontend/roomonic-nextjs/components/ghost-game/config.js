// 유령 늘리기 게임 설정값.
// 리소스 경로는 실제 public/game/ 폴더 파일 기준.

// 선택 가능한 유령 캐릭터 (public/game/ 실측: UNI/Dudi/Pee/Roo/momo.png)
export const CHARACTERS = [
  { id: 'uni', name: 'UNI', image: '/game/UNI.png' },
  { id: 'dudi', name: 'Dudi', image: '/game/Dudi.png' },
  { id: 'pee', name: 'Pee', image: '/game/Pee.png' },
  { id: 'roo', name: 'Roo', image: '/game/Roo.png' },
  { id: 'momo', name: 'Momo', image: '/game/momo.png' },
];
export const DEFAULT_CHARACTER_ID = 'uni';

// 기존 코드 호환용(직접 import 하던 곳이 있을 수 있어 유지)
export const GHOST_IMAGE = CHARACTERS[0].image;

// 한글 파일명 → URL 안전하게 인코딩
// (캐릭터별 다른 소리가 필요해지면 CHARACTERS 항목에 sounds 를 추가해 확장 가능)
export const STRETCH_SOUNDS = ['/game/왁뿌1.mp3', '/game/왁뿌2.mp3', '/game/왁뿌3.mp3'].map((p) =>
  encodeURI(p),
);

// 드래그 → 늘어남 변환 (가로/세로 축에 공통 적용)
export const MIN_DRAG_PX = 14; // 이 거리 이하 이동은 무시 (미세 흔들림 방지 / dead zone)
export const MAX_DRAG_PX = 300; // 이 거리 이상은 클램프
export const MAX_STRETCH = 1.35; // 한 축의 최대 늘어남. scale 최대 ≈ 2.35배

// 놓았을 때 되돌아오는 탄성 애니메이션
export const SPRING_MS = 700;
export const SPRING_EASE = 'cubic-bezier(0.34, 1.3, 0.5, 1)'; // 살짝 overshoot 후 안착
