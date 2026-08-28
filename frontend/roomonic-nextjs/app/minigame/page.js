'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import BottomNav from '@/components/BottomNav';
import GameHeader from '@/components/minigame/GameHeader';
import TaskTitleInput from '@/components/minigame/TaskTitleInput';
import CharacterRow from '@/components/minigame/CharacterRow';
import GameCarousel from '@/components/minigame/GameCarousel';
import { GAMES } from '@/components/minigame/games';

// 게임 메인/선택 화면: /minigame
// 이번 단계는 UI 만. 실제 게임 로직/결과/저장 없음.
export default function GamePage() {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState('오늘의 집안일');

  function handleGameStart(gameId) {
    const game = GAMES.find((item) => item.id === gameId);
    if (game?.route) {
      router.push(game.route);
      return;
    }
    // 아직 페이지가 연결되지 않은 게임
    // eslint-disable-next-line no-console
    console.log('선택한 게임(미연결):', gameId);
  }

  return (
    <Shell>
      <div className="flex flex-1 flex-col px-[22px] pb-8">
        <GameHeader onBack={() => router.back()} />

        <div className="flex flex-1 flex-col justify-center gap-7 py-6">
          <div className="flex flex-col items-center text-center">
            <TaskTitleInput value={taskTitle} onChange={setTaskTitle} />
            <p className="mt-2.5 text-[14px] font-bold text-ink">게임으로 정해볼까요?</p>
            <p className="mt-3 text-[12px] leading-relaxed text-inkFaint">
              룸메이트와 게임을 하고
              <br />
              오늘의 담당자를 정해보세요!
            </p>
          </div>

          <CharacterRow />

          <GameCarousel games={GAMES} onGameStart={handleGameStart} />
        </div>
      </div>
      <BottomNav />
    </Shell>
  );
}
