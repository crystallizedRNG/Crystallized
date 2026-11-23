
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/router";
import { useApp } from "@/components/AppProvider";
import Chest, { type Phase } from "./Chest";
import { CrystalIcon, isSecret, type CrystalDef } from "./crystals";
import MythicReveal, { MYTHIC_DURATION, MYTHIC_FLASH_AT } from "./MythicReveal";
import { CHESTS, CHEST_BY_ID, FIRST_DROP_MULT, crystalsOf, totalChests, type ChestId, type OpenResult, type Save } from "./game";
import { ChestIcon, CoinIcon } from "./icons";
import { sfx } from "./sound";
import { cn } from "./utils/cn";

export default function ChestsTab() {
  const { save } = useApp();
  if (!save) return null;
  return <ChestsView save={save} />;
}

function ChestsView({ save }: { save: Save }) {
  const { buy: onBuy, open: onOpen } = useApp();
  const router = useRouter();
  const onGoProfile = () => router.push("/inventory");
  const pending = useRef(false);
  const [selected, setSelected] = useState<ChestId>("wooden");
  const [openedWith, setOpenedWith] = useState<ChestId>("wooden");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CrystalDef | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [mythic, setMythic] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const busy = phase === "closing" || phase === "shaking" || phase === "opening";
  const showTheme = CHEST_BY_ID[phase === "idle" ? selected : openedWith].theme;
  const owned = save.chests[selected];
  const totalOwned = totalChests(save);

  const begin = async (id: ChestId) => {
    if (pending.current) return;
    pending.current = true;
    let res: OpenResult | null = null;
    try {
      res = await onOpen(id);
    } finally {
      pending.current = false;
    }
    if (!res) {
      setPhase("idle");
      return;
    }
    setOpenedWith(id);
    setResult(res.crystal);
    setIsNew(res.isNew);
    setPhase("shaking");
    // Секретный кристалл — особая 8-секундная анимация
    if (isSecret(res.crystal) && !document.body.classList.contains("no-anim")) {
      setMythic(true);
      sfx.mythic();
      later(() => {
        setPhase("opening");
        setBurstKey((k) => k + 1);
      }, MYTHIC_FLASH_AT);
      later(() => {
        setPhase("revealed");
        setMythic(false);
      }, MYTHIC_DURATION);
      return;
    }
    sfx.shake();
    later(() => {
      setPhase("opening");
      setBurstKey((k) => k + 1);
      sfx.open();
    }, 900);
    later(() => sfx.reveal(res.crystal.tier, res.isNew), 1450);
    later(() => setPhase("revealed"), 2100);
  };

  const handleOpen = () => {
    if (busy || owned < 1) return;
    if (phase === "revealed") {
      setPhase("closing");
      sfx.close();
      later(() => void begin(selected), 650);
    } else {
      void begin(selected);
    }
  };

  const handleSelect = (id: ChestId) => {
    if (busy || id === selected) return;
    sfx.select();
    setSelected(id);
    if (phase === "revealed") {
      setPhase("idle");
      setResult(null);
    }
  };

  const showResult = phase === "revealed" && result;
  const bonusPrice = result ? result.price * FIRST_DROP_MULT : 0;

  return (
    <div className="flex flex-col items-center">
      {mythic && result && <MythicReveal crystal={result} isNew={isNew} />}
      <div className="mt-2">
        <Chest phase={phase} crystal={result} burstKey={burstKey} theme={showTheme} />
      </div>

      {/* Результат */}
      <div className="-mt-4 flex min-h-[132px] flex-col items-center text-center">
        {showResult ? (
          <div key={burstKey} className="pop-in flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-widest",
                  isSecret(result) && "rainbow-pill border-transparent",
                )}
                style={
                  isSecret(result)
                    ? undefined
                    : {
                        color: result.glow,
                        borderColor: `${result.glow}77`,
                        background: `${result.glow}1f`,
                      }
                }
              >
                {result.rarity}
              </span>
              {isNew && (
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold uppercase text-amber-950">
                  Новый!
                </span>
              )}
            </div>
            <div
              className={cn("text-3xl font-bold", isSecret(result) && "rainbow-text")}
              style={isSecret(result) ? undefined : { color: result.glow, textShadow: `0 0 20px ${result.glow}88` }}
            >
              {result.name}
            </div>
            <div className="max-w-xs text-sm text-violet-100/60">{result.description}</div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-200">
              <CoinIcon className="h-4 w-4" />
              {isNew ? (
                <span>
                  {bonusPrice}{" "}
                  <span className="text-xs font-medium text-amber-300/70">
                    (бонус ×{FIRST_DROP_MULT} за первое выпадение)
                  </span>
                </span>
              ) : (
                <span>{result.price}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-xs pt-6 text-violet-200/50">
            {busy
              ? "Открываем…"
              : owned < 1
                ? "У вас нет такого сундука. Купите его ниже!"
                : "Нажмите «Открыть», чтобы испытать удачу"}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={handleOpen}
          disabled={busy || owned < 1}
          className={cn(
            "open-btn rounded-2xl px-14 py-4 text-xl font-extrabold uppercase tracking-wider text-amber-950 shadow-lg transition",
            "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-amber-500/30",
            "hover:scale-105 hover:shadow-amber-400/50 active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
          )}
        >
          Открыть
          <span className="ml-2 text-base font-bold opacity-70">×{owned}</span>
        </button>
        {showResult && (
          <button
            onClick={onGoProfile}
            className="text-sm text-violet-300/70 underline-offset-4 transition hover:text-violet-200 hover:underline"
          >
            Перейти в инвентарь, чтобы продать →
          </button>
        )}
      </div>

      {/* Магазин */}
      <section className="mt-12 w-full">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
          Магазин сундуков
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {CHESTS.map((c) => {
            const active = c.id === selected;
            const can = save.coins >= c.price;
            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-2xl border bg-white/[0.04] p-4 backdrop-blur transition",
                  "hover:bg-white/[0.07]",
                  busy && "cursor-not-allowed",
                )}
                style={{
                  borderColor: active ? `${c.theme.accent}aa` : "rgba(255,255,255,0.08)",
                  boxShadow: active ? `0 0 28px ${c.theme.accent}33` : undefined,
                }}
              >
                {save.chests[c.id] > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                    ×{save.chests[c.id]}
                  </span>
                )}
                <ChestIcon theme={c.theme} className="h-20 w-24" />
                <div className="mt-1 font-bold" style={{ color: c.theme.accent }}>
                  {c.name}
                </div>
                <div className="mt-0.5 text-center text-xs text-violet-100/50">{c.description}</div>

                <div className="mt-3 flex w-full flex-col gap-1">
                  {crystalsOf(c).map((cr) => {
                    const hidden = isSecret(cr) && save.found[cr.id] === 0;
                    return (
                      <div key={cr.id} className="flex items-center gap-2 text-xs">
                        <CrystalIcon def={cr} locked={hidden} className="h-5 w-5 shrink-0" />
                        <span
                          className={cn("truncate", isSecret(cr) && !hidden && "rainbow-text")}
                          style={isSecret(cr) ? undefined : { color: cr.glow }}
                        >
                          {hidden ? <span className="rainbow-text font-black tracking-widest">???</span> : cr.name}
                        </span>
                        <span className="ml-auto font-semibold text-white/80">{c.odds[cr.id]}%</span>
                      </div>
                    );
                  })}
                  </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (await onBuy(c.id)) sfx.buy();
                    else sfx.deny();
                  }}
                  aria-disabled={!can}
                  className={cn(
                    "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                    can
                      ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 active:scale-95"
                      : "bg-white/10 text-white/35 hover:bg-white/15",
                  )}
                >
                  Купить за {c.price}
                  <CoinIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-violet-200/40">
          Всего сундуков в запасе: {totalOwned}
        </p>
      </section>
    </div>
  );
}
