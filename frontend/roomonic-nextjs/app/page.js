'use client';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { getKakaoLoginUrl } from '@/lib/mockApi';

export default function LandingPage() {
  const kakaoLoginUrl = getKakaoLoginUrl();

  return (
    <Shell dark>
      <StatusBar dark />
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
        <div className="flex justify-center my-4">
          <svg width="120" height="100" viewBox="0 0 120 100">
            <ellipse cx="60" cy="78" rx="46" ry="8" fill="#000" opacity="0.15" />
            <circle cx="34" cy="30" r="12" fill="#EDE9FC" />
            <circle cx="86" cy="30" r="12" fill="#EDE9FC" />
            <circle cx="60" cy="46" r="34" fill="#F4F2FD" />
            <circle cx="49" cy="46" r="2.6" fill="#2A2450" />
            <circle cx="71" cy="46" r="2.6" fill="#2A2450" />
            <circle cx="43" cy="54" r="4" fill="#F3A9D2" opacity=".6" />
            <circle cx="77" cy="54" r="4" fill="#F3A9D2" opacity=".6" />
            <path d="M52 58 Q60 63 68 58" stroke="#2A2450" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M60 6 l4 9 9 1 -7 6 2 9 -8-5 -8 5 2-9 -7-6 9-1z" fill="#FBE05A" />
          </svg>
        </div>
      </div>
      <div className="relative z-10 px-6 pb-6">
        {kakaoLoginUrl ? (
          <a href={kakaoLoginUrl} className="block">
            <Button
              className="bg-[#FEE500] text-[#191600] shadow-none hover:bg-[#F7DC00]"
            >
              <span className="text-[16px] leading-none">💬</span>
              카카오로 시작하기
            </Button>
          </a>
        ) : (
          <Button className="bg-[#FEE500] text-[#191600] shadow-none opacity-60 cursor-not-allowed">
            카카오 로그인 설정 필요
          </Button>
        )}
        <p className="text-center text-[11.5px] text-[#B9B2E6] mt-2.5">
          회원가입과 로그인은 카카오 계정으로 통합됩니다
        </p>
      </div>
    </Shell>
  );
}
