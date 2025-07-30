import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import { useCallback, useEffect, useState } from 'react';

// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// 로그 엔트리 타입 정의
interface LogEntry {
  id: string;
  message: string;
}

export function CoreBasicsPage() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());

  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      message: `${new Date().toLocaleTimeString()}: ${message}`,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  useEffect(() => {
    // 액션 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        addLog('Increment action executed');
        controller.next();
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        addLog('Decrement action executed');
        controller.next();
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        addLog(`Count set to: ${payload}`);
        controller.next();
      }
    );

    const unsubscribeReset = actionRegister.register(
      'reset',
      (_, controller) => {
        setCount(0);
        setLogs([]);
        addLog('Counter reset');
        controller.next();
      }
    );

    const unsubscribeLog = actionRegister.register(
      'log',
      (message, controller) => {
        addLog(message);
        controller.next();
      }
    );

    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
      unsubscribeReset();
      unsubscribeLog();
    };
  }, [actionRegister, addLog]);

  return (
    <div>
      <h1>Core Library - Basics</h1>
      <p>
        Core 라이브러리의 기본적인 ActionDispatcher 사용법을 보여줍니다. 순수
        JavaScript/TypeScript 환경에서 동작합니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        {/* Counter Control */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>Counter Control</h3>
          <div
            style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0' }}
          >
            Count: {count}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => actionRegister.dispatch('increment')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              +1
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('decrement')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              -1
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('setCount', 10)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Set to 10
            </button>

            <button
              type="button"
              onClick={() =>
                actionRegister.dispatch(
                  'setCount',
                  Math.floor(Math.random() * 100)
                )
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Random
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('reset')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() =>
                actionRegister.dispatch('log', 'Custom log message!')
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Add Custom Log
            </button>
          </div>
        </div>

        {/* Logs */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>Action Logs</h3>
          <div
            style={{
              height: '300px',
              overflow: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#6c757d' }}>No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ marginBottom: '5px' }}>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>Code Example</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
          {`// 1. 액션 타입 정의
interface ActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
}

// 2. ActionRegister 생성
const actionRegister = new ActionRegister<ActionMap>();

// 3. 액션 핸들러 등록
actionRegister.register('increment', (_, controller) => {
  setCount(prev => prev + 1);
  controller.next();
});

actionRegister.register('setCount', (payload, controller) => {
  setCount(payload);
  controller.next();
});

// 4. 액션 디스패치
actionRegister.dispatch('increment');
actionRegister.dispatch('setCount', 42);`}
        </pre>
      </div>
    </div>
  );
}
