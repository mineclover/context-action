import { ActionRegister } from '@context-action/react';
import { createLogger, LogLevel } from '@/utils/logger';
import { createToastStores, type ToastStores } from './store';
import type { ActionExecutionToast, Toast, ToastConfig } from './types';

interface ToastActionMap {
  addToast: {
    type: Toast['type'];
    title: string;
    message: string;
    actionType?: string;
    payload?: unknown;
    duration?: number;
  };
  addActionToast: {
    actionType: string;
    executionStep: ActionExecutionToast['executionStep'];
    payload?: unknown;
    executionTime?: number;
    resultData?: unknown;
    errorMessage?: string;
  };
  removeToast: { toastId: string };
  updateToastPhase: { toastId: string; phase: Toast['phase'] };
  clearAllToasts: Record<string, never>;
  updateToastConfig: Partial<ToastConfig>;
  [key: string]: unknown;
}

export interface ToastPublisher {
  showToast: (
    type: 'success' | 'error' | 'info' | 'system',
    title: string,
    message: string
  ) => void;
  showActionToast: (
    actionType: string,
    executionStep: ActionExecutionToast['executionStep'],
    options?: {
      payload?: unknown;
      executionTime?: number;
      resultData?: unknown;
      errorMessage?: string;
    }
  ) => void;
}

export interface ToastSystemController extends ToastPublisher {
  readonly stores: ToastStores;
  removeToast: (toastId: string) => void;
  updateToastPhase: (toastId: string, phase: Toast['phase']) => void;
  clearAllToasts: () => void;
  updateConfig: (configUpdate: Partial<ToastConfig>) => void;
}

const logger = createLogger(LogLevel.DEBUG);

