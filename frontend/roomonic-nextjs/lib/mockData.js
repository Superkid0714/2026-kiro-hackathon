export const CANDIDATES = [
  {
    id: '1',
    name: '민준',
    score: 91,
    region: '광주',
    moveIn: '2025년 8월',
    emoji: '🧑',
    bg: 'bg-peachSoft',
    goodPoints: [
      { text: '수면 패턴이 비슷해요', tag: '수면' },
      { text: '청소 기준이 비슷해요', tag: '청결' },
      { text: '집에 머무는 시간이 비슷해요', tag: '생활리듬' },
    ],
    cautionPoints: [
      { text: '손님 방문 빈도 차이가 있어요', tag: '생활습관' },
      { text: '실내 취향이 조금 달라요', tag: '공간' },
    ],
    hardcuts: ['실내 흡연', '반려동물 필수'],
  },
  {
    id: '2',
    name: '서준',
    score: 84,
    region: '광주',
    moveIn: '2025년 9월',
    emoji: '🧑‍🦱',
    bg: 'bg-mintSoft',
    goodPoints: [
      { text: '기상 시간이 비슷해요', tag: '수면' },
      { text: '조용한 취미를 선호해요', tag: '취미' },
    ],
    cautionPoints: [
      { text: '공용 물품 정리 방식이 달라요', tag: '생활습관' },
    ],
    hardcuts: ['주야간 근무 불일치'],
  },
  {
    id: '3',
    name: '하은',
    score: 77,
    region: '광주',
    moveIn: '2025년 8월',
    emoji: '🧑‍🦰',
    bg: 'bg-pinkSoft',
    goodPoints: [
      { text: '청소 주기가 비슷해요', tag: '청결' },
      { text: '집에 머무는 시간이 비슷해요', tag: '생활리듬' },
    ],
    cautionPoints: [
      { text: '손님 방문 빈도 차이가 있어요', tag: '생활습관' },
      { text: '실내 온도 선호가 달라요', tag: '공간' },
    ],
    hardcuts: ['잦은 손님 방문'],
  },
];

export const HARDCUT_OPTIONS = [
  '실내 흡연',
  '잦은 손님 방문',
  '반려동물 필수',
  '주야간 근무 불일치',
  '공용공간 미청소',
  '늦은 밤 소음',
];

export const INTERVIEW_RESULT = {
  badge: 'THE BALANCED',
  title: '계획적인 여유형',
  desc: '규칙적인 생활을 하면서도 적당한 여유를 즐기는 당신! 이런 룸메이트와 잘 맞아요.',
  tags: ['규칙적인 수면', '깨끗한 환경', '조용한 취미', '함께하는 시간 존중'],
};

export const CHAT_MESSAGES = [
  { from: 'them', text: '안녕하세요! 민준입니다 😊 매칭 요청 수락했어요!' },
  { from: 'me', text: '안녕하세요! 지수예요! 만나서 반가워요:)' },
  { from: 'them', text: '저도 반가워요! AI가 만든 생활수칙 초안 같이 확인해볼까요?' },
];

export const RULES_DRAFT = [
  {
    id: 1,
    title: '야간 소음 제한',
    rule: '밤 12시 이후에는 공용 공간에서 이어폰을 사용해요.',
    reason: '두 분 모두 밤 11시 이후 수면을 준비하는 패턴이 확인돼요.',
  },
  {
    id: 2,
    title: '공용 공간 청소',
    rule: '주 2회, 화·토 오전에 공용 공간을 청소해요.',
    reason: '두 분 모두 정돈된 환경을 중요하게 여기는 응답을 주셨어요.',
  },
  {
    id: 3,
    title: '손님 방문 규칙',
    rule: '손님 방문 하루 전, 채팅으로 미리 알려요.',
    reason: '손님 방문 빈도에 대한 선호 차이가 확인돼요.',
  },
  {
    id: 4,
    title: '공용 물품 비용 정산',
    rule: '매월 25일, 공용 물품 비용을 5:5로 정산해요.',
    reason: '두 분 모두 정기적인 정산 방식을 선호해요.',
  },
];

export const RULES_REVIEW = [
  { id: 1, title: '01. 야간 소음 제한', desc: '밤 12시 이후 이어폰 사용', status: 'agreed' },
  { id: 2, title: '02. 공용 공간 청소', desc: '주 2회, 화·토 오전 청소', status: 'agreed' },
  { id: 3, title: '03. 손님 방문 규칙', desc: '하루 전 채팅으로 알리기', status: 'revise' },
  { id: 4, title: '04. 공용 물품 비용', desc: '매월 25일, 5:5 정산', status: 'agreed' },
  { id: 5, title: '05. 냉난방 사용 기준', desc: '희망 온도 1℃ 이내 협의', status: 'pending' },
];
