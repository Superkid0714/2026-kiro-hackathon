'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar } from '@/components/UI';
import { saveProfile } from '@/lib/mockApi';

export default function ProfilePage() {
  const router = useRouter();
  const [gender, setGender] = useState('여성');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setLoading(true);
    await saveProfile({ gender });
    router.push('/interview');
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5 flex-1">
        <BackLink onClick={() => router.push('/signup')} />
        <div className="mt-3">
          <ProgressBar percent={20} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-3.5">1 / 5 · 기본 프로필</p>
        <h2 className="text-[17px] font-bold mb-4">어떤 분인지 알려주세요</h2>

        <Field label="닉네임">
          <input placeholder="예: 지수" className="input" />
        </Field>
        <Field label="연령대">
          <select className="input">
            <option>20대</option>
            <option>30대</option>
            <option>40대 이상</option>
          </select>
        </Field>
        <Field label="성별">
          <div className="flex gap-2">
            {['여성', '남성', '기타'].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`px-3.5 py-2 rounded-xl border-[1.5px] text-[12.5px] font-semibold ${
                  gender === g ? 'bg-indigo border-indigo text-white' : 'bg-white border-line text-inkSoft'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>
        <Field label="거주 희망 지역">
          <select className="input">
            <option>광주광역시</option>
            <option>서울특별시</option>
            <option>부산광역시</option>
          </select>
        </Field>
        <Field label="입주 예정 시기">
          <select className="input">
            <option>2025년 8월</option>
            <option>2025년 9월</option>
          </select>
        </Field>
        <Field label="거주 예정 기간">
          <select className="input">
            <option>6개월 이상</option>
            <option>1년 이상</option>
            <option>미정</option>
          </select>
        </Field>

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
