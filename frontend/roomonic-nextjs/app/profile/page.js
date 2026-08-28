'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar } from '@/components/UI';
import { getCurrentAuthContext, saveProfile } from '@/lib/mockApi';

const REGIONS = ['광주광역시', '서울특별시', '부산광역시', '전라남도', '전라북도', '제주특별자치도'];
const MOVE_IN_OPTIONS = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'];
const STAY_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '12개월', value: 12 },
  { label: '24개월', value: 24 },
];

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('22');
  const [gender, setGender] = useState('female');
  const [region, setRegion] = useState('광주광역시');
  const [moveInPeriod, setMoveInPeriod] = useState('2026-09');
  const [stayDurationMonths, setStayDurationMonths] = useState('6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getCurrentAuthContext();
    if (auth?.user?.nickname) {
      setNickname(auth.user.nickname);
    }
  }, []);

  async function handleNext() {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await saveProfile({
        nickname: nickname.trim(),
        age: Number(age),
        gender,
        region,
        move_in_period: moveInPeriod,
        stay_duration_months: Number(stayDurationMonths),
      });
      router.push('/interview');
    } catch (error) {
      setError(error.message || '프로필 저장에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5 flex-1">
        <BackLink onClick={() => router.push('/login')} />
        <div className="mt-3">
          <ProgressBar percent={20} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-3.5">1 / 5 · 기본 프로필</p>
        <h2 className="text-[17px] font-bold mb-4">어떤 분인지 알려주세요</h2>

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
          <div className="flex gap-2">
            {[
              { label: '여성', value: 'female' },
              { label: '남성', value: 'male' },
              { label: '기타', value: 'other' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={`px-3.5 py-2 rounded-xl border-[1.5px] text-[12.5px] font-semibold ${
                  gender === option.value
                    ? 'bg-indigo border-indigo text-white'
                    : 'bg-white border-line text-inkSoft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="거주 희망 지역">
          <select value={region} onChange={(event) => setRegion(event.target.value)} className="input">
            {REGIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="입주 예정 시기">
          <select
            value={moveInPeriod}
            onChange={(event) => setMoveInPeriod(event.target.value)}
            className="input"
          >
            {MOVE_IN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="거주 예정 기간">
          <select
            value={stayDurationMonths}
            onChange={(event) => setStayDurationMonths(event.target.value)}
            className="input"
          >
            {STAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-[12px] text-[#C22A5A] mb-2">{error}</p>}

        <Button onClick={handleNext} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '저장 중...' : '다음 →'}
        </Button>
      </div>
    </Shell>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="text-[12px] font-bold text-inkSoft block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
