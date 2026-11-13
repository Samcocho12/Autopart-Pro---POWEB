import { useCallback, useEffect, useState } from "react";

/** Hook mínimo para cargar datos con estados de carga / error y recarga manual. */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(null);
    run()
      .then((d) => vivo && setData(d))
      .catch((e: Error) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, [run, tick]);

  return { data, error, loading, reload: () => setTick((t) => t + 1), setData };
}
