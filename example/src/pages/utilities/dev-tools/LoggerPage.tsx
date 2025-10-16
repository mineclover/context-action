import {
  ConsoleLogger,
  createLogger,
  getLogLevelFromEnv,
  type Logger,
  LogLevel,
} from '@/utils/logger';
import { LogMonitorLiveDemo } from '@/components/demos/LogMonitorLiveDemo';
import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
  useLogMonitor,
} from '@/components/LogMonitor';

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
      ({ type, data }, _controller) => {
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
      ({ message }, _controller) => {
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
      async ({ delay }, _controller) => {
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

  const testActions = () => {
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
  };

  const dispatchAction = () => {
    actionRegister.dispatch('performAction', {
      type: 'TEST',
      data: { value: 42 },
    });
  };

  const dispatchAsync = () => {
    actionRegister.dispatch('asyncAction', { delay: 1000 });
  };

  const dispatchError = () => {
    try {
      actionRegister.dispatch('throwError', { message: 'Test error message' });
    } catch (_e) {
      // Error is logged automatically
    }
  };

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
      ({ count }, _controller) => {
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
              <li>✓ LogMonitor와 실시간 통합</li>
            </ul>
          </div>

          {/* LogMonitor 통합 가이드 */}
          <div className="demo-card info-card">
            <h3>🔍 LogMonitor 통합 가이드</h3>
            <p className="text-gray-600 mb-4">
              LogMonitor는 액션 핸들러에서 발생하는 모든 이벤트를 실시간으로 수집하고 표시합니다.
            </p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-900">1. 기본 설정</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
{`// PageWithLogMonitor로 페이지 래핑
import { PageWithLogMonitor } from '@/components/LogMonitor';

function MyPage() {
  return (
    <PageWithLogMonitor pageId="my-page">
      {/* 페이지 컨텐츠 */}
    </PageWithLogMonitor>
  );
}`}
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-900">2. 액션 핸들러에서 로깅</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
{`// 핸들러에서 LogMonitor 사용
import { useLogMonitor } from '@/components/LogMonitor/context';
import { LogLevel } from '@/utils/logger';

function useMyHandlers() {
  const { addLog } = useLogMonitor();
  
  const myHandler = useCallback(async (payload) => {
    // 비즈니스 로직 실행
    const result = doSomething(payload);
    
    // LogMonitor에 로그 추가
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: \`작업 완료: \${result}\`,
      details: { payload, result, timestamp: new Date() }
    });
  }, [addLog]);
}`}
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-900">3. 로그 타입별 활용</h4>
              <ul className="space-y-2">
                <li className="text-gray-800"><strong className="text-gray-900">action</strong>: 사용자 액션과 그 결과</li>
                <li className="text-gray-800"><strong className="text-gray-900">system</strong>: 시스템 이벤트 (컴포넌트 등록, 초기화 등)</li>
                <li className="text-gray-800"><strong className="text-gray-900">error</strong>: 오류 및 예외 상황</li>
                <li className="text-gray-800"><strong className="text-gray-900">performance</strong>: 성능 관련 측정 데이터</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-gray-900">4. 실전 활용 예제</h4>
              <p className="text-sm text-gray-800">
                Context-Action 프레임워크에서 LogMonitor를 사용하여 모든 액션의 실행 과정을 추적하고,
                디버깅과 성능 분석을 위한 상세한 로그를 실시간으로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* LogMonitor 실전 사용 예제 */}
        <div className="demo-card info-card">
          <h3>📋 LogMonitor 실전 사용 패턴</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-gray-900">액션 핸들러에서 LogMonitor 통합</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
{`// Parent Handler 예제 (Context-Layered Architecture)
import { useLogMonitor } from '@/components/LogMonitor/context';
import { LogLevel } from '@/utils/logger';

export function useParentCounterHandlers(props: ParentHandlerProps) {
  const { moduleId, enableLogging = true } = props;
  const storeManager = useParentStoreManager();
  const { addLog } = useLogMonitor();

  const incrementCounterHandler = useCallback(async (payload, controller) => {
    const counterStore = storeManager.getStore('parent-counter');
    const currentValue = counterStore.getValue();
    const newValue = currentValue + 1;
    
    counterStore.setValue(newValue);
    
    if (enableLogging) {
      // 콘솔 로그 (개발 시 즉시 확인용)
      console.log(\`🔄 [\${moduleId}] Parent Counter 증가:\`, { 
        previousValue: currentValue, 
        newValue 
      });
      
      // LogMonitor 로그 (구조화된 로그 수집)
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: \`Parent Counter 증가: \${currentValue} → \${newValue}\`,
        details: { 
          action: 'incrementParentCounter', 
          previousValue: currentValue, 
          newValue, 
          moduleId 
        }
      });
    }
  }, [storeManager, moduleId, enableLogging, addLog]);
}`}
            </pre>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-gray-900">Child Component 로깅 패턴</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
{`// Child Handler 예제 (원격 제어 포함)
export function useChildARemoteControlActions() {
  const storeManager = useChildAStoreManager();
  const { addLog } = useLogMonitorActions();
  const childId = 'child-a-counter';

  const handleRemoteControl = useCallback(async (payload, controller) => {
    const { childId: targetId, action, amount } = payload;
    
    if (targetId !== childId) return;

    const counterStore = storeManager.getStore('counter');
    
    if (action === 'increment') {
      const currentValue = counterStore.getValue();
      const incrementAmount = amount || 1;
      const newValue = currentValue + incrementAmount;
      
      counterStore.setValue(newValue);

      // LogMonitor에 원격 제어 로그 추가
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: \`🎮 ChildA 원격 제어로 카운터 증가: \${newValue}\`,
        details: {
          counter: newValue,
          action: 'remote-increment',
          amount: incrementAmount,
          context: 'Child A - Remote Control'
        }
      });
    }
  }, [storeManager, childId, addLog]);
}`}
            </pre>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-gray-900">로그 타입별 활용 패턴</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900">Action 로그</h5>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
{`addLog({
  level: LogLevel.INFO,
  type: 'action',
  message: '사용자 액션 실행',
  details: { actionName, payload }
});`}
                </pre>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">System 로그</h5>
                <pre className="bg-gray-900 text-blue-400 p-3 rounded text-xs font-mono overflow-x-auto">
{`addLog({
  level: LogLevel.DEBUG,
  type: 'system',
  message: '컴포넌트 등록됨',
  details: { componentId, type }
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* LogMonitor 의존성 주의사항 */}
        <div className="demo-card info-card">
          <h3>⚠️ LogMonitor 의존성 주의사항</h3>
          <p className="text-red-600 mb-4 font-medium">
            actionLogger와 logMonitor를 useCallback/useEffect 의존성에 포함하면 무한루프가 발생할 수 있습니다!
          </p>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-red-900">❌ 위험한 패턴 (무한루프 발생)</h4>
            <pre className="bg-red-900 text-red-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-red-300">
{`// 위험! actionLogger를 의존성에 포함하면 무한루프 발생
function MyComponent() {
  const actionLogger = useActionLogger();
  const logMonitor = useLogMonitor();
  
  const handleClick = useCallback(() => {
    actionLogger.logAction('buttonClick', { data: 'test' });
  }, [actionLogger]); // ❌ 무한루프 발생!
  
  useEffect(() => {
    logMonitor.addLog({
      level: LogLevel.INFO,
      type: 'system',
      message: 'Component mounted'
    });
  }, [logMonitor]); // ❌ 무한루프 발생!
}`}
            </pre>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-green-900">✅ 안전한 패턴 (권장)</h4>
            <pre className="bg-green-900 text-green-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-green-300">
{`// 안전! 의존성에서 제외하여 무한루프 방지
function MyComponent() {
  const actionLogger = useActionLogger();
  const logMonitor = useLogMonitor();
  
  const handleClick = useCallback(() => {
    actionLogger.logAction('buttonClick', { data: 'test' });
  }, []); // ✅ 안전! eslint 경고는 무시
  
  // 또는 직접 호출 (의존성 없음)
  const handleClickDirect = () => {
    actionLogger.logAction('buttonClick', { data: 'test' });
  };
  
  useEffect(() => {
    logMonitor.addLog({
      level: LogLevel.INFO,
      type: 'system', 
      message: 'Component mounted'
    });
  }, []); // ✅ 안전! 마운트시 한 번만 실행
}`}
            </pre>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-gray-900">🔍 무한루프가 발생하는 이유</h4>
            <div className="bg-gray-100 p-4 rounded-lg">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800">
                <li><strong>actionLogger 호출</strong> → LogMonitor 상태 변경</li>
                <li><strong>LogMonitor Context 리렌더링</strong> → useActionLogger 재실행</li>
                <li><strong>새로운 actionLogger 객체 생성</strong> → 참조 변경</li>
                <li><strong>useCallback 재실행</strong> → 의존성 변경 감지</li>
                <li><strong>다시 actionLogger 호출</strong> → 무한 반복...</li>
              </ol>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">💡 핵심 원칙</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• <strong>actionLogger, logMonitor는 의존성에 포함하지 마세요</strong></li>
              <li>• ESLint 경고가 나와도 무시하는 것이 안전합니다</li>
              <li>• "Stable API"라는 이름과 달리 실제로는 참조가 변경됩니다</li>
              <li>• 대신 콘솔 로깅이나 직접 호출 패턴을 사용하세요</li>
            </ul>
          </div>
        </div>

        {/* LogMonitor 라이브 데모 */}
        <div className="demo-card">
          <h3>🎮 LogMonitor 라이브 데모</h3>
          <p className="text-gray-600 mb-4">
            아래 버튼들을 클릭하여 LogMonitor에 실시간으로 로그가 수집되는 것을 확인하세요.
          </p>
          <LogMonitorLiveDemo />
        </div>

        {/* 코드 예제 */}
        <div className="code-example">
          <h3 className="text-gray-900 font-bold">Logger Usage Example</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
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
