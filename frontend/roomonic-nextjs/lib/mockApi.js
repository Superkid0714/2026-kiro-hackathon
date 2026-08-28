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

function isBrowser() {
  return typeof window !== 'undefined';
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

function saveProfileContext(context) {
  if (!isBrowser()) return;
  window.localStorage.setItem('roomonic-profile', JSON.stringify(context));
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
    throw new Error(body.detail || '요청에 실패했어요');
  }
  return body;
}

function characterVisual(typeCode) {
  if (typeCode === 'PEE') return { emoji: '🐧', bg: 'bg-mintSoft' };
  if (typeCode === 'DUDI') return { emoji: '🐑', bg: 'bg-peachSoft' };
  if (typeCode === 'MOMO') return { emoji: '🐱', bg: 'bg-pinkSoft' };
  return { emoji: '🐻', bg: 'bg-lavenderSoft' };
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
    emoji: visual.emoji,
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
  return getStoredProfileContext();
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
  const body = await apiRequest('/profiles', {
    method: 'POST',
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
  const profile = getStoredProfileContext();
  if (!profile?.profile_id) throw new Error('먼저 프로필을 생성해주세요');

  const body = await apiRequest(`/profiles/${profile.profile_id}/interview`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  return { ok: true, ...body };
}

export async function getInterviewResult() {
  const profile = getStoredProfileContext();
  if (!profile?.profile_id) {
    await delay(600);
    return INTERVIEW_RESULT;
  }

  const body = await apiRequest(`/profiles/${profile.profile_id}/interview`);
  const character = body.character;
  return {
    badge: character.type_code,
    title: character.type_name,
    desc: character.top_factors?.join(' · ') || INTERVIEW_RESULT.desc,
    tags: character.top_factors || INTERVIEW_RESULT.tags,
  };
}

export async function getCandidates() {
  const profile = getStoredProfileContext();
  if (!profile?.profile_id) {
    await delay(500);
    return CANDIDATES;
  }

  const body = await apiRequest(`/profiles/${profile.profile_id}/recommendations`);
  return (body.recommendations || []).map(mapRecommendationToCandidate);
}

export async function getCandidateDetail(id) {
  const profile = getStoredProfileContext();
  if (!profile?.profile_id) {
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
  const profile = getStoredProfileContext();
  if (!profile?.profile_id) throw new Error('현재 사용자 프로필이 없어요');

  const body = await apiRequest(`/profiles/${profile.profile_id}/chat-rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ other_profile_id: otherProfileId }),
  });
  return body.room;
}

export async function getChatRoomMessages(roomId) {
  const body = await apiRequest(`/chat-rooms/${roomId}/messages`);
  return body;
}

export function connectChatSocket({ roomId, profileId, nickname, onMessage, onStateChange, onError }) {
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
      if (payload.type === 'error') onError?.(new Error(payload.detail || '채팅 오류'));
    } catch {
      onError?.(new Error('채팅 응답을 해석하지 못했어요'));
    }
  });

  return socket;
}

export async function getRulesDraft() {
  await delay(600);
  return RULES_DRAFT;
}

export async function getRulesReview() {
  await delay(400);
  return RULES_REVIEW;
}

export async function submitSignature({ name, agreed }) {
  await delay(600);
  if (!agreed) throw new Error('약관에 동의해주세요');
  // 실제 연동 시: 서버가 서명 시점 원문을 SHA-256으로 해싱해 별도 저장합니다.
  return { ok: true, hash: 'a91f2c7e9d3b4581f0c6a7e2b9d4f1c3e0'.slice(0, 8) + '...' + 'c3e0' };
}
