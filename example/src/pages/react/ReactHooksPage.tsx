import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

// === 타입 정의 ===
interface HooksActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  toggleEnabled: undefined;
  logMessage: string;
}

// === 컨텍스트 생성 ===
const { Provider, useAction, useActionHandler } =
  createActionContext<HooksActionMap>();

// === 스타일 객체 (컴포넌트 외부) ===
const styles = {
  container: {
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginTop: '30px',
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
  primaryButton: {
    backgroundColor: '#007bff',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  countDisplay: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    margin: '20px 0',
  },
  expensiveValue: {
    margin: '10px 0',
    fontStyle: 'italic' as const,
  },
  handlerList: {
    listStyle: 'none',
    padding: 0,
  },
  handlerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
    margin: '5px 0',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'pointer' as const,
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
  emptyState: {
    color: '#6c757d',
    fontStyle: 'italic' as const,
  },
} as const;

// === 커스텀 훅 ===
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

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
    setCount(initialValue);
  }, [initialValue]);

  // 액션 핸들러 등록
  useActionHandler('increment', incrementHandler);
  useActionHandler('decrement', decrementHandler);
  useActionHandler('setCount', setCountHandler);
  useActionHandler('reset', resetHandler);

  return { count };
}

function useCounterActions() {
  const dispatch = useAction();

  return {
    handleIncrement: useCallback(() => dispatch('increment'), [dispatch]),
    handleDecrement: useCallback(() => dispatch('decrement'), [dispatch]),
    handleReset: useCallback(() => dispatch('reset'), [dispatch]),
  };
}

function useConditionalHandler() {
  const [isEnabled, setIsEnabled] = useState(true);

  const toggleHandler = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const logMessageHandler = useCallback((message: string) => {
    if (isEnabled) {
      console.log(`[ENABLED] ${message}`);
    } else {
      console.log(`[DISABLED] Message ignored: ${message}`);
    }
  }, [isEnabled]);

  // 액션 핸들러 등록
  useActionHandler('toggleEnabled', toggleHandler, { priority: 1 });
  useActionHandler('logMessage', logMessageHandler);

  return { isEnabled };
}

function useConditionalActions() {
  const dispatch = useAction();

  return {
    toggleEnabled: useCallback(() => dispatch('toggleEnabled'), [dispatch]),
    sendLogMessage: useCallback((message: string) => dispatch('logMessage', message), [dispatch]),
  };
}

function useDynamicHandlers() {
  const [handlers, setHandlers] = useState<string[]>([]);

  const addHandler = useCallback(() => {
    const handlerId = `handler_${Date.now()}`;
    setHandlers(prev => [...prev, handlerId]);
  }, []);

  const removeHandler = useCallback((id: string) => {
    setHandlers(prev => prev.filter(h => h !== id));
  }, []);

  return {
    handlers,
    addHandler,
    removeHandler,
  };
}

function useDynamicActions() {
  const dispatch = useAction();

  return {
    sendMessage: useCallback((message: string) => dispatch('logMessage', message), [dispatch]),
  };
}

