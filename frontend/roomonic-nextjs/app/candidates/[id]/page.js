'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, Card, Tag } from '@/components/UI';
import { createChatRoom, getCandidateDetail, getCurrentProfileContext } from '@/lib/mockApi';

export default function CandidateDetailPage({ params }) {
  const router = useRouter();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCandidateDetail(params.id)
      .then(setC)
      .catch((err) => setError(err.message));
  }, [params.id]);

  async function handleStartChat() {
    if (!c?.profile_id) {
      setError('이 후보는 아직 실제 프로필과 연결되지 않았어요');
      return;
    }

    const currentProfile = getCurrentProfileContext();
    if (!currentProfile?.profile_id) {
      setError('현재 사용자 프로필이 없어요. 먼저 프로필을 저장해주세요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const room = await createChatRoom(c.profile_id);
      router.push(
        `/chat?roomId=${encodeURIComponent(room.room_id)}&profileId=${encodeURIComponent(currentProfile.profile_id)}&nickname=${encodeURIComponent(currentProfile.nickname || '나')}&peerName=${encodeURIComponent(c.name)}`
      );
    } catch (err) {
      setError(err.message || '채팅방을 열지 못했어요');
    } finally {
      setLoading(false);
    }
  }

  if (!c && !error) {
    return (
      <Shell>
        <StatusBar />
        <div className="flex-1 flex items-center justify-center text-inkFaint text-sm">불러오는 중...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/candidates')} />
        <h2 className="text-[17px] font-bold mt-3 mb-0.5">{c?.name || '후보'}님과의 생활 궁합</h2>
        <p className="text-[11.5px] text-inkFaint mb-3.5">서로를 더 알아보고 바로 대화를 시작할 수 있어요</p>
      </div>
      {error && <div className="px-[22px] pb-2 text-[12px] text-[#C22A5A]">{error}</div>}
      <div className="px-[22px] flex-1 flex flex-col gap-3.5">
        <div className="flex gap-3">
          <Card className="flex-1 text-center py-3.5">
            <div className="text-2xl">{c.emoji}</div>
            <p className="font-bold text-[13px] mt-1.5">{c.name}</p>
            <Tag>THE MATCH</Tag>
          </Card>
          <Card className="flex-1 text-center py-3.5 bg-pinkSoft border-none">
            <div className="text-xl">💗</div>
            <p className="font-extrabold text-xl text-[#C22A5A] mt-0.5">{c.score}%</p>
            <p className="text-[11.5px] text-inkFaint">아주 잘 맞아요</p>
          </Card>
        </div>

        <Card>
          <p className="font-bold text-[13px] mb-2">✅ 잘 맞는 부분</p>
          <ul className="text-[12.5px] text-inkSoft leading-loose list-disc pl-4">
            {c.goodPoints.map((g, i) => (
              <li key={i}>
                {g.text} <Tag>{g.tag}</Tag>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="font-bold text-[13px] mb-2">⚠️ 조율이 필요한 부분</p>
          <ul className="text-[12.5px] text-inkSoft leading-loose list-disc pl-4">
            {c.cautionPoints.map((g, i) => (
              <li key={i}>
                {g.text} <Tag tone="warn">{g.tag}</Tag>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-[#FDE1E9] border-none">
          <p className="font-bold text-[13px] mb-1.5 text-[#C22A5A]">🚫 이 후보의 Hardcut 조건</p>
          <p className="text-[12px] text-[#9E2049]">{c.hardcuts.join(' · ')}</p>
        </Card>
      </div>
      <div className="px-[22px] pb-5">
        <Button variant="danger" onClick={handleStartChat} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '채팅방 준비 중...' : '💬 채팅 시작하기'}
        </Button>
      </div>
    </Shell>
  );
}
