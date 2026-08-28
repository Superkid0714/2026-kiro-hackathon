'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { getCandidates } from '@/lib/mockApi';

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates().then((data) => {
      setCandidates(data);
      setLoading(false);
    });
  }, []);

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <h2 className="text-lg font-bold mt-2 mb-1">오늘의 룸메이트 후보</h2>
        <p className="text-[11.5px] text-inkFaint mb-3">Hardcut 조건에 걸리지 않은 후보만 보여드려요</p>
        <div className="flex gap-2 mb-3.5">
          <select className="flex-1 px-2.5 py-2 rounded-[10px] border-[1.5px] border-line text-[12px]">
            <option>호환성 점수 순</option>
            <option>희망 지역 순</option>
            <option>입주 시기 순</option>
          </select>
          <Button variant="ghost" fullWidth={false} className="px-3.5 py-2 text-[12.5px] rounded-xl">
            필터
          </Button>
        </div>
      </div>

      <div className="px-[22px] flex-1 flex flex-col gap-3">
        {loading && <p className="text-center text-inkFaint text-sm py-10">후보를 불러오는 중...</p>}
        {candidates.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/candidates/${c.id}`)}
            className="bg-white rounded-[18px] p-4 shadow-card border border-line flex gap-3 items-center text-left"
          >
            <div className={`w-[52px] h-[52px] rounded-2xl ${c.bg} flex items-center justify-center text-2xl`}>
              {c.emoji}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{c.name}님</p>
              <p className="text-[11.5px] text-inkFaint mt-0.5">
                {c.region} · {c.moveIn} 입주 희망
              </p>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-indigo text-base">{c.score}%</div>
              <div className="text-inkFaint text-[9.5px]">호환</div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-[22px] pb-2.5 pt-1.5">
        <Button variant="soft" onClick={() => router.push('/register')}>
          마음에 드는 후보가 없나요? 내 정보 등록하기
        </Button>
      </div>

      <div className="flex border-t border-line bg-white px-1.5 pt-2 pb-3.5">
        {[
          ['🏠', '집'],
          ['⭐', '추천'],
          ['💬', '채팅'],
          ['📋', '약속'],
          ['👤', '마이'],
        ].map(([icon, label], i) => (
          <div key={label} className={`flex-1 text-center text-[10px] font-semibold ${i === 0 ? 'text-indigo' : 'text-inkFaint'}`}>
            <span className="block text-base mb-0.5">{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </Shell>
  );
}
