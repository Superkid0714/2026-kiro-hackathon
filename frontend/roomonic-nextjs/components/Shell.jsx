export default function Shell({ children, dark = false }) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-[#F3F0FC]">
      <div
        className={
          'w-full max-w-[430px] min-h-screen flex flex-col relative ' +
          (dark
            ? 'bg-gradient-to-b from-[#33285f] via-night1 to-night2 text-white'
            : 'bg-cream text-ink')
        }
      >
        {dark && <div className="stars" />}
        {children}
      </div>
    </div>
  );
}
