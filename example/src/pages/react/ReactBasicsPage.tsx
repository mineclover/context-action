import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';
import { useState, useCallback } from 'react';

// === 타입 정의 ===
interface ReactActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  updateMessage: string;
}

// === 컨텍스트 생성 ===
const { Provider, useAction, useActionHandler } =
  createActionContext<ReactActionMap>();

// === 스타일 객체 (컴포넌트 외부) ===
const styles = {
  container: {
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
  },
  countDisplay: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    margin: '20px 0',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer' as const,
  },
  incrementButton: {
    backgroundColor: '#28a745',
  },
  decrementButton: {
    backgroundColor: '#dc3545',
  },
  setCountButton: {
    backgroundColor: '#007bff',
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  sendButton: {
    backgroundColor: '#17a2b8',
  },
  logContainer: {
    height: '200px',
    overflow: 'auto' as const,
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    marginBottom: '10px',
  },
  emptyLog: {
    color: '#6c757d',
  },
  logEntry: {
    marginBottom: '5px',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  },
  codeExample: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  pre: {
    overflow: 'auto' as const,
    fontSize: '14px',
  },
} as const;

const priority1 ={ priority: 1 };


// === 커스텀 훅 ===
function useCounter() {
  const [count, setCount] = useState(0);

  const incrementHandler = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrementHandler = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const setCountHandler = useCallback((payload: number) => {
    setCount(payload);
  }, []);

  const resetHandler = useCallback(() => {
    setCount(0);
  }, []);

  // 액션 핸들러 등록
  useActionHandler('increment', incrementHandler, priority1);
  useActionHandler('decrement', decrementHandler, priority1);
  useActionHandler('setCount', setCountHandler, priority1);
  useActionHandler('reset', resetHandler, priority1);

  return { count };
}

function useLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  const incrementLogHandler = useCallback(() => {
    addLog('Increment action detected');
  }, [addLog]);

  const decrementLogHandler = useCallback(() => {
    addLog('Decrement action detected');
  }, [addLog]);

  const setCountLogHandler = useCallback((payload: number) => {
    addLog(`SetCount action detected: ${payload}`);
  }, [addLog]);

  const resetLogHandler = useCallback(() => {
    addLog('Reset action detected');
    setLogs([]);
  }, [addLog]);

  const updateMessageHandler = useCallback((message: string) => {
    addLog(`Custom message: ${message}`);
  }, [addLog]);

  // 액션 핸들러 등록
  useActionHandler('increment', incrementLogHandler, { priority: 0 });
  useActionHandler('decrement', decrementLogHandler, { priority: 0 });
  useActionHandler('setCount', setCountLogHandler, { priority: 0 });
  useActionHandler('reset', resetLogHandler, { priority: 0 });
  useActionHandler('updateMessage', updateMessageHandler, { priority: 0 });

  return { logs };
}

function useMessageSender() {
  const [message, setMessage] = useState('');
  
  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    setMessage,
    clearMessage,
  };
}

function useCounterActions() {
  const dispatch = useAction();

  return {
    increment: useCallback(() => dispatch('increment'), [dispatch]),
    decrement: useCallback(() => dispatch('decrement'), [dispatch]),
    setCount: useCallback((value: number) => dispatch('setCount', value), [dispatch]),
    reset: useCallback(() => dispatch('reset'), [dispatch]),
  };
}

function useMessageActions() {
  const dispatch = useAction();

  return {
    sendMessage: useCallback((message: string) => dispatch('updateMessage', message), [dispatch]),
  };
}

// === 순수 뷰 컴포넌트 ===
function CounterView({ 
  count, 
  onIncrement, 
  onDecrement, 
  onSetCount, 
  onReset 
}: {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetCount: () => void;
  onReset: () => void;
}) {
  return (
    <div style={styles.container}>
      <h3>Counter Component</h3>
      <div style={styles.countDisplay}>
        Count: {count}
      </div>

      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={onIncrement}
          style={{ ...styles.button, ...styles.incrementButton }}
        >
          +1
        </button>

        <button
          type="button"
          onClick={onDecrement}
          style={{ ...styles.button, ...styles.decrementButton }}
        >
          -1
        </button>

        <button
          type="button"
          onClick={onSetCount}
          style={{ ...styles.button, ...styles.setCountButton }}
        >
          Set to 10
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{ ...styles.button, ...styles.resetButton }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function LoggerView({ logs }: { logs: string[] }) {
  return (
    <div style={styles.container}>
      <h3>Logger Component</h3>
      <div style={styles.logContainer}>
        {logs.length === 0 ? (
          <div style={styles.emptyLog}>No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={styles.logEntry}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessageSenderView({
  message,
  onMessageChange,
  onSend,
  onKeyDown,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div style={styles.container}>
      <h3>Message Sender</h3>
      <div style={styles.inputGroup}>
        <input
          type="text"
          value={message}
          onChange={e => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter a message..."
          style={styles.input}
        />
        <button
          type="button"
          onClick={onSend}
          style={{ ...styles.button, ...styles.sendButton }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// === 컨테이너 컴포넌트 ===
function Counter() {
  const { count } = useCounter();
  const { increment, decrement, setCount, reset } = useCounterActions();

  return (
    <CounterView
      count={count}
      onIncrement={increment}
      onDecrement={decrement}
      onSetCount={() => setCount(10)}
      onReset={reset}
    />
  );
}

function Logger() {
  const { logs } = useLogger();
  return <LoggerView logs={logs} />;
}

function MessageSender() {
  const { message, setMessage, clearMessage } = useMessageSender();
  const { sendMessage } = useMessageActions();

  const handleSend = useCallback(() => {
    if (message.trim()) {
      sendMessage(message);
      clearMessage();
    }
  }, [message, sendMessage, clearMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  }, [handleSend]);

  return (
    <MessageSenderView
      message={message}
      onMessageChange={setMessage}
      onSend={handleSend}
      onKeyDown={handleKeyDown}
    />
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

      <div style={styles.grid}>
        <Counter />
        <Logger />
        <MessageSender />
      </div>

      {/* Code Example */}
      <div style={styles.codeExample}>
        <h3>Code Example</h3>
        <pre style={styles.pre}>
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
  const dispatch = useAction();
  
  return (
    <button onClick={() => dispatch('increment')}>
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