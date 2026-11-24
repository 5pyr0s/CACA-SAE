import { useEffect, useState } from "react";

/**
 * Milliseconds left until targetMillis, recomputed from absolute time on every
 * tick (never a decremented variable: background tabs throttle timers and laptop
 * clocks drift). offsetMs = serverNow − Date.now(), measured once per session.
 */
export function useCountdown(targetMillis, offsetMs = 0) {
  // Only "now" ticks; the remaining time is derived during render, so a new
  // target (e.g. an anti-sniping extension) shows up instantly.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return Math.max(0, targetMillis - (now + offsetMs));
}

/** 3h 05m 09s / 4m 09s / 9s */
export function formatDuration(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}
