// ============================================================================
// 더미 API 레이어
// ----------------------------------------------------------------------------
// 백엔드가 준비되면 이 파일 안의 함수 내부 로직만 실제 fetch('/api/...') 호출로
// 바꾸면 됩니다. 화면(컴포넌트) 코드는 이 함수들을 그대로 호출하고 있으므로
// 수정할 필요가 없습니다.
//
// 예시)
//   export async function login({ id, password }) {
//     const res = await fetch('/api/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ id, password }),
//     });
//     if (!res.ok) throw new Error('로그인에 실패했어요');
//     return res.json();
//   }
// ============================================================================

import { CANDIDATES, INTERVIEW_RESULT, CHAT_MESSAGES, RULES_DRAFT, RULES_REVIEW } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://15.134.137.117/api';
const LOCAL_CHAT_INBOX_KEY = 'roomonic-chat-inbox';
const PRACTICE_MODE_KEY = 'roomonic-practice-mode';
const DAILY_PICK_LOCK_KEY = 'roomonic-daily-pick-lock';
const DRAW_RESULT_KEY = 'roomonic-draw-result';
const ROOMMATE_SELECTION_KEY = 'roomonic-roommate-selection';
const ROOMMATE_PACT_KEY = 'roomonic-roommate-pact';
const CHAT_READ_STATE_KEY = 'roomonic-chat-read-state';
let roommateStateSyncPromise = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function isLocalDevelopmentHost() {
  if (!isBrowser()) return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function isPracticeMode() {
  if (!isBrowser()) return false;
  const enabled = window.localStorage.getItem(PRACTICE_MODE_KEY) === 'true';
  if (!enabled) return false;
  if (isLocalDevelopmentHost()) return true;
  window.localStorage.removeItem(PRACTICE_MODE_KEY);
  return false;
}

function ensurePracticeData() {
  if (!isBrowser()) return null;
  if (!isPracticeMode()) return null;
  const current = getStoredProfileContext();
  if (current?.profile_id) return current;
  return seedPracticeData();
}

function getStoredProfileContext() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem('roomonic-profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredAuthContext() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem('roomonic-auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isPracticeProfileId(profileId) {
  return typeof profileId === 'string' && profileId.startsWith('practice-profile-');
}

function sanitizePersistedContexts() {
  if (!isBrowser() || isLocalDevelopmentHost()) return;

  const auth = getStoredAuthContext();
  const profile = getStoredProfileContext();
  const authProfileId = auth?.user?.profile_id || null;
  const profileId = profile?.profile_id || null;

  if (isPracticeProfileId(authProfileId)) {
    clearPracticeData();
    clearAuthContext();
  }

  if (isPracticeProfileId(profileId)) {
    clearPracticeData();
    clearProfileContext();
  }
}

function isProfileNotFoundError(error) {
  const detail = String(error?.detail || error?.message || '').toLowerCase();
  return detail === 'profile_not_found' || detail.includes('profile not found');
}

function resetInvalidProfileState() {
  clearPracticeData();
  clearAuthContext();
  clearProfileContext();
  if (!isBrowser()) return;
  window.localStorage.removeItem('roomonic-interview-draft');
  window.dispatchEvent(new Event('roomonic:logout'));
  window.dispatchEvent(new Event('roomonic:profile-invalidated'));
}

function getNormalizedProfileContext() {
  sanitizePersistedContexts();
  const auth = getStoredAuthContext();
  const linkedProfileId = auth?.user?.profile_id || null;
  const profile = getStoredProfileContext();

  if (!profile?.profile_id) {
    return linkedProfileId
      ? {
          profile_id: linkedProfileId,
          nickname: auth?.user?.nickname || '',
        }
      : null;
  }

  if (isPracticeMode()) {
    return profile;
  }

  if (isPracticeProfileId(profile.profile_id)) {
    if (!linkedProfileId) {
      clearPracticeData();
    }
    clearProfileContext();
    return linkedProfileId
      ? {
          profile_id: linkedProfileId,
          nickname: auth?.user?.nickname || profile.nickname || '',
        }
      : null;
  }

  if (linkedProfileId && linkedProfileId !== profile.profile_id) {
    const next = {
      profile_id: linkedProfileId,
      nickname: auth?.user?.nickname || profile.nickname || '',
    };
    saveProfileContext(next);
    return next;
  }

  return profile;
}

function saveProfileContext(context) {
  if (!isBrowser()) return;
  window.localStorage.setItem('roomonic-profile', JSON.stringify(context));
}

function saveAuthContext(context) {
  if (!isBrowser()) return;
  window.localStorage.setItem('roomonic-auth', JSON.stringify(context));
}

function clearProfileContext() {
  if (!isBrowser()) return;
  window.localStorage.removeItem('roomonic-profile');
}

function clearAuthContext() {
  if (!isBrowser()) return;
  window.localStorage.removeItem('roomonic-auth');
}

function saveLastChatContext(context) {
  if (!isBrowser()) return;
  window.localStorage.setItem('roomonic-last-chat', JSON.stringify(context));
}

function getLastChatContext() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem('roomonic-last-chat');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readRoommateSelection() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(ROOMMATE_SELECTION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRoommateSelection(selection) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ROOMMATE_SELECTION_KEY, JSON.stringify(selection));
  window.dispatchEvent(new Event('roomonic:roommate-confirmed'));
}

function readRoommatePact() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(ROOMMATE_PACT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRoommatePact(pact) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ROOMMATE_PACT_KEY, JSON.stringify(pact));
}

function clearPersistedRoommateState() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ROOMMATE_SELECTION_KEY);
  window.localStorage.removeItem(ROOMMATE_PACT_KEY);
  window.dispatchEvent(new Event('roomonic:roommate-confirmed'));
}

function normalizePactShape(pact) {
  if (!pact) return null;
  const aiRules = Array.isArray(pact.ai_rules)
    ? pact.ai_rules
    : (pact.rules || []).map((rule, index) => ({
        rule_id: `ai-rule-${index + 1}`,
        source: pact.source || 'fallback',
        title: pact.conflict_topics?.[index]?.label || `생활 약속 ${index + 1}`,
        scenario: pact.conflict_topics?.[index]?.reason || '함께 살 때 미리 맞춰두면 좋은 주제예요.',
        rule,
        reason: pact.conflict_topics?.[index]?.reason || '두 사람의 생활 차이를 바탕으로 만든 약속이에요.',
        topic_code: pact.conflict_topics?.[index]?.code || `topic-${index + 1}`,
        severity: pact.conflict_topics?.[index]?.severity || 50,
      }));

  return {
    ...pact,
    ai_rules: aiRules,
    rules: aiRules.map((item) => item.rule),
    custom_rules: Array.isArray(pact.custom_rules) ? pact.custom_rules : [],
    signatures: pact.signatures || {},
    retrieved_context: Array.isArray(pact.retrieved_context) ? pact.retrieved_context : [],
    signature_status: pact.signature_status || 'pending',
  };
}

