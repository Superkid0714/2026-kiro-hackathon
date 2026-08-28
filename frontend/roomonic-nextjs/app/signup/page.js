'use client';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { StatusBar, BackLink, Button } from '@/components/UI';
import { getKakaoLoginUrl } from '@/lib/mockApi';

export default function SignupPage() {
  const kakaoLoginUrl = getKakaoLoginUrl();

  return (
    <Shell>
      <StatusBar />
      <div className="px-[22px] pt-1.5 flex-1">
        <BackLink onClick={() => window.history.back()} />
        <h2 className="text-lg font-bold mt-3.5 mb-0.5">카카오로 시작하기</h2>
        <p className="text-[11.5px] text-inkFaint mb-4">
          별도 회원가입 없이 카카오 계정으로 바로 이어서 진행할 수 있어요
        </p>
        <div className="bg-white rounded-2xl border border-line px-5 py-6 shadow-card">
          <p className="text-[12px] leading-relaxed text-inkFaint mb-5">
            로그인과 회원가입이 하나의 카카오 인증 흐름으로 통합되었어요
          </p>
          {kakaoLoginUrl ? (
            <a href={kakaoLoginUrl} className="block">
              <Button className="bg-[#FEE500] text-[#191600] shadow-none hover:bg-[#F7DC00]">
                <span className="text-[16px] leading-none">💬</span>
                카카오 계정 연결
              </Button>
            </a>
          ) : (
            <Button className="bg-[#FEE500] text-[#191600] shadow-none opacity-60 cursor-not-allowed">
              카카오 로그인 설정 필요
            </Button>
          )}
        </div>
        <p className="text-center text-[11px] text-inkFaint mt-2.5">
          이미 계정이 연결되어 있다면 바로 로그인으로 이어집니다
        </p>
        <Link href="/login" className="block mt-3 text-center text-[12px] font-bold text-indigo">
          로그인 화면으로 이동
        </Link>
      </div>
    </Shell>
  );
}
