'use client';
import { useCallback, useRef, useState } from 'react';
import GameCard from './GameCard';
import CarouselIndicator from './CarouselIndicator';

const SWIPE_THRESHOLD = 46; // 이 이상(px) 끌면 카드 전환

const clamp = (value, max) => Math.max(0, Math.min(max, value));

/**
 * 게임 카드 캐러셀. 새 라이브러리 없이 Pointer Events + transform 으로 구현.
 * - 좌우 스와이프(마우스 드래그 / 터치) 로 이전·다음 게임 이동
 * - touch-action: pan-y → 세로 스크롤은 유지하고 가로 제스처만 캡처
 * - 하단 indicator 클릭으로도 이동
 * - 한 화면에 카드 하나, 전환 애니메이션 적용
 */
export default function GameCarousel({ games, onGameStart, className = '' }) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startXRef = useRef(0);
  const widthRef = useRef(1);
  const draggingRef = useRef(false);

  const lastIndex = games.length - 1;

  const handlePointerDown = useCallback((event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    widthRef.current = event.currentTarget.clientWidth || 1;
    startXRef.current = event.clientX;
    draggingRef.current = true;
    setDragging(true);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!draggingRef.current) return;
    setDragPx(event.clientX - startXRef.current);
  }, []);

  const handlePointerUp = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      draggingRef.current = false;
      const dx = event.clientX - startXRef.current;
      setDragging(false);
      setDragPx(0);
      if (dx <= -SWIPE_THRESHOLD) setIndex((i) => clamp(i + 1, lastIndex));
      else if (dx >= SWIPE_THRESHOLD) setIndex((i) => clamp(i - 1, lastIndex));
    },
    [lastIndex],
  );

  const basePercent = -index * 100;
  const dragPercent = (dragPx / widthRef.current) * 100;

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className="relative h-[300px] overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(calc(${basePercent}% + ${dragPercent}%))`,
            transition: dragging ? 'none' : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {games.map((game) => (
            <div key={game.id} className="flex h-full w-full shrink-0 items-center px-1">
              <GameCard game={game} onStart={() => onGameStart(game.id)} />
            </div>
          ))}
        </div>
      </div>

      <CarouselIndicator
        count={games.length}
        active={index}
        onSelect={(i) => setIndex(clamp(i, lastIndex))}
        className="mt-5"
      />
    </div>
  );
}
