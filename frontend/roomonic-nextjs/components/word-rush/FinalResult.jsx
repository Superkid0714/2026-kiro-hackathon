'use client';
import { Button } from '@/components/UI';
import PlayerBadge from './PlayerBadge';

/**
 * 두 플레이어 점수 비교 + WINNER / DRAW + "오늘의 {taskTitle} 담당은 {닉네임}!"
 * @param {object}  outcome  { winnerIndex: 0|1, isDraw: boolean }
 */
export default function FinalResult({ players, scores, taskTitle, outcome, onRestart, onExit }) {
  const winner = players[outcome.winnerIndex];

  return (
    <div className="flex flex-1 flex-col items-center px-[22px] pb-10 pt-6 text-center">
      <h2 className="font-gaegu text-[26px] font-bold text-indigo">RESULT</h2>
      <p className="mt-1 text-[12.5px] text-inkSoft">오늘의 Word Rush 결과</p>

      <div className="mt-7 flex w-full items-start justify-center gap-7">
        {players.map((player, index) => {
          const isWinner = !outcome.isDraw && index === outcome.winnerIndex;
          return (
            <div key={player.id} className={isWinner ? 'wr-winner rounded-3xl p-1' : 'wr-rise'}>
              <PlayerBadge player={player} size={isWinner ? 'lg' : 'md'} highlight={isWinner} />
              <p
                className={`mt-2 font-extrabold ${
                  isWinner ? 'text-[26px] text-indigo' : 'text-[19px] text-ink'
                }`}
              >
                {scores[index]}점
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        {outcome.isDraw ? (
          <>
            <p className="text-[20px] font-extrabold text-indigo">🤝 DRAW</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-inkSoft">
              동점이에요!
              <br />
              오늘의 담당자를 랜덤으로 정했어요.
            </p>
          </>
        ) : (
          <>
            <p className="wr-pop text-[22px] font-extrabold text-indigo">🏆 WINNER 🏆</p>
            <p className="mt-1 font-gaegu text-[26px] font-bold text-ink">{winner.nickname}</p>
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-lavenderSoft px-5 py-4">
        <p className="text-[15px] font-extrabold text-indigo">
          {taskTitle} 담당은 {winner.nickname}!
        </p>
      </div>

      <div className="mt-auto w-full space-y-2.5 pt-8">
        <Button onClick={onRestart}>다시 하기</Button>
        <Button variant="ghost" onClick={onExit}>
          게임 선택
        </Button>
      </div>
    </div>
  );
}
