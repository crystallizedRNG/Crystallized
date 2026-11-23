import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CollectibleArt } from "./CollectibleCard";
import { CrystalIcon, type CrystalDef } from "./crystals";
import { MODEL_BY_ID, type Collectible } from "./collectibles";

/** Общая длительность анимации улучшения, мс */
export const UPGRADE_DURATION = 3000;
/** Момент, когда стекло разбивается (мс) */
export const UPGRADE_SHATTER_AT = 1400;

/* детерминированный «рандом» — частицы не меняются при перерисовке */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rnd = rng(2024);

/* ---------- осколки самого кристалла: 16 кусков, вместе дающих целую картинку ---------- */
const C = { x: 48, y: 54 };
const OUTER: [number, number][] = [
  [0, 0],
  [50, 0],
  [100, 0],
  [100, 50],
  [100, 100],
  [50, 100],
  [0, 100],
  [0, 50],
];
const INNER = OUTER.map(([x, y]) => [C.x + (x - C.x) * 0.5, C.y + (y - C.y) * 0.5] as [number, number]);
const pct = (p: [number, number]) => `${p[0]}% ${p[1]}%`;

const FRAGMENTS = OUTER.flatMap((p, i) => {
  const j = (i + 1) % OUTER.length;
  const polys: [number, number][][] = [
    [p, OUTER[j], INNER[j], INNER[i]],
    [[C.x, C.y], INNER[i], INNER[j]],
  ];
  return polys.map((poly, k) => {
    const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length;
    const cy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
    const dx = cx - C.x;
    const dy = cy - C.y;
    const len = Math.hypot(dx, dy) || 1;
    const dist = (k === 0 ? 230 : 140) + rnd() * 90;
    return {
      clip: `polygon(${poly.map(pct).join(",")})`,
      x: (dx / len) * dist,
      y: (dy / len) * dist + 40 + rnd() * 60,
      rot: (rnd() - 0.5) * 220,
      delay: rnd() * 0.06,
    };
  });
});

/* ---------- трещины (в координатах 0–100) ---------- */
const CRACKS = [
  "M48 54 L40 44 L42 33 L33 24 L35 11 L30 0",
  "M48 54 L58 46 L57 34 L67 27 L66 12 L72 0",
  "M48 54 L62 57 L71 51 L83 56 L90 48 L100 50",
  "M48 54 L58 64 L57 76 L68 83 L66 95 L70 100",
  "M48 54 L44 67 L35 74 L36 86 L26 92 L22 100",
  "M48 54 L36 58 L27 52 L16 57 L8 50 L0 53",
  "M40 44 L30 46 L22 38 L12 40",
  "M58 64 L66 69 L78 66 L86 74",
  "M42 33 L52 28 L56 18",
  "M35 74 L28 66 L18 70",
  "M33 24 L24 28 L16 22",
  "M71 51 L76 42 L88 38",
];
const RING = "M40 44 L58 46 L62 57 L58 64 L44 67 L36 58 Z";

/* ---------- мелкие стеклянные осколки, разлетающиеся по экрану ---------- */
const SHARDS = Array.from({ length: 34 }, () => {
  const a = rnd() * Math.PI * 2;
  const dist = 22 + rnd() * 48; // vmin
  return {
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist * 0.8 + 8,
    w: 10 + rnd() * 26,
    h: 14 + rnd() * 34,
    rot: (rnd() - 0.5) * 540,
    delay: rnd() * 0.12,
    tri: [
      [rnd() * 40, 100],
      [50 + rnd() * 30, rnd() * 30],
      [70 + rnd() * 30, 100 - rnd() * 40],
    ],
  };
});

const SPARKLES = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + rnd() * 0.3;
  const dist = 20 + rnd() * 24;
  return { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.85, s: 3 + rnd() * 5, delay: rnd() * 0.25 };
});

interface Props {
  /** «???»-кристалл до улучшения */
  from: CrystalDef;
  /** полученный коллекционный кристалл (улучшенная модель с фоном) */
  item: Collectible;
  onDone: () => void;
}

/**
 * 3-секундная анимация улучшения: фон мутнеет, обычный кристалл покрывается трещинами и разбивается
 * (со звуком разбитого стекла), а на его месте появляется улучшенная модель с полученным фоном.
 */
