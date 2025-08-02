import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { createLogger, Logger, createStore, useStoreValue, Store } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { useActionToast } from './ToastSystem/useActionToast';

// 로그 엔트리 타입
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  type: 'action' | 'system' | 'error' | 'middleware';
  message: string;
  details?: any;
  priority?: number;
}

// 로그 모니터 스토어 타입
interface LogMonitorStores {
  logs: Store<LogEntry[]>;
  logLevel: Store<LogLevel>;
}

// 스토어 레지스트리 - 페이지별로 독립적인 스토어 관리
class LogMonitorStoreRegistry {
  private static instance: LogMonitorStoreRegistry;
  private storeMap = new Map<string, LogMonitorStores>();

  static getInstance(): LogMonitorStoreRegistry {
    if (!LogMonitorStoreRegistry.instance) {
      LogMonitorStoreRegistry.instance = new LogMonitorStoreRegistry();
    }
    return LogMonitorStoreRegistry.instance;
  }

  getStores(pageId: string, initialLogLevel: LogLevel): LogMonitorStores {
    if (!this.storeMap.has(pageId)) {
      const stores: LogMonitorStores = {
        logs: createStore(`logs-${pageId}`, [] as LogEntry[]),
        logLevel: createStore(`logLevel-${pageId}`, initialLogLevel)
      };
      this.storeMap.set(pageId, stores);
    }
    return this.storeMap.get(pageId)!;
  }

  clearStores(pageId: string): void {
    this.storeMap.delete(pageId);
  }

  getAllPageIds(): string[] {
    return Array.from(this.storeMap.keys());
  }
}

// 로그 컨텍스트 타입
interface LogMonitorContextType {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  logger: Logger;
  logLevel: LogLevel;
  setLogLevel: (level: LogLevel) => void;
}

// 로그 컨텍스트 생성
const LogMonitorContext = createContext<LogMonitorContextType | null>(null);

// 로그 컨텍스트 훅
export function useLogMonitor() {
  const context = useContext(LogMonitorContext);
  if (!context) {
    throw new Error('useLogMonitor must be used within a LogMonitorProvider');
  }
  return context;
}

