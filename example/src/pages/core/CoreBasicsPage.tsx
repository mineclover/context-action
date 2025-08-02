import React, { useState, useEffect, useCallback } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';
import { LogMonitorProvider, LogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// 데모 컴포넌트
function CoreBasicsDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());
  const { logAction, logSystem } = useActionLoggerWithToast();

  useEffect(() => {
    logSystem('ActionRegister initialized');
    
    // 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        logAction('increment', undefined);
        controller.next();
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        logAction('decrement', undefined);
        controller.next();
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        logAction('setCount', payload);
        controller.next();
      }
    );

    const unsubscribeReset = actionRegister.register(
      'reset',
      (_, controller) => {
        setCount(0);
        logAction('reset', undefined);
        controller.next();
      }
    );

    const unsubscribeLog = actionRegister.register(
      'log',
      (payload, controller) => {
        logAction('log', payload);
        controller.next();
      }
    );

    logSystem('All action handlers registered');

    // 정리 함수
    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
      unsubscribeReset();
      unsubscribeLog();
      logSystem('All handlers unregistered');
    };
  }, [actionRegister, logAction, logSystem]);

  // 액션 디스패치 함수들
  const handleIncrement = useCallback(() => {
    actionRegister.dispatch('increment');
  }, [actionRegister]);

  const handleDecrement = useCallback(() => {
    actionRegister.dispatch('decrement');
  }, [actionRegister]);

  const handleSetCount = useCallback(() => {
    actionRegister.dispatch('setCount', 10);
  }, [actionRegister]);

  const handleReset = useCallback(() => {
    actionRegister.dispatch('reset');
  }, [actionRegister]);

  const handleCustomLog = useCallback(() => {
    const message = prompt('Enter log message:');
    if (message) {
      actionRegister.dispatch('log', message);
    }
  }, [actionRegister]);

  return (
    <div className="demo-grid">
      {/* 카운터 데모 */}
      <div className="demo-card">
        <h3>Basic Counter</h3>
        <div className="counter-display">
          <span className="count-value">{count}</span>
        </div>
        <div className="button-group">
          <button onClick={handleIncrement} className="btn btn-primary">
            +1
          </button>
          <button onClick={handleDecrement} className="btn btn-primary">
            -1
          </button>
          <button onClick={handleSetCount} className="btn btn-secondary">
            Set to 10
          </button>
          <button onClick={handleReset} className="btn btn-danger">
            Reset
          </button>
        </div>
      </div>

      {/* 사용자 정의 로그 */}
      <div className="demo-card">
        <h3>Custom Logging</h3>
        <p>Test custom action logging with user input</p>
        <button onClick={handleCustomLog} className="btn btn-info">
          Custom Log
        </button>
      </div>

      {/* 액션 시스템 설명 */}
      <div className="demo-card info-card">
        <h3>How ActionRegister Works</h3>
        <ol className="how-it-works-list">
          <li>
            <strong>Create ActionRegister:</strong> Instantiate with action type map
          </li>
          <li>
            <strong>Register Handlers:</strong> Define what happens for each action
          </li>
          <li>
            <strong>Dispatch Actions:</strong> Trigger actions from UI components
          </li>
          <li>
            <strong>Handle Results:</strong> Use controller.next() or controller.abort()
          </li>
        </ol>
      </div>

      {/* 주요 특징 */}
      <div className="demo-card info-card">
        <h3>Key Features</h3>
        <ul className="feature-list">
          <li>✓ Type-safe action dispatching</li>
          <li>✓ Centralized action handling</li>
          <li>✓ Automatic logging integration</li>
          <li>✓ Clean unsubscribe mechanism</li>
          <li>✓ Middleware support</li>
        </ul>
      </div>

      {/* 로그 모니터 */}
      <LogMonitor title="Core Basics - Action Log" />
    </div>
  );
}

function CoreBasicsPage() {
  return (
    <LogMonitorProvider pageId="core-basics">
      <div className="page-container">
        <header className="page-header">
          <h1>Core ActionRegister Basics</h1>
          <p className="page-description">
            Learn the fundamentals of the ActionRegister system - creating, registering handlers,
            and dispatching type-safe actions in your application.
          </p>
        </header>

        <CoreBasicsDemo />

        {/* 코드 예제 */}
        <div className="code-example">
          <h3>ActionRegister Implementation</h3>
          <pre className="code-block">
{`// 1. 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  increment: undefined;
  setCount: number;
  reset: undefined;
}

// 2. ActionRegister 생성
const actionRegister = new ActionRegister<AppActions>();

// 3. 핸들러 등록
const unsubscribe = actionRegister.register('increment', (_, controller) => {
  setCount(prev => prev + 1);
  console.log('Counter incremented');
  controller.next(); // 성공적으로 완료
});

// 4. 액션 디스패치
actionRegister.dispatch('increment');
actionRegister.dispatch('setCount', 42);

// 5. 정리
unsubscribe();`}
          </pre>
        </div>
      </div>
    </LogMonitorProvider>
  );
}

export default CoreBasicsPage;