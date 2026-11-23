import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteReport,
  adminListReports,
  adminResolveReport,
  adminUserLogs,
  type LogEntry,
  type LogKind,
  type ReportRow,
} from "@/lib/store";
import { Link } from "@/lib/router";

const KIND: Record<LogKind, { icon: string; label: string; color: string }> = {
  coins_in: { icon: "💰", label: "Получены монеты", color: "text-emerald-300" },
  coins_out: { icon: "💸", label: "Потрачены / переведены монеты", color: "text-rose-300" },
  crystal_in: { icon: "💎", label: "Получен кристалл", color: "text-cyan-300" },
  crystal_out: { icon: "📤", label: "Передан / потерян кристалл", color: "text-amber-300" },
};

type Filter = "all" | "coins" | "crystals";

/** Репорты: жалобы игроков + журнал переводов и получения монет и кристаллов выбранного игрока */
export default function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [logOf, setLogOf] = useState<"target" | "reporter">("target");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await adminListReports();
    if (r.ok) {
      setReports(r.reports);
      setError(null);
    } else setError(r.error);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => !document.hidden && void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  const visible = reports.filter((r) => showResolved || !r.resolved);
  const selected = reports.find((r) => r.id === selectedId) ?? null;
  const logUserId = selected ? (logOf === "target" ? selected.targetId : selected.reporterId) : null;

  useEffect(() => {
    if (logUserId === null) {
      setLogs([]);
      return;
    }
    let alive = true;
    void adminUserLogs(logUserId).then((r) => {
      if (alive) setLogs(r.ok ? r.logs : []);
    });
    return () => {
      alive = false;
    };
  }, [logUserId, reports]);

  const shownLogs = logs.filter((l) =>
    filter === "all" ? true : filter === "coins" ? l.kind.startsWith("coins") : l.kind.startsWith("crystal"),
  );

  const fmt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
  const openCount = reports.filter((r) => !r.resolved).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">🚩 Репорты</h1>
        <p className="text-slate-400">
          Жалобы игроков. Выберите жалобу, чтобы прочитать причину и посмотреть переводы и получение монет и кристаллов.
        </p>
      </div>

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        <section className="panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Жалобы <span className="text-sm font-normal text-slate-500">новых: {openCount}</span>
            </h2>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" className="accent-[var(--accent)]" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
              Рассмотренные
            </label>
          </div>
          <ul className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
            {visible.length === 0 && <li className="py-8 text-center text-sm text-slate-500">Жалоб нет.</li>}
            {visible.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(r.id);
                    setLogOf("target");
                    setFilter("all");
                  }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    r.id === selectedId ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-white">
                      {r.targetName} <span className="text-xs font-normal text-slate-500">← {r.reporterName}</span>
                    </span>
                    {r.resolved ? (
                      <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-200">рассмотрена</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px] text-rose-200">новая</span>
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-slate-400">{r.reason}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-600">{fmt(r.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          {!selected ? (
            <div className="panel p-8 text-center text-slate-400">← Выберите жалобу в списке</div>
          ) : (
            <>
              <div className="panel space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">Жалоба №{selected.id}</p>
                    <p className="text-lg font-bold text-white">
                      На игрока{" "}
                      <Link href={`/user/${selected.targetId}`} className="underline">
                        {selected.targetName}
                      </Link>
                    </p>
                    <p className="text-xs text-slate-500">
                      От{" "}
                      <Link href={`/user/${selected.reporterId}`} className="underline">
                        {selected.reporterName}
                      </Link>{" "}
                      · {fmt(selected.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn !px-3 !py-1.5 text-sm"
                      onClick={async () => {
                        await adminResolveReport(selected.id, !selected.resolved);
                        void load();
                      }}
                    >
                      {selected.resolved ? "Вернуть в новые" : "Рассмотрена"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger !px-3 !py-1.5 text-sm"
                      onClick={async () => {
                        if (!window.confirm("Удалить жалобу?")) return;
                        await adminDeleteReport(selected.id);
                        setSelectedId(null);
                        void load();
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words rounded-xl bg-black/25 px-4 py-3 text-sm text-slate-200">{selected.reason}</p>
                {selected.resolved && selected.resolvedBy && (
                  <p className="text-xs text-emerald-300">Рассмотрел: {selected.resolvedBy}</p>
                )}
                <p className="text-xs text-slate-500">Блокировка и выдача галочки — во вкладке «Игроки».</p>
              </div>

              <div className="panel space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">Переводы и получения</h2>
                  <div className="flex gap-1 rounded-xl bg-black/30 p-1 text-xs">
                    {(
                      [
                        ["target", selected.targetName],
                        ["reporter", selected.reporterName],
                      ] as const
                    ).map(([k, name]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setLogOf(k)}
                        className={`max-w-[9rem] truncate rounded-lg px-2.5 py-1 font-semibold transition ${logOf === k ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                      >
                        {k === "target" ? "Обвиняемый: " : "Автор: "}
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5 text-xs">
                  {(
                    [
                      ["all", "Всё"],
                      ["coins", "Монеты"],
                      ["crystals", "Кристаллы"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`rounded-full border px-3 py-1 transition ${filter === k ? "border-[var(--accent)] bg-white/10 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ul className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
                  {shownLogs.length === 0 && <li className="py-6 text-center text-sm text-slate-500">Записей пока нет.</li>}
                  {shownLogs.map((l) => (
                    <li key={l.id} className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                      <span title={KIND[l.kind].label}>{KIND[l.kind].icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block break-words ${KIND[l.kind].color}`}>{l.text}</span>
                        <span className="text-[11px] text-slate-600">{fmt(l.at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
