'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, Card, Tag } from '@/components/UI';
import {
  getCandidateDetail,
  getCurrentProfileContext,
  getDailyPickLock,
  hasConfirmedRoommate,
  requestChatMatch,
  syncPersistedRoommateState,
} from '@/lib/mockApi';

const DAILY_PICK_LOCK_KEY = 'roomonic-daily-pick-lock';

export default function CandidateDetailPage({ params }) {
  const router = useRouter();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickLock, setPickLock] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    syncPersistedRoommateState().finally(() => {
      setPickLock(getDailyPickLock());
      setConfirmed(hasConfirmedRoommate());
    });
    getCandidateDetail(params.id)
      .then(setC)
      .catch((err) => setError(err.message));
  }, [params.id]);

  async function handleStartChat() {
    const currentProfile = getCurrentProfileContext();
    if (!currentProfile?.profile_id) {
      setError('현재 사용자 프로필이 없어요. 먼저 프로필을 저장해주세요');
      return;
    }
    if (!c) return;
    if (confirmed || pickLock?.selected_candidate_id === c.id) {
      router.push('/chat');
      return;
    }
    if (pickLock && pickLock.selected_candidate_id !== c.id) {
      setError('오늘은 이미 다른 추천 후보를 선택했어요. 채팅 목록에서 이어서 확인해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await requestChatMatch(c);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const lockPayload = {
        selected_candidate_id: c.id,
        selected_candidate_name: c.name,
        locked_until: tomorrow.toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DAILY_PICK_LOCK_KEY, JSON.stringify(lockPayload));
      }
      setPickLock(lockPayload);
      router.push('/chat');
    } catch (err) {
      setError(err.message || '대화 요청을 보내지 못했어요');
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
        <BackLink onClick={() => router.push('/candidates/result')} />
        <h2 className="text-[17px] font-bold mt-3 mb-0.5">{c?.name || '후보'}님과의 생활 궁합</h2>
        <p className="text-[11.5px] text-inkFaint mb-3.5">상세 프로필을 먼저 확인한 뒤 채팅 요청을 보낼 수 있어요</p>
      </div>
      {error && <div className="px-[22px] pb-2 text-[12px] text-[#C22A5A]">{error}</div>}
      <div className="px-[22px] flex-1 flex flex-col gap-3.5">
        <div className="flex gap-3">
          <Card className="flex-1 text-center py-3.5">
            <div className={`w-[72px] h-[72px] rounded-[20px] ${c.bg} mx-auto flex items-center justify-center overflow-hidden`}>
              <img src={c.imagePath || '/images/characters/UNI.png'} alt={`${c.name} 캐릭터`} className="w-[62px] h-[62px] object-contain" />
            </div>
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
          <p className="font-bold text-[13px] mb-1.5 text-[#C22A5A]">🚫 이 후보가 포기할 수 없는 것</p>
          <p className="text-[12px] text-[#9E2049]">{c.hardcuts.join(' · ')}</p>
        </Card>
      </div>
      <div className="px-[22px] pb-5">
        <Button
          onClick={handleStartChat}
          className={`bg-[linear-gradient(135deg,#7A5AF8_0%,#6B4CE6_55%,#5B3FD1_100%)] text-white shadow-lg shadow-[#7A5AF8]/25 hover:brightness-105 ${
            loading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {loading
            ? '요청 보내는 중...'
            : confirmed || pickLock?.selected_candidate_id === c?.id
              ? '채팅하러 가기'
              : '채팅 요청 보내기'}
        </Button>
      </div>
    </Shell>
  );
}
