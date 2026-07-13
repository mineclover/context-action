import { useCallback } from 'react';
import { useChildBActionDispatch } from '../contexts/ChildBContext';

/** View-facing dispatch helpers for Child B. */
export function useChildBTextActions() {
  const dispatch = useChildBActionDispatch();

  return {
    updateText: useCallback(
      (newText: string) => dispatch('updateText', { newText }),
      [dispatch]
    ),
    clearText: useCallback(() => dispatch('clearText', undefined), [dispatch]),
  };
}
