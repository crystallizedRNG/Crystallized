/**
 * Игровой движок (сервер). Вся логика игры, рынка, подарков, крафта и админ-меню выполняется здесь,
 * а данные лежат в PostgreSQL. Браузер обращается к нему через /api/rpc (см. src/lib/store.ts).
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { ACCENTS, type PublicUser } from "@/game/accents";
import {
  ALL_MODELS,
  BG_BY_ID,
  CRAFT_PURE_CHANCE,
  CRAFT_SKULL_CHANCE,
  CRAFT_SLOTS,
  MODEL_BY_ID,
  UPGRADE_COST,
  bgsOf,
  collectiblePrice,
  craftChance,
  craftSum,
  rollCollectible,
  rollCraftResult,
  type Collectible,
} from "@/game/collectibles";
import { CRYSTALS, CRYSTAL_BY_ID, isSecret, type CrystalId } from "@/game/crystals";
import {
  applyBuy,
  applyOpen,
  applySell,
  applySellAllPlain,
  CHEST_BY_ID,
  cheapestChestPrice,
  freshSave,
  isChestId,
  isCrystalId,
  isStuck,
  normalizeSave,
  type OpenResult,
  type Save,
} from "@/game/game";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; field?: string };

export interface UserRow {
  id: number;
  username: string;
  usernameLower: string;
  passwordHash: string;
  salt: string;
  accent: string;
  animations: boolean;
  createdAt: string;
  /** блокировка аккаунта администратором */
  banned?: boolean;
  banReason?: string;
  /** галочка рядом с именем (выдаётся администратором) */
  verified?: boolean;
  /** «Статистика и профиль» (по умолчанию включено) */
  showProfile?: boolean;
  /** описание профиля, до 800 символов */
  bio?: string;
  /** uid коллекционного кристалла, который стоит рядом с именем */
  featured?: string | null;
}

/** Запись журнала: переводы и получение монет и кристаллов */
export type LogKind = "coins_in" | "coins_out" | "crystal_in" | "crystal_out";
export interface LogEntry {
  id: number;
  userId: number;
  at: string;
  kind: LogKind;
  text: string;
}

/** Жалоба на игрока */
export interface ReportRow {
  id: number;
  reporterId: number;
  reporterName: string;
  targetId: number;
  targetName: string;
  reason: string;
  createdAt: string;
  resolved: boolean;
  resolvedBy?: string;
}

/** Лот на рынке коллекционных кристаллов */
export interface Listing {
  id: number;
  sellerId: number;
  item: Collectible;
  /** цена, установленная сайтом по формуле t + m + c */
  price: number;
  createdAt: string;
}

export interface DB {
  nextId: number;
  users: UserRow[];
  saves: Record<string, Save>;
  session: number | null;
  /** рынок */
  listings: Listing[];
  nextListingId: number;
  /** лайки профилей: id профиля → id тех, кто поставил лайк */
  likes: Record<string, number[]>;
  reports: ReportRow[];
  nextReportId: number;
  logs: LogEntry[];
  nextLogId: number;
}

export const USERNAME_TAKEN = "Это имя уже занято. Выберите другое.";

/**
 * Состояние текущего запроса. Перед выполнением действия сервер загружает данные из PostgreSQL,
 * а после — записывает изменения (всё внутри одной транзакции с блокировкой, чтобы игроки не мешали друг другу).
 */
const als = new AsyncLocalStorage<DB>();
export const runWithDb = <T>(db: DB, fn: () => T): T => als.run(db, fn);

function read(): DB {
  const db = als.getStore();
  if (!db) throw new Error("Нет контекста базы данных");
  return db;
}

/** Запись происходит в конце запроса (см. src/server/rpc.ts) */
function write(_db: DB) {
  void _db;
}

/* ---------- валидация ---------- */

export function validateUsername(raw: unknown): Result<{ value: string }> {
  if (typeof raw !== "string") return { ok: false, error: "Введите имя пользователя.", field: "username" };
  const value = raw.trim();
  if (value.length < 3 || value.length > 20) {
    return { ok: false, error: "Имя должно быть от 3 до 20 символов.", field: "username" };
  }
  if (!/^[A-Za-z0-9_\-а-яА-ЯёЁ]+$/.test(value)) {
    return { ok: false, error: "Допустимы только буквы, цифры, «_» и «-».", field: "username" };
  }
  return { ok: true, value };
}

export function validatePassword(raw: unknown): Result<{ value: string }> {
  if (typeof raw !== "string" || raw.length < 6) {
    return { ok: false, error: "Пароль должен быть не короче 6 символов.", field: "password" };
  }
  if (raw.length > 128) return { ok: false, error: "Пароль слишком длинный.", field: "password" };
  return { ok: true, value: raw };
}

/* ---------- пароли ---------- */

function randomSalt() {
  return randomBytes(16).toString("hex");
}

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return (await scryptAsync(password, salt)).toString("hex");
}

