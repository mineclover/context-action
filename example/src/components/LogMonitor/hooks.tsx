/**
 * @fileoverview LogMonitor 관련 훅들
 * @module LogMonitorHooks
 */

import { useMemo, useCallback } from 'react';
import { createLogger, ActionRegister } from '@context-action/react';
import type { Logger } from '@context-action/logger';
import { LogLevel } from '@context-action/logger';

import type { 
  StableLoggerAPI, 
  ActionLogOptions, 
  InternalLogActionMap, 
  ToastOptions 
} from './types';
import { useLogMonitorContext } from './context';
import { getActionMessage } from './utils';

/**
 * Toast 시스템 인터페이스 (의존성 주입용)
 */
export interface ToastSystem {
  showToast: (type: 'success' | 'error' | 'info' | 'system', title: string, message: string) => void;
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
export function useActionLogger(options: UseActionLoggerOptions = {}): StableLoggerAPI {
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
    register.register('_internal.log.action', ({ actionType, payload, options = {} }, controller) => {
      // 로그 추가
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: `액션 실행: ${actionType}`,
        priority: options.priority,
        details: { payload, context: options.context }
      });
      
      logger.info(`Action: ${actionType}`, payload);

      // Toast 표시 (활성화된 경우)
      if (config.enableToast && toastSystem && options.toast !== false) {
        const actionMsg = getActionMessage(actionType);
        
        if (typeof options.toast === 'object') {
          toastSystem.showToast(
            options.toast.type || 'info',
            options.toast.title || actionType,
            options.toast.message || `${actionType} 액션이 실행되었습니다`
          );
        } else {
          toastSystem.showToast(actionMsg.type, actionMsg.title, actionMsg.message);
        }
      }

      controller.next();
    });
    
    // 에러 로그 핸들러
    register.register('_internal.log.error', ({ message, error, options = {} }, controller) => {
      addLog({
        level: LogLevel.ERROR,
        type: 'error',
        message,
        details: { error: error?.message || error, stack: error?.stack, context: options.context }
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

      controller.next();
    });
    
    // 시스템 로그 핸들러
    register.register('_internal.log.system', ({ message, options = {} }, controller) => {
      addLog({
        level: LogLevel.INFO,
        type: 'system',
        message,
        details: options.context
      });
      
      logger.info(`System: ${message}`, options.context);

      // 시스템 Toast (명시적 요청시만)
      if (config.enableToast && toastSystem && (options.toast === true || typeof options.toast === 'object')) {
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

      controller.next();
    });
    
    return register;
  }, [addLog, logger, config.enableToast, toastSystem]);

  // 안정적인 API 생성
  const stableAPI = useMemo((): StableLoggerAPI => ({
    logAction: (actionType: string, payload?: any, options: ActionLogOptions = {}) => {
      internalActionRegister.dispatch('_internal.log.action', { actionType, payload, options });
    },

    logError: (message: string, error?: Error | any, options: ActionLogOptions = {}) => {
      internalActionRegister.dispatch('_internal.log.error', { message, error, options });
    },

    logSystem: (message: string, options: ActionLogOptions = {}) => {
      internalActionRegister.dispatch('_internal.log.system', { message, options });
    },
  }), [internalActionRegister]);

  return stableAPI;
}

/**
 * Toast 시스템이 통합된 액션 로거 훅
 * 
 * 기본 Toast 시스템과 통합된 로거를 제공합니다.
 * Toast 시스템이 있는 환경에서 사용합니다.
 */
export function useActionLoggerWithToast(): StableLoggerAPI {
  // 동적으로 Toast 시스템 로드 시도
  const toastSystem = useMemo((): ToastSystem | undefined => {
    try {
      // Toast 시스템이 전역으로 등록되어 있는지 확인
      const { toastActionRegister } = require('../ToastSystem/actions');
      
      return {
        showToast: (type: 'success' | 'error' | 'info' | 'system', title: string, message: string) => {
          toastActionRegister.dispatch('addToast', {
            type,
            title,
            message,
          });
        }
      };
    } catch (error) {
      // Toast 시스템이 없는 경우 undefined 반환
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
export function useActionLoggerWithCustomToast(toastSystem: ToastSystem): StableLoggerAPI {
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