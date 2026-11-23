import { cn } from "./utils/cn";
import { ChessArt, SproutArt } from "./artExtra";
import { SkullArt, SnowflakeArt } from "./artSkull";

export type CrystalId =
  | "quartz"
  | "sapphire"
  | "citrine"
  | "amethyst"
  | "aquamarine"
  | "emerald"
  | "garnet"
  | "ruby"
  | "topaz"
  | "diamond"
  | "astralite"
  | "abyss"
  | "moonstone"
  | "tourmaline"
  | "opal"
  | "alexandrite"
  | "starsapphire"
  | "genesis"
  | "trophy"
  // Ледяной сундук
  | "kyanite"
  | "celestine"
  | "larimar"
  | "frostdiamond"
  | "snowflake"
  // Вулканический сундук
  | "sunstone"
  | "fireopal"
  | "carnelian"
  | "magmaheart"
  | "dragonblood"
  // Небесный сундук
  | "selenite"
  | "labradorite"
  | "fluorite"
  | "stardust"
  | "galaxyheart"
  | "skyeye"
  // Крафт и росток
  | "chess"
  | "sprout"
  | "skull";

export type CrystalShape = "shard" | "cluster" | "brilliant" | "octa" | "emerald" | "drop" | "hex" | "star" | "orb" | "prism" | "genesis" | "trophy" | "skyeye" | "chess" | "sprout" | "snowflake" | "skull";

export interface CrystalDef {
  id: CrystalId;
  name: string;
  rarity: string;
  /** уровень редкости 1–6, 7 = «???» (влияет на звук и эффекты) */
  tier: number;
  /** базовая цена продажи в монетах */
  price: number;
  glow: string;
  tones: { l: string; m: string; d: string; x: string };
  shape: CrystalShape;
  description: string;
  /** палитра для формы «genesis» (используется моделями коллекционных кристаллов) */
  gen?: GenPalette;
}

/** Палитра кристалла-«Хаоса»: 6 оттенков граней, насыщенность, сдвиг яркости и вариант формы */
export interface GenPalette {
  hues: [number, number, number, number, number, number];
  /** насыщенность, % (по умолчанию 95) */
  sat?: number;
  /** сдвиг яркости граней, % (по умолчанию 0) */
  lift?: number;
  /** «modern» — слегка изменённая форма: доп. осколки, неоновые рёбра, голографический налёт */
  modern?: boolean;
  /** вариант рисунка для форм «chess» и «sprout» (конкретная фигура или дерево) */
  variant?: string;
}

const RARITY = ["", "Обычный", "Необычный", "Редкий", "Эпический", "Легендарный", "Мифический", "???"];

function def(
  id: CrystalId,
  name: string,
  tier: number,
  price: number,
  glow: string,
  tones: [string, string, string, string],
  shape: CrystalShape,
  description: string,
): CrystalDef {
  return {
    id,
    name,
    tier,
    rarity: RARITY[tier],
    price,
    glow,
    tones: { l: tones[0], m: tones[1], d: tones[2], x: tones[3] },
    shape,
    description,
  };
}

/** Порядок: сначала кристаллы деревянного сундука, затем серебряного, затем золотого */
/** Уровень редкости секретного кристалла */
export const SECRET_TIER = 7;
export const isSecret = (c: CrystalDef) => c.tier >= SECRET_TIER;

