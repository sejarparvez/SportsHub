import { useEffect } from "react";

export function useFetchList<T>(
  url: string,
  setData: (data: T) => void,
  setLoading: (v: boolean) => void,
  onError?: (msg: string) => void,
  errorMsg?: string,
  deps: unknown[] = [],
) {
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(errorMsg || "Failed to fetch");
        return r.json() as Promise<T>;
      })
      .then((data) => {
        if (ignore) return;
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        onError?.(errorMsg || "Failed to fetch");
        setLoading(false);
      });
    return () => { ignore = true; };
  }, [url, setData, setLoading, onError, errorMsg, ...deps]);
}
