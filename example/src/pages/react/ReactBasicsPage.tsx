import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';
import { useState } from 'react';

// 액션 타입 정의
interface ReactActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  updateMessage: string;
}

// 컨텍스트 생성
const { Provider, useAction, useActionHandler } =
  createActionContext<ReactActionMap>();

function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();

  // 액션 핸들러 등록
  useActionHandler(
    'increment',
    () => {
      setCount(prev => prev + 1);
    },
    { priority: 1 }
  );

  useActionHandler(
    'decrement',
    () => {
      setCount(prev => prev - 1);
    },
    { priority: 1 }
  );

  useActionHandler(
    'setCount',
    payload => {
      setCount(payload);
    },
    { priority: 1 }
  );

  useActionHandler(
    'reset',
    () => {
      setCount(0);
    },
    { priority: 1 }
  );

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
      }}
    >
      <h3>Counter Component</h3>
      <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0' }}>
        Count: {count}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => dispatch('increment')}
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
          onClick={() => dispatch('decrement')}
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
          onClick={() => dispatch('setCount', 10)}
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
          onClick={() => dispatch('reset')}
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
    </div>
  );
}

function Logger() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useActionHandler(
    'increment',
    () => {
      addLog('Increment action detected');
    },
    { priority: 0 }
  );

  useActionHandler(
    'decrement',
    () => {
      addLog('Decrement action detected');
    },
    { priority: 0 }
  );

  useActionHandler(
    'setCount',
    payload => {
      addLog(`SetCount action detected: ${payload}`);
    },
    { priority: 0 }
  );

  useActionHandler(
    'reset',
    () => {
      addLog('Reset action detected');
      setLogs([]);
    },
    { priority: 0 }
  );

  useActionHandler(
    'updateMessage',
    message => {
      addLog(`Custom message: ${message}`);
    },
    { priority: 0 }
  );

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
      }}
    >
      <h3>Logger Component</h3>
      <div
        style={{
          height: '200px',
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          marginBottom: '10px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#6c757d' }}>No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessageSender() {
  const [message, setMessage] = useState('');
  const dispatch = useAction();

  const handleSend = () => {
    if (message.trim()) {
      dispatch('updateMessage', message);
      setMessage('');
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
      }}
    >
      <h3>Message Sender</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Enter a message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ReactBasicsContent() {
  return (
    <div>
      <h1>React Integration - Basics</h1>
      <p>
        React 통합의 기본적인 사용법을 보여줍니다. createActionContext를 사용해
        컨텍스트를 생성하고, useAction과 useActionHandler 훅을 활용합니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        <Counter />
        <Logger />
        <MessageSender />
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
          {`// 1. 액션 컨텍스트 생성
const { Provider, useAction, useActionHandler } = 
  createActionContext<ActionMap>();

// 2. 컴포넌트에서 액션 핸들러 등록
function MyComponent() {
  const [count, setCount] = useState(0);
  
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  }, { priority: 1 });
  
  // ...
}

// 3. 액션 디스패치
function AnotherComponent() {
  const action = useAction();
  
  return (
    <button onClick={() => action.dispatch('increment')}>
      Increment
    </button>
  );
}

// 4. Provider로 감싸기
<Provider>
  <MyComponent />
  <AnotherComponent />
</Provider>`}
        </pre>
      </div>
    </div>
  );
}

export function ReactBasicsPage() {
  return (
    <Provider>
      <ReactBasicsContent />
    </Provider>
  );
}
