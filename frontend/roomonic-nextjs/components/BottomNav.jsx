'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Modal } from '@/components/UI';
import {
  connectChatInboxSocket,
  getChatInbox,
  getChatNotificationCount,
  getCurrentProfileContext,
  getRoommatePactStatus,
  hasConfirmedRoommate,
  syncPersistedRoommateState,
} from '@/lib/mockApi';

const DEFAULT_NAV_ITEMS = [
  { label: '홈', icon: 'home', href: '/home' },
  { label: '추천', icon: 'star', href: '/candidates' },
  { label: '채팅', icon: 'chat', href: '/chat' },
  { label: '게임', icon: 'game', href: '/minigame' },
  { label: '지도', icon: 'map', href: '/map' },
];

const CONFIRMED_NAV_ITEMS = [
  { label: '홈', icon: 'home', href: '/home' },
  { label: '약속', icon: 'promise', href: '/rules/draft' },
  { label: '채팅', icon: 'chat', href: '/chat' },
  { label: '게임', icon: 'game', href: '/minigame' },
  { label: '지도', icon: 'map', href: '/map' },
];

function isActive(pathname, href) {
  if (href === '/home') return pathname === '/home' || pathname === '/';
  if (href === '/rules/draft') {
    return pathname === '/rules/draft' || pathname.startsWith('/rules/') || pathname === '/signature' || pathname === '/final';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ type, active }) {
  const toneClass = active
    ? 'text-[#5B3FD1]'
    : 'text-[#8C88A6]';

  const props = {
    className: `h-[24px] w-[24px] ${toneClass} transition duration-300`,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  };

  if (type === 'home') {
    return (
      <svg {...props}>
        <path
          d="M12 4.4L18.3 9.25V17.8C18.3 18.904 17.404 19.8 16.3 19.8H14.4V14.95C14.4 14.094 13.706 13.4 12.85 13.4H11.15C10.294 13.4 9.6 14.094 9.6 14.95V19.8H7.7C6.596 19.8 5.7 18.904 5.7 17.8V9.25L12 4.4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9.1 8.95L12 6.7L14.9 8.95"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === 'star') {
    return (
      <svg {...props}>
        <path
          d="M12 4.2L13.96 8.18L18.35 8.82L15.17 11.92L15.92 16.3L12 14.24L8.08 16.3L8.83 11.92L5.65 8.82L10.04 8.18L12 4.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10.9" r="0.9" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'chat') {
    return (
      <svg {...props}>
        <path
          d="M6.8 18.5H4.8C4.358 18.5 4 18.142 4 17.7V6.8C4 5.806 4.806 5 5.8 5H18.2C19.194 5 20 5.806 20 6.8V13.2C20 14.194 19.194 15 18.2 15H10.8L6.8 18.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === 'game') {
    return (
      <svg {...props}>
        <path
          d="M8 7.5H16C18.38 7.5 20.389 9.269 20.691 11.629L21.143 15.157C21.301 16.39 20.342 17.5 19.099 17.5C18.44 17.5 17.824 17.177 17.448 16.635L16.652 15.488C16.391 15.112 15.963 14.888 15.505 14.888H8.495C8.037 14.888 7.609 15.112 7.348 15.488L6.552 16.635C6.176 17.177 5.56 17.5 4.901 17.5C3.658 17.5 2.699 16.39 2.857 15.157L3.309 11.629C3.611 9.269 5.62 7.5 8 7.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M7.2 9.8V13.2M5.5 11.5H8.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="16.4" cy="10.2" r="0.9" fill="currentColor" />
        <circle cx="18.2" cy="12" r="0.9" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'map') {
    return (
      <svg {...props}>
        <path
          d="M4.5 6.2L9.3 4.5L14.7 6.4L19.5 4.7V17.8L14.7 19.5L9.3 17.6L4.5 19.3V6.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.3 4.5V17.6M14.7 6.4V19.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path
        d="M4.7 7.2H7.1L10 5.08C10.944 4.389 12.239 4.521 13.02 5.38L13.75 6.18C15.073 5.179 16.886 5.078 18.308 5.92L18.74 6.18C19.009 6.343 19.317 6.43 19.631 6.43H20.7V12.25L19.12 13.82L15.94 10.64C15.236 9.936 14.096 9.934 13.389 10.635L12.1 11.91C11.569 12.436 10.713 12.434 10.186 11.904C9.659 11.374 9.662 10.518 10.192 9.992L13.92 6.3"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.1 16.2L9.18 17.28C9.565 17.665 10.189 17.665 10.574 17.28C10.959 16.895 10.959 16.271 10.574 15.886L9.96 15.27"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.48 17.16L11.56 18.24C11.945 18.625 12.569 18.625 12.954 18.24C13.339 17.855 13.339 17.231 12.954 16.846L11.76 15.66"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.86 16.98L13.88 18C14.265 18.385 14.889 18.385 15.274 18C15.659 17.615 15.659 16.991 15.274 16.606L14.08 15.41"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.7 7.2L3.7 13.3"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M20.7 6.43L21.45 12.05"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav({ dark = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const seenIncomingRequestIdsRef = useRef(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [chatNotifications, setChatNotifications] = useState(0);
  const [incomingRequestPreview, setIncomingRequestPreview] = useState(null);
  const [incomingAlertType, setIncomingAlertType] = useState('chat_request');
  const [showIncomingRequestModal, setShowIncomingRequestModal] = useState(false);

  const incomingRequestId = useMemo(
    () => incomingRequestPreview?.request_id || incomingRequestPreview?.conversation_id || '',
    [incomingRequestPreview]
  );

  function getIncomingAlerts(items, profileId) {
    return items
      .map((item) => {
        if (item.needs_my_action && item.status === 'pending') {
          const key = item.request_id || item.conversation_id;
          return key ? { type: 'chat_request', key: `request:${key}`, item } : null;
        }

        const confirmation = item.roommate_confirmation || {};
        if (
          item.status === 'accepted' &&
          item.room_id &&
          confirmation.status === 'pending' &&
          confirmation.pending_for_profile_id === profileId
        ) {
          const confirmedIds = (confirmation.confirmed_profile_ids || []).join(',');
          return {
            type: 'roommate_confirmation',
            key: `roommate:${item.room_id}:${confirmedIds}`,
            item,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function primeSeenAlerts(items, profileId) {
    getIncomingAlerts(items, profileId).forEach((alert) => {
      seenIncomingRequestIdsRef.current.add(alert.key);
    });
  }

  function showIncomingAlert(alert) {
    seenIncomingRequestIdsRef.current.add(alert.key);
    setIncomingAlertType(alert.type);
    setIncomingRequestPreview(alert.item);
    setShowIncomingRequestModal(true);
    try {
      navigator.vibrate?.([180, 80, 180]);
    } catch {}
  }

  useEffect(() => {
    let active = true;
    let timer;
    let initialized = false;
    let inboxSocket = null;

    const sync = async () => {
      try {
        await syncPersistedRoommateState();
        if (!active) return;
        setConfirmed(hasConfirmedRoommate());
        const [count, inbox] = await Promise.all([
          getChatNotificationCount(),
          getChatInbox(),
        ]);
        if (!active) return;
        setChatNotifications(count);

        const profile = getCurrentProfileContext();
        const incomingAlerts = getIncomingAlerts(inbox, profile?.profile_id);

        if (!initialized) {
          initialized = true;
          const firstUnseen = incomingAlerts.find(
            (alert) => !seenIncomingRequestIdsRef.current.has(alert.key)
          );
          if (firstUnseen) {
            showIncomingAlert(firstUnseen);
          } else {
            primeSeenAlerts(inbox, profile?.profile_id);
          }
          return;
        }

        const nextIncoming = incomingAlerts.find(
          (alert) => !seenIncomingRequestIdsRef.current.has(alert.key)
        );

        if (nextIncoming) {
          showIncomingAlert(nextIncoming);
        }
      } catch {
        if (!active) return;
        setChatNotifications(0);
      }
    };

    sync();
    const profile = getCurrentProfileContext();
    if (profile?.profile_id) {
      inboxSocket = connectChatInboxSocket({
        profileId: profile.profile_id,
        onSnapshot: (snapshot) => {
          if (!active) return;
          setChatNotifications(snapshot.notification_count || 0);

          const inbox = snapshot.items || [];
          const profile = getCurrentProfileContext();
          const incomingAlerts = getIncomingAlerts(inbox, profile?.profile_id);

          if (!initialized) {
            initialized = true;
            const firstUnseen = incomingAlerts.find(
              (alert) => !seenIncomingRequestIdsRef.current.has(alert.key)
            );
            if (firstUnseen) {
              showIncomingAlert(firstUnseen);
            } else {
              primeSeenAlerts(inbox, profile?.profile_id);
            }
            return;
          }

          const nextIncoming = incomingAlerts.find(
            (alert) => !seenIncomingRequestIdsRef.current.has(alert.key)
          );

          if (nextIncoming) {
            showIncomingAlert(nextIncoming);
          }
        },
        onError: () => {},
      });
    }
    window.addEventListener('storage', sync);
    window.addEventListener('roomonic:chat-state-updated', sync);
    window.addEventListener('roomonic:roommate-confirmed', sync);
    window.addEventListener('focus', sync);
    timer = window.setInterval(sync, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
      inboxSocket?.close();
      window.removeEventListener('storage', sync);
      window.removeEventListener('roomonic:chat-state-updated', sync);
      window.removeEventListener('roomonic:roommate-confirmed', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const navItems = confirmed ? CONFIRMED_NAV_ITEMS : DEFAULT_NAV_ITEMS;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none h-[84px] w-full shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      />
      <div
        className={
          'fixed bottom-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 gap-1 border-t border-[#ECE8FA] bg-white px-1.5 pt-2 pb-3.5 shadow-[0_-10px_24px_rgba(28,22,63,0.08)]'
        }
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.href === '/rules/draft') {
                  router.push(getRoommatePactStatus() === 'completed' ? '/final' : '/rules/draft');
                  return;
                }
                router.push(item.href);
              }}
              className={`flex-1 rounded-[18px] px-1 py-2 text-center text-[10px] font-semibold transition ${
                active
                  ? 'bg-[#F1ECFF] text-[#5B3FD1] shadow-[0_10px_24px_rgba(91,63,209,0.12)]'
                  : active
                    ? 'bg-[#F1ECFF] text-[#5B3FD1] shadow-[0_10px_24px_rgba(91,63,209,0.12)]'
                    : 'text-inkFaint hover:bg-[#F7F4FF]'
              }`}
            >
              <span
                className={`relative mb-0.5 flex h-[24px] items-center justify-center transition ${
                  active ? 'nav-icon-active' : 'opacity-85'
                }`}
              >
                <NavIcon type={item.icon} active={active} />
                {item.href === '/chat' && chatNotifications > 0 ? (
                  <span className="absolute left-[55%] top-[-5px] inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#FF6B8A] px-1 text-[9px] font-bold leading-[16px] text-white">
                    {chatNotifications > 9 ? '9+' : chatNotifications}
                  </span>
                ) : null}
              </span>
              <span className={`inline-block transition duration-300 ${active ? 'translate-y-[1px]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <Modal
        open={showIncomingRequestModal}
        title={
          incomingAlertType === 'roommate_confirmation'
            ? '룸메이트 확정 요청이 도착했어요'
            : '새 채팅 요청이 도착했어요'
        }
        description={
          incomingAlertType === 'roommate_confirmation' && incomingRequestPreview
            ? `${incomingRequestPreview.peer_name}님이 먼저 룸메이트 확정을 눌렀어요. 괜찮다면 채팅방에서 나도 확정해 주세요.`
            : incomingRequestPreview
            ? `${incomingRequestPreview.peer_name}님이 대화를 요청했어요. 지금 바로 확인할 수 있어요.`
            : '새로운 채팅 요청이 도착했어요.'
        }
        primaryLabel={incomingAlertType === 'roommate_confirmation' ? '채팅방에서 확인하기' : '요청 보러 가기'}
        secondaryLabel="닫기"
        onPrimary={() => {
          if (incomingAlertType === 'roommate_confirmation' && incomingRequestPreview?.room_id) {
            const profile = getCurrentProfileContext();
            const query = new URLSearchParams({
              roomId: incomingRequestPreview.room_id,
              profileId: profile?.profile_id || '',
              peerName: incomingRequestPreview.peer_name || '상대방',
            });
            router.push(`/chat?${query.toString()}`);
          } else if (incomingRequestId) {
            const query = new URLSearchParams({ requestId: incomingRequestId });
            router.push(`/chat?${query.toString()}`);
          } else {
            router.push('/chat');
          }
          setShowIncomingRequestModal(false);
        }}
        onSecondary={() => setShowIncomingRequestModal(false)}
      />
      <style jsx>{`
        .nav-icon-active {
          animation: navFloat 2.2s ease-in-out infinite, navGlow 2.6s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(168, 140, 255, 0.55))
            drop-shadow(0 0 16px rgba(122, 97, 255, 0.35));
        }

        @keyframes navFloat {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.1);
          }
        }

        @keyframes navGlow {
          0%,
          100% {
            opacity: 0.92;
            filter: drop-shadow(0 0 4px rgba(168, 140, 255, 0.42))
              drop-shadow(0 0 12px rgba(122, 97, 255, 0.24));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(181, 157, 255, 0.7))
              drop-shadow(0 0 18px rgba(122, 97, 255, 0.42));
          }
        }
      `}</style>
    </>
  );
}
