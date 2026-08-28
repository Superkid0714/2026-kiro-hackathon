'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './ladder.css';
import { Button } from '@/components/UI';
import { LADDER_CHARACTERS, DRAW_MS, buildLadder } from './config';
import CharacterSelect from './CharacterSelect';
import LadderBoard from './LadderBoard';
import ResultView from './ResultView';

/**
 * 사다리 타기: select → board(출발 대기) → running(경로 애니메이션) → result
 */
export default function LadderGame() {
  const router = useRouter();
  const [phase, setPhase] = useState('select');
  const [selectedIds, setSelectedIds] = useState([]);
  const [ladder, setLadder] = useState(null);

  const players = useMemo(
    () => selectedIds.map((id) => LADDER_CHARACTERS.find((character) => character.id === id)),
    [selectedIds],
  );

  const toggleCharacter = useCallback((id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const makeLadder = useCallback(() => {
    setLadder(buildLadder());
    setPhase('board');
  }, []);

  const run = useCallback(() => {
    setPhase('running');
    window.setTimeout(() => setPhase('result'), DRAW_MS + 400);
  }, []);

  const restart = useCallback(() => {
    setSelectedIds([]);
    setLadder(null);
    setPhase('select');
  }, []);

  const exit = useCallback(() => router.push('/minigame'), [router]);

  if (phase === 'select') {
    return (
      <CharacterSelect selectedIds={selectedIds} onToggle={toggleCharacter} onStart={makeLadder} />
    );
  }

  const showPaths = phase === 'running' || phase === 'result';

  return (
    <div className="flex flex-1 flex-col px-[22px] pb-8">
      <h1 className="mt-3 text-center font-gaegu text-[24px] font-bold tracking-wide text-indigo">
        사다리 타기
      </h1>

      {/* 출발 캐릭터 */}
      <div className="mt-3 flex justify-around">
        {players.map((character) => (
          <div key={character.id} className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavenderSoft">
              <img
                src={character.image}
                alt={character.name}
                draggable={false}
                className="h-[80%] w-[80%] select-none object-contain"
              />
            </div>
            <span className="mt-1 text-[11px] font-bold text-ink">{character.name}</span>
          </div>
        ))}
      </div>

      {/* 사다리 */}
      <div className="mt-2 flex min-h-0 flex-1 justify-center">
        <LadderBoard ladder={ladder} animate={showPaths} revealResult={phase === 'result'} />
      </div>

      {phase === 'board' ? (
        <div className="mt-2">
          <Button onClick={run}>출발하기 🪜</Button>
        </div>
      ) : null}

      {phase === 'running' ? (
        <p className="mt-3 text-center text-[13px] font-bold text-indigo">
          사다리를 타고 내려가는 중...
        </p>
      ) : null}

      {phase === 'result' ? (
        <ResultView players={players} ladder={ladder} onRestart={restart} onExit={exit} />
      ) : null}
    </div>
  );
}
