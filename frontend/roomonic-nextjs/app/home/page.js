'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import BottomNav from '@/components/BottomNav';
import { Button, Card, Modal } from '@/components/UI';
import {
  getCurrentAuthContext,
  getCurrentProfileContext,
  getHomeOverview,
  getRoommatePactStatus,
  hasConfirmedRoommate,
  logoutCurrentUser,
  resetInterviewDraft,
  resetRecommendationFlow,
} from '@/lib/mockApi';

const MAX_SCORE = 100;

function clamp(value) {
  return Math.max(0, Math.min(MAX_SCORE, Math.round(value || 0)));
}

function valueFromScale(value, map, fallback = 50) {
  if (value == null) return fallback;
  return map[value] ?? fallback;
}

function timeToMinutes(value) {
  if (!value || !value.includes(':')) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function scoreFromTimeGap(a, b, maxGap = 240) {
  const left = timeToMinutes(a);
  const right = timeToMinutes(b);
  if (left == null || right == null) return 56;
  const diff = Math.min(Math.abs(left - right), maxGap);
  return clamp(100 - (diff / maxGap) * 42);
}

function axisSummary(ruleScore, sharingScore) {
  if (ruleScore >= 65 && sharingScore >= 55) {
    return '함께 살기 좋은 기준을 맞춰가는 편이에요.';
  }
  if (ruleScore >= 65) {
    return '생활 리듬과 규칙을 또렷하게 맞추는 편이에요.';
  }
  if (sharingScore >= 55) {
    return '공유와 교류에 비교적 편안함을 느끼는 편이에요.';
  }
  return '서로의 공간과 방식을 자연스럽게 존중하는 편이에요.';
}

function formatGender(value) {
  if (value === 'female') return '여성';
  if (value === 'male') return '남성';
  return '기타';
}

function formatLifeWindow(interview) {
  const wake = interview?.wake_up_time;
  const sleep = interview?.sleep_time;
  if (!wake && !sleep) return '생활 시간 미설정';
  return `${wake || '--:--'} · ${sleep || '--:--'}`;
}

function deriveMetrics(interview, character) {
  const cleaning = valueFromScale(interview?.cleaning_frequency, {
    '1': 26,
    '2': 42,
    '3': 58,
    '4': 70,
    '5': 80,
    '6': 90,
    매일: 98,
  });
  const dishes = valueFromScale(interview?.dishes_deadline, {
    바로: 95,
    '그날 이내에': 74,
    '다음날 아침': 56,
  });
  const security = valueFromScale(interview?.security_preference, {
    '항시 잠금': 96,
    외출시: 74,
    상관없음: 42,
  });
  const guest = valueFromScale(interview?.guest_frequency, {
    '1': 26,
    '2': 34,
    '3': 46,
    '4': 58,
    '5': 68,
    '6': 78,
    매일: 92,
  });
  const conflict = valueFromScale(interview?.conflict_resolution, {
    '즉시 대면': 72,
    '모아서 대면': 58,
  });
  const access = valueFromScale(interview?.personal_space_access, {
    자유롭게: 78,
    '노크 혹은 허락': 64,
    불가능: 34,
  });
  const sharing = character?.sharing_score ?? 50;
  const rule = character?.rule_score ?? 50;
  const wakeSleepBalance = scoreFromTimeGap(interview?.wake_up_time, interview?.sleep_time, 960);
  const quiet = valueFromScale(interview?.quiet_hours_start, {}, 62);

  const tidiness = clamp((cleaning + dishes + security) / 3);
  const flexibility = clamp((guest + sharing + access) / 3);
  const communication = clamp((conflict + sharing + 58) / 3);
  const pattern = clamp((rule + wakeSleepBalance + quiet) / 3);
  const noise = interview?.noise_sensitive ? 84 : 48;
  const commonSpace = clamp((sharing + access + valueFromScale(interview?.supplies_sharing, {
    공동구매: 84,
    '일부 공유': 68,
    각자: 34,
  })) / 3);

  return {
    rule: clamp(rule),
    sharing: clamp(sharing),
    tidiness,
    flexibility,
    communication,
    pattern,
    noise,
    commonSpace,
  };
}

function buildInsightItems(profile, interview, character, metrics) {
  return [
    {
      icon: '💜',
      title: '성격 한 줄 요약',
      description: character?.top_factors?.[0] || axisSummary(character?.rule_score || 0, character?.sharing_score || 0),
    },
    {
      icon: '🏠',
      title: '생활 스타일',
      description:
        metrics.pattern >= 70
          ? '하루 루틴이 비교적 또렷하고 안정적인 편이에요.'
          : '상황에 맞게 생활 흐름을 유연하게 맞춰가는 편이에요.',
    },
    {
      icon: '💬',
      title: '소통 방식',
      description:
        interview?.conflict_resolution === '즉시 대면'
          ? '필요한 이야기는 바로 나누는 편이 편해요.'
          : '생각을 정리한 뒤 차분하게 이야기하는 편이에요.',
    },
    {
      icon: '🧹',
      title: '청결 기준',
      description:
        metrics.tidiness >= 75
          ? '공용 공간을 깔끔하게 유지하는 기준이 분명해요.'
          : '무리하지 않으면서 서로 맞춰가는 청결 기준을 선호해요.',
    },
    {
      icon: '📍',
      title: '주요 생활 조건',
      description: `${profile?.region || '지역 미설정'}에서 ${profile?.move_in_period || '입주 시기 미설정'} 입주를 생각하고 있어요.`,
    },
  ];
}

function getCharacterTheme(typeCode) {
  if (typeCode === 'ROO') {
    return {
      accent: '#5FCDB7',
      accentStrong: '#3FB7A0',
      accentSoft: '#E7FBF6',
      radarFill: 'rgba(95, 205, 183, 0.24)',
      radarStroke: '#3FB7A0',
      line: '#CAEDE6',
      buttonBg: '#F2FFFB',
      buttonText: '#249D83',
    };
  }

  if (typeCode === 'PEE') {
    return {
      accent: '#7EA4FF',
      accentStrong: '#5A83F5',
      accentSoft: '#EEF3FF',
      radarFill: 'rgba(126, 164, 255, 0.24)',
      radarStroke: '#5A83F5',
      line: '#D7E3FF',
      buttonBg: '#F3F6FF',
      buttonText: '#4E72D9',
    };
  }

  if (typeCode === 'MOMO') {
    return {
      accent: '#F4A6C1',
      accentStrong: '#EA7FA7',
      accentSoft: '#FFF0F6',
      radarFill: 'rgba(244, 166, 193, 0.24)',
      radarStroke: '#EA7FA7',
      line: '#F8D8E5',
      buttonBg: '#FFF5F8',
      buttonText: '#D85A89',
    };
  }

  return {
    accent: '#9B6BFF',
    accentStrong: '#7A5AF8',
    accentSoft: '#F2EAFF',
    radarFill: 'rgba(155, 107, 255, 0.24)',
    radarStroke: '#8B5CF6',
    line: '#E7DFFF',
    buttonBg: '#F4EEFF',
    buttonText: '#6D52E1',
  };
}

function Section({ title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-[28px] border border-[#E9E2FA] bg-white/92 p-5 shadow-[0_12px_30px_rgba(96,81,163,0.08)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-[12px] leading-relaxed text-inkSoft">{description}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </section>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E2FA] bg-white px-3 py-2 text-[11.5px] font-semibold text-ink shadow-[0_4px_14px_rgba(109,89,184,0.06)]">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function ScoreRing({ label, value, tone }) {
  const color = tone || '#8B5CF6';
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamp(value) / 100);

  return (
    <div className="flex flex-col items-center rounded-[22px] bg-white px-2 py-3 text-center">
      <div className="relative h-[76px] w-[76px]">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle cx="38" cy="38" r={radius} stroke="#EEE7FC" strokeWidth="8" fill="none" />
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-extrabold text-ink">{clamp(value)}</span>
          <span className="mt-[-2px] text-[10px] font-semibold text-inkFaint">/100</span>
        </div>
      </div>
      <p className="mt-2 text-[12px] font-semibold text-ink">{label}</p>
    </div>
  );
}

function MeterRow({ label, value, description, tone }) {
  return (
    <div className="rounded-[20px] bg-[#FCFAFF] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-ink">{label}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-inkFaint">{description}</p>
        </div>
        <span className="shrink-0 text-[14px] font-extrabold text-ink">{clamp(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ECE5FB]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamp(value)}%`,
            background: tone || 'linear-gradient(90deg, #8B5CF6 0%, #6D52E1 100%)',
          }}
        />
      </div>
    </div>
  );
}

function RadarChart({ metrics, theme }) {
  const labels = [
    { key: 'rule', label: '규칙성' },
    { key: 'sharing', label: '공유성' },
    { key: 'tidiness', label: '정리정돈' },
    { key: 'flexibility', label: '유연성' },
    { key: 'communication', label: '소통' },
  ];
  const center = 86;
  const radius = 58;

  const points = labels.map((item, index) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2) / labels.length;
    const ratio = clamp(metrics[item.key]) / 100;
    const x = center + Math.cos(angle) * radius * ratio;
    const y = center + Math.sin(angle) * radius * ratio;
    return `${x},${y}`;
  });

  const guides = [1, 0.75, 0.5, 0.25].map((ratio) =>
    labels
      .map((_, index) => {
        const angle = (-Math.PI / 2) + (index * Math.PI * 2) / labels.length;
        const x = center + Math.cos(angle) * radius * ratio;
        const y = center + Math.sin(angle) * radius * ratio;
        return `${x},${y}`;
      })
      .join(' ')
  );

  return (
    <div className="rounded-[24px] bg-[#FCFAFF] px-3 py-4">
      <svg viewBox="0 0 172 172" className="mx-auto h-[220px] w-full max-w-[220px] overflow-visible">
        {guides.map((guide, index) => (
          <polygon
            key={index}
            points={guide}
            fill="none"
            stroke={theme?.line || '#E7DFFF'}
            strokeWidth={index === 0 ? 1.5 : 1}
          />
        ))}
        {labels.map((item, index) => {
          const angle = (-Math.PI / 2) + (index * Math.PI * 2) / labels.length;
          const x = center + Math.cos(angle) * (radius + 18);
          const y = center + Math.sin(angle) * (radius + 18);
          return (
            <g key={item.key}>
              <line x1={center} y1={center} x2={x} y2={y} stroke={theme?.line || '#E7DFFF'} strokeWidth="1" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[#6F6796] text-[9px] font-semibold"
              >
                {item.label}
              </text>
            </g>
          );
        })}
        <polygon
          points={points.join(' ')}
          fill={theme?.radarFill || 'rgba(139, 92, 246, 0.22)'}
          stroke={theme?.radarStroke || '#8B5CF6'}
          strokeWidth="2"
        />
        {labels.map((item, index) => {
          const [x, y] = points[index].split(',').map(Number);
          return <circle key={item.key} cx={x} cy={y} r="3.5" fill={theme?.radarStroke || '#8B5CF6'} />;
        })}
      </svg>
    </div>
  );
}

function InsightItem({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-[#FCFAFF] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1EBFF] text-[18px]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-ink">{title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-inkSoft">{description}</p>
      </div>
    </div>
  );
}

function EmptyInterviewHero({ profile, onSettings, onStart }) {
  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-[#7A6FA8]">{profile?.nickname || '사용자'}님의 매칭 준비</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-ink">
            생활 타입을 완성하면
            <br />
            후보 확인 화면이 바로 열려요
          </h1>
        </div>
        <button
          type="button"
          aria-label="설정 열기"
          onClick={onSettings}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E7DFFF] bg-white text-[20px] text-[#6E56D8] shadow-[0_8px_18px_rgba(109,82,225,0.10)]"
        >
          ⚙
        </button>
      </div>

      <section className="rounded-[30px] border border-[#E7DFFF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F1FF_100%)] p-5 shadow-[0_20px_42px_rgba(109,82,225,0.10)]">
        <div className="flex items-center gap-4">
          <div className="flex h-[116px] w-[116px] items-center justify-center rounded-[30px] bg-[#F0E8FF]">
            <img src="/images/characters/UNI.png" alt="UNI character" className="h-[104px] w-[104px] object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-[#EFE8FF] px-3 py-1 text-[10px] font-bold text-[#694ED6]">
              인터뷰 전 단계
            </span>
            <p className="mt-3 text-[20px] font-bold leading-snug text-ink">답변을 마치면 내 캐릭터와 후보 확인 화면이 열려요</p>
            <p className="mt-2 text-[12px] leading-relaxed text-inkSoft">
              수면 리듬, 청결 기준, 공유 성향을 바탕으로 같이 살기 좋은 기준을 정리해드려요.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mt-5 flex w-full items-center justify-center rounded-[22px] bg-[#6D52E1] px-4 py-4 text-[15px] font-extrabold text-white shadow-[0_16px_34px_rgba(109,82,225,0.26)] transition active:scale-95"
          onClick={onStart}
        >
          생활 인터뷰 시작하기
        </button>
      </section>
    </>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [roommateConfirmed, setRoommateConfirmed] = useState(false);
  const [pactCompleted, setPactCompleted] = useState(false);

  useEffect(() => {
    const profile = getCurrentProfileContext();
    if (!profile?.profile_id) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const next = await getHomeOverview();
        if (cancelled) return;
        if (next?.hasProfile === false) {
          router.replace('/profile');
          return;
        }
        setOverview(next);
        setRoommateConfirmed(hasConfirmedRoommate());
        setPactCompleted(getRoommatePactStatus() === 'completed');
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError.message || '홈 정보를 불러오지 못했어요');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const profile = overview?.profile;
  const character = overview?.character;
  const visual = overview?.visual;
  const interview = overview?.interview || {};
  const theme = useMemo(() => getCharacterTheme(character?.type_code), [character?.type_code]);
  const metrics = useMemo(() => deriveMetrics(interview, character), [character, interview]);
  const insightItems = useMemo(
    () => buildInsightItems(profile, interview, character, metrics),
    [character, interview, metrics, profile]
  );
  const profileChips = [
    profile?.age ? `만 ${profile.age}세` : null,
    profile?.region || null,
    profile?.move_in_period ? `${profile.move_in_period} 입주` : null,
    interview?.wake_up_time && interview?.sleep_time ? `${interview.wake_up_time} · ${interview.sleep_time}` : null,
    profile?.stay_duration_months ? `${profile.stay_duration_months}개월 희망` : null,
  ].filter(Boolean);

  const confirmConfig = useMemo(() => {
    if (confirmAction === 'restart-onboarding') {
      return {
        title: '처음 1단계부터 다시 수정할까요?',
        description: '기본 프로필부터 다시 확인하고 생활 인터뷰까지 이어서 수정해요.',
        primaryLabel: '처음부터 수정하기',
        secondaryLabel: '취소',
        onPrimary: () => {
          resetInterviewDraft();
          setConfirmAction(null);
          setSettingsOpen(false);
          const targetProfileId =
            profile?.profile_id ||
            getCurrentAuthContext()?.user?.profile_id ||
            getCurrentProfileContext()?.profile_id ||
            '';
          const query = new URLSearchParams({ restart: '1' });
          if (targetProfileId) query.set('profileId', targetProfileId);
          router.push(`/profile?${query.toString()}`);
        },
      };
    }

    if (confirmAction === 'reset-recommendations') {
      return {
        title: '후보 상태를 초기화할까요?',
        description: '오늘 뽑기 결과, 선택 후보, 약속 상태를 정리하고 다시 시작해요.',
        primaryLabel: '초기화하기',
        secondaryLabel: '취소',
        onPrimary: () => {
          resetRecommendationFlow();
          setConfirmAction(null);
          setSettingsOpen(false);
          router.refresh();
        },
      };
    }

    if (confirmAction === 'logout') {
      return {
        title: '로그아웃할까요?',
        description: '현재 로그인 정보를 정리하고 첫 화면으로 돌아가요.',
        primaryLabel: '로그아웃',
        secondaryLabel: '취소',
        onPrimary: () => {
          logoutCurrentUser();
          setConfirmAction(null);
          setSettingsOpen(false);
          window.location.replace('/login');
        },
      };
    }

    return null;
  }, [confirmAction, profile?.profile_id, router]);

  return (
    <Shell>
      <div className="relative z-10 flex-1 px-[20px] pt-6 pb-6">
        {loading ? (
          <div className="pt-20 text-center text-sm text-inkFaint">홈 정보를 불러오는 중이에요</div>
        ) : error ? (
          <div className="pt-20">
            <Card className="rounded-[28px] border-[#E9E2FA] bg-white text-center">
              <p className="text-[14px] font-semibold text-ink">{error}</p>
              <Button className="mt-4" onClick={() => router.push('/login')}>
                처음으로 돌아가기
              </Button>
            </Card>
          </div>
        ) : !overview?.hasInterview ? (
          <EmptyInterviewHero
            profile={profile}
            onSettings={() => setSettingsOpen(true)}
            onStart={() => router.push('/interview')}
          />
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-[#7A6FA8]">안녕하세요, {profile?.nickname || '사용자'}님</p>
                <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-ink">
                  오늘의 생활 타입과
                  <br />
                  매칭 기준을 한눈에 볼게요
                </h1>
              </div>
              <button
                type="button"
                aria-label="설정 열기"
                onClick={() => setSettingsOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E7DFFF] bg-white text-[20px] text-[#6E56D8] shadow-[0_8px_18px_rgba(109,82,225,0.10)]"
              >
                ⚙
              </button>
            </div>

            <section className="rounded-[32px] border border-[#E7DFFF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F0FF_100%)] p-5 shadow-[0_20px_46px_rgba(109,82,225,0.10)]">
              <div className="flex items-start gap-4">
                <div className={`flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-[30px] ${visual?.bg || 'bg-lavenderSoft'} shadow-[0_12px_24px_rgba(109,82,225,0.12)]`}>
                  <img
                    src={visual?.imagePath || '/images/characters/UNI.png'}
                    alt={`${character?.type_name || '캐릭터'} 이미지`}
                    className="h-[100px] w-[100px] object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full bg-[#EEE7FF] px-3 py-1 text-[10px] font-bold text-[#6D52E1]">
                    {character?.type_name}
                  </span>
                  <h2 className="mt-3 text-[26px] font-extrabold leading-tight text-ink">{profile?.nickname || '사용자'}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-inkSoft">
                    {axisSummary(character?.rule_score || 0, character?.sharing_score || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {profileChips.map((item, index) => {
                  const icons = ['👤', '📍', '📅', '⏰', '🏠'];
                  return <Chip key={`${item}-${index}`} icon={icons[index % icons.length]} label={item} />;
                })}
              </div>
            </section>

            <Section
              title="생활 성향 한눈에 보기"
              className="mt-4"
            >
              <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-[#FCFAFF] p-3 sm:grid-cols-4">
                <ScoreRing label="규칙성" value={metrics.rule} tone="#FFBF47" />
                <ScoreRing label="공유성" value={metrics.sharing} tone="#59D1BF" />
                <ScoreRing label="정리정돈" value={metrics.tidiness} tone="#9B6BFF" />
                <ScoreRing label="유연성" value={metrics.flexibility} tone="#6E8CFF" />
              </div>
            </Section>

            <div className="mt-4 grid gap-4">
              <Section title="나에 대해 더 알아보기" description="길게 설명하지 않아도 같이 살 때의 분위기가 보이도록 정리했어요.">
                <div className="grid gap-3">
                  {insightItems.slice(0, 4).map((item) => (
                    <InsightItem key={item.title} {...item} />
                  ))}
                </div>
              </Section>

              <Section title="생활 성향 그래프" description="매칭에 영향을 주는 다섯 축을 균형 있게 보여줘요.">
                <RadarChart metrics={metrics} theme={theme} />
              </Section>
            </div>

            <Section
              title="같이 살 때 중요해요"
              description="룸메이트 매칭 관점에서 빠르게 판단할 수 있는 핵심 기준만 모았어요."
              className="mt-4"
            >
              <div className="grid gap-3">
                <MeterRow
                  label="생활 패턴"
                  value={metrics.pattern}
                  description={formatLifeWindow(interview)}
                  tone="linear-gradient(90deg, #8B5CF6 0%, #6D52E1 100%)"
                />
                <MeterRow
                  label="청결 · 정리 기준"
                  value={metrics.tidiness}
                  description={interview?.dishes_deadline || '정리 기준을 차분하게 맞추는 편'}
                  tone="linear-gradient(90deg, #A66CFF 0%, #7A5AF8 100%)"
                />
                <MeterRow
                  label="소음 민감도"
                  value={metrics.noise}
                  description={interview?.quiet_hours_start ? `${interview.quiet_hours_start} 이후 조용한 환경 선호` : '조용한 분위기를 중요하게 생각해요'}
                  tone="linear-gradient(90deg, #F59E0B 0%, #FDBA74 100%)"
                />
                <MeterRow
                  label="공용 공간 사용"
                  value={metrics.commonSpace}
                  description={interview?.supplies_sharing || '공용 공간 기준 조율 가능'}
                  tone="linear-gradient(90deg, #34D399 0%, #6EE7B7 100%)"
                />
                <MeterRow
                  label="소통 스타일"
                  value={metrics.communication}
                  description={interview?.conflict_resolution || '필요한 이야기는 편하게 나누는 편'}
                  tone="linear-gradient(90deg, #60A5FA 0%, #818CF8 100%)"
                />
              </div>
            </Section>
          </>
        )}
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,14,35,0.52)] px-5 pb-6 pt-10 sm:items-center">
          <div className="w-full max-w-[360px] rounded-[28px] bg-white px-5 py-5 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: theme.accentSoft }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold"
                  style={{ backgroundColor: theme.accentSoft, color: theme.buttonText }}
                >
                  MY SETTINGS
                </span>
                <h3 className="mt-3 text-[18px] font-bold text-ink">설정</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-inkSoft">
                  계정과 이용 상태를 여기서 정리할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-[20px] font-bold text-inkSoft"
                aria-label="설정 닫기"
              >
                ×
              </button>
            </div>
            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction('restart-onboarding')}
                className="w-full rounded-[20px] border px-4 py-3 text-left shadow-[0_8px_18px_rgba(109,82,225,0.06)]"
                style={{ borderColor: theme.line, backgroundColor: '#FFFFFF' }}
              >
                <p className="text-[13px] font-bold text-ink">처음부터 다시 수정하기</p>
                <p className="mt-1 text-[11.5px] text-inkFaint">기본 프로필부터 다시 확인하고 생활 인터뷰까지 이어서 수정해요.</p>
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction('reset-recommendations')}
                className="w-full rounded-[20px] border px-4 py-3 text-left shadow-[0_8px_18px_rgba(109,82,225,0.06)]"
                style={{ borderColor: theme.line, backgroundColor: theme.accentSoft }}
              >
                <p className="text-[13px] font-bold" style={{ color: theme.buttonText }}>후보 초기화</p>
                <p className="mt-1 text-[11.5px] text-inkFaint">오늘 뽑기 결과, 선택한 후보, 약속 상태를 정리하고 다시 시작해요.</p>
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction('logout')}
                className="w-full rounded-[18px] bg-[#FFF2F6] px-4 py-3 text-left"
              >
                <p className="text-[13px] font-bold text-[#C22A5A]">로그아웃</p>
                <p className="mt-1 text-[11.5px] text-[#C22A5A]">현재 로그인 정보를 정리하고 처음 화면으로 돌아가요.</p>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(confirmConfig)}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        primaryLabel={confirmConfig?.primaryLabel}
        secondaryLabel={confirmConfig?.secondaryLabel}
        onPrimary={confirmConfig?.onPrimary}
        onSecondary={() => setConfirmAction(null)}
      />

      <BottomNav />
    </Shell>
  );
}
