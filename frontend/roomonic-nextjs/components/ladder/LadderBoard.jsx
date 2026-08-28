'use client';
import { BOARD } from './config';

const PATH_COLOR = ['#5B4FCF', '#F3A9D2']; // 왼쪽(indigo), 오른쪽(pink)

/**
 * 사다리 SVG. 세로 레일 2개 + 가로 발판 + (animate 시) 두 캐릭터의 경로 트레이스.
 * revealResult 시 아래쪽 담당/면제 칸 노출.
 */
export default function LadderBoard({ ladder, animate, revealResult }) {
  const { width, height, top, bottom, colX } = BOARD;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto h-full max-h-[320px] w-auto"
      role="img"
      aria-label="사다리"
    >
      {/* 세로 레일 */}
      {colX.map((x) => (
        <line key={x} x1={x} y1={top} x2={x} y2={bottom} stroke="#E8E4FA" strokeWidth="4" strokeLinecap="round" />
      ))}

      {/* 가로 발판 */}
      {ladder.rungYs.map((y) => (
        <line key={y} x1={colX[0]} y1={y} x2={colX[1]} y2={y} stroke="#E8E4FA" strokeWidth="4" strokeLinecap="round" />
      ))}

      {/* 경로 */}
      {animate
        ? ladder.paths.map((path, i) => (
            <polyline
              key={PATH_COLOR[i]}
              className="ladder-path"
              points={path.points.map((point) => point.join(',')).join(' ')}
              fill="none"
              stroke={PATH_COLOR[i]}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
            />
          ))
        : null}

      {/* 아래쪽 결과 칸 */}
      {[0, 1].map((col) => {
        const isDuty = ladder.targetCol === col;
        return (
          <g key={col} opacity={revealResult ? 1 : 0} className={revealResult ? 'ladder-pop' : undefined}>
            <rect
              x={colX[col] - 32}
              y={bottom + 6}
              width="64"
              height="30"
              rx="9"
              fill={isDuty ? '#FDE1E9' : '#E1F6EC'}
            />
            <text
              x={colX[col]}
              y={bottom + 25}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill={isDuty ? '#C22A5A' : '#1E8A62'}
            >
              {isDuty ? '담당 😵' : '면제 🎉'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
