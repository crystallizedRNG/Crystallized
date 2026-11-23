import type { Collectible } from "./collectibles";
import { CRYSTAL_BY_ID, CRYSTALS, rollCrystal, type CrystalDef, type CrystalId, type Odds } from "./crystals";

export type ChestId = "wooden" | "silver" | "golden" | "cosmic" | "frozen" | "volcanic" | "celestial";

export interface ChestDef {
  id: ChestId;
  name: string;
  price: number;
  /** шансы выпадения в процентах — только кристаллы этого сундука */
  odds: Odds;
  description: string;
  theme: ChestTheme;
}

export interface ChestTheme {
  wood: [string, string];
  lid: [string, string];
  iron: [string, string, string];
  lock: [string, string, string];
  accent: string;
}

/** Множитель цены за первое выпадение нового кристалла */
export const FIRST_DROP_MULT = 2;
export const START_COINS = 100;

export const CHESTS: ChestDef[] = [
  {
    id: "wooden",
    name: "Деревянный сундук",
    price: 45,
    odds: { quartz: 45, sapphire: 30, citrine: 18, amethyst: 7 },
    description: "Простой сундук: кварц, сапфир, цитрин и аметист.",
    theme: {
      wood: ["#9a6330", "#4e2b12"],
      lid: ["#b57a3d", "#74451f"],
      iron: ["#4b5563", "#9ca3af", "#374151"],
      lock: ["#fef3c7", "#f59e0b", "#b45309"],
      accent: "#f59e0b",
    },
  },
  {
    id: "silver",
    name: "Серебряный сундук",
    price: 80,
    odds: { aquamarine: 40, emerald: 35, garnet: 20, ruby: 5 },
    description: "Морские и лесные самоцветы, а с удачей — рубин.",
    theme: {
      wood: ["#64748b", "#2b3648"],
      lid: ["#94a3b8", "#475569"],
      iron: ["#cbd5e1", "#f8fafc", "#94a3b8"],
      lock: ["#e0f2fe", "#7dd3fc", "#0369a1"],
      accent: "#7dd3fc",
    },
  },
  {
    id: "golden",
    name: "Золотой сундук",
    price: 140,
    odds: { topaz: 52, diamond: 32, astralite: 13, abyss: 3 },
    description: "Королевский сундук с космическими редкостями.",
    theme: {
      wood: ["#e0a41f", "#8a5207"],
      lid: ["#f6c23e", "#a8650a"],
      iron: ["#3b1d5e", "#7c4dbd", "#2a1245"],
      lock: ["#fef3c7", "#f59e0b", "#b45309"],
      accent: "#fbbf24",
    },
  },
  {
    id: "cosmic",
    name: "Космический сундук",
    price: 340,
    odds: { moonstone: 36, tourmaline: 28, opal: 20, alexandrite: 11.5, starsapphire: 4, genesis: 0.5 },
    description: "Лунный свет, небесные радуги… и тот, чьё имя скрыто.",
    theme: {
      wood: ["#3b2f9e", "#120a42"],
      lid: ["#5b45d6", "#231a63"],
      iron: ["#0f172a", "#67e8f9", "#0b1226"],
      lock: ["#cffafe", "#22d3ee", "#0e7490"],
      accent: "#22d3ee",
    },
  },
  {
    id: "frozen",
    name: "Ледяной сундук",
    price: 400,
    odds: { kyanite: 39.5, celestine: 30, larimar: 20, frostdiamond: 10, snowflake: 0.5 },
    description: "Холодные кристаллы вечной мерзлоты… и одна-единственная снежинка во льду.",
    theme: {
      wood: ["#7dd3fc", "#1e5a8a"],
      lid: ["#bae6fd", "#3b82b8"],
      iron: ["#e0f2fe", "#ffffff", "#7dd3fc"],
      lock: ["#ffffff", "#7dd3fc", "#0369a1"],
      accent: "#7dd3fc",
    },
  },
  {
    id: "volcanic",
    name: "Вулканический сундук",
    price: 600,
    odds: { sunstone: 34.5, fireopal: 28, carnelian: 20, magmaheart: 13, dragonblood: 4, sprout: 0.5 },
    description: "Жар недр: от солнечного камня до крови дракона.",
    theme: {
      wood: ["#7f1d1d", "#2a0a05"],
      lid: ["#b91c1c", "#450a0a"],
      iron: ["#1c1917", "#f97316", "#0c0a09"],
      lock: ["#fff1d6", "#fb923c", "#c2410c"],
      accent: "#fb923c",
    },
  },
  {
    id: "celestial",
    name: "Небесный сундук",
    price: 1450,
    odds: { selenite: 34.5, labradorite: 27, fluorite: 20, stardust: 13, galaxyheart: 5, skyeye: 0.5 },
    description: "Сокровища небес: лунный свет, сияния, сердце галактики… и тот, кто смотрит с неба.",
    theme: {
      wood: ["#6d28d9", "#1e0a4a"],
      lid: ["#a78bfa", "#4c1d95"],
      iron: ["#fdf4ff", "#f0abfc", "#a78bfa"],
      lock: ["#ffffff", "#f0abfc", "#a21caf"],
      accent: "#f0abfc",
    },
  },
];

