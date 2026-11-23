import { useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useApp } from "./AppProvider";
import CollectibleCard from "@/game/CollectibleCard";
import { BACKGROUNDS, CHESS_MODELS, MODELS, SKULL_MODELS, SKYEYE_MODELS, SNOWFLAKE_MODELS, SPROUT_MODELS, TROPHY_MODELS, MONO_RATE, SUPER_MONO_RATE, TONE_NAMES, UPGRADE_COST, collectiblePrice } from "@/game/collectibles";
import { CRYSTAL_BY_ID } from "@/game/crystals";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";
import { Link } from "@/lib/router";
import { MiniCollectible } from "@/game/CollectibleCard";
import * as store from "@/lib/store";
import { useRemote } from "@/lib/useRemote";

export default function MarketView() {
  const { user, save, listItem, unlistItem, buyItem, notify } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  // рынок общий для всех игроков и обновляется сам: лоты появляются и исчезают в реальном времени
  const { data: listingsData, reload } = useRemote(() => store.getListings(), [save], 3000);
  const listings = listingsData ?? [];
  if (!user || !save) return null;

  const mine = listings.filter((l) => l.sellerId === user.id);
  const others = listings.filter((l) => l.sellerId !== user.id);

  const onList = async (uid: string) => {
    const r = await listItem(uid);
    if (r.ok) {
      sfx.buy();
      setError(null);
      notify("Выставлено");
    } else setError(r.error);
  };
  const onUnlist = async (id: number) => {
    const r = await unlistItem(id);
    if (r.ok) {
      sfx.click();
      setError(null);
    } else setError(r.error);
  };
  const onBuy = async (id: number) => {
    const r = await buyItem(id);
    if (r.ok) {
      sfx.buy();
      setError(null);
      notify(`−${r.price.toLocaleString("ru-RU")} монет`);
    } else {
      sfx.deny();
      setError(r.error);
    }
    reload();
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Рынок</h1>
        <p className="mt-1 text-slate-400">
          Коллекционные кристаллы выпадают из сундуков в виде «???» — улучшите такой кристалл за{" "}
          {UPGRADE_COST.toLocaleString("ru-RU")} монет во вкладке «Инвентарь» и выставьте его здесь. Цену назначает сайт по
          формуле:
        </p>
        <div className="panel mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm text-slate-200">
          <b className="text-amber-200">кристалл</b> + <b className="text-amber-200">модель</b> + <b className="text-amber-200">фон</b> +{" "}
          <b className="text-emerald-300">бонус</b> = <b className="text-amber-200">цена подарка</b>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Кристаллы «???» («Первозданный Хаос», «Кубок», «Небесное Око», «Ледяная Снежинка», «Шах и мат», «Росток в кристалле» и «Череп») оцениваются в {CRYSTAL_BY_ID.genesis.price.toLocaleString("ru-RU")} монет (кроме «Шах и мат» — {CRYSTAL_BY_ID.chess.price.toLocaleString("ru-RU")}, «Росток в кристалле» — {CRYSTAL_BY_ID.sprout.price.toLocaleString("ru-RU")} и самого дорогого — «Череп», {CRYSTAL_BY_ID.skull.price.toLocaleString("ru-RU")}). Бонус «монохром» (+
          {Math.round(MONO_RATE * 100)}% от цены модели и фона) начисляется, когда фон и модель совпадают по цвету и палитре. А <b className="text-amber-300">СУПЕР БОНУС</b> (+{Math.round(SUPER_MONO_RATE * 100)}%) — когда монохром белый или чёрный, а также у фигуры «Шах и мат» на клеточном фоне.{" "}
          <button className="underline hover:text-slate-300" onClick={() => setShowPrices((v) => !v)}>
            {showPrices ? "Скрыть прайс" : "Показать цены моделей и фонов"}
          </button>
        </div>
        {showPrices && (
          <div className="panel mt-3 grid gap-4 p-4 text-xs sm:grid-cols-2">
            <div>
              <div className="mb-1.5 font-semibold uppercase tracking-wider text-slate-400">Модели ({MODELS.length}) · «Кубок»: {TROPHY_MODELS.length} и «Небесное Око»: {SKYEYE_MODELS.length} окрасок с теми же ценами</div>
              <ul className="space-y-0.5 text-slate-300">
                {[...MODELS].reverse().map((m) => (
                  <li key={m.id} className="flex justify-between gap-3">
                    <span style={{ color: m.glow }}>
                      {m.name} <span className="text-slate-500">· {TONE_NAMES[m.tone]}</span>
                    </span>
                    <span>{m.price.toLocaleString("ru-RU")}</span>
                  </li>
                ))}
              </ul>
              {[
                { title: `«Шах и мат» (${CHESS_MODELS.length}) — только из крафта`, list: CHESS_MODELS },
                { title: `«Росток в кристалле» (${SPROUT_MODELS.length}) — кристалл ${CRYSTAL_BY_ID.sprout.price.toLocaleString("ru-RU")}`, list: SPROUT_MODELS },
                { title: `«Ледяная Снежинка» (${SNOWFLAKE_MODELS.length}) — Ледяной сундук, цены как у «Хаоса»`, list: SNOWFLAKE_MODELS },
                { title: `«Череп» (${SKULL_MODELS.length}) — только из крафта, кристалл ${CRYSTAL_BY_ID.skull.price.toLocaleString("ru-RU")}`, list: SKULL_MODELS },
              ].map((g) => (
                <div key={g.title} className="mt-3">
                  <div className="mb-1.5 font-semibold uppercase tracking-wider text-slate-400">{g.title}</div>
                  <ul className="space-y-0.5 text-slate-300">
                    {[...g.list].reverse().map((m) => (
                      <li key={m.id} className="flex justify-between gap-3">
                        <span style={{ color: m.glow }}>{m.name}</span>
                        <span>+{m.price.toLocaleString("ru-RU")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1.5 font-semibold uppercase tracking-wider text-slate-400">Фоны ({BACKGROUNDS.length})</div>
              <ul className="space-y-0.5 text-slate-300">
                {[...BACKGROUNDS].sort((a, b) => b.price - a.price).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-6 rounded"
                        style={{ backgroundImage: `linear-gradient(90deg, ${b.colors[0]}, ${b.colors[1]}, ${b.colors[2]})` }}
                      />
                      {b.name} <span className="text-slate-500">· {TONE_NAMES[b.tone]}</span>
                      {b.only && <span className="text-[10px] font-bold uppercase text-amber-300">эксклюзив «{CRYSTAL_BY_ID[b.only].name}»</span>}
                    </span>
                    <span>{b.price.toLocaleString("ru-RU")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
          Мои коллекционные кристаллы
          <span className="ml-2 text-violet-200/35">{save.collectibles.length}</span>
        </h2>
        {save.collectibles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            У вас пока нет коллекционных кристаллов. Выбейте «???» из сундука и улучшите его в{" "}
            <Link href="/inventory" className="underline">
              инвентаре
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {save.collectibles.map((c) => (
              <CollectibleCard
                key={c.uid}
                item={c}
                showPrice={false}
                footer={
                  <button
                    onClick={() => onList(c.uid)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-2 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
                  >
                    Выставить · {collectiblePrice(c).toLocaleString("ru-RU")}
                    <CoinIcon className="h-4 w-4" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
            Мои лоты <span className="ml-2 text-violet-200/35">{mine.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {mine.map((l) => (
              <CollectibleCard
                key={l.id}
                item={l.item}
                footer={
                  <button
                    onClick={() => onUnlist(l.id)}
                    className="rounded-xl bg-white/10 px-2 py-2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    Снять с продажи
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200/60">
          Предложения игроков <span className="ml-2 text-violet-200/35">{others.length}</span>
        </h2>
        {others.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-violet-200/50">
            Пока никто ничего не выставил.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {others.map((l) => (
              <CollectibleCard
                key={l.id}
                item={l.item}
                footer={
                  <div className="space-y-1.5">
                    <Link href={`/user/${l.sellerId}`} className="block px-1 text-xs text-slate-400 hover:text-white">
                      Продавец: <span className="font-semibold text-slate-200">{l.sellerName}</span>
                      <MiniCollectible item={l.sellerFeatured} size={18} />
                      {l.sellerVerified && <VerifiedBadge className="ml-1 h-3.5 w-3.5" />}
                    </Link>
                    <button
                      onClick={() => onBuy(l.id)}
                      disabled={save.coins < l.price}
                      className="btn flex w-full items-center justify-center gap-1.5 !px-2 !py-2 text-sm"
                    >
                      Купить · {l.price.toLocaleString("ru-RU")}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
