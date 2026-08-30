import { useCallback } from 'react';
import { useToastSystem } from './ToastContext';

export interface ActionToastHook {
  showActionStart: (actionType: string, payload?: unknown) => void;
  showActionProcessing: (actionType: string, payload?: unknown) => void;
  showActionSuccess: (actionType: string, resultData?: unknown) => void;
  showActionError: (
    actionType: string,
    errorMessage: string,
    payload?: unknown
  ) => void;
  showToast: (
    type: 'success' | 'error' | 'info' | 'system',
    title: string,
    message: string
  ) => void;
  clearAllToasts: () => void;
}

/** React-facing commands for the ToastSystemProvider that owns this subtree. */
export function useActionToast(): ActionToastHook {
  const toastSystem = useToastSystem();

  const showActionStart = useCallback(
    (actionType: string, payload?: unknown) => {
      toastSystem.showActionToast(actionType, 'start', { payload });
    },
    [toastSystem]
  );
  const showActionProcessing = useCallback(
    (actionType: string, payload?: unknown) => {
      toastSystem.showActionToast(actionType, 'processing', { payload });
    },
    [toastSystem]
  );
  const showActionSuccess = useCallback(
    (actionType: string, resultData?: unknown) => {
      toastSystem.showActionToast(actionType, 'success', { resultData });
    },
    [toastSystem]
  );
  const showActionError = useCallback(
    (actionType: string, errorMessage: string, payload?: unknown) => {
      toastSystem.showActionToast(actionType, 'error', {
        errorMessage,
        payload,
      });
    },
    [toastSystem]
  );
  const showToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'system',
      title: string,
      message: string
    ) => {
      toastSystem.showToast(type, title, message);
    },
    [toastSystem]
  );
  const clearAllToasts = useCallback(() => {
    toastSystem.clearAllToasts();
  }, [toastSystem]);

  return {
    showActionStart,
    showActionProcessing,
    showActionSuccess,
    showActionError,
    showToast,
    clearAllToasts,
  };
}
