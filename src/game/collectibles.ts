import { CRYSTAL_BY_ID, type CrystalDef, type CrystalId, type GenPalette } from "./crystals";

/** Стоимость улучшения «???»-кристалла до коллекционного (в монетах) */
export const UPGRADE_COST = 3400;

/** Цветовая гамма: если у модели и фона она совпадает — это «монохром» и даётся бонус к цене */
export type Tone =
  | "gray"
  | "black"
  | "white"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "purple"
  | "checker"
  | "pink"
  | "aurora"
  | "galaxy"
  | "rainbow"
  | "beige"
  | "alien";

export const TONE_NAMES: Record<Tone, string> = {
  gray: "серый",
  black: "чёрный",
  white: "белый",
  red: "красный",
  orange: "оранжевый",
  yellow: "жёлтый",
  green: "зелёный",
  teal: "бирюзовый",
  blue: "синий",
  violet: "фиолетовый",
  purple: "пурпурный",
  checker: "клетка",
  pink: "розовый",
  aurora: "северное сияние",
  galaxy: "галактика",
  rainbow: "радуга",
  beige: "бежевый",
  alien: "пришелец",
};

/** Бонус «монохром» — доля от (цена модели + цена фона) */
export const MONO_RATE = 0.25;

/** СУПЕР-бонус: монохром с белым или чёрным цветом (а также «Шах и мат» на клеточном фоне) — доля от (цена модели + цена фона) */
export const SUPER_MONO_RATE = 0.6;

export interface CollectibleModel {
  id: string;
  name: string;
  /** какой «???»-кристалл окрашивает эта модель: «Первозданный Хаос», «Кубок» или «Небесное Око» */
  family: "genesis" | "trophy" | "skyeye" | "chess" | "sprout" | "skull" | "snowflake";
  /** m — цена модели */
  price: number;
  /** цветовая гамма модели (для бонуса «монохром») */
  tone: Tone;
  glow: string;
  /** палитра, которой окрашен кристалл-«Хаос» */
  gen: GenPalette;
  /** редкая модель */
  rare?: boolean;
  /** вес при выпадении */
  weight: number;
}

export interface CollectibleBg {
  id: string;
  name: string;
  /** t — цена цветового фона */
  price: number;
  /** цветовая гамма фона (для бонуса «монохром») */
  tone: Tone;
  /** особый рисунок фона (вместо градиента) */
  pattern?: "checker";
  /** эксклюзивный фон: выпадает (и доступен) только этому кристаллу */
  only?: CrystalId;
  /** цвета градиента (3 шт.) */
  colors: [string, string, string];
  /** цвет искр */
  spark: string;
  /** вес при выпадении */
  weight: number;
}

/** Коллекционный кристалл, полученный улучшением «???»-кристалла */
export interface Collectible {
  uid: string;
  model: string;
  bg: string;
  /** из какого «???»-кристалла он получен */
  crystal: CrystalId;
  createdAt: string;
}

/** Чем дороже — тем реже выпадает */
const weightFor = (price: number) => Math.max(1, Math.round(60000 / (price + 2000)));

type H6 = GenPalette["hues"];
const model = (
  id: string,
  name: string,
  price: number,
  tone: Tone,
  glow: string,
  hues: H6,
  opts: { sat?: number; lift?: number; modern?: boolean; weight?: number } = {},
): CollectibleModel => ({
  id,
  name,
  family: "genesis",
  price,
  tone,
  glow,
  gen: { hues, sat: opts.sat, lift: opts.lift, modern: opts.modern },
  rare: opts.modern,
  weight: opts.weight ?? weightFor(price),
});

/**
 * 25 окрасок кристалла «Первозданный Хаос» + редкая форма modern.
 * Форма у всех одна — различаются палитра и переливание. Цены по возрастанию.
 */