export const totalChests = (s: Pick<Save, "chests">) => Object.values(s.chests).reduce((a, b) => a + b, 0);

/** Кристаллы, которые выпадают из сундука (по порядку редкости) */
export const crystalsOf = (chest: ChestDef): CrystalDef[] =>
  CRYSTALS.filter((c) => (chest.odds[c.id] ?? 0) > 0);

export const CHEST_BY_ID = Object.fromEntries(CHESTS.map((c) => [c.id, c])) as Record<ChestId, ChestDef>;

export type CrystalCounts = Record<CrystalId, number>;

export interface Save {
  coins: number;
  chests: Record<ChestId, number>;
  /** обычные кристаллы в инвентаре */
  plain: CrystalCounts;
  /** кристаллы с бонусом за первое выпадение */
  bonus: CrystalCounts;
  /** сколько всего выпало (для коллекции) */
  found: CrystalCounts;
  opened: number;
  sold: number;
  /** коллекционные кристаллы (улучшенные «???») */
  collectibles: Collectible[];
}

export const zeroCrystals = (): CrystalCounts =>
  Object.fromEntries(CRYSTALS.map((c) => [c.id, 0])) as CrystalCounts;

export function freshSave(): Save {
  return {
    coins: START_COINS,
    chests: { wooden: 1, silver: 0, golden: 0, cosmic: 0, frozen: 0, volcanic: 0, celestial: 0 },
    plain: zeroCrystals(),
    bonus: zeroCrystals(),
    found: zeroCrystals(),
    opened: 0,
    sold: 0,
    collectibles: [],
  };
}

/** Приводит данные из БД к актуальной форме (добавляет недостающие ключи) */
export function normalizeSave(p: Partial<Save> | null | undefined): Save {
  const f = freshSave();
  if (!p) return f;
  return {
    ...f,
    ...p,
    chests: { ...f.chests, ...p.chests },
    plain: { ...f.plain, ...p.plain },
    bonus: { ...f.bonus, ...p.bonus },
    found: { ...f.found, ...p.found },
    collectibles: Array.isArray(p.collectibles) ? p.collectibles : [],
  };
}

export const sellPrice = (id: CrystalId, bonus: boolean) =>
  CRYSTAL_BY_ID[id].price * (bonus ? FIRST_DROP_MULT : 1);

export interface OpenResult {
  crystal: CrystalDef;
  isNew: boolean;
}

/* ---------- чистые переходы состояния (выполняются на сервере) ---------- */

export const isChestId = (v: unknown): v is ChestId => v === "wooden" || v === "silver" || v === "golden" || v === "cosmic" || v === "frozen" || v === "volcanic" || v === "celestial";
export const isCrystalId = (v: unknown): v is CrystalId => typeof v === "string" && v in CRYSTAL_BY_ID;

export function applyBuy(s: Save, id: ChestId): Save | null {
  const price = CHEST_BY_ID[id].price;
  if (s.coins < price) return null;
  return { ...s, coins: s.coins - price, chests: { ...s.chests, [id]: s.chests[id] + 1 } };
}

export function applyOpen(s: Save, id: ChestId): { save: Save; result: OpenResult } | null {
  if (s.chests[id] < 1) return null;
  const crystal = rollCrystal(CHEST_BY_ID[id].odds);
  const isNew = s.found[crystal.id] === 0;
  const save: Save = {
    ...s,
    chests: { ...s.chests, [id]: s.chests[id] - 1 },
    found: { ...s.found, [crystal.id]: s.found[crystal.id] + 1 },
    plain: isNew ? s.plain : { ...s.plain, [crystal.id]: s.plain[crystal.id] + 1 },
    bonus: isNew ? { ...s.bonus, [crystal.id]: s.bonus[crystal.id] + 1 } : s.bonus,
    opened: s.opened + 1,
  };
  return { save, result: { crystal, isNew } };
}

export function applySell(s: Save, id: CrystalId, bonus: boolean, amount: number): { save: Save; gain: number } | null {
  const bucket = bonus ? s.bonus : s.plain;
  const n = Math.min(Math.floor(amount), bucket[id]);
  if (!(n >= 1)) return null;
  const gain = n * sellPrice(id, bonus);
  const nb = { ...bucket, [id]: bucket[id] - n };
  return {
    save: { ...s, coins: s.coins + gain, sold: s.sold + n, ...(bonus ? { bonus: nb } : { plain: nb }) },
    gain,
  };
}

export function applySellAllPlain(s: Save): { save: Save; gain: number } | null {
  let gain = 0;
  let n = 0;
  for (const c of CRYSTALS) {
    gain += s.plain[c.id] * c.price;
    n += s.plain[c.id];
  }
  if (!n) return null;
  return { save: { ...s, coins: s.coins + gain, sold: s.sold + n, plain: zeroCrystals() }, gain };
}

export const cheapestChestPrice = () => Math.min(...CHESTS.map((c) => c.price));

/** Помощь доступна только если у игрока совсем ничего не осталось */
export function isStuck(s: Save): boolean {
  const chestsLeft = totalChests(s);
  const totalCrystals = CRYSTALS.reduce((n, c) => n + s.plain[c.id] + s.bonus[c.id], 0);
  return chestsLeft === 0 && totalCrystals === 0 && s.coins < cheapestChestPrice();
}
