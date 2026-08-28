'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import { connectChatSocket, getChatRoomMessages, getCurrentProfileContext } from '@/lib/mockApi';

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
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [profileContext, setProfileContext] = useState(null);
  const socketRef = useRef(null);
  const roomId = searchParams.get('roomId');
  const profileId = searchParams.get('profileId') || profileContext?.profile_id || '';
  const nickname = searchParams.get('nickname') || profileContext?.nickname || '나';
  const peerName = searchParams.get('peerName') || '상대방';

  const ready = useMemo(() => Boolean(roomId && profileId && nickname), [nickname, profileId, roomId]);

  useEffect(() => {
    setProfileContext(getCurrentProfileContext());
  }, []);

  useEffect(() => {
    if (!ready) {
      setStatus('missing');
      setError('채팅방 정보가 없어요. 추천 후보 화면에서 다시 들어와주세요.');
      return undefined;
    }

    let active = true;
    setStatus('connecting');
    setError('');

    getChatRoomMessages(roomId)
      .then((body) => {
        if (!active) return;
        setMessages(body.messages || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || '메시지 이력을 불러오지 못했어요');
      });

    const socket = connectChatSocket({
      roomId,
      profileId,
      nickname,
      onStateChange: setStatus,
      onError: (err) => setError(err.message || '채팅 연결에 실패했어요'),
      onMessage: (message) => {
        setMessages((prev) => {
          if (prev.some((item) => item.message_id === message.message_id)) return prev;
          return [...prev, message];
        });
      },
    });

    socketRef.current = socket;

    return () => {
      active = false;
      socket.close();
      socketRef.current = null;
    };
  }, [ready, roomId, profileId, nickname]);

  function handleSend() {
    if (!text.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: 'send_message',
        text,
      })
    );
    setText('');
  }

  return (
    <Shell>
      <div className="flex justify-between px-[22px] pt-3.5 pb-1 text-[11px] font-bold">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>
      <div className="px-[22px] flex items-center gap-2.5 pt-1.5 pb-2.5 border-b border-line">
        <button onClick={() => router.push('/candidates')} className="font-bold text-indigo">
          ←
        </button>
        <div className="w-[34px] h-[34px] rounded-full bg-peachSoft flex items-center justify-center">🧑</div>
        <div className="flex-1">
          <p className="font-bold text-[13.5px]">{peerName}</p>
          <p className="text-[11.5px] text-inkFaint">
            {status === 'connected' ? '실시간 연결됨' : status === 'connecting' ? '연결 중' : '연결 대기'}
          </p>
        </div>
        <span>📞</span>
      </div>
      {error && <div className="px-[22px] pt-2 text-[12px] text-[#C22A5A]">{error}</div>}
      <div className="px-[22px] flex-1 flex flex-col gap-2 pt-3.5 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={m.message_id || i}
            className={`max-w-[78%] text-[12.5px] px-3.5 py-2.5 ${
              m.sender_profile_id === profileId || m.from === 'me'
                ? 'self-end bg-indigo text-white rounded-2xl rounded-br-md'
                : 'self-start bg-white border border-line rounded-2xl rounded-bl-md'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="px-[22px] pb-2">
        <button
          onClick={() => router.push('/rules/draft')}
          className="w-full text-center text-[11.5px] font-bold text-indigo bg-lavenderSoft rounded-xl py-2"
        >
          두 분 다 준비되셨다면 → AI 생활수칙 초안 만들기
        </button>
      </div>
      <div className="px-[22px] pb-4 flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지 입력..."
          className="flex-1 px-3.5 py-2.5 rounded-full border-[1.5px] border-line text-[12.5px]"
          disabled={!ready}
        />
        <button
          onClick={handleSend}
          className={`w-[38px] h-[38px] rounded-full text-white text-[15px] flex-shrink-0 ${
            ready ? 'bg-indigo' : 'bg-[#B9B2E6]'
          }`}
        >
          ➤
        </button>
      </div>
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
