import { useCallback, useMemo } from 'react';
import type {
  ThrottleConfig,
  ThrottleEventType,
} from '../business/throttle-rules';
import { useThrottleAction } from '../contexts/ThrottleContexts';

export function useThrottleActions() {
  const dispatch = useThrottleAction();

  const inputEvent = useCallback(
    (value: string) => dispatch('inputEvent', { value }),
    [dispatch]
  );

  const updateConfig = useCallback(
    (config: ThrottleConfig) => dispatch('updateConfig', config),
    [dispatch]
  );

  const startAutoTest = useCallback(
    (duration: number, frequency: number) =>
      dispatch('startAutoTest', { duration, frequency }),
    [dispatch]
  );

  const runPerformanceTest = useCallback(
    (type: ThrottleEventType, iterations: number, interval: number) =>
      dispatch('runPerformanceTest', { type, iterations, interval }),
    [dispatch]
  );

  const clearLogs = useCallback(() => dispatch('clearLogs'), [dispatch]);
  const stopAutoTest = useCallback(() => dispatch('stopAutoTest'), [dispatch]);

  return useMemo(
    () => ({
      inputEvent,
      updateConfig,
      startAutoTest,
      runPerformanceTest,
      clearLogs,
      stopAutoTest,
    }),
    [
      clearLogs,
      inputEvent,
      runPerformanceTest,
      startAutoTest,
      stopAutoTest,
      updateConfig,
    ]
  );
}
