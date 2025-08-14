import {
  ConsoleLogger,
  createLogger,
  getLogLevelFromEnv,
  type Logger,
  LogLevel,
} from '../../utils/logger';
import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
  useLogMonitor,
} from '../../components/LogMonitor/';

// 액션 타입 정의
interface LoggerActionMap extends ActionPayloadMap {
  performAction: { type: string; data: any };
  throwError: { message: string };
  asyncAction: { delay: number };
  batchLog: { count: number };
}

// 커스텀 로거 구현 예제 (LogMonitor 통합)
class MemoryLogger implements Logger {
  private logs: Array<{ level: string; message: string; timestamp: Date }> = [];

  constructor(
    private level: LogLevel,
    private onLog?: (log: any) => void,
    private logMonitorAPI?: any // LogMonitor API 추가
  ) {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }
  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private writeLog(level: string, message: string, ...args: any[]) {
    const log = {
      level,
      message: `${message} ${args.join(' ')}`,
      timestamp: new Date(),
    };
    this.logs.push(log);
    this.onLog?.(log);

    // LogMonitor에도 로그 전송
    if (this.logMonitorAPI) {
      const levelMap = {
        TRACE: LogLevel.TRACE,
        DEBUG: LogLevel.DEBUG,
        INFO: LogLevel.INFO,
        WARN: LogLevel.WARN,
        ERROR: LogLevel.ERROR,
      };

      this.logMonitorAPI.addLog({
        level: levelMap[level as keyof typeof levelMap] || LogLevel.INFO,
        type: 'memory-logger',
        message: `[Memory Logger] ${message}`,
        details: { args, timestamp: log.timestamp.toLocaleTimeString() },
      });
    }
  }

