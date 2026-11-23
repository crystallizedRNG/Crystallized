import { createPortal } from "react-dom";
import { CrystalIcon, type CrystalDef } from "./crystals";

/** Общая длительность кинематографичной анимации секретного кристалла, мс */
export const MYTHIC_DURATION = 8000;
/** Момент вспышки (кристалл появляется), мс */
export const MYTHIC_FLASH_AT = 3500;

/* детерминированный «рандом», чтобы частицы не менялись при перерисовке */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const r = rng(77);
const STARS = Array.from({ length: 70 }, () => ({
  x: r() * 100,
  y: r() * 100,
  s: 1 + r() * 2.4,
  d: r() * 3,
  t: 1.5 + r() * 2.5,
}));

/** Частицы, которые стягиваются к центру перед вспышкой */
const SUCK = Array.from({ length: 44 }, (_, i) => {
  const a = r() * Math.PI * 2;
  const dist = 38 + r() * 34; // vmin
  return {
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist,
    delay: 0.5 + (i / 44) * 2.6 + r() * 0.3,
    size: 3 + r() * 5,
    hue: Math.floor(r() * 360),
  };
});

/** Разноцветный взрыв искр */
const SPARKS = Array.from({ length: 56 }, (_, i) => {
  const a = (i / 56) * Math.PI * 2 + r() * 0.2;
  const dist = 16 + r() * 36;
  return {
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist * 0.85,
    size: 3 + r() * 6,
    hue: (i * 29) % 360,
    delay: r() * 0.25,
  };
});

/** Медленно поднимающиеся огоньки на финале */
const EMBERS = Array.from({ length: 30 }, () => ({
  x: r() * 100,
  size: 2 + r() * 5,
  dur: 2.4 + r() * 2.4,
  delay: 4.4 + r() * 2.2,
  hue: Math.floor(r() * 360),
}));

const RINGS = [0, 0.22, 0.46];

interface Props {
  crystal: CrystalDef;
  isNew: boolean;
}

export default function MythicReveal({ crystal, isNew }: Props) {
  const letters = Array.from(crystal.name);

  return createPortal(
    <div className="mythic-root fixed inset-0 z-[100] overflow-hidden" role="presentation">
      {/* Тьма + космос */}
      <div className="mythic-bg absolute inset-0" />
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="mythic-star absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              animationDuration: `${s.t}s`,
              animationDelay: `${s.d}s`,
            }}
          />
        ))}
      </div>

      {/* Виньетка с биением сердца */}
      <div className="mythic-vignette pointer-events-none absolute inset-0" />

      {/* Всё содержимое трясётся всё сильнее */}
      <div className="mythic-quake absolute inset-0">
        {/* Радужные лучи после вспышки */}
        <div className="mythic-rays absolute left-1/2 top-[44%] h-[170vmax] w-[170vmax]">
          <div className="rays-fast h-full w-full" />
        </div>

        {/* Стягивающиеся частицы */}
        <div className="absolute left-1/2 top-[44%]">
          {SUCK.map((p, i) => (
            <span
              key={i}
              className="mythic-suck absolute rounded-full"
              style={
                {
                  "--x": `${p.x}vmin`,
                  "--y": `${p.y}vmin`,
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  background: `hsl(${p.hue} 100% 75%)`,
                  boxShadow: `0 0 12px 3px hsl(${p.hue} 100% 65%)`,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Сингулярность */}
        <div className="absolute left-1/2 top-[44%]">
          <div className="mythic-orb" />
          <div className="mythic-orb-halo" />
        </div>

        {/* Ударные волны */}
        <div className="absolute left-1/2 top-[44%]">
          {RINGS.map((d, i) => (
            <span key={i} className="mythic-ring absolute rounded-full" style={{ animationDelay: `${3.5 + d}s` }} />
          ))}
        </div>

        {/* Искры */}
        <div className="absolute left-1/2 top-[44%]">
          {SPARKS.map((p, i) => (
            <span
              key={i}
              className="mythic-spark absolute rounded-full"
              style={
                {
                  "--x": `${p.x}vmin`,
                  "--y": `${p.y}vmin`,
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  background: `hsl(${p.hue} 100% 78%)`,
                  boxShadow: `0 0 14px 4px hsl(${p.hue} 100% 62%)`,
                  animationDelay: `${3.55 + p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Кристалл */}
        <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
          <div className="mythic-crystal">
            <div className="float">
              <CrystalIcon def={crystal} className="h-44 w-44 sm:h-56 sm:w-56" />
            </div>
          </div>
        </div>

        {/* Мерцающее «???» во время нагнетания */}
        <div className="mythic-glitch pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-7xl font-black tracking-[0.2em] text-white sm:text-9xl">
          ???
        </div>
      </div>

      {/* Плавающие огоньки на финале */}
      <div className="pointer-events-none absolute inset-0">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="mythic-ember absolute bottom-0 rounded-full"
            style={{
              left: `${e.x}%`,
              width: e.size,
              height: e.size,
              background: `hsl(${e.hue} 100% 78%)`,
              boxShadow: `0 0 10px 2px hsl(${e.hue} 100% 65%)`,
              animationDuration: `${e.dur}s`,
              animationDelay: `${e.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Белая вспышка */}
      <div className="mythic-flash pointer-events-none absolute inset-0 bg-white" />

      {/* Подпись */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] flex flex-col items-center gap-3 px-4 text-center">
        <div className="mythic-fade-1 flex items-center gap-2">
          <span className="rainbow-pill rounded-full px-5 py-1 text-lg font-black uppercase tracking-[0.4em]">???</span>
          {isNew && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase text-amber-950">Новый!</span>
          )}
        </div>
        <div className="hue-cycle text-3xl font-black sm:text-5xl" aria-label={crystal.name}>
          {letters.map((ch, i) => (
            <span
              key={i}
              className="mythic-letter inline-block"
              style={{
                animationDelay: `${5.1 + i * 0.08}s`,
                color: `hsl(${(i * 24) % 360} 100% 78%)`,
                textShadow: `0 0 18px hsl(${(i * 24) % 360} 100% 60%)`,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </div>
        <div className="mythic-fade-2 max-w-md text-sm text-violet-100/70 sm:text-base">{crystal.description}</div>
      </div>
    </div>,
    document.body,
  );
}