export default function UpgradeReveal({ from, item, onDone }: Props) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = window.setTimeout(() => done.current(), UPGRADE_DURATION);
    return () => clearTimeout(t);
  }, []);

  const model = MODEL_BY_ID[item.model];
  const at = (s: number) => ({ animationDelay: `${s}s` }) as CSSProperties;

  return createPortal(
    <div className="ub-root fixed inset-0 z-[100] overflow-hidden" role="presentation">
      {/* мутнеющий задний фон */}
      <div className="ub-backdrop absolute inset-0" />

      {/* вспышка в момент разбития */}
      <div className="ub-flash pointer-events-none absolute inset-0 bg-white" />

      <div className="absolute inset-0 flex items-center justify-center">
        {/* ── неулучшенная модель: дрожит, трескается, разлетается ── */}
        <div className="ub-crystal-wrap absolute">
          <div className="ub-tremble relative h-52 w-52 sm:h-60 sm:w-60">
            <div className="ub-glow absolute -inset-6 rounded-full" style={{ background: from.glow }} />
            {FRAGMENTS.map((f, i) => (
              <div
                key={i}
                className="ub-frag absolute inset-0"
                style={
                  {
                    clipPath: f.clip,
                    WebkitClipPath: f.clip,
                    "--fx": `${f.x}px`,
                    "--fy": `${f.y}px`,
                    "--fr": `${f.rot}deg`,
                    animationDelay: `${UPGRADE_SHATTER_AT / 1000 + f.delay}s`,
                  } as CSSProperties
                }
              >
                <CrystalIcon def={from} className="h-full w-full" />
              </div>
            ))}
            {/* трещины */}
            <svg viewBox="0 0 100 100" className="ub-cracks pointer-events-none absolute inset-0 h-full w-full" fill="none">
              {CRACKS.map((d, i) => (
                <path key={i} d={d} pathLength={1} className="ub-crack" style={at(0.45 + i * 0.07)} />
              ))}
              <path d={RING} pathLength={1} className="ub-crack" style={at(0.95)} />
              <circle cx={C.x} cy={C.y} r="2.4" className="ub-impact" style={at(0.4)} />
            </svg>
            {/* блики на стекле */}
            <div className="ub-glint pointer-events-none absolute inset-0" />
          </div>
        </div>

        {/* ударная волна и стеклянные осколки */}
        <div className="absolute left-1/2 top-1/2">
          <span className="ub-ring absolute rounded-full" />
          <span className="ub-ring ub-ring-2 absolute rounded-full" />
          {SHARDS.map((s, i) => (
            <span
              key={i}
              className="ub-shard absolute"
              style={
                {
                  width: s.w,
                  height: s.h,
                  marginLeft: -s.w / 2,
                  marginTop: -s.h / 2,
                  clipPath: `polygon(${s.tri.map((p) => `${p[0]}% ${p[1]}%`).join(",")})`,
                  "--sx": `${s.x}vmin`,
                  "--sy": `${s.y}vmin`,
                  "--sr": `${s.rot}deg`,
                  animationDelay: `${UPGRADE_SHATTER_AT / 1000 + s.delay}s`,
                } as CSSProperties
              }
            />
          ))}
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="ub-sparkle absolute rounded-full"
              style={
                {
                  width: s.s,
                  height: s.s,
                  marginLeft: -s.s / 2,
                  marginTop: -s.s / 2,
                  background: model?.glow ?? "#fff",
                  boxShadow: `0 0 12px 3px ${model?.glow ?? "#fff"}`,
                  "--px": `${s.x}vmin`,
                  "--py": `${s.y}vmin`,
                  animationDelay: `${UPGRADE_SHATTER_AT / 1000 + 0.1 + s.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* ── улучшенная модель с фоном ── */}
        <div className="ub-result absolute w-64 sm:w-72">
          <div
            className="overflow-hidden rounded-2xl p-1"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,.8), rgba(255,255,255,.15))",
              boxShadow: `0 0 60px 8px ${model?.glow ?? "#fff"}88`,
            }}
          >
            <CollectibleArt item={item} className="h-64 sm:h-72" />
          </div>
        </div>
      </div>

      {/* подпись */}
      <div className="ub-caption pointer-events-none absolute inset-x-0 bottom-[10%] px-4 text-center">
        <div className="rainbow-text text-2xl font-black sm:text-3xl">Улучшено!</div>
        {model && <div className="mt-1 text-sm text-white/80">{model.name}</div>}
      </div>
    </div>,
    document.body,
  );
}
