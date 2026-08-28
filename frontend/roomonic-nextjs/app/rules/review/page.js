'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';
import { BackLink, Button } from '@/components/UI';
import { getCurrentProfileContext, getRoommateSelection, getRulesReview } from '@/lib/mockApi';

export default function RulesReviewPage() {
  const router = useRouter();
  const [pact, setPact] = useState(null);
  const [error, setError] = useState('');
  const profile = getCurrentProfileContext();

  useEffect(() => {
    const selection = getRoommateSelection();
    if (!selection?.confirmed_at) {
      router.replace('/chat');
      return undefined;
    }

    let active = true;
    getRulesReview()
      .then((nextPact) => {
        if (!active) return;
        if (nextPact?.signature_status === 'completed') {
          router.replace('/final');
          return;
        }
        setPact(nextPact);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(nextError.message || '약속 목록을 불러오지 못했어요');
      });
    return () => {
      active = false;
    };
  }, [router]);

  const allRules = useMemo(() => {
    if (!pact) return [];
    const aiRules = (pact.ai_rules || []).map((item) => ({
      id: item.rule_id,
      title: item.title,
      desc: item.rule,
      badge: 'AI 제안',
    }));
    const customRules = (pact.custom_rules || []).map((item, index) => ({
      id: item.rule_id,
      title: `추가 약속 ${index + 1}`,
      desc: item.rule,
      badge: item.created_by_profile_id === profile?.profile_id ? '내가 추가함' : '상대가 추가함',
    }));
    return [...aiRules, ...customRules];
  }, [pact, profile?.profile_id]);

  const participants = pact?.participants || [];
  const mySignature = pact?.signatures?.[profile?.profile_id];

  return (
    <Shell>
      <div className="flex-1 bg-[#F6F8FB] px-[22px] pt-8 pb-6">
        <BackLink onClick={() => router.push('/rules/draft')} />
        <div className="mt-4 rounded-[28px] bg-white px-5 py-6 shadow-card">
          <p className="text-[12px] font-semibold text-[#6B7280]">최종 검토</p>
          <h1 className="mt-1 text-[25px] font-bold leading-tight text-[#111827]">
            우리 둘이 지킬 약속을
            <br />
            한 번에 확인해봐요
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#6B7280]">
            AI가 먼저 정리한 약속과 서로 추가한 약속을 함께 보고, 괜찮다면 서명 단계로 넘어가면 돼요.
          </p>
        </div>

        {error ? <p className="mt-4 text-[12px] text-[#C22A5A]">{error}</p> : null}

        {!pact ? (
          <div className="mt-4 rounded-[24px] bg-white px-5 py-8 text-center text-[13px] text-[#6B7280] shadow-card">
            약속 목록을 불러오는 중이에요
          </div>
        ) : (
          <>
            <section className="mt-4 space-y-3">
              {allRules.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-white px-5 py-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-bold text-[#111827]">{item.title}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">{item.desc}</p>
                    </div>
                    <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[10.5px] font-bold text-[#4B5563]">
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-4 rounded-[24px] bg-white px-5 py-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#6B7280]">서명 상태</p>
                  <h3 className="mt-1 text-[18px] font-bold text-[#111827]">두 사람 모두 서명하면 약속이 확정돼요</h3>
                </div>
                <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[10.5px] font-bold text-[#4F46E5]">
                  {pact.signature_status === 'completed' ? '완료' : '진행 중'}
                </span>
              </div>
              <div className="mt-4 grid gap-2.5">
                {participants.map((participant) => {
                  const signed = pact.signatures?.[participant.profile_id];
                  return (
                    <div key={participant.profile_id} className="rounded-[18px] bg-[#F8FAFC] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-[#111827]">{participant.nickname}</p>
                          <p className="mt-1 text-[11.5px] text-[#6B7280]">
                            {signed ? `${signed.signer_name} 이름으로 서명 완료` : '아직 서명 전'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${
                            signed ? 'bg-[#E8FFF5] text-[#0F9F6E]' : 'bg-white text-[#6B7280]'
                          }`}
                        >
                          {signed ? '서명됨' : '대기중'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!mySignature ? (
                <Button className="mt-5" onClick={() => router.push('/signature')}>
                  내 서명하러 가기
                </Button>
              ) : (
                <Button className="mt-5" onClick={() => router.push('/signature')} variant="ghost">
                  서명 다시 보기
                </Button>
              )}
            </section>
          </>
        )}
      </div>
      <BottomNav />
    </Shell>
  );
}