const generateToastId = () =>
  `toast_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const getActionIcon = (actionType: string): string => {
  const iconMap: Record<string, string> = {
    updateProfile: '👤',
    toggleTheme: '🎨',
    resetProfile: '🔄',
    addToCart: '🛒',
    removeFromCart: '🗑️',
    updateQuantity: '📊',
    clearCart: '🧹',
    addTodo: '✅',
    toggleTodo: '☑️',
    deleteTodo: '🗑️',
    updateTodoPriority: '🎯',
    sendMessage: '💬',
    deleteMessage: '🗑️',
    clearChat: '🧹',
    switchUser: '👥',
    login: '🔑',
    logout: '🚪',
    saveData: '💾',
    loadData: '📂',
    error: '❌',
    success: '✅',
    info: 'ℹ️',
  };

  return iconMap[actionType] || '⚡';
};

const getExecutionStepMessage = (
  actionType: string,
  step: ActionExecutionToast['executionStep'],
  errorMessage?: string
): string => {
  const actionNames: Record<string, string> = {
    updateProfile: '프로필 업데이트',
    toggleTheme: '테마 변경',
    addToCart: '장바구니 추가',
    addTodo: '할일 추가',
    sendMessage: '메시지 전송',
  };
  const actionName = actionNames[actionType] || actionType;

  switch (step) {
    case 'start':
      return `${actionName} 시작...`;
    case 'processing':
      return `${actionName} 처리 중...`;
    case 'success':
      return `${actionName} 완료!`;
    case 'error':
      return `${actionName} 실패: ${errorMessage || '알 수 없는 오류'}`;
  }
};

function isDuplicateToast(
  recentToasts: Map<string, number>,
  type: string,
  message: string
): boolean {
  const key = `${type}:${message}`;
  const now = Date.now();
  const lastTime = recentToasts.get(key);

  if (lastTime && now - lastTime < 500) return true;

  recentToasts.set(key, now);
  for (const [candidate, time] of recentToasts.entries()) {
    if (now - time > 60_000) recentToasts.delete(candidate);
  }
  return false;
}

function timestampOf(toast: Toast): number {
  return toast.timestamp instanceof Date
    ? toast.timestamp.getTime()
    : new Date(toast.timestamp).getTime();
}

/**
 * Creates the toast runtime for one application root. The controller is kept
 * inside ToastSystemProvider rather than as a module singleton so HMR, tests,
 * and multiple mounted roots do not share notification state or handlers.
 */
export function createToastSystem(): ToastSystemController {
  const stores = createToastStores();
  const actionRegister = new ActionRegister<ToastActionMap>({
    name: 'ToastActions',
  });
  const recentToasts = new Map<string, number>();

  actionRegister.register(
    'addToast',
    ({ type, title, message, actionType, payload, duration }) => {
      if (isDuplicateToast(recentToasts, type, message)) {
        logger.debug('🍞 Duplicate toast prevented:', { type, message });
        return;
      }

      const config = stores.config.getValue();
      const currentToasts = stores.toasts.getValue();
      const keptToasts =
        currentToasts.length < config.maxToasts
          ? currentToasts
          : currentToasts.filter(
              (toast) =>
                toast.id !==
                currentToasts.reduce((oldest, candidate) =>
                  timestampOf(candidate) < timestampOf(oldest)
                    ? candidate
                    : oldest
                ).id
            );
      const newToast: Toast = {
        id: generateToastId(),
        type,
        title,
        message,
        ...(actionType === undefined ? {} : { actionType }),
        payload,
        timestamp: new Date(),
        duration: duration ?? config.defaultDuration,
        stackIndex: stores.stackIndex.getValue(),
        isVisible: true,
        phase: 'entering',
      };

      stores.stackIndex.setValue(stores.stackIndex.getValue() + 1);
      stores.toasts.setValue([...keptToasts, newToast]);
      logger.info('addToast', { toastId: newToast.id, type, title });
    }
  );

  actionRegister.register(
    'addActionToast',
    ({
      actionType,
      executionStep,
      payload,
      executionTime,
      resultData,
      errorMessage,
    }) => {
      const message = getExecutionStepMessage(
        actionType,
        executionStep,
        errorMessage
      );
      const duration =
        executionStep === 'error'
          ? 5000
          : executionStep === 'processing'
            ? 2000
            : 3000;
      const finalExecutionTime = executionTime ?? 0;

      void actionRegister.dispatch('addToast', {
        type: 'action',
        title: `${getActionIcon(actionType)} ${actionType}`,
        message: finalExecutionTime
          ? `${message} (${finalExecutionTime}ms)`
          : message,
        actionType,
        payload: {
          executionStep,
          originalPayload: payload,
          resultData,
          errorMessage,
          executionTime: finalExecutionTime,
        },
        duration,
      });
    }
  );

  actionRegister.register('removeToast', ({ toastId }) => {
    stores.toasts.setValue(
      stores.toasts.getValue().filter((toast) => toast.id !== toastId)
    );
  });

  actionRegister.register('updateToastPhase', ({ toastId, phase }) => {
    stores.toasts.setValue(
      stores.toasts
        .getValue()
        .map((toast) =>
          toast.id === toastId &&
          (phase !== 'visible' || toast.phase === 'entering')
            ? { ...toast, phase }
            : toast
        )
    );
  });

  actionRegister.register('clearAllToasts', () => {
    stores.toasts.setValue([]);
    stores.stackIndex.setValue(0);
  });

  actionRegister.register('updateToastConfig', (configUpdate) => {
    stores.config.setValue({ ...stores.config.getValue(), ...configUpdate });
  });

  const dispatch = <K extends Extract<keyof ToastActionMap, string>>(
    action: K,
    payload: ToastActionMap[K]
  ) => {
    // The controller always passes a payload for its closed action map; the
    // ActionRegister dispatch tuple cannot preserve that relationship through
    // ToastActionMap's compatibility index signature.
    void actionRegister.dispatch(action, payload as never);
  };

  return {
    stores,
    showToast: (type, title, message) =>
      dispatch('addToast', { type, title, message }),
    showActionToast: (actionType, executionStep, options = {}) =>
      dispatch('addActionToast', { actionType, executionStep, ...options }),
    removeToast: (toastId) => dispatch('removeToast', { toastId }),
    updateToastPhase: (toastId, phase) =>
      dispatch('updateToastPhase', { toastId, phase }),
    clearAllToasts: () => dispatch('clearAllToasts', {}),
    updateConfig: (configUpdate) => dispatch('updateToastConfig', configUpdate),
  };
}