// === 순수 뷰 컴포넌트 ===
function OptimizedCounterView({
  count,
  expensiveValue,
  countStyle,
  onIncrement,
  onDecrement,
  onReset,
}: {
  count: number;
  expensiveValue: number;
  countStyle: React.CSSProperties;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}) {
  return (
    <div style={styles.container}>
      <h3>최적화된 카운터 (커스텀 훅 사용)</h3>
      <div style={countStyle}>
        Count: {count}
      </div>
      <div style={styles.expensiveValue}>
        Expensive calculation (count³): {expensiveValue}
      </div>
      
      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={onIncrement}
          style={{ ...styles.button, ...styles.successButton }}
        >
          +1
        </button>
        
        <button
          type="button"
          onClick={onDecrement}
          style={{ ...styles.button, ...styles.dangerButton }}
        >
          -1
        </button>
        
        <button
          type="button"
          onClick={onReset}
          style={{ ...styles.button, ...styles.secondaryButton }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function ConditionalHandlerView({
  isEnabled,
  onToggle,
  onSendMessage,
}: {
  isEnabled: boolean;
  onToggle: () => void;
  onSendMessage: () => void;
}) {
  return (
    <div style={styles.container}>
      <h3>조건부 액션 핸들러</h3>
      <p>상태: {isEnabled ? '활성화됨' : '비활성화됨'}</p>
      
      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={onToggle}
          style={{
            ...styles.button,
            backgroundColor: isEnabled ? '#dc3545' : '#28a745',
          }}
        >
          {isEnabled ? '비활성화' : '활성화'}
        </button>
        
        <button
          type="button"
          onClick={onSendMessage}
          style={{ ...styles.button, ...styles.infoButton }}
        >
          로그 메시지 전송
        </button>
      </div>
    </div>
  );
}

function DynamicHandlerView({
  handlers,
  onAddHandler,
  onSendMessage,
  onRemoveHandler,
}: {
  handlers: string[];
  onAddHandler: () => void;
  onSendMessage: () => void;
  onRemoveHandler: (id: string) => void;
}) {
  return (
    <div style={styles.container}>
      <h3>동적 핸들러 관리</h3>
      <p>런타임에 핸들러를 추가하고 제거할 수 있습니다.</p>
      
      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={onAddHandler}
          style={{ ...styles.button, ...styles.primaryButton }}
        >
          핸들러 추가
        </button>
        
        <button
          type="button"
          onClick={onSendMessage}
          style={{ ...styles.button, ...styles.infoButton }}
        >
          메시지 전송
        </button>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>등록된 핸들러들:</h4>
        {handlers.length === 0 ? (
          <p style={styles.emptyState}>등록된 핸들러가 없습니다.</p>
        ) : (
          <ul style={styles.handlerList}>
            {handlers.map(id => (
              <HandlerItemView
                key={id}
                id={id}
                onRemove={() => onRemoveHandler(id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HandlerItemView({
  id,
  onRemove,
}: {
  id: string;
  onRemove: () => void;
}) {
  return (
    <li style={styles.handlerItem}>
      <span>{id}</span>
      <button
        type="button"
        onClick={onRemove}
        style={styles.removeButton}
      >
        제거
      </button>
    </li>
  );
}

// === 컨테이너 컴포넌트 ===
function OptimizedCounter() {
  const { count } = useCounter(0);
  const { handleIncrement, handleDecrement, handleReset } = useCounterActions();

  // 비싼 계산의 메모이제이션
  const expensiveValue = useMemo(() => {
    console.log('Computing expensive value...');
    return count * count * count; // 세제곱 계산
  }, [count]);

  // 조건부 스타일 메모이제이션
  const countStyle = useMemo(() => ({
    ...styles.countDisplay,
    color: count > 10 ? '#dc3545' : count < 0 ? '#ffc107' : '#28a745',
  }), [count]);

  return (
    <OptimizedCounterView
      count={count}
      expensiveValue={expensiveValue}
      countStyle={countStyle}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onReset={handleReset}
    />
  );
}

function ConditionalHandlerDemo() {
  const { isEnabled } = useConditionalHandler();
  const { toggleEnabled, sendLogMessage } = useConditionalActions();

  const handleSendMessage = useCallback(() => {
    sendLogMessage('Test message from ConditionalHandler');
  }, [sendLogMessage]);

  return (
    <ConditionalHandlerView
      isEnabled={isEnabled}
      onToggle={toggleEnabled}
      onSendMessage={handleSendMessage}
    />
  );
}

function DynamicHandlerDemo() {
  const { handlers, addHandler, removeHandler } = useDynamicHandlers();
  const { sendMessage } = useDynamicActions();

  const handleSendMessage = useCallback(() => {
    sendMessage('Dynamic handler test message');
  }, [sendMessage]);

  return (
    <DynamicHandlerView
      handlers={handlers}
      onAddHandler={addHandler}
      onSendMessage={handleSendMessage}
      onRemoveHandler={removeHandler}
    />
  );
}

function DynamicHandler({ id, onRemove }: { id: string; onRemove: () => void }) {
  const logMessageHandler = useCallback((message: string) => {
    console.log(`[${id}] Received: ${message}`);
  }, [id]);

  useActionHandler('logMessage', logMessageHandler);

  return (
    <HandlerItemView id={id} onRemove={onRemove} />
  );
}

function ReactHooksContent() {
  return (
    <div>
      <h1>React Integration - Hooks</h1>
      <p>
        커스텀 훅과 고급 상태 관리 패턴을 다룹니다. 
        액션 핸들러의 조건부 등록, 메모이제이션 최적화, 동적 핸들러 관리 등을 보여줍니다.
      </p>

      <div style={styles.grid}>
        <OptimizedCounter />
        <ConditionalHandlerDemo />
        <DynamicHandlerDemo />
      </div>

      {/* Code Example */}
      <div style={styles.codeExample}>
        <h3>커스텀 훅 예시</h3>
        <pre style={styles.pre}>
{`// 1. 커스텀 훅 정의
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const dispatch = useAction();

  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  });

  const handleIncrement = useCallback(() => {
    dispatch('increment');
  }, [dispatch]);

  return { count, handleIncrement };
}

// 2. 컴포넌트에서 사용
function MyComponent() {
  const { count, handleIncrement } = useCounter(0);
  
  return (
    <button onClick={handleIncrement}>
      Count: {count}
    </button>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export function ReactHooksPage() {
  return (
    <Provider>
      <ReactHooksContent />
    </Provider>
  );
}