export const CRYSTALS: CrystalDef[] = [
  // ── Деревянный сундук ──
  def("quartz", "Кварц", 1, 18, "#cbd5e1", ["#ffffff", "#dbe4ee", "#9fb0c4", "#4b5a70"], "hex", "Прозрачный камень, ловящий любой лучик света."),
  def("sapphire", "Сапфир", 1, 35, "#38bdf8", ["#b6efff", "#38bdf8", "#0284c7", "#0c4a6e"], "shard", "Холодный кристалл, хранящий свет морских глубин."),
  def("citrine", "Цитрин", 2, 80, "#facc15", ["#fff7b8", "#fde047", "#ca8a04", "#713f12"], "octa", "Солнечный камень, тёплый даже в темноте."),
  def("amethyst", "Аметист", 3, 180, "#a855f7", ["#f0defe", "#b66cf8", "#7e22ce", "#3b0764"], "cluster", "Друза, мерцающая тихим фиолетовым сиянием."),
  // ── Серебряный сундук ──
  def("aquamarine", "Аквамарин", 2, 45, "#2dd4bf", ["#ccfbf1", "#5eead4", "#0d9488", "#134e4a"], "drop", "Застывшая капля тропической лагуны."),
  def("emerald", "Изумруд", 3, 85, "#22c55e", ["#c9f7d8", "#4ade80", "#15803d", "#052e16"], "emerald", "Глубокая зелень древнего леса в строгой огранке."),
  def("garnet", "Гранат", 4, 140, "#f97316", ["#ffe0c2", "#fb923c", "#c2410c", "#431407"], "cluster", "Россыпь тлеющих углей, застывших в камне."),
  def("ruby", "Рубин", 5, 300, "#fb3b64", ["#ffd0d9", "#fb2c5a", "#be123c", "#7f1d1d"], "brilliant", "Огранённое сердце вулкана. Горит изнутри."),
  // ── Золотой сундук ──
  def("topaz", "Императорский топаз", 3, 75, "#f59e0b", ["#fff0c2", "#fbbf24", "#b45309", "#451a03"], "hex", "Камень королей — цвета расплавленного мёда."),
  def("diamond", "Алмаз", 4, 140, "#7dd3fc", ["#ffffff", "#e0f2fe", "#7dd3fc", "#0369a1"], "octa", "Безупречная грань. Твёрже всего на свете."),
  def("astralite", "Астралит", 5, 320, "#e879f9", ["#fdf4ff", "#f0abfc", "#c026d3", "#4a044e"], "star", "Упавшая звезда, всё ещё хранящая небесный свет."),
  def("abyss", "Сердце бездны", 6, 800, "#818cf8", ["#c7d2fe", "#6366f1", "#2e1f8a", "#050515"], "drop", "Тьма, обретшая форму. Шепчет тому, кто смотрит."),
  // ── Космический сундук ──
  def("moonstone", "Лунный камень", 3, 160, "#a5b4fc", ["#ffffff", "#dbe4ff", "#93a4f5", "#3b3f9e"], "orb", "Холодное сияние далёкой луны, запертое в капле света."),
  def("tourmaline", "Турмалин", 4, 280, "#f472b6", ["#fce7f3", "#f472b6", "#be185d", "#14532d"], "prism", "Один камень — два цвета: рассвет и зелёная бездна."),
  def("opal", "Благородный опал", 4, 340, "#67e8f9", ["#ecfeff", "#a5f3fc", "#38bdf8", "#c026d3"], "cluster", "Внутри переливаются целые северные сияния."),
  def("alexandrite", "Александрит", 5, 620, "#5eead4", ["#d1fae5", "#2dd4bf", "#7c3aed", "#2e1065"], "brilliant", "Днём — изумрудный, ночью — пурпурный. Камень двух миров."),
  def("starsapphire", "Звёздный сапфир", 5, 900, "#60a5fa", ["#e0f2fe", "#3b82f6", "#1d4ed8", "#172554"], "star", "В глубине горит шестилучевая звезда."),
  def("genesis", "Первозданный Хаос", 7, 5000, "#e0aaff", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "genesis", "То, из чего была создана сама Вселенная. Его не должно было существовать."),
  // ── Ледяной сундук ──
  def("kyanite", "Кианит", 3, 200, "#38bdf8", ["#e0f7ff", "#5ab9f5", "#1d6fb8", "#0b2a55"], "prism", "Лезвия синего льда, застывшие в вечной мерзлоте."),
  def("celestine", "Целестин", 3, 330, "#93c5fd", ["#f0f9ff", "#bfdbfe", "#7aa7e8", "#2b4a8f"], "cluster", "Нежно-голубая друза, звенящая от холода."),
  def("larimar", "Ларимар", 4, 520, "#22d3ee", ["#e6fffb", "#67e8f9", "#0ea5b7", "#134e5e"], "drop", "Капля карибской воды, замёрзшая на полпути к морю."),
  def("frostdiamond", "Морозный алмаз", 5, 1300, "#bae6fd", ["#ffffff", "#dff4ff", "#8fd3ff", "#2b6cb0"], "octa", "Грань, от которой замерзает дыхание."),
  // Секретный кристалл Ледяного сундука: улучшается до коллекционного (25 моделей)
  {
    ...def("snowflake", "Ледяная Снежинка", 7, 5000, "#bae6fd", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "snowflake", "Снежинка, навечно застывшая в сердце льда. Ни одна не похожа на другую."),
    gen: { hues: [195, 205, 185, 215, 175, 225], sat: 85, lift: 6 },
  },
  // ── Вулканический сундук ──
  def("sunstone", "Солнечный камень", 3, 300, "#fb923c", ["#fff1d6", "#fdba74", "#ea580c", "#7c2d12"], "orb", "Хранит жар закатного солнца."),
  def("fireopal", "Огненный опал", 4, 450, "#f97316", ["#fff3c4", "#fb923c", "#dc2626", "#7f1d1d"], "hex", "Внутри бегут языки живого пламени."),
  def("carnelian", "Карнеол", 4, 600, "#ef4444", ["#ffe1d6", "#f87171", "#b91c1c", "#450a0a"], "emerald", "Густой огненно-красный камень вулканических равнин."),
  def("magmaheart", "Лавовое сердце", 5, 1200, "#ff5a1f", ["#ffe0b2", "#ff7a2f", "#c2200c", "#2a0a05"], "brilliant", "Бьётся в такт подземным толчкам."),
  def("dragonblood", "Кровь дракона", 6, 2800, "#ef233c", ["#ffd6d6", "#ff2e4d", "#a4001f", "#1a0005"], "star", "Последняя капля древнего дракона. Всё ещё горячая."),
  // ── Небесный сундук ──
  def("selenite", "Селенит", 4, 700, "#e0e7ff", ["#ffffff", "#eef2ff", "#c7d2fe", "#6470c8"], "shard", "Лунный свет, ставший камнем."),
  def("labradorite", "Лабрадорит", 4, 950, "#2dd4bf", ["#d9fbff", "#4fd1c5", "#5b5bd6", "#1b1b4b"], "prism", "Вспышки северного сияния прячутся в его глубине."),
  def("fluorite", "Флюорит", 5, 1400, "#a78bfa", ["#e0fff4", "#6ee7b7", "#8b5cf6", "#3b1a7a"], "octa", "Радуга, собранная в идеальный октаэдр."),
  def("stardust", "Звёздная пыль", 5, 2600, "#f0abfc", ["#fffaff", "#f5c2ff", "#a78bfa", "#2a1b6e"], "cluster", "Осколки сверхновой, упавшие с неба."),
  def("galaxyheart", "Сердце галактики", 6, 7500, "#c084fc", ["#ffffff", "#a5b4fc", "#9333ea", "#0b0724"], "brilliant", "В нём вращается целая галактика."),
  {
    ...def("skyeye", "Небесное Око", 7, 5000, "#7dd3fc", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "skyeye", "Взгляд самого неба. Пока оно открыто — звёзды не гаснут."),
    gen: { hues: [200, 265, 320, 190, 280, 230] },
  },
  // ── Награда за активность (в сундуках не выпадает): выдаётся из админ-меню топ-3 по лайкам и монетам ──
  {
    ...def("trophy", "Кубок", 7, 5000, "#facc15", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "trophy", "Награда за активность. Его получают лучшие из лучших — по лайкам и по монетам."),
    gen: { hues: [48, 42, 52, 45, 38, 56], lift: -6 },
  },
  // ── «Шах и мат»: в сундуках не выпадает, получить можно только в крафте ──
  {
    ...def("chess", "Шах и мат", 7, 5000, "#e2e8f0", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "chess", "Белые и чёрные фигуры, застывшие в кристалле. Рождается только в крафте."),
    gen: { hues: [210, 215, 220, 205, 225, 200], variant: "wk" },
  },
  // ── Росток в кристалле ──
  {
    ...def("sprout", "Росток в кристалле", 7, 8000, "#4ade80", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "sprout", "Крошечное дерево проросло внутри кристалла. Корни ищут свет."),
    gen: { hues: [150, 140, 160, 145, 165, 135], variant: "crystaltree" },
  },
  // ── Череп: самый дорогой кристалл (30 моделей). В сундуках не выпадает — рождается в крафте ──
  {
    ...def("skull", "Череп", 7, 15000, "#e7d9b8", ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], "skull", "Самый дорогой из всех кристаллов. Пустые глазницы смотрят сквозь века. Рождается только в крафте."),
    gen: { hues: [42, 48, 36, 45, 52, 0], sat: 38, lift: 14, variant: "plain" },
  },
];

