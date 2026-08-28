'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button, ProgressBar, Tag } from '@/components/UI';
import { getCurrentProfileContext } from '@/lib/mockApi';

const INTERVIEW_DRAFT_KEY = 'roomonic-interview-draft';
const MAX_NON_NEGOTIABLE = 3;

const TIME_OPTIONS = Array.from({ length: 24 * 6 }, (_, index) => {
  const hour = String(Math.floor(index / 6)).padStart(2, '0');
  const minute = String((index % 6) * 10).padStart(2, '0');
  return `${hour}:${minute}`;
});

const COUNT_OPTIONS = ['1', '2', '3', '4', '5', '6', '매일'];

const DEFAULT_FORM = {
  wake_up_time: '',
  sleep_time: '',
  noise_sensitive: null,
  quiet_hours_start: '',
  cleaning_frequency: '',
  dishes_deadline: '',
  guest_frequency: '',
  smokes: null,
  smoking_type: '',
  smoking_place: '',
  drinking_frequency: '',
  home_stay_frequency: '',
  meal_preference: '',
  home_activity_frequency: '',
  supplies_sharing: '',
  summer_temperature: '',
  winter_temperature: '',
  pet_ok: null,
  pet_preference: '',
  conflict_resolution: '',
  shared_cost_rule: '',
  personal_space_access: '',
  personal_space_ratio: '',
  security_preference: '',
  absence_notice: '',
  hardcut_conditions: [],
};

const STEP_GROUPS = [
  {
    id: 'rhythm',
    progress: 40,
    label: '2 / 5 · 생활 인터뷰',
    title: '수면과 생활 리듬',
    description: '하루의 시작과 마무리 방식부터 맞춰볼게요.',
    questions: ['wake_up_time', 'sleep_time', 'noise_sensitive', 'quiet_hours_start'],
  },
  {
    id: 'habit',
    progress: 55,
    label: '3 / 5 · 생활 인터뷰',
    title: '청결과 생활 습관',
    description: '공용공간 사용과 일상 습관을 정리해요.',
    questions: [
      'cleaning_frequency',
      'dishes_deadline',
      'guest_frequency',
      'smokes',
      'smoking_type',
      'smoking_place',
      'drinking_frequency',
      'home_stay_frequency',
      'meal_preference',
      'home_activity_frequency',
    ],
  },
  {
    id: 'sharing',
    progress: 70,
    label: '4 / 5 · 생활 인터뷰',
    title: '공유와 공간',
    description: '함께 쓰는 것과 개인 공간 기준을 맞춰요.',
    questions: [
      'supplies_sharing',
      'conflict_resolution',
      'shared_cost_rule',
      'personal_space_access',
      'personal_space_ratio',
    ],
  },
  {
    id: 'environment',
    progress: 82,
    label: '5 / 5 · 생활 인터뷰',
    title: '환경과 안전',
    description: '온도, 반려동물, 보안 선호를 마지막으로 확인해요.',
    questions: [
      'summer_temperature',
      'winter_temperature',
      'pet_ok',
      'pet_preference',
      'security_preference',
      'absence_notice',
    ],
  },
];

