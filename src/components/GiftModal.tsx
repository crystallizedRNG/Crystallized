import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { CollectibleArt } from "@/game/CollectibleCard";
import { MODEL_BY_ID, collectiblePrice } from "@/game/collectibles";
import { CRYSTALS, CrystalIcon, type CrystalId } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";

type Pick = { kind: "collectible"; uid: string } | { kind: "crystal"; id: CrystalId; bonus: boolean };

/** Окно подарка: можно подарить любой кристалл из инвентаря или коллекции */
export default function GiftModal({ target, onClose }: { target: { id: number; username: string }; onClose: () => void }) {
  const { save, gift, notify } = useApp();
  const [tab, setTab] = useState<"collectible" | "crystal">("collectible");
  const [pick, setPick] = useState<Pick | null>(null);
  const [amount, setAmount] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const crystals = useMemo(() => {
    if (!save) return [];
    return [...CRYSTALS]
      .sort((a, b) => b.price - a.price)
      .flatMap((def) => [
        ...(save.bonus[def.id] > 0 ? [{ def, bonus: true, count: save.bonus[def.id] }] : []),
        ...(save.plain[def.id] > 0 ? [{ def, bonus: false, count: save.plain[def.id] }] : []),
      ]);
  }, [save]);

  if (!save) return null;

  const max = pick?.kind === "crystal" ? (crystals.find((c) => c.def.id === pick.id && c.bonus === pick.bonus)?.count ?? 1) : 1;

  async function send() {
    if (!pick) return;
    setBusy(true);
    setError(null);
    const r = await gift(
      target.id,
      pick.kind === "collectible"
        ? { kind: "collectible", uid: pick.uid }
        : { kind: "crystal", id: pick.id, bonus: pick.bonus, amount: Number(amount) },
    );
    setBusy(false);
    if (r.ok) {
      sfx.buy();
      notify("🎁 Подарок отправлен");
      onClose();
    } else {
      sfx.deny();
      setError(r.error);
    }
  }

  const tabBtn = (t: "collectible" | "crystal", label: string, n: number) => (
    <button
      type="button"
      onClick={() => {
        setTab(t);
        setPick(null);
        setError(null);
      }}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
    >
      {label} <span className="text-xs text-slate-500">{n}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden !bg-[#12102a]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">🎁 Подарить игроку {target.username}</h2>
            <p className="text-xs text-slate-500">Выберите любой кристалл, который у вас есть. Подарок нельзя вернуть.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost !px-3 !py-1.5 text-sm" aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          <div className="flex w-full gap-1 rounded-xl bg-black/30 p-1">
            {tabBtn("collectible", "Коллекционные", save.collectibles.length)}
            {tabBtn("crystal", "Кристаллы", crystals.reduce((s, c) => s + c.count, 0))}
          </div>
        </div>

        <div className="min-h-[12rem] flex-1 overflow-y-auto px-5 py-4">
          {tab === "collectible" ? (
            save.collectibles.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">У вас нет коллекционных кристаллов.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {save.collectibles.map((c) => {
                  const active = pick?.kind === "collectible" && pick.uid === c.uid;
                  return (
                    <button
                      key={c.uid}
                      type="button"
                      onClick={() => setPick({ kind: "collectible", uid: c.uid })}
                      className={`flex flex-col gap-1.5 rounded-2xl border p-2 text-left transition ${
                        active ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                    >
                      <CollectibleArt item={c} className="h-24" />
                      <span className="px-1 text-sm font-bold leading-tight" style={{ color: MODEL_BY_ID[c.model]?.glow }}>
                        {MODEL_BY_ID[c.model]?.name}
                      </span>
                      <span className="flex items-center gap-1 px-1 text-xs font-semibold text-amber-200">
                        <CoinIcon className="h-3.5 w-3.5" />
                        {collectiblePrice(c).toLocaleString("ru-RU")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : crystals.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">В инвентаре нет кристаллов.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {crystals.map((e) => {
                const active = pick?.kind === "crystal" && pick.id === e.def.id && pick.bonus === e.bonus;
                return (
                  <button
                    key={`${e.def.id}-${e.bonus}`}
                    type="button"
                    onClick={() => {
                      setPick({ kind: "crystal", id: e.def.id, bonus: e.bonus });
                      setAmount("1");
                    }}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
                      active ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white">×{e.count}</span>
                    {e.bonus && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-950">бонус</span>
                    )}
                    <CrystalIcon def={e.def} className="mt-4 h-14 w-14" />
                    <span className="text-sm font-bold" style={{ color: e.def.glow }}>
                      {e.def.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-white/10 px-5 py-4">
          {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {pick?.kind === "crystal" && max > 1 && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Количество
                <input
                  className="input !w-24 !py-1.5"
                  type="number"
                  min={1}
                  max={max}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="text-xs text-slate-500">из {max}</span>
              </label>
            )}
            <button type="button" className="btn ml-auto" disabled={!pick || busy} onClick={send}>
              🎁 Подарить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
