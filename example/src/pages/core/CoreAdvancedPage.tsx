import { useState, useRef, useEffect } from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  multiply: number;
  reset: undefined;
  logAction: string;
  chainedAction: { step: number; data: string };
  conditionalAction: { condition: boolean; value: number };
  delayedAction: { delay: number; message: string };
  errorAction: undefined;
}

// 로그 타입 정의
interface LogEntry {
  timestamp: string;
  type: 'action' | 'middleware' | 'error' | 'interceptor';
  message: string;
  priority?: number;
}

// 미들웨어 타입 정의
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;

function CoreAdvancedContent() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMiddlewareEnabled, setIsMiddlewareEnabled] = useState(true);
  const [conditionValue, setConditionValue] = useState(true);
  const actionRegisterRef = useRef<ActionRegister<AdvancedActionMap> | null>(null);

  // 로그 추가 함수
  const addLog = (type: LogEntry['type'], message: string, priority?: number) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      priority,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 20)); // 최근 20개만 유지
  };

  // 미들웨어 정의들
  const loggingMiddleware: Middleware<AdvancedActionMap> = (action, payload, next) => {
    addLog('middleware', `🔍 Pre-execution: ${String(action)} with payload: ${JSON.stringify(payload)}`);
    next();
    addLog('middleware', `✅ Post-execution: ${String(action)} completed`);
  };

  const authenticationMiddleware: Middleware<AdvancedActionMap> = (action, payload, next) => {
    // 인증이 필요한 액션들
    const protectedActions = ['reset', 'multiply'];
    
    if (protectedActions.includes(String(action))) {
      addLog('middleware', `🔐 Authentication check for ${String(action)}`);
      // 시뮬레이션: 항상 인증 통과
      if (Math.random() > 0.1) { // 90% 확률로 성공
        addLog('middleware', `✅ Authentication passed for ${String(action)}`);
        next();
      } else {
        addLog('middleware', `❌ Authentication failed for ${String(action)}`);
        addLog('error', `Access denied for ${String(action)}`);
        return;
      }
    } else {
      next();
    }
  };

  const validationMiddleware: Middleware<AdvancedActionMap> = (action, payload, next) => {
    let isValid = true;
    
    if (action === 'multiply' && typeof payload === 'number') {
      if (payload < 1 || payload > 10) {
        isValid = false;
        addLog('error', `Validation failed: multiply value must be between 1 and 10, got ${payload}`);
      }
    }
    
    if (action === 'conditionalAction' && typeof payload === 'object' && payload !== null) {
      const { value } = payload as { value: number };
      if (value < 0) {
        isValid = false;
        addLog('error', `Validation failed: conditional action value cannot be negative, got ${value}`);
      }
    }

    if (isValid) {
      addLog('middleware', `✅ Validation passed for ${String(action)}`);
      next();
    } else {
      addLog('error', `❌ Validation failed for ${String(action)}`);
    }
  };

  // ActionRegister 초기화
  useEffect(() => {
    const actionRegister = new ActionRegister<AdvancedActionMap>();
    actionRegisterRef.current = actionRegister;

    // 기본 핸들러들 등록
    actionRegister.register('increment', () => {
      setCount(prev => prev + 1);
      addLog('action', 'Counter incremented', 1);
    }, { priority: 1 });

    actionRegister.register('decrement', () => {
      setCount(prev => prev - 1);
      addLog('action', 'Counter decremented', 1);
    }, { priority: 1 });

    actionRegister.register('multiply', (factor) => {
      setCount(prev => prev * factor);
      addLog('action', `Counter multiplied by ${factor}`, 2);
    }, { priority: 2 });

    actionRegister.register('reset', () => {
      setCount(0);
      addLog('action', 'Counter reset', 3);
    }, { priority: 3 });

    // 로깅 전용 핸들러
    actionRegister.register('logAction', (message) => {
      addLog('action', `Custom log: ${message}`, 0);
    }, { priority: 0 });

    // 체이닝 액션 핸들러
    actionRegister.register('chainedAction', async ({ step, data }) => {
      addLog('action', `Chain step ${step}: ${data}`, 1);
      
      if (step < 3) {
        // 다음 단계로 체이닝
        await new Promise(resolve => setTimeout(resolve, 500));
        actionRegister.dispatch('chainedAction', { 
          step: step + 1, 
          data: `${data} -> Step ${step + 1}` 
        });
      } else {
        addLog('action', 'Chain completed!', 1);
      }
    }, { priority: 1 });

    // 조건부 액션 핸들러
    actionRegister.register('conditionalAction', ({ condition, value }) => {
      if (condition) {
        setCount(prev => prev + value);
        addLog('action', `Conditional action executed: +${value}`, 1);
      } else {
        addLog('action', `Conditional action skipped (condition: ${condition})`, 1);
      }
    }, { priority: 1 });

    // 지연 액션 핸들러
    actionRegister.register('delayedAction', async ({ delay, message }) => {
      addLog('action', `Delayed action started: ${message} (${delay}ms delay)`, 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      addLog('action', `Delayed action completed: ${message}`, 1);
    }, { priority: 1 });

    // 에러 발생 액션 핸들러
    actionRegister.register('errorAction', () => {
      addLog('action', 'Error action triggered', 1);
      throw new Error('Intentional error for testing');
    }, { priority: 1 });

    return () => {
      // Note: ActionRegister doesn't have cleanup method yet
      addLog('action', 'ActionRegister cleaned up');
    };
  }, []);

  // 미들웨어 시뮬레이션 (실제 ActionRegister에서는 아직 미지원)
  useEffect(() => {
    if (!actionRegisterRef.current) return;

    if (isMiddlewareEnabled) {
      addLog('middleware', '🔧 Middleware simulation enabled (logging, auth, validation)');
    } else {
      addLog('middleware', '🔧 Middleware simulation disabled');
    }
  }, [isMiddlewareEnabled]);

  const dispatch = (action: keyof AdvancedActionMap, payload?: AdvancedActionMap[keyof AdvancedActionMap]) => {
    if (actionRegisterRef.current) {
      try {
        actionRegisterRef.current.dispatch(action, payload);
      } catch (error) {
        addLog('error', `Dispatch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div>
      <h1>Core Library - Advanced</h1>
      <p>
        고급 기능들을 다룹니다: 미들웨어 시스템, 우선순위 기반 실행, 액션 체이닝, 
        조건부 실행, 에러 핸들링, 인터셉터 등의 복잡한 패턴을 보여줍니다.
      </p>

      {/* Control Panel */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginTop: '30px' 
      }}>
        {/* Counter Display */}
        <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px' }}>
          <h3>📊 Counter: {count}</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            <button
              onClick={() => dispatch('increment')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              +1
            </button>
            
            <button
              onClick={() => dispatch('decrement')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              -1
            </button>
            
            <button
              onClick={() => dispatch('multiply', 2)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#fd7e14',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              ×2
            </button>
            
            <button
              onClick={() => dispatch('reset')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={isMiddlewareEnabled}
                onChange={(e) => setIsMiddlewareEnabled(e.target.checked)}
              />
              미들웨어 활성화
            </label>
          </div>
        </div>

        {/* Advanced Actions */}
        <div style={{ padding: '20px', border: '2px solid #28a745', borderRadius: '8px' }}>
          <h3>🚀 Advanced Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => dispatch('chainedAction', { step: 1, data: 'Start' })}
              style={{
                padding: '8px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              🔗 Start Chain Action
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px' }}>조건:</label>
              <input
                type="checkbox"
                checked={conditionValue}
                onChange={(e) => setConditionValue(e.target.checked)}
              />
              <button
                onClick={() => dispatch('conditionalAction', { condition: conditionValue, value: 5 })}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                🔀 Conditional (+5)
              </button>
            </div>
            
            <button
              onClick={() => dispatch('delayedAction', { delay: 2000, message: 'Delayed message' })}
              style={{
                padding: '8px 12px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              ⏱️ Delayed Action (2s)
            </button>
            
            <button
              onClick={() => dispatch('logAction', 'Custom message from user')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#795548',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              📝 Log Message
            </button>
            
            <button
              onClick={() => dispatch('errorAction')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              💥 Trigger Error
            </button>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>📋 Action Logs ({logs.length})</h3>
          <button
            onClick={clearLogs}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            Clear Logs
          </button>
        </div>
        
        <div style={{
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#6c757d', textAlign: 'center' }}>
              No logs yet. Try some actions!
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '5px',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  backgroundColor: 
                    log.type === 'error' ? '#f8d7da' :
                    log.type === 'middleware' ? '#d1ecf1' :
                    log.type === 'interceptor' ? '#fff3cd' :
                    'transparent',
                  color:
                    log.type === 'error' ? '#721c24' :
                    log.type === 'middleware' ? '#0c5460' :
                    log.type === 'interceptor' ? '#856404' :
                    '#495057',
                }}
              >
                <span style={{ color: '#6c757d' }}>[{log.timestamp}]</span>
                {log.priority !== undefined && (
                  <span style={{ color: '#007bff', marginLeft: '8px' }}>[P{log.priority}]</span>
                )}
                <span style={{ marginLeft: '8px' }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>미들웨어 시스템 예시</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
{`// 1. 미들웨어 정의
const loggingMiddleware = (action, payload, next) => {
  console.log(\`Before: \${action}\`);
  next(); // 다음 미들웨어 또는 핸들러 실행
  console.log(\`After: \${action}\`);
};

const authMiddleware = (action, payload, next) => {
  if (protectedActions.includes(action)) {
    if (isAuthenticated()) {
      next();
    } else {
      throw new Error('Authentication required');
    }
  } else {
    next();
  }
};

// 2. ActionRegister에 미들웨어 등록
const actionRegister = new ActionRegister();
actionRegister.use(authMiddleware);     // 먼저 인증 확인
actionRegister.use(loggingMiddleware);  // 그 다음 로깅

// 3. 핸들러 등록 (우선순위 지원)
actionRegister.register('increment', () => {
  setCount(prev => prev + 1);
}, { priority: 1 });

// 4. 에러 핸들링
actionRegister.onError((error, action, payload) => {
  console.error(\`Error in \${action}:\`, error);
});

// 5. 액션 디스패치 (미들웨어 파이프라인 통과)
actionRegister.dispatch('increment');`}
        </pre>
      </div>
    </div>
  );
}

export function CoreAdvancedPage() {
  return <CoreAdvancedContent />;
}
