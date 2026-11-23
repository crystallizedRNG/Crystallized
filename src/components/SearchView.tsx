import { useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useApp } from "./AppProvider";
import { Link } from "@/lib/router";
import { MiniCollectible } from "@/game/CollectibleCard";
import * as store from "@/lib/store";
import { useRemote } from "@/lib/useRemote";

export default function SearchView() {
  const { user, save } = useApp();
  const [query, setQuery] = useState("");
  const { data } = useRemote(() => (query.trim() ? store.searchUsers(query) : Promise.resolve([])), [query, save], 10000);
  const hits = query.trim() ? (data ?? []) : [];
  const q = query.trim();

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Поиск</h1>
        <p className="text-slate-400">Найдите игрока по имени, посмотрите его кристаллы и поставьте лайк.</p>
      </div>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Имя игрока"
        maxLength={20}
        autoFocus
      />
      {!q ? (
        <p className="text-center text-sm text-slate-500">Введите имя, чтобы найти игрока.</p>
      ) : hits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
          Никого не нашли по запросу «{q}».
        </p>
      ) : (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/user/${h.id}`}
                className="panel flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/10"
              >
                <span className="font-semibold text-white">
                  {h.username}
                  <MiniCollectible item={h.featured} size={20} />
                  {h.verified && <VerifiedBadge className="ml-1.5 h-4 w-4" />}
                  {h.id === user?.id && <span className="ml-2 text-xs text-slate-500">это вы</span>}
                </span>
                <span className="text-sm text-slate-300">❤️ {h.likes}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
