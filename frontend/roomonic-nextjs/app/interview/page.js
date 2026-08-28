'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar } from '@/components/UI';

export default function InterviewPage() {
  const router = useRouter();
  const [value, setValue] = useState(45);

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/profile')} />
        <div className="mt-3">
          <ProgressBar percent={33} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-3.5">8 / 24 · 수면 패턴</p>
      </div>
      <div className="px-[22px] flex-1">
        <div className="bg-lavenderSoft rounded-[18px] p-4 flex gap-2.5 items-start mb-6">
          <span className="text-xl">🐣</span>
          <div>
            <p className="font-bold text-[13px] mb-1">Roomonic AI</p>
            <p className="text-[13px] leading-relaxed text-inkSoft">
              보통 몇 시쯤 잠드나요?
              <br />
              평소 기준으로 알려주세요
              <br />
              <span className="text-inkFaint text-[11.5px]">(10분 단위로 선택할 수 있어요)</span>
            </p>
          </div>
        </div>
        <div className="text-center my-6">
          <div className="text-[34px] font-extrabold text-indigo">AM 12:30</div>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-4/5 mt-2.5 accent-indigo"
          />
        </div>
        <p className="text-[12px] text-center text-indigo font-bold">이전 답변 수정하기</p>
      </div>
      <div className="px-[22px] pb-5 flex gap-2.5">
        <Button variant="ghost" fullWidth={false} className="px-5" onClick={() => router.back()}>
          이전
        </Button>
        <Button onClick={() => router.push('/interview/hardcut')}>다음 →</Button>
      </div>
    </Shell>
  );
}
