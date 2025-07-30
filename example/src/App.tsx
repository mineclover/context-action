import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';
import { useCallback, useState } from 'react';

// 액션 타입 정의
interface AppActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
}

const priority1 = { priority: 1 };

// 컨텍스트 생성
const { Provider, useAction, useActionHandler } =
  createActionContext<AppActionMap>();

function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();

  // useCallback으로 핸들러 메모이제이션
  const incrementHandler = useCallback(() => {
    setCount((prev) => prev + 1);
    console.log('Counter incremented');
  }, []);

  const decrementHandler = useCallback(() => {
    setCount((prev) => prev - 1);
    console.log('Counter decremented');
  }, []);

  const setCountHandler = useCallback((payload: number) => {
    setCount(payload);
    console.log('Counter set to:', payload);
  }, []);

  const resetHandler = useCallback(() => {
    setCount(0);
    console.log('Counter reset');
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
    console.log('Logger: Increment action detected');
  }, []);

  const logDecrementHandler = useCallback(() => {
    console.log('Logger: Decrement action detected');
  }, []);

  useActionHandler('increment', logIncrementHandler, { priority: 4 });
  useActionHandler('decrement', logDecrementHandler, { priority: 4 });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Logger Component</h3>
      <p>Check console for logs</p>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <div style={{ padding: '20px' }}>
        <h1>Context Action Test App</h1>
        <p>This app demonstrates the usage of @context-action/core library</p>
        <Counter />
        <Logger />
      </div>
    </Provider>
  );
}

export default App;
