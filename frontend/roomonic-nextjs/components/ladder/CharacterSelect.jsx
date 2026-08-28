'use client';
import { Button } from '@/components/UI';
import { LADDER_CHARACTERS } from './config';

/**
 * 캐릭터 5개 중 2개 선택 (선택 순서 = 사다리 시작 위치: 1번째 왼쪽, 2번째 오른쪽).
 * 이미 고른 캐릭터 재클릭 시 선택 해제.
 */
export default function CharacterSelect({ selectedIds, onToggle, onStart }) {
  const chosen = selectedIds
    .map((id) => LADDER_CHARACTERS.find((character) => character.id === id))
    .filter(Boolean);
  const canStart = selectedIds.length === 2;

  return (
    <div className="flex flex-1 flex-col px-[22px] pb-8">
      <h1 className="mt-3 text-center font-gaegu text-[28px] font-bold tracking-wide text-indigo">
        사다리 타기
      </h1>
      <p className="mt-1 text-center text-[13px] font-bold text-ink">참가할 캐릭터 2명을 골라주세요!</p>
      <p className="mt-0.5 text-center text-[11px] text-inkFaint">먼저 고른 캐릭터가 왼쪽에서 출발해요</p>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {LADDER_CHARACTERS.map((character) => {
          const order = selectedIds.indexOf(character.id);
          const isSelected = order !== -1;
          const isDisabled = !isSelected && selectedIds.length >= 2;
          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onToggle(character.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center rounded-2xl border-[1.5px] p-2 transition ${
                isSelected
                  ? 'border-indigo bg-lavenderSoft'
                  : isDisabled
                    ? 'border-line bg-white opacity-40'
                    : 'border-line bg-white active:scale-95'
              }`}
            >
              {isSelected ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo text-[10px] font-bold text-white">
                  {order + 1}
                </span>
              ) : null}
              <img
                src={character.image}
                alt={character.name}
                draggable={false}
                className="h-12 w-12 select-none object-contain"
              />
              <span className="mt-1 text-[11px] font-bold text-ink">{character.name}</span>
            </button>
          );
        })}
      </div>

      {chosen.length > 0 ? (
        <div className="mt-7 flex justify-center gap-8">
          {chosen.map((character, index) => (
            <div key={character.id} className="flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest text-indigo">
                {index === 0 ? '왼쪽' : '오른쪽'}
              </span>
              <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-lavenderSoft">
                <img
                  src={character.image}
                  alt={character.name}
                  draggable={false}
                  className="h-[80%] w-[80%] select-none object-contain"
                />
              </div>
              <span className="mt-1 text-[11px] font-bold text-ink">{character.name}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-7">
        <Button
          onClick={onStart}
          disabled={!canStart}
          className={canStart ? '' : 'pointer-events-none opacity-40'}
        >
          사다리 만들기
        </Button>
      </div>
    </div>
  );
}
