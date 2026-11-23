import type { GenPalette } from "./crystals";

/* ======================================================================
 * «Шах и мат» — 12 моделей (6 белых и 6 чёрных фигур) и
 * «Росток в кристалле» — 9 моделей деревьев. Рисуется в координатах 100×120.
 * ====================================================================== */

const BASE = "M20 112 L80 112 L75 100 L25 100 Z";

const PIECE_PATHS: Record<string, string[]> = {
  p: [
    "M37 34a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z",
    "M35 50 L65 50 L60 58 L40 58 Z",
    "M41 58 L59 58 L66 100 L34 100 Z",
    BASE,
  ],
  r: [
    "M26 14 L38 14 L38 24 L44 24 L44 14 L56 14 L56 24 L62 24 L62 14 L74 14 L74 36 L66 42 L68 88 L76 100 L24 100 L32 88 L34 42 L26 36 Z",
    BASE,
  ],
  b: [
    "M45 8a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z",
    "M50 14 C68 28 70 44 58 54 L64 60 L36 60 L42 54 C30 44 32 28 50 14 Z",
    "M40 60 L60 60 L67 100 L33 100 Z",
    BASE,
  ],
  n: ["M28 100 C28 82 44 72 46 56 C36 58 30 64 24 68 L16 58 C26 46 34 30 46 22 L48 10 L58 18 C82 24 84 58 80 100 Z", BASE],
  q: [
    "M21 22a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z",
    "M35 15a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z",
    "M55 15a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z",
    "M69 22a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z",
    "M26 26 L36 50 L42 24 L50 48 L58 24 L64 50 L74 26 L70 58 L30 58 Z",
    "M38 58 L62 58 L68 100 L32 100 Z",
    BASE,
  ],
  k: [
    "M47 2 L53 2 L53 9 L60 9 L60 15 L53 15 L53 26 L47 26 L47 15 L40 15 L40 9 L47 9 Z",
    "M32 56 C32 38 40 28 50 28 C60 28 68 38 68 56 Z",
    "M38 56 L62 56 L68 100 L32 100 Z",
    BASE,
  ],
};

/** variant: «w» или «b» + буква фигуры (p, n, b, r, q, k) */
export function ChessArt({ variant = "wk" }: { variant?: string }) {
  const white = variant[0] !== "b";
  const paths = PIECE_PATHS[variant[1]] ?? PIECE_PATHS.k;
  const fill = white ? "#f1f5f9" : "#1e293b";
  const edge = white ? "#94a3b8" : "#94a3b8";
  return (
    <g strokeLinejoin="round">
      <defs>
        <clipPath id="chess-clip-r">
          <rect x="50" y="0" width="70" height="120" />
        </clipPath>
        <clipPath id="chess-clip-l">
          <rect x="-10" y="0" width="60" height="120" />
        </clipPath>
      </defs>
      <g transform="translate(0 2)">
        {paths.map((d, i) => (
          <path key={`f${i}`} d={d} fill={fill} stroke={edge} strokeWidth={1} />
        ))}
        <g clipPath="url(#chess-clip-r)">
          {paths.map((d, i) => (
            <path key={`r${i}`} d={d} fill={white ? "rgba(71,85,105,0.34)" : "rgba(0,0,0,0.4)"} />
          ))}
        </g>
        <g clipPath="url(#chess-clip-l)">
          {paths.map((d, i) => (
            <path key={`l${i}`} d={d} fill={white ? "rgba(255,255,255,0.5)" : "rgba(148,163,184,0.2)"} />
          ))}
        </g>
        {/* грани-«кристалл» и блики */}
        <path d="M50 18 L50 100 M34 100 L50 62 L66 100" fill="none" stroke={white ? "rgba(100,116,139,0.45)" : "rgba(226,232,240,0.28)"} strokeWidth={0.8} />
        <path d="M36 102 L64 102" stroke={white ? "rgba(255,255,255,0.8)" : "rgba(226,232,240,0.5)"} strokeWidth={1.2} />
        <path d="M37 44 L40 52 L48 55 L40 58 L37 66 L34 58 L26 55 L34 52 Z" fill="#fff" opacity={white ? 0.95 : 0.8} transform="translate(2 -8) scale(.9)" />
      </g>
    </g>
  );
}

/* ---------- Росток в кристалле ---------- */

