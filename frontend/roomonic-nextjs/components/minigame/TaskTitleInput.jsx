'use client';

const MAX_LENGTH = 16;

/**
 * "오늘의 집안일" 처럼 담당을 정할 일의 이름을 사용자가 직접 수정하는 제목 입력.
 * - 값/상태는 부모(GamePage)에서 관리
 * - 일반 input 처럼 보이지 않도록 옅은 테두리 + 가운데 정렬 + 큰 글씨(제목형)
 * - 폭 고정 → 입력 중에도 레이아웃이 흔들리지 않음
 */
export default function TaskTitleInput({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_LENGTH))}
        maxLength={MAX_LENGTH}
        aria-label="담당을 정할 일 이름"
        placeholder="오늘의 집안일"
        className="w-[230px] max-w-[72vw] rounded-2xl border border-line bg-white/70 py-2 pl-4 pr-8 text-center text-[21px] font-extrabold text-ink outline-none transition focus:border-indigo focus:bg-white"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-inkFaint"
      >
        ✏️
      </span>
    </div>
  );
}
