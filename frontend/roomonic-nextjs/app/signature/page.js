'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button } from '@/components/UI';
import { submitSignature } from '@/lib/mockApi';

export default function SignaturePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await submitSignature({ name: 'Jisu', agreed });
      router.push('/final');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] text-center pt-1.5">
        <div className="flex justify-start">
          <BackLink onClick={() => router.push('/rules/review')} />
        </div>
        <h2 className="text-[16.5px] font-bold mt-3 mb-0.5 leading-relaxed">
          생활수칙에 동의하고
          <br />
          서명해주세요
        </h2>
        <p className="text-[11.5px] text-inkFaint mb-4">서명 시점의 원문이 안전하게 보관돼요</p>
      </div>
      <div className="px-[22px]">
        <div className="flex bg-lavenderSoft rounded-xl p-1 mb-4">
          <div className="flex-1 text-center bg-white rounded-lg py-2 font-bold text-[12.5px] text-indigo">
            타이핑 서명
          </div>
          <div className="flex-1 text-center py-2 font-bold text-[12.5px] text-inkFaint">직접 서명</div>
        </div>
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-inkSoft block mb-1.5">지수 (나)</label>
          <input defaultValue="Jisu" className="input font-gaegu text-xl text-indigo" />
        </div>
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-inkSoft block mb-1.5">민준 (상대방)</label>
          <input defaultValue="Minjun" disabled className="input font-gaegu text-xl text-inkFaint bg-[#F6F4FC]" />
        </div>
        <label className="flex gap-2 items-start text-[11.5px] text-inkSoft mb-4 leading-relaxed">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-auto mt-0.5" />
          모든 내용을 확인했고, 서명 시점의 원문이 SHA-256으로 해시 저장되는 것에 동의합니다. 서명 후 원문은 수정할 수 없어요.
        </label>
      </div>
      <div className="px-[22px] pb-5 mt-auto">
        <Button onClick={handleSubmit} className={loading || !agreed ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '서명 처리 중...' : '서명 완료하기'}
        </Button>
      </div>
    </Shell>
  );
}
