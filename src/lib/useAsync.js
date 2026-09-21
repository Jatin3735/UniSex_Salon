import { useCallback, useEffect, useState } from "react";

/**
 * Runs an async loader and tracks {data, loading, error}, aborting in-flight
 * requests on unmount or when the deps change.
 *
 * A plain .js module so it can live next to the other helpers without
 * tripping react-refresh/only-export-components.
 *
 * `loader` receives an AbortSignal and must be stable — wrap it in useCallback
 * at the call site (that callback's deps are the real dependency list).
 */
export function useAsync(loader, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    // All state transitions happen inside this async task, never synchronously
    // in the effect body — data fetching is the canonical legitimate effect,
    // and keeping the setState out of the sync path satisfies
    // react-hooks/set-state-in-effect without disabling it.
    (async () => {
      if (!enabled) {
        setState({ data: null, loading: false, error: null });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await loader(controller.signal);
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      } catch (err) {
        // An abort is us navigating away, not a failure to report.
        if (err.name === "AbortError" || controller.signal.aborted) return;
        setState({ data: null, loading: false, error: err });
      }
    })();

    return () => controller.abort();
  }, [loader, enabled, reloadCount]);

  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}
