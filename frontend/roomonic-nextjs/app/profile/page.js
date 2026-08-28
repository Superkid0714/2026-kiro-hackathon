'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { BackLink, ProgressBar } from '@/components/UI';
import {
  getCurrentAuthContext,
  getCurrentProfileContext,
  getProfile,
  saveProfile,
  updateProfile,
} from '@/lib/mockApi';

const REGIONS = ['광주광역시', '서울특별시', '부산광역시', '전라남도', '전라북도', '제주특별자치도'];
const MOVE_IN_OPTIONS = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'];
const STAY_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '12개월', value: 12 },
  { label: '24개월', value: 24 },
];

function formatGender(value) {
  if (value === 'female') return '여성';
  if (value === 'male') return '남성';
  return '기타';
}

function SelectChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
        active
          ? 'bg-[#6D52E1] text-white shadow-[0_10px_22px_rgba(109,82,225,0.24)]'
          : 'border border-[#E6DFFA] bg-white text-inkSoft'
      }`}
    >
      {label}
    </button>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-[28px] border border-[#E9E2FA] bg-white/92 p-5 shadow-[0_12px_30px_rgba(96,81,163,0.08)]">
      <div className="mb-4">
        <h3 className="text-[17px] font-bold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-[12px] leading-relaxed text-inkSoft">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-[12px] font-bold text-inkSoft">{label}</label>
        {hint ? <span className="text-[11px] text-inkFaint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('22');
  const [gender, setGender] = useState('female');
  const [region, setRegion] = useState('광주광역시');
  const [moveInPeriod, setMoveInPeriod] = useState('2026-09');
  const [stayDurationMonths, setStayDurationMonths] = useState('6');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [restartMode, setRestartMode] = useState(false);
  const [targetProfileId, setTargetProfileId] = useState('');
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams(window.location.search);
    const nextRestartMode = query.get('restart') === '1';
    const explicitProfileId = query.get('profileId') || '';
    const authProfileId = getCurrentAuthContext()?.user?.profile_id || '';
    const fallbackProfileId = getCurrentProfileContext()?.profile_id || '';
    setRestartMode(nextRestartMode);
    setTargetProfileId(explicitProfileId || authProfileId || fallbackProfileId);
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (!queryReady) return;

    const auth = getCurrentAuthContext();
    const profile = getCurrentProfileContext();

    if (!restartMode && (auth?.user?.profile_id || (auth?.access_token && profile?.profile_id))) {
      router.replace('/home');
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        if (restartMode) {
          const candidateProfileIds = [
            targetProfileId,
            auth?.user?.profile_id || '',
            profile?.profile_id || '',
          ].filter(Boolean);

          let body = null;
          for (const profileId of [...new Set(candidateProfileIds)]) {
            try {
              body = await getProfile(profileId);
              break;
            } catch (loadCandidateError) {
              if (
                loadCandidateError?.detail !== 'profile_not_found' &&
                loadCandidateError?.message !== 'profile_not_found'
              ) {
                throw loadCandidateError;
              }
            }
          }

          if (!body?.profile) {
            setRestartMode(false);
            setTargetProfileId('');
            setNickname(auth?.user?.nickname || '');
            setError('기존 프로필을 찾지 못해서 새로 입력할게요');
            return;
          }

          if (cancelled) return;
          const current = body.profile;
          setTargetProfileId(current.profile_id || candidateProfileIds[0] || '');
          setNickname(current.nickname || '');
          setAge(String(current.age || 22));
          setGender(current.gender || 'female');
          setRegion(current.region || '광주광역시');
          setMoveInPeriod(current.move_in_period || '2026-09');
          setStayDurationMonths(String(current.stay_duration_months || 6));
          return;
        }

        if (auth?.user?.nickname) {
          setNickname(auth.user.nickname);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || '프로필 정보를 불러오지 못했어요');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryReady, restartMode, router, targetProfileId]);

  async function handleNext() {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        nickname: nickname.trim(),
        age: Number(age),
        gender,
        region,
        move_in_period: moveInPeriod,
        stay_duration_months: Number(stayDurationMonths),
      };

      if (restartMode) {
        if (!targetProfileId) throw new Error('프로필 정보를 다시 확인해주세요');
        await updateProfile(targetProfileId, payload);
        router.push('/interview');
        return;
      }

      await saveProfile(payload);
      router.push('/home');
    } catch (nextError) {
      if (nextError.message === 'profile_already_linked') {
        router.replace('/home');
        return;
      }
      setError(nextError.message || '프로필 저장에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  const previewBadges = useMemo(
    () =>
      [
        age ? `만 ${age}세` : null,
        region || null,
        moveInPeriod ? `${moveInPeriod} 입주` : null,
        stayDurationMonths ? `${stayDurationMonths}개월 희망` : null,
      ].filter(Boolean),
    [age, moveInPeriod, region, stayDurationMonths]
  );

  return (
    <Shell>
      <div className="flex-1 px-[20px] pt-5 pb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <BackLink onClick={() => router.push(restartMode ? '/home' : '/login')} />
          <div className="min-w-0 flex-1">
            <ProgressBar percent={20} />
            <p className="mt-1 text-right text-[11px] font-semibold text-inkFaint">1 / 5 · 기본 프로필</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[12px] font-semibold text-[#7A6FA8]">
            {restartMode ? '프로필 다시 맞추기' : '프로필 시작하기'}
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-ink">
            {restartMode ? '기본 프로필부터 다시 이어서\n정리해볼게요' : '같이 살 나를 먼저\n간단하게 소개해주세요'}
          </h1>
          <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-inkSoft">
            닉네임, 희망 지역, 입주 시기 같은 기본 정보만 정리하면 다음 단계에서 생활 인터뷰로 바로 이어져요.
          </p>
        </div>

        {!queryReady || pageLoading ? (
          <div className="pt-10 text-center text-[12px] text-inkFaint">프로필 정보를 불러오는 중이에요</div>
        ) : (
          <>
            <section className="rounded-[30px] border border-[#E7DFFF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F0FF_100%)] p-5 shadow-[0_20px_46px_rgba(109,82,225,0.10)]">
              <div className="flex items-center gap-4">
                <div className="flex h-[108px] w-[108px] items-center justify-center rounded-[28px] bg-[#EFE7FF]">
                  <img src="/images/characters/UNI.png" alt="프로필 캐릭터" className="h-[96px] w-[96px] object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full bg-[#EEE7FF] px-3 py-1 text-[10px] font-bold text-[#6D52E1]">
                    {restartMode ? '수정 모드' : '기본 프로필'}
                  </span>
                  <p className="mt-3 text-[24px] font-extrabold text-ink">{nickname.trim() || '닉네임 미입력'}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-inkSoft">
                    함께 살기 시작하기 전에 필요한 기본 조건을 정리하는 단계예요.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {previewBadges.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#E7DFFF] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <div className="mt-4 grid gap-4">
              <FormSection title="기본 정보" description="룸메이트가 나를 이해할 수 있는 가장 기본적인 정보예요.">
                <Field label="닉네임">
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="예: 지수"
                    className="input"
                  />
                </Field>

                <Field label="나이">
                  <input
                    type="number"
                    min="17"
                    max="100"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="성별">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '여성', value: 'female' },
                      { label: '남성', value: 'male' },
                      { label: '기타', value: 'other' },
                    ].map((option) => (
                      <SelectChip
                        key={option.value}
                        label={option.label}
                        active={gender === option.value}
                        onClick={() => setGender(option.value)}
                      />
                    ))}
                  </div>
                </Field>
              </FormSection>

              <FormSection title="거주 계획" description="추천과 매칭 계산에 바로 연결되는 조건들이에요.">
                <Field label="거주 희망 지역">
                  <div className="grid grid-cols-2 gap-2">
                    {REGIONS.map((option) => (
                      <SelectChip
                        key={option}
                        label={option}
                        active={region === option}
                        onClick={() => setRegion(option)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="입주 예정 시기">
                  <div className="flex flex-wrap gap-2">
                    {MOVE_IN_OPTIONS.map((option) => (
                      <SelectChip
                        key={option}
                        label={option}
                        active={moveInPeriod === option}
                        onClick={() => setMoveInPeriod(option)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="거주 예정 기간">
                  <div className="flex flex-wrap gap-2">
                    {STAY_OPTIONS.map((option) => (
                      <SelectChip
                        key={option.value}
                        label={option.label}
                        active={String(option.value) === stayDurationMonths}
                        onClick={() => setStayDurationMonths(String(option.value))}
                      />
                    ))}
                  </div>
                </Field>
              </FormSection>
            </div>

            {error ? (
              <div className="mt-4 rounded-[18px] border border-[#FFD8E5] bg-[#FFF5F8] px-4 py-3 text-[12px] text-[#C22A5A]">
                {error}
              </div>
            ) : null}

            <div className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,#6E56D8_0%,#8B6DFF_100%)] p-4 text-white shadow-[0_18px_38px_rgba(109,82,225,0.22)]">
              <p className="text-[11px] font-semibold text-white/78">다음 단계</p>
              <p className="mt-1 text-[18px] font-bold">생활 인터뷰에서 생활 패턴과 취향을 더 자세히 받을게요</p>
              <button
                type="button"
                onClick={handleNext}
                className={`mt-4 flex w-full items-center justify-center rounded-2xl bg-[#FFEFA8] px-4 py-3.5 text-[14.5px] font-bold text-[#3B2A78] shadow-[0_10px_22px_rgba(50,31,117,0.18)] transition active:scale-95 ${
                  loading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {loading ? '저장 중...' : restartMode ? '생활 인터뷰로 이어가기' : '저장하고 홈으로 가기'}
              </button>
            </div>

            <div className="mt-4 rounded-[22px] bg-white/78 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1EBFF] text-[18px]">
                  {gender === 'female' ? '👩' : gender === 'male' ? '👨' : '🙂'}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-ink">현재 입력 요약</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-inkSoft">
                    {formatGender(gender)} · {age || '-'}세 · {region} · {moveInPeriod} 입주 · {stayDurationMonths}개월 거주 희망
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