async function samePassword(password: string, salt: string, hash: string): Promise<boolean> {
  const a = Buffer.from(await hashPassword(password, salt), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- помощники ---------- */

/** Имена пользователей с доступом к админ-меню (без учёта регистра). */
export const ADMIN_NAMES = (process.env.ADMIN_NAMES ?? "test,balanezx").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
export const isAdminName = (name: string) => ADMIN_NAMES.includes(name.trim().toLowerCase());

const toPublic = (u: UserRow): PublicUser => ({
  id: u.id,
  username: u.username,
  accent: u.accent,
  animations: u.animations,
  createdAt: u.createdAt,
  isAdmin: isAdminName(u.username),
  verified: !!u.verified,
  showProfile: u.showProfile !== false,
  bio: u.bio ?? "",
  featured: null,
});

/* ---------- журнал переводов ---------- */

function addLog(db: DB, userId: number, kind: LogKind, text: string) {
  // новые записи копятся здесь и дописываются в таблицу logs при сохранении
  db.logs.push({ id: db.nextLogId++, userId, at: new Date().toISOString(), kind, text });
}

const describe = (c: Collectible) => {
  const m = MODEL_BY_ID[c.model];
  const b = BG_BY_ID[c.bg];
  return `«${m?.name ?? c.model}» (фон «${b?.name ?? c.bg}», ${collectiblePrice(c).toLocaleString("ru-RU")} монет)`;
};

const isHidden = (u: UserRow) => u.showProfile === false;

/** Коллекционный кристалл рядом с именем (только если он по-прежнему у владельца) */
function featuredOf(db: DB, u: UserRow, viewerId?: number | null): Collectible | null {
  if (!u.featured) return null;
  if (isHidden(u) && viewerId !== u.id) return null;
  return normalizeSave(db.saves[u.id]).collectibles.find((c) => c.uid === u.featured) ?? null;
}

export type Bundle = { user: PublicUser | null; save: Save | null };

function bundleOf(db: DB): Bundle {
  const u = db.users.find((x) => x.id === db.session);
  // заблокированный пользователь мгновенно теряет сессию
  if (!u || u.banned) return { user: null, save: null };
  return { user: { ...toPublic(u), featured: featuredOf(db, u, u.id) }, save: normalizeSave(db.saves[u.id]) };
}

export function getBundle(): Bundle {
  return bundleOf(read());
}

const fail = (error: string, field?: string): Result => ({ ok: false, error, field });

/* ---------- авторизация ---------- */

export async function register(username: string, password: string): Promise<Result<Bundle>> {
  const u = validateUsername(username);
  if (!u.ok) return u;
  const p = validatePassword(password);
  if (!p.ok) return p;
  const db = read();
  const lower = u.value.toLowerCase();
  if (db.users.some((x) => x.usernameLower === lower)) return fail(USERNAME_TAKEN, "username") as Result<Bundle>;
  const salt = randomSalt();
  const row: UserRow = {
    id: 0,
    username: u.value,
    usernameLower: lower,
    salt,
    passwordHash: await hashPassword(p.value, salt),
    accent: "violet",
    animations: true,
    createdAt: new Date().toISOString(),
  };
  // повторно читаем: за время хэширования данные могли измениться
  const fresh = read();
  if (fresh.users.some((x) => x.usernameLower === lower)) return fail(USERNAME_TAKEN, "username") as Result<Bundle>;
  row.id = fresh.nextId++;
  fresh.users.push(row);
  fresh.saves[row.id] = freshSave();
  fresh.session = row.id;
  write(fresh);
  return { ok: true, ...bundleOf(fresh) };
}

export async function login(username: string, password: string): Promise<Result<Bundle>> {
  const db = read();
  const lower = String(username ?? "").trim().toLowerCase();
  const row = db.users.find((x) => x.usernameLower === lower);
  const bad = fail("Неверное имя пользователя или пароль.") as Result<Bundle>;
  if (!row) return bad;
  if (!(await samePassword(String(password ?? ""), row.salt, row.passwordHash))) return bad;
  if (row.banned) {
    return fail(`Аккаунт заблокирован администратором.${row.banReason ? ` Причина: ${row.banReason}` : ""}`) as Result<Bundle>;
  }
  const fresh = read();
  fresh.session = row.id;
  write(fresh);
  return { ok: true, ...bundleOf(fresh) };
}

export function logout() {
  const db = read();
  db.session = null;
  write(db);
}

/* ---------- аккаунт ---------- */

export type AccountPatch =
  | { action: "username"; username: string }
  | { action: "password"; current: string; next: string }
  | { action: "prefs"; accent?: string; animations?: boolean; showProfile?: boolean }
  | { action: "bio"; bio: string }
  | { action: "featured"; uid: string | null }
  | { action: "reset"; password: string }
  | { action: "delete"; password: string };

export async function account(patch: AccountPatch): Promise<Result<Bundle>> {
  const db = read();
  const user = db.users.find((x) => x.id === db.session);
  if (!user) return fail("Нужно войти в аккаунт.") as Result<Bundle>;
  const check = async (pw: unknown) => samePassword(String(pw ?? ""), user.salt, user.passwordHash);

  switch (patch.action) {
    case "username": {
      const u = validateUsername(patch.username);
      if (!u.ok) return u;
      const lower = u.value.toLowerCase();
      if (db.users.some((x) => x.usernameLower === lower && x.id !== user.id)) {
        return fail(USERNAME_TAKEN, "username") as Result<Bundle>;
      }
      user.username = u.value;
      user.usernameLower = lower;
      break;
    }
    case "password": {
      if (!(await check(patch.current))) return fail("Текущий пароль неверный.", "current") as Result<Bundle>;
      const p = validatePassword(patch.next);
      if (!p.ok) return p;
      user.salt = randomSalt();
      user.passwordHash = await hashPassword(p.value, user.salt);
      break;
    }
    case "prefs": {
      if (typeof patch.accent === "string" && patch.accent in ACCENTS) user.accent = patch.accent;
      if (typeof patch.animations === "boolean") user.animations = patch.animations;
      if (typeof patch.showProfile === "boolean") user.showProfile = patch.showProfile;
      break;
    }
    case "bio": {
      const bio = String(patch.bio ?? "").replace(/\r\n/g, "\n").trim();
      if (bio.length > 800) return fail("Описание — не более 800 символов.", "bio") as Result<Bundle>;
      user.bio = bio;
      break;
    }
    case "featured": {
      if (patch.uid === null) {
        user.featured = null;
        break;
      }
      const own = normalizeSave(db.saves[user.id]).collectibles.some((c) => c.uid === patch.uid);
      if (!own) return fail("Этот кристалл не лежит у вас в коллекции.") as Result<Bundle>;
      user.featured = patch.uid;
      break;
    }
    case "reset": {
      if (!(await check(patch.password))) return fail("Пароль неверный.") as Result<Bundle>;
      db.saves[user.id] = freshSave();
      break;
    }
    case "delete": {
      if (!(await check(patch.password))) return fail("Пароль неверный.") as Result<Bundle>;
      db.users = db.users.filter((x) => x.id !== user.id);
      delete db.saves[user.id];
      db.listings = db.listings.filter((l) => l.sellerId !== user.id);
      delete db.likes[user.id];
      db.session = null;
      write(db);
      return { ok: true, user: null, save: null };
    }
  }
  // перечитываем (за время хэширования данные могли измениться) и применяем изменения
  const fresh = read();
  const idx = fresh.users.findIndex((x) => x.id === user.id);
  if (idx >= 0) fresh.users[idx] = user;
  if (patch.action === "reset") {
    fresh.saves[user.id] = db.saves[user.id];
    fresh.listings = fresh.listings.filter((l) => l.sellerId !== user.id);
  }
  write(fresh);
  return { ok: true, ...bundleOf(fresh) };
}

/* ---------- игра ---------- */

export type GameAction =
  | { action: "buy"; id: string }
  | { action: "open"; id: string }
  | { action: "sell"; id: string; bonus: boolean; amount: number }
  | { action: "sellAll" }
  | { action: "grant" };

export type GameResponse =
  | { ok: true; save: Save; result?: OpenResult; gain?: number }
  | { ok: false; error: string; save: Save | null };

export function game(a: GameAction): GameResponse {
  const db = read();
  const user = db.users.find((x) => x.id === db.session);
  if (!user) return { ok: false, error: "Нужно войти в аккаунт.", save: null };
  const s = normalizeSave(db.saves[user.id]);
  const err = (error: string): GameResponse => ({ ok: false, error, save: s });
  const commit = (save: Save, extra: { result?: OpenResult; gain?: number } = {}): GameResponse => {
    db.saves[user.id] = save;
    write(db);
    return { ok: true, save, ...extra };
  };

  switch (a.action) {
    case "buy": {
      if (!isChestId(a.id)) return err("Неизвестный сундук.");
      const r = applyBuy(s, a.id);
      if (r) addLog(db, user.id, "coins_out", `Куплен «${CHEST_BY_ID[a.id].name}» за ${CHEST_BY_ID[a.id].price.toLocaleString("ru-RU")} монет`);
      return r ? commit(r) : err("Не хватает монет.");
    }
    case "open": {
      if (!isChestId(a.id)) return err("Неизвестный сундук.");
      const r = applyOpen(s, a.id);
      if (r) addLog(db, user.id, "crystal_in", `Из сундука «${CHEST_BY_ID[a.id].name}» получен кристалл «${r.result.crystal.name}»`);
      return r ? commit(r.save, { result: r.result }) : err("У вас нет такого сундука.");
    }
    case "sell": {
      if (!isCrystalId(a.id)) return err("Неизвестный кристалл.");
      const r = applySell(s, a.id, a.bonus === true, Number(a.amount));
      if (r) addLog(db, user.id, "coins_in", `Продано ×${Math.min(Math.floor(Number(a.amount)), (a.bonus ? s.bonus : s.plain)[a.id])} «${CRYSTAL_BY_ID[a.id].name}»: +${r.gain.toLocaleString("ru-RU")} монет`);
      return r ? commit(r.save, { gain: r.gain }) : err("Нечего продавать.");
    }
    case "sellAll": {
      const r = applySellAllPlain(s);
      if (r) addLog(db, user.id, "coins_in", `Продажа всех обычных кристаллов: +${r.gain.toLocaleString("ru-RU")} монет`);
      return r ? commit(r.save, { gain: r.gain }) : err("Нечего продавать.");
    }
    case "grant": {
      if (!isStuck(s)) return err("Помощь сейчас недоступна.");
      const amount = cheapestChestPrice();
      addLog(db, user.id, "coins_in", `Помощь от игры: +${amount.toLocaleString("ru-RU")} монет`);
      return commit({ ...s, coins: s.coins + amount }, { gain: amount });
    }
  }
}

/* ---------- админ-меню (доступно только пользователям из ADMIN_NAMES) ---------- */

export interface AdminUserInfo {
  id: number;
  username: string;
  createdAt: string;
  banned: boolean;
  banReason: string;
  isAdmin: boolean;
  verified: boolean;
  coins: number;
  chests: number;
  crystals: number;
}

function adminCtx(): { db: DB; admin: UserRow } | null {
  const db = read();
  const admin = db.users.find((x) => x.id === db.session);
  if (!admin || admin.banned || !isAdminName(admin.username)) return null;
  return { db, admin };
}

const DENIED = "Нет доступа: только для администраторов.";

export function adminListUsers(): Result<{ users: AdminUserInfo[] }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ users: AdminUserInfo[] }>;
  const users = ctx.db.users.map((u) => {
    const s = normalizeSave(ctx.db.saves[u.id]);
    return {
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      banned: !!u.banned,
      banReason: u.banReason ?? "",
      isAdmin: isAdminName(u.username),
      verified: !!u.verified,
      coins: s.coins,
      chests: Object.values(s.chests).reduce((a, b) => a + b, 0),
      crystals: CRYSTALS.reduce((n, c) => n + s.plain[c.id] + s.bonus[c.id], 0),
    };
  });
  return { ok: true, users };
}

