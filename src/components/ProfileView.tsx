import { useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useApp } from "./AppProvider";
import CollectibleCard, { MiniCollectible, ProfileBackdrop } from "@/game/CollectibleCard";
import GiftModal from "./GiftModal";
import ReportModal from "./ReportModal";
import { CRYSTAL_BY_ID, CrystalIcon } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";
import { Link } from "@/lib/router";
import * as store from "@/lib/store";
import { useRemote } from "@/lib/useRemote";

/** Профиль игрока: кристаллы, коллекционные кристаллы и лайки */
export default function ProfileView({ id }: { id: number }) {
  const { save } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const { data, loading, reload } = useRemote(() => store.getProfile(id), [id, save], 5000);
  const profile = data ?? null;

  if (!profile && loading) {
    return <main className="mx-auto max-w-xl px-4 py-16 text-center text-slate-400">Загрузка…</main>;
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Игрок не найден</h1>
        <Link href="/search" className="btn mt-6">
          К поиску
        </Link>
      </main>
    );
  }

  const onLike = async () => {
    const r = await store.toggleLike(profile.id);
    if (r.ok) {
      sfx.click();
      setError(null);
    } else setError(r.error);
    reload();
  };

  const actions = !profile.isMe && (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={() => setGiftOpen(true)}
        className="btn flex items-center gap-2 !px-5"
        title="Подарить кристалл"
      >
        🎁 Подарить
      </button>
      <button
        type="button"
        onClick={() => setReportOpen(true)}
        className="btn btn-ghost flex items-center gap-2 !px-4 text-sm"
        title="Пожаловаться на игрока"
      >
        🚩 Пожаловаться
      </button>
    </div>
  );

  const modals = (
    <>
      {giftOpen && <GiftModal target={{ id: profile.id, username: profile.username }} onClose={() => setGiftOpen(false)} />}
      {reportOpen && <ReportModal target={{ id: profile.id, username: profile.username }} onClose={() => setReportOpen(false)} />}
    </>
  );

  // Профиль скрыт: видно только имя и надпись
  if (profile.hidden && !profile.isMe) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.username}
              {profile.verified && <VerifiedBadge className="ml-2 h-6 w-6" />}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-slate-400">🔒 Профиль скрыт</p>
          </div>
          {actions}
        </div>
        {modals}
      </main>
    );
  }

  return (
    <>
    <ProfileBackdrop item={profile.featured} />
    <main className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.username}
            <MiniCollectible item={profile.featured} size={28} />
            {profile.verified && <VerifiedBadge className="ml-2 h-6 w-6" />}
          </h1>
          {profile.isMe && profile.hidden && (
            <p className="mt-1 text-xs text-amber-300">🔒 Ваш профиль скрыт от других игроков (настройка «Статистика и профиль»).</p>
          )}
          <p className="text-sm text-slate-400">
            В игре с {new Date(profile.createdAt).toLocaleDateString("ru-RU")} · сундуков открыто: {profile.opened} · видов
            найдено: {profile.found}/{Object.keys(CRYSTAL_BY_ID).length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 font-semibold text-amber-200">
            <CoinIcon className="h-5 w-5" />
            {profile.coins.toLocaleString("ru-RU")}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          {actions}
          <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={onLike}
            disabled={profile.isMe}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-extrabold transition active:scale-95 disabled:cursor-default ${
              profile.liked ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={profile.isMe ? "Это ваш профиль" : profile.liked ? "Убрать лайк" : "Поставить лайк"}
          >
            <span>{profile.liked ? "❤️" : "🤍"}</span>
            {profile.likes}
          </button>
          <span className="text-[11px] text-slate-500">
            {profile.isMe ? "Лайки вашего профиля" : profile.liked ? "Вы поставили лайк" : "Поставить лайк"}
          </span>
          </div>
        </div>
      </div>

      {(profile.bio || profile.isMe) && (
        <section className="panel p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">О себе</h2>
          {profile.bio ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{profile.bio}</p>
          ) : (
            <p className="text-sm text-slate-500">
              Вы пока ничего не написали о себе. Описание (до 800 символов) можно добавить в{" "}
              <Link href="/settings" className="underline">
                настройках
              </Link>
              .
            </p>
          )}
        </section>
      )}

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
          Коллекционные кристаллы
          <span className="ml-2 text-violet-200/35">{profile.collectibles.length + profile.listed.length}</span>
        </h2>
        {profile.collectibles.length + profile.listed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            Коллекционных кристаллов пока нет.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {profile.collectibles.map((c) => (
              <CollectibleCard key={c.uid} item={c} showPrice={false} />
            ))}
            {profile.listed.map((c) => (
              <CollectibleCard
                key={c.uid}
                item={c}
                showPrice={false}
                footer={<div className="px-1 text-xs font-semibold text-amber-300">На рынке</div>}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">Кристаллы</h2>
        {profile.crystals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            В инвентаре нет кристаллов.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {profile.crystals.map((c) => {
              const def = CRYSTAL_BY_ID[c.id];
              return (
                <div
                  key={c.id}
                  className="panel flex flex-col items-center gap-1.5 p-4 text-center"
                  style={{ borderColor: `${def.glow}55` }}
                >
                  <CrystalIcon def={def} className="h-16 w-16" />
                  <div className="font-semibold" style={{ color: def.glow }}>
                    {def.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    ×{c.plain + c.bonus}
                    {c.bonus > 0 && <span className="text-amber-300"> · бонусных {c.bonus}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {modals}
    </main>
    </>
  );
}
