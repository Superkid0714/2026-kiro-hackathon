'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/UI';
import useSpeechRecognition from '@/lib/useSpeechRecognition';
import { pickRandomWord } from '@/data/words';
import { GAME_DURATION } from './config';
import PlayerBadge from './PlayerBadge';

const MIC_BLOCKED_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture'];

// 60초 Word Rush 라운드. 끝나면 onFinish(score) 호출.
export default function PlayRound({ player, playerLabel, onFinish }) {
  const [word, setWord] = useState(() => pickRandomWord());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | listening | checking | correct | wrong
  const [micBlocked, setMicBlocked] = useState(false);
  const [manualText, setManualText] = useState('');

  const { supported, listen } = useSpeechRecognition({ lang: 'en-US' });

  const finishedRef = useRef(false);
  const scoreRef = useRef(0);
  const timeoutRef = useRef(null);

  const useManualInput = !supported || micBlocked;

  // 타이머
  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(id);
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish(scoreRef.current);
          }
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(id);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [onFinish]);

  const nextWord = useCallback(() => {
    setWord((current) => pickRandomWord(current));
  }, []);

  const evaluate = useCallback(
    async (recognizedText) => {
      if (finishedRef.current) return;
      setPhase('checking');

      let result;
      try {
        const res = await fetch('/api/evaluate-pronunciation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetWord: word, recognizedText }),
        });
        result = await res.json();
      } catch {
        // 네트워크 자체가 실패해도 게임은 계속 (로컬 비교)
        const a = String(recognizedText || '').toLowerCase().replace(/[^a-z]/g, '');
        const b = word.toLowerCase();
        result = { isCorrect: a === b, feedback: a === b ? 'Correct!' : 'Try again!' };
      }

      if (finishedRef.current) return;

      if (result?.isCorrect) {
        setScore((prev) => {
          scoreRef.current = prev + 1;
          return prev + 1;
        });
        setManualText('');
        setPhase('correct');
        timeoutRef.current = window.setTimeout(() => {
          setPhase('idle');
          nextWord();
        }, 700);
      } else {
        setPhase('wrong');
        timeoutRef.current = window.setTimeout(() => setPhase('idle'), 600);
      }
    },
    [word, nextWord],
  );

  const handleMic = useCallback(async () => {
    if (finishedRef.current || phase === 'listening' || phase === 'checking') return;
    setPhase('listening');
    const { transcript, error } = await listen();
    if (finishedRef.current) return;
    if (error && MIC_BLOCKED_ERRORS.includes(error)) {
      setMicBlocked(true);
      setPhase('idle');
      return;
    }
    await evaluate(transcript || '');
  }, [phase, listen, evaluate]);

  const handleManualSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (finishedRef.current || phase === 'checking' || !manualText.trim()) return;
      evaluate(manualText.trim());
    },
    [manualText, phase, evaluate],
  );

  return (
    <div className="flex flex-1 flex-col items-center px-[22px] pb-8 pt-4">
      <PlayerBadge player={player} size="sm" subLabel={playerLabel} />

      <div className="mt-3 flex items-center gap-5 text-[14px] font-extrabold">
        <span className={timeLeft <= 10 ? 'text-[#E1436B]' : 'text-inkSoft'}>⏱️ {timeLeft}초</span>
        <span className="text-indigo">SCORE {score}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p
          key={word}
          className="wr-pop font-gaegu text-[46px] font-bold uppercase tracking-wide text-ink"
        >
          {word}
        </p>
        <p className="mt-1 text-[12px] text-inkFaint">영어로 발음해주세요</p>

        <div className="mt-4 flex h-7 items-center text-[13px] font-bold">
          {phase === 'listening' ? <span className="text-[#E1436B]">🔴 듣는 중...</span> : null}
          {phase === 'checking' ? <span className="text-inkSoft">AI가 확인하고 있어요...</span> : null}
          {phase === 'correct' ? (
            <span className="wr-pop inline-block text-[#1E8A62]">🎉 Correct! +1</span>
          ) : null}
          {phase === 'wrong' ? (
            <span className="wr-shake inline-block text-[#E1436B]">😢 다시 도전해보세요!</span>
          ) : null}
        </div>
      </div>

      <div className="w-full">
        {useManualInput ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col items-center gap-2.5">
            <p className="text-center text-[11px] text-inkFaint">
              {micBlocked
                ? '마이크 권한이 없어 직접 입력으로 진행해요 (테스트용)'
                : '이 브라우저는 음성 인식을 지원하지 않아요 · 직접 입력 (테스트용)'}
            </p>
            <input
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder="들린 단어를 입력"
              aria-label="단어 직접 입력"
              autoComplete="off"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-center text-[15px] text-ink outline-none focus:border-indigo"
            />
            <Button type="submit" disabled={phase === 'checking'}>
              정답 확인
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleMic}
              disabled={phase === 'listening' || phase === 'checking'}
              aria-label="말하기 시작"
              className={`flex h-[78px] w-[78px] items-center justify-center rounded-full text-[30px] text-white shadow-card transition active:scale-95 disabled:opacity-70 ${
                phase === 'listening' ? 'animate-pulse bg-[#E1436B]' : 'bg-indigo'
              }`}
            >
              🎤
            </button>
            <span className="text-[12px] font-bold text-inkSoft">
              {phase === 'listening' ? '듣는 중' : '말하기 시작'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
