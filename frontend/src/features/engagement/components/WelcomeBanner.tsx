interface Props {
  onAddTransaction: () => void;
}

export function WelcomeBanner({ onAddTransaction }: Props) {
  return (
    <div
      className="rounded-2xl text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07]" />
      <div className="pointer-events-none absolute -bottom-6 left-4 w-24 h-24 rounded-full bg-white/[0.05]" />

      <div className="relative flex items-center gap-0">
        {/* Mascot */}
        <div className="flex-shrink-0 w-[160px] md:w-[200px] self-end">
          <img
            src="/basic.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto object-contain object-bottom drop-shadow-xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-8 pr-6 md:pr-10">
          <h2 className="font-display text-xl md:text-2xl font-bold leading-snug mb-2">
            Welcome to your<br />financial journey! 👋
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-6">
            Track your first transaction<br className="hidden sm:block" /> to start your streak.
          </p>
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ background: "rgba(0,0,0,0.30)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.42)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.30)")}
          >
            <span className="text-base leading-none">+</span>
            Add your first transaction
          </button>
        </div>
      </div>
    </div>
  );
}
