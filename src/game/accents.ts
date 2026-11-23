import type { Collectible } from "./collectibles";

export const ACCENTS: Record<string, { name: string; color: string }> = {
  violet: { name: "Фиолетовый", color: "#a78bfa" },
  cyan: { name: "Бирюзовый", color: "#22d3ee" },
  emerald: { name: "Изумрудный", color: "#34d399" },
  rose: { name: "Розовый", color: "#fb7185" },
  amber: { name: "Янтарный", color: "#fbbf24" },
};

export type PublicUser = {
  id: number;
  username: string;
  accent: string;
  animations: boolean;
  createdAt: string;
  /** доступ к админ-меню */
  isAdmin?: boolean;
  /** галочка рядом с именем */
  verified?: boolean;
  /** «Статистика и профиль»: включено по умолчанию */
  showProfile: boolean;
  /** описание профиля (до 800 символов) */
  bio: string;
  /** коллекционный кристалл рядом с именем */
  featured: Collectible | null;
};
