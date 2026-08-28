'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * 유령을 늘리는 동안 재생할 ASMR 효과음 관리 훅.
 *
 * - 드래그 시작(start)에서 한 곡을 loop 재생 → 드래그 내내 끊김 없이 이어진다.
 * - 매번 다른 클립을 순환 선택 + 재생 속도 미세 랜덤 → 같은 소리 반복이 덜 부자연스럽다.
 * - update(intensity, velocity)로 늘어난 정도/속도에 따라 볼륨·피치를 실시간 변조.
 * - 놓으면(stop) 볼륨을 짧게 페이드아웃하고 정지 → 뚝 끊기지 않는다.
 * - 첫 재생이 pointerdown(사용자 제스처) 안에서 일어나므로 autoplay 정책에 걸리지 않는다.
 *
 * @param {string[]} sources 효과음 파일 경로 배열 (모듈 상수로 전달할 것)
 */
export default function useStretchAudio(sources) {
  const poolRef = useRef([]);
  const idxRef = useRef(0);
  const activeRef = useRef(null);
  const fadeRef = useRef(null);

  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof Audio === 'undefined') return undefined;

    const pool = sources.map((src) => {
      const el = new Audio(src);
      el.preload = 'auto';
      el.loop = true;
      return el;
    });
    poolRef.current = pool;

    return () => {
      clearFade();
      pool.forEach((el) => {
        el.pause();
        el.src = '';
      });
      poolRef.current = [];
      activeRef.current = null;
    };
  }, [sources, clearFade]);

  const start = useCallback(() => {
    const pool = poolRef.current;
    if (!pool.length) return;

    clearFade();
    if (activeRef.current) activeRef.current.pause();

    const el = pool[idxRef.current % pool.length];
    idxRef.current += 1;
    activeRef.current = el;

    el.currentTime = 0;
    el.volume = 0.5;
    el.playbackRate = 0.96 + Math.random() * 0.1;

    const played = el.play();
    if (played && typeof played.catch === 'function') played.catch(() => {});
  }, [clearFade]);

  const update = useCallback((intensity, velocity) => {
    const el = activeRef.current;
    if (!el) return;
    el.volume = Math.min(1, 0.3 + intensity * 0.65);
    el.playbackRate = Math.min(1.6, 0.92 + (velocity || 0) / 700);
  }, []);

  const stop = useCallback(() => {
    const el = activeRef.current;
    if (!el) return;
    clearFade();
    fadeRef.current = window.setInterval(() => {
      const next = el.volume - 0.1;
      if (next <= 0.02) {
        el.volume = 0;
        el.pause();
        clearFade();
      } else {
        el.volume = next;
      }
    }, 24);
  }, [clearFade]);

  return useMemo(() => ({ start, update, stop }), [start, update, stop]);
}
