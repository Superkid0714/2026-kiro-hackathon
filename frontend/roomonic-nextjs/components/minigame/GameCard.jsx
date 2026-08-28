'use client';
import { useState } from 'react';
import { Button } from '@/components/UI';

// 게임 시작 버튼의 pointerdown 전파를 막아 캐러셀 드래그와 분리한다.
export default function GameCard({ game, onStart }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(game.image) && !imgFailed;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-line bg-white p-4 text-center shadow-card">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#F6F0FF_0%,#FFF8FB_100%)] px-5 py-4">
        {showImage ? (
          <img
            src={game.image}
            alt={game.title}
            draggable={false}
            onError={() => setImgFailed(true)}
            className="max-h-[128px] w-full max-w-[210px] object-contain drop-shadow-[0_14px_18px_rgba(91,63,209,0.16)]"
          />
        ) : (
          <div className="flex h-[128px] w-[210px] items-center justify-center rounded-[18px] bg-lavenderSoft text-[13px] font-bold text-indigo">
            {game.title}
          </div>
        )}
      </div>

      <div className="shrink-0 pt-4">
        <p className="text-[18px] font-extrabold text-ink">{game.title}</p>
        <p className="mx-auto mt-1.5 max-w-[240px] text-[12px] font-medium leading-relaxed text-inkSoft">
          {game.description}
        </p>
        <Button
          className="mt-4"
          onClick={onStart}
          onPointerDown={(event) => event.stopPropagation()}
        >
          게임 시작
        </Button>
      </div>
    </div>
  );
}
