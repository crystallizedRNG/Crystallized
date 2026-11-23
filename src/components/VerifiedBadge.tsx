/** Галочка рядом с именем игрока (выдаётся из админ-меню) */
export default function VerifiedBadge({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      role="img"
      aria-label="Подтверждённый игрок"
    >
      <title>Подтверждённый игрок</title>
      <circle cx="12" cy="12" r="11" fill="#1d9bf0" />
      <circle cx="12" cy="12" r="11" fill="none" stroke="#7cc6ff" strokeWidth="1" opacity=".7" />
      <path d="M6.8 12.4l3.4 3.4 7-7.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
