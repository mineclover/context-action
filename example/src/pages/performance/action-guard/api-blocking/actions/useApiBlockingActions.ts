import { useCallback, useMemo } from 'react';
import type { ApiBlockingActions } from '../contexts/ApiBlockingContexts';
import { useApiBlockingAction } from '../contexts/ApiBlockingContexts';

type RateLimitPayload = ApiBlockingActions['configureRateLimit'];

export function useApiBlockingActions() {
  const dispatch = useApiBlockingAction();

  const makeApiCall = useCallback(
    (endpoint: string, method: string) =>
      dispatch('makeApiCall', {
        endpoint,
        method,
        timestamp: Date.now(),
      }),
    [dispatch]
  );

  const setBlockDuration = useCallback(
    (duration: number) => dispatch('setBlockDuration', { duration }),
    [dispatch]
  );

  const configureRateLimit = useCallback(
    (payload: RateLimitPayload) => dispatch('configureRateLimit', payload),
    [dispatch]
  );

  const clearHistory = useCallback(() => dispatch('clearHistory'), [dispatch]);

  return useMemo(
    () => ({
      makeApiCall,
      setBlockDuration,
      configureRateLimit,
      clearHistory,
    }),
    [clearHistory, configureRateLimit, makeApiCall, setBlockDuration]
  );
}