const QUESTION_META = {
  wake_up_time: { label: '몇 시에 일어나나요?', type: 'select', options: TIME_OPTIONS },
  sleep_time: { label: '몇 시에 잠드나요?', type: 'select', options: TIME_OPTIONS },
  noise_sensitive: { label: '생활 소음에 많이 민감한가요?', type: 'boolean' },
  quiet_hours_start: {
    label: '몇 시 이후부터는 조용하게 지냈으면 하나요?',
    type: 'select',
    options: TIME_OPTIONS,
  },
  cleaning_frequency: {
    label: '주에 몇 번 청소했으면 하나요?',
    type: 'select',
    options: COUNT_OPTIONS,
  },
  dishes_deadline: {
    label: '공용 물건 정리와 설거지는 언제 끝내야 하나요?',
    type: 'select',
    options: ['바로', '그날 이내에', '다음날 아침'],
  },
  guest_frequency: {
    label: '지인을 집에 초대하는 건 주에 몇 번까지 괜찮은가요?',
    type: 'select',
    options: COUNT_OPTIONS,
  },
  smokes: { label: '담배를 피우나요?', type: 'boolean' },
  smoking_type: {
    label: '담배 종류는 무엇인가요?',
    type: 'text',
    placeholder: '예: 전자담배',
    dependsOn: (form) => form.smokes === true,
  },
  smoking_place: {
    label: '어디서 피우는 게 좋은가요?',
    type: 'select',
    options: ['밖', '베란다', '집 안'],
    dependsOn: (form) => form.smokes === true,
  },
  drinking_frequency: {
    label: '술을 자주 마시나요?',
    type: 'select',
    options: COUNT_OPTIONS,
  },
  home_stay_frequency: {
    label: '주에 집에 얼마나 머무나요?',
    type: 'select',
    options: COUNT_OPTIONS,
  },
  meal_preference: {
    label: '배달음식 혹은 직접 요리 중 어떤 걸 선호하나요?',
    type: 'select',
    options: ['배달', '직접'],
  },
  home_activity_frequency: {
    label: '집에서 게임/공부/재택근무를 얼마나 자주 하나요?',
    type: 'select',
    options: COUNT_OPTIONS,
  },
  supplies_sharing: {
    label: '생필품과 식재료는 어떻게 사용하는 게 편한가요?',
    type: 'select',
    options: ['공동구매', '각자', '일부 공유'],
  },
  conflict_resolution: {
    label: '문제가 생기면 어떻게 해결하는 게 편한가요?',
    type: 'select',
    options: ['즉시 대면', '모아서 대면'],
  },
  shared_cost_rule: {
    label: '공동 생활 비용은 어떻게 관리하는 게 좋은가요?',
    type: 'select',
    options: ['반반', '거주 시간 비율'],
  },
  personal_space_access: {
    label: '서로의 방이나 개인 공간에 들어가는 것에 대해 어떻게 생각하나요?',
    type: 'select',
    options: ['자유롭게', '노크 혹은 허락', '불가능'],
  },
  personal_space_ratio: {
    label: '개인 공간 비율은 어떻게 나누는 게 낫나요?',
    type: 'select',
    options: ['반반', '필요한 만큼'],
  },
  summer_temperature: {
    label: '여름에는 어떤 실내 온도를 선호하나요?',
    type: 'number',
    min: 16,
    max: 35,
    unit: '도',
  },
  winter_temperature: {
    label: '겨울에는 어떤 실내 온도를 선호하나요?',
    type: 'number',
    min: 10,
    max: 30,
    unit: '도',
  },
  pet_ok: { label: '반려동물과 함께 거주해도 괜찮은가요?', type: 'boolean' },
  pet_preference: {
    label: '괜찮은 반려동물 종류는 무엇인가요?',
    type: 'select',
    options: ['고양이', '강아지', '둘 다'],
    dependsOn: (form) => form.pet_ok === true,
  },
  security_preference: {
    label: '방문과 창문은 얼마나 철저하게 관리했으면 하나요?',
    type: 'select',
    options: ['항시 잠금', '외출시', '상관없음'],
  },
  absence_notice: {
    label: '집을 장시간 비울 경우, 사전에 알려주는 게 필요한가요?',
    type: 'select',
    options: ['항상', '하루 이상', '필요 없음'],
  },
};

