'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import { Button, StatusBar } from '@/components/UI';
import { exchangeKakaoCode } from '@/lib/mockApi';

export default function KakaoCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('카카오 로그인 정보를 확인하고 있어요');
  const hasExchangedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setState('error');
      setMessage('카카오 로그인이 취소되었거나 실패했어요');
      return;
    }

    if (!code) {
      setState('error');
      setMessage('인가 코드를 받지 못했어요');
      return;
    }

    let cancelled = false;

    async function run() {
      if (hasExchangedRef.current) {
        return;
      }
      hasExchangedRef.current = true;
      try {
        const result = await exchangeKakaoCode(code);
        if (cancelled) return;
        setState('success');
        router.replace(result.user?.profile_id ? '/home' : '/profile');
      } catch (error) {
        if (cancelled) return;
        setState('error');
        setMessage(error.message || '로그인 처리에 실패했어요');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (state !== 'error') {
    return null;
  }

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-line px-5 py-6 shadow-card text-center">
          <div className="w-14 h-14 rounded-full bg-lavenderSoft mx-auto mb-4 flex items-center justify-center text-2xl">
            {state === 'error' ? '!' : '💬'}
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-2">카카오 로그인</h2>
          <p className="text-[12px] leading-relaxed text-inkFaint">{message}</p>
          {state === 'error' && (
            <div className="mt-5">
              <Button onClick={() => router.replace('/login')}>처음 화면으로 돌아가기</Button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