type TreeOpts = {
  trunk: [string, string];
  canopy?: [string, string, string];
  kind?: "round" | "gems" | "bare";
  fruit?: string;
  coins?: boolean;
  rust?: boolean;
  shards?: boolean;
};

const diamond = (cx: number, cy: number, r: number, a: string, b: string, k: string) => (
  <g key={k}>
    <polygon points={`${cx},${cy - r * 1.25} ${cx - r},${cy} ${cx},${cy + r * 1.25}`} fill={a} stroke="rgba(255,255,255,0.6)" strokeWidth={0.6} />
    <polygon points={`${cx},${cy - r * 1.25} ${cx + r},${cy} ${cx},${cy + r * 1.25}`} fill={b} stroke="rgba(255,255,255,0.6)" strokeWidth={0.6} />
  </g>
);

function Tree({ trunk, canopy = ["#4ade80", "#86efac", "#16a34a"], kind = "round", fruit, coins, rust, shards }: TreeOpts) {
  const blobs: [number, number, number][] = [
    [50, 36, 16],
    [34, 49, 11],
    [66, 49, 11],
    [50, 52, 10],
  ];
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* корни */}
      <path d="M47 98 C42 101 38 99 33 94 M53 98 C58 101 62 99 67 94 M50 100 L50 106" fill="none" stroke={trunk[1]} strokeWidth={2.4} />
      {/* ствол и ветви */}
      <path d="M45 100 C47 86 47 74 48 60 L52 60 C53 74 53 86 55 100 Z" fill={trunk[0]} stroke={trunk[1]} strokeWidth={0.8} />
      <path d="M50 74 L37 58 M50 68 L64 53 M50 82 L40 74 M50 60 L50 42" fill="none" stroke={trunk[0]} strokeWidth={kind === "bare" ? 2.6 : 2} />
      {kind === "bare" && (
        <path d="M37 58 L30 50 M37 58 L34 46 M64 53 L72 46 M64 53 L68 42 M50 42 L44 32 M50 42 L57 31 M40 74 L31 72" fill="none" stroke={trunk[0]} strokeWidth={1.8} />
      )}
      {kind === "round" && (
        <>
          {blobs.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={canopy[i % 3]} stroke="rgba(0,0,0,0.18)" strokeWidth={0.7} />
          ))}
          <circle cx={44} cy={30} r={6} fill="rgba(255,255,255,0.35)" />
        </>
      )}
      {kind === "gems" && (
        <>
          {diamond(50, 34, 13, canopy[0], canopy[2], "a")}
          {diamond(33, 49, 9, canopy[1], canopy[2], "b")}
          {diamond(67, 49, 9, canopy[0], canopy[2], "c")}
          {diamond(50, 52, 7, canopy[1], canopy[0], "d")}
        </>
      )}
      {fruit &&
        [
          [42, 40],
          [58, 34],
          [36, 52],
          [64, 52],
          [50, 48],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4.2} fill={fruit} stroke="rgba(0,0,0,0.3)" strokeWidth={0.6} />
            <circle cx={x - 1.3} cy={y - 1.4} r={1.2} fill="#fff" opacity={0.8} />
          </g>
        ))}
      {coins &&
        [
          [42, 38],
          [58, 36],
          [34, 52],
          [66, 51],
          [50, 49],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4.6} fill="#facc15" stroke="#a16207" strokeWidth={0.9} />
            <path d={`M${x} ${y - 2.4} L${x} ${y + 2.4} M${x - 1.6} ${y - 1} L${x + 1.6} ${y - 1} M${x - 1.6} ${y + 1} L${x + 1.6} ${y + 1}`} stroke="#a16207" strokeWidth={0.7} fill="none" />
          </g>
        ))}
      {rust &&
        [
          [44, 32, 2.2],
          [56, 44, 2.6],
          [38, 50, 1.8],
          [64, 54, 2],
          [50, 76, 1.6],
        ].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#b45309" opacity={0.85} />)}
      {shards &&
        [
          "M30 46 L36 56 L26 58 Z",
          "M70 40 L74 52 L64 50 Z",
          "M50 28 L55 38 L45 38 Z",
          "M46 86 L52 92 L42 94 Z",
        ].map((d, i) => <path key={i} d={d} fill="#c4b5fd" stroke="#fff" strokeWidth={0.7} opacity={0.95} />)}
    </g>
  );
}

