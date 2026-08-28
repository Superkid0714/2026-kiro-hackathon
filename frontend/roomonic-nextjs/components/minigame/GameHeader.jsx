'use client';

/**
 * 게임 메인 화면 상단.
 * 왼쪽: Roomonic 브랜드(방패 SVG + Gaegu 워드마크, app/page.js 와 동일 재사용)
 * 오른쪽: 돌아가기 버튼 (router.back 은 부모에서 주입)
 */
export default function GameHeader({ onBack }) {
  return (
    <header className="flex items-center justify-between pt-4">
      <span className="flex items-center gap-1.5">
        <svg width="18" height="18" viewBox="0 0 40 40" aria-hidden="true">
          <path
            d="M20 4 L34 16 V33 A3 3 0 0 1 31 36 H9 A3 3 0 0 1 6 33 V16 Z"
            fill="none"
            stroke="#5B4FCF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="22" r="3.2" fill="#5B4FCF" />
        </svg>
        <span className="font-gaegu text-[19px] font-bold text-indigo">Roomonic</span>
      </span>

      <button
        type="button"
        onClick={onBack}
        className="text-[12.5px] font-semibold text-inkSoft transition-colors hover:text-indigo"
      >
        돌아가기
      </button>
    </header>
  );
}
