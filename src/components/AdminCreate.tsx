import { useMemo, useState } from "react";
import CollectibleCard from "@/game/CollectibleCard";
import { ALL_MODELS, BACKGROUNDS, bgsOf, type Collectible } from "@/game/collectibles";
import { CRYSTAL_BY_ID, CrystalIcon, type CrystalId } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";
import { adminCreateCollectible } from "@/lib/store";
import { useApp } from "./AppProvider";

/** Кристаллы, из которых получаются коллекционные */
const FAMILIES: CrystalId[] = ["genesis", "trophy", "skyeye", "chess", "sprout", "snowflake", "skull"];

type Msg = { type: "ok" | "err"; text: string } | null;

/** Админ-меню → «Создание»: собрать коллекционный кристалл (кристалл + модель + фон) и получить его в инвентарь */
export default function AdminCreate() {
  const { user, refresh } = useApp();
  const [crystal, setCrystal] = useState<CrystalId>(FAMILIES[0]);
  const [modelId, setModelId] = useState<string>(() => ALL_MODELS.find((m) => m.family === FAMILIES[0])!.id);
  const [bgId, setBgId] = useState<string>(BACKGROUNDS[0].id);
  const [msg, setMsg] = useState<Msg>(null);
  const [created, setCreated] = useState(0);

  const models = useMemo(() => ALL_MODELS.filter((m) => m.family === crystal), [crystal]);
  const backgrounds = useMemo(() => bgsOf(crystal), [crystal]);

  if (!user?.isAdmin) return null;

  const pickCrystal = (id: CrystalId) => {
    sfx.click();
    setCrystal(id);
    setModelId(ALL_MODELS.find((m) => m.family === id)!.id);
    if (!bgsOf(id).some((b) => b.id === bgId)) setBgId(BACKGROUNDS[0].id);
    setMsg(null);
  };

  const preview: Collectible = { uid: "admin-preview", model: modelId, bg: bgId, crystal, createdAt: "" };

  const create = async () => {
    const r = await adminCreateCollectible({ crystal, model: modelId, bg: bgId });
    if (r.ok) {
      sfx.grant();
      setMsg({ type: "ok", text: r.message });
      setCreated((n) => n + 1);
      refresh();
    } else {
      sfx.deny();
      setMsg({ type: "err", text: r.error });
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">✨ Создание</h1>
        <p className="text-slate-400">
          Соберите свой коллекционный кристалл: выберите кристалл, модель и фон. После создания он сразу попадёт к вам в инвентарь.
        </p>
      </div>

      {msg && (
        <p
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            msg.type === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200/60">1. Коллекционный кристалл</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FAMILIES.map((id) => {
                const def = CRYSTAL_BY_ID[id];
                const active = id === crystal;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickCrystal(id)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      active ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >
                    <CrystalIcon def={def} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold" style={{ color: def.glow }}>
                        {def.name}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-amber-200/80">
                        <CoinIcon className="h-3 w-3" />
                        {def.price.toLocaleString("ru-RU")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200/60">
              2. Модель <span className="ml-1 text-violet-200/35">{models.length}</span>
            </h2>
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setModelId(m.id);
                    setMsg(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    m.id === modelId ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold" style={{ color: m.glow }}>
                    {m.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-200/80">
                    <CoinIcon className="h-3 w-3" />
                    {m.price.toLocaleString("ru-RU")}
                    {m.rare && <span className="ml-1 text-cyan-200">· редкая</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200/60">
              3. Фон <span className="ml-1 text-violet-200/35">{backgrounds.length}</span>
            </h2>
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {backgrounds.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setBgId(b.id);
                    setMsg(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                    b.id === bgId ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border border-white/20"
                    style={{
                      backgroundImage:
                        b.pattern === "checker"
                          ? "conic-gradient(#0f172a 25%, #f8fafc 0 50%, #0f172a 0 75%, #f8fafc 0)"
                          : `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[1]}, ${b.colors[2]})`,
                      backgroundSize: b.pattern === "checker" ? "10px 10px" : undefined,
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {b.name}
                      {b.only && <span className="ml-1 text-[9px] font-bold uppercase text-amber-300">эксклюзив</span>}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-200/80">
                      <CoinIcon className="h-3 w-3" />
                      {b.price.toLocaleString("ru-RU")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="md:sticky md:top-20 md:self-start">
          <div className="panel space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200/60">Предпросмотр</h2>
            <CollectibleCard key={`${crystal}-${modelId}-${bgId}`} item={preview} />
            <button type="button" className="btn w-full" onClick={create}>
              ✨ Создать и отправить в инвентарь
            </button>
            {created > 0 && <p className="text-center text-xs text-slate-500">Создано за сессию: {created}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
