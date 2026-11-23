
import { useApp } from "./AppProvider";
import CollectibleCard from "@/game/CollectibleCard";
import { Link } from "@/lib/router";
import * as store from "@/lib/store";
import { useRemote } from "@/lib/useRemote";
import { CRYSTALS, CrystalIcon } from "@/game/crystals";
import { CHESTS, crystalsOf } from "@/game/game";

/** Цвета рангов редкости (tier 1–6) */
const TIER_COLORS = ["", "#94a3b8", "#4ade80", "#38bdf8", "#c084fc", "#fbbf24", "#f43f5e", "#e0aaff"];

const chestOf = (id: string) => CHESTS.find((c) => crystalsOf(c).some((cr) => cr.id === id));

export default function CollectionView() {
  const { user, save, account, notify } = useApp();
  const { data: me } = useRemote(() => (user ? store.getProfile(user.id) : Promise.resolve(null)), [user?.id, save], 8000);
  if (!save) return null;

  const ownedCount = CRYSTALS.filter((c) => save.found[c.id] > 0).length;
  const percent = Math.round((ownedCount / CRYSTALS.length) * 100);
  const tiers = [...new Set(CRYSTALS.map((c) => c.tier))].sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Коллекция</h1>
        <p className="text-slate-400">
          Найдено {ownedCount} из {CRYSTALS.length} · открыто сундуков: {save.opened.toLocaleString("ru-RU")}
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <h2 className="rainbow-text text-lg font-semibold">Коллекционные кристаллы</h2>
          <span className="text-sm text-slate-500">
            {save.collectibles.length + (me?.listed.length ?? 0)}
            {me && ` · ❤️ ${me.likes}`}
          </span>
          {me && (
            <Link href={`/user/${me.id}`} className="ml-auto text-sm text-slate-400 underline hover:text-white">
              Мой профиль
            </Link>
          )}
        </div>
        {save.collectibles.length + (me?.listed.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            Улучшите кристалл «???» в инвентаре — он станет коллекционным и появится здесь.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {save.collectibles.map((c) => {
              const active = user?.featured?.uid === c.uid;
              return (
                <CollectibleCard
                  key={c.uid}
                  item={c}
                  footer={
                    <button
                      type="button"
                      onClick={async () => {
                        const r = await account({ action: "featured", uid: active ? null : c.uid });
                        if (r.ok) notify(active ? "Кристалл убран от имени" : "Кристалл рядом с именем");
                      }}
                      className={`rounded-xl px-2 py-1.5 text-xs font-bold transition active:scale-95 ${
                        active ? "bg-[var(--accent)] text-slate-950" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {active ? "✓ Рядом с именем" : "Поставить рядом с именем"}
                    </button>
                  }
                />
              );
            })}
            {me?.listed.map((c) => (
              <CollectibleCard
                key={c.uid}
                item={c}
                footer={<div className="px-1 text-xs font-semibold text-amber-300">На рынке</div>}
              />
            ))}
          </div>
        )}
      </section>

      {tiers.map((tier) => {
        const items = CRYSTALS.filter((c) => c.tier === tier);
        const found = items.filter((c) => save.found[c.id] > 0).length;
        const color = TIER_COLORS[tier];
        return (
          <section key={tier}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className={`text-lg font-semibold ${tier >= 7 ? "rainbow-text" : ""}`} style={tier >= 7 ? undefined : { color }}>
                {items[0].rarity}
              </h2>
              <span className="text-sm text-slate-500">
                {found}/{items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((c) => {
                const n = save.found[c.id];
                const has = n > 0;
                const chest = chestOf(c.id);
                return (
                  <div
                    key={c.id}
                    className="panel flex flex-col items-center gap-2 p-4 text-center"
                    style={has ? { borderColor: `${c.glow}66` } : undefined}
                  >
                    <CrystalIcon def={c} locked={!has} className="h-[72px] w-[72px]" />
                    <div className={`font-semibold ${has ? "text-white" : "text-slate-600"} ${has && c.tier >= 7 ? "rainbow-text" : ""}`} style={has && c.tier < 7 ? { color: c.glow } : undefined}>
                      {has ? c.name : "???"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {has ? `×${n}` : "Не найден"}
                      {!chest && c.id === "trophy" && <span className="block text-amber-300/70">Награда за активность</span>}
                      {!chest && (c.id === "chess" || c.id === "skull") && <span className="block text-amber-300/70">Только из крафта</span>}
                      {chest && <span className="block" style={{ color: `${chest.theme.accent}aa` }}>{chest.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
