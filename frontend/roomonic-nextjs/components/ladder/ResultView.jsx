'use client';
import { Button } from '@/components/UI';

/**
 * 두 캐릭터가 도착한 칸을 보여준다. targetCol 에 도착한 쪽이 '담당'.
 */
export default function ResultView({ players, ladder, onRestart, onExit }) {
  const dutyIndex = ladder.paths.findIndex((path) => path.endCol === ladder.targetCol);
  const duty = players[dutyIndex];
  const free = players[dutyIndex === 0 ? 1 : 0];

  return (
    <div className="pt-3 text-center">
      <p className="font-gaegu text-[22px] font-bold text-indigo">결과 발표!</p>

      <div className="mt-3 flex items-stretch justify-center gap-3">
        <div className="flex-1 rounded-2xl border-[1.5px] border-[#E1436B] bg-[#FDE1E9] p-3">
          <p className="text-[10px] font-bold text-[#C22A5A]">담당 😵</p>
          <div className="mx-auto mt-1.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <img src={duty.image} alt={duty.name} className="h-[80%] w-[80%] object-contain" draggable={false} />
          </div>
          <p className="mt-1.5 text-[13px] font-extrabold text-ink">{duty.name}</p>
        </div>
        <div className="flex-1 rounded-2xl border-[1.5px] border-mint bg-[#E1F6EC] p-3">
          <p className="text-[10px] font-bold text-[#1E8A62]">면제 🎉</p>
          <div className="mx-auto mt-1.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <img src={free.image} alt={free.name} className="h-[80%] w-[80%] object-contain" draggable={false} />
          </div>
          <p className="mt-1.5 text-[13px] font-extrabold text-ink">{free.name}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-lavenderSoft px-5 py-3.5">
        <p className="text-[15px] font-extrabold text-indigo">오늘의 담당은 {duty.name}!</p>
      </div>

      <div className="mt-5 space-y-2.5">
        <Button onClick={onRestart}>다시 하기</Button>
        <Button variant="ghost" onClick={onExit}>
          게임 선택
        </Button>
      </div>
    </div>
  );
}
