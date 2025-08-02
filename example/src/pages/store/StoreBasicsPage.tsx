import React, { useState, useEffect, useCallback } from 'react';
import { Store, createStore, useStoreValue, useStore } from '@context-action/react';

// Store 인스턴스 생성
const messageStore = createStore('message', 'Hello, Context-Action!');
const counterStore = createStore('counter', 0);
const userStore = createStore('user', { name: 'John Doe', email: 'john@example.com' });

// 커스텀 훅 - 메시지 스토어 관리
function useMessageDemo() {
  const message = useStoreValue(messageStore);
  
  const updateMessage = useCallback((newMessage: string) => {
    messageStore.setValue(newMessage);
  }, []);
  
  const resetMessage = useCallback(() => {
    messageStore.setValue('Hello, Context-Action!');
  }, []);
  
  return { message, updateMessage, resetMessage };
}

// 커스텀 훅 - 카운터 스토어 관리
function useCounterDemo() {
  const count = useStoreValue(counterStore);
  
  const increment = useCallback(() => {
    counterStore.update(prev => prev + 1);
  }, []);
  
  const decrement = useCallback(() => {
    counterStore.update(prev => prev - 1);
  }, []);
  
  const addValue = useCallback((value: number) => {
    counterStore.update(prev => prev + value);
  }, []);
  
  const reset = useCallback(() => {
    counterStore.setValue(0);
  }, []);
  
  return { count, increment, decrement, addValue, reset };
}

// 커스텀 훅 - 사용자 스토어 관리
function useUserDemo() {
  const user = useStoreValue(userStore);
  
  const updateName = useCallback((name: string) => {
    userStore.update(prev => ({ ...prev, name }));
  }, []);
  
  const updateEmail = useCallback((email: string) => {
    userStore.update(prev => ({ ...prev, email }));
  }, []);
  
  const resetUser = useCallback(() => {
    userStore.setValue({ name: 'John Doe', email: 'john@example.com' });
  }, []);
  
  return { user, updateName, updateEmail, resetUser };
}

// 메시지 데모 컴포넌트
function MessageDemo() {
  const { message, updateMessage, resetMessage } = useMessageDemo();
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      updateMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  return (
    <div className="demo-card">
      <h3>String Store Demo</h3>
      <div className="store-display">
        <div className="store-value">{message}</div>
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new message"
          className="text-input"
        />
        <button type="submit" className="btn btn-primary">
          Update
        </button>
      </form>
      <button onClick={resetMessage} className="btn btn-secondary">
        Reset
      </button>
    </div>
  );
}

// 카운터 데모 컴포넌트
function CounterDemo() {
  const { count, increment, decrement, addValue, reset } = useCounterDemo();
  
  return (
    <div className="demo-card">
      <h3>Number Store Demo</h3>
      <div className="counter-display">
        <span className="count-value">{count}</span>
      </div>
      <div className="button-group">
        <button onClick={increment} className="btn btn-primary">
          +1
        </button>
        <button onClick={decrement} className="btn btn-primary">
          -1
        </button>
        <button onClick={() => addValue(5)} className="btn btn-secondary">
          +5
        </button>
        <button onClick={() => addValue(10)} className="btn btn-secondary">
          +10
        </button>
        <button onClick={reset} className="btn btn-danger">
          Reset
        </button>
      </div>
    </div>
  );
}

// 사용자 데모 컴포넌트
function UserDemo() {
  const { user, updateName, updateEmail, resetUser } = useUserDemo();
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  
  const handleUpdateName = () => {
    if (nameInput.trim()) {
      updateName(nameInput.trim());
      setNameInput('');
    }
  };
  
  const handleUpdateEmail = () => {
    if (emailInput.trim()) {
      updateEmail(emailInput.trim());
      setEmailInput('');
    }
  };
  
  return (
    <div className="demo-card">
      <h3>Object Store Demo</h3>
      <div className="user-display">
        <div className="user-field">
          <strong>Name:</strong> {user.name}
        </div>
        <div className="user-field">
          <strong>Email:</strong> {user.email}
        </div>
      </div>
      
      <div className="user-controls">
        <div className="control-group">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="New name"
            className="text-input small"
          />
          <button onClick={handleUpdateName} className="btn btn-primary btn-small">
            Update Name
          </button>
        </div>
        
        <div className="control-group">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="New email"
            className="text-input small"
          />
          <button onClick={handleUpdateEmail} className="btn btn-primary btn-small">
            Update Email
          </button>
        </div>
        
        <button onClick={resetUser} className="btn btn-danger">
          Reset User
        </button>
      </div>
    </div>
  );
}

// 라이브 스토어 모니터
function StoreMonitor() {
  const message = useStoreValue(messageStore);
  const count = useStoreValue(counterStore);
  const user = useStoreValue(userStore);
  
  return (
    <div className="demo-card monitor-card">
      <h3>Live Store Monitor</h3>
      <div className="monitor-grid">
        <div className="monitor-item">
          <div className="monitor-label">Message Store:</div>
          <div className="monitor-value">"{message}"</div>
        </div>
        <div className="monitor-item">
          <div className="monitor-label">Counter Store:</div>
          <div className="monitor-value">{count}</div>
        </div>
        <div className="monitor-item">
          <div className="monitor-label">User Store:</div>
          <div className="monitor-value">
            {JSON.stringify(user, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreBasicsPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Store System Basics</h1>
        <p className="page-description">
          Learn the fundamentals of the Store system - reactive state management,
          subscriptions, and React integration with hooks.
        </p>
      </header>

      <div className="demo-grid">
        <MessageDemo />
        <CounterDemo />
        <UserDemo />
        <StoreMonitor />
        
        {/* Store Concepts */}
        <div className="demo-card info-card">
          <h3>Key Store Concepts</h3>
          <ul className="concept-list">
            <li>
              <strong>createStore():</strong> Factory function to create new store instances
            </li>
            <li>
              <strong>useStoreValue():</strong> React hook for reactive subscriptions
            </li>
            <li>
              <strong>setValue():</strong> Replace the entire store value
            </li>
            <li>
              <strong>update():</strong> Update using a callback function
            </li>
            <li>
              <strong>getSnapshot():</strong> Get current value without subscription
            </li>
          </ul>
        </div>
        
        {/* Store Features */}
        <div className="demo-card info-card">
          <h3>Store Features</h3>
          <ul className="feature-list">
            <li>✓ Type-safe operations</li>
            <li>✓ Automatic React re-renders</li>
            <li>✓ Immutable updates</li>
            <li>✓ Memory efficient</li>
            <li>✓ Cross-component state sharing</li>
          </ul>
        </div>
      </div>

      {/* Code Example */}
      <div className="code-example">
        <h3>Code Example</h3>
        <pre className="code-block">
{`// 1. Create stores
const messageStore = createStore('message', 'Hello!');
const counterStore = createStore('counter', 0);

// 2. Use in components
function MyComponent() {
  const message = useStoreValue(messageStore);
  const count = useStoreValue(counterStore);
  
  const updateMessage = () => {
    messageStore.setValue('Updated!');
  };
  
  const increment = () => {
    counterStore.update(prev => prev + 1);
  };
  
  return (
    <div>
      <p>{message} - Count: {count}</p>
      <button onClick={updateMessage}>Update</button>
      <button onClick={increment}>+1</button>
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export default StoreBasicsPage;