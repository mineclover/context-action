import React, { useState, useEffect, useCallback } from 'react';
import { ActionRegister, ActionPayloadMap, PipelineController } from '@context-action/react';

// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  increment: undefined;
  multiply: number;
  chainedAction: { step: number; data: string };
  conditionalAction: { condition: boolean; value: number };
  delayedAction: { delay: number; message: string };
  errorAction: undefined;
  middlewareTest: { type: string; payload: any };
  priorityTest: { level: number };
  abortTest: undefined;
}

// 로그 엔트리 인터페이스
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'action' | 'middleware' | 'error' | 'system';
  message: string;
  priority?: number;
}

// 미들웨어 타입 정의
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;

function CoreAdvancedPage() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<AdvancedActionMap>());
  const [isMiddlewareEnabled, setIsMiddlewareEnabled] = useState(true);
  const [chainStep, setChainStep] = useState(0);

  const addLog = useCallback((type: LogEntry['type'], message: string, priority?: number) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      priority,
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  // 미들웨어 구현들
  const loggingMiddleware: Middleware<AdvancedActionMap> = useCallback((action, payload, next) => {
    if (!isMiddlewareEnabled) {
      next();
      return;
    }
    
    addLog('middleware', `🔍 Pre-execution: ${String(action)} with payload: ${JSON.stringify(payload)}`);
    const startTime = performance.now();
    
    try {
      next();
      const endTime = performance.now();
      addLog('middleware', `✅ Post-execution: ${String(action)} completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      addLog('middleware', `❌ Middleware caught error in ${String(action)}: ${error}`);
      throw error;
    }
  }, [isMiddlewareEnabled, addLog]);

  const authenticationMiddleware: Middleware<AdvancedActionMap> = useCallback((action, _payload, next) => {
    if (!isMiddlewareEnabled) {
      next();
      return;
    }
    
    const protectedActions = ['multiply', 'errorAction', 'abortTest'];
    
    if (protectedActions.includes(String(action))) {
      addLog('middleware', `🔐 Authentication check for ${String(action)}`);
      if (Math.random() > 0.2) { // 80% 성공률
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
  }, [isMiddlewareEnabled, addLog]);

  const throttleMiddleware: Middleware<AdvancedActionMap> = useCallback((() => {
    const lastExecution = new Map<string, number>();
    const THROTTLE_MS = 1000;
    
    return (action, _payload, next) => {
      if (!isMiddlewareEnabled) {
        next();
        return;
      }
      
      const actionKey = String(action);
      const now = Date.now();
      const last = lastExecution.get(actionKey) || 0;
      
      if (now - last < THROTTLE_MS) {
        addLog('middleware', `⏳ Throttled: ${actionKey} (${THROTTLE_MS - (now - last)}ms remaining)`);
        return;
      }
      
      lastExecution.set(actionKey, now);
      next();
    };
  })(), [isMiddlewareEnabled, addLog]);

  useEffect(() => {
    addLog('system', 'Advanced ActionRegister initialized');
    
    // 기본 액션들 (Priority 1)
    const unsubscribeIncrement = actionRegister.register('increment', (_, controller) => {
      setCount(prev => prev + 1);
      addLog('action', 'Counter incremented', 1);
      controller.next();
    }, { priority: 1 });

    // 곱셈 액션 (Priority 2 - 높은 우선순위)
    const unsubscribeMultiply = actionRegister.register('multiply', (factor, controller) => {
      setCount(prev => prev * factor);
      addLog('action', `Counter multiplied by ${factor}`, 2);
      controller.next();
    }, { priority: 2 });

    // 비동기 체이닝 액션
    const unsubscribeChainedAction = actionRegister.register('chainedAction', async ({ step, data }, controller) => {
      addLog('action', `Chain step ${step}: ${data}`, 1);
      setChainStep(step);

      if (step < 3) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        actionRegister.dispatch('chainedAction', {
          step: step + 1,
          data: `${data} -> Step ${step + 1}`,
        });
      } else {
        addLog('action', 'Chain completed!', 1);
        setChainStep(0);
      }
      controller.next();
    }, { priority: 1 });

    // 조건부 실행 액션
    const unsubscribeConditionalAction = actionRegister.register('conditionalAction', ({ condition, value }, controller) => {
      if (condition) {
        setCount(prev => prev + value);
        addLog('action', `Conditional action executed: +${value}`, 1);
      } else {
        addLog('action', `Conditional action skipped (condition: ${condition})`, 1);
      }
      controller.next();
    }, { priority: 1 });

    // 지연 실행 액션
    const unsubscribeDelayedAction = actionRegister.register('delayedAction', async ({ delay, message }, controller) => {
      addLog('action', `Delayed action started: ${message} (${delay}ms delay)`, 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      addLog('action', `Delayed action completed: ${message}`, 1);
      controller.next();
    }, { priority: 1 });

    // 에러 처리 액션
    const unsubscribeErrorAction = actionRegister.register('errorAction', (_, controller) => {
      addLog('action', 'Error action triggered', 1);
      controller.next();
      throw new Error('Intentional error for testing');
    }, { priority: 1 });

    // 미들웨어 테스트 액션
    const unsubscribeMiddlewareTest = actionRegister.register('middlewareTest', ({ type, payload }, controller) => {
      addLog('action', `Middleware test: ${type} with ${JSON.stringify(payload)}`, 1);
      controller.next();
    }, { priority: 1 });

    // 우선순위 테스트 액션들
    const unsubscribePriorityTest1 = actionRegister.register('priorityTest', ({ level }) => {
      addLog('action', `Priority handler 1 executed (level: ${level})`, 1);
    }, { priority: 1 });

    const unsubscribePriorityTest2 = actionRegister.register('priorityTest', ({ level }) => {
      addLog('action', `Priority handler 2 executed (level: ${level})`, 2);
    }, { priority: 2 });

    const unsubscribePriorityTest3 = actionRegister.register('priorityTest', ({ level }) => {
      addLog('action', `Priority handler 3 executed (level: ${level})`, 3);
    }, { priority: 3 });

    // Abort 테스트 액션
    const unsubscribeAbortTest = actionRegister.register('abortTest', (_, controller) => {
      addLog('action', 'Abort test: This should abort', 1);
      controller.abort('Action was intentionally aborted');
    }, { priority: 1 });

    addLog('system', 'All advanced handlers registered');

    return () => {
      unsubscribeIncrement();
      unsubscribeMultiply();
      unsubscribeChainedAction();
      unsubscribeConditionalAction();
      unsubscribeDelayedAction();
      unsubscribeErrorAction();
      unsubscribeMiddlewareTest();
      unsubscribePriorityTest1();
      unsubscribePriorityTest2();
      unsubscribePriorityTest3();
      unsubscribeAbortTest();
      addLog('system', 'All handlers unregistered');
    };
  }, [actionRegister, addLog]);

  // 액션 디스패치 함수들
  const handleIncrement = useCallback(() => {
    actionRegister.dispatch('increment');
  }, [actionRegister]);

  const handleMultiply = useCallback(() => {
    actionRegister.dispatch('multiply', 2);
  }, [actionRegister]);

  const handleChainedAction = useCallback(() => {
    if (chainStep === 0) {
      actionRegister.dispatch('chainedAction', { step: 1, data: 'Start Chain' });
    } else {
      addLog('system', 'Chain already in progress...');
    }
  }, [actionRegister, chainStep, addLog]);

  const handleConditionalAction = useCallback((condition: boolean) => {
    actionRegister.dispatch('conditionalAction', { condition, value: 5 });
  }, [actionRegister]);

  const handleDelayedAction = useCallback(() => {
    actionRegister.dispatch('delayedAction', { delay: 2000, message: 'Async operation' });
  }, [actionRegister]);

  const handleErrorAction = useCallback(() => {
    try {
      actionRegister.dispatch('errorAction');
    } catch (error) {
      addLog('error', `Caught error: ${error}`);
    }
  }, [actionRegister, addLog]);

  const handleMiddlewareTest = useCallback(() => {
    actionRegister.dispatch('middlewareTest', { type: 'test', payload: { data: 'middleware demo' } });
  }, [actionRegister]);

  const handlePriorityTest = useCallback(() => {
    actionRegister.dispatch('priorityTest', { level: Math.floor(Math.random() * 5) + 1 });
  }, [actionRegister]);

  const handleAbortTest = useCallback(() => {
    actionRegister.dispatch('abortTest');
  }, [actionRegister]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('system', 'Logs cleared');
  }, [addLog]);

  const toggleMiddleware = useCallback(() => {
    setIsMiddlewareEnabled(prev => !prev);
    addLog('system', `Middleware ${!isMiddlewareEnabled ? 'enabled' : 'disabled'}`);
  }, [isMiddlewareEnabled, addLog]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Core Advanced Features</h1>
        <p className="page-description">
          Explore advanced ActionRegister features including priority-based execution,
          middleware patterns, async action chaining, and pipeline control.
        </p>
      </header>

      <div className="demo-grid">
        {/* 상태 표시 */}
        <div className="demo-card">
          <h3>Current State</h3>
          <div className="state-display">
            <div className="state-item">
              <span className="state-label">Counter:</span>
              <span className="state-value">{count}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Chain Step:</span>
              <span className="state-value">{chainStep || 'Ready'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Middleware:</span>
              <span className={`state-value ${isMiddlewareEnabled ? 'enabled' : 'disabled'}`}>
                {isMiddlewareEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <button onClick={toggleMiddleware} className="btn btn-secondary">
            Toggle Middleware
          </button>
        </div>

        {/* 기본 액션들 */}
        <div className="demo-card">
          <h3>Basic Actions</h3>
          <div className="button-group">
            <button onClick={handleIncrement} className="btn btn-primary">
              Increment (+1)
            </button>
            <button onClick={handleMultiply} className="btn btn-secondary">
              Multiply (×2)
            </button>
          </div>
        </div>

        {/* 비동기 액션들 */}
        <div className="demo-card">
          <h3>Async Actions</h3>
          <div className="button-group">
            <button 
              onClick={handleChainedAction} 
              className="btn btn-primary"
              disabled={chainStep > 0}
            >
              Start Chain {chainStep > 0 && `(Step ${chainStep})`}
            </button>
            <button onClick={handleDelayedAction} className="btn btn-secondary">
              Delayed Action (2s)
            </button>
          </div>
        </div>

        {/* 조건부 액션들 */}
        <div className="demo-card">
          <h3>Conditional Actions</h3>
          <div className="button-group">
            <button onClick={() => handleConditionalAction(true)} className="btn btn-success">
              Execute (+5)
            </button>
            <button onClick={() => handleConditionalAction(false)} className="btn btn-warning">
              Skip (false)
            </button>
          </div>
        </div>

        {/* 고급 기능들 */}
        <div className="demo-card">
          <h3>Advanced Features</h3>
          <div className="button-group">
            <button onClick={handlePriorityTest} className="btn btn-info">
              Priority Test
            </button>
            <button onClick={handleMiddlewareTest} className="btn btn-secondary">
              Middleware Test
            </button>
            <button onClick={handleAbortTest} className="btn btn-warning">
              Abort Test
            </button>
            <button onClick={handleErrorAction} className="btn btn-danger">
              Error Test
            </button>
          </div>
        </div>

        {/* 액션 로거 */}
        <div className="demo-card logger-card">
          <div className="card-header">
            <h3>Advanced Action Logger</h3>
            <button onClick={clearLogs} className="btn btn-small btn-secondary">
              Clear
            </button>
          </div>
          <div className="log-container advanced-log">
            {logs.length === 0 ? (
              <div className="log-empty">No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-type">[{log.type.toUpperCase()}]</span>
                  {log.priority && <span className="log-priority">P{log.priority}</span>}
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 고급 개념 설명 */}
        <div className="demo-card info-card">
          <h3>Advanced Concepts</h3>
          <ul className="concept-list">
            <li>
              <strong>Priority Execution:</strong> 높은 우선순위 핸들러가 먼저 실행됩니다
            </li>
            <li>
              <strong>Middleware Pattern:</strong> 횡단 관심사를 액션 파이프라인에 주입
            </li>
            <li>
              <strong>Async Chaining:</strong> 비동기 액션들을 체인으로 연결
            </li>
            <li>
              <strong>Pipeline Control:</strong> controller.abort()로 실행 중단
            </li>
            <li>
              <strong>Error Handling:</strong> 에러 전파와 복구 메커니즘
            </li>
          </ul>
        </div>
      </div>

      {/* 코드 예제 */}
      <div className="code-example">
        <h3>Advanced Usage Example</h3>
        <pre className="code-block">
{`// 1. 우선순위 기반 핸들러
actionRegister.register('action', handler1, { priority: 1 });
actionRegister.register('action', handler2, { priority: 2 }); // 먼저 실행

// 2. 비동기 체이닝
actionRegister.register('chainedAction', async (payload, controller) => {
  await doSomething(payload);
  if (shouldContinue) {
    actionRegister.dispatch('nextAction', newPayload);
  }
  controller.next();
});

// 3. 조건부 파이프라인 제어
actionRegister.register('conditionalAction', (payload, controller) => {
  if (!isValid(payload)) {
    controller.abort('Invalid payload');
    return;
  }
  // 계속 진행
  controller.next();
});

// 4. 미들웨어 패턴 시뮬레이션
const loggingMiddleware = (action, payload, next) => {
  console.log('Before:', action, payload);
  next();
  console.log('After:', action);
};`}
        </pre>
      </div>
    </div>
  );
}

export default CoreAdvancedPage;