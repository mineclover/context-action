import { useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { 
  usePerformanceControlStore, 
  usePerformanceControlDispatch, 
  usePerformanceControlHandler 
} from '../models/ComparisonModel';

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

  return {
    toggleAutoUpdate: () => dispatch('toggleAutoUpdate'),
    setUpdateInterval: (interval: number) => dispatch('setUpdateInterval', { interval }),
  };
}

/**
 * Performance Control Business Logic Hook - 단순한 상태 제어만 담당
 */
export function usePerformanceControlLogic() {
  const autoUpdateStore = usePerformanceControlStore('autoUpdate');
  const updateIntervalStore = usePerformanceControlStore('updateInterval');

  // Auto update toggle handler
  const handleToggleAutoUpdate = useCallback(async () => {
    const current = autoUpdateStore.getValue();
    autoUpdateStore.setValue(!current);
  }, [autoUpdateStore]);

  // Interval setting handler
  const handleSetUpdateInterval = useCallback(async (payload: { interval: number }) => {
    updateIntervalStore.setValue(payload.interval);
  }, [updateIntervalStore]);

  // Register handlers
  usePerformanceControlHandler('toggleAutoUpdate', handleToggleAutoUpdate);
  usePerformanceControlHandler('setUpdateInterval', handleSetUpdateInterval);

  return {
    handlersRegistered: true,
  };
}