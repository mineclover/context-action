import { ActionRegister, createLogger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { toastsStore, toastConfigStore, toastStackIndexStore } from './store';
import type { Toast, ActionExecutionToast, ToastConfig } from './types';

// 토스트 액션 페이로드 맵
interface ToastActionMap {
  addToast: {
    type: Toast['type'];
    title: string;
    message: string;
    actionType?: string;
    payload?: any;
    duration?: number;
  };
  addActionToast: {
    actionType: string;
    executionStep: ActionExecutionToast['executionStep'];
    payload?: any;
    executionTime?: number;
    resultData?: any;
    errorMessage?: string;
  };
  removeToast: {
    toastId: string;
  };
  updateToastPhase: {
    toastId: string;
    phase: Toast['phase'];
  };
  clearAllToasts: {};
  updateToastConfig: Partial<ToastConfig>;
  [key: string]: any; // Index signature for ActionPayloadMap constraint
}

// 로거 및 액션 레지스터 설정
const logger = createLogger(LogLevel.DEBUG);
export const toastActionRegister = new ActionRegister<ToastActionMap>({ logger });

// 전역 객체에 toastActionRegister 등록 (LogMonitor hooks에서 접근 가능하도록)
if (typeof window !== 'undefined') {
  (window as any).toastActionRegister = toastActionRegister;
}

// 유틸리티 함수: 토스트 ID 생성
const generateToastId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 유틸리티 함수: 액션 타입별 아이콘
const getActionIcon = (actionType: string): string => {
  const iconMap: Record<string, string> = {
    // User Profile Actions
    updateProfile: '👤',
    toggleTheme: '🎨',
    resetProfile: '🔄',
    
    // Shopping Cart Actions
    addToCart: '🛒',
    removeFromCart: '🗑️',
    updateQuantity: '📊',
    clearCart: '🧹',
    
    // Todo Actions
    addTodo: '✅',
    toggleTodo: '☑️',
    deleteTodo: '🗑️',
    updateTodoPriority: '🎯',
    
    // Chat Actions
    sendMessage: '💬',
    deleteMessage: '🗑️',
    clearChat: '🧹',
    switchUser: '👥',
    
    // System Actions
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

// 유틸리티 함수: 실행 단계별 색상
const getExecutionStepColor = (step: ActionExecutionToast['executionStep']): string => {
  switch (step) {
    case 'start': return '#3b82f6'; // blue
    case 'processing': return '#f59e0b'; // amber
    case 'success': return '#10b981'; // emerald
    case 'error': return '#ef4444'; // red
    default: return '#6b7280'; // gray
  }
};

// 유틸리티 함수: 실행 단계별 메시지
const getExecutionStepMessage = (
  actionType: string, 
  step: ActionExecutionToast['executionStep'],
  payload?: any,
  errorMessage?: string
): string => {
  const actionNames: Record<string, string> = {
    updateProfile: '프로필 업데이트',
    toggleTheme: '테마 변경',
    addToCart: '장바구니 추가',
    addTodo: '할일 추가',
    sendMessage: '메시지 전송',
    // ... 더 많은 액션들
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
    default:
      return `${actionName}`;
  }
};

// 액션 핸들러들
toastActionRegister.register('addToast', ({ type, title, message, actionType, payload, duration }) => {
  logger.debug('🍞 addToast handler called:', { type, title, message });
  
  const config = toastConfigStore.getValue();
  const currentToasts = toastsStore.getValue();
  const currentStackIndex = toastStackIndexStore.getValue();
  
  logger.debug('🍞 Current toast state:', { 
    currentToastsCount: currentToasts.length, 
    maxToasts: config.maxToasts,
    stackIndex: currentStackIndex 
  });
  
  // 최대 토스트 수 체크
  if (currentToasts.length >= config.maxToasts) {
    // 가장 오래된 토스트 제거 (timestamp가 Date 객체가 아닐 수 있으므로 안전하게 처리)
    const oldestToast = currentToasts.reduce((oldest, toast) => {
      const oldestTime = oldest.timestamp instanceof Date ? oldest.timestamp.getTime() : new Date(oldest.timestamp).getTime();
      const currentTime = toast.timestamp instanceof Date ? toast.timestamp.getTime() : new Date(toast.timestamp).getTime();
      return currentTime < oldestTime ? toast : oldest;
    });
    toastActionRegister.dispatch('removeToast', { toastId: oldestToast.id });
  }
  
  const newToast: Toast = {
    id: generateToastId(),
    type,
    title,
    message,
    actionType,
    payload,
    timestamp: new Date(),
    duration: duration || config.defaultDuration,
    stackIndex: currentStackIndex,
    isVisible: true,
    phase: 'entering',
  };
  
  // 스택 인덱스 증가
  toastStackIndexStore.setValue(currentStackIndex + 1);
  
  // 토스트 추가
  logger.debug('🍞 Adding new toast to store:', newToast);
  toastsStore.setValue([...currentToasts, newToast]);
  logger.debug('🍞 Store updated, new length:', toastsStore.getValue().length);
  
  // 애니메이션 단계 관리
  setTimeout(() => {
    logger.debug('🍞 Updating toast to visible phase:', newToast.id);
    toastActionRegister.dispatch('updateToastPhase', { 
      toastId: newToast.id, 
      phase: 'visible' 
    });
  }, 100);
  
  // 자동 제거 타이머
  setTimeout(() => {
    logger.debug('🍞 Starting toast exit phase:', newToast.id);
    toastActionRegister.dispatch('updateToastPhase', { 
      toastId: newToast.id, 
      phase: 'exiting' 
    });
    
    setTimeout(() => {
      logger.debug('🍞 Removing toast:', newToast.id);
      toastActionRegister.dispatch('removeToast', { toastId: newToast.id });
    }, 300); // 애니메이션 완료 후 제거
  }, newToast.duration);
  
  logger.debug('🍞 Toast auto-remove timer set for:', newToast.duration);
  
  logger.info('addToast', { toastId: newToast.id, type, title });
});

toastActionRegister.register('addActionToast', ({ 
  actionType, 
  executionStep, 
  payload, 
  executionTime, 
  resultData, 
  errorMessage 
}) => {
  const icon = getActionIcon(actionType);
  const message = getExecutionStepMessage(actionType, executionStep, payload, errorMessage);
  const title = `${icon} ${actionType}`;
  
  let duration = 3000; // 기본 3초
  if (executionStep === 'error') duration = 5000; // 에러는 5초
  if (executionStep === 'processing') duration = 2000; // 처리 중은 2초
  
  // 자동 계산된 실행시간이 있으면 사용, 없으면 전달받은 값 사용
  const finalExecutionTime = executionTime || 0;
  
  toastActionRegister.dispatch('addToast', {
    type: 'action',
    title,
    message: finalExecutionTime ? `${message} (${finalExecutionTime}ms)` : message,
    actionType,
    payload: { 
      executionStep, 
      originalPayload: payload, 
      resultData, 
      errorMessage,
      executionTime: finalExecutionTime // 자동 계산된 실행시간 사용
    },
    duration,
  });
});

toastActionRegister.register('removeToast', ({ toastId }) => {
  const currentToasts = toastsStore.getValue();
  const updatedToasts = currentToasts.filter(toast => toast.id !== toastId);
  toastsStore.setValue(updatedToasts);
  
  logger.info('removeToast', { toastId });
});

toastActionRegister.register('updateToastPhase', ({ toastId, phase }) => {
  const currentToasts = toastsStore.getValue();
  const updatedToasts = currentToasts.map(toast => 
    toast.id === toastId ? { ...toast, phase } : toast
  );
  toastsStore.setValue(updatedToasts);
});

toastActionRegister.register('clearAllToasts', () => {
  toastsStore.setValue([]);
  toastStackIndexStore.setValue(0);
  
  logger.info('clearAllToasts', { clearedCount: toastsStore.getValue().length });
});

toastActionRegister.register('updateToastConfig', (configUpdate) => {
  const currentConfig = toastConfigStore.getValue();
  const newConfig = { ...currentConfig, ...configUpdate };
  toastConfigStore.setValue(newConfig);
  
  logger.info('updateToastConfig', configUpdate);
});