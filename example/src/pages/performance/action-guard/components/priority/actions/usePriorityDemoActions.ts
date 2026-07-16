import { useCallback, useMemo } from 'react';
import { usePriorityDemoAction } from '../contexts/PriorityDemoContexts';

export function usePriorityDemoActions() {
  const dispatch = usePriorityDemoAction();

  const registerWord = useCallback(
    (priority: number, word: string) =>
      dispatch('registerWord', { priority, word }),
    [dispatch]
  );

  const executeRegistered = useCallback(
    () => dispatch('executeRegistered'),
    [dispatch]
  );

  const clear = useCallback(() => dispatch('clear'), [dispatch]);

  return useMemo(
    () => ({ registerWord, executeRegistered, clear }),
    [clear, executeRegistered, registerWord]
  );
}