function readLocalChatInbox() {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(LOCAL_CHAT_INBOX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalChatInbox(items) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCAL_CHAT_INBOX_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('roomonic:chat-state-updated'));
}

function readChatReadState() {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(CHAT_READ_STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeChatReadState(state) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CHAT_READ_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('roomonic:chat-state-updated'));
}

function getChatRoomReadAt(roomId) {
  if (!roomId) return null;
  return readChatReadState()?.[roomId] || null;
}

function setChatRoomReadAt(roomId, readAt = new Date().toISOString()) {
  if (!roomId) return;
  writeChatReadState({
    ...readChatReadState(),
    [roomId]: readAt,
  });
}

function countUnreadMessages(messages, profileId, readAt) {
  if (!Array.isArray(messages) || !profileId) return 0;
  const readTime = readAt ? new Date(readAt).getTime() : 0;
  return messages.filter((message) => {
    if (!message?.sent_at) return false;
    if (message.sender_profile_id === profileId) return false;
    return new Date(message.sent_at).getTime() > readTime;
  }).length;
}

function sortInbox(items) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.requested_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.requested_at || 0).getTime();
    return bTime - aTime;
  });
}

function syncLocalChatInbox() {
  const items = readLocalChatInbox();
  const now = Date.now();
  let changed = false;

  const next = items.map((item) => {
    if (item.status === 'pending' && item.auto_accept_at && now >= new Date(item.auto_accept_at).getTime()) {
      changed = true;
      const acceptedAt = new Date().toISOString();
      return {
        ...item,
        status: 'accepted',
        accepted_at: acceptedAt,
        updated_at: acceptedAt,
        room_id: item.room_id || `local-room-${item.conversation_id}`,
        last_message_preview: '안녕하세요. 이제 대화를 시작할 수 있어요!',
        messages: item.messages?.length
          ? item.messages
          : [
              {
                message_id: `msg-${item.conversation_id}-welcome`,
                room_id: item.room_id || `local-room-${item.conversation_id}`,
                sender_profile_id: item.peer_profile_id,
                sender_nickname: item.peer_name,
                text: '안녕하세요. 이제 대화를 시작할 수 있어요!',
                sent_at: acceptedAt,
              },
            ],
      };
    }
    return item;
  });

  const sorted = sortInbox(next);
  if (changed) writeLocalChatInbox(sorted);
  return sorted;
}

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getWebSocketUrl(path) {
  const normalized = API_BASE_URL.replace(/^http/, 'ws');
  return `${normalized}${path}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(getApiUrl(path), options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.detail || '';
    let message = detail || '요청에 실패했어요';
    if (detail === 'profile_already_roommate_confirmed') {
      message = '이미 다른 룸메이트와 확정된 사용자라서 더 이상 새로운 연결을 만들 수 없어요.';
    } else if (detail === 'roommate_confirmation_requires_profile_interview') {
      message = '룸메이트 확정 전에 두 사람 모두 생활 인터뷰를 완료해야 해요.';
    } else if (detail === 'chat_question_requires_profile_interview') {
      message = '추천 질문은 두 사람의 생활 인터뷰가 저장된 뒤에 보여드릴 수 있어요.';
    }
    const error = new Error(message);
    error.status = response.status;
    error.detail = detail;
    if (isProfileNotFoundError(error) && path.includes('/profiles/')) {
      resetInvalidProfileState();
    }
    throw error;
  }
  return body;
}

function characterVisual(typeCode) {
  if (typeCode === 'PEE') return { imagePath: '/images/characters/Pee.png', bg: 'bg-mintSoft' };
  if (typeCode === 'DUDI') return { imagePath: '/images/characters/Dudi.png', bg: 'bg-peachSoft' };
  if (typeCode === 'MOMO') return { imagePath: '/images/characters/momo.png', bg: 'bg-pinkSoft' };
  if (typeCode === 'ROO') return { imagePath: '/images/characters/Roo.png', bg: 'bg-lavenderSoft' };
  return { imagePath: '/images/characters/UNI.png', bg: 'bg-lavenderSoft' };
}

function mapReasonTag(text = '') {
  if (text.includes('수면') || text.includes('기상') || text.includes('취침')) return '수면';
  if (text.includes('청소') || text.includes('설거지') || text.includes('정리')) return '청결';
  if (text.includes('온도')) return '공간';
  if (text.includes('방문') || text.includes('손님')) return '생활습관';
  if (text.includes('개인 공간')) return '공간';
  if (text.includes('보안') || text.includes('잠금') || text.includes('문')) return '보안';
  return '생활리듬';
}

function mapRecommendationToCandidate(item) {
  const visual = characterVisual(item.type_code);
  return {
    id: item.profile_id,
    profile_id: item.profile_id,
    name: item.nickname,
    score: item.score,
    region: item.region,
    moveIn: item.move_in_period,
    imagePath: visual.imagePath,
    bg: visual.bg,
    goodPoints: (item.reasons || []).map((text) => ({ text, tag: mapReasonTag(text) })),
    cautionPoints: (item.conflict_summary || []).map((text) => ({ text, tag: '조율' })),
    hardcuts: [],
    gender: item.gender,
    stayDurationMonths: item.stay_duration_months,
    typeCode: item.type_code,
    typeName: item.type_name,
  };
}

export function getCurrentProfileContext() {
  sanitizePersistedContexts();
  return getNormalizedProfileContext();
}

export function getCurrentAuthContext() {
  sanitizePersistedContexts();
  return getStoredAuthContext();
}

export function seedPracticeData() {
  if (!isBrowser()) return null;

  const now = new Date();
  const acceptedAt = new Date(now.getTime() - 1000 * 60 * 12).toISOString();
  const pendingAt = new Date(now.getTime() - 1000 * 60 * 2).toISOString();
  const autoAcceptAt = new Date(now.getTime() + 1000 * 60 * 8).toISOString();

  window.localStorage.setItem(PRACTICE_MODE_KEY, 'true');
  saveAuthContext({
    access_token: 'practice-access-token',
    token_type: 'Bearer',
    expires_in: 86400,
    user: {
      user_id: 'practice-user-jisu',
      nickname: '지수',
      profile_id: 'practice-profile-jisu',
    },
  });
  saveProfileContext({
    profile_id: 'practice-profile-jisu',
    nickname: '지수',
  });
  window.localStorage.removeItem(DAILY_PICK_LOCK_KEY);
  window.localStorage.removeItem(DRAW_RESULT_KEY);
  window.localStorage.removeItem('roomonic-last-chat');
  window.localStorage.removeItem(ROOMMATE_SELECTION_KEY);
  window.localStorage.removeItem(ROOMMATE_PACT_KEY);

  const acceptedCandidate = CANDIDATES[0];
  const pendingCandidate = CANDIDATES[1];
  const inbox = [
    {
      conversation_id: 'practice-conv-accepted',
      room_id: 'local-room-practice-accepted',
      candidate_id: acceptedCandidate.id,
      peer_profile_id: acceptedCandidate.id,
      peer_name: acceptedCandidate.name,
      peer_region: acceptedCandidate.region,
      peer_move_in: acceptedCandidate.moveIn,
      peer_image_path: acceptedCandidate.imagePath || '/images/characters/UNI.png',
      compatibility_score: acceptedCandidate.score,
      status: 'accepted',
      requested_at: acceptedAt,
      accepted_at: acceptedAt,
      updated_at: acceptedAt,
      requester_profile_id: 'practice-profile-jisu',
      requester_nickname: '지수',
      messages: [
        {
          message_id: 'practice-msg-1',
          room_id: 'local-room-practice-accepted',
          sender_profile_id: acceptedCandidate.id,
          sender_nickname: acceptedCandidate.name,
          text: '안녕하세요! 연습용 채팅방이에요.',
          sent_at: acceptedAt,
        },
        {
          message_id: 'practice-msg-2',
          room_id: 'local-room-practice-accepted',
          sender_profile_id: 'practice-profile-jisu',
          sender_nickname: '지수',
          text: '좋아요. 여기서 대화 흐름을 확인해볼게요.',
          sent_at: new Date(new Date(acceptedAt).getTime() + 1000 * 45).toISOString(),
        },
      ],
      last_message_preview: '좋아요. 여기서 대화 흐름을 확인해볼게요.',
    },
    {
      conversation_id: 'practice-conv-pending',
      room_id: '',
      candidate_id: pendingCandidate.id,
      peer_profile_id: pendingCandidate.id,
      peer_name: pendingCandidate.name,
      peer_region: pendingCandidate.region,
      peer_move_in: pendingCandidate.moveIn,
      peer_image_path: pendingCandidate.imagePath || '/images/characters/UNI.png',
      compatibility_score: pendingCandidate.score,
      status: 'pending',
      requested_at: pendingAt,
      updated_at: pendingAt,
      auto_accept_at: autoAcceptAt,
      requester_profile_id: 'practice-profile-jisu',
      requester_nickname: '지수',
      messages: [],
      last_message_preview: '매칭 요청을 보냈어요.',
    },
  ];

  writeLocalChatInbox(sortInbox(inbox));
  return {
    profile_id: 'practice-profile-jisu',
    nickname: '지수',
  };
}

export function clearPracticeData() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PRACTICE_MODE_KEY);
  window.localStorage.removeItem(LOCAL_CHAT_INBOX_KEY);
  window.localStorage.removeItem(DAILY_PICK_LOCK_KEY);
  window.localStorage.removeItem(DRAW_RESULT_KEY);
  window.localStorage.removeItem('roomonic-last-chat');
  clearPersistedRoommateState();
  window.localStorage.removeItem(CHAT_READ_STATE_KEY);
}

export function logoutCurrentUser() {
  if (!isBrowser()) return;
  clearPracticeData();
  clearAuthContext();
  clearProfileContext();
  window.localStorage.removeItem('roomonic-interview-draft');
  window.localStorage.removeItem(CHAT_READ_STATE_KEY);
  window.dispatchEvent(new Event('roomonic:logout'));
  window.dispatchEvent(new Event('roomonic:roommate-confirmed'));
}

export function resetInterviewDraft() {
  if (!isBrowser()) return;
  window.localStorage.removeItem('roomonic-interview-draft');
}

export function resetRecommendationFlow() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(DRAW_RESULT_KEY);
  window.localStorage.removeItem(DAILY_PICK_LOCK_KEY);
  window.localStorage.removeItem('roomonic-last-chat');
  clearPersistedRoommateState();
  window.localStorage.removeItem(CHAT_READ_STATE_KEY);
}

export function getDailyPickLock() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(DAILY_PICK_LOCK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed.locked_until &&
      new Date(parsed.locked_until).getTime() > Date.now()
    ) {
      return parsed;
    }
    window.localStorage.removeItem(DAILY_PICK_LOCK_KEY);
    return null;
  } catch {
    window.localStorage.removeItem(DAILY_PICK_LOCK_KEY);
    return null;
  }
}

export function getRoommateSelection() {
  return readRoommateSelection();
}

export async function syncPersistedRoommateState() {
  if (!isBrowser()) {
    return { selection: null, pact: null };
  }

  if (isPracticeMode()) {
    return {
      selection: readRoommateSelection(),
      pact: normalizePactShape(readRoommatePact()),
    };
  }

  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) {
    clearPersistedRoommateState();
    return { selection: null, pact: null };
  }

  if (roommateStateSyncPromise) return roommateStateSyncPromise;

  roommateStateSyncPromise = (async () => {
    try {
      const body = await apiRequest(`/profiles/${profile.profile_id}/match-requests`);
      const acceptedRooms = (body.match_requests || [])
        .filter((item) => item.status === 'accepted' && item.room_id)
        .sort((a, b) => {
          const aTime = new Date(a.updated_at || a.accepted_at || 0).getTime();
          const bTime = new Date(b.updated_at || b.accepted_at || 0).getTime();
          return bTime - aTime;
        });

      for (const item of acceptedRooms) {
        try {
          const roomBody = await apiRequest(`/chat-rooms/${item.room_id}/messages`);
          const room = roomBody.room || {};
          const confirmation = room.roommate_confirmation || {};
          const confirmedAt = confirmation.confirmed_at || room.roommate_confirmed_at || null;
          if (!confirmedAt) continue;

          const peer = (room.participants || []).find(
            (participant) => participant.profile_id !== profile.profile_id
          );
          const selection = {
            room_id: item.room_id,
            profile_id: profile.profile_id,
            peer_profile_id: peer?.profile_id || item.peer_profile_id || '',
            peer_name: peer?.nickname || item.peer_nickname || '상대방',
            confirmed_at: confirmedAt,
          };
          writeRoommateSelection(selection);

          let pact = null;
          try {
            const pactBody = await apiRequest(
              `/chat-rooms/${item.room_id}/pact?profile_id=${encodeURIComponent(profile.profile_id)}`
            );
            pact = normalizePactShape(pactBody.pact);
          } catch (error) {
            if (error?.detail !== 'roommate_pact_not_found') throw error;
          }

          if (pact) {
            writeRoommatePact(pact);
          } else if (readRoommatePact()) {
            window.localStorage.removeItem(ROOMMATE_PACT_KEY);
          }

          return { selection, pact };
        } catch (error) {
          if (error?.detail === 'chat_room_not_found') continue;
          throw error;
        }
      }

      clearPersistedRoommateState();
      return { selection: null, pact: null };
    } catch (error) {
      if (isProfileNotFoundError(error)) {
        resetInvalidProfileState();
        clearPersistedRoommateState();
        return { selection: null, pact: null };
      }
      throw error;
    } finally {
      roommateStateSyncPromise = null;
    }
  })();

  return roommateStateSyncPromise;
}

export function hasConfirmedRoommate() {
  return Boolean(readRoommateSelection()?.confirmed_at);
}

export function getRoommatePactStatus() {
  const pact = normalizePactShape(readRoommatePact());
  return pact?.signature_status || 'pending';
}

export function confirmRoommateSelection({
  roomId,
  profileId,
  peerProfileId,
  peerName,
  pact,
}) {
  if (!isBrowser()) return null;
  const confirmedAt = new Date().toISOString();
  const payload = {
    room_id: roomId,
    profile_id: profileId,
    peer_profile_id: peerProfileId,
    peer_name: peerName,
    confirmed_at: confirmedAt,
  };
  writeRoommateSelection(payload);
  if (pact) writeRoommatePact(pact);
  window.dispatchEvent(new Event('roomonic:roommate-confirmed'));
  return payload;
}

export function getLastChatRoute() {
  const chat = getLastChatContext();
  if (!chat?.room_id || !chat?.profile_id || !chat?.nickname) return '/chat';

  const query = new URLSearchParams({
    roomId: chat.room_id,
    profileId: chat.profile_id,
    nickname: chat.nickname,
    peerName: chat.peer_name || '상대방',
  });
  return `/chat?${query.toString()}`;
}

function mapMatchRequestToInboxItem(item, myProfileId) {
  const iAmTarget = item.target_profile_id === myProfileId;
  const accepted = item.status === 'accepted';
  const rejected = item.status === 'rejected';
  const roomId = item.room_id || '';
  const unreadCount = Number(item.unread_count || 0);
  const visual = characterVisual(item.peer_type_code);
  return {
    conversation_id: item.request_id,
    request_id: item.request_id,
    room_id: roomId,
    candidate_id: item.peer_profile_id,
    peer_profile_id: item.peer_profile_id,
    peer_name: item.peer_nickname || '상대방',
    peer_region: item.peer_region || '',
    peer_type_code: item.peer_type_code || null,
    peer_type_name: item.peer_type_name || '',
    peer_image_path: visual.imagePath,
    roommate_confirmation: item.roommate_confirmation || null,
    status: accepted ? 'accepted' : rejected ? 'rejected' : 'pending',
    needs_my_action: iAmTarget && !accepted && !rejected,
    unread_count: unreadCount,
    requester_profile_id: item.requester_profile_id,
    requester_nickname: item.requester_profile_id === myProfileId ? '나' : item.peer_nickname || '상대방',
    requested_at: item.created_at,
    updated_at: item.updated_at,
    last_message_preview: accepted
      ? item.last_message_preview || '이제 대화를 시작할 수 있어요.'
      : rejected
        ? iAmTarget
          ? '보낸 요청을 넘겼어요.'
          : '상대가 이번 요청은 넘겼어요.'
        : iAmTarget
          ? '요청을 수락하면 대화할 수 있어요.'
          : '상대가 요청을 확인하고 있어요.',
  };
}

export async function requestChatMatch(candidate) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('먼저 프로필을 저장해주세요');

  if (candidate.profile_id && !isPracticeMode()) {
    const body = await apiRequest(`/profiles/${profile.profile_id}/match-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_profile_id: candidate.profile_id }),
    });
    let roomId = null;
    try {
      const room = await createChatRoom(candidate.profile_id);
      roomId = room?.room_id || null;
    } catch {
      roomId = null;
    }
    return mapMatchRequestToInboxItem(
      {
        ...body.match_request,
        peer_profile_id: candidate.profile_id,
        peer_nickname: candidate.name,
        peer_region: candidate.region,
        peer_type_code: candidate.typeCode,
        peer_type_name: candidate.typeName,
        room_id: roomId,
      },
      profile.profile_id
    );
  }

  await delay(300);
  const items = syncLocalChatInbox();
  const existing = items.find((item) => item.candidate_id === (candidate.profile_id || candidate.id));
  if (existing) return existing;

  const now = new Date();
  const requestedAt = now.toISOString();
  const autoAcceptAt = new Date(now.getTime() + 2500).toISOString();
  const conversation = {
    conversation_id: `conv-${Math.random().toString(36).slice(2, 10)}`,
    room_id: '',
    candidate_id: candidate.profile_id || candidate.id,
    peer_profile_id: candidate.profile_id || candidate.id,
    peer_name: candidate.name,
    peer_region: candidate.region,
    peer_move_in: candidate.moveIn,
    peer_image_path: candidate.imagePath || '/images/characters/UNI.png',
    compatibility_score: candidate.score,
    status: 'pending',
    requested_at: requestedAt,
    updated_at: requestedAt,
    auto_accept_at: autoAcceptAt,
    requester_profile_id: profile.profile_id,
    requester_nickname: profile.nickname || '나',
    messages: [],
    last_message_preview: '매칭 요청을 보냈어요.',
  };
  const next = sortInbox([conversation, ...items]);
  writeLocalChatInbox(next);
  return conversation;
}

