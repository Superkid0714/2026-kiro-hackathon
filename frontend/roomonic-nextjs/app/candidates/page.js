"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Shell from "@/components/Shell";
import {
  getCandidates,
  getCurrentProfileContext,
  getDailyPickLock,
  getRoommateSelection,
  hasConfirmedRoommate,
  requestChatMatch,
  syncPersistedRoommateState,
} from "@/lib/mockApi";

const DAILY_PICK_LOCK_KEY = "roomonic-daily-pick-lock";
const DRAW_RESULT_KEY = "roomonic-draw-result";

export default function CandidatesPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawState, setDrawState] = useState("idle");
  const [selectedIds, setSelectedIds] = useState([]);
  const [requestingId, setRequestingId] = useState("");
  const [notice, setNotice] = useState("");
  const [pickLock, setPickLock] = useState(null);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [showProfileRequiredModal, setShowProfileRequiredModal] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);
  const [roommateSelection, setRoommateSelection] = useState(null);

  useEffect(() => {
    const profile = getCurrentProfileContext();
    if (!profile?.profile_id) {
      setProfileMissing(true);
      setCandidates([]);
      setLoading(false);
      return;
    }

    getCandidates()
      .then((data) => {
        setCandidates(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    syncPersistedRoommateState().finally(() => {
      const parsed = getDailyPickLock();
      if (parsed) {
        setPickLock(parsed);
        setDrawState("locked");
        if (parsed.selected_candidate_id) {
          setSelectedIds([parsed.selected_candidate_id]);
        }
      }
      if (hasConfirmedRoommate()) {
        const confirmed = getRoommateSelection();
        setRoommateSelection(confirmed);
        setDrawState("confirmed");
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, []);

  const lockedCandidate = useMemo(() => {
    if (!pickLock?.selected_candidate_id) return null;
    return (
      candidates.find(
        (candidate) => candidate.id === pickLock.selected_candidate_id,
      ) || null
    );
  }, [candidates, pickLock]);

  const nextAvailableLabel = useMemo(() => {
    if (!pickLock?.locked_until) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(pickLock.locked_until));
  }, [pickLock]);

  function finishDraw() {
    const picks = candidates.slice(0, 3).map((candidate) => candidate.id);
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video) video.pause();
    if (audio) audio.pause();
    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        DRAW_RESULT_KEY,
        JSON.stringify({
          picked_ids: picks,
          created_at: new Date().toISOString(),
        }),
      );
    }
    router.replace("/candidates/result");
  }

  function handleStartDraw() {
    if (loading) return;
    if (profileMissing) {
      setShowProfileRequiredModal(true);
      return;
    }
    if (!candidates.length) {
      setShowEmptyModal(true);
      return;
    }
    if (roommateSelection?.confirmed_at) {
      setShowLockedModal(true);
      return;
    }
    if (pickLock) {
      setShowLockedModal(true);
      return;
    }
    setNotice("");
    const video = videoRef.current;
    const audio = audioRef.current;
    setDrawState("playing");

    if (!video) {
      finishTimeoutRef.current = window.setTimeout(finishDraw, 2400);
      return;
    }

    video.pause();
    video.currentTime = 0;
    video.muted = true;
    video.volume = 0;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audio.play().catch(() => {});
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        finishTimeoutRef.current = window.setTimeout(finishDraw, 2400);
      });
    }
  }

  async function handleRequestCandidate(candidate) {
    if (pickLock) return;
    setRequestingId(candidate.id);
    setNotice("");
    try {
      await requestChatMatch(candidate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const lockPayload = {
        selected_candidate_id: candidate.id,
        selected_candidate_name: candidate.name,
        locked_until: tomorrow.toISOString(),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          DAILY_PICK_LOCK_KEY,
          JSON.stringify(lockPayload),
        );
      }
      setPickLock(lockPayload);
      setSelectedIds([candidate.id]);
      setDrawState("locked");
      setNotice(
        `${candidate.name}님을 오늘의 추천으로 선택했어요. 다음 추천 뽑기는 내일 다시 이용할 수 있어요.`,
      );
      router.push("/chat");
    } catch (error) {
      setNotice(error.message || "요청을 보내지 못했어요.");
    } finally {
      setRequestingId("");
    }
  }

  return (
    <Shell>
      <div
        className={`fixed inset-0 z-50 bg-white ${
          drawState === "playing" ? "block" : "pointer-events-none hidden"
        }`}
      >
        <audio
          ref={audioRef}
          src="/images/candidates/Use_the_provided_pastel_purple.audio.mp3"
          preload="auto"
        />
        <video
          ref={videoRef}
          src="/images/candidates/Use_the_provided_pastel_purple.h264.mp4"
          playsInline
          preload="auto"
          onEnded={finishDraw}
          className="h-full w-full bg-white object-contain"
        />
      </div>

      <div
        className={`relative z-10 flex-1 bg-[linear-gradient(180deg,#FCF8FF_0%,#F5EDFF_48%,#F1E7FF_100%)] px-4 pt-3 pb-8 ${
          drawState === "playing" ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        <div className="mx-auto w-full max-w-[390px]">
          <div className="relative aspect-[9/16] overflow-hidden">
            <img
              src="/images/candidates/image (3).png"
              alt="추천 뽑기 기계"
              className="h-full w-full object-contain"
            />

            <div
              className={`absolute inset-x-[12%] top-[4.6%] text-center text-[#2C2554] transition ${
                drawState === "playing" ? "opacity-0" : "opacity-100"
              }`}
            >
              <h1 className="text-[7.5vw] font-gaegu font-bold leading-none sm:text-[25px]">
                오늘의 룸메이트 뽑기
              </h1>
            </div>

            <div
              className={`absolute inset-x-[15%] top-[60.6%] rounded-[22px] bg-white/88 px-4 py-3 text-center shadow-[0_10px_26px_rgba(89,68,164,0.18)] transition ${
                drawState === "playing" ? "opacity-0" : "opacity-100"
              }`}
            >
              {drawState === "playing" ? (
                <p className="text-[13px] font-bold text-indigo">
                  추천 후보를 뽑는 중이에요...
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleStartDraw}
              disabled={
                loading ||
                drawState === "playing"
              }
              className={`absolute inset-x-[19%] bottom-[10.8%] h-[8.8%] rounded-full text-[4.8vw] font-bold text-white disabled:opacity-70 sm:text-[18px] ${
                drawState === "playing" ? "pt-1.5" : ""
              }`}
            >
              {loading
                ? "후보 불러오는 중"
                : profileMissing
                  ? "프로필 설정 먼저"
                : !candidates.length
                  ? "추천 후보 준비 중"
                  : pickLock
                ? "내일 다시 이용하기"
                : roommateSelection?.confirmed_at
                  ? "룸메이트 확정 완료"
                  : drawState === "playing"
                    ? "뽑는 중..."
                    : "뽑기 시작하기"}
            </button>
          </div>
        </div>
        {notice && !showLockedModal && (
          <div className="mt-4 rounded-[20px] border border-[#E7E1FA] bg-[#F8F5FF] px-4 py-3 text-[12px] leading-relaxed text-inkSoft">
            {notice}
          </div>
        )}
      </div>

      {showLockedModal && (pickLock || roommateSelection?.confirmed_at) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#120B2D]/58 px-6">
          <div className="w-full max-w-[340px] rounded-[28px] bg-white px-5 py-5 text-center shadow-[0_24px_60px_rgba(34,19,89,0.28)]">
            <span className="inline-flex rounded-full bg-lavenderSoft px-3 py-1 text-[10px] font-bold text-indigo">
              {roommateSelection?.confirmed_at ? "룸메이트 확정 완료" : "오늘의 추천 완료"}
            </span>
            <h2 className="mt-3 text-[18px] font-bold text-ink">
              {roommateSelection?.confirmed_at
                ? "이미 룸메이트를 확정했어요"
                : "오늘은 이미 뽑기를 마쳤어요"}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-inkSoft">
              {roommateSelection?.confirmed_at
                ? `${roommateSelection.peer_name || "선택한 상대"}님과 룸메이트가 확정되어 추천 뽑기는 더 이상 열리지 않아요. 아래에서 약속과 채팅을 이어서 사용할 수 있어요.`
                : `${pickLock?.selected_candidate_name || "선택한 후보"}님과 채팅을 이어가며 서로 맞는지 확인해보세요. 다음 뽑기는 ${nextAvailableLabel} 이후에 다시 할 수 있어요.`}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLockedModal(false)}
                className="flex-1 rounded-[18px] border border-line px-4 py-3 text-[13px] font-bold text-inkSoft"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockedModal(false);
                  router.push(roommateSelection?.confirmed_at ? "/rules/draft" : "/chat");
                }}
                className="flex-1 rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
              >
                {roommateSelection?.confirmed_at ? "약속 보러 가기" : "채팅하러 가기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmptyModal && !candidates.length && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#120B2D]/58 px-6">
          <div className="w-full max-w-[340px] rounded-[28px] bg-white px-5 py-5 text-center shadow-[0_24px_60px_rgba(34,19,89,0.28)]">
            <span className="inline-flex rounded-full bg-lavenderSoft px-3 py-1 text-[10px] font-bold text-indigo">
              추천 후보 없음
            </span>
            <h2 className="mt-3 text-[18px] font-bold text-ink">
              아직 뽑을 수 있는 후보가 없어요
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-inkSoft">
              지금은 매칭 가능한 다른 인터뷰 완료 사용자가 없어서 추천 후보를 만들지 못했어요.
              조금 뒤 다시 확인해 주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowEmptyModal(false)}
              className="mt-5 w-full rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showProfileRequiredModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#120B2D]/58 px-6">
          <div className="w-full max-w-[340px] rounded-[28px] bg-white px-5 py-5 text-center shadow-[0_24px_60px_rgba(34,19,89,0.28)]">
            <span className="inline-flex rounded-full bg-lavenderSoft px-3 py-1 text-[10px] font-bold text-indigo">
              프로필 필요
            </span>
            <h2 className="mt-3 text-[18px] font-bold text-ink">
              프로필 설정이 먼저 필요해요
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-inkSoft">
              기본 프로필을 저장해야 나와 맞는 룸메이트 후보를 찾을 수 있어요.
              프로필 설정 후 생활 인터뷰까지 이어서 진행해 주세요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowProfileRequiredModal(false)}
                className="flex-1 rounded-[18px] border border-line px-4 py-3 text-[13px] font-bold text-inkSoft"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex-1 rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
              >
                설정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {drawState !== "playing" && <BottomNav />}
    </Shell>
  );
}
