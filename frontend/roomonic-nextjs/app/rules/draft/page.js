'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';
import { Button } from '@/components/UI';
import {
  getCurrentProfileContext,
  getRoommateSelection,
  getRulesDraft,
  savePactCustomRules,
  syncPersistedRoommateState,
} from '@/lib/mockApi';

export default function RulesDraftPage() {
  const router = useRouter();
  const [pact, setPact] = useState(null);
  const [customRule, setCustomRule] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const profile = getCurrentProfileContext();

  useEffect(() => {
    let active = true;
    (async () => {
      await syncPersistedRoommateState();
      if (!active) return;
      const selection = getRoommateSelection();
      if (!selection?.confirmed_at) {
        router.replace('/chat');
        return;
      }

      getRulesDraft()
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
          setError(nextError.message || '약속 초안을 불러오지 못했어요');
        });
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const myCustomRules = useMemo(
    () =>
      (pact?.custom_rules || []).filter(
        (item) => item.created_by_profile_id === profile?.profile_id
      ),
    [pact?.custom_rules, profile?.profile_id]
  );

  async function handleAddRule() {
    const nextRule = customRule.trim();
    if (!nextRule || saving) return;
    setSaving(true);
    setError('');
    try {
      const nextPact = await savePactCustomRules([nextRule]);
      setPact(nextPact);
      setCustomRule('');
    } catch (saveError) {
      setError(saveError.message || '추가 약속 저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="flex-1 bg-[#F6F8FB] px-[22px] pt-8 pb-6">
        <div className="rounded-[28px] bg-white px-5 py-6 shadow-card">
          <p className="text-[12px] font-semibold text-[#6B7280]">AI 약속 초안</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight text-[#111827]">
            함께 살기 전에
            <br />
            먼저 맞춰두면 좋은 약속이에요
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#6B7280]">
            두 사람의 인터뷰 차이를 바탕으로 갈등이 생길 수 있는 상황을 먼저 보고,
            거기에 맞는 생활 약속을 정리했어요.
          </p>
        </div>

        {error ? <p className="mt-4 text-[12px] text-[#C22A5A]">{error}</p> : null}

        {!pact ? (
          <div className="mt-4 rounded-[24px] bg-white px-5 py-8 text-center text-[13px] text-[#6B7280] shadow-card">
            약속 초안을 불러오는 중이에요
          </div>
        ) : (
          <>
            <section className="mt-4 space-y-3">
              {(pact.ai_rules || []).map((item, index) => (
                <div key={item.rule_id} className="rounded-[26px] bg-white px-5 py-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#8B5CF6]">
                        AI 제안 {String(index + 1).padStart(2, '0')}
                      </p>
                      <h2 className="mt-1 text-[18px] font-bold text-[#111827]">{item.title}</h2>
                    </div>
                    <span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-[10.5px] font-bold text-[#6D56D8]">
                      충돌 가능성 {item.severity}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[20px] bg-[#F8FAFC] px-4 py-4">
                    <p className="text-[11px] font-semibold text-[#6B7280]">갈등 상황</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#374151]">{item.scenario}</p>
                  </div>

                  <div className="mt-3 rounded-[20px] bg-[#EEF4FF] px-4 py-4">
                    <p className="text-[11px] font-semibold text-[#4F46E5]">추천 약속</p>
                    <p className="mt-1 text-[15px] font-semibold leading-relaxed text-[#111827]">{item.rule}</p>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-relaxed text-[#6B7280]">{item.reason}</p>
                </div>
              ))}
            </section>

            <section className="mt-4 rounded-[26px] bg-white px-5 py-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#6B7280]">추가 약속</p>
                  <h3 className="mt-1 text-[18px] font-bold text-[#111827]">
                    서로 더 넣고 싶은 약속도 추가할 수 있어요
                  </h3>
                </div>
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[10.5px] font-bold text-[#4B5563]">
                  {pact.custom_rules?.length || 0}개
                </span>
              </div>

              <div className="mt-4 flex gap-2.5">
                <input
                  value={customRule}
                  onChange={(event) => setCustomRule(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleAddRule()}
                  placeholder="예: 친구를 부를 때는 최소 전날 저녁에 먼저 말해요."
                  className="flex-1 rounded-[18px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#111827] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={saving || !customRule.trim()}
                  className="rounded-[18px] bg-[#111827] px-4 py-3 text-[13px] font-bold text-white disabled:bg-[#CBD5E1]"
                >
                  추가
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {(pact.custom_rules || []).length === 0 ? (
                  <div className="rounded-[18px] bg-[#F8FAFC] px-4 py-4 text-[12px] text-[#6B7280]">
                    아직 추가한 약속이 없어요. 필요하면 서로의 생활 스타일에 맞는 약속을 더 넣어보세요.
                  </div>
                ) : (
                  (pact.custom_rules || []).map((item) => (
                    <div key={item.rule_id} className="rounded-[18px] bg-[#F8FAFC] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold leading-relaxed text-[#111827]">{item.rule}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-[10.5px] font-bold text-[#6B7280]">
                          {item.created_by_profile_id === profile?.profile_id ? '내가 추가함' : '상대가 추가함'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {myCustomRules.length > 0 ? (
                <p className="mt-3 text-[11.5px] text-[#6B7280]">
                  내가 추가한 약속 {myCustomRules.length}개가 저장되었어요.
                </p>
              ) : null}
            </section>

            <div className="mt-5">
              <Button onClick={() => router.push('/rules/review')}>전체 약속 검토하기</Button>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </Shell>
  );
}
