// 미니게임 목록.
// image: 카드 내부 썸네일 이미지 (public/game/*).
// route: 연결된 게임 페이지. null 이면 아직 미연결.
export const GAMES = [
  {
    id: 1,
    title: 'Word Rush',
    description: '룸메이트와 재미있게 승부해보세요!',
    route: '/game/word-rush',
    image: '/game/wordrush.png',
  },
  {
    id: 2,
    title: '말랑말랑!',
    description: '캐릭터를 만지며 힐링을 해보아용><',
    route: '/game/ghost',
    image: '/game/malarng.png',
  },
  {
    id: 3,
    title: '사다리 타기',
    description: '띠리리리 띠띠 띠리리리 누가 걸릴까?',
    route: '/game/ladder',
    image: '/game/sadari.png',
  },
];
