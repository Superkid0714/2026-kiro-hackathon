'use client';
import { Button } from '@/components/UI';
import PlayerBadge from './PlayerBadge';

// 게임 규칙 안내 → 첫 번째 캐릭터부터 시작
export default function ReadyScreen({ firstPlayer, onNext }) {
  return (
    <div className="flex flex-1 flex-col items-center px-[22px] pb-10 pt-8 text-center">
      <h2 className="font-gaegu text-[26px] font-bold text-indigo">준비됐나요?</h2>
      <p className="mt-5 text-[13.5px] leading-relaxed text-ink">
        제한시간 <b>60초</b> 동안 화면에 나오는
        <br />
        영어 단어를 정확하게 발음하세요!
      </p>
      <p className="mt-3 text-[13px] font-bold text-indigo">더 많이 맞힌 사람이 승리 🏆</p>

      <div className="mt-9">
        <PlayerBadge player={firstPlayer} size="lg" subLabel="PLAYER 1 · 먼저 시작" highlight />
      </div>

      <div className="mt-auto w-full pt-10">
        <Button onClick={onNext}>시작하기</Button>
      </div>
    </div>
  );
}