export const CRYSTAL_BY_ID = Object.fromEntries(CRYSTALS.map((c) => [c.id, c])) as Record<
  CrystalId,
  CrystalDef
>;

export type Odds = Partial<Record<CrystalId, number>>;

export function rollCrystal(odds: Odds): CrystalDef {
  const pool = CRYSTALS.filter((c) => (odds[c.id] ?? 0) > 0);
  const total = pool.reduce((s, c) => s + (odds[c.id] ?? 0), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= odds[c.id] ?? 0;
    if (r < 0) return c;
  }
  return pool[0];
}

type Tones = CrystalDef["tones"];

function Shard({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8}>
      <polygon points="50,4 22,34 50,40" fill={t.l} />
      <polygon points="50,4 78,34 50,40" fill={t.m} />
      <polygon points="22,34 50,40 50,116 22,92" fill={t.m} />
      <polygon points="78,34 50,40 50,116 78,92" fill={t.d} />
      <polygon points="22,34 50,40 36,70 22,60" fill="rgba(255,255,255,0.18)" stroke="none" />
      <polygon points="50,4 38,17 50,21" fill="rgba(255,255,255,0.65)" stroke="none" />
    </g>
  );
}

function Cluster({ t }: { t: Tones }) {
  const darker: Tones = { l: t.m, m: t.d, d: t.x, x: t.x };
  return (
    <g>
      <g transform="translate(30 116) rotate(-26) scale(.62) translate(-50 -116)">
        <Shard t={darker} />
      </g>
      <g transform="translate(70 116) rotate(24) scale(.7) translate(-50 -116)">
        <Shard t={darker} />
      </g>
      <g transform="translate(50 118) scale(.96) translate(-50 -116)">
        <Shard t={t} />
      </g>
    </g>
  );
}

