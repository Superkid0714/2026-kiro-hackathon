'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Shell from '@/components/Shell';
import { Modal } from '@/components/UI';
import {
  acceptMatchRequest,
  connectChatSocket,
  confirmRoommateFromChat,
  createChatRoom,
  getChatInbox,
  getChatQuestionSuggestions,
  getChatRoomMessages,
  connectChatInboxSocket,
  getCurrentProfileContext,
  getHomeOverview,
  getRoommateSelection,
  markChatRoomAsRead,
  rejectMatchRequest,
  sendLocalChatMessage,
  syncPersistedRoommateState,
} from '@/lib/mockApi';

function getCharacterImageByType(typeCode) {
  if (typeCode === 'PEE') return '/images/characters/Pee.png';
  if (typeCode === 'DUDI') return '/images/characters/Dudi.png';
  if (typeCode === 'MOMO') return '/images/characters/momo.png';
  if (typeCode === 'ROO') return '/images/characters/Roo.png';
  return '/images/characters/UNI.png';
}

function getCharacterBgByType(typeCode) {
  if (typeCode === 'PEE') return 'bg-mintSoft';
  if (typeCode === 'DUDI') return 'bg-peachSoft';
  if (typeCode === 'MOMO') return 'bg-pinkSoft';
  if (typeCode === 'ROO') return 'bg-lavenderSoft';
  return 'bg-lavenderSoft';
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = useRef(null);
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [profileContext, setProfileContext] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [acceptingId, setAcceptingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [hasInterview, setHasInterview] = useState(true);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRoommateConfirmModal, setShowRoommateConfirmModal] = useState(false);
  const [roommateConfirmMessage, setRoommateConfirmMessage] = useState('');
  const [roommateSelection, setRoommateSelection] = useState(null);
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [questionSuggestionSource, setQuestionSuggestionSource] = useState('');
  const [showQuestionGuide, setShowQuestionGuide] = useState(true);
  const [chatState, setChatState] = useState({
    match_status: 'accepted',
    can_send_message: true,
  });
  const roomId = searchParams.get('roomId');
  const requestId = searchParams.get('requestId');
  const profileId = searchParams.get('profileId') || profileContext?.profile_id || '';

  const selectedRequest = useMemo(() => {
    if (!requestId) return null;
    return (
      inbox.find(
        (item) =>
          item.request_id === requestId ||
          item.conversation_id === requestId
      ) || null
    );
  }, [inbox, requestId]);

  const peer = useMemo(() => {
    const participants = room?.participants || [];
    return participants.find((participant) => participant.profile_id !== profileId) || null;
  }, [profileId, room]);
  const peerName =
    peer?.nickname ||
    selectedRequest?.peer_name ||
    searchParams.get('peerName') ||
    '채팅 상대';
  const peerTypeCode =
    selectedRequest?.peer_type_code ||
    peer?.character?.type_code ||
    null;
  const peerImageSrc = selectedRequest?.peer_image_path || getCharacterImageByType(peerTypeCode);
  const peerBgClass = getCharacterBgByType(peerTypeCode);
  const hasQuestionGuide =
    chatState.match_status === 'accepted' &&
    questionSuggestions.length > 0 &&
    showQuestionGuide;
  const roommateConfirmation = room?.roommate_confirmation || null;
  const roommateConfirmationPendingForMe =
    roommateConfirmation?.status === 'pending' &&
    roommateConfirmation?.pending_for_profile_id === profileId;
  const roommateAlreadyConfirmed =
    roommateSelection?.room_id === roomId && roommateSelection?.confirmed_at;

  const isIncomingRequest =
    Boolean(selectedRequest) &&
    selectedRequest.requester_profile_id !== profileId &&
    selectedRequest.status === 'pending';

  useEffect(() => {
    setProfileContext(getCurrentProfileContext());
    setRoommateSelection(getRoommateSelection());

    let active = true;
    getHomeOverview()
      .then((overview) => {
        if (!active) return;
        setHasInterview(Boolean(overview?.hasInterview));
      })
      .catch(() => {
        if (!active) return;
        setHasInterview(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (roomId) return undefined;

    let active = true;
    let inboxSocket = null;
    setInboxLoading(true);
    const loadInbox = async () => {
      try {
        const items = await getChatInbox();
        if (!active) return;
        setInbox(items);
        setInboxLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err.message || '채팅 목록을 불러오지 못했어요');
        setInboxLoading(false);
      }
    };

    loadInbox();
    if (profileId) {
      inboxSocket = connectChatInboxSocket({
        profileId,
        onSnapshot: (snapshot) => {
          if (!active) return;
          setInbox(snapshot.items || []);
          setInboxLoading(false);
        },
        onError: (err) => {
          if (!active) return;
          setError((prev) => prev || err.message || '채팅 목록을 불러오지 못했어요');
          setInboxLoading(false);
        },
      });
    }
    const timer = window.setInterval(loadInbox, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
      inboxSocket?.close();
    };
  }, [profileId, roomId]);

  useEffect(() => {
    if (!roomId) return undefined;

    let active = true;
    setStatus('connecting');
    setError('');

    const closeSocket = () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    const loadRoom = async () => {
      try {
        const body = await getChatRoomMessages(roomId);
        if (!active) return;
        setRoom(body.room || null);
        setMessages(body.messages || []);
        setChatState(
          body.chat_state || {
            match_status: 'accepted',
            can_send_message: true,
          }
        );

        if (String(roomId).startsWith('local-room-')) {
          setStatus('connected');
          return;
        }

        closeSocket();
        socketRef.current = connectChatSocket({
          roomId,
          profileId,
          nickname: profileContext?.nickname || '나',
          onMessage: (message) => {
            setMessages((prev) => {
              if (prev.some((item) => item.message_id === message.message_id)) return prev;
              return [...prev, message];
            });
          },
          onStateChange: (nextState) => setStatus(nextState),
          onConfirmation: (payload) => {
            if (payload?.room) {
              setRoom(payload.room);
            }
            if (payload?.status === 'pending') {
              const pendingForMe =
                payload?.room?.roommate_confirmation?.pending_for_profile_id === profileId;
              if (pendingForMe) {
                setRoommateConfirmMessage(
                  `${peerName}님이 먼저 룸메이트 확정을 보냈어요. 괜찮다면 이 채팅방에서 나도 확정해 주세요.`
                );
                setShowRoommateConfirmModal(true);
              }
            }
            if (payload?.status === 'confirmed') {
              syncPersistedRoommateState()
                .then(() => {
                  setRoommateSelection(getRoommateSelection());
                  router.push('/rules/draft');
                })
                .catch(() => {
                  router.push('/rules/draft');
                });
            }
          },
          onError: (nextError) => setError(nextError.message || '채팅 연결 중 오류가 발생했어요'),
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || '메시지 이력을 불러오지 못했어요');
        setStatus('error');
      }
    };

    loadRoom();
    return () => {
      active = false;
      closeSocket();
    };
  }, [profileContext?.nickname, profileId, roomId, router]);

  useEffect(() => {
    if (!roomId || !profileId) return undefined;
    setShowQuestionGuide(true);

    let active = true;
    let timerId;
    const loadSuggestions = async () => {
      try {
        const body = await getChatQuestionSuggestions(roomId);
        if (!active) return;
        setQuestionSuggestions(body.questions || []);
        setQuestionSuggestionSource(body.source || '');
      } catch (err) {
        if (!active) return;
        setQuestionSuggestions([]);
        if (err?.status !== 409) {
          setError((prev) => prev || err.message || '추천 질문을 불러오지 못했어요');
        }
      }
    };

    timerId = window.setTimeout(loadSuggestions, messages.length > 0 ? 350 : 0);
    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [messages.length, profileId, roomId]);

  useEffect(() => {
    if (!roomId || !profileId || status !== 'connected') return undefined;

    const syncReadState = () => {
      markChatRoomAsRead(roomId).catch(() => {});
    };
    syncReadState();
    window.addEventListener('focus', syncReadState);
    return () => {
      window.removeEventListener('focus', syncReadState);
    };
  }, [profileId, roomId, status]);

  useEffect(() => {
    if (!roomId || !profileId || status !== 'connected' || messages.length === 0) return;
    markChatRoomAsRead(roomId).catch(() => {});
  }, [messages, profileId, roomId, status]);

  async function handleSend() {
    if (!roomId || !text.trim() || sending || !chatState.can_send_message) return;
    setSending(true);
    setError('');
    try {
      if (String(roomId).startsWith('local-room-')) {
        const result = await sendLocalChatMessage(roomId, text);
        setMessages((prev) => [...prev, ...(result.messages || [])]);
      } else if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'send_message',
            text,
          })
        );
      } else {
        throw new Error('채팅 연결이 아직 준비되지 않았어요');
      }
      setText('');
    } catch (err) {
      setError(err.message || '메시지를 보내지 못했어요');
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptRequest() {
    if (!selectedRequest || acceptingId) return;
    if (!hasInterview) {
      setShowInterviewModal(true);
      return;
    }

    const activeRequestId = selectedRequest.request_id || selectedRequest.conversation_id;
    setAcceptingId(activeRequestId);
    setError('');
    try {
      const readyRoom = await acceptMatchRequest(
        activeRequestId,
        selectedRequest.peer_profile_id
      );

      const query = new URLSearchParams({
        roomId: readyRoom.room_id,
        profileId,
        peerName: selectedRequest.peer_name,
      });
      router.replace(`/chat?${query.toString()}`);
    } catch (err) {
      setError(err.message || '채팅 요청 수락에 실패했어요');
    } finally {
      setAcceptingId('');
    }
  }

  async function handleRejectRequest() {
    if (!selectedRequest || rejectingId) return;
    const activeRequestId = selectedRequest.request_id || selectedRequest.conversation_id;
    setRejectingId(activeRequestId);
    setError('');
    try {
      await rejectMatchRequest(activeRequestId);
      const nextInbox = await getChatInbox();
      setInbox(nextInbox);
      router.replace('/chat');
    } catch (err) {
      setError(err.message || '채팅 요청 거절에 실패했어요');
    } finally {
      setRejectingId('');
    }
  }

  async function handleEnterPendingChat() {
    if (!selectedRequest?.peer_profile_id) return;
    setError('');
    try {
      const room = await createChatRoom(selectedRequest.peer_profile_id);
      const nextInbox = await getChatInbox();
      setInbox(nextInbox);
      const query = new URLSearchParams({
        roomId: room.room_id,
        profileId,
        peerName: selectedRequest.peer_name,
      });
      router.push(`/chat?${query.toString()}`);
    } catch (err) {
      setError(err.message || '채팅방으로 이동하지 못했어요');
    }
  }

  async function handleConfirmRoommate() {
    if (!roomId || !profileId || !peer?.profile_id || confirming) return;
    setConfirming(true);
    setError('');
    try {
      const result = await confirmRoommateFromChat({
        roomId,
        profileId,
        peerProfileId: peer.profile_id,
        peerName,
      });
      if (result?.status === 'confirmed') {
        router.push('/rules/draft');
      } else if (result?.status === 'pending') {
        setRoom(result.room || null);
      }
    } catch (err) {
      if (err.status === 409) {
        setShowInterviewModal(true);
      } else {
        setError(err.message || '룸메이트 확정에 실패했어요');
      }
    } finally {
      setConfirming(false);
    }
  }

  if (!roomId && selectedRequest) {
    const activeRequestId = selectedRequest.request_id || selectedRequest.conversation_id;
    const accepted = selectedRequest.status === 'accepted';
    const rejected = selectedRequest.status === 'rejected';

    return (
      <Shell>
        <div className="px-[22px] flex items-center gap-2.5 pt-4 pb-3 border-b border-line">
          <button onClick={() => router.push('/chat')} className="font-bold text-indigo">
            ←
          </button>
          <div className={`w-[40px] h-[40px] rounded-full ${getCharacterBgByType(selectedRequest?.peer_type_code)} flex items-center justify-center overflow-hidden`}>
            <img
              src={selectedRequest.peer_image_path || getCharacterImageByType(selectedRequest?.peer_type_code)}
              alt={`${selectedRequest.peer_name} 캐릭터`}
              className="w-[34px] h-[34px] object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[13.5px]">{selectedRequest.peer_name}</p>
            <p className="text-[11.5px] text-inkFaint">
              {accepted
                ? '서로 연결된 대화방으로 이동할 수 있어요'
                : rejected
                  ? '이번 요청은 종료되었어요'
                  : isIncomingRequest
                    ? '이 요청을 수락하면 바로 대화를 시작할 수 있어요'
                    : '상대가 요청을 확인하고 있어요'}
            </p>
          </div>
        </div>

        {error && <div className="px-[22px] pt-3 text-[12px] text-[#C22A5A]">{error}</div>}

        <div className="flex-1 px-[22px] py-5">
          <div className="rounded-[24px] border border-line bg-white px-5 py-5 shadow-card">
            <div className={`mx-auto flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-[28px] ${getCharacterBgByType(selectedRequest?.peer_type_code)}`}>
              <img
                src={selectedRequest.peer_image_path || getCharacterImageByType(selectedRequest?.peer_type_code)}
                alt={`${selectedRequest.peer_name} 캐릭터`}
                className="h-[76px] w-[76px] object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-[18px] font-bold text-ink">{selectedRequest.peer_name}</p>
              <p className="mt-1 text-[12px] text-inkSoft">
                {selectedRequest.peer_region || '지역 미설정'}
              </p>
              <div className="mt-3 inline-flex rounded-full bg-lavenderSoft px-3 py-1 text-[11px] font-bold text-indigo">
                {accepted
                  ? '대화 가능'
                  : rejected
                    ? '요청 종료'
                    : isIncomingRequest
                      ? '받은 요청'
                      : '보낸 요청'}
              </div>
            </div>

            <div className="mt-5 rounded-[20px] bg-[#F8F5FF] px-4 py-4">
              <p className="text-[12px] font-semibold text-ink">
                {accepted
                  ? '이제 채팅방으로 들어가서 대화를 시작해보세요.'
                  : rejected
                    ? '다른 추천 후보를 확인해서 새로운 연결을 시도할 수 있어요.'
                    : isIncomingRequest
                      ? '서로 생활 패턴이 잘 맞는 후보예요. 수락 또는 거절을 선택할 수 있어요.'
                      : '상대가 수락하면 자동으로 대화 가능한 상태로 바뀌어요.'}
              </p>
            </div>

            <div className="mt-5 grid gap-2.5">
              {accepted ? (
                <button
                  type="button"
                  onClick={() => {
                    const query = new URLSearchParams({
                      roomId: selectedRequest.room_id,
                      profileId,
                      peerName: selectedRequest.peer_name,
                    });
                    router.push(`/chat?${query.toString()}`);
                  }}
                  className="w-full rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
                >
                  채팅방 들어가기
                </button>
              ) : rejected ? (
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className="w-full rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
                >
                  채팅 목록으로 돌아가기
                </button>
              ) : isIncomingRequest ? (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptRequest}
                    disabled={Boolean(acceptingId) || Boolean(rejectingId)}
                    className="w-full rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white disabled:bg-[#B9B2E6]"
                  >
                    {acceptingId === activeRequestId ? '수락하는 중...' : '수락하고 대화 시작하기'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectRequest}
                    disabled={Boolean(acceptingId) || Boolean(rejectingId)}
                    className="w-full rounded-[18px] border border-line bg-white px-4 py-3 text-[13px] font-bold text-ink disabled:text-inkFaint"
                  >
                    {rejectingId === activeRequestId ? '거절하는 중...' : '이번 요청은 넘기기'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleEnterPendingChat}
                    className="w-full rounded-[18px] bg-indigo px-4 py-3 text-[13px] font-bold text-white"
                  >
                    채팅방 들어가기
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/chat')}
                    className="w-full rounded-[18px] bg-[#F5F0FF] px-4 py-3 text-[13px] font-bold text-indigo"
                  >
                    목록으로 돌아가기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <BottomNav />
        <Modal
          open={showInterviewModal}
          title="생활 인터뷰가 먼저 필요해요"
          description="채팅 요청 수락과 룸메이트 확정 전에 생활 인터뷰를 먼저 완료해주세요."
          primaryLabel="인터뷰 하러 가기"
          secondaryLabel="닫기"
          onPrimary={() => router.push('/interview')}
          onSecondary={() => setShowInterviewModal(false)}
        />
      </Shell>
    );
  }

  if (!roomId) {
    return (
      <Shell>
        <div className="px-[22px] pt-4 pb-3 border-b border-line">
          <h2 className="text-[18px] font-bold text-ink">채팅 목록</h2>
          <p className="mt-1 text-[11.5px] text-inkFaint">매칭 요청과 대화 가능한 채팅방을 확인할 수 있어요.</p>
        </div>
        {error && <div className="px-[22px] pt-3 text-[12px] text-[#C22A5A]">{error}</div>}
        <div className="px-[22px] py-4 flex-1 flex flex-col gap-3">
          {inboxLoading ? (
            <div className="flex-1">
              <div className="rounded-[28px] border border-line bg-white px-5 py-6 shadow-card">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-[92px] w-[92px] rounded-[26px] bg-[#EFEAFB]" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 w-24 rounded-full bg-[#EFEAFB]" />
                      <div className="mt-3 h-6 w-44 rounded-full bg-[#F5F1FF]" />
                      <div className="mt-2 h-3 w-full rounded-full bg-[#F5F1FF]" />
                      <div className="mt-2 h-3 w-5/6 rounded-full bg-[#F5F1FF]" />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <div className="rounded-[20px] bg-[#FAF8FF] px-4 py-4">
                      <div className="h-3 w-14 rounded-full bg-[#EFEAFB]" />
                      <div className="mt-2 h-5 w-12 rounded-full bg-[#F2EDFF]" />
                      <div className="mt-2 h-3 w-full rounded-full bg-[#F2EDFF]" />
                    </div>
                    <div className="rounded-[20px] bg-[#F7FFFC] px-4 py-4">
                      <div className="h-3 w-14 rounded-full bg-[#E9F8F1]" />
                      <div className="mt-2 h-5 w-12 rounded-full bg-[#EDF9F3]" />
                      <div className="mt-2 h-3 w-full rounded-full bg-[#EDF9F3]" />
                    </div>
                  </div>
                  <div className="mt-5 h-[50px] rounded-[20px] bg-[#E4DAFF]" />
                </div>
              </div>
            </div>
          ) : inbox.length === 0 ? (
            <div className="flex-1">
              <div className="rounded-[28px] border border-line bg-white px-5 py-6 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[26px] bg-lavenderSoft">
                    <img
                      src="/images/characters/UNI.png"
                      alt="채팅 안내 캐릭터"
                      className="h-[80px] w-[80px] object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-indigo">아직 열린 대화가 없어요</p>
                    <h3 className="mt-1 text-[20px] font-bold leading-tight text-ink">
                      마음에 드는 후보와
                      <br />
                      첫 대화를 시작해보세요
                    </h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-inkFaint">
                      추천에서 후보를 선택하면 여기에서 요청 상태와 대화를 한 번에 확인할 수 있어요.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/candidates')}
                  className="mt-5 w-full rounded-[20px] bg-indigo px-4 py-3.5 text-[13px] font-bold text-white"
                >
                  추천 후보 보러가기
                </button>
              </div>

              <div className="mt-4 rounded-[24px] bg-[#F8F5FF] px-5 py-5">
                <p className="text-[12px] font-semibold text-ink">채팅은 이렇게 열려요</p>
                <div className="mt-3 grid gap-2.5">
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <p className="text-[11px] text-inkFaint">1단계</p>
                    <p className="mt-1 text-[13px] font-semibold text-ink">추천 후보 중 한 명을 선택해요</p>
                  </div>
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <p className="text-[11px] text-inkFaint">2단계</p>
                    <p className="mt-1 text-[13px] font-semibold text-ink">요청 상태를 확인하고 대화를 시작해요</p>
                  </div>
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <p className="text-[11px] text-inkFaint">3단계</p>
                    <p className="mt-1 text-[13px] font-semibold text-ink">서로 괜찮다면 룸메이트 확정으로 이어져요</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            inbox.map((item) => {
              const accepted = item.status === 'accepted';
              const rejected = item.status === 'rejected';
              return (
                <button
                  key={item.conversation_id}
                  type="button"
                  onClick={() => {
                    if (accepted || (item.status === 'pending' && item.requester_profile_id === profileId && item.room_id)) {
                      const query = new URLSearchParams({
                        roomId: item.room_id,
                        profileId,
                        peerName: item.peer_name,
                      });
                      router.push(`/chat?${query.toString()}`);
                      return;
                    }

                    const query = new URLSearchParams({
                      requestId: item.request_id || item.conversation_id,
                    });
                    router.push(`/chat?${query.toString()}`);
                  }}
                  className="rounded-[20px] border border-line bg-white px-4 py-4 text-left shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-2xl ${getCharacterBgByType(item.peer_type_code)}`}>
                      <img
                        src={item.peer_image_path || getCharacterImageByType(item.peer_type_code)}
                        alt={`${item.peer_name} 캐릭터`}
                        className="h-[50px] w-[50px] object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-bold text-ink">{item.peer_name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            accepted
                              ? 'bg-mintSoft text-[#1E8A62]'
                              : rejected
                                ? 'bg-[#FDE1E9] text-[#C22A5A]'
                                : 'bg-peachSoft text-[#B36B1D]'
                          }`}
                        >
                          {accepted ? '대화 가능' : rejected ? '요청 종료' : '수락 대기'}
                        </span>
                        {accepted && item.unread_count > 0 ? (
                          <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#FF6B8A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                            {item.unread_count > 99 ? '99+' : item.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11.5px] text-inkFaint">
                        {accepted
                          ? item.last_message_preview || '이제 대화를 시작할 수 있어요.'
                          : rejected
                            ? item.last_message_preview || '이번 요청은 종료되었어요.'
                            : item.requester_profile_id === profileId
                              ? '상대가 확인 전이어도 먼저 채팅방에 들어갈 수 있어요.'
                              : '받은 요청이 있어요. 눌러서 확인해보세요.'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <BottomNav />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="fixed top-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 items-center gap-2.5 border-b border-line bg-cream px-[22px] pt-4 pb-3">
        <button onClick={() => router.push('/chat')} className="font-bold text-indigo">
          ←
        </button>
        <div className={`w-[40px] h-[40px] rounded-full ${peerBgClass} flex items-center justify-center overflow-hidden`}>
          <img src={peerImageSrc} alt={`${peerName} 캐릭터`} className="w-[34px] h-[34px] object-contain" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[13.5px]">{peerName}</p>
          <p className="text-[11.5px] text-inkFaint">
            {chatState.match_status !== 'accepted'
              ? '상대 수락 대기'
              : status === 'connected'
                ? '대화 가능'
                : status === 'connecting'
                  ? '연결 중'
                  : '연결 대기'}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-inkFaint bg-lavenderSoft px-2.5 py-1 rounded-full">
          채팅
        </span>
      </div>
      <div aria-hidden="true" className="h-[76px] shrink-0" />
      {error && <div className="px-[22px] pt-2 text-[12px] text-[#C22A5A]">{error}</div>}
      {chatState.match_status !== 'accepted' ? (
        <div className="px-[22px] pt-3">
          <div className="rounded-[18px] bg-[#F8F5FF] px-4 py-3 text-[12px] font-semibold text-indigo">
            요청은 전달되었어요. 상대가 이 요청을 수락하면 바로 대화를 시작할 수 있어요.
          </div>
        </div>
      ) : null}
      <div
        className={`px-[22px] flex-1 flex flex-col gap-2 pt-3.5 overflow-y-auto ${
          hasQuestionGuide ? 'pb-[340px]' : 'pb-[220px]'
        }`}
      >
        {messages.map((m, i) => (
          <div
            key={m.message_id || i}
            className={`max-w-[78%] text-[12.5px] px-3.5 py-2.5 ${
              m.sender_profile_id === profileId
                ? 'self-end bg-indigo text-white rounded-2xl rounded-br-md'
                : 'self-start bg-white border border-line rounded-2xl rounded-bl-md'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white/96 px-[22px] pt-3 pb-24 backdrop-blur-sm"
        style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}
      >
        {hasQuestionGuide ? (
          <div className="mb-3 rounded-[20px] border border-line bg-[#F8F5FF] px-4 py-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-ink">대화 가이드</p>
                <p className="mt-1 text-[11px] leading-relaxed text-inkFaint">
                  최근 대화를 바탕으로 지금 이어서 물어보기 좋은 질문이에요.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo">
                  {questionSuggestionSource === 'llm' ? 'Gemini' : '추천'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuestionGuide(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[14px] font-bold text-inkFaint"
                  aria-label="대화 가이드 닫기"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {questionSuggestions.map((question, index) => (
                <button
                  key={`${question}-${index}`}
                  type="button"
                  onClick={() => setText(question)}
                  className="rounded-[16px] bg-white px-3.5 py-3 text-left text-[11.5px] font-medium leading-relaxed text-ink shadow-card"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {roommateAlreadyConfirmed ? null : roommateConfirmation?.status === 'pending' ? (
          <div className="mb-3 rounded-[20px] border border-[#FFE3B5] bg-[#FFF6E8] px-4 py-3 shadow-[0_10px_24px_rgba(156,100,34,0.10)]">
            <p className="text-[12px] font-semibold leading-relaxed text-[#9C6422]">
              {roommateConfirmationPendingForMe
                ? '상대가 먼저 확정을 눌렀어요. 괜찮다면 나도 확정해 주세요.'
                : '내 확정은 저장됐어요. 이제 상대가 확정하면 룸메이트가 최종 확정돼요.'}
            </p>
            {roommateConfirmationPendingForMe ? (
              <button
                type="button"
                onClick={handleConfirmRoommate}
                disabled={status !== 'connected' || confirming || chatState.match_status !== 'accepted'}
                className={`mt-3 w-full rounded-[17px] px-4 py-3 text-[13px] font-bold text-white ${
                  status === 'connected' && !confirming && chatState.match_status === 'accepted'
                    ? 'bg-indigo'
                    : 'bg-[#B9B2E6]'
                }`}
              >
                {confirming ? '확정하는 중...' : '나도 룸메이트로 확정하기'}
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirmRoommate}
            disabled={status !== 'connected' || confirming || chatState.match_status !== 'accepted'}
            className={`mb-3 w-full rounded-[18px] px-4 py-3 text-[13px] font-bold text-white ${
              status === 'connected' && !confirming && chatState.match_status === 'accepted'
                ? 'bg-indigo'
                : 'bg-[#B9B2E6]'
            }`}
          >
            {confirming ? '확정하는 중...' : '이 대화 상대를 룸메이트로 확정하기'}
          </button>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
            className="flex-1 px-3.5 py-3 rounded-full border-[1.5px] border-line text-[12.5px] bg-white"
            disabled={status !== 'connected' || !chatState.can_send_message}
          />
          <button
            onClick={handleSend}
            disabled={status !== 'connected' || sending || !chatState.can_send_message}
            className={`w-[42px] h-[42px] rounded-full text-white text-[15px] flex-shrink-0 ${
              status === 'connected' && !sending && chatState.can_send_message
                ? 'bg-indigo'
                : 'bg-[#B9B2E6]'
            }`}
          >
            ➤
          </button>
        </div>
      </div>
      <BottomNav />
      <Modal
        open={showInterviewModal}
        title="생활 인터뷰가 먼저 필요해요"
        description="추천, 채팅, 룸메이트 확정 기능을 사용하려면 생활 인터뷰를 먼저 완료해주세요."
        primaryLabel="인터뷰 하러 가기"
        secondaryLabel="닫기"
        onPrimary={() => router.push('/interview')}
        onSecondary={() => setShowInterviewModal(false)}
      />
      <Modal
        open={showRoommateConfirmModal}
        title="룸메이트 확정 요청이 도착했어요"
        description={roommateConfirmMessage || '상대가 먼저 룸메이트 확정을 보냈어요.'}
        primaryLabel={roommateConfirmationPendingForMe ? '나도 확정하기' : '확인하기'}
        secondaryLabel="닫기"
        onPrimary={() => {
          if (roommateConfirmationPendingForMe) {
            setShowRoommateConfirmModal(false);
            handleConfirmRoommate();
            return;
          }
          setShowRoommateConfirmModal(false);
        }}
        onSecondary={() => setShowRoommateConfirmModal(false)}
      />
    </Shell>
  );
}

function ChatPageFallback() {
  return (
    <Shell>
      <div className="flex justify-center items-center h-full text-[12.5px] text-inkFaint">채팅방을 준비하는 중...</div>
    </Shell>
  );
}
