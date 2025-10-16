import { useCallback } from 'react';
import { toastActionRegister } from './actions';

export interface ActionToastHook {
  showActionStart: (actionType: string, payload?: unknown) => void;
  showActionProcessing: (actionType: string, payload?: unknown) => void;
  showActionSuccess: (actionType: string, resultData?: unknown) => void; // executionTime 제거 - 자동 계산됨
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

/**
 * Action Register와 연동되는 토스트 시스템 훅
 * 액션 실행의 각 단계를 시각적으로 표시합니다.
 */
export function useActionToast(): ActionToastHook {
  const showActionStart = useCallback(
    (actionType: string, payload?: unknown) => {
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'start',
        payload,
      });
    },
    []
  );

  const showActionProcessing = useCallback(
    (actionType: string, payload?: unknown) => {
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'processing',
        payload,
      });
    },
    []
  );

  const showActionSuccess = useCallback(
    (
      actionType: string,
      resultData?: unknown
      // executionTime 제거 - ToastSystem actions에서 자동 계산됨
    ) => {
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'success',
        resultData,
        // executionTime은 actions.ts에서 자동으로 0 또는 자동계산된 값 사용
      });
    },
    []
  );

  const showActionError = useCallback(
    (actionType: string, errorMessage: string, payload?: any) => {
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'error',
        errorMessage,
        payload,
      });
    },
    []
  );

  const showToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'system',
      title: string,
      message: string
    ) => {
      toastActionRegister.dispatch('addToast', {
        type,
        title,
        message,
      });
    },
    []
  );

  const clearAllToasts = useCallback(() => {
    toastActionRegister.dispatch('clearAllToasts', {});
  }, []);

  return {
    showActionStart,
    showActionProcessing,
    showActionSuccess,
    showActionError,
    showToast,
    clearAllToasts,
  };
}

/**
 * Action Register 인터셉터를 설정하여 모든 액션을 자동으로 토스트로 표시
 */
export function setupActionToastInterceptor(actionRegister: any) {
  const originalDispatch = actionRegister.dispatch.bind(actionRegister);

  actionRegister.dispatch = (actionType: string, payload: any) => {
    // 토스트 시스템 자체 액션은 제외
    if (actionType.startsWith('toast') || actionType.includes('Toast')) {
      return originalDispatch(actionType, payload);
    }

    const startTime = Date.now();

    // 액션 시작 토스트
    toastActionRegister.dispatch('addActionToast', {
      actionType,
      executionStep: 'start',
      payload,
    });

    try {
      // 처리 중 토스트 (짧은 지연 후)
      setTimeout(() => {
        toastActionRegister.dispatch('addActionToast', {
          actionType,
          executionStep: 'processing',
          payload,
        });
      }, 100);

      // 원본 액션 실행
      const result = originalDispatch(actionType, payload);

      // 성공 토스트
      const executionTime = Date.now() - startTime;
      setTimeout(() => {
        toastActionRegister.dispatch('addActionToast', {
          actionType,
          executionStep: 'success',
          resultData: result,
          executionTime,
        });
      }, 200);

      return result;
    } catch (error) {
      // 에러 토스트
      const _executionTime = Date.now() - startTime;
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        payload,
      });

      throw error;
    }
  };
}

/**
 * 특정 액션들만 선택적으로 토스트 표시
 * 🔧 Fix: Added optional rate limiting (disabled by default)
 */
export function setupSelectiveActionToast(
  actionRegister: any,
  trackedActions: string[] = [],
  options: {
    enableRateLimit?: boolean;
    maxToasts?: number;
    resetInterval?: number;
  } = {}
) {
  const originalDispatch = actionRegister.dispatch.bind(actionRegister);

  // 🔧 Optional rate limiting - disabled by default
  const enableRateLimit = options.enableRateLimit ?? false;
  const actionCallCounts = new Map<
    string,
    { count: number; lastReset: number }
  >();
  const MAX_TOASTS_PER_ACTION = options.maxToasts ?? 10;
  const RESET_INTERVAL = options.resetInterval ?? 1000;

  const shouldShowToast = (actionType: string): boolean => {
    // 🔧 Skip rate limiting if disabled
    if (!enableRateLimit) {
      return true;
    }

    const now = Date.now();
    const current = actionCallCounts.get(actionType);

    if (!current || now - current.lastReset > RESET_INTERVAL) {
      // Reset or initialize counter
      actionCallCounts.set(actionType, { count: 1, lastReset: now });
      return true;
    }

    if (current.count >= MAX_TOASTS_PER_ACTION) {
      return false; // Only block extreme spam when enabled
    }

    current.count++;
    return true;
  };

  actionRegister.dispatch = (actionType: string, payload: any) => {
    // 🔧 Fix: Exclude toast system actions and removal actions from tracking
    const isToastAction =
      actionType.includes('toast') || actionType.includes('Toast');
    const isRemovalAction =
      actionType.includes('remove') ||
      actionType.includes('delete') ||
      actionType.includes('clear');

    // 추적할 액션이 아니거나 토스트/제거 관련 액션인 경우 그냥 실행
    if (
      !trackedActions.includes(actionType) ||
      isToastAction ||
      isRemovalAction
    ) {
      return originalDispatch(actionType, payload);
    }

    // 🔧 Check rate limit before showing toast
    if (!shouldShowToast(actionType)) {
      return originalDispatch(actionType, payload);
    }

    const startTime = Date.now();

    // 액션 시작 표시 (rate limited)
    toastActionRegister.dispatch('addActionToast', {
      actionType,
      executionStep: 'start',
      payload,
    });

    try {
      const result = originalDispatch(actionType, payload);

      // 성공 표시 (rate limited)
      const executionTime = Date.now() - startTime;
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'success',
        resultData: result,
        executionTime,
      });

      return result;
    } catch (error) {
      // 에러 표시 (always show errors regardless of rate limit)
      toastActionRegister.dispatch('addActionToast', {
        actionType,
        executionStep: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        payload,
      });

      throw error;
    }
  };
}