export type AdminAction =
  | { action: "coins"; userId: number; amount: number }
  | { action: "crystal"; userId: number; crystal: string; amount: number }
  | { action: "ban"; userId: number; banned: boolean; reason?: string }
  | { action: "verify"; userId: number; verified: boolean };

const MAX_GRANT = 1_000_000_000;

/** Добавляет кристаллы в сохранение: как при обычном выпадении, самый первый кристалл вида — с бонусом первого выпадения */
function addCrystal(s: Save, id: CrystalId, n: number): Save {
  const isNew = s.found[id] === 0;
  return {
    ...s,
    found: { ...s.found, [id]: s.found[id] + n },
    bonus: isNew ? { ...s.bonus, [id]: s.bonus[id] + 1 } : s.bonus,
    plain: { ...s.plain, [id]: s.plain[id] + (isNew ? n - 1 : n) },
  };
}

/* ---------- кубки за активность ---------- */

export interface TrophyWinner {
  userId: number;
  username: string;
  category: "likes" | "coins";
  place: number;
  likes: number;
  coins: number;
}

/** Топ-3 по лайкам и топ-3 по монетам — те же правила сортировки, что и в «Статистике» */
function trophyWinners(db: DB): TrophyWinner[] {
  const rows = db.users
    .filter((u) => !u.banned && !isHidden(u))
    .map((u) => ({
      userId: u.id,
      username: u.username,
      likes: db.likes[u.id]?.length ?? 0,
      coins: normalizeSave(db.saves[u.id]).coins,
    }));
  const byLikes = [...rows]
    .filter((r) => r.likes > 0)
    .sort((a, b) => b.likes - a.likes || b.coins - a.coins)
    .slice(0, 3)
    .map((r, i): TrophyWinner => ({ ...r, category: "likes", place: i + 1 }));
  const byCoins = [...rows]
    .sort((a, b) => b.coins - a.coins || b.likes - a.likes)
    .slice(0, 3)
    .map((r, i): TrophyWinner => ({ ...r, category: "coins", place: i + 1 }));
  return [...byLikes, ...byCoins];
}