function DiamondCreature({ legs }: { legs?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {legs && (
        <g fill="none" stroke="#334155" strokeWidth={2.6}>
          <path d="M36 62 L22 54 L16 72 M38 70 L24 76 L22 92 M64 62 L78 54 L84 72 M62 70 L76 76 L78 92" />
        </g>
      )}
      <g stroke="rgba(255,255,255,0.7)" strokeWidth={0.8}>
        <polygon points="50,30 70,56 50,88 30,56" fill="#7dd3fc" />
        <polygon points="50,30 70,56 50,56" fill="#e0f2fe" />
        <polygon points="50,30 30,56 50,56" fill="#bae6fd" />
        <polygon points="30,56 50,56 50,88" fill="#38bdf8" />
        <polygon points="70,56 50,56 50,88" fill="#0284c7" />
      </g>
      {legs ? (
        <>
          <circle cx={43} cy={52} r={2.6} fill="#ef4444" stroke="#fff" strokeWidth={0.6} />
          <circle cx={57} cy={52} r={2.6} fill="#ef4444" stroke="#fff" strokeWidth={0.6} />
        </>
      ) : (
        <g fill="none" stroke="#a16207" strokeWidth={2.4}>
          <path d="M50 88 C48 96 42 100 36 98 M50 88 C52 96 58 100 64 98 M50 88 L50 106 M46 94 C40 98 34 106 30 104 M54 94 C60 98 66 106 70 104" />
        </g>
      )}
    </g>
  );
}

const HOLD = "#1f2937";

/** variant: crystaltree, diamondroots, amberoak, deadman, bloodfruit, coppershell, junk, moneytree, monster */
export function SproutArt({ variant = "crystaltree", gen }: { variant?: string; gen?: GenPalette }) {
  const hue = gen?.hues[0] ?? 150;
  const sat = gen?.sat ?? 70;
  const lift = gen?.lift ?? 0;
  const light = (l: number) => `hsl(${hue} ${sat}% ${Math.min(96, Math.max(4, l + lift))}%)`;

  let inside;
  switch (variant) {
    case "diamondroots":
      inside = <DiamondCreature />;
      break;
    case "monster":
      inside = <DiamondCreature legs />;
      break;
    case "amberoak":
      inside = <Tree trunk={["#92400e", "#78350f"]} canopy={["#f59e0b", "#fbbf24", "#d97706"]} />;
      break;
    case "deadman":
      inside = <Tree trunk={["#f8fafc", "#94a3b8"]} kind="bare" shards />;
      break;
    case "bloodfruit":
      inside = <Tree trunk={["#7f1d1d", "#450a0a"]} canopy={["#b91c1c", "#dc2626", "#991b1b"]} fruit="#ef4444" />;
      break;
    case "coppershell":
      inside = <Tree trunk={["#a9552a", "#7c3a1a"]} canopy={["#d9814a", "#f0a06a", "#b4592b"]} />;
      break;
    case "junk":
      inside = <Tree trunk={["#78716c", "#44403c"]} canopy={["#8b8580", "#a8a29e", "#6b5b4d"]} kind="gems" rust />;
      break;
    case "moneytree":
      inside = <Tree trunk={["#854d0e", "#713f12"]} canopy={["#22c55e", "#4ade80", "#16a34a"]} coins />;
      break;
    default:
      inside = <Tree trunk={["#cffafe", "#67e8f9"]} canopy={["#67e8f9", "#a5f3fc", "#22d3ee"]} kind="gems" />;
  }

  return (
    <g strokeLinejoin="round">
      <polygon points="50,4 88,26 88,92 50,116 12,92 12,26" fill={light(48)} fillOpacity={0.5} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <polygon points="50,4 88,26 50,50 12,26" fill="rgba(255,255,255,0.3)" />
      <polygon points="12,26 50,50 50,116 12,92" fill={light(70)} fillOpacity={0.18} />
      <polygon points="88,26 88,92 50,116 50,50" fill="rgba(0,0,0,0.2)" />
      <g transform="translate(0 -2)">{inside}</g>
      <polygon points="20,34 30,31 24,58" fill="#fff" opacity={0.45} />
      <polygon points="50,9 40,20 50,24" fill="#fff" opacity={0.7} />
      <path d="M50 50 L50 116 M12 26 L50 50 L88 26" fill="none" stroke={HOLD} strokeOpacity={0.12} strokeWidth={0.8} />
    </g>
  );
}
