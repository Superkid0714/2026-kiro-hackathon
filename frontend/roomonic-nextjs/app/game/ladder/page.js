'use client';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import BottomNav from '@/components/BottomNav';
import LadderGame from '@/components/ladder/LadderGame';

// 사다리 타기 게임 라우트: /game/ladder
export default function LadderGamePage() {
  const router = useRouter();

  return (
    <Shell>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로 가기"
        className="absolute left-3 top-3 z-20 h-9 w-9 rounded-full text-lg text-inkFaint transition-colors hover:text-indigo"
      >
        ←
      </button>
      <LadderGame />
      <BottomNav />
    </Shell>
  );
}
