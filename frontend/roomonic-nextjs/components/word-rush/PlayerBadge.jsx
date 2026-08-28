'use client';

/**
 * [캐릭터 이미지 + 닉네임] — 게임의 모든 단계에서 재사용.
 * @param {{image:string,name:string,nickname:string}} player
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} highlight  승자/현재 플레이어 강조
 * @param {string}  subLabel   'PLAYER 1' 등
 */
export default function PlayerBadge({ player, size = 'md', highlight = false, subLabel }) {
  const box =
    size === 'lg' ? 'h-28 w-28' : size === 'sm' ? 'h-16 w-16' : 'h-20 w-20';

  return (
    <div className="flex flex-col items-center">
      {subLabel ? (
        <span className="mb-1 text-[10px] font-bold tracking-widest text-indigo">{subLabel}</span>
      ) : null}
      <div
        className={`flex ${box} items-center justify-center rounded-3xl bg-lavenderSoft transition-transform ${
          highlight ? 'scale-105 ring-2 ring-indigo ring-offset-2 ring-offset-cream' : ''
        }`}
      >
        <img
          src={player.image}
          alt={player.name}
          draggable={false}
          className="h-[80%] w-[80%] select-none object-contain"
        />
      </div>
      <p className="mt-2 text-[15px] font-extrabold text-ink">{player.nickname || player.name}</p>
    </div>
  );
}
