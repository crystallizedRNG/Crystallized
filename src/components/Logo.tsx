type Props = {
  size?: number;
  glow?: boolean;
  className?: string;
};

/** Точки осколка — общие для логотипа и значка вкладки */
export const SHARD_POINTS = {
  outline: "54,3 80,31 68,66 50,97 28,68 22,33",
  topLeft: "54,3 22,33 46,38",
  topRight: "54,3 80,31 46,38",
  midLeft: "22,33 46,38 40,74 28,68",
  midRight: "80,31 46,38 40,74 50,97 68,66",
  tip: "40,74 50,97 28,68",
};

/** Значок для вкладки браузера: тот же осколок в цвете темы */
export function logoDataUrl(color: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
    `<polygon points='${SHARD_POINTS.outline}' fill='${color}'/>` +
    `<polygon points='${SHARD_POINTS.topLeft}' fill='#fff' opacity='.45'/>` +
    `<polygon points='${SHARD_POINTS.topRight}' fill='#fff' opacity='.18'/>` +
    `<polygon points='${SHARD_POINTS.midLeft}' fill='#fff' opacity='.2'/>` +
    `<polygon points='${SHARD_POINTS.tip}' fill='#000' opacity='.3'/>` +
    `<polygon points='${SHARD_POINTS.midRight}' fill='#000' opacity='.12'/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Логотип Crystallized — осколок кристалла. Окрашивается в акцентный цвет темы. */
export default function Logo({ size = 32, glow, className }: Props) {
  const p = SHARD_POINTS;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ color: "var(--accent)", ...(glow ? { filter: "drop-shadow(0 0 16px var(--accent))" } : {}) }}
      aria-hidden
    >
      <polygon points={p.outline} fill="currentColor" />
      <polygon points={p.topLeft} fill="#fff" opacity="0.45" />
      <polygon points={p.topRight} fill="#fff" opacity="0.18" />
      <polygon points={p.midLeft} fill="#fff" opacity="0.2" />
      <polygon points={p.midRight} fill="#000" opacity="0.12" />
      <polygon points={p.tip} fill="#000" opacity="0.3" />
      <polygon points="54,3 46,38 40,74 50,97" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={p.outline} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points="52,10 44,26 52,28" fill="#fff" opacity="0.8" />
    </svg>
  );
}
