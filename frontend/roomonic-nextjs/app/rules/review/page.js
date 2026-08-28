'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, Card, Tag } from '@/components/UI';
import { getRulesReview } from '@/lib/mockApi';

const STATUS_TAG = {
  agreed: <Tag tone="mint">동의함</Tag>,
  revise: <Tag tone="warn">수정 요청</Tag>,
  pending: <Tag>대기중</Tag>,
};

export default function RulesReviewPage() {
  const router = useRouter();
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getRulesReview().then(setRules);
  }, []);

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/rules/draft')} />
        <h2 className="text-[17px] font-bold mt-3 mb-0.5">생활수칙 {rules.length}개를 검토해주세요</h2>
        <p className="text-[11.5px] text-inkFaint mb-3.5">모두 동의하면 서명 단계로 넘어가요</p>
      </div>
      <div className="px-[22px] flex-1 flex flex-col gap-2.5">
        {rules.map((r) => (
          <Card key={r.id} className="flex justify-between items-center">
            <div>
              <p className="font-bold text-[12.5px] mb-0.5">{r.title}</p>
              <p className="text-[11.5px] text-inkFaint">{r.desc}</p>
            </div>
            {STATUS_TAG[r.status]}
          </Card>
        ))}
      </div>
      <div className="px-[22px] pb-5">
        <Button onClick={() => router.push('/signature')}>모두 동의하고 서명하기 →</Button>
      </div>
    </Shell>
  );
}
