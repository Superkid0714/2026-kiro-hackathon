'use client';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';

export default function MatchRequestPage() {
  const router = useRouter();

  return (
    <Shell dark>
      <StatusBar dark />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-[22px]">
        <svg width="140" height="90" viewBox="0 0 140 90" className="mb-2.5">
          <circle cx="40" cy="40" r="26" fill="#F4F2FD" />
          <circle cx="100" cy="40" r="26" fill="#FDEEDD" />
          <path d="M62 40 h16 M70 32 v16" stroke="#F3A9D2" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <h2 className="text-lg font-bold mb-1.5 leading-relaxed">
          민준님에게
          <br />
          매칭 요청을 보냈어요!
        </h2>
        <p className="text-[12.5px] text-[#B9B2E6] mb-5">상대방의 수락을 기다리고 있어요</p>
        <div className="flex items-center justify-center gap-1.5 mb-5">
          <Step num="✓" label="요청 완료" active />
          <div className="w-8 h-0.5 bg-[#4A3F87]" />
          <Step num="2" label="상대방 확인 중" />
          <div className="w-8 h-0.5 bg-[#4A3F87]" />
          <Step num="3" label="매칭 완료" />
        </div>
        <p className="text-[11.5px] text-[#8A83BE] mb-4">보통 3일 이내에 답이 와요. 조금만 기다려주세요 🙂</p>
      </div>
      <div className="relative z-10 px-[22px] pb-5">
        <Button onClick={() => router.push('/candidates')}>홈으로 가기</Button>
      </div>
    </Shell>
  );
}

function Step({ num, label, active }) {
  return (
    <div className="text-center">
      <div
        className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px] mx-auto mb-1 ${
          active ? 'bg-indigo text-white' : 'bg-[#4A3F87] text-white'
        }`}
      >
        {num}
      </div>
      <span className="text-[10px] text-[#B9B2E6]">{label}</span>
    </div>
  );
}
