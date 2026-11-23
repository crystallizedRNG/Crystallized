import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Загружает данные с сервера и обновляет их «вживую»: раз в несколько секунд, при возвращении на вкладку
 * и сразу после reload(). Пока идёт обновление, прежние данные остаются на экране.
 */
export function useRemote<T>(
  fetcher: () => Promise<T | undefined>,
  deps: readonly unknown[],
  intervalMs = 5000,
): { data: T | undefined; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const seq = useRef(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const mine = ++seq.current;
      const r = await fetchRef.current();
      // устаревшие ответы (обогнал более новый запрос) игнорируем; при ошибке сети (undefined) оставляем прежние данные
      if (!alive || mine !== seq.current) return;
      if (r !== undefined) setData(r);
      setLoading(false);
    };
    void load();
    const timer = intervalMs > 0 ? window.setInterval(() => !document.hidden && void load(), intervalMs) : 0;
    const onVisible = () => !document.hidden && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, intervalMs]);

  return { data, loading, reload };
}
