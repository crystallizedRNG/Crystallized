
import { useId } from "react";
import type { ChestTheme } from "./game";

export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="#b45309" />
      <circle cx="12" cy="12" r="9" fill="#fbbf24" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#d97706" strokeWidth="1.3" />
      <path d="M12 7.6v8.8M9.6 10.2c0-1 1-1.6 2.4-1.6s2.4.6 2.4 1.5-.9 1.4-2.4 1.8-2.4.8-2.4 1.8 1 1.5 2.4 1.5 2.4-.6 2.4-1.6" fill="none" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 8a8 8 0 0 1 6-3.6" fill="none" stroke="#fff7d1" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

/** Маленький закрытый сундук для карточек магазина */
export function ChestIcon({ theme, className }: { theme: ChestTheme; className?: string }) {
  const id = `ci${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="20 14 200 190" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.wood[0]} />
          <stop offset="1" stopColor={theme.wood[1]} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.lid[0]} />
          <stop offset="1" stopColor={theme.lid[1]} />
        </linearGradient>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={theme.iron[0]} />
          <stop offset="0.5" stopColor={theme.iron[1]} />
          <stop offset="1" stopColor={theme.iron[2]} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.lock[0]} />
          <stop offset="0.5" stopColor={theme.lock[1]} />
          <stop offset="1" stopColor={theme.lock[2]} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d="M30 90 V62 Q30 26 120 26 Q210 26 210 62 V90 Z" />
        </clipPath>
      </defs>
      <ellipse cx="120" cy="195" rx="104" ry="9" fill="rgba(0,0,0,0.4)" />
      <path d="M30 90 V62 Q30 26 120 26 Q210 26 210 62 V90 Z" fill={`url(#${id}l)`} />
      <g clipPath={`url(#${id}c)`}>
        <rect x="52" y="20" width="16" height="75" fill={`url(#${id}i)`} />
        <rect x="172" y="20" width="16" height="75" fill={`url(#${id}i)`} />
        <path d="M40 60 Q44 36 120 32" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" strokeLinecap="round" />
      </g>
      <rect x="30" y="84" width="180" height="108" rx="9" fill={`url(#${id}w)`} />
      <path d="M30 122 H210 M30 158 H210" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
      <rect x="52" y="84" width="16" height="108" fill={`url(#${id}i)`} />
      <rect x="172" y="84" width="16" height="108" fill={`url(#${id}i)`} />
      <rect x="30" y="84" width="180" height="9" fill={`url(#${id}i)`} />
      <rect x="30" y="178" width="180" height="14" rx="6" fill={`url(#${id}i)`} />
      <rect x="103" y="76" width="34" height="50" rx="6" fill={`url(#${id}g)`} stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
      <circle cx="120" cy="96" r="5.5" fill="#451a03" />
      <path d="M117.7 99 L122.3 99 L124 113 L116 113 Z" fill="#451a03" />
    </svg>
  );
}