export const MODELS: CollectibleModel[] = [
  model("lime", "Лаймовый хаос", 500, "green", "#a3e635", [90, 75, 65, 80, 100, 125]),
  model("rosequartz", "Розовый кварц", 650, "pink", "#f9a8d4", [340, 330, 350, 335, 320, 345], { sat: 80, lift: 4 }),
  model("citrine", "Цитриновый хаос", 800, "yellow", "#fde047", [62, 55, 68, 58, 50, 72]),
  model("tangerine", "Мандариновый хаос", 950, "orange", "#fb923c", [35, 28, 22, 30, 18, 40]),
  model("lavender", "Лавандовый хаос", 1100, "violet", "#c4b5fd", [270, 260, 280, 265, 250, 285], { sat: 80, lift: 4 }),
  model("ice", "Небесный лёд", 1250, "blue", "#7dd3fc", [195, 200, 190, 205, 185, 210], { sat: 90, lift: 6 }),
  model("malachite", "Малахитовый хаос", 1400, "green", "#34d399", [150, 140, 160, 145, 165, 135], { sat: 70, lift: -6 }),
  model("cobalt", "Кобальтовый хаос", 1600, "blue", "#60a5fa", [225, 215, 230, 220, 235, 210], { sat: 90, lift: -4 }),
  model("sakura", "Сакура", 1800, "pink", "#f472b6", [335, 350, 325, 340, 355, 320], { sat: 90, lift: 2 }),
  model("amber", "Янтарный хаос", 2000, "orange", "#f59e0b", [40, 32, 25, 36, 20, 45], { lift: -4 }),
  model("aqua", "Аквамариновый хаос", 2250, "teal", "#22d3ee", [190, 200, 185, 195, 180, 205], { sat: 90 }),
  model("garnet", "Гранатовый хаос", 2500, "red", "#f43f5e", [350, 5, 340, 355, 330, 10], { sat: 80, lift: -10 }),
  model("turquoise", "Бирюзовый хаос", 2800, "teal", "#2dd4bf", [170, 160, 180, 165, 190, 155], { sat: 90, lift: -2 }),
  model("jade", "Нефритовый хаос", 3100, "green", "#4ade80", [140, 150, 125, 145, 160, 115], { sat: 55 }),
  model("emerald", "Изумрудный хаос", 3500, "green", "#22c55e", [145, 155, 135, 150, 160, 125], { lift: -8 }),
  model("sapphire", "Сапфировый хаос", 3900, "blue", "#3b82f6", [215, 225, 205, 220, 235, 200], { lift: -8 }),
  model("amethyst", "Аметистовый хаос", 4400, "violet", "#a855f7", [275, 285, 265, 280, 295, 255], { sat: 80, lift: -4 }),
  model("ruby", "Рубиновый хаос", 5000, "red", "#fb3b64", [350, 345, 0, 355, 335, 10], { lift: -8 }),
  model("gold", "Золотой хаос", 5800, "yellow", "#facc15", [48, 42, 52, 45, 38, 56], { lift: -6 }),
  model("platinum", "Платиновый хаос", 6600, "gray", "#cbd5e1", [210, 220, 200, 215, 230, 205], { sat: 8 }),
  model("pearl", "Жемчужный хаос", 7600, "white", "#f5d0fe", [330, 280, 200, 300, 180, 50], { sat: 60, lift: 10 }),
  model("aurora", "Северное сияние", 8800, "aurora", "#5eead4", [150, 175, 270, 160, 190, 285]),
  model("galaxy", "Галактический хаос", 10500, "galaxy", "#c026d3", [250, 285, 320, 265, 215, 300], { sat: 90, lift: -8 }),
  model("rainbow", "Радужный хаос", 12500, "rainbow", "#f472b6", [320, 25, 55, 150, 195, 255]),
  model("obsidian", "Обсидиановый хаос", 15000, "black", "#94a3b8", [270, 250, 280, 260, 240, 290], { sat: 12, lift: -45 }),
  // ── редкая модель: чуть изменённая форма (доп. осколки, неоновые рёбра, голографический налёт)
  model("modern", "Modern", 45000, "black", "#22d3ee", [200, 270, 320, 190, 290, 170], {
    sat: 35,
    lift: -40,
    modern: true,
    weight: 2,
  }),
];

/** Названия моделей «Кубка» — те же 25 палитр и цены, что и у «Хаоса» (без редкой формы modern) */
const TROPHY_NAMES: Record<string, string> = {
  lime: "Лаймовый кубок",
  rosequartz: "Кубок из розового кварца",
  citrine: "Цитриновый кубок",
  tangerine: "Мандариновый кубок",
  lavender: "Лавандовый кубок",
  ice: "Ледяной кубок",
  malachite: "Малахитовый кубок",
  cobalt: "Кобальтовый кубок",
  sakura: "Кубок сакуры",
  amber: "Янтарный кубок",
  aqua: "Аквамариновый кубок",
  garnet: "Гранатовый кубок",
  turquoise: "Бирюзовый кубок",
  jade: "Нефритовый кубок",
  emerald: "Изумрудный кубок",
  sapphire: "Сапфировый кубок",
  amethyst: "Аметистовый кубок",
  ruby: "Рубиновый кубок",
  gold: "Золотой кубок",
  platinum: "Платиновый кубок",
  pearl: "Жемчужный кубок",
  aurora: "Кубок северного сияния",
  galaxy: "Галактический кубок",
  rainbow: "Радужный кубок",
  obsidian: "Обсидиановый кубок",
};

