
import { useState, type ReactNode } from "react";
import { useRouter } from "@/lib/router";
import { ACCENTS } from "@/game/accents";
import { useApp, type Result } from "./AppProvider";
import { MiniCollectible } from "@/game/CollectibleCard";
import { MODEL_BY_ID } from "@/game/collectibles";

type Msg = { type: "ok" | "err"; text: string } | null;

function Message({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <p className={`text-sm ${msg.type === "ok" ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</p>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

const toMsg = (r: Result, okText: string): Msg =>
  r.ok ? { type: "ok", text: okText } : { type: "err", text: r.error };

export default function SettingsForms() {
  const { user, save, account } = useApp();
  const router = useRouter();
  const [newName, setNewName] = useState(user?.username ?? "");
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState<Msg>(null);
  const [dangerPass, setDangerPass] = useState("");
  const [dangerMsg, setDangerMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [bioMsg, setBioMsg] = useState<Msg>(null);
  const [featMsg, setFeatMsg] = useState<Msg>(null);

  if (!user) return null;

  async function changeName(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await account({ action: "username", username: newName });
    setNameMsg(toMsg(r, "Имя изменено."));
    setBusy(false);
  }

  async function changePass(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await account({ action: "password", current: curPass, next: newPass });
    setPassMsg(toMsg(r, "Пароль изменён."));
    if (r.ok) {
      setCurPass("");
      setNewPass("");
    }
    setBusy(false);
  }

  async function saveBio(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await account({ action: "bio", bio });
    setBioMsg(toMsg(r, "Описание сохранено."));
    setBusy(false);
  }

  async function setFeatured(uid: string | null) {
    const r = await account({ action: "featured", uid });
    setFeatMsg(toMsg(r, uid ? "Кристалл установлен рядом с именем." : "Кристалл рядом с именем убран."));
  }

  function pref(patch: { accent?: string; animations?: boolean; showProfile?: boolean }) {
    void account({ action: "prefs", ...patch });
  }

  async function onReset() {
    if (!confirm("Удалить весь игровой прогресс (монеты, сундуки, кристаллы и коллекцию)?")) return;
    setBusy(true);
    const r = await account({ action: "reset", password: dangerPass });
    setDangerMsg(toMsg(r, "Прогресс сброшен."));
    setBusy(false);
    if (r.ok) setDangerPass("");
  }

  async function onDelete() {
    if (!confirm("Аккаунт будет удалён навсегда. Продолжить?")) return;
    setBusy(true);
    const r = await account({ action: "delete", password: dangerPass });
    setBusy(false);
    if (r.ok) {
      router.push("/auth");
      router.refresh();
    } else {
      setDangerMsg({ type: "err", text: r.error });
    }
  }

  return (
    <div className="space-y-5">
      <Section title="Профиль">
        <p className="text-sm text-slate-400">
          Аккаунт создан: {new Date(user.createdAt).toLocaleDateString("ru-RU")}
        </p>
        <form onSubmit={changeName} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm text-slate-300">Имя пользователя</span>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={20} required />
          </label>
          <Message msg={nameMsg} />
          <button type="submit" className="btn" disabled={busy || newName.trim() === user.username}>
            Сменить имя
          </button>
        </form>
      </Section>

      <Section title="Статистика и профиль">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="text-sm text-slate-300">
            <b className="text-white">Показывать статистику и профиль</b>
            <span className="mt-1 block text-xs text-slate-500">
              Включено по умолчанию. Если выключить: ваша статистика не засчитывается в «Статистике» (вы не получите место и
              не будете в списке), а профиль будет скрыт — другие увидят только ваше имя и надпись «Профиль скрыт». Описание
              профиля тоже будет скрыто.
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
            checked={user.showProfile}
            onChange={(e) => pref({ showProfile: e.target.checked })}
          />
        </label>
      </Section>

      <Section title="О себе">
        <form onSubmit={saveBio} className="space-y-3">
          <textarea
            className="input min-h-[8rem] resize-y"
            placeholder="Расскажите о себе (до 800 символов)"
            value={bio}
            maxLength={800}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Описание видно в вашем профиле. Если профиль скрыт — оно тоже скрыто.</span>
            <span>{bio.length}/800</span>
          </div>
          <Message msg={bioMsg} />
          <button type="submit" className="btn" disabled={busy || bio.trim() === user.bio}>
            Сохранить описание
          </button>
        </form>
      </Section>

      <Section title="Кристалл рядом с именем">
        <p className="text-sm text-slate-400">
          Выберите коллекционный кристалл, который будет стоять рядом с вашим именем:{" "}
          <b className="text-white">
            {user.username}
            <MiniCollectible item={user.featured} />
          </b>
        </p>
        {!save || save.collectibles.length === 0 ? (
          <p className="text-sm text-slate-500">У вас пока нет коллекционных кристаллов.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {save.collectibles.map((c) => {
              const active = user.featured?.uid === c.uid;
              return (
                <button
                  key={c.uid}
                  type="button"
                  title={MODEL_BY_ID[c.model]?.name}
                  onClick={() => setFeatured(c.uid)}
                  className={`rounded-xl border p-1.5 transition hover:bg-white/10 ${active ? "border-[var(--accent)] bg-white/10" : "border-white/10"}`}
                >
                  <MiniCollectible item={c} size={40} />
                </button>
              );
            })}
          </div>
        )}
        {user.featured && (
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setFeatured(null)}>
            Убрать кристалл
          </button>
        )}
        <Message msg={featMsg} />
      </Section>

      <Section title="Пароль">
        <form onSubmit={changePass} className="space-y-3">
          <input
            className="input"
            type="password"
            placeholder="Текущий пароль"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            autoComplete="current-password"
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Новый пароль (мин. 6 символов)"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Message msg={passMsg} />
          <button type="submit" className="btn" disabled={busy}>
            Сменить пароль
          </button>
        </form>
      </Section>

      <Section title="Оформление">
        <div>
          <p className="mb-2 text-sm text-slate-300">Акцентный цвет</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACCENTS).map(([key, a]) => (
              <button
                key={key}
                type="button"
                title={a.name}
                aria-label={a.name}
                onClick={() => pref({ accent: key })}
                className="h-9 w-9 rounded-full border-2 transition hover:scale-110"
                style={{ background: a.color, borderColor: user.accent === key ? "#fff" : "transparent" }}
              />
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm text-slate-300">Анимации</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--accent)]"
            checked={user.animations}
            onChange={(e) => pref({ animations: e.target.checked })}
          />
        </label>
      </Section>

      <Section title="Опасная зона">
        <input
          className="input"
          type="password"
          placeholder="Введите пароль для подтверждения"
          value={dangerPass}
          onChange={(e) => setDangerPass(e.target.value)}
        />
        <Message msg={dangerMsg} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-danger" disabled={busy || !dangerPass} onClick={onReset}>
            Сбросить прогресс
          </button>
          <button type="button" className="btn btn-danger" disabled={busy || !dangerPass} onClick={onDelete}>
            Удалить аккаунт
          </button>
        </div>
      </Section>
    </div>
  );
}