function Brilliant({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8}>
      <polygon points="30,20 10,45 40,45" fill={t.m} />
      <polygon points="30,20 70,20 60,45 40,45" fill={t.l} />
      <polygon points="70,20 90,45 60,45" fill={t.m} />
      <polygon points="10,45 40,45 50,112" fill={t.d} />
      <polygon points="40,45 60,45 50,112" fill={t.m} />
      <polygon points="60,45 90,45 50,112" fill={t.x} />
      <polygon points="34,23 52,23 44,34 36,34" fill="rgba(255,255,255,0.7)" stroke="none" />
    </g>
  );
}

function Octa({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8}>
      <polygon points="50,6 10,58 32,58" fill={t.l} />
      <polygon points="50,6 32,58 68,58" fill={t.m} />
      <polygon points="50,6 68,58 90,58" fill={t.l} opacity={0.85} />
      <polygon points="10,58 32,58 50,116" fill={t.d} />
      <polygon points="32,58 68,58 50,116" fill={t.m} />
      <polygon points="68,58 90,58 50,116" fill={t.x} />
      <polygon points="46,12 40,34 52,34" fill="rgba(255,255,255,0.7)" stroke="none" />
    </g>
  );
}

function Emerald({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8}>
      <polygon points="24,10 76,10 66,28 34,28" fill={t.l} />
      <polygon points="76,10 92,28 76,40 66,28" fill={t.m} />
      <polygon points="92,28 92,92 76,80 76,40" fill={t.d} />
      <polygon points="92,92 76,110 66,94 76,80" fill={t.d} />
      <polygon points="76,110 24,110 34,94 66,94" fill={t.x} />
      <polygon points="24,110 8,92 24,80 34,94" fill={t.x} />
      <polygon points="8,92 8,28 24,40 24,80" fill={t.m} />
      <polygon points="8,28 24,10 34,28 24,40" fill={t.m} />
      <polygon points="34,28 66,28 76,40 76,80 66,94 34,94 24,80 24,40" fill={t.m} />
      <polygon points="34,28 66,28 76,40 24,40" fill="rgba(255,255,255,0.38)" stroke="none" />
      <polygon points="30,48 40,48 40,84 30,84" fill="rgba(255,255,255,0.14)" stroke="none" />
    </g>
  );
}