/** Кто получит кубки, если нажать кнопку прямо сейчас */
export function adminTrophyPreview(): Result<{ winners: TrophyWinner[] }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ winners: TrophyWinner[] }>;
  return { ok: true, winners: trophyWinners(ctx.db) };
}

/** Выдать кристалл «Кубок» топ-3 по лайкам и топ-3 по монетам (по одному за каждое место в каждом топе) */
export function adminAwardTrophies(): Result<{ message: string; winners: TrophyWinner[] }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ message: string; winners: TrophyWinner[] }>;
  const { db } = ctx;
  const winners = trophyWinners(db);
  if (winners.length === 0) return fail("Пока некому выдавать кубки.") as Result<{ message: string; winners: TrophyWinner[] }>;
  for (const w of winners) {
    db.saves[w.userId] = addCrystal(normalizeSave(db.saves[w.userId]), "trophy", 1);
    addLog(db, w.userId, "crystal_in", "Награда за активность: кристалл «Кубок»");
  }
  write(db);
  const names = [...new Set(winners.map((w) => w.username))].join(", ");
  return { ok: true, message: `Кубок выдан (${winners.length} шт.): ${names}.`, winners };
}

export function adminAct(a: AdminAction): Result<{ message: string }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ message: string }>;
  const { db, admin } = ctx;
  const target = db.users.find((x) => x.id === a.userId);
  if (!target) return fail("Пользователь не найден.") as Result<{ message: string }>;
  const s = normalizeSave(db.saves[target.id]);

  switch (a.action) {
    case "coins": {
      const n = Math.floor(Number(a.amount));
      if (!Number.isFinite(n) || n < 1 || n > MAX_GRANT) {
        return fail(`Введите целое число монет от 1 до ${MAX_GRANT.toLocaleString("ru-RU")}.`) as Result<{ message: string }>;
      }
      db.saves[target.id] = { ...s, coins: s.coins + n };
      addLog(db, target.id, "coins_in", `Администратор ${admin.username} выдал ${n.toLocaleString("ru-RU")} монет`);
      write(db);
      return { ok: true, message: `Выдано ${n.toLocaleString("ru-RU")} монет игроку ${target.username}.` };
    }
    case "crystal": {
      const def = CRYSTALS.find((c) => c.id === a.crystal);
      if (!def) return fail("Неизвестный кристалл.") as Result<{ message: string }>;
      const n = Math.floor(Number(a.amount));
      if (!Number.isFinite(n) || n < 1 || n > 10_000) {
        return fail("Количество кристаллов — от 1 до 10 000.") as Result<{ message: string }>;
      }
      db.saves[target.id] = addCrystal(s, def.id, n);
      addLog(db, target.id, "crystal_in", `Администратор ${admin.username} выдал кристалл «${def.name}» ×${n}`);
      write(db);
      return { ok: true, message: `Кристалл «${def.name}» ×${n} отправлен игроку ${target.username}.` };
    }
    case "verify": {
      target.verified = a.verified === true;
      write(db);
      return {
        ok: true,
        message: target.verified ? `Игроку ${target.username} выдана галочка.` : `Галочка у игрока ${target.username} снята.`,
      };
    }
    case "ban": {
      if (a.banned) {
        if (target.id === admin.id) return fail("Нельзя заблокировать самого себя.") as Result<{ message: string }>;
        if (isAdminName(target.username)) return fail("Нельзя заблокировать администратора.") as Result<{ message: string }>;
        target.banned = true;
        target.banReason = String(a.reason ?? "").trim().slice(0, 120);
      } else {
        target.banned = false;
        target.banReason = "";
      }
      write(db);
      return { ok: true, message: a.banned ? `Игрок ${target.username} заблокирован.` : `Игрок ${target.username} разблокирован.` };
    }
  }
}