/** Перекрашенные кубки: та же палитра, цена и вес выпадения, что у одноимённой окраски «Хаоса» */
export const TROPHY_MODELS: CollectibleModel[] = MODELS.filter((m) => !m.rare).map((m) => ({
  ...m,
  id: `tr_${m.id}`,
  name: TROPHY_NAMES[m.id] ?? m.name,
  family: "trophy" as const,
}));

/** Названия моделей «Небесного Ока» — те же 25 палитр и цены, что и у «Хаоса» (без редкой формы modern) */
const SKYEYE_NAMES: Record<string, string> = {
  lime: "Лаймовое око",
  rosequartz: "Око из розового кварца",
  citrine: "Цитриновое око",
  tangerine: "Мандариновое око",
  lavender: "Лавандовое око",
  ice: "Ледяное око",
  malachite: "Малахитовое око",
  cobalt: "Кобальтовое око",
  sakura: "Око сакуры",
  amber: "Янтарное око",
  aqua: "Аквамариновое око",
  garnet: "Гранатовое око",
  turquoise: "Бирюзовое око",
  jade: "Нефритовое око",
  emerald: "Изумрудное око",
  sapphire: "Сапфировое око",
  amethyst: "Аметистовое око",
  ruby: "Рубиновое око",
  gold: "Золотое око",
  platinum: "Платиновое око",
  pearl: "Жемчужное око",
  aurora: "Око северного сияния",
  galaxy: "Галактическое око",
  rainbow: "Радужное око",
  obsidian: "Обсидиановое око",
};

/** Перекрашенные «Небесные Очи»: та же палитра, цена и вес выпадения, что у одноимённой окраски «Хаоса» */
export const SKYEYE_MODELS: CollectibleModel[] = MODELS.filter((m) => !m.rare).map((m) => ({
  ...m,
  id: `se_${m.id}`,
  name: SKYEYE_NAMES[m.id] ?? m.name,
  family: "skyeye" as const,
}));

/** «Шах и мат» — 12 фигур. Получить можно только в крафте. Чёрные фигуры чуть дороже белых. */
const chessModel = (id: string, name: string, price: number, white: boolean, glow: string): CollectibleModel => ({
  id,
  name,
  family: "chess",
  price,
  tone: white ? "white" : "black",
  glow,
  gen: { hues: [210, 215, 220, 205, 225, 200], variant: id.replace("ch_", "") },
  weight: weightFor(price),
});

const PIECES: [string, string, string, number][] = [
  ["p", "пешка", "ая", 1000],
  ["n", "конь", "ый", 2500],
  ["b", "слон", "ый", 3000],
  ["r", "ладья", "ая", 4000],
  ["q", "ферзь", "ый", 7000],
  ["k", "король", "ый", 10000],
];

export const CHESS_MODELS: CollectibleModel[] = [
  ...PIECES.map(([k, n, e, price]) => chessModel(`ch_w${k}`, `Бел${e} ${n}`, price, true, "#e2e8f0")),
  ...PIECES.map(([k, n, e, price]) =>
    chessModel(`ch_b${k}`, `${e === "ая" ? "Чёрная" : "Чёрный"} ${n}`, price + 300, false, "#94a3b8"),
  ),
];

/** «Росток в кристалле» — 9 деревьев. Цена модели — надбавка к цене кристалла (8 000). */
const sproutModel = (id: string, name: string, price: number, tone: Tone, glow: string, hue: number, sat = 70, lift = 0): CollectibleModel => ({
  id: `sp_${id}`,
  name,
  family: "sprout",
  price,
  tone,
  glow,
  gen: { hues: [hue, hue, hue, hue, hue, hue], sat, lift, variant: id },
  weight: weightFor(price),
});

