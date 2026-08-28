'use client';
import Shell from '@/components/Shell';
import BottomNav from '@/components/BottomNav';
import WordRushGame from '@/components/word-rush/WordRushGame';

// 독립 테스트용 라우트: /game/word-rush
export default function WordRushPage() {
  return (
    <Shell>
      <WordRushGame />
      <BottomNav />
    </Shell>
  );
}
