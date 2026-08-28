'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, Card } from '@/components/UI';
import { registerAsCandidate } from '@/lib/mockApi';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    await registerAsCandidate();
    router.push('/candidates');
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/candidates')} />
        <h2 className="text-[17px] font-bold mt-3.5 mb-0.5">내 정보를 후보로 등록할게요</h2>
        <p className="text-[11.5px] text-inkFaint mb-4 leading-relaxed">
          마음에 드는 후보가 없다면, 내 인터뷰 결과를 다른 사람에게 후보로 노출할 수 있어요.
        </p>
      </div>
      <div className="px-[22px] flex-1 flex flex-col gap-3">
        <Card>
          <p className="font-bold text-[13px] mb-1.5">🔒 공개되는 정보</p>
          <p className="text-[11.5px] text-inkFaint leading-relaxed">
            생활 타입 · 호환성 근거 카테고리 · 희망 지역 · 입주 시기
          </p>
        </Card>
        <Card className="bg-peachSoft border-none">
          <p className="font-bold text-[13px] mb-1.5 text-[#B36B1D]">🙈 공개되지 않는 정보</p>
          <p className="text-[11.5px] text-[#8A5A16] leading-relaxed">닉네임 · 프로필 이미지 · 연락처</p>
        </Card>
      </div>
      <div className="px-[22px] pb-5">
        <Button onClick={handleRegister} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '등록 중...' : '후보로 등록하기'}
        </Button>
      </div>
    </Shell>
  );
}