/** Админ создаёт коллекционный кристалл (кристалл + модель + фон) и получает его в инвентарь */
export function adminCreateCollectible(spec: { crystal: string; model: string; bg: string }): Result<{ message: string; item: Collectible }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ message: string; item: Collectible }>;
  const { db, admin } = ctx;
  const crystal = CRYSTALS.find((c) => c.id === spec.crystal);
  if (!crystal) return fail("Выберите коллекционный кристалл.") as Result<{ message: string; item: Collectible }>;
  const model = ALL_MODELS.find((m) => m.id === spec.model);
  if (!model || model.family !== crystal.id) return fail("Выберите модель, подходящую этому кристаллу.") as Result<{ message: string; item: Collectible }>;
  if (!BG_BY_ID[spec.bg]) return fail("Выберите фон.") as Result<{ message: string; item: Collectible }>;
  if (!bgsOf(crystal.id).some((b) => b.id === spec.bg)) return fail("Этот фон эксклюзивен для другого кристалла.") as Result<{ message: string; item: Collectible }>;
  const item: Collectible = {
    uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    model: model.id,
    bg: spec.bg,
    crystal: crystal.id,
    createdAt: new Date().toISOString(),
  };
  const s = normalizeSave(db.saves[admin.id]);
  db.saves[admin.id] = { ...s, collectibles: [...s.collectibles, item] };
  addLog(db, admin.id, "crystal_in", `Админ-создание: ${describe(item)}`);
  write(db);
  return { ok: true, message: `Создан ${describe(item)} — он уже в вашем инвентаре.`, item };
}

/* ======================================================================
 * Коллекционные кристаллы, рынок, поиск игроков, лайки и статистика
 * ====================================================================== */

type Fail = { ok: false; error: string; field?: string };
const bad = (error: string): Fail => ({ ok: false, error });
const NEED_LOGIN = "Нужно войти в аккаунт.";

function sessionUser(db: DB): UserRow | null {
  const u = db.users.find((x) => x.id === db.session);
  return u && !u.banned ? u : null;
}

/** Улучшение «???»-кристалла до коллекционного за UPGRADE_COST монет */
export function upgradeCrystal(id: string, bonus: boolean): Result<{ item: Collectible }> {
  const db = read();
  const user = sessionUser(db);
  if (!user) return bad(NEED_LOGIN);
  const def = CRYSTAL_BY_ID[id as CrystalId];
  if (!def) return bad("Неизвестный кристалл.");
  if (!isSecret(def)) return bad("Улучшать можно только кристаллы редкости «???».");
  const s = normalizeSave(db.saves[user.id]);
  const bucket = bonus ? s.bonus : s.plain;
  if (bucket[def.id] < 1) return bad("У вас нет такого кристалла.");
  if (s.coins < UPGRADE_COST) return bad(`Не хватает монет: нужно ${UPGRADE_COST.toLocaleString("ru-RU")}.`);
  const item = rollCollectible(def.id);
  const nb = { ...bucket, [def.id]: bucket[def.id] - 1 };
  db.saves[user.id] = {
    ...s,
    coins: s.coins - UPGRADE_COST,
    ...(bonus ? { bonus: nb } : { plain: nb }),
    collectibles: [...s.collectibles, item],
  };
  addLog(db, user.id, "coins_out", `Улучшение «${def.name}»: −${UPGRADE_COST.toLocaleString("ru-RU")} монет`);
  addLog(db, user.id, "crystal_in", `Получен коллекционный кристалл ${describe(item)}`);
  write(db);
  return { ok: true, item };
}

export interface ListingView {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerVerified: boolean;
  sellerFeatured: Collectible | null;
  item: Collectible;
  price: number;
  createdAt: string;
}

/** Все активные лоты (новые — первыми) */
export function getListings(): ListingView[] {
  const db = read();
  return db.listings
    .map((l) => ({ l, u: db.users.find((x) => x.id === l.sellerId) }))
    .filter((x): x is { l: Listing; u: UserRow } => !!x.u && !x.u.banned)
    .map(({ l, u }) => ({ id: l.id, sellerId: l.sellerId, sellerName: u.username, sellerVerified: !!u.verified, sellerFeatured: featuredOf(db, u, db.session), item: l.item, price: l.price, createdAt: l.createdAt }))
    .sort((a, b) => b.id - a.id);
}

