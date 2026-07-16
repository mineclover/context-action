import { useCallback, useMemo } from 'react';
import type { ScrollPositionPayload } from '../business/scroll-rules';
import { useScrollAction } from '../contexts/ScrollContexts';

export function useScrollActions() {
  const dispatch = useScrollAction();

  const updateScrollPosition = useCallback(
    (payload: ScrollPositionPayload) =>
      dispatch('updateScrollPosition', payload),
    [dispatch]
  );

  const updateVirtualization = useCallback(
    (startIndex: number, endIndex: number) =>
      dispatch('updateVirtualization', { startIndex, endIndex }),
    [dispatch]
  );

  const reachScrollEnd = useCallback(
    (direction: 'top' | 'bottom' | 'left' | 'right') =>
      dispatch('reachScrollEnd', {
        element: 'scroll-container',
        direction,
      }),
    [dispatch]
  );

  const loadMoreContent = useCallback(
    (page: number, itemsPerPage: number) =>
      dispatch('loadMoreContent', { page, itemsPerPage }),
    [dispatch]
  );

  const smoothScrollTo = useCallback(
    (target: number, direction: 'x' | 'y' = 'y') =>
      dispatch('smoothScrollTo', {
        element: 'scroll-container',
        target,
        direction,
      }),
    [dispatch]
  );

  const resetScroll = useCallback(
    () => dispatch('resetScroll', { element: 'scroll-container' }),
    [dispatch]
  );

  const setAutoScroll = useCallback(
    (enabled: boolean, speed: number) =>
      dispatch('setAutoScroll', { enabled, speed }),
    [dispatch]
  );

  return useMemo(
    () => ({
      updateScrollPosition,
      updateVirtualization,
      reachScrollEnd,
      loadMoreContent,
      smoothScrollTo,
      resetScroll,
      setAutoScroll,
    }),
    [
      loadMoreContent,
      reachScrollEnd,
      resetScroll,
      setAutoScroll,
      smoothScrollTo,
      updateScrollPosition,
      updateVirtualization,
    ]
  );
}
