'use client';

export function Button({ children, variant = 'primary', fullWidth = true, className = '', ...props }) {
  const base =
    'rounded-2xl font-bold text-[14.5px] py-3.5 px-4 flex items-center justify-center gap-1.5 transition active:scale-95';
  const styles = {
    primary: 'bg-indigo text-white shadow-lg shadow-indigo/30 hover:bg-indigoHi',
    ghost: 'bg-transparent text-indigo border-[1.5px] border-line',
    ghostDark: 'bg-transparent text-white border-[1.5px] border-white/30',
    soft: 'bg-lavenderSoft text-indigo',
    danger: 'bg-gradient-to-br from-pink to-[#E1436B] text-white shadow-lg shadow-[#E1436B]/30',
  };
  const width = fullWidth ? 'w-full' : 'w-auto';
  return (
    <button className={`${width} ${base} ${styles[variant] || styles.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-[18px] p-4 shadow-card border border-line ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ percent = 0, dark = false }) {
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/15' : 'bg-lavenderSoft'}`}>
      <div
        className="h-full bg-indigo rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Chip({ selected, danger, children, ...props }) {
  return (
    <button
      type="button"
      className={
        'px-3.5 py-2 rounded-xl border-[1.5px] text-[12.5px] font-semibold select-none transition ' +
        (selected
          ? danger
            ? 'bg-[#E1436B] border-[#E1436B] text-white'
            : 'bg-indigo border-indigo text-white'
          : 'bg-white border-line text-inkSoft')
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function Tag({ tone = 'default', children }) {
  const tones = {
    default: 'bg-lavenderSoft text-indigo',
    warn: 'bg-peachSoft text-[#B36B1D]',
    mint: 'bg-mintSoft text-[#1E8A62]',
    hard: 'bg-[#FDE1E9] text-[#C22A5A]',
  };
  return (
    <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg ${tones[tone]}`}>{children}</span>
  );
}

export function StatusBar({ dark = false }) {
  return (
    <div className={`flex justify-between px-[22px] pt-3.5 pb-1 text-[11px] font-bold ${dark ? 'text-white' : 'text-ink'}`}>
      <span>9:41</span>
      <span>📶 🔋</span>
    </div>
  );
}

export function BackLink({ onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`font-bold text-sm ${dark ? 'text-white' : 'text-indigo'}`}
    >
      ←
    </button>
  );
}
