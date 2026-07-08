/**
 * useAsync — one shared hook for the loading/error/success pattern used by
 * useExplain, useQuiz, and useChat. Keeps request state consistent across
 * the app so every button gets the same feel.
 */

import { useCallback, useState } from 'react';
import { ApiError } from '../lib/api';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorType: string | null;
}

export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: false,
    error: null,
    errorType: null,
  });

  const run = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null, errorType: null });
      try {
        const data = await fn(...args);
        setState({ data, loading: false, error: null, errorType: null });
        return data;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.';
        const type = e instanceof ApiError ? e.type : 'unknown';
        setState({ data: null, loading: false, error: message, errorType: type });
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, errorType: null });
  }, []);

  return { ...state, run, reset, setData: (d: T | null) => setState((s) => ({ ...s, data: d })) };
}
