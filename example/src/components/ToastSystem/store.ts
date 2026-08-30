import { createStore, type Store } from '@context-action/react';
import type { Toast, ToastConfig } from './types';

export interface ToastStores {
  toasts: Store<Toast[]>;
  config: Store<ToastConfig>;
  stackIndex: Store<number>;
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  position: 'top-right',
  maxToasts: 4,
  defaultDuration: 4000,
  showStackCount: true,
  enableActionLogging: true,
};

/**
 * Create one isolated toast-store set for one mounted ToastSystemProvider.
 * The names are diagnostic labels only; every invocation owns fresh stores.
 */
export function createToastStores(): ToastStores {
  return {
    toasts: createStore<Toast[]>('ToastSystem.toasts', []),
    config: createStore<ToastConfig>(
      'ToastSystem.config',
      DEFAULT_TOAST_CONFIG
    ),
    stackIndex: createStore<number>('ToastSystem.stackIndex', 0),
  };
}