/** Выставить коллекционный кристалл на рынок по цене, которую устанавливает сайт */
export function listCollectible(uid: string): Result<{ price: number }> {
  const db = read();
  const user = sessionUser(db);
  if (!user) return bad(NEED_LOGIN);
  const s = normalizeSave(db.saves[user.id]);
  const item = s.collectibles.find((c) => c.uid === uid);
  if (!item || !MODEL_BY_ID[item.model] || !BG_BY_ID[item.bg]) return bad("Кристалл не найден.");
  const price = collectiblePrice(item);
  db.saves[user.id] = { ...s, collectibles: s.collectibles.filter((c) => c.uid !== uid) };
  db.listings.push({ id: db.nextListingId++, sellerId: user.id, item, price, createdAt: new Date().toISOString() });
  addLog(db, user.id, "crystal_out", `Выставлен на рынок ${describe(item)}`);
  write(db);
  return { ok: true, price };
}

/** Снять свой лот с продажи */
export function unlistCollectible(listingId: number): Result {
  const db = read();
  const user = sessionUser(db);
  if (!user) return bad(NEED_LOGIN);
  const l = db.listings.find((x) => x.id === listingId);
  if (!l || l.sellerId !== user.id) return bad("Лот не найден.");
  const s = normalizeSave(db.saves[user.id]);
  db.saves[user.id] = { ...s, collectibles: [...s.collectibles, l.item] };
  db.listings = db.listings.filter((x) => x.id !== listingId);
  addLog(db, user.id, "crystal_in", `Снят с рынка ${describe(l.item)}`);
  write(db);
  return { ok: true };
}

/** Купить лот другого игрока за монеты */
export function buyListing(listingId: number): Result<{ item: Collectible; price: number }> {
  const db = read();
  const user = sessionUser(db);
  if (!user) return bad(NEED_LOGIN);
  const l = db.listings.find((x) => x.id === listingId);
  if (!l) return bad("Этот лот уже продан или снят с продажи.");
  if (l.sellerId === user.id) return bad("Нельзя купить собственный кристалл.");
  const s = normalizeSave(db.saves[user.id]);
  if (s.coins < l.price) return bad("Не хватает монет.");
  const seller = db.users.find((x) => x.id === l.sellerId);
  if (seller) {
    const ss = normalizeSave(db.saves[seller.id]);
    db.saves[seller.id] = { ...ss, coins: ss.coins + l.price };
    addLog(db, seller.id, "coins_in", `Продажа на рынке игроку ${user.username}: +${l.price.toLocaleString("ru-RU")} монет`);
    addLog(db, seller.id, "crystal_out", `Передан игроку ${user.username}: ${describe(l.item)}`);
  }
  addLog(db, user.id, "coins_out", `Покупка на рынке у ${seller?.username ?? "игрока"}: −${l.price.toLocaleString("ru-RU")} монет`);
  addLog(db, user.id, "crystal_in", `Получен с рынка ${describe(l.item)}`);
  db.saves[user.id] = { ...s, coins: s.coins - l.price, collectibles: [...s.collectibles, l.item] };
  db.listings = db.listings.filter((x) => x.id !== listingId);
  write(db);
  return { ok: true, item: l.item, price: l.price };
}

/* ---------- поиск, профили, лайки, статистика ---------- */

export interface UserHit {
  id: number;
  username: string;
  likes: number;
  verified: boolean;
  featured: Collectible | null;
}

export function searchUsers(query: string): UserHit[] {
  const db = read();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.users
    .filter((u) => !u.banned && u.usernameLower.includes(q))
    .sort((a, b) => Number(b.usernameLower.startsWith(q)) - Number(a.usernameLower.startsWith(q)) || a.usernameLower.localeCompare(b.usernameLower))
    .slice(0, 30)
    .map((u) => ({ id: u.id, username: u.username, likes: db.likes[u.id]?.length ?? 0, verified: !!u.verified, featured: featuredOf(db, u, db.session) }));
}

export interface ProfileView {
  id: number;
  username: string;
  verified: boolean;
  featured: Collectible | null;
  /** игрок скрыл профиль («Статистика и профиль» выключено) */
  hidden: boolean;
  bio: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  isMe: boolean;
  coins: number;
  opened: number;
  found: number;
  crystals: { id: CrystalId; plain: number; bonus: number }[];
  collectibles: Collectible[];
  /** коллекционные кристаллы, выставленные на рынок */
  listed: Collectible[];
}

export function getProfile(id: number): ProfileView | null {
  const db = read();
  const u = db.users.find((x) => x.id === id);
  if (!u || u.banned) return null;
  const s = normalizeSave(db.saves[u.id]);
  const me = sessionUser(db);
  const likes = db.likes[u.id] ?? [];
  const hidden = isHidden(u);
  if (hidden && !(me && me.id === u.id)) {
    return {
      id: u.id,
      username: u.username,
      verified: !!u.verified,
      featured: null,
      hidden: true,
      bio: "",
      createdAt: u.createdAt,
      likes: 0,
      liked: false,
      isMe: false,
      coins: 0,
      opened: 0,
      found: 0,
      crystals: [],
      collectibles: [],
      listed: [],
    };
  }
  return {
    id: u.id,
    username: u.username,
    verified: !!u.verified,
    featured: featuredOf(db, u, me?.id),
    hidden,
    bio: u.bio ?? "",
    createdAt: u.createdAt,
    likes: likes.length,
    liked: !!me && likes.includes(me.id),
    isMe: !!me && me.id === u.id,
    coins: s.coins,
    opened: s.opened,
    found: CRYSTALS.filter((c) => s.found[c.id] > 0).length,
    crystals: [...CRYSTALS]
      .sort((a, b) => b.price - a.price)
      .map((c) => ({ id: c.id, plain: s.plain[c.id], bonus: s.bonus[c.id] }))
      .filter((c) => c.plain + c.bonus > 0),
    collectibles: s.collectibles,
    listed: db.listings.filter((l) => l.sellerId === u.id).map((l) => l.item),
  };
}

