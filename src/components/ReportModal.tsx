import { useState } from "react";
import { useApp } from "./AppProvider";
import { REPORT_MAX } from "@/lib/store";

/** Жалоба на игрока: причина до 1000 символов */
export default function ReportModal({ target, onClose }: { target: { id: number; username: string }; onClose: () => void }) {
  const { report } = useApp();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await report(target.id, reason);
    setBusy(false);
    if (r.ok) setSent(true);
    else setError(r.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-lg space-y-4 !bg-[#12102a] p-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">🚩 Пожаловаться на {target.username}</h2>
            <p className="text-xs text-slate-500">Опишите, что именно нарушил игрок. Жалобу увидят администраторы.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost !px-3 !py-1.5 text-sm" aria-label="Закрыть">
            ✕
          </button>
        </div>
        {sent ? (
          <>
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              Жалоба отправлена. Спасибо, что помогаете сделать игру лучше!
            </p>
            <button type="button" className="btn w-full" onClick={onClose}>
              Закрыть
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <textarea
              className="input min-h-[9rem] resize-y"
              placeholder="Причина жалобы"
              value={reason}
              maxLength={REPORT_MAX}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            <div className="text-right text-xs text-slate-500">
              {reason.length}/{REPORT_MAX}
            </div>
            {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-danger flex-1" disabled={busy || !reason.trim()}>
                Отправить жалобу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
