'use client';
import { GHOST_IMAGE, SPRING_MS, SPRING_EASE } from './config';

/**
 * 유령 캐릭터 표시 전용 컴포넌트.
 *
 * 가로/세로를 독립적으로 늘린다.
 * - 한 축을 늘리면 그만큼 다른 축은 살짝 좁아진다(부피 보존 → 말랑한 젤리 느낌).
 *   scaleX = (1 + stretchX) / sqrt(1 + stretchY),  scaleY 는 대칭.
 *   (기존 1축 로직 `scaleX = 1 / sqrt(scaleY)` 을 2축으로 일반화한 것)
 * - 잡은 지점이 손가락을 따라오도록 축별로 살짝 이동(drift)시킨다.
 *
 * @param {number}  stretchX     0 ~ MAX_STRETCH (가로)
 * @param {number}  stretchY     0 ~ MAX_STRETCH (세로)
 * @param {number}  driftX       가로 이동 px
 * @param {number}  driftY       세로 이동 px
 * @param {boolean} dragging     드래그 중이면 transition 없이 즉시 반영
 * @param {boolean} reduceMotion 모션 최소화 선호 시 스프링을 짧게
 * @param {string}  [image]      캐릭터 이미지 경로 (없으면 기본 유령)
 */
export default function Ghost({
  stretchX = 0,
  stretchY = 0,
  driftX = 0,
  driftY = 0,
  dragging = false,
  reduceMotion = false,
  image = GHOST_IMAGE,
}) {
  const rawX = 1 + stretchX;
  const rawY = 1 + stretchY;
  const scaleX = rawX / Math.sqrt(rawY);
  const scaleY = rawY / Math.sqrt(rawX);

  const transition = dragging
    ? 'none'
    : `transform ${reduceMotion ? 160 : SPRING_MS}ms ${reduceMotion ? 'ease-out' : SPRING_EASE}`;

  return (
    <img
      src={image}
      alt="유령"
      draggable={false}
      className="pointer-events-none w-[46vw] max-w-[190px] select-none"
      style={{
        transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'center center',
        transition,
        willChange: 'transform',
      }}
    />
  );
}
