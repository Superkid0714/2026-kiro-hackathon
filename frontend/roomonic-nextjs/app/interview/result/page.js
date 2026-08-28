'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { getInterviewResult } from '@/lib/mockApi';

export default function InterviewResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    getInterviewResult().then(setResult);
  }, []);

  return (
    <Shell dark>
      <StatusBar dark />
      <div className="relative z-10 px-[22px] text-center pt-1.5">
        <p className="text-[11px] text-[#B9B2E6] mt-2 mb-0.5">Roomonic이 분석한</p>
        <h2 className="text-[19px] font-bold mb-4">나의 생활 타입</h2>

        {!result ? (
          <div className="py-16 text-[#B9B2E6] text-sm">분석 결과를 불러오는 중...</div>
        ) : (
          <div className="rounded-[18px] p-4 border border-white/10 bg-gradient-to-br from-[#2E2467] to-[#171233]">
            <div className="flex justify-center mb-2.5">
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="30" fill="#3B2F72" />
                <circle cx="35" cy="35" r="22" fill="#F4F2FD" />
                <circle cx="28" cy="35" r="2.2" fill="#2A2450" />
                <circle cx="42" cy="35" r="2.2" fill="#2A2450" />
                <path d="M29 42 Q35 46 41 42" stroke="#2A2450" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold bg-peach text-[#7A4A0E] px-2.5 py-1 rounded-lg">
              {result.badge}
            </span>
            <p className="font-extrabold text-base mt-2.5 mb-1.5">"{result.title}"</p>
            <p className="text-[12.5px] text-[#CFC9F2] leading-relaxed mb-3.5">{result.desc}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {result.tags.map((t) => (
                <span key={t} className="text-[10.5px] font-bold bg-mintSoft text-[#1E8A62] px-2.5 py-1 rounded-lg">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative z-10 px-[22px] pb-5 mt-auto">
        <Button onClick={() => router.push('/candidates')}>추천 룸메이트 보러가기 →</Button>
      </div>
    </Shell>
  );
}
