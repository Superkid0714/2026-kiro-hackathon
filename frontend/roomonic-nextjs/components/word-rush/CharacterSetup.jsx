'use client';
import { Button } from '@/components/UI';
import { MAX_NICKNAME, MAX_TASK_TITLE, WR_CHARACTERS } from './config';

/**
 * 캐릭터 2명 선택(순서 = 플레이어 번호) + 닉네임 입력 + 담당 업무 입력.
 */
export default function CharacterSetup({
  selectedIds,
  onToggleCharacter,
  nicknames,
  onNicknameChange,
  taskTitle,
  onTaskTitleChange,
  onStart,
}) {
  const chosen = selectedIds
    .map((id) => WR_CHARACTERS.find((character) => character.id === id))
    .filter(Boolean);

  const canStart =
    selectedIds.length === 2 && chosen.every((character) => (nicknames[character.id] || '').trim());

  return (
    <div className="flex flex-1 flex-col px-[22px] pb-8">
      <h1 className="mt-3 text-center font-gaegu text-[30px] font-bold tracking-wide text-indigo">
        WORD RUSH
      </h1>
      <p className="mt-1 text-center text-[13px] font-bold text-ink">
        함께 플레이할 캐릭터 2명을 골라주세요!
      </p>
      <p className="mt-0.5 text-center text-[11px] text-inkFaint">먼저 고른 캐릭터가 PLAYER 1이에요</p>

      {/* 담당 업무 */}
      <div className="mt-5 flex flex-col items-center">
        <input
          value={taskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value.slice(0, MAX_TASK_TITLE))}
          maxLength={MAX_TASK_TITLE}
          aria-label="담당을 정할 일"
          placeholder="오늘의 집안일"
          className="w-[220px] max-w-[72vw] rounded-2xl border border-line bg-white/70 px-4 py-2 text-center text-[18px] font-extrabold text-ink outline-none transition focus:border-indigo focus:bg-white"
        />
        <p className="mt-1.5 text-[12px] text-inkSoft">게임으로 담당자를 정해요 ✏️</p>
      </div>

      {/* 캐릭터 선택 */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {WR_CHARACTERS.map((character) => {
          const order = selectedIds.indexOf(character.id);
          const isSelected = order !== -1;
          const isDisabled = !isSelected && selectedIds.length >= 2;
          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onToggleCharacter(character.id)}
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

      {/* 선택된 캐릭터 + 닉네임 */}
      {selectedIds.length > 0 ? (
        <div className="mt-6">
          <p className="text-center text-[12px] font-bold text-inkSoft">닉네임을 입력해주세요</p>
          <div className="mt-3 flex justify-center gap-4">
            {chosen.map((character, index) => (
              <div key={character.id} className="flex w-[132px] flex-col items-center">
                <span className="text-[10px] font-bold tracking-widest text-indigo">
                  PLAYER {index + 1}
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
                <input
                  value={nicknames[character.id] || ''}
                  onChange={(event) =>
                    onNicknameChange(character.id, event.target.value.slice(0, MAX_NICKNAME))
                  }
                  maxLength={MAX_NICKNAME}
                  placeholder={`${character.name}의 닉네임`}
                  aria-label={`${character.name} 닉네임`}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-center text-[13px] text-ink outline-none focus:border-indigo"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto pt-7">
        <Button
          onClick={onStart}
          disabled={!canStart}
          className={canStart ? '' : 'pointer-events-none opacity-40'}
        >
          게임 시작
        </Button>
      </div>
    </div>
  );
}
