// Word Rush 단어 데이터. DB 없이 배열로 관리, 게임마다 랜덤 추출.
export const WORDS = [
  'apple',
  'banana',
  'computer',
  'coffee',
  'water',
  'school',
  'friend',
  'window',
  'clean',
  'room',
  'table',
  'chair',
  'book',
  'phone',
  'music',
  'happy',
  'morning',
  'house',
  'kitchen',
  'garden',
  'pencil',
  'orange',
  'yellow',
  'umbrella',
  'weekend',
  'picture',
  'flower',
  'bottle',
  'summer',
  'winter',
];

// 직전 단어(exclude)와 다른 단어를 랜덤으로 하나 뽑는다.
export function pickRandomWord(exclude) {
  const pool = exclude ? WORDS.filter((word) => word !== exclude) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)] || WORDS[0];
}
