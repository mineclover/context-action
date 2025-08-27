/**
 * Store Error Management Example
 * 
 * Store 레벨에서의 에러 상태 관리 및 복구 패턴을 보여주는 예제:
 * - 에러 상태를 위한 전용 Store 구조
 * - 자동 에러 복구 메커니즘
 * - 에러 카테고리 분류 및 처리
 * - DevTools와 연동된 에러 트래킹
 */

import React, { useCallback, useEffect } from 'react';
import {
  createStoreContext,
  createActionContext,
  useStoreValue,
  createErrorHandler,
  ErrorCategory,
  setupDevTools
} from '@context-action/react';

// DevTools 초기화
if (process.env.NODE_ENV === 'development') {
  setupDevTools({
    enabled: true,
    enablePerformanceMonitoring: true,
    autoConnectStores: true
  });
}

// 에러 상태 인터페이스
interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  timestamp: Date;
  context?: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Store 스키마 정의
interface AppStores {
  user: {
    data: User | null;
    loading: boolean;
    lastUpdated: Date | null;
  };
  errors: {
    current: AppError | null;
    history: AppError[];
    isRecovering: boolean;
  };
  ui: {
    showErrorToast: boolean;
    notifications: Array<{
      id: string;
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      timestamp: Date;
    }>;
  };
}

// Store Context 생성
const {
  Provider: StoreProvider,
  useStore
} = createStoreContext('ErrorDemo', {
  user: {
    data: null,
    loading: false,
    lastUpdated: null
  },
  errors: {
    current: null,
    history: [],
    isRecovering: false
  },
  ui: {
    showErrorToast: false,
    notifications: []
  }
} as AppStores);

// Actions 인터페이스
interface AppActions {
  loadUser: { userId: number; shouldFail?: boolean };
  retryLastAction: void;
  clearError: { errorId: string };
  clearAllErrors: void;
  addNotification: { message: string; type: 'success' | 'error' | 'warning' | 'info' };
  dismissNotification: { notificationId: string };
}

// Action Context 생성
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionHandler
} = createActionContext<AppActions>('ErrorDemoActions');

