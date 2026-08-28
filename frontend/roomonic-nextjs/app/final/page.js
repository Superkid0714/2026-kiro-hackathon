'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';
import {
  getCurrentProfileContext,
  getRoommateSelection,
  getRulesReview,
  syncPersistedRoommateState,
} from '@/lib/mockApi';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function buildCopyText(pact) {
  const participantNames = (pact?.participants || []).map((item) => item.nickname).join(' · ');
  const rules = [
    ...(pact?.ai_rules || []).map((item, index) => `${index + 1}. ${item.rule}`),
    ...(pact?.custom_rules || []).map((item, index) => `${(pact?.ai_rules || []).length + index + 1}. ${item.rule}`),
  ];
  return `${participantNames} 생활 약속\n\n${rules.join('\n')}`;
}

export default function FinalPage() {
  const router = useRouter();
  const profile = getCurrentProfileContext();
  const [pact, setPact] = useState(null);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);

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

      getRulesReview()
        .then((nextPact) => {
          if (!active) return;
          setPact(nextPact);
        })
        .catch((nextError) => {
          if (!active) return;
          setError(nextError.message || '약속 결과를 불러오지 못했어요');
        });
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const participants = pact?.participants || [];
  const mySignature = pact?.signatures?.[profile?.profile_id];
  const signedCount = Object.keys(pact?.signatures || {}).length;
  const allRules = useMemo(() => {
    if (!pact) return [];
    return [
      ...(pact.ai_rules || []).map((item) => ({
        id: item.rule_id,
        title: item.title,
        description: item.rule,
        badge: 'AI 약속',
      })),
      ...(pact.custom_rules || []).map((item, index) => ({
        id: item.rule_id,
        title: `추가 약속 ${index + 1}`,
        description: item.rule,
        badge: item.created_by_profile_id === profile?.profile_id ? '내가 추가함' : '함께 추가함',
      })),
    ];
  }, [pact, profile?.profile_id]);

  async function handleShare() {
    if (!pact) return;
    const text = buildCopyText(pact);
    try {
      if (navigator?.share) {
        await navigator.share({
          title: 'Roomonic 생활 약속',
          text,
        });
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Ignore dismissed share dialogs and clipboard failures.
    }
  }

  return (
    <Shell>
      <main className="relative z-10 flex-1 bg-[linear-gradient(180deg,#FBF8FF_0%,#F3ECFF_50%,#EEE6FF_100%)] px-[20px] pb-28 pt-6">
        {!pact ? (
          <div className="rounded-[28px] border border-[#E9E1FF] bg-white px-5 py-6 text-center shadow-[0_18px_42px_rgba(109,82,225,0.12)]">
            <p className="text-[15px] font-bold text-[#2A214A]">
              {error || '약속 결과를 정리하고 있어요'}
            </p>
            <p className="mt-2 text-[12px] text-[#7A74A8]">잠시만 기다리면 바로 확인할 수 있어요.</p>
          </div>
        ) : (
          <>
            <div className="rounded-[32px] border border-[#E9E1FF] bg-white px-5 py-6 shadow-[0_18px_48px_rgba(109,82,225,0.14)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-[#8B7FD8]">
                    {pact.signature_status === 'completed' ? '약속 확정 완료' : '약속 서명 진행 중'}
                  </p>
                  <h1 className="mt-1 text-[28px] font-black leading-tight text-[#17132B]">
                    {participants.map((item) => item.nickname).join(' · ')}
                    <br />
                    생활 약속판
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="약속 공유하기"
                  className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F2ECFF] text-[#5B3FD1] shadow-[0_10px_24px_rgba(91,63,209,0.14)] transition active:scale-95"
                >
                  <svg
                    className="h-[20px] w-[20px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M8.2 12.9L15.8 17.2M15.8 6.8L8.2 11.1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx="6.8" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.2" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.2" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-[#F5F0FF] px-3 py-1.5 text-[11px] font-black text-[#6D52E1]">
                {signedCount}/{participants.length} 서명
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-[#6D668E]">
                {pact.signature_status === 'completed'
                  ? '두 사람의 약속이 모두 저장됐어요. 이제 같은 기준으로 생활을 시작하면 돼요.'
                  : mySignature
                    ? '내 서명은 저장됐어요. 상대가 서명하면 이 약속이 최종 확정돼요.'
                    : '약속 내용은 정리됐어요. 이제 내 서명만 남아 있어요.'}
              </p>

              {shared ? (
                <div className="mt-4 rounded-[18px] bg-[#EFE8FF] px-4 py-3 text-[12px] font-bold text-[#5B3FD1]">
                  공유할 약속 내용을 준비했어요.
                </div>
              ) : null}

              <div className="mt-5 rounded-[28px] border border-[#EEE8FF] bg-[#FEFCFF] px-4 py-4 text-[#111827] shadow-[0_12px_30px_rgba(109,82,225,0.08)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#EEE8FF] pb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#8B5CF6]">OUR PACT</p>
                    <p className="mt-1 text-[17px] font-bold">
                      함께 지킬 생활 기준 {allRules.length}개
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-[#6B7280]">
                    <p>{formatDate(pact.updated_at || pact.generated_at)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {allRules.map((item, index) => (
                    <div key={item.id} className="rounded-[22px] border border-[#EEE8FF] bg-[#FAF8FF] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-[#7C6AE6]">
                            RULE {String(index + 1).padStart(2, '0')}
                          </p>
                          <h2 className="mt-1 text-[15px] font-bold text-[#111827]">{item.title}</h2>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#6B7280]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {participants.map((participant) => {
                    const signed = pact.signatures?.[participant.profile_id];
                    return (
                      <div key={participant.profile_id} className="rounded-[20px] bg-[#F6F8FB] px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] text-[#6B7280]">{participant.nickname}</p>
                            <p className="mt-1 text-[14px] font-bold text-[#111827]">
                              {signed ? '서명 완료' : '서명 대기'}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
                              {signed ? `${signed.signer_name} 이름으로 저장됐어요` : '아직 확인 중이에요'}
                            </p>
                          </div>
                          {signed?.signature_data_url ? (
                            <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white p-1 shadow-sm">
                              <img
                                src={signed.signature_data_url}
                                alt={`${participant.nickname} 서명`}
                                className="h-[48px] w-[84px] object-contain"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </Shell>
  );
}
