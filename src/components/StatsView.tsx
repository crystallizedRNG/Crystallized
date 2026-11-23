import { useMemo, type ReactNode } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useApp } from "./AppProvider";
import { CRYSTAL_BY_ID, CrystalIcon } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { Link } from "@/lib/router";
import { MiniCollectible } from "@/game/CollectibleCard";
import * as store from "@/lib/store";
import { useRemote } from "@/lib/useRemote";

const MEDALS = ["🥇", "🥈", "🥉"];

function Board({
  title,
  rows,
  myId,
  value,
}: {
  title: string;
  rows: store.StatRow[];
  myId?: number;
  value: (r: store.StatRow) => ReactNode;
}) {
  return (
    <section className="panel p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Пока нет игроков.</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/user/${r.id}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/10 ${
                  r.id === myId ? "bg-white/[0.07] ring-1 ring-white/20" : ""
                }`}
              >
                <span className="w-7 text-center text-sm font-bold text-slate-400">{MEDALS[i] ?? i + 1}</span>
                <span className="flex-1 truncate font-semibold text-white">
                  {r.username}
                  <MiniCollectible item={r.featured} size={20} />
                  {r.verified && <VerifiedBadge className="ml-1.5 h-4 w-4" />}
                  {r.id === myId && <span className="ml-2 text-xs font-normal text-slate-500">это вы</span>}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-100">{value(r)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function StatsView() {
  const { user, save } = useApp();
  const { data } = useRemote(() => store.getStats(), [save], 8000);
  const all = useMemo(() => data ?? [], [data]);

  const byLikes = useMemo(
    () => [...all].sort((a, b) => b.likes - a.likes || b.coins - a.coins).slice(0, 10),
    [all],
  );
  const byCoins = useMemo(
    () => [...all].sort((a, b) => b.coins - a.coins || b.likes - a.likes).slice(0, 10),
    [all],
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="text-slate-400">Игроков в рейтинге: {all.length}. Нажмите на имя, чтобы открыть профиль. Игроки со скрытой статистикой в списке не отображаются.</p>
      </div>
      <div className="trophy-banner relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-400/15 via-amber-300/10 to-fuchsia-400/10 p-4 shadow-[0_0_30px_rgba(250,204,21,0.12)]">
        <CrystalIcon def={CRYSTAL_BY_ID.trophy} className="h-16 w-16 shrink-0" />
        <div className="min-w-[14rem] flex-1">
          <h2 className="text-lg font-bold text-amber-100">🏆 Награда «Кубок»</h2>
          <p className="text-sm text-amber-50/80">
            Игрок, который удерживает место в топе категории лидерборда — по лайкам или по монетам, — награждается
            кристаллом «Кубок». Держитесь в тройке лучших!
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Board title="Больше всего лайков" rows={byLikes} myId={user?.id} value={(r) => <>❤️ {r.likes}</>} />
        <Board
          title="Больше всего монет"
          rows={byCoins}
          myId={user?.id}
          value={(r) => (
            <>
              <CoinIcon className="h-4 w-4" />
              {r.coins.toLocaleString("ru-RU")}
            </>
          )}
        />
      </div>
    </main>
  );
}
