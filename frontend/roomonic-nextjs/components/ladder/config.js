// 사다리 타기 게임 설정. public/game/ 실제 PNG 사용.
export const LADDER_CHARACTERS = [
  { id: 'dudi', name: 'Dudi', image: '/game/Dudi.png' },
  { id: 'momo', name: 'momo', image: '/game/momo.png' },
  { id: 'pee', name: 'Pee', image: '/game/Pee.png' },
  { id: 'roo', name: 'Roo', image: '/game/Roo.png' },
  { id: 'uni', name: 'UNI', image: '/game/UNI.png' },
];

// SVG 좌표계
export const BOARD = {
  width: 240,
  height: 384,
  top: 22,
  bottom: 320,
  colX: [56, 184],
  rows: 6, // 가로 발판 후보 개수
  rungChance: 0.5,
};

export const DRAW_MS = 1700; // ladder.css 의 애니메이션 시간과 맞춰야 함

// 사다리 1판 생성: 발판 위치 + 두 시작점의 경로 + '담당' 도착칸
export function buildLadder() {
  const { rows, rungChance, top, bottom, colX } = BOARD;
  const step = (bottom - top) / (rows + 1);

  const rungs = Array.from({ length: rows }, () => Math.random() < rungChance);
  if (!rungs.some(Boolean)) rungs[Math.floor(Math.random() * rows)] = true;

  const trace = (startCol) => {
    let col = startCol;
    const points = [[colX[col], top]];
    for (let r = 0; r < rows; r += 1) {
      if (rungs[r]) {
        const y = top + step * (r + 1);
        points.push([colX[col], y]);
        col = 1 - col;
        points.push([colX[col], y]);
      }
    }
    points.push([colX[col], bottom]);
    return { points, endCol: col };
  };

  const rungYs = rungs
    .map((on, r) => (on ? top + step * (r + 1) : null))
    .filter((y) => y !== null);

  return {
    rungYs,
    targetCol: Math.random() < 0.5 ? 0 : 1, // 아래쪽 어느 칸이 '담당'인지
    paths: [trace(0), trace(1)],
  };
}
