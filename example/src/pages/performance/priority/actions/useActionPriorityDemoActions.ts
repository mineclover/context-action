import { useCallback } from 'react';
import { useActionPriorityDemoAction } from '../contexts/ActionPriorityDemoContexts';

export function useActionPriorityDemoActions() {
  const dispatch = useActionPriorityDemoAction();

  return {
    authenticate: useCallback(
      (username: string, password: string) =>
        dispatch('authenticate', { username, password }),
      [dispatch]
    ),
    resetResults: useCallback(() => dispatch('resetResults'), [dispatch]),
    setExecutionStatus: useCallback(
      (isExecuting: boolean) => dispatch('setExecutionStatus', { isExecuting }),
      [dispatch]
    ),
  };
}
