// Word Rush 상수 (public/game/ 실제 PNG 사용)
export const WR_CHARACTERS = [
  { id: 'dudi', name: 'Dudi', image: '/game/Dudi.png' },
  { id: 'momo', name: 'momo', image: '/game/momo.png' },
  { id: 'pee', name: 'Pee', image: '/game/Pee.png' },
  { id: 'roo', name: 'Roo', image: '/game/Roo.png' },
  { id: 'uni', name: 'UNI', image: '/game/UNI.png' },
];

export const GAME_DURATION = 60; // 초
export const COUNTDOWN_FROM = 3;
export const DEFAULT_TASK_TITLE = '오늘의 집안일';
export const MAX_NICKNAME = 8;
export const MAX_TASK_TITLE = 16;

// 게임 전체 흐름
export const STATUS = {
  SETUP: 'setup',
  READY: 'ready',
  P1_COUNTDOWN: 'p1-countdown',
  P1_PLAYING: 'p1-playing',
  P1_RESULT: 'p1-result',
  P2_COUNTDOWN: 'p2-countdown',
  P2_PLAYING: 'p2-playing',
  P2_RESULT: 'p2-result',
  FINAL: 'final',
};
