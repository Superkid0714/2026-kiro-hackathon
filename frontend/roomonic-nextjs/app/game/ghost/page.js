'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import BottomNav from '@/components/BottomNav';
import GameHeader from '@/components/ghost-game/GameHeader';
import GhostStretchGame from '@/components/ghost-game/GhostStretchGame';
import GhostSelector from '@/components/ghost-game/GhostSelector';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/components/ghost-game/config';

// 유령 늘리기 미니게임 라우트: /game/ghost
// 레이아웃: 상단 헤더 → 게임 영역(flex-1) → 하단 캐릭터 선택
export default function GhostGamePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(DEFAULT_CHARACTER_ID);
  const character = useMemo(
    () => CHARACTERS.find((item) => item.id === selectedId) ?? CHARACTERS[0],
    [selectedId],
  );

  return (
    <Shell dark>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로 가기"
        className="absolute left-3 top-3 z-20 h-9 w-9 rounded-full text-lg text-white/35 transition-colors hover:text-white/75"
      >
        ←
      </button>

      <GameHeader />
      <GhostStretchGame characterImage={character.image} />
      <GhostSelector selectedId={selectedId} onSelect={setSelectedId} />
      <BottomNav dark />
    </Shell>
  );
}
