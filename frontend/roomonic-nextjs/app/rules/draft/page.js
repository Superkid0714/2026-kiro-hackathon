'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { getRulesDraft } from '@/lib/mockApi';

export default function RulesDraftPage() {
  const router = useRouter();
  const [rules, setRules] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getRulesDraft().then(setRules);
  }, []);

  const rule = rules[index];

  function handleNext() {
    if (index < rules.length - 1) {
      setIndex(index + 1);
    } else {
      router.push('/rules/review');
    }
  }

  return (
    <Shell dark>
      <StatusBar dark />
      <div className="relative z-10 px-[22px] text-center pt-1.5">
        <h2 className="text-[16.5px] font-bold mt-2 mb-1 leading-relaxed">
          두 사람을 위한
          <br />
          생활수칙 카드를 뽑았어요!
        </h2>
        <p className="text-[11.5px] text-[#B9B2E6] mb-4">
          AI가 두 사람의 답변을 비공개로 참고해 생성했어요
        </p>
      </div>

      {rule && (
        <div className="relative z-10 px-[22px]">
          <div className="rounded-[18px] p-5 text-center border border-white/10 bg-gradient-to-br from-[#2E2467] to-[#171233]">
            <span className="text-[10.5px] font-bold bg-white/10 px-2.5 py-1 rounded-lg">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="text-2xl mt-3.5 mb-1.5">🎧</div>
            <p className="font-extrabold text-[15px] mb-2">{rule.title}</p>
            <p className="text-[12.5px] text-[#CFC9F2] leading-relaxed mb-2.5">{rule.rule}</p>
            <p className="text-[10.5px] text-[#8A83BE]">생성 이유: {rule.reason}</p>
          </div>
          <div className="flex gap-1.5 justify-center mt-3">
            {rules.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-indigo' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 px-[22px] flex gap-2.5 mt-auto pb-5">
        <button className="w-auto px-4 py-3.5 rounded-2xl border-[1.5px] border-white/30 text-white text-[14px] font-bold">
          수정 요청
        </button>
        <Button onClick={handleNext}>{index < rules.length - 1 ? '다음 카드 →' : '전체 확인하기 →'}</Button>
      </div>
    </Shell>
  );
}