export async function getChatInbox() {
  if (isPracticeMode()) {
    await delay(150);
    ensurePracticeData();
    const profile = getNormalizedProfileContext();
    return syncLocalChatInbox().map((item) => ({
      ...item,
      unread_count:
        item.status === 'accepted'
          ? countUnreadMessages(
              item.messages || [],
              profile?.profile_id,
              getChatRoomReadAt(item.room_id)
            )
          : 0,
    }));
  }

  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) return [];

  try {
    const body = await apiRequest(`/profiles/${profile.profile_id}/match-requests`);
    const items = (body.match_requests || []).map((item) =>
      mapMatchRequestToInboxItem(item, profile.profile_id)
    );
    return sortInbox(items);
  } catch (error) {
    if (isProfileNotFoundError(error)) {
      resetInvalidProfileState();
      return [];
    }
    throw error;
  }
}

export async function getChatNotificationCount() {
  const inbox = await getChatInbox();
  const profile = getNormalizedProfileContext();
  return inbox.reduce((total, item) => {
    const pendingCount = item.needs_my_action && item.status === 'pending' ? 1 : 0;
    const confirmation = item.roommate_confirmation || {};
    const roommateConfirmCount =
      item.status === 'accepted' &&
      confirmation.status === 'pending' &&
      confirmation.pending_for_profile_id === profile?.profile_id
        ? 1
        : 0;
    return total + pendingCount + roommateConfirmCount + (item.unread_count || 0);
  }, 0);
}

