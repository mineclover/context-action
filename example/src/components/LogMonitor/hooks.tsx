/**
 * @fileoverview LogMonitor 관련 훅들
 * @module LogMonitorHooks
 */

import type { Logger } from '../../utils/logger';
import { createLogger, LogLevel } from '../../utils/logger';
import { ActionRegister } from '@context-action/react';
import { useMemo } from 'react';
import { toastActionRegister } from '../ToastSystem/actions';
import { useLogMonitorContext } from './context';
import type {
  ActionLogOptions,
  InternalLogActionMap,
  StableLoggerAPI,
} from './types';
import { getActionMessage } from './utils';

/**
 * Sanitize payload to remove DOM elements and event objects that cannot be cloned
 */
function sanitizeLogPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) {
    return payload;
  }

  // Handle primitives
  if (typeof payload !== 'object') {
    return payload;
  }

  // Handle DOM elements and event objects
  if (
    payload instanceof Element ||
    payload instanceof Node ||
    payload instanceof Event ||
    (payload as any).nodeType !== undefined ||
    (payload as any).target !== undefined ||
    typeof (payload as any).preventDefault === 'function'
  ) {
    return '[DOM Element/Event Object - Removed for Cloning Safety]';
  }

  // Handle arrays
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizeLogPayload(item));
  }

  // Handle plain objects
  if (payload && typeof payload === 'object') {
    try {
      const sanitized: any = {};
      for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
          const value = (payload as any)[key];
          
          // Skip DOM elements and event objects
          if (
            value instanceof Element ||
            value instanceof Node ||
            value instanceof Event ||
            (value && typeof value === 'object' && value.nodeType !== undefined) ||
            (value && typeof value === 'object' && value.target !== undefined) ||
            (value && typeof value.preventDefault === 'function')
          ) {
            sanitized[key] = '[DOM Element/Event Object - Removed for Cloning Safety]';
          } else {
            sanitized[key] = sanitizeLogPayload(value);
          }
        }
      }
      return sanitized;
    } catch (error) {
      return '[Object - Could not sanitize]';
    }
  }

  return payload;
}

/**
 * Toast 시스템 인터페이스 (의존성 주입용)
 */
export interface ToastSystem {
  showToast: (
    type: 'success' | 'error' | 'info' | 'system',
    title: string,
    message: string
  ) => void;
}

/**
 * ActionLogger 훅 옵션
 */
interface UseActionLoggerOptions {
  toastSystem?: ToastSystem;
  logger?: Logger;
}

/**
 * LogMonitor 기본 훅
 *
 * LogMonitor 컨텍스트의 기본 기능들을 제공합니다.
 */
export function useLogMonitor() {
  return useLogMonitorContext();
}

/**
 * 안정적인 액션 로거 훅
 *
 * 액션 실행을 로깅하고 선택적으로 Toast 알림을 표시하는 기능을 제공합니다.
 * 의존성 주입을 통해 Toast 시스템과의 결합도를 낮춥니다.
 *
 * @param options - 로거 옵션 (Toast 시스템, 커스텀 로거 등)
 * @returns 안정적인 로거 API
 */