export const SPROUT_MODELS: CollectibleModel[] = [
  sproutModel("crystaltree", "Хрустальное дерево", 8000, "teal", "#67e8f9", 185, 80),
  sproutModel("diamondroots", "Алмаз с корнями", 2000, "blue", "#7dd3fc", 200, 85, 6),
  sproutModel("amberoak", "Янтарный дуб", 12000, "orange", "#f59e0b", 38, 90, -4),
  sproutModel("deadman", "Мертвец", 10000, "white", "#e2e8f0", 220, 8, 14),
  sproutModel("bloodfruit", "Кровавый плод", 15000, "red", "#ef4444", 355, 85, -12),
  sproutModel("coppershell", "Медная оболочка", 2000, "orange", "#d9814a", 22, 60, -6),
  sproutModel("junk", "Чудо свалки", 1300, "gray", "#a8a29e", 25, 12, -12),
  sproutModel("moneytree", "Денежное дерево!", 6000, "green", "#4ade80", 140, 70, -4),
  sproutModel("monster", "Дорогой монстр", 7000, "blue", "#38bdf8", 205, 85, -8),
];


/** Названия моделей «Ледяной Снежинки» — те же 25 палитр и цены, что и у «Хаоса» (без редкой формы modern) */
const SNOWFLAKE_NAMES: Record<string, string> = {
  lime: "Лаймовая снежинка",
  rosequartz: "Снежинка из розового кварца",
  citrine: "Цитриновая снежинка",
  tangerine: "Мандариновая снежинка",
  lavender: "Лавандовая снежинка",
  ice: "Небесная снежинка",
  malachite: "Малахитовая снежинка",
  cobalt: "Кобальтовая снежинка",
  sakura: "Снежинка сакуры",
  amber: "Янтарная снежинка",
  aqua: "Аквамариновая снежинка",
  garnet: "Гранатовая снежинка",
  turquoise: "Бирюзовая снежинка",
  jade: "Нефритовая снежинка",
  emerald: "Изумрудная снежинка",
  sapphire: "Сапфировая снежинка",
  amethyst: "Аметистовая снежинка",
  ruby: "Рубиновая снежинка",
  gold: "Золотая снежинка",
  platinum: "Платиновая снежинка",
  pearl: "Жемчужная снежинка",
  aurora: "Снежинка северного сияния",
  galaxy: "Галактическая снежинка",
  rainbow: "Радужная снежинка",
  obsidian: "Обсидиановая снежинка",
};

/** «Ледяная Снежинка» (выпадает из Ледяного сундука) — 25 моделей: те же палитры и цены, что у «Хаоса» */
export const SNOWFLAKE_MODELS: CollectibleModel[] = MODELS.filter((m) => !m.rare).map((m) => ({
  ...m,
  id: `sn_${m.id}`,
  name: SNOWFLAKE_NAMES[m.id] ?? m.name,
  family: "snowflake" as const,
}));

/**
 * «Череп» — самый дорогой кристалл, 30 моделей. Цена модели — надбавка к цене кристалла.
 * variant — набор деталей рисунка через «+» (crown, horns, crack, bandana, flames, cyclops, thirdeye, stitch, stars, alien).
 */
const skullModel = (
  id: string,
  name: string,
  price: number,
  tone: Tone,
  glow: string,
  hues: H6,
  eye: number,
  opts: { sat?: number; lift?: number; variant?: string } = {},
): CollectibleModel => ({
  id: `sk_${id}`,
  name,
  family: "skull",
  price,
  tone,
  glow,
  gen: { hues: [hues[0], hues[1], hues[2], hues[3], hues[4], eye], sat: opts.sat, lift: opts.lift, variant: opts.variant ?? "plain" },
  weight: weightFor(price),
});

/** шесть оттенков вокруг одного основного */
const around = (h: number): H6 => [h, h + 6, h - 6, h + 3, h + 10, h - 3];

