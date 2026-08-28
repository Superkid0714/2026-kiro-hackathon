'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Ghost from './Ghost';
import useStretchAudio from './useStretchAudio';
import { MAX_DRAG_PX, MAX_STRETCH, MIN_DRAG_PX, STRETCH_SOUNDS } from './config';

/**
 * 유령 늘리기 게임 본체.
 *
 * Pointer Events(마우스/터치 통합) + setPointerCapture 로 드래그를 추적한다.
 * - pointerdown       : 캡처 시작, 기준 좌표 저장, 효과음 재생 시작
 * - pointermove       : 가로·세로 이동량 → (데드존/최대치 클램프/ease) → 축별 늘어난 정도, 효과음 변조
 * - pointerup/cancel  : 캡처 해제, 원래 크기로 탄성 복귀, 효과음 페이드아웃
 *
 * 끝나는 개념 없이 계속 늘렸다 놓을 수 있다.
 * 캐릭터(characterImage)가 바뀌어도 늘리기 로직/오디오는 그대로 동작한다.
 */

// 한 축의 이동량(px) → 0~1 로 정규화 (dead zone + 클램프 + ease-out)
function axisStretch(deltaPx) {
  const span = MAX_DRAG_PX - MIN_DRAG_PX;
  const effective = Math.min(Math.max(Math.abs(deltaPx) - MIN_DRAG_PX, 0), span);
  const norm = span > 0 ? effective / span : 0;
  return 1 - (1 - norm) * (1 - norm);
}

export default function GhostStretchGame({ characterImage }) {
  const [stretchX, setStretchX] = useState(0);
  const [stretchY, setStretchY] = useState(0);
  const [driftX, setDriftX] = useState(0);
  const [driftY, setDriftY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const originRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const draggingRef = useRef(false);
  const audio = useStretchAudio(STRETCH_SOUNDS);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    setReduceMotion(mq.matches);
    const onChange = (event) => setReduceMotion(event.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      originRef.current = { x: event.clientX, y: event.clientY };
      lastMoveRef.current = { x: event.clientX, y: event.clientY, t: performance.now() };
      draggingRef.current = true;
      setDragging(true);
      setShowHint(false);
      audio.start();
    },
    [audio],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!draggingRef.current) return;

      const dx = event.clientX - originRef.current.x;
      const dy = event.clientY - originRef.current.y;
      const ax = axisStretch(dx); // 0~1
      const ay = axisStretch(dy); // 0~1

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveRef.current.t);
      const velocity =
        (Math.hypot(event.clientX - lastMoveRef.current.x, event.clientY - lastMoveRef.current.y) /
          dt) *
        1000;
      lastMoveRef.current = { x: event.clientX, y: event.clientY, t: now };

      setStretchX(ax * MAX_STRETCH);
      setStretchY(ay * MAX_STRETCH);
      setDriftX((dx >= 0 ? 1 : -1) * ax * MAX_STRETCH * 34);
      setDriftY((dy >= 0 ? 1 : -1) * ay * MAX_STRETCH * 34);

      audio.update(Math.min(1, Math.hypot(ax, ay)), velocity);
    },
    [audio],
  );

  const handleRelease = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      draggingRef.current = false;
      setDragging(false);
      setStretchX(0);
      setStretchY(0);
      setDriftX(0);
      setDriftY(0);
      audio.stop();
    },
    [audio],
  );

  return (
    <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden">
      {/* 드래그 영역: 손가락 조작이 쉽도록 여유 있는 패딩, touch-none 으로 스크롤 충돌 방지 */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handleRelease}
        onPointerCancel={handleRelease}
        className="cursor-grab touch-none select-none p-14 active:cursor-grabbing"
      >
        <Ghost
          image={characterImage}
          stretchX={stretchX}
          stretchY={stretchY}
          driftX={driftX}
          driftY={driftY}
          dragging={dragging}
          reduceMotion={reduceMotion}
        />
      </div>

      <p
        className={`pointer-events-none absolute bottom-6 left-0 right-0 text-center font-noto text-[12px] tracking-wide text-white/45 transition-opacity duration-500 ${
          showHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ← ↑ ↓ → 자유롭게 늘려보세요
      </p>
    </div>
  );
}