  trace(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.writeLog('TRACE', message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog('DEBUG', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog('INFO', message, ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.LOG)) {
      this.writeLog('LOG', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog('WARN', message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog('ERROR', message, ...args);
    }
  }

  critical(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.CRITICAL)) {
      this.writeLog('CRITICAL', message, ...args);
    }
  }

  group(label: string): void {
    console.group(`[Memory Logger] ${label}`);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

// 로그 레벨 선택 컴포넌트
function LogLevelSelector({
  level,
  onChange,
}: {
  level: LogLevel;
  onChange: (level: LogLevel) => void;
}) {
  return (
    <div className="log-level-selector">
      <label>Log Level:</label>
      <select
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        className="select-input"
      >
        <option value={LogLevel.TRACE}>TRACE (0)</option>
        <option value={LogLevel.DEBUG}>DEBUG (1)</option>
        <option value={LogLevel.INFO}>INFO (2)</option>
        <option value={LogLevel.LOG}>LOG (3)</option>
        <option value={LogLevel.WARN}>WARN (4)</option>
        <option value={LogLevel.ERROR}>ERROR (5)</option>
        <option value={LogLevel.CRITICAL}>CRITICAL (6)</option>
        <option value={LogLevel.NONE}>NONE (7)</option>
      </select>
    </div>
  );
}

// ConsoleLogger 데모 (LogMonitor 통합)
function ConsoleLoggerDemo() {
  const [logLevel, setLogLevel] = useState(LogLevel.DEBUG);
  const [logger, setLogger] = useState(() => new ConsoleLogger(logLevel));
  const [actionRegister] = useState(
    () => new ActionRegister<LoggerActionMap>({ name: 'LoggerDemo' })
  );
  const actionLogger = useActionLoggerWithToast();
  const _logMonitor = useLogMonitor();

  useEffect(() => {
    // 로그 레벨 변경 시 새 로거 생성
    setLogger(new ConsoleLogger(logLevel));
    (actionRegister as any).logger = new ConsoleLogger(logLevel);
  }, [logLevel, actionRegister]);

  useEffect(() => {
    // 액션 핸들러 등록 (LogMonitor와 통합)
    const unsubscribe1 = actionRegister.register(
      'performAction',
      ({ type, data }, controller) => {
        logger.info(`Performing action: ${type}`, data);
        // LogMonitor에 액션 로그 추가
        actionLogger.logAction(
          'performAction',
          { type, data },
          {
            context: 'ConsoleLogger Demo',
            toast: { type: 'info', message: `액션 ${type} 실행됨` },
          }
        );
        
      }
    );

    const unsubscribe2 = actionRegister.register(
      'throwError',
      ({ message }, controller) => {
        logger.error('Error occurred:', message);
        // LogMonitor에 에러 로그 추가
        actionLogger.logError(
          `ConsoleLogger Error: ${message}`,
          new Error(message),
          {
            context: 'ConsoleLogger Demo',
            toast: true,
          }
        );
        throw new Error(message);
      }
    );

    const unsubscribe3 = actionRegister.register(
      'asyncAction',
      async ({ delay }, controller) => {
        logger.debug(`Starting async action with ${delay}ms delay`);
        actionLogger.logSystem(`비동기 액션 시작 (${delay}ms 지연)`, {
          context: 'ConsoleLogger Demo',
        });

        await new Promise((resolve) => setTimeout(resolve, delay));

        logger.debug('Async action completed');
        actionLogger.logAction(
          'asyncAction',
          { delay },
          {
            context: 'ConsoleLogger Demo',
            toast: {
              type: 'success',
              message: `비동기 액션 완료 (${delay}ms)`,
            },
          }
        );
        
      }
    );

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [actionRegister, logger, actionLogger]);

  const testActions = useCallback(() => {
    logger.trace('Testing trace level');
    logger.debug('Testing debug level');
    logger.info('Testing info level');
    logger.warn('Testing warn level');
    logger.error('Testing error level');

    // LogMonitor에도 로그 레벨 테스트 기록
    actionLogger.logSystem('모든 로그 레벨 테스트 완료', {
      context: 'ConsoleLogger Demo',
      toast: { type: 'info', message: '로그 레벨 테스트 완료' },
    });
  }, [logger, actionLogger]);

  const dispatchAction = useCallback(() => {
    actionRegister.dispatch('performAction', {
      type: 'TEST',
      data: { value: 42 },
    });
  }, [actionRegister]);

  const dispatchAsync = useCallback(() => {
    actionRegister.dispatch('asyncAction', { delay: 1000 });
  }, [actionRegister]);

  const dispatchError = useCallback(() => {
    try {
      actionRegister.dispatch('throwError', { message: 'Test error message' });
    } catch (_e) {
      // Error is logged automatically
    }
  }, [actionRegister]);

  return (
    <div className="demo-card">
      <h3>Console Logger Demo</h3>
      <p>Check your browser console for log output</p>

      <LogLevelSelector level={logLevel} onChange={setLogLevel} />

      <div className="button-group">
        <button onClick={testActions} className="btn btn-primary">
          Test All Levels
        </button>
        <button onClick={dispatchAction} className="btn btn-secondary">
          Dispatch Action
        </button>
        <button onClick={dispatchAsync} className="btn btn-secondary">
          Async Action
        </button>
        <button onClick={dispatchError} className="btn btn-danger">
          Trigger Error
        </button>
      </div>
    </div>
  );
}

// Memory Logger 데모 (LogMonitor 통합)
function MemoryLoggerDemo() {
  const [logLevel, setLogLevel] = useState(LogLevel.DEBUG);
  const [logs, setLogs] = useState<
    Array<{ level: string; message: string; timestamp: Date }>
  >([]);
  const actionLogger = useActionLoggerWithToast();
  const logMonitor = useLogMonitor();

  const [memoryLogger] = useState(
    () =>
      new MemoryLogger(
        logLevel,
        (log) => {
          setLogs((prev) => [...prev, log]);
        },
        logMonitor
      )
  ); // LogMonitor API 전달

  const [actionRegister] = useState(
    () => new ActionRegister<LoggerActionMap>({ name: 'MemoryLoggerDemo' })
  );

  useEffect(() => {
    // 로그 레벨 변경 시 처리
    (memoryLogger as any).level = logLevel;
  }, [logLevel, memoryLogger]);

  useEffect(() => {
    // 액션 핸들러 등록 (LogMonitor와 통합)
    const unsubscribe = actionRegister.register(
      'batchLog',
      ({ count }, controller) => {
        for (let i = 0; i < count; i++) {
          memoryLogger.info(`Batch log entry ${i + 1} of ${count}`);
        }

        // LogMonitor에 배치 로그 완료 기록
        actionLogger.logAction(
          'batchLog',
          { count },
          {
            context: 'MemoryLogger Demo',
            toast: { type: 'success', message: `${count}개 배치 로그 완료` },
          }
        );

        
      }
    );

    return () => unsubscribe();
  }, [actionRegister, memoryLogger, actionLogger]);

  const testLogger = useCallback(() => {
    memoryLogger.trace('Memory logger trace');
    memoryLogger.debug('Memory logger debug');
    memoryLogger.info('Memory logger info');
    memoryLogger.warn('Memory logger warning');
    memoryLogger.error('Memory logger error');

    // LogMonitor에 테스트 완료 기록
    actionLogger.logSystem('Memory Logger 레벨 테스트 완료', {
      context: 'MemoryLogger Demo',
      toast: { type: 'info', message: 'Memory Logger 테스트 완료' },
    });
  }, [memoryLogger, actionLogger]);

  const batchLog = useCallback(() => {
    actionRegister.dispatch('batchLog', { count: 5 });
  }, [actionRegister]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    memoryLogger.clearLogs();

    // LogMonitor에 로그 초기화 기록
    actionLogger.logSystem('Memory Logger 로그 초기화', {
      context: 'MemoryLogger Demo',
      toast: { type: 'info', message: '로그가 초기화되었습니다' },
    });
  }, [memoryLogger, actionLogger]);

  return (
    <div className="demo-card logger-card">
      <div className="card-header">
        <h3>Memory Logger Demo</h3>
        <button onClick={clearLogs} className="btn btn-small btn-secondary">
          Clear
        </button>
      </div>

      <LogLevelSelector level={logLevel} onChange={setLogLevel} />

      <div className="button-group">
        <button onClick={testLogger} className="btn btn-primary">
          Test Logger
        </button>
        <button onClick={batchLog} className="btn btn-secondary">
          Batch Log (5)
        </button>
      </div>

      <div className="memory-log-container">
        {logs.length === 0 ? (
          <div className="log-empty">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`log-entry log-${log.level.toLowerCase()}`}
            >
              <span className="log-time">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-level">[{log.level}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Logger 팩토리 데모 (LogMonitor 통합)
function LoggerFactoryDemo() {
  const [envLevel, setEnvLevel] = useState('DEBUG');
  const [customPrefix, setCustomPrefix] = useState('[App]');
  const [logger, setLogger] = useState<Logger>();
  const actionLogger = useActionLoggerWithToast();

  const createCustomLogger = useCallback(() => {
    // 환경 변수 시뮬레이션
    const level = getLogLevelFromEnv();
    const newLogger = createLogger(level);
    setLogger(newLogger);

    // 테스트 로그
    newLogger.info('Logger created with level:', LogLevel[level]);

    // LogMonitor에 로거 생성 기록
    actionLogger.logSystem(
      `Logger Factory에서 로거 생성 (레벨: ${LogLevel[level]})`,
      {
        context: 'LoggerFactory Demo',
        toast: { type: 'success', message: '새 로거가 생성되었습니다' },
      }
    );
  }, [envLevel, customPrefix, actionLogger]);

  const testLogger = useCallback(() => {
    if (!logger) return;

    logger.trace('Factory logger trace');
    logger.debug('Factory logger debug');
    logger.info('Factory logger info');
    logger.warn('Factory logger warning');
    logger.error('Factory logger error');

    // LogMonitor에 팩토리 로거 테스트 기록
    actionLogger.logSystem('Factory Logger 레벨 테스트 완료', {
      context: 'LoggerFactory Demo',
      toast: { type: 'info', message: 'Factory Logger 테스트 완료' },
    });
  }, [logger, actionLogger]);

  return (
    <div className="demo-card">
      <h3>Logger Factory Demo</h3>

      <div className="factory-controls">
        <div className="control-group">
          <label>Environment Level:</label>
          <select
            value={envLevel}
            onChange={(e) => setEnvLevel(e.target.value)}
            className="select-input"
          >
            <option value="TRACE">TRACE</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="NONE">NONE</option>
          </select>
        </div>

        <div className="control-group">
          <label>Prefix:</label>
          <input
            type="text"
            value={customPrefix}
            onChange={(e) => setCustomPrefix(e.target.value)}
            className="text-input small"
          />
        </div>
      </div>

      <div className="button-group">
        <button onClick={createCustomLogger} className="btn btn-primary">
          Create Logger
        </button>
        <button
          onClick={testLogger}
          className="btn btn-secondary"
          disabled={!logger}
        >
          Test Logger
        </button>
      </div>

      {logger && (
        <div className="logger-info">
          <p>Logger created! Check console for output.</p>
        </div>
      )}
    </div>
  );
}

function LoggerDemoPage() {
  return (
    <PageWithLogMonitor
      pageId="logger-demo"
      title="Logger System Integration"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>Logger System Integration</h1>
          <p className="page-description">
            Explore the flexible logging system with different log levels,
            custom loggers, and integration with the action pipeline for
            comprehensive debugging.
          </p>
        </header>

        <div className="space-y-6">
          <ConsoleLoggerDemo />
          <MemoryLoggerDemo />
          <LoggerFactoryDemo />

          {/* Logger 개념 설명 */}
          <div className="demo-card info-card">
            <h3>Log Levels</h3>
            <ul className="log-level-list">
              <li>
                <strong>TRACE (0)</strong> - 매우 상세한 디버깅 정보
              </li>
              <li>
                <strong>DEBUG (1)</strong> - 디버깅에 유용한 정보
              </li>
              <li>
                <strong>INFO (2)</strong> - 일반적인 정보성 메시지
              </li>
              <li>
                <strong>WARN (3)</strong> - 경고 메시지
              </li>
              <li>
                <strong>ERROR (4)</strong> - 오류 메시지
              </li>
              <li>
                <strong>NONE (5)</strong> - 로깅 비활성화
              </li>
            </ul>
          </div>

          {/* Logger 기능 */}
          <div className="demo-card info-card">
            <h3>Logger Features</h3>
            <ul className="feature-list">
              <li>✓ 계층적 로그 레벨 시스템</li>
              <li>✓ 커스텀 로거 구현 가능</li>
              <li>✓ ActionRegister와 완전 통합</li>
              <li>✓ 환경 변수 기반 설정</li>
              <li>✓ 프리픽스 지원</li>
              <li>✓ TypeScript 타입 안전성</li>
            </ul>
          </div>
        </div>

        {/* 코드 예제 */}
        <div className="code-example">
          <h3>Logger Usage Example</h3>
          <pre className="code-block">
            {`// 1. 기본 ConsoleLogger 사용
const logger = new ConsoleLogger(LogLevel.DEBUG, '[MyApp]');
logger.info('Application started');
logger.debug('Debug information', { data: 123 });

// 2. ActionRegister와 통합
const actionRegister = new ActionRegister<MyActions>({
  logger: logger
});

// 3. 환경 변수 기반 로거 생성
const envLogger = createLogger({
  level: getLogLevelFromEnv(process.env),
  prefix: '[Production]'
});

// 4. 커스텀 로거 구현
class CustomLogger implements Logger {
  trace(message: string, ...args: any[]): void {
    // 커스텀 구현
  }
  // ... 다른 메서드들
}`}
          </pre>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default LoggerDemoPage;
