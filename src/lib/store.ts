import type { Collectible } from "@/game/collectibles";
import type { OpenResult, Save } from "@/game/game";
import * as engine from "@/server/engine";
import type {
  AccountPatch,
  AdminAction,
  AdminUserInfo,
  Bundle,
  CraftOutcome,
  DB,
  GameAction,
  GameResponse,
  GiftSpec,
  Listing,
  ListingView,
  LogEntry,
  LogKind,
  ProfileView,
  ReportRow,
  Result,
  StatRow,
  TrophyWinner,
  UserHit,
  UserRow,
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
const OFFLINE = "Нет связи с базой данных. Проверьте интернет и попробуйте ещё раз.";

const SB_URL = "https://supabase.co";
const SB_KEY = "sb_publishable__ugLRw6L8zL_VPE0EhSMTA_fFA0GGQd";
const TOKEN_KEY = "crystallized_session_token";

const HEADERS = {
  apikey: SB_KEY,
  "Content-Type": "application/json",
};

async function sbGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SB_URL}/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbUpsert(table: string, rows: unknown[], onConflict: string) {
  if (!rows.length) return;
  const res = await fetch(`${SB_URL}/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sbDelete(table: string, col: string, ids: (number | string)[]) {
  if (!ids.length) return;
  const list = ids.map((x) => encodeURIComponent(String(x))).join(",");
  const res = await fetch(`${SB_URL}/${table}?${col}=in.(${list})`, {
    method: "DELETE",
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(await res.text());
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function genToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

type Snap = {
  users: Map<number, string>;
  saves: Map<number, string>;
  listings: Map<number, string>;
  likes: Map<number, string>;
  reports: Map<number, string>;
  meta: Map<string, string>;
};

function takeSnap(db: DB): Snap {
  const s: Snap = {
    users: new Map(),
    saves: new Map(),
    listings: new Map(),
    likes: new Map(),
    reports: new Map(),
    meta: new Map(),
  };
  for (const u of db.users) s.users.set(u.id, JSON.stringify(u));
  for (const [k, v] of Object.entries(db.saves)) s.saves.set(Number(k), JSON.stringify(v));
  for (const l of db.listings) s.listings.set(l.id, JSON.stringify(l));
  for (const [k, v] of Object.entries(db.likes)) s.likes.set(Number(k), JSON.stringify(v));
  for (const r of db.reports) s.reports.set(r.id, JSON.stringify(r));
  for (const k of ["nextId", "nextListingId", "nextReportId", "nextLogId"] as const) {
    s.meta.set(k, JSON.stringify(db[k]));
  }
  return s;
}
async function loadState(session: number | null): Promise<{ db: DB; snap: Snap }> {
  const [users, saves, listings, likes, reports, meta] = await Promise.all([
    sbGet<{ id: number; data: UserRow }>("users?select=id,data&order=id.asc"),
    sbGet<{ user_id: number; data: Save }>("saves?select=user_id,data"),
    sbGet<{ id: number; data: Listing }>("listings?select=id,data&order=id.asc"),
    sbGet<{ target_id: number; data: number[] }>("likes?select=target_id,data"),
    sbGet<{ id: number; data: ReportRow }>("reports?select=id,data&order=id.asc"),
    sbGet<{ key: string; value: number }>("meta?select=key,value"),
  ]);

  const m: Record<string, number> = {};
  for (const r of meta) m[r.key] = Number(r.value);
  const maxOf = (rows: { id: number }[]) => rows.reduce((a, r) => Math.max(a, r.id), 0);

  const db: DB = {
    nextId: Math.max(m.nextId ?? 1, maxOf(users) + 1),
    users: users.map((r) => r.data),
    saves: Object.fromEntries(saves.map((r) => [String(r.user_id), r.data])),
    session,
    listings: listings.map((r) => r.data),
    nextListingId: Math.max(m.nextListingId ?? 1, maxOf(listings) + 1),
    likes: Object.fromEntries(likes.map((r) => [String(r.target_id), r.data])),
    reports: reports.map((r) => r.data),
    nextReportId: Math.max(m.nextReportId ?? 1, maxOf(reports) + 1),
    logs: [],
    nextLogId: m.nextLogId ?? 1,
  };

  if (!m.nextLogId) {
    const top = await sbGet<{ id: number }>("logs?select=id&order=id.desc&limit=1");
    db.nextLogId = (top[0]?.id ?? 0) + 1;
  }

  return { db, snap: takeSnap(db) };
}

async function saveState(db: DB, before: Snap) {
  const now = takeSnap(db);

  const sync = async <K extends number>(table: string, col: string, b: Map<K, string>, a: Map<K, string>) => {
    const upserts: unknown[] = [];
    for (const [id, json] of a) {
      if (b.get(id) !== json) upserts.push({ [col]: id, data: JSON.parse(json) });
    }
    const del = [...b.keys()].filter((id) => !a.has(id));
    await Promise.all([sbUpsert(table, upserts, col), sbDelete(table, col, del)]);
  };

  const metaRows: { key: string; value: number }[] = [];
  for (const [k, v] of now.meta) {
    if (before.meta.get(k) !== v) metaRows.push({ key: k, value: JSON.parse(v) });
  }

  await Promise.all([
    sync("users", "id", before.users, now.users),
    sync("saves", "user_id", before.saves, now.saves),
    sync("listings", "id", before.listings, now.listings),
    sync("likes", "target_id", before.likes, now.likes),
    sync("reports", "id", before.reports, now.reports),
    sbUpsert("meta", metaRows, "key"),
    db.logs.length
      ? sbUpsert(
          "logs",
          db.logs.map((l) => ({ id: l.id, user_id: l.userId, data: l })),
          "id",
        )
      : Promise.resolve(),
  ]);

  const gone = [...before.users.keys()].filter((id) => !now.users.has(id));
  if (gone.length) await sbDelete("sessions", "user_id", gone);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const HANDLERS: Record<string, (...args: any[]) => unknown> = {
  getBundle: engine.getBundle,
  register: engine.register,
  login: engine.login,
  logout: engine.logout,
  account: engine.account,
  game: engine.game,
  upgradeCrystal: engine.upgradeCrystal,
  getListings: engine.getListings,
  listCollectible: engine.listCollectible,
  unlistCollectible: engine.unlistCollectible,
  buyListing: engine.buyListing,
  searchUsers: engine.searchUsers,
  getProfile: engine.getProfile,
  toggleLike: engine.toggleLike,
  getStats: engine.getStats,
  giftItem: engine.giftItem,
  reportUser: engine.reportUser,
  craftCollectibles: engine.craftCollectibles,
  adminListUsers: engine.adminListUsers,
  adminTrophyPreview: engine.adminTrophyPreview,
  adminAwardTrophies: engine.adminAwardTrophies,
  adminAct: engine.adminAct,
  adminCreateCollectible: engine.adminCreateCollectible,
  adminListReports: engine.adminListReports,
  adminUserLogs: engine.adminUserLogs,
  adminResolveReport: engine.adminResolveReport,
  adminDeleteReport: engine.adminDeleteReport,
};

const READ_ONLY = new Set([
  "getBundle",
  "getListings",
  "searchUsers",
  "getProfile",
  "getStats",
  "adminListUsers",
  "adminTrophyPreview",
  "adminListReports",
  "adminUserLogs",
]);

let queue: Promise<unknown> = Promise.resolve();

async function call<T>(fn: string, ...args: unknown[]): Promise<T | undefined> {
  const task = async (): Promise<T | undefined> => {
    try {
      const token = getToken();
      let session: number | null = null;
      if (token) {
        const s = await sbGet<{ user_id: number }>(`sessions?select=user_id&token=eq.${encodeURIComponent(token)}`);
        session = s[0]?.user_id ?? null;
        if (!session) setToken(null);
      }

      const { db, snap } = await loadState(session);
      if (fn === "adminUserLogs") {
        const rows = await sbGet<{ data: LogEntry }>(
          `logs?select=data&user_id=eq.${Number(args[0])}&order=id.desc&limit=200`,
        );
        db.logs = rows.map((r) => r.data).reverse();
      }

      const result = await engine.runWithDb(db, () => HANDLERS[fn](...args));

      if (!READ_ONLY.has(fn)) {
        await saveState(db, snap);
        if (db.session !== session) {
          if (token) await sbDelete("sessions", "token", [token]);
          if (db.session === null) {
            setToken(null);
          } else {
            const newTok = genToken();
            await sbUpsert("sessions", [{ token: newTok, user_id: db.session }], "token");
            setToken(newTok);
          }
        }
      }
      return result as T;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };

  if (READ_ONLY.has(fn)) return task();
  const next = queue.then(task, task);
  queue = next;
  return next;
}

const offline = { ok: false as const, error: OFFLINE };
const callResult = async <T>(fn: string, ...args: unknown[]): Promise<Result<T>> =>
  (await call<Result<T>>(fn, ...args)) ?? offline;

export const getBundle = () => call<Bundle>("getBundle");
export const register = (username: string, password: string) => callResult<Bundle>("register", username, password);
export const login = (username: string, password: string) => callResult<Bundle>("login", username, password);
export const logout = async () => {
  await call("logout");
};
export const account = (patch: AccountPatch) => callResult<Bundle>("account", patch);

export async function game(a: GameAction): Promise<GameResponse> {
  return (await call<GameResponse>("game", a)) ?? { ok: false, error: OFFLINE, save: null };
}
export type { OpenResult };

export const upgradeCrystal = (id: string, bonus: boolean) => callResult<{ item: Collectible }>("upgradeCrystal", id, bonus);
export const craftCollectibles = (uids: string[]) => callResult<{ outcome: CraftOutcome }>("craftCollectibles", uids);

export const getListings = () => call<ListingView[]>("getListings");
export const listCollectible = (uid: string) => callResult<{ price: number }>("listCollectible", uid);
export const unlistCollectible = (listingId: number) => callResult("unlistCollectible", listingId);
export const buyListing = (listingId: number) => callResult<{ item: Collectible; price: number }>("buyListing", listingId);

export const searchUsers = (query: string) => call<UserHit[]>("searchUsers", query);
export const getProfile = (id: number) => call<ProfileView | null>("getProfile", id);
export const toggleLike = (targetId: number) => callResult<{ liked: boolean; likes: number }>("toggleLike", targetId);
export const getStats = () => call<StatRow[]>("getStats");
export const giftItem = (targetId: number, spec: GiftSpec) => callResult<{ message: string }>("giftItem", targetId, spec);
export const reportUser = (targetId: number, reason: string) => callResult("reportUser", targetId, reason);

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
