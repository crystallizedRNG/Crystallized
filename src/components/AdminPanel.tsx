import { useCallback, useEffect, useMemo, useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { CRYSTALS, CrystalIcon } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { CRYSTAL_BY_ID } from "@/game/crystals";
import { adminAct, adminAwardTrophies, adminListUsers, adminTrophyPreview, type AdminAction, type AdminUserInfo, type TrophyWinner } from "@/lib/store";
import { useApp } from "./AppProvider";
import AdminReports from "./AdminReports";
import AdminCreate from "./AdminCreate";

type Msg = { type: "ok" | "err"; text: string } | null;

function UsersPanel() {
  const { user, refresh } = useApp();
  const [users, setUsers] = useState<AdminUserInfo[]>([]);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [coins, setCoins] = useState("100");
  const [crystalId, setCrystalId] = useState(CRYSTALS[0].id as string);
  const [crystalAmount, setCrystalAmount] = useState("1");
  const [banReason, setBanReason] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [winners, setWinners] = useState<TrophyWinner[]>([]);

  const load = useCallback(async () => {
    const r = await adminListUsers();
    if (!r.ok) {
      if (r.error.startsWith("Нет доступа")) setDenied(true);
      return;
    }
    setDenied(false);
    setUsers(r.users);
    const t = await adminTrophyPreview();
    if (t.ok) setWinners(t.winners);
  }, []);

  useEffect(() => {
    void load();
    // список обновляется сам: игроки заходят и меняются данные в реальном времени
    const timer = window.setInterval(() => !document.hidden && void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => !q || u.username.toLowerCase().includes(q) || String(u.id) === q);
  }, [users, query]);

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const crystalDef = CRYSTALS.find((c) => c.id === crystalId) ?? CRYSTALS[0];

  if (!user?.isAdmin || denied) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Доступ запрещён</h1>
        <p className="mt-2 text-slate-400">Админ-меню доступно только администраторам.</p>
      </main>
    );
  }

  async function run(a: AdminAction) {
    const r = await adminAct(a);
    setMsg(r.ok ? { type: "ok", text: r.message } : { type: "err", text: r.error });
    void load();
    refresh(); // вдруг изменили самого себя
    return r.ok;
  }

  function give(kind: "coins" | "crystal") {
    if (!selected) return;
    if (kind === "coins") run({ action: "coins", userId: selected.id, amount: Number(coins) });
    else run({ action: "crystal", userId: selected.id, crystal: crystalId, amount: Number(crystalAmount) });
  }

  async function awardTrophies() {
    if (!window.confirm("Выдать кристалл «Кубок» топ-3 по лайкам и топ-3 по монетам?")) return;
    const r = await adminAwardTrophies();
    setMsg(r.ok ? { type: "ok", text: r.message } : { type: "err", text: r.error });
    void load();
    refresh();
  }

  function toggleVerify() {
    if (!selected) return;
    run({ action: "verify", userId: selected.id, verified: !selected.verified });
  }

  async function toggleBan() {
    if (!selected) return;
    if (await run({ action: "ban", userId: selected.id, banned: !selected.banned, reason: banReason })) setBanReason("");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">🛡 Админ-меню</h1>
        <p className="text-slate-400">
          Выберите игрока, затем отправьте ему кристалл, выдайте монеты или заблокируйте аккаунт.
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

      <section className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <CrystalIcon def={CRYSTAL_BY_ID.trophy} className="h-16 w-16 shrink-0" />
          <div className="min-w-[14rem] flex-1">
            <h2 className="text-lg font-semibold text-white">🏆 Кубок за активность</h2>
            <p className="text-sm text-slate-400">
              Кристалл «Кубок» (редкость «???») получают топ-3 по лайкам и топ-3 по монетам из «Статистики».
            </p>
          </div>
          <button type="button" className="btn shrink-0" onClick={awardTrophies} disabled={winners.length === 0}>
            Выдать кубки
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["likes", "coins"] as const).map((cat) => (
            <div key={cat} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {cat === "likes" ? "Топ-3 по лайкам" : "Топ-3 по монетам"}
              </div>
              {winners.filter((w) => w.category === cat).length === 0 ? (
                <p className="text-sm text-slate-500">Пока нет претендентов.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {winners
                    .filter((w) => w.category === cat)
                    .map((w) => (
                      <li key={w.place} className="flex items-center justify-between gap-2">
                        <span className="truncate text-white">
                          {["🥇", "🥈", "🥉"][w.place - 1]} {w.username}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 font-bold text-slate-200">
                          {cat === "likes" ? (
                            <>❤️ {w.likes}</>
                          ) : (
                            <>
                              <CoinIcon className="h-4 w-4" />
                              {w.coins.toLocaleString("ru-RU")}
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* Список игроков */}
        <section className="panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Игроки ({users.length})</h2>
            <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" onClick={load}>
              Обновить
            </button>
          </div>
          <input className="input" placeholder="Поиск по имени или ID" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-slate-500">Игроки не найдены</li>}
            {filtered.map((u) => {
              const active = u.id === selectedId;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(u.id);
                      setMsg(null);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-semibold text-white">
                        <span className="truncate">{u.username}</span>
                        {u.verified && <VerifiedBadge className="h-4 w-4" />}
                        {u.isAdmin && <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] text-violet-200">админ</span>}
                        {u.banned && <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px] text-rose-200">бан</span>}
                      </span>
                      <span className="text-xs text-slate-500">
                        ID {u.id} · сундуков {u.chests} · кристаллов {u.crystals}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-200">
                      <CoinIcon className="h-4 w-4" />
                      {u.coins.toLocaleString("ru-RU")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Действия */}
        <section className="space-y-4">
          {!selected ? (
            <div className="panel p-8 text-center text-slate-400">← Выберите игрока в списке</div>
          ) : (
            <>
              <div className="panel p-5">
                <p className="text-sm text-slate-400">Выбран игрок</p>
                <p className="text-xl font-bold text-white">
                  {selected.username}
                  {selected.verified && <VerifiedBadge className="ml-1.5 h-5 w-5" />}{" "}
                  <span className="text-sm font-normal text-slate-500">ID {selected.id}</span>
                </p>
                {selected.banned && (
                  <p className="mt-1 text-sm text-rose-300">Заблокирован{selected.banReason ? `: ${selected.banReason}` : ""}</p>
                )}
              </div>

              <div className="panel space-y-3 p-5">
                <h2 className="text-lg font-semibold text-white">Отправить кристалл</h2>
                <div className="flex items-center gap-3">
                  <CrystalIcon def={crystalDef} className="h-14 w-14 shrink-0" />
                  <select className="input" value={crystalId} onChange={(e) => setCrystalId(e.target.value)}>
                    {CRYSTALS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900">
                        {c.name} — {c.rarity}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <input
                    className="input !w-28"
                    type="number"
                    min={1}
                    max={10000}
                    value={crystalAmount}
                    onChange={(e) => setCrystalAmount(e.target.value)}
                    aria-label="Количество"
                  />
                  <button type="button" className="btn flex-1" onClick={() => give("crystal")}>
                    Отправить {selected.username}
                  </button>
                </div>
              </div>

              <div className="panel space-y-3 p-5">
                <h2 className="text-lg font-semibold text-white">Выдать монеты</h2>
                <div className="flex gap-3">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={coins}
                    onChange={(e) => setCoins(e.target.value)}
                    aria-label="Сумма монет"
                  />
                  <button type="button" className="btn flex shrink-0 items-center gap-1.5" onClick={() => give("coins")}>
                    <CoinIcon className="h-5 w-5" /> Выдать
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[100, 1000, 10000, 100000].map((n) => (
                    <button key={n} type="button" className="btn btn-ghost !px-3 !py-1 text-sm" onClick={() => setCoins(String(n))}>
                      {n.toLocaleString("ru-RU")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel space-y-3 p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  Галочка <VerifiedBadge className="h-5 w-5" />
                </h2>
                <p className="text-sm text-slate-400">
                  Галочка отображается рядом с именем игрока в статистике, поиске, профиле и на рынке.
                </p>
                <button type="button" className={`btn w-full ${selected.verified ? "btn-ghost" : ""}`} onClick={toggleVerify}>
                  {selected.verified ? `Снять галочку у ${selected.username}` : `Выдать галочку ${selected.username}`}
                </button>
              </div>

              <div className="panel space-y-3 p-5">
                <h2 className="text-lg font-semibold text-white">Блокировка</h2>
                {selected.isAdmin ? (
                  <p className="text-sm text-slate-400">Администраторов блокировать нельзя.</p>
                ) : (
                  <>
                    {!selected.banned && (
                      <input
                        className="input"
                        placeholder="Причина (необязательно)"
                        maxLength={120}
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                      />
                    )}
                    <button type="button" className={`btn w-full ${selected.banned ? "" : "btn-danger"}`} onClick={toggleBan}>
                      {selected.banned ? "Разблокировать" : "Забанить"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

/** Админ-меню: вкладки «Игроки» и «Репорты» */
export default function AdminPanel() {
  const { user } = useApp();
  const [tab, setTab] = useState<"users" | "reports" | "create">("users");
  if (!user?.isAdmin) return <UsersPanel />;
  const btn = (t: "users" | "reports" | "create", label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
      style={tab === t ? { boxShadow: "inset 0 -2px 0 var(--accent)" } : undefined}
    >
      {label}
    </button>
  );
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="flex gap-1 rounded-xl bg-black/30 p-1 sm:inline-flex">
          {btn("users", "🛡 Игроки")}
          {btn("reports", "🚩 Репорты")}
          {btn("create", "✨ Создание")}
        </div>
      </div>
      {tab === "users" ? <UsersPanel /> : tab === "reports" ? <AdminReports /> : <AdminCreate />}
    </>
  );
}