export const SKULL_MODELS: CollectibleModel[] = [
  skullModel("bone", "Кость", 3000, "beige", "#e7d9b8", around(42), 0, { sat: 38, lift: 14 }),
  skullModel("ivory", "Слоновая кость", 4200, "beige", "#f3e9cf", around(48), 35, { sat: 30, lift: 20 }),
  skullModel("sand", "Песчаный", 5000, "beige", "#d6b97a", around(38), 25, { sat: 45, lift: 2, variant: "crack" }),
  skullModel("pumpkin", "Тыквенный", 5500, "orange", "#fb923c", around(28), 50, { sat: 90, lift: -2 }),
  skullModel("toxic", "Токсичный", 6500, "green", "#a3e635", around(90), 120, { sat: 85, variant: "crack" }),
  skullModel("bubblegum", "Жвачка", 7000, "pink", "#f9a8d4", around(330), 300, { sat: 80, lift: 6 }),
  skullModel("frost", "Ледяной", 8000, "blue", "#7dd3fc", around(195), 190, { sat: 85, lift: 8 }),
  skullModel("ghost", "Призрачный", 9000, "violet", "#c4b5fd", around(265), 290, { sat: 70, lift: 8, variant: "thirdeye" }),
  skullModel("rust", "Ржавый", 10000, "orange", "#d9814a", around(22), 40, { sat: 60, lift: -8, variant: "crack" }),
  skullModel("emerald", "Изумрудный", 11500, "green", "#22c55e", around(145), 160, { sat: 80, lift: -6 }),
  skullModel("sapphire", "Сапфировый", 13000, "blue", "#3b82f6", around(220), 200, { sat: 85, lift: -6 }),
  skullModel("ruby", "Рубиновый", 15000, "red", "#fb3b64", around(350), 20, { sat: 85, lift: -6 }),
  skullModel("turquoise", "Бирюзовый", 16500, "teal", "#2dd4bf", around(172), 170, { sat: 80, lift: -2 }),
  skullModel("zombie", "Зомби", 18000, "green", "#84cc16", around(100), 60, { sat: 40, lift: -4, variant: "stitch+crack" }),
  skullModel("pirate", "Пират", 19500, "white", "#e2e8f0", around(215), 0, { sat: 8, lift: 14, variant: "bandana" }),
  skullModel("amethyst", "Аметистовый", 21000, "violet", "#a855f7", around(280), 300, { sat: 80, lift: -4, variant: "horns" }),
  skullModel("silver", "Серебряный", 23000, "gray", "#cbd5e1", around(215), 200, { sat: 10, lift: 4 }),
  skullModel("white", "Белоснежный", 26000, "white", "#f8fafc", around(210), 190, { sat: 6, lift: 20 }),
  skullModel("pearl", "Жемчужный", 29000, "white", "#f5d0fe", [330, 280, 200, 300, 180, 50], 280, { sat: 55, lift: 14, variant: "thirdeye" }),
  skullModel("lava", "Лавовый", 32000, "red", "#ff5a1f", around(15), 45, { sat: 95, lift: -12, variant: "crack" }),
  skullModel("gold", "Золотой", 36000, "yellow", "#facc15", around(47), 10, { sat: 95, lift: -4, variant: "crown" }),
  skullModel("black", "Чёрный", 40000, "black", "#94a3b8", around(250), 0, { sat: 8, lift: -42 }),
  skullModel("onyx", "Оникс", 44000, "black", "#a8a29e", around(270), 280, { sat: 10, lift: -46, variant: "crown" }),
  skullModel("obsidian", "Обсидиан", 48000, "black", "#818cf8", around(250), 260, { sat: 14, lift: -48, variant: "crack" }),
  skullModel("cyclops", "Циклоп", 52000, "purple", "#c026d3", around(290), 120, { sat: 85, lift: -10, variant: "cyclops" }),
  skullModel("demon", "Демон", 58000, "red", "#ef4444", around(0), 50, { sat: 90, lift: -16, variant: "horns+thirdeye" }),
  skullModel("inferno", "Адское пламя", 64000, "orange", "#f97316", around(20), 55, { sat: 95, lift: -8, variant: "flames" }),
  skullModel("galaxy", "Космический", 74000, "galaxy", "#c026d3", [250, 285, 320, 265, 215, 300], 190, { sat: 90, lift: -10, variant: "stars" }),
  skullModel("rainbow", "Радужный", 84000, "rainbow", "#f472b6", [320, 25, 55, 150, 195, 255], 60, { sat: 95, variant: "stars" }),
  // самая дорогая модель
  skullModel("alien", "Alien", 95000, "alien", "#a3e635", around(95), 130, { sat: 55, lift: 2, variant: "alien" }),
];

export const ALL_MODELS: CollectibleModel[] = [
  ...MODELS,
  ...TROPHY_MODELS,
  ...SKYEYE_MODELS,
  ...CHESS_MODELS,
  ...SPROUT_MODELS,
  ...SNOWFLAKE_MODELS,
  ...SKULL_MODELS,
];