function Drop({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8}>
      <path d="M50,4 C50,4 14,52 14,76 C14,98 30,114 50,114 C70,114 86,98 86,76 C86,52 50,4 50,4 Z" fill={t.m} />
      <path d="M50,4 C50,4 86,52 86,76 C86,98 70,114 50,114 Z" fill={t.d} />
      <polygon points="50,34 30,72 50,100" fill={t.l} opacity={0.55} stroke="none" />
      <polygon points="50,34 70,72 50,100" fill={t.x} opacity={0.35} stroke="none" />
      <path d="M50,4 L50,114 M14,76 L86,76" fill="none" strokeOpacity={0.25} />
      <ellipse cx="33" cy="72" rx="5" ry="13" fill="rgba(255,255,255,0.6)" stroke="none" transform="rotate(12 33 72)" />
    </g>
  );
}

function Hex({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8}>
      <polygon points="50,6 90,30 50,60" fill={t.l} />
      <polygon points="90,30 90,86 50,60" fill={t.m} />
      <polygon points="90,86 50,114 50,60" fill={t.d} />
      <polygon points="50,114 10,86 50,60" fill={t.x} />
      <polygon points="10,86 10,30 50,60" fill={t.d} />
      <polygon points="10,30 50,6 50,60" fill={t.m} />
      <polygon points="50,24 72,38 50,52 28,38" fill="rgba(255,255,255,0.3)" stroke="none" />
    </g>
  );
}

function Star({ t }: { t: Tones }) {
  const pts: [number, number][] = [
    [50, 2],
    [60, 48],
    [98, 60],
    [60, 72],
    [50, 118],
    [40, 72],
    [2, 60],
    [40, 48],
  ];
  const fills = [t.l, t.m, t.d, t.x, t.x, t.d, t.m, t.l];
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.45)" strokeWidth={0.8}>
      {pts.map((p, i) => {
        const q = pts[(i + 1) % pts.length];
        return <polygon key={i} points={`50,60 ${p[0]},${p[1]} ${q[0]},${q[1]}`} fill={fills[i]} />;
      })}
      <circle cx="50" cy="60" r="7" fill="rgba(255,255,255,0.8)" stroke="none" />
    </g>
  );
}


function Orb({ t }: { t: Tones }) {
  return (
    <g>
      <circle cx="50" cy="62" r="44" fill={t.d} stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
      <circle cx="46" cy="58" r="38" fill={t.m} />
      <circle cx="42" cy="52" r="27" fill={t.l} opacity={0.75} />
      <ellipse cx="62" cy="80" rx="16" ry="7" fill={t.x} opacity={0.3} transform="rotate(-30 62 80)" />
      <ellipse cx="38" cy="86" rx="9" ry="4" fill={t.x} opacity={0.22} transform="rotate(20 38 86)" />
      <ellipse cx="32" cy="40" rx="12" ry="7" fill="rgba(255,255,255,0.85)" transform="rotate(-38 32 40)" />
      <circle cx="68" cy="94" r="2.6" fill="rgba(255,255,255,0.7)" />
    </g>
  );
}

