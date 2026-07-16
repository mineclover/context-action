import { useCallback } from 'react';
import { useConditionalAction } from '../contexts/ConditionalPatternsContexts';

export function usePermissionActions() {
  const dispatch = useConditionalAction();

  return {
    checkPermission: useCallback(
      (action: string, userId: string, resourceId?: string) =>
        dispatch('checkPermission', { action, userId, resourceId }),
      [dispatch]
    ),
    executeSecureAction: useCallback(
      (action: string, userId: string, payload: unknown) =>
        dispatch('executeSecureAction', { action, userId, payload }),
      [dispatch]
    ),
  };
}
