'use client';
import { useEffect, useRef, useState } from 'react';
import { COUNTDOWN_FROM } from './config';
import PlayerBadge from './PlayerBadge';

// 3 → 2 → 1 → START! 후 onDone 호출
export default function Countdown({ player, playerLabel, onDone }) {
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setCount(COUNTDOWN_FROM);

    const id = window.setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          if (!doneRef.current) {
            doneRef.current = true;
            window.setTimeout(onDone, 650); // "START!" 잠깐 보여주고 시작
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-[22px] text-center">
      <div className="mb-2">
        <PlayerBadge player={player} subLabel={playerLabel} highlight />
      </div>
      <div
        key={count}
        className="wr-pop mt-6 font-gaegu text-[64px] font-bold leading-none text-indigo"
      >
        {count === 0 ? 'START!' : count}
      </div>
    </div>
  );
}
