import { useCallback } from 'react';
import {
  type MouseClick,
  type MouseEventActions,
  useMouseAction,
} from '../contexts/EnhancedContextStoreContexts';

/** Semantic commands exposed to canvas Views and ViewModels. */
export function useEnhancedMouseActions() {
  const dispatch = useMouseAction();

  const updatePosition = useCallback(
    (payload: MouseEventActions['updatePosition']) => {
      dispatch('updatePosition', payload);
    },
    [dispatch]
  );
  const recordClick = useCallback(
    (payload: MouseClick) => {
      dispatch('recordClick', payload);
    },
    [dispatch]
  );
  const enterArea = useCallback(
    (payload: MouseEventActions['enterArea']) => {
      dispatch('enterArea', payload);
    },
    [dispatch]
  );
  const leaveArea = useCallback(
    (payload: MouseEventActions['leaveArea']) => {
      dispatch('leaveArea', payload);
    },
    [dispatch]
  );
  const reset = useCallback(() => {
    dispatch('reset');
  }, [dispatch]);

  return { updatePosition, recordClick, enterArea, leaveArea, reset };
}
