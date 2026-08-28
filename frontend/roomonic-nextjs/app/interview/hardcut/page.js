'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar, Chip, Tag } from '@/components/UI';
import { HARDCUT_OPTIONS } from '@/lib/mockData';

export default function HardcutPage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);

  function toggle(opt) {
    if (selected.includes(opt)) {
      setSelected(selected.filter((s) => s !== opt));
    } else {
      if (selected.length >= 3) {
        alert('Hardcut 조건은 최대 3개까지 선택할 수 있어요');
        return;
      }
      setSelected([...selected, opt]);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/interview')} />
        <div className="mt-3">
          <ProgressBar percent={70} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-3.5">17 / 24 · 절대 조건</p>
      </div>
      <div className="px-[22px] flex-1">
        <Tag tone="hard">Hardcut 지정 가능 · 최대 3개</Tag>
        <h2 className="text-[16.5px] font-bold mt-2.5 mb-1 leading-relaxed">
          절대 함께 살 수 없는 조건을
          <br />
          선택해주세요
        </h2>
        <p className="text-[11.5px] text-inkFaint mb-4">선택한 항목은 매칭에서 자동으로 제외돼요</p>
        <div className="flex flex-wrap gap-2">
          {HARDCUT_OPTIONS.map((opt) => (
            <Chip key={opt} danger selected={selected.includes(opt)} onClick={() => toggle(opt)}>
              {opt}
            </Chip>
          ))}
        </div>
        <p className="text-[11.5px] text-inkFaint mt-3">{selected.length} / 3 선택됨</p>
      </div>
      <div className="px-[22px] pb-5">
        <Button onClick={() => router.push('/interview/result')}>다음 →</Button>
      </div>
    </Shell>
  );
}
