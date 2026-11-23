import { CrystalArt, type CrystalDef } from "./crystals";
import type { ChestTheme } from "./game";
import { cn } from "./utils/cn";

export type Phase = "idle" | "closing" | "shaking" | "opening" | "revealed";

interface Props {
  phase: Phase;
  crystal: CrystalDef | null;
  burstKey: number;
  theme: ChestTheme;
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2 + (i % 2) * 0.15;
  const dist = 110 + (i % 4) * 28;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.85 - 30,
    size: 4 + (i % 3) * 3,
    delay: (i % 5) * 0.03,
  };
});

export default function Chest({ phase, crystal, burstKey, theme }: Props) {
  const open = phase === "opening" || phase === "revealed";
  const glow = crystal?.glow ?? theme.accent;

  return (
    <div className="relative mx-auto h-[400px] w-[300px] select-none">
      {/* Лучи света */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[30%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{
          maskImage: "radial-gradient(circle, black 0%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 68%)",
        }}
      >
        <div
          className="rays h-full w-full"
          style={{
            background: `repeating-conic-gradient(from 0deg, color-mix(in srgb, ${glow} 38%, transparent) 0deg 7deg, transparent 7deg 24deg)`,
          }}
        />
      </div>
      {/* Мягкое свечение */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700",
          open ? "opacity-60" : "opacity-0",
        )}
        style={{ background: glow }}
      />

      {/* Частицы */}
      {burstKey > 0 && (
        <div key={burstKey} className="pointer-events-none absolute left-1/2 top-[34%]">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="burst absolute rounded-full"
              style={
                {
                  "--x": `${p.x}px`,
                  "--y": `${p.y}px`,
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  background: i % 3 === 0 ? "#fff" : glow,
                  boxShadow: `0 0 10px 2px ${glow}`,
                  animationDelay: `${0.1 + p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Сундук */}
      <div className={cn("absolute inset-0", phase === "shaking" && "chest-shake")}>
        <svg viewBox="0 -120 240 320" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={theme.wood[0]} />
              <stop offset="1" stopColor={theme.wood[1]} />
            </linearGradient>
            <linearGradient id="lidWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={theme.lid[0]} />
              <stop offset="1" stopColor={theme.lid[1]} />
            </linearGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={theme.lock[0]} />
              <stop offset="0.5" stopColor={theme.lock[1]} />
              <stop offset="1" stopColor={theme.lock[2]} />
            </linearGradient>
            <linearGradient id="iron" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={theme.iron[0]} />
              <stop offset="0.5" stopColor={theme.iron[1]} />
              <stop offset="1" stopColor={theme.iron[2]} />
            </linearGradient>
            <radialGradient id="inside">
              <stop offset="0" stopColor="currentColor" stopOpacity="1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.25" />
            </radialGradient>
            <clipPath id="lidClip">
              <path d="M30 90 V62 Q30 26 120 26 Q210 26 210 62 V90 Z" />
            </clipPath>
          </defs>

          {/* Тень */}
          <ellipse cx="120" cy="195" rx="108" ry="10" fill="rgba(0,0,0,0.45)" />

          {/* Внутренность */}
          <ellipse cx="120" cy="84" rx="88" ry="13" fill="#1a0e06" />
          <ellipse
            cx="120"
            cy="84"
            rx="84"
            ry="11"
            fill="url(#inside)"
            style={{ color: glow, opacity: open ? 1 : 0, transition: "opacity .5s" }}
          />

          {/* Крышка (позади кристалла) */}
          <g className={cn("lid", open && "open")}>
            <path d="M30 90 V62 Q30 26 120 26 Q210 26 210 62 V90 Z" fill="url(#lidWood)" />
            <g clipPath="url(#lidClip)">
              <path d="M30 52 H210" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
              <path d="M30 70 H210" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
              <rect x="52" y="20" width="16" height="75" fill="url(#iron)" />
              <rect x="172" y="20" width="16" height="75" fill="url(#iron)" />
              <rect x="30" y="80" width="180" height="10" fill="url(#iron)" />
              <path
                d="M40 60 Q44 36 120 32"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <rect x="110" y="72" width="20" height="20" rx="3" fill="url(#gold)" />
          </g>

          {/* Кристалл */}
          {crystal && (
            <g className={cn("crystal-rise", open && "out")}>
              <g
                className={cn(phase === "revealed" && "float")}
                style={{ filter: `drop-shadow(0 0 14px ${crystal.glow})` }}
              >
                <g transform="translate(85 90) scale(.7)" className={cn(crystal.tier >= 7 && "hue-cycle")}>
                  <CrystalArt def={crystal} />
                </g>
              </g>
            </g>
          )}

          {/* Передняя часть корпуса */}
          <g>
            <rect x="30" y="84" width="180" height="108" rx="9" fill="url(#wood)" />
            <path d="M30 122 H210" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
            <path d="M30 158 H210" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
            <rect x="52" y="84" width="16" height="108" fill="url(#iron)" />
            <rect x="172" y="84" width="16" height="108" fill="url(#iron)" />
            <rect x="30" y="84" width="180" height="9" fill="url(#iron)" />
            <rect x="30" y="178" width="180" height="14" rx="6" fill="url(#iron)" />
            {[96, 130, 166].map((y) =>
              [60, 180].map((x) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#e5e7eb" opacity="0.85" />
              )),
            )}
            {/* Замок */}
            <rect x="105" y="92" width="30" height="34" rx="5" fill="url(#gold)" stroke="#92400e" strokeWidth="1.5" />
            <circle cx="120" cy="105" r="4.5" fill="#451a03" />
            <path d="M118.2 107 L121.8 107 L123 117 L117 117 Z" fill="#451a03" />
          </g>

          {/* Свет из щели при тряске */}
          <rect
            x="34"
            y="83"
            width="172"
            height="3"
            rx="1.5"
            fill={glow}
            className={cn("seam", phase === "shaking" && "on")}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </svg>
      </div>
    </div>
  );
}