export function markChatRoomAsRead(roomId) {
  if (isPracticeMode()) {
    setChatRoomReadAt(roomId);
    return Promise.resolve({
      status: 'read',
      room_id: roomId,
      unread_count: 0,
    });
  }

  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  return apiRequest(`/chat-rooms/${roomId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profile.profile_id }),
  });
}

export async function acceptMatchRequest(requestId, peerProfileId) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  await apiRequest(`/match-requests/${requestId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profile.profile_id }),
  });

  return createChatRoom(peerProfileId);
}

export async function rejectMatchRequest(requestId) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  if (isPracticeMode()) {
    await delay(150);
    const items = syncLocalChatInbox();
    const index = items.findIndex(
      (entry) => entry.request_id === requestId || entry.conversation_id === requestId
    );
    if (index < 0) throw new Error('match_request_not_found');

    const rejectedAt = new Date().toISOString();
    const next = [...items];
    next[index] = {
      ...items[index],
      status: 'rejected',
      rejected_at: rejectedAt,
      updated_at: rejectedAt,
      auto_accept_at: null,
      last_message_preview: '메시지 요청을 정중히 넘겼어요.',
    };
    writeLocalChatInbox(sortInbox(next));
    return next[index];
  }

  const body = await apiRequest(`/match-requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profile.profile_id }),
  });

  return body.match_request;
}

export async function getLocalChatRoom(roomId) {
  await delay(120);
  if (isPracticeMode()) ensurePracticeData();
  const item = syncLocalChatInbox().find((entry) => entry.room_id === roomId);
  if (!item || item.status !== 'accepted') {
    throw new Error('chat_room_not_found');
  }

  return {
    status: 'ok',
    room: {
      room_id: item.room_id,
      participant_a_profile_id: item.requester_profile_id,
      participant_b_profile_id: item.peer_profile_id,
      participants: [
        {
          profile_id: item.requester_profile_id,
          nickname: item.requester_nickname,
          gender: '',
          region: '',
          character: {
            type_code: null,
            type_name: null,
          },
        },
        {
          profile_id: item.peer_profile_id,
          nickname: item.peer_name,
          gender: '',
          region: item.peer_region,
          character: {
            type_code: item.peer_type_code || null,
            type_name: item.peer_type_name || null,
          },
        },
      ],
      created_at: item.accepted_at || item.requested_at,
      updated_at: item.updated_at,
      roommate_confirmation: item.roommate_confirmation || {
        status: 'idle',
        requested_by_profile_id: null,
        pending_for_profile_id: null,
        participant_a_confirmed_at: null,
        participant_b_confirmed_at: null,
        confirmed_profile_ids: [],
        confirmed_at: null,
      },
    },
    messages: item.messages || [],
  };
}

export async function sendLocalChatMessage(roomId, text) {
  await delay(100);
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  const items = syncLocalChatInbox();
  const index = items.findIndex((entry) => entry.room_id === roomId);
  if (index < 0) throw new Error('chat_room_not_found');

  const trimmed = text.trim();
  if (!trimmed) throw new Error('message_text_required');

  const sentAt = new Date().toISOString();
  const userMessage = {
    message_id: `msg-${Math.random().toString(36).slice(2, 12)}`,
    room_id: roomId,
    sender_profile_id: profile.profile_id,
    sender_nickname: profile.nickname || '나',
    text: trimmed,
    sent_at: sentAt,
  };

  const replies = [
    '좋아요! 그 방향으로 이야기해봐도 좋겠네요.',
    '저도 그 부분이 궁금했어요.',
    '생활 패턴 맞춰보면 괜찮을 것 같아요.',
  ];
  const peerReply = {
    message_id: `msg-${Math.random().toString(36).slice(2, 12)}`,
    room_id: roomId,
    sender_profile_id: items[index].peer_profile_id,
    sender_nickname: items[index].peer_name,
    text: replies[(items[index].messages?.length || 0) % replies.length],
    sent_at: new Date(Date.now() + 800).toISOString(),
  };

  const updated = {
    ...items[index],
    updated_at: peerReply.sent_at,
    last_message_preview: peerReply.text,
    messages: [...(items[index].messages || []), userMessage, peerReply],
  };
  const next = [...items];
  next[index] = updated;
  writeLocalChatInbox(sortInbox(next));
  return { ok: true, messages: [userMessage, peerReply] };
}

export function getKakaoLoginUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_KAKAO_AUTH_URL;
  if (explicitUrl) return explicitUrl;

  const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!restApiKey || !redirectUri) return '';

  const query = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  return `https://kauth.kakao.com/oauth/authorize?${query.toString()}`;
}

