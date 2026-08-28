"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Shell from "@/components/Shell";
import {
  getCandidates,
  getRoommateSelection,
  hasConfirmedRoommate,
  syncPersistedRoommateState,
} from "@/lib/mockApi";

const DAILY_PICK_LOCK_KEY = "roomonic-daily-pick-lock";
const DRAW_RESULT_KEY = "roomonic-draw-result";

export default function CandidateResultPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [pickedIds, setPickedIds] = useState([]);
  const [pickLock, setPickLock] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [roommateSelection, setRoommateSelection] = useState(null);

  useEffect(() => {
    syncPersistedRoommateState().finally(() => {
      if (hasConfirmedRoommate()) {
        const confirmed = getRoommateSelection();
        setRoommateSelection(confirmed);
        setNotice(
          `${confirmed?.peer_name || "선택한 상대"}님과 룸메이트가 확정되어 추천 후보는 다시 선택할 수 없어요.`,
        );
      }
    });

    if (typeof window !== "undefined") {
      const rawLock = window.localStorage.getItem(DAILY_PICK_LOCK_KEY);
      if (rawLock) {
        try {
          const parsed = JSON.parse(rawLock);
          if (
            parsed.locked_until &&
            new Date(parsed.locked_until).getTime() > Date.now()
          ) {
            setPickLock(parsed);
            if (parsed.selected_candidate_id) {
              setPickedIds([parsed.selected_candidate_id]);
            }
          }
        } catch {}
      }

      const rawResult = window.localStorage.getItem(DRAW_RESULT_KEY);
      if (rawResult) {
        try {
          const parsed = JSON.parse(rawResult);
          if (Array.isArray(parsed.picked_ids) && parsed.picked_ids.length) {
            setPickedIds(parsed.picked_ids);
          }
        } catch {}
      }
    }

    getCandidates()
      .then((data) => {
        setCandidates(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleCandidates = useMemo(() => {
    const items = pickedIds
      .map((id) => candidates.find((candidate) => candidate.id === id))
      .filter(Boolean);
    return pickLock?.selected_candidate_id
      ? items.filter((candidate) => candidate.id === pickLock.selected_candidate_id)
      : items;
  }, [candidates, pickedIds, pickLock]);

  const nextAvailableLabel = useMemo(() => {
    if (!pickLock?.locked_until) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(pickLock.locked_until));
  }, [pickLock]);

  const highlightPoints = useMemo(
    () => visibleCandidates.flatMap((candidate) => candidate.goodPoints || []).slice(0, 4),
    [visibleCandidates],
  );

  useEffect(() => {
    if (loading) return;
    if (visibleCandidates.length > 0) return;
    router.replace("/candidates");
  }, [loading, router, visibleCandidates.length]);

  function handleOpenCandidate(candidate) {
    router.push(`/candidates/${candidate.profile_id || candidate.id}`);
  }

  return (
    <Shell>
      <div className="relative z-10 flex-1 bg-[linear-gradient(180deg,#FCF8FF_0%,#F4ECFF_52%,#F0E6FF_100%)] px-4 pt-6 pb-8">
        <div className="mx-auto max-w-[390px] rounded-[30px] border border-[#E7DFFF] bg-[#F7F3FF] p-[1px] shadow-[0_18px_40px_rgba(94,77,163,0.14)]">
          <div className="rounded-[30px] bg-[#F7F3FF] px-4 py-5 text-ink">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-lavenderSoft px-3 py-1 text-[10px] font-bold text-indigo">
                추천 후보 창
              </span>
              <h1 className="mt-3 text-[20px] font-bold">
                {roommateSelection?.confirmed_at
                  ? "룸메이트 확정 완료"
                  : pickLock
                    ? "오늘 선택한 추천 후보"
                    : "추천 후보 3명"}
              </h1>
              <p className="mt-1 text-[12px] text-inkSoft">
                {roommateSelection?.confirmed_at
                  ? "이미 룸메이트를 확정해서 오늘의 추천 후보 선택은 종료되었어요."
                  : pickLock
                  ? `오늘은 이미 선택을 마쳤어요. 다음 추천은 ${nextAvailableLabel} 이후에 다시 이용할 수 있어요.`
                  : "세 후보 중 한 명만 선택할 수 있어요."}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {visibleCandidates.map((candidate) => {
                const isLockedSelection = pickLock?.selected_candidate_id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleOpenCandidate(candidate)}
                    className="w-full rounded-[22px] border border-line bg-white px-4 py-4 text-left shadow-card transition hover:translate-y-[-1px]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-2xl ${candidate.bg}`}
                      >
                        <img
                          src={candidate.imagePath || "/images/characters/UNI.png"}
                          alt={`${candidate.name} 캐릭터`}
                          className="h-[52px] w-[52px] object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[14px] font-bold text-ink">
                            {candidate.name}
                          </p>
                          {candidate.typeName && (
                            <span className="rounded-full bg-lavenderSoft px-2 py-1 text-[10px] font-bold text-indigo">
                              {candidate.typeName}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11.5px] text-inkSoft">
                          {candidate.region} · {candidate.moveIn}
                        </p>
                        <p className="mt-1 text-[11.5px] text-inkSoft">
                          {candidate.stayDurationMonths
                            ? `${candidate.stayDurationMonths}개월 거주 희망`
                            : "거주 기간 미설정"}
                        </p>
                        <p className="mt-1 text-[11px] text-indigo">
                          호환도 {candidate.score}%
                        </p>
                        {!!candidate.goodPoints?.length && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.goodPoints.slice(0, 2).map((point, index) => (
                              <span
                                key={`${candidate.id}-point-${index}`}
                                className="rounded-full bg-[#F5F0FF] px-2.5 py-1 text-[10px] font-semibold text-indigo"
                              >
                                {point.tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-full bg-lavenderSoft px-3 py-2 text-[11px] font-bold text-indigo">
                        {roommateSelection?.confirmed_at
                          ? "확정 완료"
                          : isLockedSelection
                            ? "다시 보기"
                            : "상세 보기"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!pickLock && !roommateSelection?.confirmed_at && highlightPoints.length > 0 && (
              <div className="mt-5 rounded-[24px] border border-[#E7DFFF] bg-white/88 px-4 py-4">
                <p className="text-[13px] font-bold text-ink">이번 추천 포인트</p>
                <div className="mt-3 grid gap-2">
                  {highlightPoints.map((point, index) => (
                    <div
                      key={`highlight-${index}`}
                      className="rounded-[18px] bg-[#F7F3FF] px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-indigo">
                          {point.tag}
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-inkSoft">
                          {point.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notice && (
              <div className="mt-4 rounded-[18px] border border-lavender bg-lavenderSoft/70 px-4 py-3 text-[12px] leading-relaxed text-ink">
                {notice}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </Shell>
  );
}
