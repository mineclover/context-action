import React, { useCallback, useState } from 'react';
import { createActionContext } from '@context-action/react';
import { LogLevel, type ActionPayloadMap } from '@context-action/core';

// 액션 타입 정의
interface AppActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
}

const priority1 = { priority: 1 };

// 컨텍스트 생성 - TRACE 레벨로 설정
const { Provider, useAction, useActionHandler } =
  createActionContext<AppActionMap>({
    logLevel: LogLevel.TRACE
  });

function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();

  // useCallback으로 핸들러 메모이제이션
  const incrementHandler = useCallback(() => {
    console.log('[TRACE] Counter increment handler started');
    setCount((prev) => prev + 1);
    console.log('[TRACE] Counter incremented, new value:', count + 1);
  }, [count]);

  const decrementHandler = useCallback(() => {
    console.log('[TRACE] Counter decrement handler started');
    setCount((prev) => prev - 1);
    console.log('[TRACE] Counter decremented, new value:', count - 1);
  }, [count]);

  const setCountHandler = useCallback((payload: number) => {
    console.log('[TRACE] Counter setCount handler started with payload:', payload);
    setCount(payload);
    console.log('[TRACE] Counter set to:', payload);
  }, []);

  const resetHandler = useCallback(() => {
    console.log('[TRACE] Counter reset handler started');
    setCount(0);
    console.log('[TRACE] Counter reset to 0');
  }, []);

  // 액션 핸들러 등록 - 메모이제이션된 함수 사용
  useActionHandler('increment', incrementHandler, priority1);
  useActionHandler('decrement', decrementHandler, priority1);
  useActionHandler('setCount', setCountHandler, priority1);
  useActionHandler('reset', resetHandler, priority1);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Counter: {count}</h3>
      <button type="button" onClick={() => dispatch('increment')}>
        +1
      </button>
      <button type="button" onClick={() => dispatch('decrement')}>
        -1
      </button>
      <button type="button" onClick={() => dispatch('setCount', 10)}>
        Set to 10
      </button>
      <button type="button" onClick={() => dispatch('reset')}>
        Reset
      </button>
    </div>
  );
}

function Logger() {
  // Logger 핸들러들도 메모이제이션
  const logIncrementHandler = useCallback(() => {
    console.log('[TRACE] Logger: Increment action detected with detailed tracing');
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: increment');
  }, []);

  const logDecrementHandler = useCallback(() => {
    console.log('[TRACE] Logger: Decrement action detected with detailed tracing');
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: decrement');
  }, []);

  const logSetCountHandler = useCallback((payload: number) => {
    console.log('[TRACE] Logger: SetCount action detected with payload:', payload);
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: setCount');
  }, []);

  const logResetHandler = useCallback(() => {
    console.log('[TRACE] Logger: Reset action detected with detailed tracing');
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: reset');
  }, []);

  useActionHandler('increment', logIncrementHandler, { priority: 4 });
  useActionHandler('decrement', logDecrementHandler, { priority: 4 });
  useActionHandler('setCount', logSetCountHandler, { priority: 4 });
  useActionHandler('reset', logResetHandler, { priority: 4 });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Logger Component (TRACE level)</h3>
      <p>Check console for detailed TRACE logs</p>
      <p>TRACE 레벨에서는 다음 정보가 로깅됩니다:</p>
      <ul>
        <li>액션 디스패치 시작/완료</li>
        <li>핸들러 실행 시작/완료</li>
        <li>타임스탬프 정보</li>
        <li>페이로드 정보</li>
        <li>성능 메트릭</li>
      </ul>
    </div>
  );
}

function App() {
  console.log('[TRACE] App component mounted with TRACE level logging');
  
  return (
    <Provider>
      <div style={{ padding: '20px' }}>
        <h1>Context Action Test App</h1>
        <p>This app demonstrates the usage of @context-action/core library with TRACE level logging</p>
        <Counter />
        <Logger />
      </div>
    </Provider>
  );
}

export default App;
