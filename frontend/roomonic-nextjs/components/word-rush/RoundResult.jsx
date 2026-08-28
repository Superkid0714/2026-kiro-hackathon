'use client';
import { Button } from '@/components/UI';
import PlayerBadge from './PlayerBadge';

/**
 * 한 플레이어의 라운드 결과 + (마지막이 아니면) 다음 플레이어 전환 안내.
 */
export default function RoundResult({ player, playerLabel, score, isLast, nextPlayer, onNext }) {
  return (
    <div className="flex flex-1 flex-col items-center px-[22px] pb-10 pt-8 text-center">
      <h2 className="font-gaegu text-[24px] font-bold text-indigo">{playerLabel} GAME OVER!</h2>

      <div className="mt-6">
        <PlayerBadge player={player} size="lg" highlight />
      </div>

      <p className="wr-pop mt-4 text-[42px] font-extrabold text-indigo">{score}점</p>
      <p className="mt-1 text-[12.5px] text-inkSoft">{score}개의 단어를 맞혔어요!</p>

      {!isLast && nextPlayer ? (
        <div className="mt-7 rounded-2xl bg-lavenderSoft px-5 py-4">
          <p className="text-[12.5px] text-ink">준비되셨나요?</p>
          <p className="mt-1 text-[13px] font-bold text-indigo">
            다음은 {nextPlayer.nickname}님의 차례예요
          </p>
        </div>
      ) : null}

      <div className="mt-auto w-full pt-8">
        <Button onClick={onNext}>{isLast ? '결과 보기' : '다음 플레이어'}</Button>
      </div>
    </div>
  );
}
