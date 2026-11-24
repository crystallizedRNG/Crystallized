import type { PoolClient } from "pg";
import type { Save } from "@/game/game";
import type { DB, Listing, LogEntry, ReportRow, UserRow } from "@/server/engine";

/**
 * Загрузка и сохранение всего состояния игры.
 * Каждая сущность — отдельная строка (jsonb). При сохранении пишутся только строки, которые изменились.
 */

// Схема БД задаётся в db/schema.ts; миграции из netlify/database/migrations применяет Netlify при деплое.

const LOG_KEEP = 6000;

export interface Snapshot {
  users: Map<number, string>;
  saves: Map<number, string>;
  listings: Map<number, string>;
  likes: Map<number, string>;
  reports: Map<number, string>;
  meta: Map<string, string>;
  session: number | null;
}

const META_KEYS = ["nextId", "nextListingId", "nextReportId", "nextLogId"] as const;

function snapshotOf(db: DB): Snapshot {
  const s: Snapshot = {
    users: new Map(),
    saves: new Map(),
    listings: new Map(),
    likes: new Map(),
    reports: new Map(),
    meta: new Map(),
    session: db.session,
  };
  for (const u of db.users) s.users.set(u.id, JSON.stringify(u));
  for (const [k, v] of Object.entries(db.saves)) s.saves.set(Number(k), JSON.stringify(v));
  for (const l of db.listings) s.listings.set(l.id, JSON.stringify(l));
  for (const [k, v] of Object.entries(db.likes)) s.likes.set(Number(k), JSON.stringify(v));
  for (const r of db.reports) s.reports.set(r.id, JSON.stringify(r));
  for (const k of META_KEYS) s.meta.set(k, JSON.stringify(db[k]));
  return s;
}

type Row = { id: number; data: unknown };

/** Загружает всё состояние (кроме журнала переводов) */
export async function loadDB(c: PoolClient, session: number | null): Promise<{ db: DB; snap: Snapshot }> {
  // запросы идут по очереди: на одном соединении параллельные запросы не поддерживаются
  const users = await c.query<Row>("select id, data from users order by id");
  const saves = await c.query<{ user_id: number; data: Save }>("select user_id, data from saves");
  const listings = await c.query<Row>("select id, data from listings order by id");
  const likes = await c.query<{ target_id: number; data: number[] }>("select target_id, data from likes");
  const reports = await c.query<Row>("select id, data from reports order by id");
  const meta = await c.query<{ key: string; value: number }>("select key, value from meta");
  const m: Record<string, number> = {};
  for (const r of meta.rows) m[r.key] = Number(r.value);
  // счётчики id никогда не должны быть меньше максимального существующего id
  const maxOf = (rows: Row[]) => rows.reduce((a, r) => Math.max(a, r.id), 0);
  const db: DB = {
    nextId: Math.max(m.nextId ?? 1, maxOf(users.rows) + 1),
    users: users.rows.map((r) => r.data as UserRow),
    saves: Object.fromEntries(saves.rows.map((r) => [String(r.user_id), r.data])),
    session,
    listings: listings.rows.map((r) => r.data as Listing),
    nextListingId: Math.max(m.nextListingId ?? 1, maxOf(listings.rows) + 1),
    likes: Object.fromEntries(likes.rows.map((r) => [String(r.target_id), r.data])),
    reports: reports.rows.map((r) => r.data as ReportRow),
    nextReportId: Math.max(m.nextReportId ?? 1, maxOf(reports.rows) + 1),
    logs: [],
    nextLogId: m.nextLogId ?? 1,
  };
  if (!m.nextLogId) {
    const r = await c.query<{ n: number | null }>("select max(id) as n from logs");
    db.nextLogId = (r.rows[0]?.n ?? 0) + 1;
  }
  return { db, snap: snapshotOf(db) };
}

async function syncTable<K extends string | number>(
  c: PoolClient,
  table: "users" | "listings" | "reports" | "saves" | "likes",
  idCol: string,
  before: Map<K, string>,
  after: Map<K, string>,
) {
  for (const [id, json] of after) {
    if (before.get(id) !== json) {
      await c.query(
        `insert into ${table} (${idCol}, data) values ($1, $2::jsonb) on conflict (${idCol}) do update set data = excluded.data`,
        [id, json],
      );
    }
  }
  const removed = [...before.keys()].filter((id) => !after.has(id));
  if (removed.length) await c.query(`delete from ${table} where ${idCol} = any($1)`, [removed]);
}

/** Записывает в БД всё, что изменилось по сравнению со снимком */
export async function saveDB(c: PoolClient, db: DB, before: Snapshot) {
  const now = snapshotOf(db);
  await syncTable(c, "users", "id", before.users, now.users);
  await syncTable(c, "saves", "user_id", before.saves, now.saves);
  await syncTable(c, "listings", "id", before.listings, now.listings);
  await syncTable(c, "likes", "target_id", before.likes, now.likes);
  await syncTable(c, "reports", "id", before.reports, now.reports);
  for (const [k, v] of now.meta) {
    if (before.meta.get(k) !== v) {
      await c.query("insert into meta (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value", [k, v]);
    }
  }
  if (db.logs.length) {
    for (const l of db.logs) {
      await c.query("insert into logs (id, user_id, data) values ($1, $2, $3::jsonb) on conflict (id) do nothing", [
        l.id,
        l.userId,
        JSON.stringify(l),
      ]);
    }
    await c.query("delete from logs where id <= $1", [db.nextLogId - 1 - LOG_KEEP]);
  }
  // удалённые аккаунты теряют сессии
  const gone = [...before.users.keys()].filter((id) => !now.users.has(id));
  if (gone.length) await c.query("delete from sessions where user_id = any($1)", [gone]);
}

/** Последние записи журнала игрока (старые — первыми, как ожидает движок) */
export async function loadUserLogs(c: PoolClient, userId: number): Promise<LogEntry[]> {
  const r = await c.query<{ data: LogEntry }>(
    "select data from (select id, data from logs where user_id = $1 order by id desc limit 200) t order by id asc",
    [userId],
  );
  return r.rows.map((x) => x.data);
}
