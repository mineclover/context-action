/**
 * @fileoverview API Blocking Demo Page - Unified Implementation
 * 통합된 API 블로킹 데모 페이지
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStorePattern,
  useStoreValue,
} from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor';
import { toastActionRegister } from '../../components/ToastSystem/actions';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
  Input,
} from '../../components/ui';

// ================================
// 📊 Types & Store Definition
// ================================

export interface ApiCallRecord {
  id: string;
  endpoint: string;
  timestamp: number;
  status: 'success' | 'blocked' | 'error';
  responseTime?: number;
}

export interface ApiBlockingStateData {
  apiCalls: ApiCallRecord[];
  blockedAction: string | null;
  isBlocked: boolean;
  blockEndTime: number | null;
  blockDuration: number;
  successCount: number;
  blockedCount: number;
  lastCallTime: number | null;
}

export interface ApiBlockingActions extends ActionPayloadMap {
  apiCall: {
    endpoint: string;
    method?: string;
    timestamp: number;
  };
  apiCallSuccess: {
    callId: string;
    endpoint: string;
    responseTime: number;
    timestamp: number;
  };
  apiCallBlocked: {
    endpoint: string;
    reason: string;
    timestamp: number;
  };
  startBlocking: {
    action: string;
    duration: number;
    timestamp: number;
  };
  endBlocking: {
    action: string;
    timestamp: number;
  };
  setBlockDuration: {
    duration: number;
  };
  clearHistory: void;
}

// Store & Action Context 생성
const ApiBlockingStores = createDeclarativeStorePattern(
  'ApiBlockingStoreManager',
  {
    blockingState: {
      initialValue: {
        apiCalls: [] as ApiCallRecord[],
        blockedAction: null as string | null,
        isBlocked: false,
        blockEndTime: null as number | null,
        blockDuration: 2000,
        successCount: 0,
        blockedCount: 0,
        lastCallTime: null as number | null,
      },
      description: 'API blocking state management',
      strategy: 'shallow',
    },
  }
);

const ApiBlockingActionContext = createActionContext<ApiBlockingActions>({
  name: 'ApiBlockingActions',
});

// ================================
// 🎯 Business Logic Hook
// ================================

function useApiBlockingLogic() {
  const dispatch = ApiBlockingActionContext.useActionDispatch();
  const register = ApiBlockingActionContext.useActionRegister();
  const blockingStore = ApiBlockingStores.useStore('blockingState');
  const blockingState = useStoreValue(blockingStore);
  const { logAction, logSystem } = useActionLoggerWithToast();
  const blockingTimeoutRef = useRef<NodeJS.Timeout>();

  const isCurrentlyBlocked = useCallback(() => {
    const currentState = blockingStore.getValue();
    if (!currentState.isBlocked || !currentState.blockEndTime) {
      return false;
    }
    return Date.now() < currentState.blockEndTime;
  }, [blockingStore]);

  const startBlocking = useCallback(
    (action: string, duration: number) => {
      dispatch('startBlocking', {
        action,
        duration,
        timestamp: Date.now(),
      });

      if (blockingTimeoutRef.current) {
        clearTimeout(blockingTimeoutRef.current);
      }

      blockingTimeoutRef.current = setTimeout(() => {
        dispatch('endBlocking', {
          action,
          timestamp: Date.now(),
        });
      }, duration);
    },
    [dispatch]
  );

  const simulateApiCall = useCallback(
    async (
      endpoint: string
    ): Promise<{ success: boolean; responseTime: number }> => {
      return new Promise((resolve) => {
        const responseTime = Math.random() * 600 + 200;
        setTimeout(() => {
          resolve({
            success: Math.random() > 0.1,
            responseTime: Math.round(responseTime),
          });
        }, responseTime);
      });
    },
    []
  );

  // Action Handlers
  useEffect(() => {
    if (!register) return;

    const unregisterApiCall = register.register(
      'apiCall',
      async ({ endpoint, timestamp }, controller) => {
        logAction('apiCall', { endpoint, timestamp });

        if (isCurrentlyBlocked()) {
          dispatch('apiCallBlocked', {
            endpoint,
            reason: 'Rate limiting active',
            timestamp,
          });
          return;
        }

        startBlocking('apiCall', blockingState.blockDuration);

        try {
          const result = await simulateApiCall(endpoint);
          if (result.success) {
            const callId = `call-${timestamp}`;
            dispatch('apiCallSuccess', {
              callId,
              endpoint,
              responseTime: result.responseTime,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          logSystem(`API call failed: ${error}`);
        }
      }
    );

    const unregisterSuccess = register.register(
      'apiCallSuccess',
      ({ callId, endpoint, responseTime, timestamp }, controller) => {
        logAction('apiCallSuccess', {
          callId,
          endpoint,
          responseTime,
          timestamp,
        });

        const newRecord: ApiCallRecord = {
          id: callId,
          endpoint,
          timestamp,
          status: 'success',
          responseTime,
        };

        blockingStore.update((state) => ({
          ...state,
          apiCalls: [newRecord, ...state.apiCalls].slice(0, 20),
          successCount: state.successCount + 1,
          lastCallTime: timestamp,
        }));

        logSystem(`🍞 Dispatching success toast for: ${endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'success',
          title: '🌐 API 호출',
          message: `${endpoint} 호출 성공! (${responseTime}ms)`,
        });
      }
    );

    const unregisterBlocked = register.register(
      'apiCallBlocked',
      ({ endpoint, reason, timestamp }, controller) => {
        logAction('apiCallBlocked', { endpoint, reason, timestamp });

        const newRecord: ApiCallRecord = {
          id: `blocked-${timestamp}`,
          endpoint,
          timestamp,
          status: 'blocked',
        };

        blockingStore.update((state) => ({
          ...state,
          apiCalls: [newRecord, ...state.apiCalls].slice(0, 20),
          blockedCount: state.blockedCount + 1,
          lastCallTime: timestamp,
        }));

        logSystem(`🍞 Dispatching error toast for: ${endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'error',
          title: '🚫 API 차단',
          message: `${endpoint} 호출이 차단되었습니다 (${reason})`,
        });
      }
    );

    const unregisterStartBlock = register.register(
      'startBlocking',
      ({ action, duration, timestamp }, controller) => {
        logAction('startBlocking', { action, duration, timestamp });

        blockingStore.update((state) => ({
          ...state,
          isBlocked: true,
          blockedAction: action,
          blockEndTime: timestamp + duration,
          blockDuration: duration,
        }));
      }
    );

    const unregisterEndBlock = register.register(
      'endBlocking',
      ({ action, timestamp }, controller) => {
        logAction('endBlocking', { action, timestamp });

        blockingStore.update((state) => ({
          ...state,
          isBlocked: false,
          blockedAction: null,
          blockEndTime: null,
        }));
      }
    );

    const unregisterSetDuration = register.register(
      'setBlockDuration',
      ({ duration }, controller) => {
        logAction('setBlockDuration', { duration });

        blockingStore.update((state) => ({
          ...state,
          blockDuration: duration,
        }));
      }
    );

    const unregisterClear = register.register(
      'clearHistory',
      (_, controller) => {
        logAction('clearHistory', {});

        blockingStore.update((state) => ({
          ...state,
          apiCalls: [] as ApiCallRecord[],
          successCount: 0,
          blockedCount: 0,
          lastCallTime: null as number | null,
        }));
      }
    );

    return () => {
      unregisterApiCall();
      unregisterSuccess();
      unregisterBlocked();
      unregisterStartBlock();
      unregisterEndBlock();
      unregisterSetDuration();
      unregisterClear();

      if (blockingTimeoutRef.current) {
        clearTimeout(blockingTimeoutRef.current);
      }
    };
  }, [
    register,
    blockingStore,
    dispatch,
    startBlocking,
    simulateApiCall,
    isCurrentlyBlocked,
    blockingState.blockDuration,
    logAction,
    logSystem,
  ]);

  const remainingBlockTime = blockingState.blockEndTime
    ? Math.max(0, blockingState.blockEndTime - Date.now())
    : 0;

  return {
    blockingState,
    remainingBlockTime,
    makeApiCall: (endpoint: string) => {
      dispatch('apiCall', {
        endpoint,
        timestamp: Date.now(),
      });
    },
    setBlockDuration: (duration: number) => {
      dispatch('setBlockDuration', { duration });
    },
    clearHistory: () => {
      dispatch('clearHistory');
    },
    isBlocked: isCurrentlyBlocked(),
    hasHistory: blockingState.apiCalls.length > 0,
    successRate:
      blockingState.successCount + blockingState.blockedCount > 0
        ? (blockingState.successCount /
            (blockingState.successCount + blockingState.blockedCount)) *
          100
        : 0,
  };
}

// ================================
// 🎨 View Component
// ================================

function ApiBlockingView() {
  const {
    blockingState,
    remainingBlockTime,
    makeApiCall,
    setBlockDuration,
    clearHistory,
    isBlocked,
    hasHistory,
    successRate,
  } = useApiBlockingLogic();

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value) || 1000;
    setBlockDuration(duration);
  };

  return (
    <div className="space-y-6">
      {/* 메인 API 블로킹 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚫 API Call Blocking Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo prevents duplicate API calls using a blocking mechanism.
            After an API call, all subsequent calls are blocked for a
            configurable duration (default: <strong>2 seconds</strong>). This
            prevents accidental double-clicks and reduces server load.
          </p>
        </div>

        <div className="space-y-4">
          {/* 블로킹 설정 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-700">
              Block Duration:
            </label>
            <Input
              type="number"
              value={blockingState.blockDuration}
              onChange={handleDurationChange}
              min={500}
              max={10000}
              step={500}
              className="w-24"
            />
            <span className="text-sm text-gray-600">ms</span>
          </div>

          {/* API 호출 버튼들 */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => makeApiCall('/api/users')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/users
              </Button>
              <Button
                onClick={() => makeApiCall('/api/posts')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/posts
              </Button>
              <Button
                onClick={() => makeApiCall('/api/comments')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/comments
              </Button>
              <Button
                onClick={() => makeApiCall('/api/profile')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/profile
              </Button>
              <Button
                onClick={() => makeApiCall('/api/settings')}
                disabled={isBlocked}
                variant="primary"
                size="sm"
              >
                GET /api/settings
              </Button>
            </div>

            {/* 블로킹 상태 표시 */}
            {isBlocked && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    🚫 API calls blocked for{' '}
                    {Math.ceil(remainingBlockTime / 1000)}s
                  </span>
                  <div className="text-xs text-yellow-600">
                    Action: {blockingState.blockedAction}
                  </div>
                </div>
                <div className="mt-2 bg-yellow-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(remainingBlockTime / blockingState.blockDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {blockingState.successCount}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {blockingState.blockedCount}
              </div>
              <div className="text-xs text-gray-600">Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {blockingState.apiCalls.length}
              </div>
              <div className="text-xs text-gray-600">Total Calls</div>
            </div>
          </div>

          {/* 히스토리 */}
          {hasHistory && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Recent API Calls:</h4>
                <Button onClick={clearHistory} variant="secondary" size="sm">
                  Clear History
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {blockingState.apiCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3 rounded-lg border text-sm ${
                      call.status === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : call.status === 'blocked'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-mono font-medium">
                          {call.endpoint}
                        </span>
                        {call.responseTime && (
                          <span className="ml-2 text-xs opacity-75">
                            ({call.responseTime}ms)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full font-medium ${
                            call.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : call.status === 'blocked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {call.status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!hasHistory && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              Click any API button above to start making calls. The first call
              will succeed, then subsequent calls will be blocked for the
              configured duration.
            </div>
          )}
        </div>
      </DemoCard>

      {/* 개념 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Blocking Pattern
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">What is Action Blocking?</strong>
            <br />
            Blocking prevents the same action from executing again for a
            specified duration. This is different from debouncing or throttling
            - it completely blocks subsequent executions until the blocking
            period expires.
          </p>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Prevents duplicate API calls from user impatience</li>
            <li>Reduces server load and prevents rate limiting</li>
            <li>Improves data consistency</li>
            <li>Better user experience with clear feedback</li>
            <li>Prevents accidental double-submissions</li>
          </ul>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Blocking Implementation">
        <CodeBlock>
          {`// API 블로킹 Hook 사용 예제
function useApiBlockingLogic() {
  const dispatch = useActionDispatch();
  const blockingStore = useStore('blockingState');
  const blockingState = useStoreValue(blockingStore);

  const makeApiCall = (endpoint: string) => {
    dispatch('apiCall', {
      endpoint,
      timestamp: Date.now(),
    });
  };

  // 블로킹 로직은 Action Handler에서 처리
  useActionHandler('apiCall', async ({ endpoint, timestamp }) => {
    if (isCurrentlyBlocked()) {
      // 블로킹된 호출
      dispatch('apiCallBlocked', {
        endpoint,
        reason: 'Rate limiting active',
        timestamp,
      });
      return;
    }

    // 블로킹 시작
    startBlocking('apiCall', blockDuration);
    
    // API 호출 실행
    const result = await simulateApiCall(endpoint);
    
    if (result.success) {
      dispatch('apiCallSuccess', {
        callId: \`call-\${timestamp}\`,
        endpoint,
        responseTime: result.responseTime,
        timestamp: Date.now(),
      });
    }
  });

  return { blockingState, makeApiCall };
}`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
}

// ================================
// 🏛️ Provider Component
// ================================

const ApiBlockingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ApiBlockingStores.Provider registryId="api-blocking-demo">
      <ApiBlockingActionContext.Provider>
        {children}
      </ApiBlockingActionContext.Provider>
    </ApiBlockingStores.Provider>
  );
};

// ================================
// 📄 Main Page Component
// ================================

export function ApiBlockingPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-api-blocking"
      title="API Blocking Demo"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <ApiBlockingProvider>
        <div className="page-container">
          <ApiBlockingView />
        </div>
      </ApiBlockingProvider>
    </PageWithLogMonitor>
  );
}

export default ApiBlockingPage;