// 에러 처리 로직 컴포넌트
function ErrorManagementLogic({ children }: { children: React.ReactNode }) {
  const userStore = useStore('user');
  const errorsStore = useStore('errors');
  const uiStore = useStore('ui');
  
  // 통합 에러 핸들러 생성
  const errorHandler = createErrorHandler({
    onError: async (error, context) => {
      const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const appError: AppError = {
        id: errorId,
        message: error.message,
        category: context?.category || ErrorCategory.UNKNOWN,
        timestamp: new Date(),
        context: context?.context,
        retryable: context?.category === ErrorCategory.NETWORK || context?.category === ErrorCategory.ASYNC,
        retryCount: 0,
        maxRetries: 3
      };

      // 에러 스토어 업데이트
      errorsStore.update(state => ({
        ...state,
        current: appError,
        history: [appError, ...state.history.slice(0, 49)] // 최대 50개 히스토리 유지
      }));

      // UI 알림 추가
      uiStore.update(state => ({
        ...state,
        showErrorToast: true,
        notifications: [
          {
            id: errorId,
            message: error.message,
            type: 'error' as const,
            timestamp: new Date()
          },
          ...state.notifications.slice(0, 9) // 최대 10개 알림 유지
        ]
      }));

      // 5초 후 토스트 자동 숨김
      setTimeout(() => {
        uiStore.update(state => ({ ...state, showErrorToast: false }));
      }, 5000);
    }
  });

  // 사용자 데이터 로드 액션
  useActionHandler('loadUser', useCallback(async (payload) => {
    const { userId, shouldFail = false } = payload;
    
    // 로딩 상태 시작
    userStore.update(state => ({ ...state, loading: true }));
    
    // 기존 에러 클리어
    errorsStore.update(state => ({ ...state, current: null }));

    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (shouldFail) {
        throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다. 네트워크 연결을 확인해주세요.`);
      }

      // 성공 데이터
      const userData: User = {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`
      };

      userStore.update(state => ({
        ...state,
        data: userData,
        loading: false,
        lastUpdated: new Date()
      }));

      // 성공 알림
      uiStore.update(state => ({
        ...state,
        notifications: [
          {
            id: `success-${Date.now()}`,
            message: '사용자 데이터를 성공적으로 로드했습니다!',
            type: 'success' as const,
            timestamp: new Date()
          },
          ...state.notifications.slice(0, 9)
        ]
      }));

    } catch (error) {
      userStore.update(state => ({ ...state, loading: false }));
      
      await errorHandler.handleError(error as Error, {
        context: 'load-user',
        category: ErrorCategory.NETWORK
      });
    }
  }, [userStore, errorsStore, uiStore, errorHandler]));

  // 재시도 액션
  useActionHandler('retryLastAction', useCallback(async () => {
    const currentError = errorsStore.getValue().current;
    if (!currentError || !currentError.retryable) {
      return;
    }

    if (currentError.retryCount >= currentError.maxRetries) {
      await errorHandler.handleError(new Error('최대 재시도 횟수를 초과했습니다.'), {
        context: 'retry-exceeded',
        category: ErrorCategory.VALIDATION
      });
      return;
    }

    // 복구 상태 설정
    errorsStore.update(state => ({
      ...state,
      isRecovering: true,
      current: currentError ? {
        ...currentError,
        retryCount: currentError.retryCount + 1
      } : null
    }));

    try {
      // 마지막 액션 재시도 (여기서는 사용자 데이터 로드 재시도)
      const lastUserId = userStore.getValue().data?.id || 1;
      
      // 재시도 시 성공률 높임
      const shouldFail = Math.random() > 0.7; // 30% 실패 확률
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (shouldFail) {
        throw new Error('재시도했지만 여전히 네트워크 오류가 발생했습니다.');
      }

      // 재시도 성공
      const userData: User = {
        id: lastUserId,
        name: `User ${lastUserId}`,
        email: `user${lastUserId}@example.com`
      };

      userStore.update(state => ({
        ...state,
        data: userData,
        lastUpdated: new Date()
      }));

      // 에러 상태 클리어
      errorsStore.update(state => ({
        ...state,
        current: null,
        isRecovering: false
      }));

      // 성공 알림
      uiStore.update(state => ({
        ...state,
        notifications: [
          {
            id: `retry-success-${Date.now()}`,
            message: '재시도가 성공했습니다!',
            type: 'success' as const,
            timestamp: new Date()
          },
          ...state.notifications.slice(0, 9)
        ]
      }));

    } catch (error) {
      errorsStore.update(state => ({ ...state, isRecovering: false }));
      await errorHandler.handleError(error as Error, {
        context: 'retry-failed',
        category: ErrorCategory.NETWORK
      });
    }
  }, [errorsStore, userStore, uiStore, errorHandler]));

  // 에러 클리어 액션
  useActionHandler('clearError', useCallback(async (payload) => {
    errorsStore.update(state => ({
      ...state,
      current: state.current?.id === payload.errorId ? null : state.current,
      history: state.history.filter(error => error.id !== payload.errorId)
    }));
  }, [errorsStore]));

  // 모든 에러 클리어 액션
  useActionHandler('clearAllErrors', useCallback(async () => {
    errorsStore.setValue({
      current: null,
      history: [],
      isRecovering: false
    });
  }, [errorsStore]));

  // 알림 추가 액션
  useActionHandler('addNotification', useCallback(async (payload) => {
    const notification = {
      id: `notification-${Date.now()}`,
      ...payload,
      timestamp: new Date()
    };

    uiStore.update(state => ({
      ...state,
      notifications: [notification, ...state.notifications.slice(0, 9)]
    }));
  }, [uiStore]));

  // 알림 제거 액션
  useActionHandler('dismissNotification', useCallback(async (payload) => {
    uiStore.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== payload.notificationId)
    }));
  }, [uiStore]));

  return <>{children}</>;
}

// 사용자 정보 컴포넌트
function UserInfo() {
  const userStore = useStore('user');
  const user = useStoreValue(userStore);
  const dispatch = useActionDispatch();

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 사용자 정보</h3>
      
      {user.loading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>사용자 데이터 로딩 중...</span>
        </div>
      )}
      
      {user.data ? (
        <div className="space-y-2">
          <p><span className="font-medium">ID:</span> {user.data.id}</p>
          <p><span className="font-medium">이름:</span> {user.data.name}</p>
          <p><span className="font-medium">이메일:</span> {user.data.email}</p>
          <p className="text-sm text-gray-500">
            마지막 업데이트: {user.lastUpdated?.toLocaleTimeString() || 'N/A'}
          </p>
        </div>
      ) : !user.loading && (
        <p className="text-gray-500">사용자 데이터가 없습니다.</p>
      )}
      
      <div className="mt-4 space-x-2">
        <button
          onClick={() => dispatch('loadUser', { userId: 1, shouldFail: false })}
          disabled={user.loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          ✅ 성공 케이스 로드
        </button>
        <button
          onClick={() => dispatch('loadUser', { userId: 2, shouldFail: true })}
          disabled={user.loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          ❌ 실패 케이스 로드
        </button>
      </div>
    </div>
  );
}

