
import { useEffect, useState } from "react";
import { useRouter } from "@/lib/router";
import { useApp } from "@/components/AppProvider";
import { CRYSTALS, CRYSTAL_BY_ID, CrystalIcon, isSecret, type CrystalDef } from "./crystals";
import CollectibleCard from "./CollectibleCard";
import UpgradeReveal from "./UpgradeReveal";
import { UPGRADE_COST, type Collectible } from "./collectibles";
import { FIRST_DROP_MULT, sellPrice, type Save } from "./game";
import { CoinIcon } from "./icons";
import { sfx } from "./sound";
import { cn } from "./utils/cn";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-violet-200/50">{label}</div>
    </div>
  );
}

function ItemCard({
  def,
  bonus,
  count,
  onSell,
  onUpgrade,
}: {
  def: CrystalDef;
  bonus: boolean;
  count: number;
  onSell: (amount: number) => void;
  onUpgrade?: () => void;
}) {
  const [confirm, setConfirm] = useState<number | null>(null);
  const unit = sellPrice(def.id, bonus);

  useEffect(() => {
    if (confirm === null) return;
    const t = setTimeout(() => setConfirm(null), 2500);
    return () => clearTimeout(t);
  }, [confirm]);

  // Бонусные кристаллы дорогие — просим подтвердить продажу
  const click = (amount: number) => {
    if (bonus && confirm !== amount) {
      sfx.click();
      setConfirm(amount);
      return;
    }
    setConfirm(null);
    onSell(amount);
  };

  return (
    <div
      className="pop-in relative flex flex-col items-center rounded-2xl border bg-white/[0.04] p-3 sm:p-4"
      style={{
        borderColor: bonus ? "#fbbf24aa" : `${def.glow}44`,
        boxShadow: bonus ? "0 0 24px #fbbf2433" : undefined,
      }}
    >
      {bonus && (
        <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-950">
          Бонус ×{FIRST_DROP_MULT}
        </span>
      )}
      <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
        ×{count}
      </span>
      <CrystalIcon def={def} className="mt-5 h-16 w-16 sm:h-20 sm:w-20" />
      <div className="mt-2 font-bold" style={{ color: def.glow }}>
        {def.name}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-violet-200/40">{def.rarity}</div>

      <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-200">
        <CoinIcon className="h-4 w-4" />
        {bonus && <span className="text-xs text-white/35 line-through">{def.price}</span>}
        {unit}
      </div>

      <div className="mt-3 flex w-full gap-2">
        <button
          onClick={() => click(1)}
          className={cn(
            "flex-1 rounded-xl px-2 py-2 text-sm font-bold transition active:scale-95",
            confirm === 1
              ? "bg-rose-500 text-white hover:bg-rose-400"
              : "bg-amber-400 text-amber-950 hover:bg-amber-300",
          )}
        >
          {confirm === 1 ? "Точно?" : "Продать"}
        </button>
        {count > 1 && (
          <button
            onClick={() => click(count)}
            className={cn(
              "flex-1 rounded-xl px-2 py-2 text-sm font-bold transition active:scale-95",
              confirm === count
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            {confirm === count ? "Точно?" : `Все (${unit * count})`}
          </button>
        )}
      </div>

      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2 py-2 text-sm font-extrabold text-slate-950 transition hover:brightness-110 active:scale-95"
        >
          ✨ Улучшить · {UPGRADE_COST.toLocaleString("ru-RU")}
          <CoinIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function InventoryTab() {
  const { save } = useApp();
  if (!save) return null;
  return <InventoryView save={save} />;
}

function InventoryView({ save }: { save: Save }) {
  const { sell, sellAllPlain, notify, upgrade } = useApp();
  const router = useRouter();
  const [upgraded, setUpgraded] = useState<Collectible | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  /** идёт 3-секундная анимация улучшения */
  const [animating, setAnimating] = useState<Collectible | null>(null);

  const onUpgrade = async (def: CrystalDef, bonus: boolean) => {
    const r = await upgrade(def.id, bonus);
    if (r.ok) {
      setUpgradeError(null);
      if (document.body.classList.contains("no-anim")) {
        sfx.reveal(6, true);
        setUpgraded(r.item);
      } else {
        sfx.upgrade();
        setAnimating(r.item);
      }
    } else {
      sfx.deny();
      setUpgradeError(r.error);
    }
  };
  const totalCrystalsAll = CRYSTALS.reduce((s, c) => s + save.plain[c.id] + save.bonus[c.id], 0);

  const onSell = async (def: CrystalDef, bonus: boolean, amount: number) => {
    const gain = await sell(def.id, bonus, amount);
    if (gain) {
      sfx.sell(amount);
      notify(`+${gain} монет`);
    }
  };

  const onSellAllPlain = async () => {
    const gain = await sellAllPlain();
    if (gain) {
      sfx.sell(totalCrystalsAll);
      notify(`+${gain} монет`);
    }
  };

  const onGoChests = () => router.push("/");

  // самые дорогие — первыми
  const ordered = [...CRYSTALS].sort((a, b) => b.price - a.price);
  const entries = ordered.flatMap((def) => [
    ...(save.bonus[def.id] > 0 ? [{ def, bonus: true, count: save.bonus[def.id] }] : []),
    ...(save.plain[def.id] > 0 ? [{ def, bonus: false, count: save.plain[def.id] }] : []),
  ]);

  const totalItems = entries.reduce((s, e) => s + e.count, 0);
  const totalValue = entries.reduce((s, e) => s + e.count * sellPrice(e.def.id, e.bonus), 0);
  const plainValue = CRYSTALS.reduce((s, c) => s + save.plain[c.id] * c.price, 0);
  const plainCount = CRYSTALS.reduce((s, c) => s + save.plain[c.id], 0);
  const discovered = CRYSTALS.filter((c) => save.found[c.id] > 0).length;

  return (
    <div className="space-y-10">
      {/* Статистика */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Монеты"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CoinIcon className="h-5 w-5" />
              {save.coins}
            </span>
          }
        />
        <Stat label="Сундуков открыто" value={save.opened} />
        <Stat label="Кристаллов продано" value={save.sold} />
        <Stat label="Открыто видов" value={`${discovered}/${CRYSTALS.length}`} />
      </section>

      <p className="text-center text-xs text-violet-200/40">
        Первый кристалл каждого вида стоит в {FIRST_DROP_MULT} раза дороже — не забудьте его продать! Все найденные
        виды смотрите во вкладке «Коллекция».
      </p>

      {/* Инвентарь */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
            Мои кристаллы
            <span className="ml-2 text-violet-200/35">
              {totalItems} шт. · {totalValue} монет
            </span>
          </h2>
          {plainCount > 0 && (
            <button
              onClick={onSellAllPlain}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
            >
              Продать все обычные · {plainValue}
              <CoinIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-violet-200/50">
            <div className="mb-3">Здесь пока пусто. Откройте сундук, чтобы найти кристаллы!</div>
            <button
              onClick={onGoChests}
              className="rounded-xl bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            >
              К сундукам
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {entries.map((e) => (
              <ItemCard
                key={`${e.def.id}-${e.bonus}`}
                def={e.def}
                bonus={e.bonus}
                count={e.count}
                onSell={(amount) => onSell(e.def, e.bonus, amount)}
                onUpgrade={isSecret(e.def) ? () => onUpgrade(e.def, e.bonus) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {upgradeError && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-300">
          {upgradeError}
        </p>
      )}

      {animating && (
        <UpgradeReveal
          from={CRYSTAL_BY_ID[animating.crystal]}
          item={animating}
          onDone={() => {
            setUpgraded(animating);
            setAnimating(null);
          }}
        />
      )}

      {upgraded && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setUpgraded(null)}
        >
          <div className="anim-reveal w-full max-w-xs space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="rainbow-text text-lg font-extrabold">Новый коллекционный кристалл!</div>
            <CollectibleCard item={upgraded} />
            <p className="text-xs text-slate-400">Он появился в «Коллекции». Выставить его можно во вкладке «Рынок».</p>
            <button onClick={() => setUpgraded(null)} className="btn w-full">
              Отлично
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
