import { createStore } from '@context-action/react';
import type { Toast, ToastConfig } from './types';

// 토스트 목록 스토어
export const toastsStore = createStore<Toast[]>('toasts', []);

// 토스트 설정 스토어
export const toastConfigStore = createStore<ToastConfig>('toastConfig', {
  position: 'top-right',
  maxToasts: 4, // 화면 공간을 고려하여 4개로 제한
  defaultDuration: 4000,
  showStackCount: true,
  enableActionLogging: true,
});

// 다음 스택 인덱스를 관리하는 스토어
export const toastStackIndexStore = createStore<number>('toastStackIndex', 0);
