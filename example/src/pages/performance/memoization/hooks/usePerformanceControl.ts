import { useStoreValue } from '@context-action/react';
import { useCallback, useMemo } from 'react';
import {
  usePerformanceControlDispatch,
  usePerformanceControlStore,
} from '../contexts/ComparisonContexts';

/**
 * Performance Control ViewModel Hook - 자동 업데이트 제어 로직
 */

export function usePerformanceControlState() {
  const autoUpdateStore = usePerformanceControlStore('autoUpdate');
  const updateIntervalStore = usePerformanceControlStore('updateInterval');
  const autoUpdate = useStoreValue(autoUpdateStore);
  const updateInterval = useStoreValue(updateIntervalStore);

  return {
    autoUpdate,
    updateInterval,
  };
}

export function usePerformanceControlActions() {
  const dispatch = usePerformanceControlDispatch();

  const toggleAutoUpdate = useCallback(
    () => dispatch('toggleAutoUpdate'),
    [dispatch]
  );
  const setUpdateInterval = useCallback(
    (interval: number) => dispatch('setUpdateInterval', { interval }),
    [dispatch]
  );

  return useMemo(
    () => ({ toggleAutoUpdate, setUpdateInterval }),
    [setUpdateInterval, toggleAutoUpdate]
  );
}

/**
 * @deprecated Registration now belongs to ComparisonHandlerRegistry.
 * Kept as a source-compatible status hook for older compositions.
 */
export function usePerformanceControlLogic() {
  return {
    handlersRegistered: true,
  };
}
