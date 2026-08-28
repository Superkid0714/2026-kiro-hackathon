'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { Button } from '@/components/UI';
import { getCurrentAuthContext, getCurrentProfileContext, getKakaoLoginUrl } from '@/lib/mockApi';

export default function LandingPage() {
  const router = useRouter();
  const kakaoLoginUrl = getKakaoLoginUrl();
  const audioRef = useRef(null);

  useEffect(() => {
    const auth = getCurrentAuthContext();
    const profile = getCurrentProfileContext();

    if (auth?.user?.profile_id || (auth?.access_token && profile?.profile_id)) {
      router.replace('/home');
    }
  }, [router]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    audio.load();
    tryPlay();
    window.addEventListener('pointerdown', tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true });
    window.addEventListener('touchend', tryPlay, { once: true });
    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('keydown', tryPlay, { once: true });

    return () => {
      window.removeEventListener('pointerdown', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('touchend', tryPlay);
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, []);

  return (
    <Shell dark>
      <audio
        ref={audioRef}
        src="/images/audio/login-bgm.m4a"
        autoPlay
        loop
        preload="auto"
        playsInline
      />
      <div className="absolute inset-0">
        <img
          src="/images/login/home-bg.gif"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#23185A]/52" />
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        <svg width="30" height="30" viewBox="0 0 40 40" className="mb-2">
          <path
            d="M20 4 L34 16 V33 A3 3 0 0 1 31 36 H9 A3 3 0 0 1 6 33 V16 Z"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="22" r="3.2" fill="#fff" />
        </svg>
        <div className="font-gaegu font-bold text-2xl">Roomonic</div>
        <p className="text-[13px] text-[#C9C2F2] mt-0.5 mb-6">같이, 더 좋은 일상</p>
        <h1 className="text-2xl leading-relaxed font-bold mb-2.5">
          좋은 룸메이트는
          <br />
          운이 아니라,
          <br />
          <span className="text-pink">잘 맞는 생활패턴</span>이에요
        </h1>
        <p className="text-[13px] text-[#B9B2E6] leading-relaxed">
          AI가 당신의 생활을 이해하고
          <br />
          함께할 룸메이트를 찾아드려요
        </p>
        <div className="flex justify-center my-5">
          <div className="w-[236px] h-[236px] flex items-center justify-center overflow-hidden">
            <img
              src="/images/characters/UNI.png"
              alt="UNI character"
              className="w-[228px] h-[228px] object-contain"
            />
          </div>
        </div>
      </div>
      <div className="relative z-10 px-6 pb-6">
        {kakaoLoginUrl ? (
          <a href={kakaoLoginUrl} className="block">
            <Button
              className="bg-[#FEE500] text-[#191600] shadow-none hover:bg-[#F7DC00]"
            >
              카카오로 시작하기
            </Button>
          </a>
        ) : (
          <Button className="bg-[#FEE500] text-[#191600] shadow-none opacity-60 cursor-not-allowed">
            카카오 로그인 설정 필요
          </Button>
        )}
      </div>
    </Shell>
  );
}