export async function signup({ id, password }) {
  await delay(400);
  if (!id || !password) throw new Error('아이디와 비밀번호를 입력해주세요');
  return { ok: true, user: { id } };
}

export async function login({ id, password }) {
  await delay(400);
  if (!id || !password) throw new Error('아이디와 비밀번호를 입력해주세요');
  return { ok: true, token: 'mock-token', user: { id, nickname: '지수' } };
}

export async function saveProfile(profileData) {
  const auth = getStoredAuthContext();
  const headers = { 'Content-Type': 'application/json' };
  if (auth?.access_token) {
    headers.Authorization = `Bearer ${auth.access_token}`;
  }
  const body = await apiRequest('/profiles', {
    method: 'POST',
    headers,
    body: JSON.stringify(profileData),
  });
  clearPracticeData();
  saveProfileContext({
    profile_id: body.profile.profile_id,
    nickname: body.profile.nickname,
  });
  return { ok: true, profile: body.profile };
}

export async function getProfile(profileId) {
  return apiRequest(`/profiles/${profileId}`);
}

export async function updateProfile(profileId, profileData) {
  const body = await apiRequest(`/profiles/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  saveProfileContext({
    profile_id: body.profile.profile_id,
    nickname: body.profile.nickname,
  });
  return { ok: true, profile: body.profile };
}

export async function submitInterviewAnswers(answers) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('먼저 프로필을 생성해주세요');

  const normalizedAnswers = {
    ...answers,
    smoking_type: answers.smokes ? answers.smoking_type?.trim() || null : null,
    smoking_place: answers.smokes ? answers.smoking_place || null : null,
    pet_preference: answers.pet_ok ? answers.pet_preference || null : null,
    hardcut_conditions: Array.isArray(answers.hardcut_conditions)
      ? answers.hardcut_conditions.filter(Boolean).slice(0, 3)
      : [],
  };

  try {
    const body = await apiRequest(`/profiles/${profile.profile_id}/interview`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedAnswers),
    });
    return { ok: true, ...body };
  } catch (error) {
    if (isProfileNotFoundError(error)) {
      resetInvalidProfileState();
      throw new Error('프로필 정보를 다시 확인해주세요');
    }
    throw error;
  }
}

export async function getInterviewResult() {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id || isPracticeMode()) {
    await delay(600);
    return {
      ...INTERVIEW_RESULT,
      visual: characterVisual('DUDI'),
      scores: {
        rule_score: 64.9,
        sharing_score: 52.6,
      },
    };
  }

  let body;
  try {
    body = await apiRequest(`/profiles/${profile.profile_id}/interview`);
  } catch (error) {
    if (isProfileNotFoundError(error)) {
      resetInvalidProfileState();
      throw new Error('프로필 정보를 다시 확인해주세요');
    }
    throw error;
  }
  if (!body?.has_interview || !body?.character) {
    return {
      ...INTERVIEW_RESULT,
      visual: characterVisual('DUDI'),
      scores: {
        rule_score: 64.9,
        sharing_score: 52.6,
      },
    };
  }
  const character = body.character;
  return {
    badge: character.type_code,
    title: character.type_name,
    desc: character.top_factors?.join(' · ') || INTERVIEW_RESULT.desc,
    tags: character.top_factors || INTERVIEW_RESULT.tags,
    visual: characterVisual(character.type_code),
    scores: {
      rule_score: character.rule_score || 0,
      sharing_score: character.sharing_score || 0,
    },
  };
}

export async function getHomeOverview() {
  await syncPersistedRoommateState();
  const profile = getNormalizedProfileContext();

  if (!profile?.profile_id || isPracticeMode()) {
    await delay(300);
    return {
      hasProfile: Boolean(profile?.profile_id),
      hasInterview: true,
      profile: {
        profile_id: profile?.profile_id || 'practice-profile-jisu',
        nickname: profile?.nickname || '지수',
        age: 22,
        gender: 'female',
        region: '광주광역시',
        move_in_period: '2026-09',
        stay_duration_months: 6,
      },
      character: {
        type_code: 'DUDI',
        type_name: '함께정돈형',
        rule_score: 64.9,
        sharing_score: 52.6,
        top_factors: [
          '생필품이나 식재료를 함께 나누는 생활에 비교적 편안함을 느껴요',
          '늦은 시간에는 차분한 분위기를 선호해요',
          '조용하고 안정적인 생활 환경을 중요하게 생각해요',
        ],
      },
      visual: characterVisual('DUDI'),
      interview: {
        wake_up_time: '07:00',
        sleep_time: '23:30',
      },
      highlights: [
        { label: '수면 리듬', value: '규칙적인 편' },
        { label: '공용 공간', value: '함께 정리 선호' },
        { label: '조율 방식', value: '기준을 정하고 지키는 편' },
      ],
    };
  }

  let profileBody;
  let interviewBody;
  try {
    [profileBody, interviewBody] = await Promise.all([
      apiRequest(`/profiles/${profile.profile_id}`),
      apiRequest(`/profiles/${profile.profile_id}/interview`),
    ]);
  } catch (error) {
    if (isProfileNotFoundError(error)) {
      resetInvalidProfileState();
      return {
        hasProfile: false,
        hasInterview: false,
        profile: null,
        character: null,
        visual: characterVisual(),
        highlights: [],
      };
    }
    throw error;
  }

  if (!interviewBody?.has_interview || !interviewBody?.character) {
    return {
      hasProfile: true,
      hasInterview: false,
      profile: profileBody.profile,
      character: null,
      visual: characterVisual(),
      highlights: [],
    };
  }

  const character = interviewBody.character;
  const visual = characterVisual(character.type_code);
  const interview = interviewBody.interview || {};
  const highlights = [
    { label: '희망 지역', value: profileBody.profile.region || '미설정' },
    { label: '입주 시기', value: profileBody.profile.move_in_period || '미설정' },
    {
      label: '생활 리듬',
      value: `${interview.wake_up_time || '--:--'} 기상 · ${interview.sleep_time || '--:--'} 취침`,
    },
  ];

  return {
    hasProfile: true,
    hasInterview: true,
    profile: profileBody.profile,
    interview,
    character,
    visual,
    highlights,
  };
}

export async function getCandidates() {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id || isPracticeMode()) {
    await delay(500);
    return CANDIDATES;
  }

  try {
    const body = await apiRequest(`/profiles/${profile.profile_id}/recommendations`);
    return (body.recommendations || []).map(mapRecommendationToCandidate);
  } catch (error) {
    if (isProfileNotFoundError(error)) {
      resetInvalidProfileState();
      return [];
    }
    throw error;
  }
}

export async function getCandidateDetail(id) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id || isPracticeMode()) {
    await delay(400);
    const candidate = CANDIDATES.find((c) => c.id === String(id));
    if (!candidate) throw new Error('후보를 찾을 수 없어요');
    return candidate;
  }

  const candidates = await getCandidates();
  const candidate = candidates.find((item) => item.profile_id === String(id) || item.id === String(id));
  if (!candidate) throw new Error('후보를 찾을 수 없어요');
  return candidate;
}

export async function sendMatchRequest(candidateId) {
  await delay(500);
  return { ok: true, status: 'pending', candidateId };
}

export async function exchangeKakaoCode(code) {
  const body = await apiRequest('/auth/kakao/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  saveAuthContext({
    access_token: body.access_token,
    token_type: body.token_type,
    expires_in: body.expires_in,
    user: body.user,
  });
  clearPracticeData();

  if (body.user?.profile_id) {
    saveProfileContext({
      profile_id: body.user.profile_id,
      nickname: body.user.nickname,
    });
  } else {
    clearProfileContext();
  }

  await syncPersistedRoommateState();

  return body;
}

export async function registerAsCandidate() {
  await delay(400);
  return { ok: true };
}

export async function getChatMessages() {
  await delay(300);
  return CHAT_MESSAGES;
}

export async function sendChatMessage(text) {
  await delay(200);
  return { ok: true, message: { from: 'me', text } };
}

export async function createChatRoom(otherProfileId) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  const body = await apiRequest(`/profiles/${profile.profile_id}/chat-rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ other_profile_id: otherProfileId }),
  });
  const participant = (body.room?.participants || []).find(
    (item) => item.profile_id === String(otherProfileId)
  );
  saveLastChatContext({
    room_id: body.room.room_id,
    profile_id: profile.profile_id,
    nickname: profile.nickname || '나',
    peer_name: participant?.nickname || '상대방',
  });
  return body.room;
}