// 에러 상태 컴포넌트
function ErrorStatus() {
  const errorsStore = useStore('errors');
  const errors = useStoreValue(errorsStore);
  const dispatch = useActionDispatch();

  if (!errors.current && errors.history.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ 에러 없음</h3>
        <p className="text-green-700">현재 활성 에러가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현재 에러 */}
      {errors.current && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                🚨 현재 에러
                {errors.isRecovering && <span className="ml-2 text-sm">(복구 중...)</span>}
              </h3>
              <p className="text-red-700 mb-2">{errors.current.message}</p>
              <div className="text-sm text-red-600 space-y-1">
                <p>카테고리: {errors.current.category}</p>
                <p>시간: {errors.current.timestamp.toLocaleString()}</p>
                <p>재시도: {errors.current.retryCount}/{errors.current.maxRetries}</p>
                {errors.current.context && <p>컨텍스트: {errors.current.context}</p>}
              </div>
            </div>
            <div className="flex flex-col space-y-2 ml-4">
              {errors.current.retryable && !errors.isRecovering && (
                <button
                  onClick={() => dispatch('retryLastAction')}
                  disabled={errors.current.retryCount >= errors.current.maxRetries}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  🔄 재시도
                </button>
              )}
              <button
                onClick={() => dispatch('clearError', { errorId: errors.current!.id })}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ❌ 무시
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 히스토리 */}
      {errors.history.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              📋 에러 히스토리 ({errors.history.length})
            </h3>
            {errors.history.length > 0 && (
              <button
                onClick={() => dispatch('clearAllErrors')}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                전체 클리어
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.history.slice(0, 10).map((error) => (
              <div key={error.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{error.message}</p>
                  <p className="text-xs text-gray-500">
                    {error.timestamp.toLocaleTimeString()} | {error.category}
                  </p>
                </div>
                <button
                  onClick={() => dispatch('clearError', { errorId: error.id })}
                  className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 알림 시스템 컴포넌트
function NotificationSystem() {
  const uiStore = useStore('ui');
  const ui = useStoreValue(uiStore);
  const dispatch = useActionDispatch();

  if (ui.notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {ui.notifications.slice(0, 5).map((notification) => {
        const bgColor = {
          success: 'bg-green-500',
          error: 'bg-red-500',
          warning: 'bg-yellow-500',
          info: 'bg-blue-500'
        }[notification.type];

        return (
          <div
            key={notification.id}
            className={`${bgColor} text-white p-3 rounded-lg shadow-lg max-w-sm animate-slide-in`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm flex-1">{notification.message}</p>
              <button
                onClick={() => dispatch('dismissNotification', { notificationId: notification.id })}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StoreErrorManagementPage() {
  return (
    <StoreProvider>
      <ActionProvider>
        <ErrorManagementLogic>
          <div className="p-6 max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🏪 Store Error Management
              </h1>
              <p className="text-lg text-gray-600">
                Store 레벨에서의 에러 상태 관리 및 복구 패턴을 실습해보세요.
                에러 상태 추적, 자동 재시도, 사용자 알림 시스템을 체험할 수 있습니다.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <UserInfo />
              <ErrorStatus />
            </div>

            {/* 통계 및 DevTools 안내 */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                📊 모니터링 포인트
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Redux DevTools에서 ERROR, RETRY, CLEAR 액션 추적</li>
                <li>• Store 상태 변화와 에러 복구 패턴 관찰</li>
                <li>• 에러 카테고리별 분류 및 처리 방식 확인</li>
                <li>• 알림 시스템과 Store 상태 동기화 패턴</li>
              </ul>
            </div>

            <NotificationSystem />
          </div>
        </ErrorManagementLogic>
      </ActionProvider>
    </StoreProvider>
  );
}

// CSS 애니메이션 (인라인으로 추가하거나 별도 CSS 파일로 분리 가능)
const styles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
`;

// 스타일 태그 주입 (개발용)
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}