import React, { useState, useEffect, useCallback } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';

// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// 로그 엔트리 인터페이스
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'action' | 'system';
  message: string;
}

function CoreBasicsPage() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());

  const addLog = useCallback((type: 'action' | 'system', message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  useEffect(() => {
    addLog('system', 'ActionRegister initialized');
    
    // 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        addLog('action', 'Increment action executed');
        controller.next();
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        addLog('action', 'Decrement action executed');
        controller.next();
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        addLog('action', `Count set to: ${payload}`);
        controller.next();
      }
    );

    const unsubscribeReset = actionRegister.register(
      'reset',
      (_, controller) => {
        setCount(0);
        addLog('action', 'Counter reset to 0');
        controller.next();
      }
    );

    const unsubscribeLog = actionRegister.register(
      'log',
      (payload, controller) => {
        addLog('action', `Custom log: ${payload}`);
        controller.next();
      }
    );

    addLog('system', 'All action handlers registered');

    // 정리 함수
    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
      unsubscribeReset();
      unsubscribeLog();
      addLog('system', 'All handlers unregistered');
    };
  }, [actionRegister, addLog]);

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

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('system', 'Logs cleared');
  }, [addLog]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Core ActionRegister Basics</h1>
        <p className="page-description">
          Learn the fundamentals of the ActionRegister system - type-safe action dispatching,
          handler registration, and pipeline control.
        </p>
      </header>

      <div className="demo-grid">
        {/* Counter Demo */}
        <div className="demo-card">
          <h3>Interactive Counter</h3>
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

        {/* Action Logger */}
        <div className="demo-card logger-card">
          <div className="card-header">
            <h3>Action Logger</h3>
            <button onClick={clearLogs} className="btn btn-small btn-secondary">
              Clear
            </button>
          </div>
          <div className="log-container">
            {logs.length === 0 ? (
              <div className="log-empty">No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-type">[{log.type.toUpperCase()}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Actions */}
        <div className="demo-card">
          <h3>Custom Actions</h3>
          <p>Test custom action dispatching with user input.</p>
          <button onClick={handleCustomLog} className="btn btn-primary">
            Add Custom Log
          </button>
        </div>

        {/* How It Works */}
        <div className="demo-card info-card">
          <h3>How It Works</h3>
          <ol className="how-it-works-list">
            <li>
              <strong>Action Types:</strong> Define a type-safe action map extending ActionPayloadMap
            </li>
            <li>
              <strong>Register Handlers:</strong> Use register() to attach handlers to specific actions
            </li>
            <li>
              <strong>Dispatch Actions:</strong> Call dispatch() with action name and optional payload
            </li>
            <li>
              <strong>Pipeline Control:</strong> Handlers receive a controller to manage execution flow
            </li>
          </ol>
        </div>
      </div>

      {/* Code Example */}
      <div className="code-example">
        <h3>Code Example</h3>
        <pre className="code-block">
{`// 1. Define action types
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  setCount: number;
  log: string;
}

// 2. Create ActionRegister
const actionRegister = new ActionRegister<CoreActionMap>();

// 3. Register handlers
actionRegister.register('increment', (_, controller) => {
  setCount(prev => prev + 1);
  controller.next();
});

// 4. Dispatch actions
actionRegister.dispatch('increment');
actionRegister.dispatch('setCount', 10);`}
        </pre>
      </div>
    </div>
  );
}

export default CoreBasicsPage;