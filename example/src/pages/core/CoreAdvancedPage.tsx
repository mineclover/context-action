import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';
import { LogMonitorProvider, LogMonitor, useActionLogger } from '../../components/LogMonitor';

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

// 미들웨어 타입 정의
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;

// 데모 컴포넌트
function CoreAdvancedDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<AdvancedActionMap>());
  const [isMiddlewareEnabled, setIsMiddlewareEnabled] = useState(true);
  const [chainStep, setChainStep] = useState(0);
  const { logAction, logSystem, logError } = useActionLogger();

  // 안정적인 참조를 위한 ref들
  const logActionRef = useRef(logAction);
  const logSystemRef = useRef(logSystem);
  const logErrorRef = useRef(logError);
  const isMiddlewareEnabledRef = useRef(isMiddlewareEnabled);

  // ref 업데이트
  useEffect(() => {
    logActionRef.current = logAction;
    logSystemRef.current = logSystem;
    logErrorRef.current = logError;
    isMiddlewareEnabledRef.current = isMiddlewareEnabled;
  }, [logAction, logSystem, logError, isMiddlewareEnabled]);

  // 로깅 미들웨어 (안정적인 참조)
  const loggingMiddleware: Middleware<AdvancedActionMap> = useCallback(
    async (action, payload, next) => {
      logSystemRef.current(`Middleware intercepted: ${String(action)}`, { context: { action, payload }, priority: 1 });
      await next();
      logSystemRef.current(`Middleware completed: ${String(action)}`, { priority: 1 });
    },
    []
  );

  // 인증 미들웨어 (예시, 안정적인 참조)
  const authMiddleware: Middleware<AdvancedActionMap> = useCallback(
    async (action, payload, next) => {
      if (action === 'sensitiveAction') {
        logSystemRef.current('Auth check required', { priority: 2 });
        // 실제로는 인증 체크 로직
        const isAuthenticated = true;
        if (!isAuthenticated) {
          logErrorRef.current('Authentication failed');
          return;
        }
      }
      await next();
    },
    []
  );

  useEffect(() => {
    logSystemRef.current('ActionRegister with middlewares initialized');
    
    // 미들웨어 시뮬레이션 (실제 미들웨어는 ActionRegister에서 지원되지 않음)
    if (isMiddlewareEnabledRef.current) {
      logSystemRef.current('Middleware simulation enabled');
    }

    // 기본 액션 핸들러
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount(prev => prev + 1);
        logActionRef.current('increment', undefined);
        controller.next();
      },
      { priority: 1 }
    );

    // 우선순위 있는 핸들러
    const unsubscribeMultiply = actionRegister.register(
      'multiply',
      (factor, controller) => {
        setCount(prev => prev * factor);
        logActionRef.current('multiply', factor, { priority: 2 });
        controller.next();
      },
      { priority: 2 }
    );

    // 체인 액션 핸들러
    const unsubscribeChained = actionRegister.register(
      'chainedAction',
      ({ step, data }, controller) => {
        setChainStep(step);
        logActionRef.current('chainedAction', { step, data });
        
        // 다음 체인 액션 자동 실행
        if (step < 3) {
          setTimeout(() => {
            actionRegister.dispatch('chainedAction', { 
              step: step + 1, 
              data: `Chain step ${step + 1}` 
            });
          }, 1000);
        }
        
        controller.next();
      }
    );

    // 조건부 액션 핸들러
    const unsubscribeConditional = actionRegister.register(
      'conditionalAction',
      ({ condition, value }, controller) => {
        logActionRef.current('conditionalAction', { condition, value });
        
        if (condition) {
          setCount(value);
          controller.next();
        } else {
          controller.abort('Condition not met');
        }
      }
    );

    // 지연 액션 핸들러
    const unsubscribeDelayed = actionRegister.register(
      'delayedAction',
      async ({ delay, message }, controller) => {
        logActionRef.current('delayedAction', { delay, message });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logSystemRef.current(`Delayed action completed: ${message}`);
        controller.next();
      }
    );

    // 에러 액션 핸들러
    const unsubscribeError = actionRegister.register(
      'errorAction',
      (_, controller) => {
        logActionRef.current('errorAction', undefined);
        try {
          throw new Error('Intentional error for testing');
        } catch (error) {
          logErrorRef.current('Action handler error', error);
          controller.abort('Handler error occurred');
        }
      }
    );

    // 미들웨어 테스트 핸들러
    const unsubscribeMiddlewareTest = actionRegister.register(
      'middlewareTest',
      async ({ type, payload }, controller) => {
        if (isMiddlewareEnabledRef.current) {
          await loggingMiddleware('middlewareTest', { type, payload }, async () => {
            logActionRef.current('middlewareTest', { type, payload });
          });
        } else {
          logActionRef.current('middlewareTest', { type, payload });
        }
        controller.next();
      }
    );

    // 우선순위 테스트 핸들러들
    const unsubscribePriority1 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logActionRef.current('priorityTest (Priority 1)', { level }, { priority: 1 });
        controller.next();
      },
      { priority: 1 }
    );

    const unsubscribePriority2 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logActionRef.current('priorityTest (Priority 3)', { level }, { priority: 3 });
        controller.next();
      },
      { priority: 3 }
    );

    const unsubscribePriority3 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logActionRef.current('priorityTest (Priority 2)', { level }, { priority: 2 });
        controller.next();
      },
      { priority: 2 }
    );

    // 중단 테스트 핸들러
    const unsubscribeAbort = actionRegister.register(
      'abortTest',
      (_, controller) => {
        logActionRef.current('abortTest', undefined);
        controller.abort('Action intentionally aborted for testing');
      }
    );

    logSystemRef.current('All advanced handlers registered');

    return () => {
      unsubscribeIncrement();
      unsubscribeMultiply();
      unsubscribeChained();
      unsubscribeConditional();
      unsubscribeDelayed();
      unsubscribeError();
      unsubscribeMiddlewareTest();
      unsubscribePriority1();
      unsubscribePriority2();
      unsubscribePriority3();
      unsubscribeAbort();
      logSystemRef.current('All handlers unregistered');
    };
  }, [actionRegister, loggingMiddleware, authMiddleware]); // 안정화된 의존성 배열

  // 액션 디스패치 함수들
  const handleIncrement = useCallback(() => {
    actionRegister.dispatch('increment');
  }, [actionRegister]);

  const handleMultiply = useCallback(() => {
    actionRegister.dispatch('multiply', 2);
  }, [actionRegister]);

  const handleChainedAction = useCallback(() => {
    setChainStep(0);
    actionRegister.dispatch('chainedAction', { step: 1, data: 'Chain started' });
  }, [actionRegister]);

  const handleConditionalTrue = useCallback(() => {
    actionRegister.dispatch('conditionalAction', { condition: true, value: 100 });
  }, [actionRegister]);

  const handleConditionalFalse = useCallback(() => {
    actionRegister.dispatch('conditionalAction', { condition: false, value: 100 });
  }, [actionRegister]);

  const handleDelayed = useCallback(() => {
    actionRegister.dispatch('delayedAction', { delay: 2000, message: 'Delayed execution complete' });
  }, [actionRegister]);

  const handleError = useCallback(() => {
    actionRegister.dispatch('errorAction');
  }, [actionRegister]);

  const handleMiddlewareTest = useCallback(() => {
    actionRegister.dispatch('middlewareTest', { type: 'test', payload: { timestamp: Date.now() } });
  }, [actionRegister]);

  const handlePriorityTest = useCallback(() => {
    actionRegister.dispatch('priorityTest', { level: Math.floor(Math.random() * 10) });
  }, [actionRegister]);

  const handleAbortTest = useCallback(() => {
    actionRegister.dispatch('abortTest');
  }, [actionRegister]);

  const toggleMiddleware = useCallback(() => {
    setIsMiddlewareEnabled(prev => {
      const newValue = !prev;
      logSystemRef.current(`Middleware ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  }, []);

  return (
    <div className="demo-grid">
      {/* 상태 표시 */}
      <div className="demo-card">
        <h3>Advanced State</h3>
        <div className="state-display">
          <div className="state-item">
            <span className="state-label">Count:</span>
            <span className="state-value">{count}</span>
          </div>
          <div className="state-item">
            <span className="state-label">Chain Step:</span>
            <span className="state-value">{chainStep}</span>
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

      {/* 고급 액션들 */}
      <div className="demo-card">
        <h3>Advanced Actions</h3>
        <div className="button-group">
          <button onClick={handleChainedAction} className="btn btn-info">
            Start Chain
          </button>
          <button onClick={handleDelayed} className="btn btn-warning">
            Delayed (2s)
          </button>
        </div>
      </div>

      {/* 조건부 액션들 */}
      <div className="demo-card">
        <h3>Conditional Actions</h3>
        <div className="button-group">
          <button onClick={handleConditionalTrue} className="btn btn-success">
            Condition True
          </button>
          <button onClick={handleConditionalFalse} className="btn btn-danger">
            Condition False
          </button>
        </div>
      </div>

      {/* 테스트 액션들 */}
      <div className="demo-card">
        <h3>Testing Actions</h3>
        <div className="button-group">
          <button onClick={handlePriorityTest} className="btn btn-info">
            Priority Test
          </button>
          <button onClick={handleMiddlewareTest} className="btn btn-secondary">
            Middleware Test
          </button>
          <button onClick={handleError} className="btn btn-warning">
            Error Test
          </button>
          <button onClick={handleAbortTest} className="btn btn-danger">
            Abort Test
          </button>
        </div>
      </div>

      {/* 고급 개념들 */}
      <div className="demo-card info-card">
        <h3>Advanced Concepts</h3>
        <ul className="concept-list">
          <li>
            <strong>Priority Handlers:</strong> Multiple handlers with execution order
          </li>
          <li>
            <strong>Middleware:</strong> Cross-cutting concerns like logging and auth
          </li>
          <li>
            <strong>Async Actions:</strong> Delayed execution and promise handling
          </li>
          <li>
            <strong>Action Chaining:</strong> Automatic sequential action dispatch
          </li>
          <li>
            <strong>Conditional Logic:</strong> Handlers with abort/continue control
          </li>
          <li>
            <strong>Error Handling:</strong> Graceful failure and error propagation
          </li>
        </ul>
      </div>

      {/* 로그 모니터 */}
      <LogMonitor title="Core Advanced - Action Log" />
    </div>
  );
}

function CoreAdvancedPage() {
  return (
    <LogMonitorProvider pageId="core-advanced">
      <div className="page-container">
        <header className="page-header">
          <h1>Core ActionRegister Advanced</h1>
          <p className="page-description">
            Explore advanced ActionRegister features including priorities, middleware,
            async actions, chaining, conditional logic, and comprehensive error handling.
          </p>
        </header>

        <CoreAdvancedDemo />

        {/* 코드 예제 */}
        <div className="code-example">
          <h3>Advanced ActionRegister Patterns</h3>
          <pre className="code-block">
{`// 1. 우선순위 핸들러
actionRegister.register('action', handler1, { priority: 1 });
actionRegister.register('action', handler2, { priority: 2 });
actionRegister.register('action', handler3, { priority: 3 });

// 2. 미들웨어 등록
const loggingMiddleware = async (action, payload, next) => {
  console.log(\`Before: \${action}\`);
  await next();
  console.log(\`After: \${action}\`);
};
actionRegister.use(loggingMiddleware);

// 3. 비동기 액션 핸들러
actionRegister.register('asyncAction', async (payload, controller) => {
  await delay(1000);
  console.log('Delayed execution');
  controller.next();
});

// 4. 조건부 로직
actionRegister.register('conditionalAction', ({ condition }, controller) => {
  if (condition) {
    controller.next();
  } else {
    controller.abort('Condition not met');
  }
});

// 5. 체인 액션
actionRegister.register('chainAction', ({ step }, controller) => {
  console.log(\`Step \${step}\`);
  if (step < 3) {
    actionRegister.dispatch('chainAction', { step: step + 1 });
  }
  controller.next();
});`}
          </pre>
        </div>
      </div>
    </LogMonitorProvider>
  );
}

export default CoreAdvancedPage;