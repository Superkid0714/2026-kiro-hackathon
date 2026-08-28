'use client';
import { CHARACTERS } from './config';

/**
 * 하단 캐릭터 선택 영역.
 *
 * - CHARACTERS 배열로 관리 (하드코딩 JSX 반복 X)
 * - 선택된 캐릭터: 확대 + 테두리 + 그림자 / 나머지: 축소 + 반투명
 * - 게임 드래그 영역과 별도 DOM. onPointerDown 전파도 막아 드래그가 시작되지 않게 분리
 * - touch-action 은 기본값 → 이 영역에서는 정상 터치/스크롤 가능
 * - 5개가 모바일 한 줄에 들어가도록 flex-1 + gap 으로 반응형 처리
 */
export default function GhostSelector({ selectedId, onSelect }) {
  return (
    <nav
      aria-label="캐릭터 선택"
      className="relative z-10 shrink-0 px-4 pb-7 pt-3"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-end justify-center gap-2">
        {CHARACTERS.map((character) => {
          const active = character.id === selectedId;
          return (
            <button
              key={character.id}
              type="button"
              aria-pressed={active}
              aria-label={character.name}
              onClick={() => onSelect(character.id)}
              className={`flex flex-1 items-center justify-center rounded-2xl p-1.5 transition-all duration-200 ${
                active
                  ? 'scale-110 border-[1.5px] border-white/70 bg-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.35)]'
                  : 'scale-90 border-[1.5px] border-transparent opacity-45 hover:opacity-75'
              }`}
            >
              <img
                src={character.image}
                alt={character.name}
                draggable={false}
                className="pointer-events-none aspect-square w-full max-w-[46px] select-none object-contain"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
