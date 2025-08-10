export interface Toast {
  id: string;
  type: 'action' | 'system' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  actionType?: string;
  payload?: unknown;
  timestamp: Date;
  duration: number; // milliseconds
  stackIndex: number; // for stacking order
  isVisible: boolean;
  phase: 'entering' | 'visible' | 'exiting' | 'hidden';
}

export interface ToastAction {
  type:
    | 'ADD_TOAST'
    | 'REMOVE_TOAST'
    | 'UPDATE_TOAST_PHASE'
    | 'CLEAR_ALL_TOASTS';
  payload?: unknown;
}

export interface ActionExecutionToast extends Omit<Toast, 'type'> {
  type: 'action';
  actionType: string;
  executionStep: 'start' | 'processing' | 'success' | 'error';
  executionTime?: number;
  resultData?: unknown;
  errorMessage?: string;
}

// Action payload type guard and interface
export interface ActionToastPayload {
  executionStep?: 'start' | 'processing' | 'success' | 'error';
  executionTime?: number;
  resultData?: unknown;
  errorMessage?: string;
}

export function isActionToastPayload(
  payload: unknown
): payload is ActionToastPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.executionStep === 'undefined' ||
    ['start', 'processing', 'success', 'error'].includes(
      p.executionStep as string
    )
  );
}

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastConfig {
  position: ToastPosition;
  maxToasts: number;
  defaultDuration: number;
  showStackCount: boolean;
  enableActionLogging: boolean;
}
