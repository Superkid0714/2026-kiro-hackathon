'use client';

// ● ○ ○ 형태의 현재 위치 표시. 점을 누르면 해당 게임으로 이동.
export default function CarouselIndicator({ count, active, onSelect, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번째 게임 보기`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              isActive ? 'w-4 bg-indigo' : 'w-1.5 bg-line'
            }`}
          />
        );
      })}
    </div>
  );
}
