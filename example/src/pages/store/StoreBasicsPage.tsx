import React, { useState, useEffect, useCallback } from 'react';
import { createStore, useStoreValue } from '@context-action/react';
import { PageWithLogMonitor, useActionLogger } from '../../components/LogMonitor';

// Store 인스턴스 생성
const messageStore = createStore('message', 'Hello, Context-Action!');
const counterStore = createStore('counter', 0);
const userStore = createStore('user', { name: 'John Doe', email: 'john@example.com' });

// 커스텀 훅 - 메시지 스토어 관리
function useMessageDemo() {
  const message = useStoreValue(messageStore);
  const { logAction } = useActionLogger();
  
  const updateMessage = useCallback((newMessage: string) => {
    logAction('updateMessage', { oldMessage: message, newMessage });
    messageStore.setValue(newMessage);
  }, [message, logAction]);
  
  const resetMessage = useCallback(() => {
    logAction('resetMessage', { message });
    messageStore.setValue('Hello, Context-Action!');
  }, [message, logAction]);
  
  return { message, updateMessage, resetMessage };
}

// 커스텀 훅 - 카운터 스토어 관리
function useCounterDemo() {
  const count = useStoreValue(counterStore);
  const { logAction } = useActionLogger();
  
  const increment = useCallback(() => {
    logAction('increment', { currentCount: count });
    counterStore.update(prev => prev + 1);
  }, [count, logAction]);
  
  const decrement = useCallback(() => {
    logAction('decrement', { currentCount: count });
    counterStore.update(prev => prev - 1);
  }, [count, logAction]);
  
  const addValue = useCallback((value: number) => {
    logAction('addValue', { currentCount: count, addedValue: value });
    counterStore.update(prev => prev + value);
  }, [count, logAction]);
  
  const reset = useCallback(() => {
    logAction('resetCounter', { currentCount: count });
    counterStore.setValue(0);
  }, [count, logAction]);
  
  return { count, increment, decrement, addValue, reset };
}

// 커스텀 훅 - 사용자 스토어 관리
function useUserDemo() {
  const user = useStoreValue(userStore);
  const { logAction } = useActionLogger();
  
  const updateName = useCallback((name: string) => {
    logAction('updateUserName', { oldName: user?.name, newName: name });
    userStore.update(prev => ({ ...prev, name }));
  }, [user?.name, logAction]);
  
  const updateEmail = useCallback((email: string) => {
    logAction('updateUserEmail', { oldEmail: user?.email, newEmail: email });
    userStore.update(prev => ({ ...prev, email }));
  }, [user?.email, logAction]);
  
  const resetUser = useCallback(() => {
    logAction('resetUser', { currentUser: user });
    userStore.setValue({ name: 'John Doe', email: 'john@example.com' });
  }, [user, logAction]);
  
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
  const [addValueInput, setAddValueInput] = useState('');

  const handleAddValue = () => {
    const value = parseInt(addValueInput);
    if (!isNaN(value)) {
      addValue(value);
      setAddValueInput('');
    }
  };

  return (
    <div className="demo-card">
      <h3>Number Store Demo</h3>
      <div className="store-display">
        <div className="store-value">{count}</div>
      </div>
      <div className="button-group">
        <button onClick={increment} className="btn btn-primary">
          +1
        </button>
        <button onClick={decrement} className="btn btn-primary">
          -1
        </button>
      </div>
      <div className="add-value-form">
        <input
          type="number"
          value={addValueInput}
          onChange={(e) => setAddValueInput(e.target.value)}
          placeholder="Enter value to add"
          className="number-input"
        />
        <button onClick={handleAddValue} className="btn btn-secondary">
          Add
        </button>
      </div>
      <button onClick={reset} className="btn btn-secondary">
        Reset
      </button>
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
              <div className="store-display">
          <div className="user-info">
            <div><strong>Name:</strong> {user?.name ?? 'Unknown'}</div>
            <div><strong>Email:</strong> {user?.email ?? 'Unknown'}</div>
          </div>
        </div>
      <div className="user-form">
        <div className="form-group">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter new name"
            className="text-input"
          />
          <button onClick={handleUpdateName} className="btn btn-primary">
            Update Name
          </button>
        </div>
        <div className="form-group">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter new email"
            className="text-input"
          />
          <button onClick={handleUpdateEmail} className="btn btn-primary">
            Update Email
          </button>
        </div>
      </div>
      <button onClick={resetUser} className="btn btn-secondary">
        Reset User
      </button>
    </div>
  );
}

function StoreBasicsPage() {
  return (
    <PageWithLogMonitor pageId="store-basics" title="Store System Basics">
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
    </PageWithLogMonitor>
  );
}

export default StoreBasicsPage;