export async function getChatRoomMessages(roomId) {
  if (String(roomId).startsWith('local-room-')) {
    return getLocalChatRoom(roomId);
  }
  const body = await apiRequest(`/chat-rooms/${roomId}/messages`);
  return body;
}

export async function getChatQuestionSuggestions(roomId) {
  const profile = getNormalizedProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  if (String(roomId).startsWith('local-room-')) {
    await delay(200);
    const inbox = syncLocalChatInbox();
    const current = inbox.find((item) => item.room_id === roomId);
    const peerName = current?.peer_name || '상대방';
    return {
      room_id: roomId,
      source: 'fallback',
      generated_at: new Date().toISOString(),
      questions: [
        `${peerName}님은 같이 살 때 가장 중요하게 생각하는 생활 기준이 무엇인지 먼저 물어보세요.`,
        '평일 기준으로 보통 몇 시쯤 자고 일어나는 편인지 가볍게 물어보세요.',
        '처음 같이 살게 되면 미리 맞춰두고 싶은 약속이 있는지 편하게 물어보세요.',
      ],
    };
  }

  const body = await apiRequest(
    `/chat-rooms/${roomId}/question-suggestions?profile_id=${encodeURIComponent(profile.profile_id)}`
  );
  return body;
}

export async function confirmRoommateFromChat({
  roomId,
  profileId,
  peerProfileId,
  peerName,
}) {
  await delay(250);
  if (String(roomId).startsWith('local-room-')) {
    const items = syncLocalChatInbox();
    const index = items.findIndex((entry) => entry.room_id === roomId);
    if (index < 0) throw new Error('chat_room_not_found');

    const item = items[index];
    const now = new Date().toISOString();
    const participantAProfileId = item.requester_profile_id;
    const participantBProfileId = item.peer_profile_id;
    const nextConfirmation = {
      status: 'pending',
      requested_by_profile_id: profileId,
      pending_for_profile_id: null,
      participant_a_confirmed_at:
        item.roommate_confirmation?.participant_a_confirmed_at || null,
      participant_b_confirmed_at:
        item.roommate_confirmation?.participant_b_confirmed_at || null,
      confirmed_profile_ids: [],
      confirmed_at: null,
    };

    if (profileId === participantAProfileId) {
      nextConfirmation.participant_a_confirmed_at =
        nextConfirmation.participant_a_confirmed_at || now;
    }
    if (profileId === participantBProfileId) {
      nextConfirmation.participant_b_confirmed_at =
        nextConfirmation.participant_b_confirmed_at || now;
    }

    nextConfirmation.confirmed_profile_ids = [
      ...(nextConfirmation.participant_a_confirmed_at ? [participantAProfileId] : []),
      ...(nextConfirmation.participant_b_confirmed_at ? [participantBProfileId] : []),
    ];

    const confirmed =
      Boolean(nextConfirmation.participant_a_confirmed_at) &&
      Boolean(nextConfirmation.participant_b_confirmed_at);
    nextConfirmation.status = confirmed ? 'confirmed' : 'pending';
    nextConfirmation.pending_for_profile_id = confirmed
      ? null
      : profileId === participantAProfileId
        ? participantBProfileId
        : participantAProfileId;
    nextConfirmation.confirmed_at = confirmed ? now : null;

    const updated = {
      ...item,
      updated_at: now,
      roommate_confirmation: nextConfirmation,
      roommate_confirmed_at: confirmed ? now : null,
    };
    const next = [...items];
    next[index] = updated;
    writeLocalChatInbox(sortInbox(next));

    if (!confirmed) {
      return {
        status: 'pending',
        room: {
          room_id: roomId,
          participant_a_profile_id: participantAProfileId,
          participant_b_profile_id: participantBProfileId,
          participants: [
            { profile_id: participantAProfileId, nickname: item.requester_nickname, gender: '', region: '' },
            { profile_id: participantBProfileId, nickname: item.peer_name, gender: '', region: item.peer_region },
          ],
          created_at: item.accepted_at || item.requested_at,
          updated_at: now,
          roommate_confirmation: nextConfirmation,
        },
      };
    }

    const pact = {
      room_id: roomId,
      participant_a_profile_id: participantAProfileId,
      participant_b_profile_id: participantBProfileId,
      participants: [
        { profile_id: participantAProfileId, nickname: item.requester_nickname, character: {} },
        { profile_id: participantBProfileId, nickname: item.peer_name, character: {} },
      ],
      rules: [
        '밤 늦은 시간에는 통화나 영상 시청 시 이어폰을 사용해요.',
        '공용 공간 정리와 설거지는 당일 안에 함께 마무리해요.',
        '지인을 초대해야 할 때는 최소 하루 전에 서로 알려줘요.',
      ],
      ai_rules: [
        {
          rule_id: 'ai-rule-1',
          source: 'fallback',
          title: '조용한 시간 기준',
          scenario: '늦은 시간대 생활 리듬 차이가 있으면 작은 소리도 더 크게 느껴질 수 있어요.',
          rule: '밤 늦은 시간에는 통화나 영상 시청 시 이어폰을 사용해요.',
          reason: '늦은 시간대 생활 리듬 차이를 먼저 맞춰두는 게 좋아요.',
          topic_code: 'quiet_hours',
          severity: 90,
        },
        {
          rule_id: 'ai-rule-2',
          source: 'fallback',
          title: '설거지와 정리 마감',
          scenario: '정리 기준이 다르면 공용 공간 피로가 금방 쌓일 수 있어요.',
          rule: '공용 공간 정리와 설거지는 당일 안에 함께 마무리해요.',
          reason: '정리 기준 차이가 누적되면 생활 만족도가 떨어질 수 있어요.',
          topic_code: 'dishes_deadline',
          severity: 84,
        },
        {
          rule_id: 'ai-rule-3',
          source: 'fallback',
          title: '방문객 허용 빈도',
          scenario: '방문객 기준은 휴식과 사생활에 바로 영향을 줄 수 있어요.',
          rule: '지인을 초대해야 할 때는 최소 하루 전에 서로 알려줘요.',
          reason: '방문객 기준은 초반에 합의해두는 편이 좋아요.',
          topic_code: 'guest_frequency',
          severity: 88,
        },
      ],
      custom_rules: [],
      signatures: {},
      signature_status: 'pending',
      source: 'fallback',
      retrieved_context: [],
      conflict_topics: [
        { code: 'quiet_hours', label: '조용한 시간 기준', severity: 90, reason: '늦은 시간대 생활 리듬 차이를 먼저 맞춰두는 게 좋아요.' },
        { code: 'dishes_deadline', label: '설거지와 정리 마감', severity: 84, reason: '정리 기준 차이가 누적되면 생활 만족도가 떨어질 수 있어요.' },
        { code: 'guest_frequency', label: '방문객 허용 빈도', severity: 88, reason: '방문객 기준은 초반에 합의해두는 편이 좋아요.' },
      ],
      generated_at: now,
      updated_at: now,
    };
    confirmRoommateSelection({
      roomId,
      profileId,
      peerProfileId,
      peerName,
      pact,
    });
    return {
      status: 'confirmed',
      room: {
        room_id: roomId,
        participant_a_profile_id: participantAProfileId,
        participant_b_profile_id: participantBProfileId,
        participants: [
          { profile_id: participantAProfileId, nickname: item.requester_nickname, gender: '', region: '' },
          { profile_id: participantBProfileId, nickname: item.peer_name, gender: '', region: item.peer_region },
        ],
        created_at: item.accepted_at || item.requested_at,
        updated_at: now,
        roommate_confirmation: nextConfirmation,
      },
      pact,
    };
  }

  const body = await apiRequest(`/chat-rooms/${roomId}/roommate-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
  });
  if (body.status === 'confirmed' && body.pact) {
    confirmRoommateSelection({
      roomId,
      profileId,
      peerProfileId,
      peerName,
      pact: body.pact,
    });
  }
  return body;
}

export function connectChatSocket({
  roomId,
  profileId,
  nickname,
  onMessage,
  onStateChange,
  onConfirmation,
  onError,
}) {
  const socket = new WebSocket(
    `${getWebSocketUrl(`/ws/chat-rooms/${roomId}`)}?profile_id=${encodeURIComponent(profileId)}&nickname=${encodeURIComponent(nickname)}`
  );

  socket.addEventListener('open', () => onStateChange?.('connected'));
  socket.addEventListener('close', () => onStateChange?.('disconnected'));
  socket.addEventListener('error', () => {
    onStateChange?.('error');
    onError?.(new Error('채팅 연결에 실패했어요'));
  });
  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message') onMessage?.(payload.message);
      if (payload.type === 'roommate_confirmation') onConfirmation?.(payload);
      if (payload.type === 'error') onError?.(new Error(payload.detail || '채팅 오류'));
    } catch {
      onError?.(new Error('채팅 응답을 해석하지 못했어요'));
    }
  });

  return socket;
}

export function connectChatInboxSocket({
  profileId,
  onSnapshot,
  onError,
  onStateChange,
}) {
  if (!profileId || isPracticeMode()) return null;

  const socket = new WebSocket(
    `${getWebSocketUrl(`/ws/profiles/${profileId}/inbox`)}`
  );

  socket.addEventListener('open', () => {
    onStateChange?.('connected');
    socket.send(JSON.stringify({ type: 'sync' }));
  });
  socket.addEventListener('close', () => onStateChange?.('disconnected'));
  socket.addEventListener('error', () => {
    onStateChange?.('error');
    onError?.(new Error('채팅 목록 연결에 실패했어요'));
  });
  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'inbox_snapshot') onSnapshot?.(payload);
      if (payload.type === 'error') onError?.(new Error(payload.detail || '채팅 목록 오류'));
    } catch {
      onError?.(new Error('채팅 목록 응답을 해석하지 못했어요'));
    }
  });

  return socket;
}

export async function getRulesDraft() {
  const profile = getNormalizedProfileContext();
  let selection = readRoommateSelection();
  const cachedPact = readRoommatePact();

  if (!selection?.room_id || !profile?.profile_id) {
    await syncPersistedRoommateState();
    selection = readRoommateSelection();
    if (!selection?.room_id || !profile?.profile_id) {
      await delay(600);
      return RULES_DRAFT;
    }
  }

  let pact = cachedPact;
  if (!String(selection.room_id).startsWith('local-room-')) {
    const body = await apiRequest(
      `/chat-rooms/${selection.room_id}/pact?profile_id=${encodeURIComponent(profile.profile_id)}`
    );
    pact = normalizePactShape(body.pact);
    if (pact) writeRoommatePact(pact);
  }

  pact = normalizePactShape(pact);
  if (!pact?.ai_rules?.length) {
    await delay(600);
    return RULES_DRAFT;
  }

  return pact;
}

export async function getRulesReview() {
  const profile = getNormalizedProfileContext();
  let selection = readRoommateSelection();
  const cachedPact = readRoommatePact();

  if (!selection?.room_id || !profile?.profile_id) {
    await syncPersistedRoommateState();
    selection = readRoommateSelection();
    if (!selection?.room_id || !profile?.profile_id) {
      await delay(400);
      return RULES_REVIEW;
    }
  }

  let pact = cachedPact;
  if (!pact && !String(selection.room_id).startsWith('local-room-')) {
    const body = await apiRequest(
      `/chat-rooms/${selection.room_id}/pact?profile_id=${encodeURIComponent(profile.profile_id)}`
    );
    pact = normalizePactShape(body.pact);
    if (pact) writeRoommatePact(pact);
  }

  pact = normalizePactShape(pact);
  if (!pact?.rules?.length && !pact?.custom_rules?.length) {
    await delay(400);
    return RULES_REVIEW;
  }

  return pact;
}

export async function savePactCustomRules(additionalRules) {
  const profile = getNormalizedProfileContext();
  const selection = readRoommateSelection();
  if (!selection?.room_id || !profile?.profile_id) {
    throw new Error('약속 정보를 다시 확인해주세요');
  }

  if (String(selection.room_id).startsWith('local-room-')) {
    const pact = normalizePactShape(readRoommatePact());
    const currentRules = pact?.custom_rules || [];
    const nextRules = [...currentRules];
    additionalRules.forEach((item) => {
      const value = String(item || '').trim();
      if (!value) return;
      if (nextRules.some((rule) => rule.rule === value)) return;
      nextRules.push({
        rule_id: `custom-${Math.random().toString(36).slice(2, 10)}`,
        rule: value,
        created_by_profile_id: profile.profile_id,
        created_at: new Date().toISOString(),
      });
    });
    const nextPact = {
      ...pact,
      custom_rules: nextRules,
      updated_at: new Date().toISOString(),
    };
    writeRoommatePact(nextPact);
    return nextPact;
  }

  const body = await apiRequest(`/chat-rooms/${selection.room_id}/pact`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profile.profile_id,
      additional_rules: additionalRules,
    }),
  });
  const pact = normalizePactShape(body.pact);
  if (pact) writeRoommatePact(pact);
  return pact;
}

export async function submitSignature({ name, agreed, signatureDataUrl }) {
  const profile = getNormalizedProfileContext();
  const selection = readRoommateSelection();
  if (!selection?.room_id || !profile?.profile_id) {
    throw new Error('약속 정보를 다시 확인해주세요');
  }
  if (!agreed) throw new Error('약관에 동의해주세요');

  if (String(selection.room_id).startsWith('local-room-')) {
    const pact = normalizePactShape(readRoommatePact());
    const signatures = {
      ...(pact?.signatures || {}),
      [profile.profile_id]: {
        profile_id: profile.profile_id,
        signer_name: name,
        signature_data_url: signatureDataUrl,
        agreed: true,
        signed_at: new Date().toISOString(),
      },
    };
    const signedIds = Object.keys(signatures);
    const nextPact = {
      ...pact,
      signatures,
      signature_status:
        signedIds.includes(pact.participant_a_profile_id) &&
        signedIds.includes(pact.participant_b_profile_id)
          ? 'completed'
          : 'pending',
      updated_at: new Date().toISOString(),
    };
    writeRoommatePact(nextPact);
    return { ok: true, pact: nextPact };
  }

  const body = await apiRequest(`/chat-rooms/${selection.room_id}/signatures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profile.profile_id,
      signer_name: name,
      signature_data_url: signatureDataUrl,
      agreed,
    }),
  });
  const pact = normalizePactShape(body.pact);
  if (pact) writeRoommatePact(pact);
  return { ok: true, pact };
}