/** Поставить или снять лайк с чужого профиля */
export function toggleLike(targetId: number): Result<{ liked: boolean; likes: number }> {
  const db = read();
  const me = sessionUser(db);
  if (!me) return bad(NEED_LOGIN);
  if (me.id === targetId) return bad("Нельзя лайкнуть собственный профиль.");
  const target = db.users.find((x) => x.id === targetId);
  if (!target || target.banned) return bad("Игрок не найден.");
  const list = db.likes[targetId] ?? [];
  const liked = !list.includes(me.id);
  db.likes[targetId] = liked ? [...list, me.id] : list.filter((x) => x !== me.id);
  write(db);
  return { ok: true, liked, likes: db.likes[targetId].length };
}

export interface StatRow {
  id: number;
  username: string;
  verified: boolean;
  featured: Collectible | null;
  likes: number;
  coins: number;
}

/** В статистику попадают только игроки с включённой настройкой «Статистика и профиль» */
export function getStats(): StatRow[] {
  const db = read();
  return db.users
    .filter((u) => !u.banned && !isHidden(u))
    .map((u) => ({
      id: u.id,
      username: u.username,
      verified: !!u.verified,
      featured: featuredOf(db, u, db.session),
      likes: db.likes[u.id]?.length ?? 0,
      coins: normalizeSave(db.saves[u.id]).coins,
    }));
}

/* ======================================================================
 * Подарки
 * ====================================================================== */

export type GiftSpec =
  | { kind: "crystal"; id: string; bonus: boolean; amount: number }
  | { kind: "collectible"; uid: string };

/** Подарить игроку любой свой кристалл (обычный или коллекционный) */
export function giftItem(targetId: number, spec: GiftSpec): Result<{ message: string }> {
  const db = read();
  const me = sessionUser(db);
  if (!me) return bad(NEED_LOGIN);
  if (me.id === targetId) return bad("Нельзя подарить кристалл самому себе.");
  const target = db.users.find((x) => x.id === targetId);
  if (!target || target.banned) return bad("Игрок не найден.");
  const mine = normalizeSave(db.saves[me.id]);
  const theirs = normalizeSave(db.saves[target.id]);

  if (spec.kind === "collectible") {
    const item = mine.collectibles.find((c) => c.uid === spec.uid);
    if (!item) return bad("Этого кристалла нет в вашей коллекции.");
    db.saves[me.id] = { ...mine, collectibles: mine.collectibles.filter((c) => c.uid !== spec.uid) };
    db.saves[target.id] = { ...theirs, collectibles: [...theirs.collectibles, item] };
    if (me.featured === spec.uid) me.featured = null;
    addLog(db, me.id, "crystal_out", `Подарок игроку ${target.username}: ${describe(item)}`);
    addLog(db, target.id, "crystal_in", `Подарок от игрока ${me.username}: ${describe(item)}`);
    write(db);
    const m = MODEL_BY_ID[item.model];
    return { ok: true, message: `Вы подарили «${m?.name ?? "кристалл"}» игроку ${target.username}.` };
  }

  if (!isCrystalId(spec.id)) return bad("Неизвестный кристалл.");
  const id = spec.id as CrystalId;
  const n = Math.floor(Number(spec.amount));
  if (!Number.isFinite(n) || n < 1) return bad("Укажите количество.");
  const from = spec.bonus ? mine.bonus : mine.plain;
  if (from[id] < n) return bad("У вас нет столько таких кристаллов.");
  const to = spec.bonus ? theirs.bonus : theirs.plain;
  db.saves[me.id] = { ...mine, ...(spec.bonus ? { bonus: { ...from, [id]: from[id] - n } } : { plain: { ...from, [id]: from[id] - n } }) };
  db.saves[target.id] = {
    ...theirs,
    found: { ...theirs.found, [id]: Math.max(theirs.found[id], 1) },
    ...(spec.bonus ? { bonus: { ...to, [id]: to[id] + n } } : { plain: { ...to, [id]: to[id] + n } }),
  };
  const def = CRYSTAL_BY_ID[id];
  addLog(db, me.id, "crystal_out", `Подарок игроку ${target.username}: «${def.name}» ×${n}`);
  addLog(db, target.id, "crystal_in", `Подарок от игрока ${me.username}: «${def.name}» ×${n}`);
  write(db);
  return { ok: true, message: `Вы подарили «${def.name}» ×${n} игроку ${target.username}.` };
}

/* ======================================================================
 * Репорты
 * ====================================================================== */

export const REPORT_MAX = 1000;

