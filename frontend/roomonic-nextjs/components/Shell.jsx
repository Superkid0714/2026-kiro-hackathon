export default function Shell({ children, dark = false }) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-[linear-gradient(180deg,#EEE3FF_0%,#E7DAFF_44%,#F5EEFF_100%)]">
      <div
        className={
          'w-full max-w-[430px] min-h-screen flex flex-col relative ' +
          (dark
            ? 'bg-gradient-to-b from-[#33285f] via-night1 to-night2 text-white'
            : 'bg-[linear-gradient(180deg,#FCF8FF_0%,#F4ECFF_52%,#EFE4FF_100%)] text-ink')
        }
      >
        {dark && <div className="stars" />}
        {children}
      </div>
    </div>
  );
}