export function useActionLogger(
  options: UseActionLoggerOptions = {}
): StableLoggerAPI {
  const { addLog, logLevel, config } = useLogMonitorContext();
  const { toastSystem, logger: customLogger } = options;

  // 로거 인스턴스 생성
  const logger = useMemo(() => {
    return customLogger || createLogger(logLevel);
  }, [customLogger, logLevel]);

  // 내부 ActionRegister 생성 (Toast 시스템 연동)
  const internalActionRegister = useMemo(() => {
    const register = new ActionRegister<InternalLogActionMap>();

    // 액션 로그 핸들러
    register.register(
      '_internal.log.action',
      ({ actionType, payload, options = {} }, controller) => {
        // 자동 계산된 데이터 추출
        const autoCalc =
          options._autoCalculated ||
          ({} as { timestamp?: string; executionTime?: number });
        const timestamp =
          autoCalc.timestamp || new Date().toLocaleTimeString('ko-KR');
        const executionTime = autoCalc.executionTime || 0;

        // 로그 추가 (자동 계산된 타임스탬프 사용)
        addLog({
          level: LogLevel.INFO,
          type: 'action',
          message: `액션 실행: ${actionType}`,
          priority: options.priority,
          details: {
            payload,
            context: options.context,
            executionTime,
            timestamp,
          },
        });

        logger.info(`Action: ${actionType} (${executionTime}ms)`, payload);

        // Toast 표시 (활성화된 경우) - 자동 계산된 데이터 사용
        console.log('🍞 Toast check conditions:', {
          enableToast: config.enableToast,
          hasToastSystem: !!toastSystem,
          toastOption: options.toast,
          shouldShow:
            config.enableToast && toastSystem && options.toast !== false,
        });

        if (config.enableToast && toastSystem && options.toast !== false) {
          const actionMsg = getActionMessage(actionType);
          console.log('🍞 Calling showToast with auto-calculated data:', {
            actionType,
            executionTime,
            timestamp,
          });

          if (typeof options.toast === 'object') {
            toastSystem.showToast(
              options.toast.type || 'info',
              options.toast.title || `⚡ ${actionType}`,
              options.toast.message ||
                `${actionType} 실행 완료 (${executionTime}ms)`
            );
          } else {
            // 자동 계산된 실행시간을 메시지에 포함
            const enhancedMessage = `${actionMsg.message} (${executionTime}ms)`;
            toastSystem.showToast(
              actionMsg.type,
              `⚡ ${actionType}`,
              enhancedMessage
            );
          }
        } else {
          console.log('🍞 Toast not shown due to conditions not met');
        }

        
      }
    );

    // 에러 로그 핸들러
    register.register(
      '_internal.log.error',
      ({ message, error, options = {} }, controller) => {
        addLog({
          level: LogLevel.ERROR,
          type: 'error',
          message,
          details: {
            error:
              error && typeof error === 'object' && 'message' in error
                ? error.message
                : error,
            stack:
              error && typeof error === 'object' && 'stack' in error
                ? error.stack
                : undefined,
            context: options.context,
          },
        });

        logger.error(message, error);

        // 에러 Toast 표시 (활성화된 경우)
        if (config.enableToast && toastSystem && options.toast !== false) {
          if (typeof options.toast === 'object') {
            toastSystem.showToast(
              'error',
              options.toast.title || '오류 발생',
              options.toast.message || message
            );
          } else {
            toastSystem.showToast('error', '오류 발생', message);
          }
        }

        
      }
    );

    // 시스템 로그 핸들러
    register.register(
      '_internal.log.system',
      ({ message, options = {} }, controller) => {
        addLog({
          level: LogLevel.INFO,
          type: 'system',
          message,
          details: options.context,
        });

        logger.info(`System: ${message}`, options.context);

        // 시스템 Toast (명시적 요청시만)
        if (
          config.enableToast &&
          toastSystem &&
          (options.toast === true || typeof options.toast === 'object')
        ) {
          if (typeof options.toast === 'object') {
            toastSystem.showToast(
              options.toast.type || 'system',
              options.toast.title || '시스템',
              options.toast.message || message
            );
          } else {
            toastSystem.showToast('system', '시스템', message);
          }
        }

        
      }
    );

    return register;
  }, [addLog, logger, config.enableToast, toastSystem]);

  // 안정적인 API 생성
  const stableAPI = useMemo(
    (): StableLoggerAPI => ({
      logAction: (
        actionType: string,
        payload?: unknown,
        options: ActionLogOptions = {}
      ) => {
        // Sanitize payload to remove DOM elements and event objects
        const sanitizedPayload = sanitizeLogPayload(payload);
        // 자동 계산: 실행 시작 시간 기록
        const startTime = performance.now();

        // 자동 계산: 타임스탬프 생성
        const timestamp = new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // 액션 실행 완료 후 정확한 실행시간 계산
        const endTime = performance.now();
        const executionTime = Math.max(
          0.1,
          Math.round((endTime - startTime) * 10) / 10
        ); // 0.1ms 최소값, 소수점 1자리

        internalActionRegister.dispatch('_internal.log.action', {
          actionType,
          payload: sanitizedPayload,
          options: {
            ...options,
            // 자동 주입: 실행 시간과 타임스탬프
            _autoCalculated: {
              executionTime,
              timestamp,
              actionType, // 중복 제거를 위한 자동 주입
            },
          },
        });
      },

      logError: (
        message: string,
        error?: Error | unknown,
        options: ActionLogOptions = {}
      ) => {
        internalActionRegister.dispatch('_internal.log.error', {
          message,
          error: sanitizeLogPayload(error),
          options,
        });
      },

      logSystem: (message: string, options: ActionLogOptions = {}) => {
        internalActionRegister.dispatch('_internal.log.system', {
          message,
          options,
        });
      },
    }),
    [internalActionRegister]
  );

  return stableAPI;
}

/**
 * Toast 시스템이 통합된 액션 로거 훅
 *
 * 기본 Toast 시스템과 통합된 로거를 제공합니다.
 * Toast 시스템이 있는 환경에서 사용합니다.
 */
export function useActionLoggerWithToast(): StableLoggerAPI {
  // Toast 시스템 직접 사용 (정적 import)
  const toastSystem = useMemo((): ToastSystem | undefined => {
    try {
      if (toastActionRegister) {
        console.log('🍞 Toast system available and created');

        return {
          showToast: (
            type: 'success' | 'error' | 'info' | 'system',
            title: string,
            message: string
          ) => {
            console.log('🍞 showToast called with:', { type, title, message });
            try {
              toastActionRegister.dispatch('addToast', {
                type,
                title,
                message,
              });
              console.log('🍞 Toast dispatch successful');
            } catch (error) {
              console.error('🍞 Toast dispatch failed:', error);
            }
          },
        };
      }

      console.log('🍞 Toast system not available');
      return undefined;
    } catch (error) {
      console.error('🍞 Toast system loading failed:', error);
      return undefined;
    }
  }, []);
  return useActionLogger({ toastSystem });
}

/**
 * 커스텀 Toast 시스템과 함께 사용하는 액션 로거 훅
 *
 * @param toastSystem - 커스텀 Toast 시스템 구현
 * @returns 로거 API
 */
export function useActionLoggerWithCustomToast(
  toastSystem: ToastSystem
): StableLoggerAPI {
  return useActionLogger({ toastSystem });
}

/**
 * Toast 없이 사용하는 순수 액션 로거 훅
 *
 * @param logger - 선택적 커스텀 로거
 * @returns 로거 API
 */
export function usePureActionLogger(logger?: Logger): StableLoggerAPI {
  return useActionLogger({ logger });
}