export function reportUser(targetId: number, reason: string): Result {
  const db = read();
  const me = sessionUser(db);
  if (!me) return bad(NEED_LOGIN);
  if (me.id === targetId) return bad("Нельзя пожаловаться на самого себя.");
  const target = db.users.find((x) => x.id === targetId);
  if (!target) return bad("Игрок не найден.");
  const text = String(reason ?? "").replace(/\r\n/g, "\n").trim();
  if (text.length < 1) return bad("Опишите причину жалобы.");
  if (text.length > REPORT_MAX) return bad(`Причина — не более ${REPORT_MAX} символов.`);
  if (db.reports.some((r) => !r.resolved && r.reporterId === me.id && r.targetId === targetId)) {
    return bad("Ваша жалоба на этого игрока уже на рассмотрении.");
  }
  db.reports.push({
    id: db.nextReportId++,
    reporterId: me.id,
    reporterName: me.username,
    targetId,
    targetName: target.username,
    reason: text,
    createdAt: new Date().toISOString(),
    resolved: false,
  });
  write(db);
  return { ok: true };
}

export function adminListReports(): Result<{ reports: ReportRow[] }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ reports: ReportRow[] }>;
  const reports = [...ctx.db.reports]
    .map((r) => ({ ...r, targetName: ctx.db.users.find((u) => u.id === r.targetId)?.username ?? r.targetName }))
    .sort((a, b) => b.id - a.id);
  return { ok: true, reports };
}

/** Журнал переводов и получения монет и кристаллов выбранного игрока (новые — первыми) */
export function adminUserLogs(userId: number): Result<{ logs: LogEntry[] }> {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED) as Result<{ logs: LogEntry[] }>;
  const logs = ctx.db.logs.filter((l) => l.userId === userId).slice(-200).reverse();
  return { ok: true, logs };
}

export function adminResolveReport(id: number, resolved: boolean): Result {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED);
  const r = ctx.db.reports.find((x) => x.id === id);
  if (!r) return fail("Жалоба не найдена.");
  r.resolved = resolved;
  r.resolvedBy = resolved ? ctx.admin.username : undefined;
  write(ctx.db);
  return { ok: true };
}

export function adminDeleteReport(id: number): Result {
  const ctx = adminCtx();
  if (!ctx) return fail(DENIED);
  ctx.db.reports = ctx.db.reports.filter((x) => x.id !== id);
  write(ctx.db);
  return { ok: true };
}

/* ======================================================================
 * Крафт
 * ====================================================================== */

export interface CraftOutcome {
  success: boolean;
  /** сколько слотов было занято */
  count: number;
  /** шанс успеха, 0..1 */
  chance: number;
  /** сумма цен вложенных кристаллов */
  sum: number;
  /** полученный коллекционный кристалл */
  item?: Collectible;
  /** полученный «чистый» кристалл (редкий исход) */
  pure?: CrystalId;
}

/** Крафт: до 6 коллекционных кристаллов. Шанс успеха — (занятые слоты) к 6. При неудаче вложенное сгорает. */
export function craftCollectibles(uids: string[]): Result<{ outcome: CraftOutcome }> {
  const db = read();
  const user = sessionUser(db);
  if (!user) return bad(NEED_LOGIN);
  const ids = [...new Set(uids)];
  if (ids.length < 1) return bad("Положите хотя бы один кристалл в слот.");
  if (ids.length > CRAFT_SLOTS) return bad(`Слотов всего ${CRAFT_SLOTS}.`);
  const s = normalizeSave(db.saves[user.id]);
  const items = ids.map((id) => s.collectibles.find((c) => c.uid === id));
  if (items.some((x) => !x)) return bad("Один из кристаллов не найден в вашей коллекции.");
  const used = items as Collectible[];
  const sum = craftSum(used);
  const chance = craftChance(used.length);
  let save: Save = { ...s, collectibles: s.collectibles.filter((c) => !ids.includes(c.uid)) };
  for (const it of used) addLog(db, user.id, "crystal_out", `Вложен в крафт: ${describe(it)}`);
  if (user.featured && ids.includes(user.featured)) user.featured = null;

  const outcome: CraftOutcome = { success: Math.random() < chance, count: used.length, chance, sum };
  if (outcome.success) {
    const roll = Math.random();
    if (roll < CRAFT_SKULL_CHANCE) {
      save = addCrystal(save, "skull", 1);
      outcome.pure = "skull";
      addLog(db, user.id, "crystal_in", `Крафт удался: получен чистый кристалл «${CRYSTAL_BY_ID.skull.name}»`);
    } else if (roll < CRAFT_SKULL_CHANCE + CRAFT_PURE_CHANCE) {
      save = addCrystal(save, "chess", 1);
      outcome.pure = "chess";
      addLog(db, user.id, "crystal_in", `Крафт удался: получен чистый кристалл «${CRYSTAL_BY_ID.chess.name}»`);
    } else {
      const item = rollCraftResult(sum);
      // кристалл из крафта тоже должен попасть в «Коллекцию»: отмечаем его вид как найденный (инвентарь не трогаем)
      save = {
        ...save,
        found: { ...save.found, [item.crystal]: Math.max(save.found[item.crystal] ?? 0, 1) },
        collectibles: [...save.collectibles, item],
      };
      outcome.item = item;
      addLog(db, user.id, "crystal_in", `Крафт удался: получен ${describe(item)}`);
    }
  } else {
    addLog(db, user.id, "crystal_out", `Крафт не удался (шанс ${used.length} к ${CRAFT_SLOTS}): вложенные кристаллы потеряны`);
  }
  db.saves[user.id] = save;
  write(db);
  return { ok: true, outcome };
}
