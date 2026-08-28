'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button } from '@/components/UI';
import { signup } from '@/lib/mockApi';

export default function SignupPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [id2, setId2] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idMatch = id2.length > 0 ? id === id2 : null;
  const pwMatch = pw2.length > 0 ? pw === pw2 : null;
  const canSubmit = id && id === id2 && pw && pw === pw2 && pw.length >= 8;

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      // 계정 생성 버튼을 누르기 전까지는 서버에 아무것도 저장되지 않습니다.
      await signup({ id, password: pw });
      router.push('/profile');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5 flex-1">
        <BackLink onClick={() => router.push('/')} />
        <h2 className="text-lg font-bold mt-3.5 mb-0.5">회원가입</h2>
        <p className="text-[11.5px] text-inkFaint mb-4">
          계정 생성 전까지 어떤 정보도 서버에 저장되지 않아요
        </p>

        <Field label="아이디">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="영문/숫자 4~16자" className="input" />
        </Field>
        <Field label="아이디 확인">
          <input value={id2} onChange={(e) => setId2(e.target.value)} placeholder="아이디를 다시 입력해주세요" className="input" />
          {idMatch !== null && (
            <p className={`text-[11.5px] mt-1 ${idMatch ? 'text-[#1E8A62]' : 'text-[#C22A5A]'}`}>
              {idMatch ? '✅ 아이디가 일치해요' : '❌ 아이디가 일치하지 않아요'}
            </p>
          )}
        </Field>
        <Field label="비밀번호">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8자 이상, 영문+숫자" className="input" />
        </Field>
        <Field label="비밀번호 확인">
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호를 다시 입력해주세요" className="input" />
          {pwMatch !== null && (
            <p className={`text-[11.5px] mt-1 ${pwMatch ? 'text-[#1E8A62]' : 'text-[#C22A5A]'}`}>
              {pwMatch ? '✅ 비밀번호가 일치해요' : '❌ 비밀번호가 일치하지 않아요'}
            </p>
          )}
        </Field>

        {error && <p className="text-[12px] text-[#C22A5A] mb-2">{error}</p>}

        <Button onClick={handleSubmit} className={!canSubmit || loading ? 'opacity-40 pointer-events-none' : ''}>
          {loading ? '생성 중...' : '계정 생성 →'}
        </Button>
        <p className="text-center text-[11px] text-inkFaint mt-2.5">
          '계정 생성' 버튼을 누르기 전까지는 서버에 저장되지 않습니다.
        </p>
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
