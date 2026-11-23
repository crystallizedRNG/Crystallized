
import { Link, usePathname, useRouter } from "@/lib/router";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { MiniCollectible } from "@/game/CollectibleCard";
import { useApp } from "./AppProvider";
import { CoinIcon } from "@/game/icons";
import { sfx } from "@/game/sound";
import { CRYSTALS } from "@/game/crystals";

const links = [
  { href: "/", label: "Сундуки" },
  { href: "/inventory", label: "Инвентарь" },
  { href: "/collection", label: "Коллекция" },
  { href: "/craft", label: "Крафт" },
  { href: "/market", label: "Рынок" },
  { href: "/search", label: "Поиск" },
  { href: "/stats", label: "Статистика" },
  { href: "/settings", label: "Настройки" },
];

export default function Navbar() {
  const { user, save, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [bump, setBump] = useState(0);
  const prevCoins = useRef(save?.coins);

  useEffect(() => setMuted(sfx.isMuted()), []);

  useEffect(() => {
    if (prevCoins.current !== save?.coins) setBump((b) => b + 1);
    prevCoins.current = save?.coins;
  }, [save?.coins]);

  async function handleLogout() {
    await logout();
    router.push("/auth");
    router.refresh();
  }

  const chestCount = save ? Object.values(save.chests).reduce((a, b) => a + b, 0) : 0;
  const crystalCount = save ? CRYSTALS.reduce((s, c) => s + save.plain[c.id] + save.bonus[c.id], 0) : 0;
  const navLinks = user?.isAdmin ? [...links, { href: "/admin", label: "🛡 Админ" }] : links;
  const badges: Record<string, number> = { "/": chestCount, "/inventory": crystalCount };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0b17]/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-wide text-white">
          <Logo size={30} />
          Crystallized
        </Link>

        {user && save ? (
          <>
            <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                const badge = badges[l.href];
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => !active && sfx.select()}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                    style={active ? { boxShadow: "inset 0 -2px 0 var(--accent)" } : undefined}
                  >
                    {l.label}
                    {!!badge && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] leading-none">{badge}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  sfx.setMuted(!muted);
                  setMuted(!muted);
                }}
                aria-label={muted ? "Включить звук" : "Выключить звук"}
                title={muted ? "Включить звук" : "Выключить звук"}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-violet-100 transition hover:bg-white/10 active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" fillOpacity={0.25} />
                  {muted ? (
                    <>
                      <path d="m16 9 5 6" />
                      <path d="m21 9-5 6" />
                    </>
                  ) : (
                    <>
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                    </>
                  )}
                </svg>
              </button>
              <div
                key={bump}
                className="coin-pill flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-extrabold text-amber-200"
              >
                <CoinIcon className="h-5 w-5" />
                {save.coins}
              </div>
              <span className="hidden text-slate-300 md:inline">
                👤 <b className="text-white">{user.username}</b><MiniCollectible item={user.featured} size={20} />{user.verified && <> <VerifiedBadge /></>}
              </span>
              <button type="button" onClick={handleLogout} className="btn btn-ghost !px-3 !py-1.5 text-sm">
                Выйти
              </button>
            </div>
          </>
        ) : (
          pathname !== "/auth" && (
            <Link href="/auth" className="btn !py-1.5 text-sm">
              Войти
            </Link>
          )
        )}
      </div>
    </header>
  );
}
