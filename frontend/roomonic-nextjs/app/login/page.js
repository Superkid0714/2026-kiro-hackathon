'use client';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';
import { getKakaoLoginUrl } from '@/lib/mockApi';

export default function LoginPage() {
  const kakaoLoginUrl = getKakaoLoginUrl();

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
      <div className="px-[22px] flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-line px-5 py-6 shadow-card">
          <h2 className="text-[18px] font-bold text-ink mb-2">카카오 계정으로 계속하기</h2>
          <p className="text-[12px] leading-relaxed text-inkFaint mb-5">
            기존 회원가입과 로그인 대신 카카오 계정으로 바로 시작해요
          </p>
          {kakaoLoginUrl ? (
            <a href={kakaoLoginUrl} className="block">
              <Button className="bg-[#FEE500] text-[#191600] shadow-none hover:bg-[#F7DC00]">
                <span className="text-[16px] leading-none">💬</span>
                카카오 로그인
              </Button>
            </a>
          ) : (
            <Button className="bg-[#FEE500] text-[#191600] shadow-none opacity-60 cursor-not-allowed">
              카카오 로그인 설정 필요
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}
