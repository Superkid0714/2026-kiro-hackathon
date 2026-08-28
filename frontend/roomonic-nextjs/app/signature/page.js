'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';
import { BackLink, Button } from '@/components/UI';
import { getCurrentProfileContext, getRoommateSelection, getRulesReview, submitSignature } from '@/lib/mockApi';

export default function SignaturePage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawingRef = useRef(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pact, setPact] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const profile = getCurrentProfileContext();

  useEffect(() => {
    const selection = getRoommateSelection();
    if (!selection?.confirmed_at) {
      router.replace('/chat');
      return undefined;
    }

    let active = true;
    getRulesReview()
      .then((nextPact) => {
        if (!active) return;
        if (nextPact?.signature_status === 'completed') {
          router.replace('/final');
          return;
        }
        setPact(nextPact);
        const me = nextPact?.participants?.find((item) => item.profile_id === profile?.profile_id);
        setName(me?.nickname || profile?.nickname || '');
      })
      .catch((nextError) => {
        if (!active) return;
        setError(nextError.message || '서명 화면을 준비하지 못했어요');
      });
    return () => {
      active = false;
    };
  }, [profile?.nickname, profile?.profile_id, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    canvas.width = Math.max(rect.width, 280) * 2;
    canvas.height = 220 * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111827';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, Math.max(rect.width, 280), 220);
  }, []);

  const peer = useMemo(
    () => (pact?.participants || []).find((item) => item.profile_id !== profile?.profile_id),
    [pact?.participants, profile?.profile_id]
  );

  function pointFromEvent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }

  function startDraw(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const point = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function moveDraw(event) {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const point = pointFromEvent(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!name.trim()) {
      setError('이름을 확인해주세요');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitSignature({
        name: name.trim(),
        agreed,
        signatureDataUrl: canvas.toDataURL('image/png'),
      });
      router.push('/final');
    } catch (submitError) {
      setError(submitError.message || '서명 저장에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="flex-1 bg-[#F6F8FB] px-[22px] pt-8 pb-6">
        <BackLink onClick={() => router.push('/rules/review')} />
        <div className="mt-4 rounded-[28px] bg-white px-5 py-6 shadow-card">
          <p className="text-[12px] font-semibold text-[#6B7280]">전자 서명</p>
          <h1 className="mt-1 text-[25px] font-bold leading-tight text-[#111827]">
            마지막으로
            <br />
            직접 서명해 약속을 마무리해요
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#6B7280]">
            모바일에서 사인하듯 직접 그려서 서명할 수 있어요. 상대도 같은 방식으로 서명하면 약속이 확정돼요.
          </p>
        </div>

        {error ? <p className="mt-4 text-[12px] text-[#C22A5A]">{error}</p> : null}

        <div className="mt-4 rounded-[26px] bg-white px-5 py-5 shadow-card">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[18px] bg-[#F8FAFC] px-4 py-4">
              <p className="text-[11px] text-[#6B7280]">내 서명</p>
              <p className="mt-1 text-[15px] font-bold text-[#111827]">{name || '이름 확인 중'}</p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFC] px-4 py-4">
              <p className="text-[11px] text-[#6B7280]">상대 서명</p>
              <p className="mt-1 text-[15px] font-bold text-[#111827]">{peer?.nickname || '상대방'}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[12px] font-semibold text-[#374151]">서명 이름</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#111827] outline-none"
            />
          </div>

          <div ref={wrapperRef} className="mt-4 overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white">
            <canvas
              ref={canvasRef}
              className="h-[220px] w-full touch-none"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearCanvas}
              className="rounded-[16px] bg-[#F3F4F6] px-4 py-2.5 text-[12px] font-bold text-[#374151]"
            >
              다시 그리기
            </button>
          </div>

          <label className="mt-4 flex items-start gap-2.5 rounded-[18px] bg-[#F8FAFC] px-4 py-4 text-[12px] leading-relaxed text-[#4B5563]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5"
            />
            위 약속 내용을 확인했고, 서명 이미지와 서명 시점 기록이 저장되는 것에 동의해요.
          </label>

          <Button
            className={loading || !agreed ? 'mt-5 opacity-60 pointer-events-none' : 'mt-5'}
            onClick={handleSubmit}
          >
            {loading ? '서명 저장 중...' : '서명 완료하기'}
          </Button>
        </div>
      </div>
      <BottomNav />
    </Shell>
  );
}
