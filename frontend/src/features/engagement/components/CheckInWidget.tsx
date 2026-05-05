import { useState, useEffect } from "react";

interface Props {
  onSpent: () => void;
  onNoSpend: () => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function CheckInWidget({ onSpent, onNoSpend }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  function handleNoSpend() {
    setConfirmed(true);
    onNoSpend();
  }

  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => setConfirmed(false), 3000);
    return () => clearTimeout(t);
  }, [confirmed]);

  if (confirmed) {
    return (
      <div
        className="mx-5 mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(52,211,153,0.25)", border: "1.5px solid #34d399", color: "#34d399" }}
        >
          ✓
        </div>
        <span className="text-[13px] font-semibold text-white/90">
          No spending today — great control 💪
        </span>
      </div>
    );
  }

  return (
    <div
      className="mx-5 mb-4 rounded-xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      <p className="truncate text-[15px] font-bold text-white mb-1 md:hidden">
        {getGreeting()} 👋
      </p>
      <p className="text-[14px] font-bold text-white mb-3">
        Any expenses today?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onSpent}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
          style={{ background: "rgba(255,255,255,0.9)", color: "hsl(255,73%,45%)" }}
        >
          Yes, I spent
        </button>
        <button
          onClick={handleNoSpend}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          No, all good
        </button>
      </div>
    </div>
  );
}