function Prism({ t }: { t: Tones }) {
  return (
    <g strokeLinejoin="round" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8}>
      <polygon points="28,24 50,36 50,114 28,98" fill={t.m} />
      <polygon points="50,36 72,24 72,98 50,114" fill={t.d} />
      <polygon points="28,70 50,82 50,114 28,98" fill={t.x} opacity={0.9} />
      <polygon points="50,82 72,70 72,98 50,114" fill={t.x} opacity={0.65} />
      <polygon points="28,24 50,6 72,24 50,36" fill={t.l} />
      <polygon points="33,32 40,36 40,92 33,88" fill="rgba(255,255,255,0.22)" stroke="none" />
      <polygon points="44,12 56,12 50,22" fill="rgba(255,255,255,0.7)" stroke="none" />
    </g>
  );
}

const GEN_HUES: GenPalette["hues"] = [320, 25, 55, 150, 195, 255];
const DEFAULT_GEN: GenPalette = { hues: GEN_HUES };

type Gh = (i: number, l?: number) => string;
const makeGh =
  (p: GenPalette): Gh =>
  (i, l = 66) =>
    `hsl(${p.hues[i % p.hues.length]} ${p.sat ?? 95}% ${Math.min(96, Math.max(4, l + (p.lift ?? 0)))}%)`;

function GenesisShard({ gh, modern }: { gh: Gh; modern?: boolean }) {
  return (
    <g
      strokeLinejoin="round"
      stroke={modern ? "hsl(190 100% 78% / 0.9)" : "rgba(255,255,255,0.55)"}
      strokeWidth={modern ? 1.1 : 0.8}
    >
      <polygon points="50,4 22,34 50,40" fill={gh(0, 82)} />
      <polygon points="50,4 78,34 50,40" fill={gh(1, 72)} />
      <polygon points="22,34 50,40 50,116 22,92" fill={gh(2, 62)} />
      <polygon points="78,34 50,40 50,116 78,92" fill={gh(4, 55)} />
      <polygon points="22,34 50,40 36,70 22,60" fill="rgba(255,255,255,0.28)" stroke="none" />
      <polygon points="50,40 78,34 64,66 50,76" fill={gh(5, 70)} opacity={0.55} stroke="none" />
      <polygon points="50,4 38,17 50,21" fill="rgba(255,255,255,0.9)" stroke="none" />
      {modern && (
        <>
          <polygon points="50,4 78,34 78,92 50,116 22,92 22,34" fill="url(#mod-holo)" opacity={0.5} stroke="none" />
          <path d="M22 34 L50 40 L78 34 M50 40 L50 116" fill="none" stroke="hsl(300 100% 85% / 0.75)" strokeWidth={0.7} />
        </>
      )}
    </g>
  );
}

