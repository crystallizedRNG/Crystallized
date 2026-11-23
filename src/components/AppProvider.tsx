"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACCENTS, type PublicUser } from "@/game/accents";
import type { Collectible } from "@/game/collectibles";
import type { CrystalId } from "@/game/crystals";
import type { ChestId, OpenResult, Save } from "@/game/game";
import { CoinIcon } from "@/game/icons";
import { logoDataUrl } from "@/components/Logo";
import * as store from "@/lib/store";
import type { AccountPatch, GameAction, GameResponse, Result } from "@/lib/store";

export type { Result };

type Ctx = {
  user: PublicUser | null;
  save: Save | null;
  login: (username: string, password: string) => Promise<Result>;
  register: (username: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  account: (patch: AccountPatch) => Promise<Result>;
  buy: (id: ChestId) => Promise<boolean>;
  open: (id: ChestId) => Promise<OpenResult | null>;
  sell: (id: CrystalId, bonus: boolean, amount: number) => Promise<number>;
  sellAllPlain: () => Promise<number>;
  grant: () => Promise<number>;
  /** улучшить «???»-кристалл до коллекционного */
  upgrade: (id: CrystalId, bonus: boolean) => Promise<Result<{ item: Collectible }>>;
  /** рынок коллекционных кристаллов */
  listItem: (uid: string) => Promise<Result<{ price: number }>>;
  unlistItem: (listingId: number) => Promise<Result>;
  buyItem: (listingId: number) => Promise<Result<{ item: Collectible; price: number }>>;
  /** подарить кристалл игроку */
  gift: (targetId: number, spec: store.GiftSpec) => Promise<Result<{ message: string }>>;
  /** пожаловаться на игрока */
  report: (targetId: number, reason: string) => Promise<Result>;
  /** крафт коллекционных кристаллов */
  craft: (uids: string[]) => Promise<Result<{ outcome: store.CraftOutcome }>>;
  notify: (text: string) => void;
  /** перечитать пользователя и сохранение из хранилища (нужно админ-меню) */
  refresh: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<number>(0);
  // сколько действий сейчас в пути и «версия» состояния — чтобы устаревший опрос не затёр свежий ответ
  const pending = useRef(0);
  const epoch = useRef(0);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const applyBundle = useCallback((b: store.Bundle) => {
    setUser(b.user);
    setSave(b.save);
  }, []);

  /** Загрузить с сервера актуальные данные игрока (опрос, возврат на вкладку, ручное обновление) */
  const syncBundle = useCallback(
    async (force = false) => {
      const startEpoch = epoch.current;
      const b = await store.getBundle();
      if (!b) return;
      if (!force && (pending.current > 0 || epoch.current !== startEpoch)) return;
      applyBundle(b);
      setReady(true);
    },
    [applyBundle],
  );

  useEffect(() => {
    void syncBundle(true).then(() => setReady(true));
    // онлайн: подтягиваем изменения, сделанные другими игроками (подарки, покупки на рынке, выдача админом)
    const timer = window.setInterval(() => !document.hidden && void syncBundle(), 4000);
    const onVisible = () => !document.hidden && void syncBundle();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [syncBundle]);

  /** Любое действие, меняющее данные на сервере */
  const mutate = useCallback(async <T,>(fn: () => Promise<T>, resync = true): Promise<T> => {
    pending.current++;
    epoch.current++;
    try {
      const r = await fn();
      if (resync) {
        const b = await store.getBundle();
        if (b) applyBundle(b);
      }
      return r;
    } finally {
      pending.current--;
      epoch.current++;
    }
  }, [applyBundle]);

  // Персональные настройки: акцентный цвет и анимации
  useEffect(() => {
    const accent = (user && ACCENTS[user.accent]?.color) || ACCENTS.violet.color;
    document.documentElement.style.setProperty("--accent", accent);
    // значок вкладки — тот же осколок в цвете темы
    let link = document.querySelector<HTMLLinkElement>('link[data-crystallized-icon]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-crystallized-icon", "1");
      document.head.appendChild(link);
    }
    link.href = logoDataUrl(accent);
    document.title = "Crystallized";
    document.body.classList.toggle("no-anim", !!user && !user.animations);
  }, [user]);

  const notify = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const authResult = useCallback(
    (r: Result<store.Bundle>): Result => {
      if (!r.ok) return r;
      applyBundle(r);
      return { ok: true };
    },
    [applyBundle],
  );

  const run = useCallback(
    (a: GameAction): Promise<GameResponse> =>
      mutate(async () => {
        const r = await store.game(a);
        if (r.save) setSave(r.save);
        return r;
      }, false),
    [mutate],
  );

  const value = useMemo<Ctx>(
    () => ({
      user,
      save,
      login: (u, p) => mutate(async () => authResult(await store.login(u, p)), false),
      register: (u, p) => mutate(async () => authResult(await store.register(u, p)), false),
      logout: async () => {
        await mutate(() => store.logout(), false);
        setUser(null);
        setSave(null);
      },
      account: (patch) => mutate(async () => authResult(await store.account(patch)), false),
      buy: async (id) => (await run({ action: "buy", id })).ok,
      open: async (id) => {
        const r = await run({ action: "open", id });
        return r.ok ? (r.result ?? null) : null;
      },
      sell: async (id, bonus, amount) => {
        const r = await run({ action: "sell", id, bonus, amount });
        return r.ok ? (r.gain ?? 0) : 0;
      },
      sellAllPlain: async () => {
        const r = await run({ action: "sellAll" });
        return r.ok ? (r.gain ?? 0) : 0;
      },
      grant: async () => {
        const r = await run({ action: "grant" });
        return r.ok ? (r.gain ?? 0) : 0;
      },
      upgrade: (id, bonus) => mutate(() => store.upgradeCrystal(id, bonus)),
      listItem: (uid) => mutate(() => store.listCollectible(uid)),
      unlistItem: (listingId) => mutate(() => store.unlistCollectible(listingId)),
      buyItem: (listingId) => mutate(() => store.buyListing(listingId)),
      gift: (targetId, spec) => mutate(() => store.giftItem(targetId, spec)),
      report: (targetId, reason) => store.reportUser(targetId, reason),
      craft: (uids) => mutate(() => store.craftCollectibles(uids)),
      notify,
      refresh: () => void syncBundle(true),
    }),
    [user, save, authResult, run, notify, mutate, syncBundle],
  );

  return (
    <AppCtx.Provider value={value}>
      {ready ? (
        children
      ) : (
        <div className="flex min-h-screen items-center justify-center text-slate-400">Загрузка…</div>
      )}
      {toast && (
        <div
          key={toast.id}
          className="toast pointer-events-none fixed left-1/2 top-20 z-50 flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-950/90 px-5 py-2.5 text-lg font-extrabold text-amber-200 shadow-xl shadow-amber-500/20 backdrop-blur"
        >
          <CoinIcon className="h-5 w-5" />
          {toast.text}
        </div>
      )}
    </AppCtx.Provider>
  );
}
