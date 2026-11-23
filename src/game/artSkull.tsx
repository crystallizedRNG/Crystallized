import type { GenPalette } from "./crystals";

/* ======================================================================
 * «Череп» (30 моделей) и «Ледяная Снежинка» (25 моделей).
 * Рисуется в координатах 100×120, как и остальные кристаллы.
 * ====================================================================== */

type Gh = (i: number, l?: number) => string;
const makeGh =
  (p: GenPalette): Gh =>
  (i, l = 66) =>
    `hsl(${p.hues[i % p.hues.length]} ${p.sat ?? 95}% ${Math.min(96, Math.max(4, l + (p.lift ?? 0)))}%)`;

const DEFAULT_HUES: GenPalette["hues"] = [200, 210, 190, 205, 185, 215];

const spark4 = (x: number, y: number, r: number, key: string) => (
  <path
    key={key}
    d={`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`}
    fill="#fff"
    opacity={0.95}
  />
);

/* ---------- Череп ---------- */

export function SkullArt({ gen }: { gen?: GenPalette }) {
  const p: GenPalette = gen ?? { hues: DEFAULT_HUES };
  const gh = makeGh(p);
  const parts = (p.variant ?? "plain").split("+");
  const has = (k: string) => parts.includes(k);
  const eye = p.hues[5];
  // цвет свечения глаз не затемняется «lift» палитры
  const glow = `hsl(${eye} 100% 60%)`;
  const dark = "#0d0d16";

  if (has("alien")) {
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        <g transform="translate(50 64) scale(.9) translate(-50 -60)">
          <g stroke="rgba(255,255,255,0.45)" strokeWidth={0.8}>
            <path d="M50 4 C16 4 2 30 10 54 C15 68 32 76 41 90 C44 97 47 99 50 99 Z" fill={gh(0, 62)} />
            <path d="M50 4 C84 4 98 30 90 54 C85 68 68 76 59 90 C56 97 53 99 50 99 Z" fill={gh(1, 44)} />
          </g>
          <polygon points="50,4 22,16 50,30" fill="rgba(255,255,255,0.32)" />
          <polygon points="50,4 78,16 50,30" fill="rgba(255,255,255,0.08)" />
          <polygon points="10,54 20,72 29,56" fill="rgba(255,255,255,0.16)" />
          <polygon points="90,54 80,72 71,56" fill="rgba(0,0,0,0.16)" />
          <polygon points="32,12 42,8 38,20" fill="rgba(255,255,255,0.6)" />
          {/* огромные чёрные глаза */}
          <path d="M13 46 C26 39 44 52 46 69 C30 71 13 63 13 46 Z" fill="#05050a" stroke={glow} strokeWidth={0.9} />
          <path d="M87 46 C74 39 56 52 54 69 C70 71 87 63 87 46 Z" fill="#05050a" stroke={glow} strokeWidth={0.9} />
          <ellipse cx="27" cy="54" rx="6" ry="2.6" fill="rgba(255,255,255,0.7)" transform="rotate(24 27 54)" />
          <ellipse cx="73" cy="54" rx="6" ry="2.6" fill="rgba(255,255,255,0.35)" transform="rotate(-24 73 54)" />
          <circle cx="38" cy="62" r="1.6" fill={glow} />
          <circle cx="62" cy="62" r="1.6" fill={glow} />
          {/* ноздри и рот */}
          <circle cx="47.5" cy="80" r="1.1" fill={dark} />
          <circle cx="52.5" cy="80" r="1.1" fill={dark} />
          <path d="M43 90 Q50 93.5 57 90" fill="none" stroke={dark} strokeWidth={1.1} />
        </g>
      </g>
    );
  }

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g transform="translate(50 68) scale(.86) translate(-50 -60)">
        {/* пламя над головой */}
        {has("flames") && (
          <g>
            <g transform="translate(-24 12) scale(.62)">
              <path d="M50 -14 C60 -2 64 4 56 10 C54 6 52 6 50 8 C48 6 46 6 44 10 C36 4 40 -2 50 -14 Z" fill="#f97316" />
            </g>
            <g transform="translate(24 12) scale(.62)">
              <path d="M50 -14 C60 -2 64 4 56 10 C54 6 52 6 50 8 C48 6 46 6 44 10 C36 4 40 -2 50 -14 Z" fill="#f97316" />
            </g>
            <path d="M50 -22 C64 -6 70 4 58 12 C55 7 52 7 50 10 C48 7 45 7 42 12 C30 4 36 -6 50 -22 Z" fill="#fb923c" />
            <path d="M50 -8 C57 -1 58 5 50 11 C42 5 43 -1 50 -8 Z" fill="#fde047" />
          </g>
        )}
        {/* рога */}
        {has("horns") && (
          <g stroke="rgba(255,255,255,0.45)" strokeWidth={0.7}>
            <path d="M25 24 C10 22 3 6 8 -12 C16 -2 24 2 36 12 Z" fill={gh(3, 28)} />
            <path d="M75 24 C90 22 97 6 92 -12 C84 -2 76 2 64 12 Z" fill={gh(3, 22)} />
            <path d="M12 -2 C16 2 22 6 28 9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          </g>
        )}

        {/* череп */}
        <g stroke="rgba(255,255,255,0.45)" strokeWidth={0.8}>
          <path d="M50 6 C20 6 10 28 12 50 C13 62 20 68 26 72 L26 90 L36 98 L36 110 L50 110 Z" fill={gh(0, 74)} />
          <path d="M50 6 C80 6 90 28 88 50 C87 62 80 68 74 72 L74 90 L64 98 L64 110 L50 110 Z" fill={gh(1, 52)} />
        </g>
        {/* грани-«кристалл» */}
        <polygon points="50,6 28,20 50,31" fill="rgba(255,255,255,0.32)" />
        <polygon points="50,6 72,20 50,31" fill="rgba(0,0,0,0.1)" />
        <polygon points="12,50 26,72 34,58" fill="rgba(255,255,255,0.18)" />
        <polygon points="88,50 74,72 66,58" fill="rgba(0,0,0,0.2)" />
        <polygon points="31,14 41,10 37,23" fill="rgba(255,255,255,0.62)" />

        {/* повязка пирата */}
        {has("bandana") && (
          <g stroke="rgba(0,0,0,0.25)" strokeWidth={0.6}>
            <path d="M13 32 C30 20 70 20 87 32 L88 44 C70 32 30 32 12 44 Z" fill="#dc2626" />
            <path d="M85 38 L99 31 L97 49 Z" fill="#b91c1c" />
            {[26, 38, 50, 62, 74].map((x) => (
              <circle key={x} cx={x} cy={x === 50 ? 28.5 : 29.5 + Math.abs(x - 50) * 0.08} r="1.7" fill="#fff" stroke="none" />
            ))}
          </g>
        )}

        {/* глазницы */}
        {has("cyclops") ? (
          <g>
            <path d="M25 48 C25 33 75 33 75 48 C75 64 63 70 50 70 C37 70 25 64 25 48 Z" fill={dark} />
            <circle cx="50" cy="52" r="10" fill={glow} />
            <circle cx="50" cy="52" r="10" fill="none" stroke="#fff" strokeWidth={0.9} opacity={0.8} />
            <circle cx="50" cy="52" r="4" fill="#fff" />
            <ellipse cx="46" cy="48" rx="2.6" ry="1.7" fill="#fff" opacity={0.85} transform="rotate(-30 46 48)" />
          </g>
        ) : (
          <g>
            <path d="M22 50 C22 40 34 38 43 45 C47 50 46 62 38 65 C29 67 22 61 22 50 Z" fill={dark} />
            <path d="M78 50 C78 40 66 38 57 45 C53 50 54 62 62 65 C71 67 78 61 78 50 Z" fill={dark} />
            <circle cx="35" cy="54" r="4.6" fill={glow} />
            <circle cx="65" cy="54" r="4.6" fill={glow} />
            <circle cx="35" cy="54" r="1.7" fill="#fff" />
            <circle cx="65" cy="54" r="1.7" fill="#fff" />
          </g>
        )}
        {/* нос */}
        <path d="M50 66 L44 77 L50 73 L56 77 Z" fill={dark} />
        {/* зубы */}
        <g stroke={dark} strokeWidth={1}>
          <rect x="37" y="88" width="26" height="20" rx="2" fill={gh(0, 88)} />
          <path d="M43.5 88 L43.5 108 M50 88 L50 108 M56.5 88 L56.5 108 M37 98 L63 98" fill="none" />
        </g>
        <rect x="37" y="88" width="13" height="20" rx="2" fill="rgba(255,255,255,0.25)" stroke="none" />

        {/* третий глаз */}
        {has("thirdeye") && (
          <g>
            <circle cx="50" cy="29" r="4.6" fill={dark} stroke="rgba(255,255,255,0.6)" strokeWidth={0.7} />
            <circle cx="50" cy="29" r="2.8" fill={glow} />
            <circle cx="50" cy="29" r="1" fill="#fff" />
          </g>
        )}
        {/* трещины */}
        {has("crack") && (
          <g fill="none">
            <path d="M58 7 L53 20 L60 28 L54 40 L58 47" stroke={dark} strokeWidth={1.7} />
            <path d="M58 7 L53 20 L60 28 L54 40 L58 47" stroke={glow} strokeWidth={0.6} opacity={0.9} />
            <path d="M60 28 L68 31" stroke={dark} strokeWidth={1.2} />
          </g>
        )}
        {/* швы */}
        {has("stitch") && (
          <g stroke={dark} strokeWidth={1.2} fill="none">
            <path d="M24 22 L44 32" />
            <path d="M28 19 L31 28 M34 22 L37 31 M40 25 L43 34" />
          </g>
        )}
        {/* корона */}
        {has("crown") && (
          <g stroke="rgba(255,255,255,0.55)" strokeWidth={0.7}>
            <polygon points="26,13 28,-6 39,5 50,-10 61,5 72,-6 74,13" fill="#fbbf24" />
            <polygon points="50,-10 61,5 72,-6 74,13 50,13" fill="#d97706" />
            <rect x="26" y="9" width="48" height="7" rx="1" fill="#fde047" />
            <circle cx="39" cy="12.5" r="2" fill="#f43f5e" stroke="none" />
            <circle cx="50" cy="12.5" r="2" fill="#38bdf8" stroke="none" />
            <circle cx="61" cy="12.5" r="2" fill="#4ade80" stroke="none" />
          </g>
        )}
        {/* звёзды */}
        {has("stars") && (
          <g>
            {spark4(26, 30, 5, "s1")}
            {spark4(76, 40, 4, "s2")}
            {spark4(64, 18, 3, "s3")}
            {spark4(18, 62, 3, "s4")}
          </g>
        )}
      </g>
    </g>
  );
}

