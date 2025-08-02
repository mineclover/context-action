export interface Toast {
  id: string;
  type: 'action' | 'system' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  actionType?: string;
  payload?: any;
  timestamp: Date;
  duration: number; // milliseconds
  stackIndex: number; // for stacking order
  isVisible: boolean;
  phase: 'entering' | 'visible' | 'exiting' | 'hidden';
}

export interface ToastAction {
  type: 'ADD_TOAST' | 'REMOVE_TOAST' | 'UPDATE_TOAST_PHASE' | 'CLEAR_ALL_TOASTS';
  payload?: any;
}

export interface ActionExecutionToast extends Omit<Toast, 'type'> {
  type: 'action';
  actionType: string;
  executionStep: 'start' | 'processing' | 'success' | 'error';
  executionTime?: number;
  resultData?: any;
  errorMessage?: string;
}

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastConfig {
  position: ToastPosition;
  maxToasts: number;
  defaultDuration: number;
  showStackCount: boolean;
  enableActionLogging: boolean;
}