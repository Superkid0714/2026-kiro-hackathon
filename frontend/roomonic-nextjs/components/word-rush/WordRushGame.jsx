'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './word-rush.css';
import { DEFAULT_TASK_TITLE, STATUS, WR_CHARACTERS } from './config';
import CharacterSetup from './CharacterSetup';
import ReadyScreen from './ReadyScreen';
import Countdown from './Countdown';
import PlayRound from './PlayRound';
import RoundResult from './RoundResult';
import FinalResult from './FinalResult';

/**
 * Word Rush 전체 상태머신.
 * setup → ready → p1(countdown→playing→result) → p2(countdown→playing→result) → final
 * 캐릭터/닉네임/taskTitle/점수는 게임 전체에서 유지된다.
 */
export default function WordRushGame() {
  const router = useRouter();

  const [status, setStatus] = useState(STATUS.SETUP);
  const [selectedIds, setSelectedIds] = useState([]); // [player1Id, player2Id] (선택 순서)
  const [nicknames, setNicknames] = useState({});
  const [taskTitle, setTaskTitle] = useState(DEFAULT_TASK_TITLE);
  const [scores, setScores] = useState([0, 0]);
  const [outcome, setOutcome] = useState({ winnerIndex: 0, isDraw: false });

  // 선택 순서 그대로 = PLAYER 1, PLAYER 2
  const players = useMemo(
    () =>
      selectedIds.map((id) => {
        const character = WR_CHARACTERS.find((item) => item.id === id);
        return { ...character, nickname: (nicknames[id] || '').trim() || character.name };
      }),
    [selectedIds, nicknames],
  );

  const toggleCharacter = useCallback((id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const changeNickname = useCallback((id, value) => {
    setNicknames((prev) => ({ ...prev, [id]: value }));
  }, []);

  const goReady = useCallback(() => setStatus(STATUS.READY), []);
  const goP1Countdown = useCallback(() => setStatus(STATUS.P1_COUNTDOWN), []);
  const goP1Playing = useCallback(() => setStatus(STATUS.P1_PLAYING), []);
  const finishP1 = useCallback((score) => {
    setScores((prev) => [score, prev[1]]);
    setStatus(STATUS.P1_RESULT);
  }, []);
  const goP2Countdown = useCallback(() => setStatus(STATUS.P2_COUNTDOWN), []);
  const goP2Playing = useCallback(() => setStatus(STATUS.P2_PLAYING), []);
  const finishP2 = useCallback((score) => {
    setScores((prev) => [prev[0], score]);
    setStatus(STATUS.P2_RESULT);
  }, []);

  const goFinal = useCallback(() => {
    const [a, b] = scores;
    const isDraw = a === b;
    const winnerIndex = isDraw ? (Math.random() < 0.5 ? 0 : 1) : a > b ? 0 : 1;
    setOutcome({ winnerIndex, isDraw });
    setStatus(STATUS.FINAL);
  }, [scores]);

  const restart = useCallback(() => {
    setScores([0, 0]);
    setOutcome({ winnerIndex: 0, isDraw: false });
    setStatus(STATUS.SETUP);
  }, []);

  const exit = useCallback(() => router.push('/minigame'), [router]);

  const showTopBar = status === STATUS.SETUP;

  return (
    <div className="flex flex-1 flex-col">
      {showTopBar ? (
        <div className="flex items-center justify-between px-[22px] pt-4">
          <span className="font-gaegu text-[18px] font-bold text-indigo">Roomonic</span>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[12.5px] font-semibold text-inkSoft transition-colors hover:text-indigo"
          >
            돌아가기
          </button>
        </div>
      ) : null}

      {status === STATUS.SETUP ? (
        <CharacterSetup
          selectedIds={selectedIds}
          onToggleCharacter={toggleCharacter}
          nicknames={nicknames}
          onNicknameChange={changeNickname}
          taskTitle={taskTitle}
          onTaskTitleChange={setTaskTitle}
          onStart={goReady}
        />
      ) : null}

      {status === STATUS.READY ? (
        <ReadyScreen firstPlayer={players[0]} onNext={goP1Countdown} />
      ) : null}

      {status === STATUS.P1_COUNTDOWN ? (
        <Countdown key="p1-count" player={players[0]} playerLabel="PLAYER 1" onDone={goP1Playing} />
      ) : null}
      {status === STATUS.P1_PLAYING ? (
        <PlayRound key="p1-play" player={players[0]} playerLabel="PLAYER 1" onFinish={finishP1} />
      ) : null}
      {status === STATUS.P1_RESULT ? (
        <RoundResult
          player={players[0]}
          playerLabel="PLAYER 1"
          score={scores[0]}
          isLast={false}
          nextPlayer={players[1]}
          onNext={goP2Countdown}
        />
      ) : null}

      {status === STATUS.P2_COUNTDOWN ? (
        <Countdown key="p2-count" player={players[1]} playerLabel="PLAYER 2" onDone={goP2Playing} />
      ) : null}
      {status === STATUS.P2_PLAYING ? (
        <PlayRound key="p2-play" player={players[1]} playerLabel="PLAYER 2" onFinish={finishP2} />
      ) : null}
      {status === STATUS.P2_RESULT ? (
        <RoundResult
          player={players[1]}
          playerLabel="PLAYER 2"
          score={scores[1]}
          isLast
          nextPlayer={null}
          onNext={goFinal}
        />
      ) : null}

      {status === STATUS.FINAL ? (
        <FinalResult
          players={players}
          scores={scores}
          taskTitle={taskTitle}
          outcome={outcome}
          onRestart={restart}
          onExit={exit}
        />
      ) : null}
    </div>
  );
}
