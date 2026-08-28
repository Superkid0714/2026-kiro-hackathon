'use client';

/**
 * 게임 화면 상단 헤더.
 * Roomonic 브랜드 요소(방패 SVG + Gaegu 워드마크)는 app/page.js 에서 쓰는 것과 동일하게 재사용.
 * 새 로고를 임의로 만들지 않는다.
 */
export default function GameHeader() {
  return (
    <header className="relative z-10 shrink-0 px-6 pt-10 text-center">
      <svg
        width="26"
        height="26"
        viewBox="0 0 40 40"
        className="mx-auto mb-1.5"
        aria-hidden="true"
      >
        <path
          d="M20 4 L34 16 V33 A3 3 0 0 1 31 36 H9 A3 3 0 0 1 6 33 V16 Z"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="22" r="3.2" fill="#fff" />
      </svg>
      <p className="font-gaegu text-2xl font-bold leading-none text-white">Roomonic</p>
      <h1 className="mt-3 text-[16px] font-bold text-white">스트레스를 풀어보세요!</h1>
      <p className="mt-1 text-[12.5px] text-white/60">유령을 마음껏 늘려보세요 👻</p>
    </header>
  );
}
