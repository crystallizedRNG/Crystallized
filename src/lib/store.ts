/**
 * Клиент онлайн-сервера. Все данные (аккаунты, сохранения, рынок, лайки, жалобы) лежат в PostgreSQL на сервере,
 * а эти функции просто отправляют действия в /api/rpc. Логика игры — в src/server/engine.ts.
 */
import type { Collectible } from "@/game/collectibles";
import type { OpenResult } from "@/game/game";
import type {
  AccountPatch,
  AdminAction,
  AdminUserInfo,
  Bundle,
  CraftOutcome,
  GameAction,
  GameResponse,
  GiftSpec,
  ListingView,
  LogEntry,
  LogKind,
  ProfileView,
  ReportRow,
  Result,
  StatRow,
  TrophyWinner,
  UserHit,
} from "@/server/engine";

export type {
  AccountPatch,
  AdminAction,
  AdminUserInfo,
  Bundle,
  CraftOutcome,
  GameAction,
  GameResponse,
  GiftSpec,
  ListingView,
  LogEntry,
  LogKind,
  ProfileView,
  ReportRow,
  Result,
  StatRow,
  TrophyWinner,
  UserHit,
};

export const REPORT_MAX = 1000;

const OFFLINE = "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.";

/** Вызов серверного действия. Возвращает undefined, если сервер недоступен. */
async function call<T>(fn: string, ...args: unknown[]): Promise<T | undefined> {
  try {
    const res = await fetch("/api/rpc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fn, args }),
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { result: T };
    return data.result;
  } catch {
    return undefined;
  }
}

const offline = { ok: false as const, error: OFFLINE };
const callResult = async <T>(fn: string, ...args: unknown[]): Promise<Result<T>> =>
  (await call<Result<T>>(fn, ...args)) ?? offline;

/* ---------- сессия и аккаунт ---------- */

/** Текущий пользователь и его сохранение (undefined, если сервер недоступен) */
export const getBundle = () => call<Bundle>("getBundle");
export const register = (username: string, password: string) => callResult<Bundle>("register", username, password);
export const login = (username: string, password: string) => callResult<Bundle>("login", username, password);
export const logout = async () => {
  await call("logout");
};
export const account = (patch: AccountPatch) => callResult<Bundle>("account", patch);

/* ---------- игра ---------- */

export async function game(a: GameAction): Promise<GameResponse> {
  return (await call<GameResponse>("game", a)) ?? { ok: false, error: OFFLINE, save: null };
}
export type { OpenResult };

export const upgradeCrystal = (id: string, bonus: boolean) => callResult<{ item: Collectible }>("upgradeCrystal", id, bonus);
export const craftCollectibles = (uids: string[]) => callResult<{ outcome: CraftOutcome }>("craftCollectibles", uids);

/* ---------- рынок ---------- */

export const getListings = () => call<ListingView[]>("getListings");
export const listCollectible = (uid: string) => callResult<{ price: number }>("listCollectible", uid);
export const unlistCollectible = (listingId: number) => callResult("unlistCollectible", listingId);
export const buyListing = (listingId: number) => callResult<{ item: Collectible; price: number }>("buyListing", listingId);

/* ---------- игроки ---------- */

export const searchUsers = (query: string) => call<UserHit[]>("searchUsers", query);
export const getProfile = (id: number) => call<ProfileView | null>("getProfile", id);
export const toggleLike = (targetId: number) => callResult<{ liked: boolean; likes: number }>("toggleLike", targetId);
export const getStats = () => call<StatRow[]>("getStats");
export const giftItem = (targetId: number, spec: GiftSpec) => callResult<{ message: string }>("giftItem", targetId, spec);
export const reportUser = (targetId: number, reason: string) => callResult("reportUser", targetId, reason);

/* ---------- админ-меню ---------- */

export const adminListUsers = () => callResult<{ users: AdminUserInfo[] }>("adminListUsers");
export const adminTrophyPreview = () => callResult<{ winners: TrophyWinner[] }>("adminTrophyPreview");
export const adminAwardTrophies = () => callResult<{ message: string; winners: TrophyWinner[] }>("adminAwardTrophies");
export const adminAct = (a: AdminAction) => callResult<{ message: string }>("adminAct", a);
export const adminCreateCollectible = (spec: { crystal: string; model: string; bg: string }) =>
  callResult<{ message: string; item: Collectible }>("adminCreateCollectible", spec);
export const adminListReports = () => callResult<{ reports: ReportRow[] }>("adminListReports");
export const adminUserLogs = (userId: number) => callResult<{ logs: LogEntry[] }>("adminUserLogs", userId);
export const adminResolveReport = (id: number, resolved: boolean) => callResult("adminResolveReport", id, resolved);
export const adminDeleteReport = (id: number) => callResult("adminDeleteReport", id);
