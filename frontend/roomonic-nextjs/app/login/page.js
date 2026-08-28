'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { login } from '@/lib/mockApi';

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      await login({ id, password: pw });
      router.push('/candidates');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="text-center pt-2.5 px-[22px]">
        <svg width="26" height="26" viewBox="0 0 40 40" className="mt-1.5 inline-block">
          <path d="M20 4 L34 16 V33 A3 3 0 0 1 31 36 H9 A3 3 0 0 1 6 33 V16 Z" fill="none" stroke="#5B4FCF" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="20" cy="22" r="3.2" fill="#5B4FCF" />
        </svg>
        <div className="font-gaegu font-bold text-lg text-indigo mt-1">Roomonic</div>
        <p className="text-[11.5px] text-inkFaint mt-0.5 mb-4">같이, 더 좋은 일상</p>
      </div>
      <div className="px-[22px] flex-1">
        <div className="flex bg-lavenderSoft rounded-xl p-1 mb-4">
          <div className="flex-1 text-center bg-white rounded-lg py-2 font-bold text-[13px] text-indigo shadow-sm">로그인</div>
          <Link href="/signup" className="flex-1 text-center py-2 font-bold text-[13px] text-inkFaint">회원가입</Link>
        </div>
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-inkSoft block mb-1.5">아이디</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디를 입력하세요" className="input" />
        </div>
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-inkSoft block mb-1.5">비밀번호</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호를 입력하세요" className="input" />
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-inkSoft mb-4">
          <input type="checkbox" className="w-auto" /> 로그인 상태 유지
        </label>
        {error && <p className="text-[12px] text-[#C22A5A] mb-2">{error}</p>}
        <Button onClick={handleLogin} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </div>
    </Shell>
  );
}