const bg = (
  id: string,
  name: string,
  price: number,
  tone: Tone,
  colors: [string, string, string],
  spark: string,
): CollectibleBg => ({ id, name, price, tone, colors, spark, weight: weightFor(price) });

/** Цветовые фоны — у каждого своя цена. Самые дорогие: чёрный, затем серый (графит) */
export const BACKGROUNDS: CollectibleBg[] = [
  bg("azure", "Лазурь", 400, "blue", ["#0c4a6e", "#0ea5e9", "#082f49"], "#bae6fd"),
  bg("mint", "Мята", 650, "green", ["#064e3b", "#10b981", "#022c22"], "#a7f3d0"),
  bg("sunset", "Закат", 1000, "orange", ["#7c2d12", "#f97316", "#9d174d"], "#fed7aa"),
  bg("lilac", "Сирень", 1400, "violet", ["#4c1d95", "#a78bfa", "#312e81"], "#ddd6fe"),
  bg("flame", "Пламя", 2000, "red", ["#7f1d1d", "#ef4444", "#f59e0b"], "#fde68a"),
  bg("ocean", "Глубокий океан", 2800, "teal", ["#042f2e", "#0891b2", "#1e1b4b"], "#a5f3fc"),
  bg("aurora", "Аврора", 4000, "aurora", ["#065f46", "#22d3ee", "#7c3aed"], "#99f6e4"),
  bg("galaxy", "Галактика", 6000, "galaxy", ["#1e1b4b", "#c026d3", "#0ea5e9"], "#f5d0fe"),
  bg("graphite", "Графит", 20000, "gray", ["#1f2937", "#475569", "#111827"], "#e2e8f0"),
  bg("black", "Чёрный", 40000, "black", ["#000000", "#121216", "#000000"], "#ffffff"),
  bg("purple", "Пурпурный", 4000, "purple", ["#581c87", "#9333ea", "#3b0764"], "#e9d5ff"),
  bg("amberbg", "Янтарный", 12000, "orange", ["#78350f", "#f59e0b", "#451a03"], "#fde68a"),
  bg("white", "Белый", 30000, "white", ["#e2e8f0", "#ffffff", "#cbd5e1"], "#64748b"),
  { ...bg("checker", "Клеточный", 35000, "checker", ["#0f172a", "#f8fafc", "#0f172a"], "#ef4444"), pattern: "checker" },
  // ── эксклюзивные фоны «Черепа» (другим кристаллам не выпадают)
  { ...bg("beige", "Бежевый", 40000, "beige", ["#a8946a", "#e7d8b8", "#7c6a47"], "#fff7e0"), only: "skull" },
  { ...bg("alienskin", "Пришелец", 55000, "alien", ["#3f6212", "#a3e635", "#1a2e05"], "#ecfccb"), only: "skull" },
];

/** Фоны, доступные кристаллу: общие + эксклюзивные именно для него */
export const bgsOf = (crystal: CrystalId): CollectibleBg[] => BACKGROUNDS.filter((b) => !b.only || b.only === crystal);

export const MODEL_BY_ID = Object.fromEntries(ALL_MODELS.map((m) => [m.id, m])) as Record<string, CollectibleModel>;

/** Старые id моделей (до замены на «Хаос»-окраски) → новые, чтобы сохранённые кристаллы не пропали */
const LEGACY_MODELS: Record<string, string> = {
  dawn: "rosequartz",
  frost: "ice",
  verdant: "malachite",
  azure: "cobalt",
  shadow: "amethyst",
  phoenix: "tangerine",
  lava: "garnet",
  north: "aqua",
  moon: "platinum",
  sun: "gold",
  void: "obsidian",
};
for (const [old, now] of Object.entries(LEGACY_MODELS)) MODEL_BY_ID[old] = MODEL_BY_ID[now];
export const BG_BY_ID = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b])) as Record<string, CollectibleBg>;

export interface PriceParts {
  /** фон */
  t: number;
  /** модель */
  m: number;
  /** сам кристалл */
  c: number;
  /** бонус «монохром» (0, если фон и модель не сочетаются) */
  bonus: number;
  /** фон и модель совпали по цвету и палитре */
  mono: boolean;
  /** СУПЕР-бонус: монохром с белым/чёрным (или «Шах и мат» на клеточном фоне) */
  superBonus: boolean;
  /** p = c + m + t + bonus — итоговая цена */
  p: number;
}