function Genesis({ gen = DEFAULT_GEN }: { gen?: GenPalette }) {
  const gh = makeGh(gen);
  if (gen.modern) {
    return (
      <g>
        <defs>
          <linearGradient id="mod-holo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.35" stopColor="#a78bfa" />
            <stop offset="0.7" stopColor="#f472b6" />
            <stop offset="1" stopColor="#facc15" />
          </linearGradient>
        </defs>
        {/* дополнительные мелкие осколки — отличие modern от классической формы */}
        <g transform="translate(8 116) rotate(-52) scale(.34) translate(-50 -116)">
          <GenesisShard gh={gh} modern />
        </g>
        <g transform="translate(92 116) rotate(50) scale(.38) translate(-50 -116)">
          <GenesisShard gh={gh} modern />
        </g>
        <g transform="translate(26 116) rotate(-30) scale(.6) translate(-50 -116)">
          <GenesisShard gh={gh} modern />
        </g>
        <g transform="translate(74 116) rotate(28) scale(.68) translate(-50 -116)">
          <GenesisShard gh={gh} modern />
        </g>
        <g transform="translate(50 120) scale(.98 1.04) translate(-50 -116)">
          <GenesisShard gh={gh} modern />
        </g>
        <circle cx="50" cy="52" r="10" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.85} />
        <circle cx="50" cy="52" r="4.5" fill="#fff" />
        <path d="M50 30 L54 48 L72 52 L54 56 L50 74 L46 56 L28 52 L46 48 Z" fill="#fff" opacity={0.95} />
      </g>
    );
  }
  return (
    <g>
      <g transform="translate(26 116) rotate(-30) scale(.6) translate(-50 -116)">
        <GenesisShard gh={gh} />
      </g>
      <g transform="translate(74 116) rotate(28) scale(.68) translate(-50 -116)">
        <GenesisShard gh={gh} />
      </g>
      <g transform="translate(50 118) scale(.98) translate(-50 -116)">
        <GenesisShard gh={gh} />
      </g>
      <circle cx="50" cy="52" r="5" fill="#fff" />
      <path d="M50 36 L53 49 L66 52 L53 55 L50 68 L47 55 L34 52 L47 49 Z" fill="#fff" opacity={0.9} />
    </g>
  );
}

/** Кубок: форма одна, различаются палитры (как у моделей «Хаоса») */
function Trophy({ gen = DEFAULT_GEN }: { gen?: GenPalette }) {
  const gh = makeGh(gen);
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* ручки */}
      <path d="M23 18 C-2 14 -1 52 31 54" fill="none" stroke={gh(3, 36)} strokeWidth={7} />
      <path d="M23 18 C-2 14 -1 52 31 54" fill="none" stroke={gh(1, 62)} strokeWidth={4} />
      <path d="M77 18 C102 14 101 52 69 54" fill="none" stroke={gh(3, 36)} strokeWidth={7} />
      <path d="M77 18 C102 14 101 52 69 54" fill="none" stroke={gh(1, 62)} strokeWidth={4} />
      <g stroke="rgba(255,255,255,0.5)" strokeWidth={0.8}>
        {/* постамент */}
        <polygon points="22,106 78,106 83,118 17,118" fill={gh(4, 34)} />
        <polygon points="22,106 50,106 50,118 17,118" fill={gh(2, 44)} />
        <polygon points="30,96 70,96 74,106 26,106" fill={gh(2, 52)} />
        <polygon points="50,96 70,96 74,106 50,106" fill={gh(4, 42)} />
        {/* ножка */}
        <polygon points="44,76 56,76 59,96 41,96" fill={gh(5, 58)} />
        <polygon points="50,76 56,76 59,96 50,96" fill={gh(4, 44)} />
        <ellipse cx="50" cy="82" rx="12" ry="4.5" fill={gh(0, 78)} />
        {/* чаша */}
        <polygon points="20,8 50,8 50,80 46,80 38,70 24,38" fill={gh(2, 62)} />
        <polygon points="50,8 80,8 76,38 62,70 54,80 50,80" fill={gh(4, 52)} />
        <polygon points="50,8 80,8 76,38 62,70 50,52" fill={gh(5, 70)} opacity={0.55} stroke="none" />
        <polygon points="20,8 80,8 79,18 21,18" fill={gh(0, 82)} />
      </g>
      <polygon points="28,24 36,24 41,58 33,44" fill="rgba(255,255,255,0.38)" />
      <polygon points="30,9 42,9 40,16 30,16" fill="rgba(255,255,255,0.7)" />
      <circle cx="50" cy="42" r="4.5" fill="#fff" />
      <path d="M50 26 L53 39 L65 42 L53 45 L50 58 L47 45 L35 42 L47 39 Z" fill="#fff" opacity={0.92} />
    </g>
  );
}

