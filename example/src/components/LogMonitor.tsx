import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createLogger, Logger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logLevel, setLogLevel] = useState<LogLevel>(initialLogLevel);
  const [logger] = useState(() => {
    const pageLogger = createLogger(initialLogLevel);
    
    // 로거 메서드 래핑하여 자동으로 로그 엔트리 추가
    const originalMethods = {
      trace: pageLogger.trace.bind(pageLogger),
      debug: pageLogger.debug.bind(pageLogger),
      info: pageLogger.info.bind(pageLogger),
      warn: pageLogger.warn.bind(pageLogger),
      error: pageLogger.error.bind(pageLogger)
    };

    return pageLogger;
  });

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const logEntry: LogEntry = {
      ...entry,
      id: `${pageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setLogs(prev => [...prev.slice(-49), logEntry]); // 최대 50개 로그 유지
  }, [pageId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 로그 레벨 변경 시 로거 업데이트
  useEffect(() => {
    logger.setLevel?.(logLevel);
  }, [logger, logLevel]);

  // 페이지 초기화 로그
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

// 액션 로그 헬퍼 훅
export function useActionLogger() {
  const { addLog, logger } = useLogMonitor();

  const logAction = useCallback((
    actionType: string, 
    payload?: any, 
    priority?: number,
    additionalDetails?: any
  ) => {
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: `Action dispatched: ${actionType}`,
      priority,
      details: { payload, ...additionalDetails }
    });
    
    logger.info(`Action: ${actionType}`, payload);
  }, [addLog, logger]);

  const logError = useCallback((
    message: string, 
    error?: Error | any,
    context?: any
  ) => {
    addLog({
      level: LogLevel.ERROR,
      type: 'error',
      message,
      details: { error: error?.message || error, stack: error?.stack, context }
    });
    
    logger.error(message, error);
  }, [addLog, logger]);

  const logSystem = useCallback((
    message: string, 
    details?: any
  ) => {
    addLog({
      level: LogLevel.INFO,
      type: 'system',
      message,
      details
    });
    
    logger.info(`System: ${message}`, details);
  }, [addLog, logger]);

  const logMiddleware = useCallback((
    message: string, 
    priority?: number,
    details?: any
  ) => {
    addLog({
      level: LogLevel.DEBUG,
      type: 'middleware',
      message,
      priority,
      details
    });
    
    logger.debug(`Middleware: ${message}`, details);
  }, [addLog, logger]);

  return {
    logAction,
    logError,
    logSystem,
    logMiddleware,
    logger
  };
}

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