/** Монохром: цветовая гамма фона совпадает с гаммой модели */
export function isMono(item: Pick<Collectible, "model" | "bg">): boolean {
  const m = MODEL_BY_ID[item.model];
  const b = BG_BY_ID[item.bg];
  if (!m || !b) return false;
  // клеточный фон — «монохром» для любой шахматной фигуры
  if (b.tone === "checker") return m.family === "chess";
  return m.tone === b.tone;
}

/** Супербонус: монохром с белым или чёрным + «Шах и мат» на клеточном фоне */
export function isSuperMono(item: Pick<Collectible, "model" | "bg">): boolean {
  const m = MODEL_BY_ID[item.model];
  const b = BG_BY_ID[item.bg];
  if (!m || !b) return false;
  if (b.tone === "checker") return m.family === "chess";
  return m.tone === b.tone && (m.tone === "white" || m.tone === "black");
}

/** Формула цены: кристалл + модель + фон + бонус (монохром / супербонус) */
export function priceParts(item: Pick<Collectible, "model" | "bg" | "crystal">): PriceParts {
  const t = BG_BY_ID[item.bg]?.price ?? 0;
  const m = MODEL_BY_ID[item.model]?.price ?? 0;
  const c = CRYSTAL_BY_ID[item.crystal]?.price ?? 0;
  const mono = isMono(item);
  const superBonus = mono && isSuperMono(item);
  const bonus = mono ? Math.round(((m + t) * (superBonus ? SUPER_MONO_RATE : MONO_RATE)) / 10) * 10 : 0;
  return { t, m, c, bonus, mono, superBonus, p: c + m + t + bonus };
}

export const collectiblePrice = (item: Pick<Collectible, "model" | "bg" | "crystal">) => priceParts(item).p;

/** Определение кристалла для отрисовки модели (форма «Первозданного Хаоса» с палитрой модели) */
export function modelDef(m: CollectibleModel): CrystalDef {
  return {
    id: m.family,
    name: m.name,
    rarity: "???",
    tier: 6,
    price: m.price,
    glow: m.glow,
    tones: CRYSTAL_BY_ID[m.family].tones,
    shape: m.family,
    description: "",
    gen: m.gen,
  };
}

/** Случайный элемент с учётом весов: чем дороже и реже, тем меньше шанс */
const pickWeighted = <T extends { weight: number }>(arr: T[]): T => {
  const total = arr.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of arr) {
    r -= x.weight;
    if (r < 0) return x;
  }
  return arr[0];
};

const newUid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Модели, подходящие кристаллу (у «Кубка» — перекрашенные кубки, у «Небесного Ока» — перекрашенные очи, у остальных — «Хаос») */
const modelsOf = (crystal: CrystalId): CollectibleModel[] => {
  const list = ALL_MODELS.filter((m) => m.family === crystal);
  return list.length ? list : MODELS;
};

/** Случайный коллекционный кристалл: случайные модель и фон (редкие — реже) */
export function rollCollectible(crystal: CrystalId): Collectible {
  return {
    uid: newUid(),
    model: pickWeighted(modelsOf(crystal)).id,
    bg: pickWeighted(bgsOf(crystal)).id,
    crystal,
    createdAt: new Date().toISOString(),
  };
}

/* ======================================================================
 * Крафт: 6 слотов, шанс = (занятых слотов) к 6, результат ≈ сумма цен
 * ====================================================================== */

export const CRAFT_SLOTS = 6;
/** Шанс (в долях) для k занятых слотов: k к 6 */
export const craftChance = (k: number) => Math.min(1, Math.max(0, k / CRAFT_SLOTS));
/** Шанс получить «чистый» кристалл «Шах и мат» при успешном крафте */
export const CRAFT_PURE_CHANCE = 0.03;
/** Шанс получить «чистый» кристалл «Череп» при успешном крафте */
export const CRAFT_SKULL_CHANCE = 0.01;

/** Сумма цен вложенных кристаллов: 1a + 1b + … ≈ kp (пустой слот умножается на 0) */
export const craftSum = (items: Pick<Collectible, "model" | "bg" | "crystal">[]) =>
  items.reduce((s, it) => s + collectiblePrice(it), 0);