/** Небесное Око: форма одна, различаются палитры (как у моделей «Хаоса» и «Кубка») */
function SkyEye({ gen = DEFAULT_GEN }: { gen?: GenPalette }) {
  const gh = makeGh(gen);
  const rays = [-60, -30, 0, 30, 60];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* лучи над оком */}
      {rays.map((a) => (
        <path
          key={a}
          d="M50 2 L50 9"
          transform={`rotate(${a} 50 60)`}
          stroke={gh(1, 86)}
          strokeWidth={a === 0 ? 2.4 : 1.6}
          opacity={a === 0 ? 0.95 : 0.7}
          fill="none"
        />
      ))}
      <g stroke="rgba(255,255,255,0.5)" strokeWidth={0.8}>
        {/* граненое веко */}
        <path d="M4 60 C13 33 31.5 19.5 50 19.5 L50 60 Z" fill={gh(0, 80)} />
        <path d="M50 19.5 C68.5 19.5 87 33 96 60 L50 60 Z" fill={gh(1, 68)} />
        <path d="M96 60 C87 87 68.5 100.5 50 100.5 L50 60 Z" fill={gh(4, 46)} />
        <path d="M50 100.5 C31.5 100.5 13 87 4 60 L50 60 Z" fill={gh(2, 58)} />
        {/* радужка */}
        <circle cx="50" cy="60" r="23" fill={gh(3, 38)} />
        <circle cx="50" cy="60" r="16" fill={gh(5, 62)} />
        <circle cx="50" cy="60" r="16" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1} strokeDasharray="2 3.2" />
      </g>
      {/* блики */}
      <path d="M14 55 C20 41 30 31 41 26 L39 34 C31 38 23 46 19 57 Z" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="43" cy="52" rx="3.4" ry="2.4" fill="rgba(255,255,255,0.85)" transform="rotate(-30 43 52)" />
      {/* зрачок-звезда */}
      <circle cx="50" cy="60" r="4" fill="#fff" />
      <path d="M50 42 L53.5 56.5 L68 60 L53.5 63.5 L50 78 L46.5 63.5 L32 60 L46.5 56.5 Z" fill="#fff" opacity={0.94} />
    </g>
  );
}

/** Рисует кристалл в системе координат 100×120 */
export function CrystalArt({ def }: { def: CrystalDef }) {
  switch (def.shape) {
    case "shard":
      return <Shard t={def.tones} />;
    case "cluster":
      return <Cluster t={def.tones} />;
    case "brilliant":
      return <Brilliant t={def.tones} />;
    case "octa":
      return <Octa t={def.tones} />;
    case "emerald":
      return <Emerald t={def.tones} />;
    case "drop":
      return <Drop t={def.tones} />;
    case "hex":
      return <Hex t={def.tones} />;
    case "star":
      return <Star t={def.tones} />;
    case "orb":
      return <Orb t={def.tones} />;
    case "prism":
      return <Prism t={def.tones} />;
    case "genesis":
      return <Genesis gen={def.gen} />;
    case "trophy":
      return <Trophy gen={def.gen} />;
    case "skyeye":
      return <SkyEye gen={def.gen} />;
    case "chess":
      return <ChessArt variant={def.gen?.variant} />;
    case "sprout":
      return <SproutArt variant={def.gen?.variant} gen={def.gen} />;
    case "snowflake":
      return <SnowflakeArt gen={def.gen} />;
    case "skull":
      return <SkullArt gen={def.gen} />;
  }
}

export function CrystalIcon({
  def,
  className,
  locked,
}: {
  def: CrystalDef;
  className?: string;
  locked?: boolean;
}) {
  return (
    <svg
      viewBox="-10 0 120 120"
      className={cn(className, def.tier >= SECRET_TIER && !locked && "hue-cycle")}
      style={{
        filter: locked
          ? "brightness(0) opacity(.35)"
          : `drop-shadow(0 0 8px ${def.glow}aa)`,
      }}
    >
      <CrystalArt def={def} />
    </svg>
  );
}
