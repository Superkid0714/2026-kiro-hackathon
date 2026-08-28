'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar, Tag } from '@/components/UI';
import { getCurrentProfileContext, submitInterviewAnswers } from '@/lib/mockApi';

const INTERVIEW_DRAFT_KEY = 'roomonic-interview-draft';

export default function HardcutPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const profile = getCurrentProfileContext();
    if (!profile?.profile_id) {
      router.replace('/profile');
      return;
    }

    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(INTERVIEW_DRAFT_KEY);
    if (!raw) {
      router.replace('/interview');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setDraft(parsed);
    } catch {
      router.replace('/interview');
    }
  }, [router]);

  async function handleSubmit() {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(INTERVIEW_DRAFT_KEY);
    if (!raw) {
      setError('인터뷰 답변을 다시 입력해주세요');
      router.push('/interview');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError('인터뷰 임시 저장값을 읽지 못했어요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await submitInterviewAnswers(parsed);
      window.localStorage.removeItem(INTERVIEW_DRAFT_KEY);
      router.push('/interview/result');
    } catch (submitError) {
      const nextMessage = submitError.message || '인터뷰 저장에 실패했어요';
      setError(nextMessage);
      if (nextMessage === '프로필 정보를 다시 확인해주세요') {
        window.localStorage.removeItem(INTERVIEW_DRAFT_KEY);
        router.replace('/profile');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={() => router.push('/interview')} />
        <div className="mt-3">
          <ProgressBar percent={100} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-3.5">완료 전 최종 확인</p>
      </div>
      <div className="px-[22px] flex-1 pb-6">
        <Tag tone="hard">포기 못해 요약</Tag>
        <h2 className="text-[16.5px] font-bold mt-2.5 mb-1 leading-relaxed">
          이번 인터뷰에서 꼭 지키고 싶은 기준을
          <br />
          마지막으로 확인해주세요
        </h2>
        <p className="text-[11.5px] text-inkFaint mb-4">
          여기서 확인한 항목은 매칭할 때 우선적으로 충돌 여부를 보게 돼요.
        </p>

        <div className="rounded-[20px] border border-line bg-white px-4 py-4">
          <p className="text-[12px] font-bold text-ink">선택한 포기 못해</p>
          {!draft?.hardcut_conditions?.length ? (
            <p className="mt-2 text-[11.5px] leading-relaxed text-inkFaint">
              아직 따로 지정한 항목은 없어요. 이 경우 전체 답변을 기준으로만 추천이 진행돼요.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.hardcut_conditions.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#FDE1E9] px-3 py-1.5 text-[11px] font-semibold text-[#C22A5A]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[20px] border border-line bg-white px-4 py-4">
          <p className="text-[12px] font-bold text-ink">저장 후 열리는 것</p>
          <div className="mt-3 space-y-2">
            {[
              '생활 유형 분석 결과',
              '내 캐릭터 화면',
              '오늘의 추천 후보 뽑기',
            ].map((item) => (
              <div key={item} className="rounded-[16px] bg-[#F8F5FF] px-3 py-3 text-[12px] font-semibold text-ink">
                {item}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-[12px] text-[#C22A5A]">{error}</p>}
      </div>
      <div className="px-[22px] pb-5 flex gap-2.5">
        <Button variant="ghost" fullWidth={false} className="px-5" onClick={() => router.push('/interview')}>
          수정하기
        </Button>
        <Button onClick={handleSubmit} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '저장 중...' : '분석 결과 보기 →'}
        </Button>
      </div>
    </Shell>
  );
}
