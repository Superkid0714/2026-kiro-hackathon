'use client';

// public/game/ 의 실제 PNG 파일 사용 (브라우저 경로 /game/*.png)
const CHARACTERS = [
  { id: 'dudi', name: 'Dudi', image: '/game/Dudi.png' },
  { id: 'momo', name: 'momo', image: '/game/momo.png' },
  { id: 'pee', name: 'Pee', image: '/game/Pee.png' },
  { id: 'roo', name: 'Roo', image: '/game/Roo.png' },
  { id: 'uni', name: 'UNI', image: '/game/UNI.png' },
];

// 살짝 위아래로 어긋나게 배치해서 귀여운 느낌
const OFFSET = ['translate-y-0.5', '-translate-y-1.5', 'translate-y-1', '-translate-y-1', 'translate-y-0'];

export default function CharacterRow({ className = '' }) {
  return (
    <div className={`flex items-end justify-center gap-2.5 ${className}`}>
      {CHARACTERS.map((character, i) => (
        <div key={character.id} className={`flex flex-col items-center ${OFFSET[i]}`}>
          <img
            src={character.image}
            alt={character.name}
            className="h-[44px] w-[44px] max-w-[15vw] select-none object-contain"
            draggable={false}
          />
          <span className="mt-1 text-[9px] font-semibold text-inkFaint">{character.name}</span>
        </div>
      ))}
    </div>
  );
}