// 로그 모니터 프로바이더
export function LogMonitorProvider({ 
  children, 
  pageId,
  initialLogLevel = LogLevel.DEBUG 
}: { 
  children: React.ReactNode;
  pageId: string;
  initialLogLevel?: LogLevel;
}) {
  // 스토어 레지스트리에서 페이지별 스토어 가져오기
  const stores = useMemo(() => {
    const registry = LogMonitorStoreRegistry.getInstance();
    return registry.getStores(pageId, initialLogLevel);
  }, [pageId, initialLogLevel]);

  // 스토어 값들을 구독
  const logs = useStoreValue(stores.logs) ?? [];
  const logLevel = useStoreValue(stores.logLevel) ?? initialLogLevel;

  // 로거 인스턴스 생성 (안정적인 참조)
  const logger = useMemo(() => {
    const pageLogger = createLogger(initialLogLevel);
    return pageLogger;
  }, [initialLogLevel]);

  // 안정적인 addLog 함수 - 스토어 업데이트 사용
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const logEntry: LogEntry = {
      ...entry,
      id: `${pageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // 스토어 업데이트 - 최대 50개 로그 유지
    stores.logs.update(prev => [...prev.slice(-49), logEntry]);
  }, [pageId, stores.logs]);

  // 안정적인 clearLogs 함수
  const clearLogs = useCallback(() => {
    stores.logs.setValue([]);
  }, [stores.logs]);

  // 안정적인 setLogLevel 함수
  const setLogLevel = useCallback((level: LogLevel) => {
    stores.logLevel.setValue(level);
  }, [stores.logLevel]);

  // 로그 레벨 변경 시 로거 업데이트
  useEffect(() => {
    logger.setLevel?.(logLevel);
  }, [logger, logLevel]);

  // 페이지 초기화 및 정리 로그
  useEffect(() => {
    addLog({
      level: LogLevel.INFO,
      type: 'system',
      message: `Page initialized: ${pageId}`,
      details: { pageId, initialLogLevel }
    });

    return () => {
      addLog({
        level: LogLevel.INFO,
        type: 'system',
        message: `Page cleanup: ${pageId}`
      });
      
      // 페이지 언마운트 시 스토어 정리 (선택적)
      // LogMonitorStoreRegistry.getInstance().clearStores(pageId);
    };
  }, [pageId, addLog, initialLogLevel]);

  const contextValue: LogMonitorContextType = {
    logs,
    addLog,
    clearLogs,
    logger,
    logLevel,
    setLogLevel
  };

  return (
    <LogMonitorContext.Provider value={contextValue}>
      {children}
    </LogMonitorContext.Provider>
  );
}

// 로그 모니터 컴포넌트
export function LogMonitor({ 
  title = "Log Monitor",
  maxHeight = "300px",
  showControls = true,
  className = ""
}: {
  title?: string;
  maxHeight?: string;
  showControls?: boolean;
  className?: string;
}) {
  const { logs, clearLogs, logLevel, setLogLevel } = useLogMonitor();

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.TRACE: return '#9ca3af';
      case LogLevel.DEBUG: return '#3b82f6';
      case LogLevel.INFO: return '#10b981';
      case LogLevel.WARN: return '#f59e0b';
      case LogLevel.ERROR: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'action': return '#2563eb';
      case 'system': return '#059669';
      case 'middleware': return '#7c3aed';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getLevelName = (level: LogLevel) => {
    switch (level) {
      case LogLevel.TRACE: return 'TRACE';
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className={`demo-card logger-card ${className}`}>
      <div className="card-header">
        <h3>{title}</h3>
        {showControls && (
          <div className="button-group">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(Number(e.target.value))}
              className="select-input"
            >
              <option value={LogLevel.TRACE}>TRACE</option>
              <option value={LogLevel.DEBUG}>DEBUG</option>
              <option value={LogLevel.INFO}>INFO</option>
              <option value={LogLevel.WARN}>WARN</option>
              <option value={LogLevel.ERROR}>ERROR</option>
            </select>
            <button onClick={clearLogs} className="btn btn-small btn-secondary">
              Clear
            </button>
          </div>
        )}
      </div>
      
      <div className="log-container" style={{ maxHeight }}>
        {logs.length === 0 ? (
          <div className="log-empty">No logs recorded yet...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry log-${log.type}`}>
              <span className="log-time">{log.timestamp}</span>
              <span 
                className="log-level" 
                style={{ color: getLogLevelColor(log.level) }}
              >
                {getLevelName(log.level)}
              </span>
              <span 
                className="log-type" 
                style={{ color: getLogTypeColor(log.type) }}
              >
                {log.type.toUpperCase()}
              </span>
              {log.priority !== undefined && (
                <span className="log-priority">{log.priority}</span>
              )}
              <span className="log-message">{log.message}</span>
              {log.details && (
                <details className="log-details">
                  <summary>Details</summary>
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="log-stats">
        <div className="stat-item">
          <span className="stat-label">Total Logs:</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Current Level:</span>
          <span className="stat-value">{getLevelName(logLevel)}</span>
        </div>
      </div>
    </div>
  );
}

// 간소화된 로거 옵션
interface ActionLogOptions {
  toast?: boolean | {
    type?: 'success' | 'error' | 'info' | 'system';
    title?: string;
    message?: string;
  };
  priority?: number;
  context?: any;
}

// 액션명 → 한국어 메시지 매핑 (컴포넌트 외부로 이동)
const actionMessages: Record<string, { title: string; message: string; type: 'success' | 'error' | 'info' | 'system' }> = {
    // Store 시나리오 액션들
    updateUser: { title: '프로필 저장', message: '사용자 프로필이 업데이트되었습니다', type: 'success' },
    updateUserTheme: { title: '테마 변경', message: '테마가 변경되었습니다', type: 'success' },
    updateUserLanguage: { title: '언어 변경', message: '언어가 변경되었습니다', type: 'success' },
    toggleNotifications: { title: '알림 설정', message: '알림 설정이 변경되었습니다', type: 'success' },
    addToCart: { title: '장바구니 추가', message: '상품이 장바구니에 추가되었습니다', type: 'success' },
    removeFromCart: { title: '장바구니 제거', message: '상품이 장바구니에서 제거되었습니다', type: 'info' },
    updateCartQuantity: { title: '수량 변경', message: '상품 수량이 변경되었습니다', type: 'success' },
    clearCart: { title: '장바구니 비우기', message: '장바구니가 비워졌습니다', type: 'info' },
    addTodo: { title: '할일 추가', message: '새로운 할일이 추가되었습니다', type: 'success' },
    toggleTodo: { title: '할일 상태 변경', message: '할일 상태가 변경되었습니다', type: 'success' },
    deleteTodo: { title: '할일 삭제', message: '할일이 삭제되었습니다', type: 'info' },
    updateTodoPriority: { title: '우선순위 변경', message: '할일 우선순위가 변경되었습니다', type: 'success' },
    sendChatMessage: { title: '메시지 전송', message: '메시지가 전송되었습니다', type: 'success' },
    deleteChatMessage: { title: '메시지 삭제', message: '메시지가 삭제되었습니다', type: 'info' },
    clearChat: { title: '채팅 초기화', message: '채팅이 초기화되었습니다', type: 'info' },
    
    // React Provider 액션들
    updateCounter: { title: '카운터 변경', message: '카운터 값이 변경되었습니다', type: 'success' },
    resetCounter: { title: '카운터 리셋', message: '카운터가 초기화되었습니다', type: 'info' },
    updateMessage: { title: '메시지 변경', message: '메시지가 업데이트되었습니다', type: 'success' },
    resetMessage: { title: '메시지 리셋', message: '메시지가 초기화되었습니다', type: 'info' },
    
    // Core Basic 액션들
    increment: { title: '증가', message: '값이 증가되었습니다', type: 'success' },
    decrement: { title: '감소', message: '값이 감소되었습니다', type: 'success' },
    reset: { title: '리셋', message: '값이 초기화되었습니다', type: 'info' },
    updateValue: { title: '값 변경', message: '값이 업데이트되었습니다', type: 'success' },
    
    // Core Advanced 액션들
    multiply: { title: '곱하기', message: '값이 곱해졌습니다', type: 'success' },
    divide: { title: '나누기', message: '값이 나누어졌습니다', type: 'success' },
    priorityTest: { title: '우선순위 테스트', message: '우선순위 테스트가 실행되었습니다', type: 'info' },
    
    // Store Basic 액션들
    updateUserName: { title: '이름 변경', message: '사용자 이름이 변경되었습니다', type: 'success' },
    updateUserEmail: { title: '이메일 변경', message: '사용자 이메일이 변경되었습니다', type: 'success' },
    
    // React Hooks 액션들
    updateList: { title: '리스트 업데이트', message: '리스트가 업데이트되었습니다', type: 'success' },
    heavyCalculation: { title: '연산 실행', message: '무거운 연산이 실행되었습니다', type: 'info' },
    conditionalHandler: { title: '조건부 핸들러', message: '조건부 핸들러가 실행되었습니다', type: 'info' },
    dynamicHandler: { title: '동적 핸들러', message: '동적 핸들러가 실행되었습니다', type: 'info' },
    memoryIntensive: { title: '메모리 집약 작업', message: '메모리 집약적인 작업이 실행되었습니다', type: 'info' },
    rerenderTrigger: { title: '리렌더 트리거', message: '리렌더가 트리거되었습니다', type: 'info' },
    
    // 컨텍스트 액션들
    globalMessage: { title: '전역 메시지', message: '전역 메시지가 전송되었습니다', type: 'success' },
    broadcastEvent: { title: '이벤트 브로드캐스트', message: '이벤트가 브로드캐스트되었습니다', type: 'info' },
    localAction: { title: '로컬 액션', message: '로컬 액션이 실행되었습니다', type: 'success' },
    nestedUpdate: { title: '중첩 업데이트', message: '중첩된 업데이트가 실행되었습니다', type: 'success' }
};

// 통합 액션 로거 훅 (토스트 자동 주입)
export function useActionLogger() {
  const { addLog, logger } = useLogMonitor();
  const toast = useActionToast();

  const logAction = useCallback((
    actionType: string,
    payload?: any,
    options: ActionLogOptions = {}
  ) => {
    // 로그 기록
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: `Action dispatched: ${actionType}`,
      priority: options.priority,
      details: { payload, context: options.context }
    });
    
    logger.info(`Action: ${actionType}`, payload);

    // 토스트 자동 주입
    if (options.toast !== false) {
      const actionMsg = actionMessages[actionType];
      
      if (typeof options.toast === 'object') {
        // 커스텀 토스트 설정
        toast.showToast(
          options.toast.type || 'info',
          options.toast.title || actionType,
          options.toast.message || `${actionType} 액션이 실행되었습니다`
        );
      } else if (actionMsg) {
        // 자동 매핑된 토스트
        toast.showToast(actionMsg.type, actionMsg.title, actionMsg.message);
      } else {
        // 기본 토스트
        toast.showToast('success', actionType, `${actionType} 액션이 실행되었습니다`);
      }
    }
  }, [addLog, logger, toast]);

  const logError = useCallback((
    message: string,
    error?: Error | any,
    options: ActionLogOptions = {}
  ) => {
    addLog({
      level: LogLevel.ERROR,
      type: 'error',
      message,
      details: { error: error?.message || error, stack: error?.stack, context: options.context }
    });
    
    logger.error(message, error);

    // 에러 토스트 자동 표시
    if (options.toast !== false) {
      if (typeof options.toast === 'object') {
        toast.showToast(
          'error',
          options.toast.title || '오류 발생',
          options.toast.message || message
        );
      } else {
        toast.showToast('error', '오류 발생', message);
      }
    }
  }, [addLog, logger, toast]);

  const logSystem = useCallback((
    message: string,
    options: ActionLogOptions = {}
  ) => {
    addLog({
      level: LogLevel.INFO,
      type: 'system',
      message,
      details: options.context
    });
    
    logger.info(`System: ${message}`, options.context);

    // 시스템 토스트 (기본적으로 비활성화, 명시적 요청시만)
    if (options.toast === true || typeof options.toast === 'object') {
      if (typeof options.toast === 'object') {
        toast.showToast(
          options.toast.type || 'system',
          options.toast.title || '시스템',
          options.toast.message || message
        );
      } else {
        toast.showToast('system', '시스템', message);
      }
    }
  }, [addLog, logger, toast]);

  return {
    logAction,
    logError,
    logSystem,
    logger
  };
}

// 간소화된 로거 별칭 (하위 호환성)
export const useActionLoggerWithToast = useActionLogger;

// 페이지 래퍼 컴포넌트 (선택적 사용)
export function PageWithLogMonitor({ 
  children, 
  pageId, 
  title,
  logMonitorProps = {}
}: {
  children: React.ReactNode;
  pageId: string;
  title?: string;
  logMonitorProps?: Partial<Parameters<typeof LogMonitor>[0]>;
}) {
  return (
    <LogMonitorProvider pageId={pageId}>
      <div className="page-with-log-monitor">
        {children}
        <LogMonitor 
          title={title ? `${title} - Log Monitor` : undefined}
          {...logMonitorProps}
        />
      </div>
    </LogMonitorProvider>
  );
}