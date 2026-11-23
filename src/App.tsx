import { useEffect, type ReactNode } from "react";
import { AppProvider, useApp } from "@/components/AppProvider";
import AuthForm from "@/components/AuthForm";
import CollectionView from "@/components/CollectionView";
import AdminPanel from "@/components/AdminPanel";
import MarketView from "@/components/MarketView";
import ProfileView from "@/components/ProfileView";
import SearchView from "@/components/SearchView";
import StatsView from "@/components/StatsView";
import Logo from "@/components/Logo";
import CraftView from "@/components/CraftView";
import Navbar from "@/components/Navbar";
import SettingsForms from "@/components/SettingsForms";
import StuckBanner from "@/components/StuckBanner";
import ChestsTab from "@/game/ChestsTab";
import InventoryTab from "@/game/InventoryTab";
import { CRYSTALS, CrystalIcon } from "@/game/crystals";
import { CHESTS } from "@/game/game";
import { ChestIcon } from "@/game/icons";
import { Link, navigate, usePathname } from "@/lib/router";

function Landing() {
  const preview = CRYSTALS.filter((c) => ["ruby", "diamond", "astralite", "abyss"].includes(c.id));
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="flex flex-wrap items-end justify-center gap-2">
        {CHESTS.map((c) => (
          <ChestIcon key={c.id} theme={c.theme} className="h-20 w-24" />
        ))}
      </div>
      <h1 className="bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
        Crystallized
      </h1>
      <p className="max-w-md text-slate-400">
        Покупайте деревянные, серебряные, золотые и космические сундуки, открывайте их, продавайте кристаллы и собирайте полную
        коллекцию — от кварца до таинственного «???».
      </p>
      <div className="flex gap-3">
        {preview.map((c) => (
          <CrystalIcon key={c.id} def={c} className="float h-14 w-14" />
        ))}
      </div>
      <Link href="/auth" className="btn px-8 py-3 text-lg">
        Войти / Зарегистрироваться
      </Link>
    </main>
  );
}

function AuthPage() {
  const { user } = useApp();
  useEffect(() => {
    if (user) navigate("/");
  }, [user]);
  if (user) return null;
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-14">
      <div className="text-center">
        <Logo size={84} glow className="anim-float mx-auto" />
        <h1 className="mt-4 text-3xl font-bold text-white">Добро пожаловать в Crystallized</h1>
        <p className="mt-2 text-slate-400">Войдите или создайте профиль, чтобы открывать сундуки и собирать кристаллы.</p>
      </div>
      <AuthForm />
    </main>
  );
}

function Guard({ children }: { children: ReactNode }) {
  const { user } = useApp();
  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);
  return user ? <>{children}</> : null;
}

function Routes() {
  const path = usePathname();
  const { user } = useApp();

  switch (path) {
    case "/":
      return user ? (
        <main className="mx-auto max-w-3xl px-4 py-6">
          <ChestsTab />
        </main>
      ) : (
        <Landing />
      );
    case "/auth":
      return <AuthPage />;
    case "/inventory":
      return (
        <Guard>
          <main className="mx-auto max-w-3xl px-4 py-8">
            <InventoryTab />
          </main>
        </Guard>
      );
    case "/collection":
      return (
        <Guard>
          <CollectionView />
        </Guard>
      );
    case "/craft":
      return (
        <Guard>
          <CraftView />
        </Guard>
      );
    case "/market":
      return (
        <Guard>
          <MarketView />
        </Guard>
      );
    case "/search":
      return (
        <Guard>
          <SearchView />
        </Guard>
      );
    case "/stats":
      return (
        <Guard>
          <StatsView />
        </Guard>
      );
    case "/settings":
      return (
        <Guard>
          <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
            <h1 className="text-2xl font-bold text-white">Настройки</h1>
            <SettingsForms />
          </main>
        </Guard>
      );
    case "/admin":
      return (
        <Guard>
          <AdminPanel />
        </Guard>
      );
    default: {
      const m = /^\/user\/(\d+)$/.exec(path);
      if (m) {
        return (
          <Guard>
            <ProfileView id={Number(m[1])} />
          </Guard>
        );
      }
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">Страница не найдена</h1>
          <Link href="/" className="btn mt-6">
            На главную
          </Link>
        </main>
      );
    }
  }
}

export default function App() {
  return (
    <AppProvider>
      <Navbar />
      <StuckBanner />
      <Routes />
    </AppProvider>
  );
}