/** В крафте чаще всего выпадает «Шах и мат» */
const CRAFT_FAMILY_WEIGHT: Record<string, number> = { chess: 5, sprout: 1.5, genesis: 1, trophy: 1, skyeye: 1, snowflake: 1, skull: 0.8 };
const CRAFT_FAMILIES: CrystalId[] = ["chess", "sprout", "genesis", "trophy", "skyeye", "snowflake", "skull"];

type CraftCombo = { crystal: CrystalId; model: string; bg: string; p: number; weight: number };
let comboCache: CraftCombo[] | null = null;

/** Все возможные результаты крафта (ленивая сборка — один раз) */
function craftCombos(): CraftCombo[] {
  if (comboCache) return comboCache;
  const combos: CraftCombo[] = [];
  for (const crystal of CRAFT_FAMILIES) {
    for (const m of ALL_MODELS.filter((x) => x.family === crystal)) {
      for (const b of bgsOf(crystal)) {
        const p = collectiblePrice({ crystal, model: m.id, bg: b.id });
        combos.push({ crystal, model: m.id, bg: b.id, p, weight: (CRAFT_FAMILY_WEIGHT[crystal] ?? 1) * Math.sqrt(m.weight * b.weight) });
      }
    }
  }
  comboCache = combos;
  return combos;
}

/**
 * Набор кристаллов, цена которых близка к сумме вложенных (из него выбирается результат крафта).
 * matched = false — подходящих вариантов нет: берутся ближайшие по цене (результат может оказаться дешевле суммы).
 */
function craftPoolInfo(sum: number): { pool: CraftCombo[]; matched: boolean } {
  const combos = craftCombos();
  let pool: CraftCombo[] = [];
  for (const tol of [0.04, 0.08, 0.15, 0.3]) {
    pool = combos.filter((c) => Math.abs(c.p - sum) <= sum * tol);
    if (pool.length >= 3) break;
  }
  if (pool.length === 0) {
    pool = [...combos].sort((a, b) => Math.abs(a.p - sum) - Math.abs(b.p - sum)).slice(0, 6);
    return { pool, matched: false };
  }
  return { pool, matched: true };
}

const craftPool = (sum: number): CraftCombo[] => craftPoolInfo(sum).pool;

/**
 * Нет подходящего кристалла по цене: результат крафта окажется ДЕШЕВЛЕ суммы вложенных.
 * Возвращает null, если всё в порядке; иначе — самый дорогой из возможных результатов дешевле суммы.
 */
export function craftShortfall(sum: number): { best: number } | null {
  if (sum <= 0) return null;
  const { pool, matched } = craftPoolInfo(sum);
  const lower = pool.filter((c) => c.p < sum);
  if (matched || lower.length === 0) return null;
  return { best: Math.max(...lower.map((c) => c.p)) };
}

/** Случайный коллекционный кристалл, цена которого примерно равна сумме вложенных */
export function rollCraftResult(sum: number): Collectible {
  const c = pickWeighted(craftPool(sum));
  return { uid: newUid(), model: c.model, bg: c.bg, crystal: c.crystal, createdAt: new Date().toISOString() };
}

/**
 * Предпросмотр: 3 кристалла, которые могут выпасть при данной сумме цен.
 * Выбор детерминирован (sum + seed), поэтому плашка не «моргает» при каждой перерисовке.
 */
export function craftPreview(sum: number, seed = 0, n = 3): Collectible[] {
  if (sum <= 0) return [];
  const pool = craftPool(sum).map((c) => ({ ...c }));
  // небольшой детерминированный генератор
  let x = (Math.floor(sum) * 2654435761 + seed * 40503 + 12345) >>> 0;
  const rnd = () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
  const out: CraftCombo[] = [];
  const usedFamilies = new Set<string>();
  while (out.length < n && pool.length) {
    // сначала стараемся показать разные семейства
    const cand = pool.filter((c) => !usedFamilies.has(c.crystal));
    const src = cand.length ? cand : pool;
    const total = src.reduce((a, c) => a + c.weight, 0);
    let r = rnd() * total;
    let pick = src[0];
    for (const c of src) {
      r -= c.weight;
      if (r < 0) {
        pick = c;
        break;
      }
    }
    out.push(pick);
    usedFamilies.add(pick.crystal);
    pool.splice(pool.indexOf(pick), 1);
  }
  return out
    .sort((a, b) => a.p - b.p)
    .map((c, i) => ({ uid: `preview-${i}-${c.crystal}-${c.model}-${c.bg}`, model: c.model, bg: c.bg, crystal: c.crystal, createdAt: "" }));
}
