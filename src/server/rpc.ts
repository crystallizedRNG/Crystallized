import { randomBytes } from "node:crypto";
import { pool } from "@/db";
import * as engine from "@/server/engine";
import { ensureSchema, loadDB, loadUserLogs, saveDB } from "@/server/persist";

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

/** Действия, которые ничего не меняют: выполняются без блокировки и параллельно */
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

const LOCK_ID = 727001;
const SESSION_DAYS = 60;

export const hasHandler = (fn: unknown): fn is string => typeof fn === "string" && Object.hasOwn(HANDLERS, fn);

export interface RpcOutcome {
  result: unknown;
  /** строка — выдать новый токен сессии, null — удалить сессию, undefined — без изменений */
  token?: string | null;
}

export async function executeRpc(fn: string, args: unknown[], token: string | null): Promise<RpcOutcome> {
  await ensureSchema();
  const readOnly = READ_ONLY.has(fn);
  const c = await pool.connect();
  try {
    await c.query(readOnly ? "begin isolation level repeatable read read only" : "begin");
    // все изменяющие действия выполняются строго по очереди — игроки не могут «обогнать» друг друга
    if (!readOnly) await c.query("select pg_advisory_xact_lock($1)", [LOCK_ID]);

    let session: number | null = null;
    if (token) {
      const r = await c.query<{ user_id: number }>(
        "select user_id from sessions where token = $1 and created_at > now() - ($2 || ' days')::interval",
        [token, String(SESSION_DAYS)],
      );
      session = r.rows[0]?.user_id ?? null;
    }

    const { db, snap } = await loadDB(c, session);
    if (fn === "adminUserLogs") db.logs = await loadUserLogs(c, Number(args[0]));

    const result = await engine.runWithDb(db, () => HANDLERS[fn](...args));
    let newToken: string | null | undefined;

    if (!readOnly) {
      await saveDB(c, db, snap);
      if (db.session !== session) {
        if (token) await c.query("delete from sessions where token = $1", [token]);
        if (db.session === null) {
          newToken = null;
        } else {
          newToken = randomBytes(32).toString("hex");
          await c.query("insert into sessions (token, user_id) values ($1, $2)", [newToken, db.session]);
          await c.query("delete from sessions where created_at < now() - ($1 || ' days')::interval", [String(SESSION_DAYS)]);
        }
      }
    }
    await c.query("commit");
    return { result, token: newToken };
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}
