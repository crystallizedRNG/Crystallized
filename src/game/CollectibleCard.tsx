import type { CSSProperties, ReactNode } from "react";
import { CrystalArt } from "./crystals";
import { BG_BY_ID, MODEL_BY_ID, modelDef, priceParts, type Collectible } from "./collectibles";
import { CoinIcon } from "./icons";

const SPARKS = [
  { x: "14%", y: "22%", d: "0s", s: 10 },
  { x: "80%", y: "18%", d: "0.7s", s: 14 },
  { x: "70%", y: "70%", d: "1.4s", s: 9 },
  { x: "22%", y: "74%", d: "2.1s", s: 12 },
  { x: "50%", y: "10%", d: "1.1s", s: 8 },
];

/** Анимированная плитка коллекционного кристалла: движущийся фон, плавающий кристалл, блик и искры */
export function CollectibleArt({ item, className = "h-36" }: { item: Collectible; className?: string }) {
  const model = MODEL_BY_ID[item.model];
  const bg = BG_BY_ID[item.bg];
  if (!model || !bg) return null;
  return (
    <div
      className={`col-bg col-shine relative flex w-full items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={
        bg.pattern === "checker"
          ? {
              backgroundImage: "conic-gradient(#0f172a 25%, #f8fafc 0 50%, #0f172a 0 75%, #f8fafc 0)",
              backgroundSize: "36px 36px",
              animation: "none",
            }
          : { backgroundImage: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]}, ${bg.colors[0]})` }
      }
    >
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="col-spark absolute"
          style={{ left: s.x, top: s.y, width: s.s, height: s.s, animationDelay: s.d, background: bg.spark }}
        />
      ))}
      <svg
        viewBox="-10 0 120 120"
        className={`${model.rare ? "col-model-modern" : "col-model"} relative h-4/5`}
        style={{ "--glow": `${model.glow}cc` } as CSSProperties}
      >
        <CrystalArt def={modelDef(model)} />
      </svg>
    </div>
  );
}

/** Карточка коллекционного кристалла: плитка, названия, разбор цены: кристалл + модель + фон + бонус */
export default function CollectibleCard({
  item,
  footer,
  showPrice = true,
}: {
  item: Collectible;
  footer?: ReactNode;
  showPrice?: boolean;
}) {
  const model = MODEL_BY_ID[item.model];
  const bg = BG_BY_ID[item.bg];
  if (!model || !bg) return null;
  const parts = priceParts(item);
  return (
    <div className="pop-in flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
      <CollectibleArt item={item} />
      <div className="px-1">
        <div className="font-bold leading-tight" style={{ color: model.glow }}>
          {model.name}
          {model.rare && (
            <span className="ml-1.5 rounded bg-cyan-400/20 px-1 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-cyan-200">
              редкая
            </span>
          )}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-violet-200/50">
          Фон: {bg.name}
          {parts.mono && !parts.superBonus && <span className="ml-1.5 font-bold text-emerald-300">· монохром</span>}
          {parts.superBonus && <span className="super-bonus ml-1.5 font-extrabold text-amber-300">· СУПЕР БОНУС</span>}
        </div>
        {showPrice && (
          <>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm font-extrabold text-amber-200">
              <CoinIcon className="h-4 w-4" />
              {parts.p.toLocaleString("ru-RU")}
            </div>
            <div className="text-[10px] leading-tight text-slate-500">
              кристалл {parts.c.toLocaleString("ru-RU")} + модель {parts.m.toLocaleString("ru-RU")} + фон{" "}
              {parts.t.toLocaleString("ru-RU")}
              {parts.mono && (
                <span className={parts.superBonus ? "font-bold text-amber-300" : "text-emerald-300"}>
                  {" "}
                  + {parts.superBonus ? "супербонус" : "бонус"} {parts.bonus.toLocaleString("ru-RU")}
                </span>
              )}
            </div>
          </>
        )}
      </div>
      {footer}
    </div>
  );
}

/** Маленький коллекционный кристалл рядом с именем игрока */
export function MiniCollectible({ item, size = 22 }: { item?: Collectible | null; size?: number }) {
  if (!item) return null;
  const model = MODEL_BY_ID[item.model];
  const bg = BG_BY_ID[item.bg];
  if (!model || !bg) return null;
  return (
    <span
      className="mx-1 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md align-[-0.3em]"
      title={`${model.name} · фон «${bg.name}»`}
      style={{
        width: size,
        height: size,
        backgroundImage:
          bg.pattern === "checker"
            ? "conic-gradient(#0f172a 25%, #f8fafc 0 50%, #0f172a 0 75%, #f8fafc 0)"
            : `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})`,
        backgroundSize: bg.pattern === "checker" ? "8px 8px" : undefined,
        boxShadow: `0 0 8px ${model.glow}77`,
      }}
    >
      <svg viewBox="-10 0 120 120" style={{ width: size * 0.85, height: size * 0.85 }}>
        <CrystalArt def={modelDef(model)} />
      </svg>
    </span>
  );
}

const BACKDROP_SPARKS = [
  { x: "8%", y: "16%", d: "0s", s: 22 },
  { x: "86%", y: "12%", d: "0.9s", s: 30 },
  { x: "72%", y: "58%", d: "1.7s", s: 20 },
  { x: "18%", y: "66%", d: "2.4s", s: 26 },
  { x: "48%", y: "8%", d: "1.2s", s: 16 },
  { x: "92%", y: "80%", d: "0.4s", s: 24 },
  { x: "34%", y: "88%", d: "2s", s: 18 },
  { x: "58%", y: "40%", d: "2.8s", s: 14 },
];

/**
 * Мерцающий фон профиля — повторяет фон коллекционного кристалла, который игрок поставил в профиль:
 * тот же градиент, переливание, блик и искры. Лежит под содержимым страницы.
 */
export function ProfileBackdrop({ item }: { item?: Collectible | null }) {
  if (!item) return null;
  const bg = BG_BY_ID[item.bg];
  if (!bg) return null;
  const checker = bg.pattern === "checker";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="col-bg prof-bg-pulse col-shine absolute inset-0"
        style={
          checker
            ? {
                backgroundImage: "conic-gradient(#0f172a 25%, #f8fafc 0 50%, #0f172a 0 75%, #f8fafc 0)",
                backgroundSize: "64px 64px",
                animation: "none",
              }
            : { backgroundImage: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]}, ${bg.colors[0]})` }
        }
      >
        {BACKDROP_SPARKS.map((s, i) => (
          <span
            key={i}
            className="col-spark absolute"
            style={{ left: s.x, top: s.y, width: s.s, height: s.s, animationDelay: s.d, background: bg.spark }}
          />
        ))}
      </div>
      {/* затемнение, чтобы текст оставался читаемым */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />
    </div>
  );
}
