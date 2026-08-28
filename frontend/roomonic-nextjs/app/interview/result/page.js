'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button, Tag } from '@/components/UI';
import { getInterviewResult } from '@/lib/mockApi';

export default function InterviewResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    getInterviewResult()
      .then((nextResult) => {
        if (!active) return;
        setResult(nextResult);
      })
      .catch((error) => {
        if (!active) return;
        if (error.message === '프로필 정보를 다시 확인해주세요') {
          router.replace('/profile');
          return;
        }
        router.replace('/home');
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <Shell dark>
      <StatusBar dark />
      <div className="relative z-10 px-[22px] text-center pt-1.5">
        <p className="text-[11px] text-[#B9B2E6] mt-2 mb-0.5">Roomonic이 분석한</p>
        <h2 className="text-[19px] font-bold mb-4">나의 생활 타입</h2>

        {!result ? (
          <div className="py-16 text-[#B9B2E6] text-sm">분석 결과를 불러오는 중...</div>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#2E2467] to-[#171233] px-5 py-6">
            <div className="flex justify-center mb-3">
              <div className={`flex h-[190px] w-[190px] items-center justify-center rounded-[38px] ${result.visual?.bg || 'bg-white/10'}`}>
                <img
                  src={result.visual?.imagePath || '/images/characters/UNI.png'}
                  alt={`${result.title} 캐릭터`}
                  className="h-[172px] w-[172px] object-contain"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Tag tone="mint">{result.badge}</Tag>
            </div>
            <p className="mt-3 text-[24px] font-extrabold text-white">{result.title}</p>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#CFC9F2]">{result.desc}</p>

            <div className="mt-5 rounded-[20px] bg-white/8 px-4 py-4 text-left">
              <p className="text-[11px] font-bold text-[#D8D1FF]">이런 점이 크게 보였어요</p>
              <div className="mt-3 space-y-2">
                {result.tags.slice(0, 3).map((t, index) => (
                  <div key={t} className="rounded-[16px] bg-white/10 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-[#F8D46B]">포인트 {index + 1}</p>
                    <p className="mt-1 text-[12.5px] text-white">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {result.tags.map((t) => (
                <span key={t} className="text-[10.5px] font-bold bg-mintSoft text-[#1E8A62] px-2.5 py-1 rounded-lg">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative z-10 mt-auto px-[22px] pb-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="ghostDark" onClick={() => router.push('/home')}>
            홈으로 가기
          </Button>
          <Button onClick={() => router.push('/candidates')}>추천 후보 보기 →</Button>
        </div>
      </div>
    </Shell>
  );
}
