"use client";

import dynamic from "next/dynamic";

// Интерфейс работает в браузере (hash-роутер, звук, анимации), а все данные приходят с сервера.
const App = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => <div className="flex min-h-screen items-center justify-center text-slate-400">Загрузка…</div>,
});

export default function HomePage() {
  return <App />;
}
