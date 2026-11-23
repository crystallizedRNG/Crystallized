
import { useState } from "react";
import { useApp } from "./AppProvider";
import { navigate } from "@/lib/router";
import TermsModal from "./TermsModal";

export default function AuthForm() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setField(null);
    setLoading(true);
    try {
      const res = mode === "login" ? await login(username, password) : await register(username, password);
      if (!res.ok) {
        setError(res.error);
        setField(res.field ?? null);
        return;
      }
      navigate("/");
    } catch {
      setError("Что-то пошло не так.");
    } finally {
      setLoading(false);
    }
  }

  const tab = (m: "login" | "register", label: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setError(null);
        setField(null);
      }}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
        mode === m ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-6">
      <div className="flex gap-1 rounded-xl bg-black/30 p-1">
        {tab("login", "Вход")}
        {tab("register", "Регистрация")}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-slate-300">Имя пользователя</span>
        <input
          className="input"
          style={field === "username" ? { borderColor: "#f43f5e" } : undefined}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          maxLength={20}
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-slate-300">Пароль</span>
        <input
          className="input"
          style={field === "password" ? { borderColor: "#f43f5e" } : undefined}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 6 символов"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      {error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      )}

      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>

      <p className="text-center text-xs text-slate-500">
        {mode === "login"
          ? "Нет аккаунта? Откройте вкладку «Регистрация»."
          : "Только имя и пароль — больше ничего не нужно."}
      </p>

      <button
        type="button"
        onClick={() => setTerms(true)}
        className="block w-full text-center text-xs text-slate-400 underline decoration-dotted underline-offset-2 transition hover:text-white"
      >
        Terms of use — правила использования
      </button>
      {terms && <TermsModal onClose={() => setTerms(false)} />}
    </form>
  );
}