/* ---------- Ледяная Снежинка ---------- */

export function SnowflakeArt({ gen }: { gen?: GenPalette }) {
  const p: GenPalette = gen ?? { hues: DEFAULT_HUES, sat: 85, lift: 6 };
  const gh = makeGh(p);
  const cx = 50;
  const cy = 60;
  const R = 50;
  const verts: [number, number][] = [-90, -30, 30, 90, 150, 210].map((a) => [
    +(cx + R * Math.cos((a * Math.PI) / 180)).toFixed(2),
    +(cy + R * Math.sin((a * Math.PI) / 180)).toFixed(2),
  ]);
  const fills = [gh(0, 82), gh(1, 68), gh(2, 52), gh(4, 42), gh(3, 56), gh(5, 72)];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g stroke="rgba(255,255,255,0.5)" strokeWidth={0.8}>
        {verts.map((v, i) => {
          const w = verts[(i + 1) % verts.length];
          return <polygon key={i} points={`${cx},${cy} ${v[0]},${v[1]} ${w[0]},${w[1]}`} fill={fills[i]} />;
        })}
      </g>
      <polygon points={verts.map((v) => `${cx + (v[0] - cx) * 0.72},${cy + (v[1] - cy) * 0.72}`).join(" ")} fill="rgba(255,255,255,0.14)" />
      <polygon points={`${cx},${cy - 44} ${cx - 34},${cy - 25} ${cx},${cy - 14}`} fill="rgba(255,255,255,0.3)" />
      {/* снежинка внутри */}
      <g stroke="#fff" strokeWidth={2.3} fill="none">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy} L${cx} ${cy - 32}`} />
            <path d={`M${cx} ${cy - 20} L${cx - 7} ${cy - 28} M${cx} ${cy - 20} L${cx + 7} ${cy - 28}`} strokeWidth={1.8} />
            <path d={`M${cx} ${cy - 11} L${cx - 4.5} ${cy - 16} M${cx} ${cy - 11} L${cx + 4.5} ${cy - 16}`} strokeWidth={1.5} />
          </g>
        ))}
      </g>
      <circle cx={cx} cy={cy} r="4.6" fill="#fff" />
      <circle cx={cx} cy={cy} r="8" fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.7} />
    </g>
  );
}