export default function InterviewPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const profile = getCurrentProfileContext();
    if (!profile?.profile_id) {
      router.replace('/profile');
      return;
    }

    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(INTERVIEW_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore broken draft
    }
  }, [router]);

  const step = STEP_GROUPS[stepIndex];
  const visibleQuestions = useMemo(
    () =>
      step.questions.filter((key) => {
        const meta = QUESTION_META[key];
        return !meta.dependsOn || meta.dependsOn(form);
      }),
    [form, step.questions]
  );

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'smokes' && value !== true) {
        next.smoking_type = '';
        next.smoking_place = '';
        next.hardcut_conditions = next.hardcut_conditions.filter(
          (item) =>
            item !== QUESTION_META.smoking_type.label &&
            item !== QUESTION_META.smoking_place.label
        );
      }
      if (key === 'pet_ok' && value !== true) {
        next.pet_preference = '';
        next.hardcut_conditions = next.hardcut_conditions.filter(
          (item) => item !== QUESTION_META.pet_preference.label
        );
      }
      return next;
    });
    setError('');
  }

  function toggleNonNegotiable(questionKey) {
    const label = QUESTION_META[questionKey].label;
    setForm((prev) => {
      const already = prev.hardcut_conditions.includes(label);
      if (already) {
        return {
          ...prev,
          hardcut_conditions: prev.hardcut_conditions.filter((item) => item !== label),
        };
      }
      if (prev.hardcut_conditions.length >= MAX_NON_NEGOTIABLE) {
        setError('포기 못해 조건은 최대 3개까지 선택할 수 있어요.');
        return prev;
      }
      setError('');
      return {
        ...prev,
        hardcut_conditions: [...prev.hardcut_conditions, label],
      };
    });
  }

  function validateStep() {
    for (const key of visibleQuestions) {
      const value = form[key];
      if (value === null || value === undefined || value === '') {
        return `${QUESTION_META[key].label} 질문에 답변해주세요.`;
      }
    }
    return '';
  }

  function handleNext() {
    const nextError = validateStep();
    if (nextError) {
      setError(nextError);
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTERVIEW_DRAFT_KEY, JSON.stringify(form));
    }

    if (stepIndex === STEP_GROUPS.length - 1) {
      router.push('/interview/hardcut');
      return;
    }

    setError('');
    setStepIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setError('');
    setStepIndex((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5">
        <BackLink onClick={handleBack} />
        <div className="mt-3">
          <ProgressBar percent={step.progress} />
        </div>
        <p className="text-[11.5px] text-inkFaint mt-1 mb-2">{step.label}</p>
        <Tag tone="hard">질문마다 포기 못해 선택 가능 · 최대 3개</Tag>
        <h2 className="mt-3 text-[18px] font-bold text-ink">{step.title}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-inkFaint">{step.description}</p>
      </div>

      <div className="px-[22px] flex-1 overflow-y-auto pb-6 pt-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {STEP_GROUPS.map((item, index) => (
            <span
              key={item.id}
              className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${
                index === stepIndex
                  ? 'bg-indigo text-white'
                  : index < stepIndex
                    ? 'bg-mintSoft text-[#1E8A62]'
                    : 'bg-lavenderSoft text-indigo'
              }`}
            >
              {item.title}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {visibleQuestions.map((key) => (
            <QuestionCard
              key={key}
              meta={QUESTION_META[key]}
              value={form[key]}
              checked={form.hardcut_conditions.includes(QUESTION_META[key].label)}
              onToggle={() => toggleNonNegotiable(key)}
              onChange={(value) => updateField(key, value)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-[20px] border border-line bg-white px-4 py-4">
          <p className="text-[12px] font-bold text-ink">지금 선택한 포기 못해</p>
          {form.hardcut_conditions.length === 0 ? (
            <p className="mt-2 text-[11.5px] text-inkFaint">
              아직 없어요. 정말 양보하기 어려운 질문만 체크해도 충분해요.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.hardcut_conditions.map((item) => (
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

        {error && <p className="mt-4 text-[12px] text-[#C22A5A]">{error}</p>}
      </div>

      <div className="px-[22px] pb-5 flex gap-2.5">
        <Button variant="ghost" fullWidth={false} className="px-5" onClick={handleBack}>
          이전
        </Button>
        <Button onClick={handleNext}>
          {stepIndex === STEP_GROUPS.length - 1 ? '최종 확인하기 →' : '다음 질문으로 →'}
        </Button>
      </div>
    </Shell>
  );
}

function QuestionCard({ meta, value, checked, onToggle, onChange }) {
  return (
    <div className="rounded-[20px] border border-line bg-white px-4 py-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold leading-relaxed text-ink">{meta.label}</p>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-3 py-1.5 text-[10.5px] font-bold ${
            checked ? 'bg-[#C22A5A] text-white' : 'bg-[#F8F5FF] text-indigo'
          }`}
        >
          포기 못해
        </button>
      </div>

      <div className="mt-3">
        {meta.type === 'select' && (
          <select value={value} onChange={(event) => onChange(event.target.value)} className="input">
            <option value="">선택해주세요</option>
            {meta.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {meta.type === 'boolean' && (
          <div className="flex gap-2">
            {[
              { label: '예', value: true },
              { label: '아니오', value: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold ${
                  value === option.value
                    ? 'border-indigo bg-indigo text-white'
                    : 'border-line bg-white text-inkSoft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {meta.type === 'text' && (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={meta.placeholder}
            className="input"
          />
        )}

        {meta.type === 'number' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={meta.min}
              max={meta.max}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={`${meta.min}~${meta.max}`}
              className="input"
            />
            <span className="text-[12px] font-semibold text-inkSoft">{meta.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}
