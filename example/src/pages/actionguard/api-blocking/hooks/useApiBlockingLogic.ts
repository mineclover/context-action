/**
 * @fileoverview API Blocking Logic Hook - Hook Layer
 *
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useRef } from 'react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import { toastActionRegister } from '../../../../components/ToastSystem/actions';
import {
  type ApiCallRecord,
  useApiBlockingActionDispatch,
  useApiBlockingActionRegister,
  useApiBlockingStore,
} from '../context/ApiBlockingContext';

/**
 * API 블로킹 로직 Hook
 *
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useApiBlockingLogic() {
  const dispatch = useApiBlockingActionDispatch();
  const register = useApiBlockingActionRegister();
  const blockingStore = useApiBlockingStore('blockingState');
  const blockingState = useStoreValue(blockingStore);
  const { logAction, logSystem } = useActionLoggerWithToast();
  const blockingTimeoutRef = useRef<NodeJS.Timeout>();

  // 블로킹 상태 체크 함수
  const isCurrentlyBlocked = useCallback(() => {
    const currentState = blockingStore.getValue();
    if (!currentState.isBlocked || !currentState.blockEndTime) {
      return false;
    }
    return Date.now() < currentState.blockEndTime;
  }, [blockingStore]);

  // 블로킹 시작 함수
  const startBlocking = useCallback(
    (action: string, duration: number) => {
      dispatch('startBlocking', {
        action,
        duration,
        timestamp: Date.now(),
      });

      // 지정된 시간 후 블로킹 해제
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

  // 모의 API 호출 함수
  const simulateApiCall = useCallback(
    async (
      endpoint: string
    ): Promise<{ success: boolean; responseTime: number }> => {
      return new Promise((resolve) => {
        // 200-800ms 사이의 랜덤 응답 시간
        const responseTime = Math.random() * 600 + 200;

        setTimeout(() => {
          resolve({
            success: Math.random() > 0.1, // 90% 성공률
            responseTime: Math.round(responseTime),
          });
        }, responseTime);
      });
    },
    []
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // API 호출 핸들러
    const unregisterApiCall = register.register(
      'apiCall',
      async ({ endpoint, timestamp }, controller) => {
        logAction('apiCall', { endpoint, timestamp });

        // 블로킹 상태 체크
        if (isCurrentlyBlocked()) {
          // 블로킹된 호출
          dispatch('apiCallBlocked', {
            endpoint,
            reason: 'Rate limiting active',
            timestamp,
          });

          controller.next();
          return;
        }

        // 블로킹 시작
        startBlocking('apiCall', blockingState.blockDuration);

        try {
          // 모의 API 호출
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

        controller.next();
      }
    );

    // API 호출 성공 핸들러
    const unregisterSuccess = register.register(
      'apiCallSuccess',
      ({ callId, endpoint, responseTime, timestamp }, controller) => {
        logAction('apiCallSuccess', {
          callId,
          endpoint,
          responseTime,
          timestamp,
        });

        // 기록 추가
        const newRecord: ApiCallRecord = {
          id: callId,
          endpoint,
          timestamp,
          status: 'success',
          responseTime,
        };

        blockingStore.update((state) => ({
          ...state,
          apiCalls: [newRecord, ...state.apiCalls].slice(0, 20), // 최근 20개만 유지
          successCount: state.successCount + 1,
          lastCallTime: timestamp,
        }));

        // Toast 표시
        logSystem(`🍞 Dispatching success toast for: ${endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'success',
          title: '🌐 API 호출',
          message: `${endpoint} 호출 성공! (${responseTime}ms)`,
        });

        controller.next();
      }
    );

    // API 호출 블로킹 핸들러
    const unregisterBlocked = register.register(
      'apiCallBlocked',
      ({ endpoint, reason, timestamp }, controller) => {
        logAction('apiCallBlocked', { endpoint, reason, timestamp });

        // 기록 추가
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

        // Toast 표시
        logSystem(`🍞 Dispatching error toast for: ${endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'error',
          title: '🚫 API 차단',
          message: `${endpoint} 호출이 차단되었습니다 (${reason})`,
        });

        controller.next();
      }
    );

    // 블로킹 시작 핸들러
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

        controller.next();
      }
    );

    // 블로킹 종료 핸들러
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

        controller.next();
      }
    );

    // 블로킹 지속시간 설정 핸들러
    const unregisterSetDuration = register.register(
      'setBlockDuration',
      ({ duration }, controller) => {
        logAction('setBlockDuration', { duration });

        blockingStore.update((state) => ({
          ...state,
          blockDuration: duration,
        }));

        controller.next();
      }
    );

    // 기록 초기화 핸들러
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

        controller.next();
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

  // 남은 블로킹 시간 계산
  const remainingBlockTime = blockingState.blockEndTime
    ? Math.max(0, blockingState.blockEndTime - Date.now())
    : 0;

  // View에 제공할 인터페이스
  return {
    // Data
    blockingState,
    remainingBlockTime,

    // Actions
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

    // Computed
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
