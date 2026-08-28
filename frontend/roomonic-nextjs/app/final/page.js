'use client';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { StatusBar, Button } from '@/components/UI';

export default function FinalPage() {
  const router = useRouter();

  return (
    <Shell dark>
      <StatusBar dark />
      <div className="relative z-10 px-[22px] text-center pt-1.5">
        <div className="text-3xl">🎉</div>
        <h2 className="text-lg font-bold mt-1.5 mb-1">축하합니다!</h2>
        <p className="text-[12.5px] text-[#B9B2E6] mb-4">두 사람의 생활수칙이 안전하게 저장됐어요</p>
        <div className="rounded-[18px] p-4 text-left border border-white/10 bg-gradient-to-br from-[#2E2467] to-[#171233]">
          <p className="font-extrabold text-sm text-center mb-2.5">민준 &amp; 지수의 우리집 생활수칙</p>
          <ul className="text-xs text-[#CFC9F2] leading-loose list-disc pl-4">
            <li>밤 12시 이후 이어폰 사용</li>
            <li>공용 공간 주 2회 청소</li>
            <li>손님 방문 하루 전 알리기</li>
            <li>공용 물품/비용 월말에 정산하기</li>
          </ul>
          <div className="mt-3 pt-2.5 border-t border-dashed border-white/15 text-[10px] text-[#8A83BE]">
            🔐 무결성 해시(SHA-256): <span className="font-mono text-[#B9B2E6]">a91f...c3e0</span> 저장됨
            <br />
            조회 시 원문을 재해싱해 위변조 여부를 자동 검증합니다.
          </div>
          <p className="text-[10px] text-[#8A83BE] mt-2">2025. 08. 26 합의 완료</p>
        </div>
      </div>
      <div className="relative z-10 px-[22px] pb-5 mt-auto flex gap-2.5">
        <button className="w-auto px-4 py-3.5 rounded-2xl border-[1.5px] border-white/30 text-white text-[14px] font-bold">
          복사하기
        </button>
        <Button onClick={() => router.push('/')}>공유하기</Button>
      </div>
    </Shell>
  );
}
