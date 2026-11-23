
import { useApp } from "./AppProvider";
import { isStuck } from "@/game/game";
import { sfx } from "@/game/sound";

export default function StuckBanner() {
  const { save, grant, notify } = useApp();
  if (!save || !isStuck(save)) return null;
  return (
    <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      У вас закончились монеты, сундуки и кристаллы.
      <button
        onClick={async () => {
          const gain = await grant();
          if (gain) {
            sfx.grant();
            notify(`+${gain} монет`);
          }
        }}
        className="rounded-xl bg-amber-400 px-4 py-1.5 font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
      >
        Получить помощь
      </button>
    </div>
  );
}
