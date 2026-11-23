import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import CollectibleCard, { CollectibleArt } from "@/game/CollectibleCard";
import {
  CRAFT_PURE_CHANCE,
  CRAFT_SLOTS,
  MODEL_BY_ID,
  collectiblePrice,
  craftChance,
  craftPreview,
  craftShortfall,
  CRAFT_SKULL_CHANCE,
  BG_BY_ID,
  type Collectible,
} from "@/game/collectibles";
import { CRYSTAL_BY_ID, CrystalIcon } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";
import type { CraftOutcome } from "@/lib/store";

const LETTERS = ["a", "b", "c", "d", "e", "f"];

/** Крафт: 6 слотов, шанс успеха — (занятые слоты) к 6 */
export default function CraftView() {
  const { save, craft } = useApp();
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(CRAFT_SLOTS).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  const [outcome, setOutcome] = useState<CraftOutcome | null>(null);
  const [seed, setSeed] = useState(0);
  const timer = useRef<number>(0);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  const owned = save?.collectibles ?? [];
  // убираем из слотов то, чего уже нет в коллекции
  const placed = useMemo(() => slots.map((u) => owned.find((c) => c.uid === u) ?? null), [slots, owned]);
  const free = owned.filter((c) => !slots.includes(c.uid));
  const items = placed.filter((c): c is Collectible => !!c);
  const count = items.length;
  const sum = items.reduce((s, c) => s + collectiblePrice(c), 0);
  const chance = craftChance(count);
  const preview = useMemo(() => craftPreview(sum, seed), [sum, seed]);
  // нет подходящего кристалла по цене: результат будет дешевле суммы вложенных
  const shortfall = useMemo(() => craftShortfall(sum), [sum]);

  if (!save) return null;

  const put = (uid: string) => {
    const i = slots.findIndex((u, idx) => !placed[idx] || u === null);
    if (i < 0) return;
    sfx.click();
    setError(null);
    setSlots((s) => s.map((x, idx) => (idx === i ? uid : x)));
  };
  const take = (i: number) => {
    sfx.click();
    setConfirm(false);
    setSlots((s) => s.map((x, idx) => (idx === i ? null : x)));
  };

  const start = async () => {
    if (!count || working) return;
    if (!confirm) {
      sfx.click();
      setConfirm(true);
      return;
    }
    setConfirm(false);
    const animate = !document.body.classList.contains("no-anim");
    // Звук запускаем СРАЗУ, в том же тике клика — до расчёта и перерисовки (раньше он ждал результата крафта)
    if (animate) sfx.craft();
    const r = await craft(items.map((c) => c.uid));
    if (!r.ok) {
      sfx.stopCraft();
      sfx.deny();
      setError(r.error);
      return;
    }
    setError(null);
    setSlots(Array(CRAFT_SLOTS).fill(null));
    const finish = () => {
      setWorking(false);
      setOutcome(r.outcome);
      if (r.outcome.success) sfx.reveal(6, true);
      else sfx.deny();
    };
    if (!animate) {
      finish();
    } else {
      setWorking(true);
      timer.current = window.setTimeout(finish, 2200);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">🔨 Крафт</h1>
        <p className="mt-1 text-slate-400">
          Положите в слоты свои коллекционные кристаллы. С шансом «занятых слотов к {CRAFT_SLOTS}» вы получите более крутой
          кристалл, цена которого примерно равна сумме цен всех вложенных. В крафте рождается кристалл{" "}
          <b className="text-white">«{CRYSTAL_BY_ID.chess.name}»</b> и самый дорогой кристалл{" "}
          <b className="text-white">«{CRYSTAL_BY_ID.skull.name}»</b> — получить их можно только здесь.
        </p>
      </div>

      {/* Слоты */}
      <section className="panel space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((_, i) => {
            const c = placed[i];
            return c ? (
              <div key={i} className="pop-in relative rounded-2xl border border-white/15 bg-white/[0.05] p-2">
                <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  слот {LETTERS[i]}
                </span>
                <button
                  type="button"
                  onClick={() => take(i)}
                  className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition hover:bg-rose-500"
                  aria-label="Убрать из слота"
                  title="Убрать из слота"
                >
                  ✕
                </button>
                <CollectibleArt item={c} className="h-28" />
                <div className="mt-1.5 px-1">
                  <div className="text-sm font-bold leading-tight" style={{ color: MODEL_BY_ID[c.model]?.glow }}>
                    {MODEL_BY_ID[c.model]?.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-200">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {collectiblePrice(c).toLocaleString("ru-RU")}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="flex h-[10.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 text-slate-500"
              >
                <span className="text-3xl leading-none">＋</span>
                <span className="text-xs uppercase tracking-wider">слот {LETTERS[i]} · пусто</span>
              </div>
            );
          })}
        </div>

        {/* Формула */}
        <div className="rounded-xl bg-black/25 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-slate-300">
            {LETTERS.map((l, i) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className={placed[i] ? "text-white" : "text-slate-600"}>
                  {placed[i] ? 1 : 0}
                  {l}
                </span>
                {i < LETTERS.length - 1 && <span className="text-slate-600">+</span>}
              </span>
            ))}
            <span className="text-slate-500">≈</span>
            <span className="font-bold text-amber-200">{count}p</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-300">
            <span className="flex items-center gap-1.5">
              Цена результата ≈
              <b className="flex items-center gap-1 text-amber-200">
                <CoinIcon className="h-4 w-4" />
                {sum.toLocaleString("ru-RU")}
              </b>
            </span>
            <span>
              Шанс успеха:{" "}
              <b className="text-white">
                {count} к {CRAFT_SLOTS}
              </b>{" "}
              <span className="text-slate-500">({Math.round(chance * 100)}%)</span>
            </span>
          </div>
        </div>

        {/* Предпросмотр: 3 кристалла по цене, которую собрал игрок */}
        <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">🔮 Предпросмотр результата</h3>
              <p className="text-xs text-slate-500">
                Примеры кристаллов, которые могут выпасть за {count ? sum.toLocaleString("ru-RU") : "—"} монет
              </p>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setSeed((v) => v + 1);
                }}
                className="btn btn-ghost !px-3 !py-1.5 text-xs"
              >
                🔄 Другие варианты
              </button>
            )}
          </div>
          {shortfall && (
            <div className="mb-3 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-200">
              <div className="font-bold">⚠️ Нет подходящих вариантов</div>
              <p className="mt-0.5 text-xs leading-snug text-amber-100/80">
                Вы уверены, что хотите получить подарок ниже стоимости группы ваших кристаллов? Сумма вложенных —{" "}
                <b>{sum.toLocaleString("ru-RU")}</b> монет, а лучший доступный результат стоит не больше{" "}
                <b>{shortfall.best.toLocaleString("ru-RU")}</b> (минус {(sum - shortfall.best).toLocaleString("ru-RU")}).
              </p>
            </div>
          )}
          {preview.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 px-4 py-5 text-center text-sm text-slate-500">
              Положите кристаллы в слоты — здесь появятся 3 кристалла по их суммарной цене.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {preview.map((c) => {
                const m = MODEL_BY_ID[c.model];
                return (
                  <div key={c.uid} className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                    <CollectibleArt item={c} className="h-20 sm:h-28" />
                    <div className="mt-1 px-0.5">
                      <div className="truncate text-xs font-bold leading-tight sm:text-sm" style={{ color: m?.glow }}>
                        {m?.name}
                      </div>
                      <div className="truncate text-[10px] uppercase tracking-wider text-violet-200/50">
                        Фон: {BG_BY_ID[c.bg]?.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-200">
                        <CoinIcon className="h-3.5 w-3.5" />
                        {collectiblePrice(c).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

        <button
          type="button"
          onClick={start}
          disabled={!count || working}
          className={`w-full rounded-xl px-4 py-3 text-lg font-extrabold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
            confirm ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950 hover:brightness-110"
          }`}
        >
          {confirm
            ? shortfall
              ? `Нет подходящих вариантов — подарок будет ниже стоимости! Точно? (при неудаче сгорит ${Math.round((1 - chance) * 100)}%)`
              : `Точно? При неудаче вложенное сгорит (${Math.round((1 - chance) * 100)}%)`
            : "🔨 Крафтить"}
        </button>
        <p className="text-center text-xs text-slate-500">
          При неудаче все вложенные кристаллы пропадают. Иногда (≈{Math.round(CRAFT_PURE_CHANCE * 100)}%) вместо готового
          кристалла выпадает «чистый» кристалл «{CRYSTAL_BY_ID.chess.name}» (а с шансом ≈{Math.round(CRAFT_SKULL_CHANCE * 100)}% — «{CRYSTAL_BY_ID.skull.name}») — его можно улучшить во вкладке «Инвентарь».
        </p>
      </section>

      {/* Выбор кристаллов */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
          Мои коллекционные кристаллы <span className="ml-2 text-violet-200/35">{free.length}</span>
        </h2>
        {owned.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            У вас пока нет коллекционных кристаллов. Выбейте «???» из сундука и улучшите его во вкладке «Инвентарь».
          </div>
        ) : free.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-6 text-center text-sm text-violet-200/50">
            Все ваши кристаллы уже лежат в слотах.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {free.map((c) => (
              <button
                key={c.uid}
                type="button"
                disabled={count >= CRAFT_SLOTS}
                onClick={() => put(c.uid)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-left transition hover:bg-white/[0.09] disabled:opacity-40"
              >
                <CollectibleArt item={c} className="h-24" />
                <div className="mt-1.5 px-1">
                  <div className="text-sm font-bold leading-tight" style={{ color: MODEL_BY_ID[c.model]?.glow }}>
                    {MODEL_BY_ID[c.model]?.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-200">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {collectiblePrice(c).toLocaleString("ru-RU")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Анимация крафта */}
      {working && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm">
          <div className="relative h-36 w-36">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-dashed border-fuchsia-400/70" style={{ animationDuration: "1.6s" }} />
            <div className="absolute inset-4 animate-spin rounded-full border-4 border-dotted border-cyan-300/70" style={{ animationDuration: "2.4s", animationDirection: "reverse" }} />
            <CrystalIcon def={CRYSTAL_BY_ID.chess} className="float absolute inset-9 h-[72px] w-[72px]" />
          </div>
          <div className="rainbow-text animate-pulse text-xl font-extrabold">Кристаллы сливаются…</div>
        </div>
      )}

      {/* Результат */}
      {outcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setOutcome(null)}>
          <div className="anim-reveal w-full max-w-xs space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            {outcome.success ? (
              <>
                <div className="rainbow-text text-lg font-extrabold">Крафт удался!</div>
                {outcome.item && <CollectibleCard item={outcome.item} />}
                {outcome.pure && (
                  <div className="panel space-y-2 p-5">
                    <CrystalIcon def={CRYSTAL_BY_ID[outcome.pure]} className="mx-auto h-24 w-24" />
                    <div className="font-bold text-white">{CRYSTAL_BY_ID[outcome.pure].name}</div>
                    <p className="text-xs text-slate-400">Редкий исход: «чистый» кристалл. Он лежит в инвентаре — его можно улучшить.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="panel space-y-2 p-6">
                <div className="text-4xl">💥</div>
                <div className="text-lg font-extrabold text-rose-300">Крафт не удался</div>
                <p className="text-sm text-slate-400">
                  Шанс был {outcome.count} к {CRAFT_SLOTS}. Вложенные кристаллы (на {outcome.sum.toLocaleString("ru-RU")} монет) сгорели.
                </p>
              </div>
            )}
            <button onClick={() => setOutcome(null)} className="btn w-full">
              Окей
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
