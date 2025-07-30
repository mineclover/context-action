import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

// 액션 타입 정의
interface HooksActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  toggleEnabled: undefined;
  logMessage: string;
}

// 컨텍스트 생성
const { Provider, useAction, useActionHandler } =
  createActionContext<HooksActionMap>();

// 커스텀 훅: 카운터 로직
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const dispatch = useAction();

  // 액션 핸들러 등록 - 컴포넌트별로 분리된 로직
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  });

  useActionHandler('decrement', () => {
    setCount(prev => prev - 1);
  });

  useActionHandler('setCount', (payload) => {
    setCount(payload);
  });

  useActionHandler('reset', () => {
    setCount(initialValue);
  });

  // 메모이제이션된 핸들러
  const handleIncrement = useCallback(() => {
    dispatch('increment');
  }, [dispatch]);

  const handleDecrement = useCallback(() => {
    dispatch('decrement');
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch('reset');
  }, [dispatch]);

  return {
    count,
    handleIncrement,
    handleDecrement,
    handleReset,
    dispatch,
  };
}

// 조건부 액션 핸들러를 보여주는 컴포넌트
function ConditionalHandlerDemo() {
  const [isEnabled, setIsEnabled] = useState(true);
  const dispatch = useAction();

  // 조건부 핸들러 등록
  useActionHandler(
    'toggleEnabled',
    () => {
      setIsEnabled(prev => !prev);
    },
    { priority: 1 }
  );

  // 조건에 따라 핸들러 동작이 달라지는 예시
  useEffect(() => {
    let unregister: (() => void) | undefined;

    if (isEnabled) {
      // enabled일 때만 로그 핸들러 등록
      const { useActionHandler: registerHandler } = createActionContext<HooksActionMap>();
      // 주의: 실제로는 이런 방식보다는 조건부 로직을 핸들러 내부에서 처리하는 것이 좋습니다
    }

    return () => {
      if (unregister) {
        unregister();
      }
    };
  }, [isEnabled]);

  // 더 나은 방식: 조건부 로직을 핸들러 내부에서 처리
  useActionHandler('logMessage', (message) => {
    if (isEnabled) {
      console.log(`[ENABLED] ${message}`);
    } else {
      console.log(`[DISABLED] Message ignored: ${message}`);
    }
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>조건부 액션 핸들러</h3>
      <p>상태: {isEnabled ? '활성화됨' : '비활성화됨'}</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => dispatch('toggleEnabled')}
          style={{
            padding: '8px 16px',
            backgroundColor: isEnabled ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isEnabled ? '비활성화' : '활성화'}
        </button>
        
        <button
          type="button"
          onClick={() => dispatch('logMessage', 'Test message from ConditionalHandler')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          로그 메시지 전송
        </button>
      </div>
    </div>
  );
}

// 메모이제이션 최적화 예시
function OptimizedCounter() {
  const { count, handleIncrement, handleDecrement, handleReset } = useCounter(0);

  // 비싼 계산의 메모이제이션
  const expensiveValue = useMemo(() => {
    console.log('Computing expensive value...');
    return count * count * count; // 세제곱 계산
  }, [count]);

  // 조건부 스타일 메모이제이션
  const countStyle = useMemo(() => ({
    fontSize: '24px',
    fontWeight: 'bold',
    color: count > 10 ? '#dc3545' : count < 0 ? '#ffc107' : '#28a745',
    margin: '20px 0',
  }), [count]);

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>최적화된 카운터 (커스텀 훅 사용)</h3>
      <div style={countStyle}>
        Count: {count}
      </div>
      <div style={{ margin: '10px 0', fontStyle: 'italic' }}>
        Expensive calculation (count³): {expensiveValue}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleIncrement}
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
          onClick={handleDecrement}
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
          onClick={handleReset}
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

// 동적 핸들러 등록/해제 예시
function DynamicHandlerDemo() {
  const [handlers, setHandlers] = useState<string[]>([]);
  const dispatch = useAction();

  const addHandler = () => {
    const handlerId = `handler_${Date.now()}`;
    setHandlers(prev => [...prev, handlerId]);
  };

  const removeHandler = (id: string) => {
    setHandlers(prev => prev.filter(h => h !== id));
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>동적 핸들러 관리</h3>
      <p>런타임에 핸들러를 추가하고 제거할 수 있습니다.</p>
      
      <div style={{ margin: '10px 0' }}>
        <button
          type="button"
          onClick={addHandler}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
          }}
        >
          핸들러 추가
        </button>
        
        <button
          type="button"
          onClick={() => dispatch('logMessage', 'Dynamic handler test message')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          메시지 전송
        </button>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>등록된 핸들러들:</h4>
        {handlers.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>등록된 핸들러가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {handlers.map(id => (
              <DynamicHandler key={id} id={id} onRemove={() => removeHandler(id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DynamicHandler({ id, onRemove }: { id: string; onRemove: () => void }) {
  useActionHandler('logMessage', (message) => {
    console.log(`[${id}] Received: ${message}`);
  });

  return (
    <li style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '5px 10px',
      margin: '5px 0',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
    }}>
      <span>{id}</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          padding: '4px 8px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          fontSize: '12px',
        }}
      >
        제거
      </button>
    </li>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <OptimizedCounter />
        <ConditionalHandlerDemo />
        <DynamicHandlerDemo />
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>커스텀 훅 예시</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
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
