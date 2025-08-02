import React, { useState, useEffect, useCallback } from 'react';
import { useStoreValue, PageStores } from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 커스텀 훅 - 메시지 스토어 관리 (PageStores 패턴 사용)
function useMessageDemo() {
  // PageStores 영역 내에서 'message' Store 사용 - 페이지별로 독립적
  const messageStore = PageStores.useStore('message', 'Hello, Context-Action!', {
    strategy: 'reference', // 단순 string이므로 reference 비교
    debug: true
  });
  
  const message = useStoreValue(messageStore);
  const { logAction } = useActionLoggerWithToast();
  
  const updateMessage = useCallback((newMessage: string) => {
    logAction('updateMessage', { oldMessage: message, newMessage });
    messageStore.setValue(newMessage);
  }, [logAction, message, messageStore]);
  
  const resetMessage = useCallback(() => {
    logAction('resetMessage', { message });
    messageStore.setValue('Hello, Context-Action!');
  }, [logAction, message, messageStore]);
  
  return { message, updateMessage, resetMessage };
}

// 커스텀 훅 - 카운터 스토어 관리 (PageStores 패턴 사용)
function useCounterDemo() {
  // PageStores 영역 내에서 'counter' Store 사용 - 페이지별로 독립적
  const counterStore = PageStores.useStore('counter', 0, {
    strategy: 'reference', // 숫자이므로 reference 비교
    debug: true
  });
  
  const count = useStoreValue(counterStore);
  const { logAction } = useActionLoggerWithToast();
  
  const increment = useCallback(() => {
    logAction('increment', { currentCount: count });
    counterStore.update(prev => prev + 1);
  }, [logAction, count, counterStore]);
  
  const decrement = useCallback(() => {
    logAction('decrement', { currentCount: count });
    counterStore.update(prev => prev - 1);
  }, [logAction, count, counterStore]);
  
  const addValue = useCallback((value: number) => {
    logAction('addValue', { currentCount: count, addedValue: value });
    counterStore.update(prev => prev + value);
  }, [logAction, count, counterStore]);
  
  const reset = useCallback(() => {
    logAction('resetCounter', { currentCount: count });
    counterStore.setValue(0);
  }, [logAction, count, counterStore]);
  
  return { count, increment, decrement, addValue, reset };
}

// 커스텀 훅 - 사용자 스토어 관리 (PageStores 패턴 사용)
function useUserDemo() {
  // PageStores 영역 내에서 'user' Store 사용 - 페이지별로 독립적
  const userStore = PageStores.useStore('user', { name: 'John Doe', email: 'john@example.com' }, {
    strategy: 'shallow', // 객체의 첫 번째 레벨 프로퍼티 비교
    debug: true
  });
  
  const user = useStoreValue(userStore);
  const { logAction } = useActionLoggerWithToast();
  
  const updateName = useCallback((name: string) => {
    logAction('updateUserName', { oldName: user?.name, newName: name });
    userStore.update(prev => ({ ...prev, name }));
  }, [logAction, user, userStore]);
  
  const updateEmail = useCallback((email: string) => {
    logAction('updateUserEmail', { oldEmail: user?.email, newEmail: email });
    userStore.update(prev => ({ ...prev, email }));
  }, [logAction, user, userStore]);
  
  const resetUser = useCallback(() => {
    logAction('resetUser', { currentUser: user });
    userStore.setValue({ name: 'John Doe', email: 'john@example.com' });
  }, [logAction, user, userStore]);
  
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
      <PageStores.Provider registryId="store-basics-demo">
        <div className="page-container">
          <header className="page-header">
            <h1>Store System Basics</h1>
            <p className="page-description">
              Learn the fundamentals of the Store system - reactive state management,
              subscriptions, and React integration with hooks.
            </p>
            <div className="architecture-info">
              <small className="text-gray-600">
                🏗️ <strong>Architecture:</strong> Each page instance has its own isolated Store registry.
                Multiple tabs or instances will have completely independent state.
              </small>
            </div>
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

          {/* Code Example - Updated for new Context Store Pattern */}
          <div className="code-example">
            <h3>New Context Store Pattern</h3>
            <pre className="code-block">
{`// 1. Use Context Store Pattern for automatic registry isolation
import { PageStores, useStoreValue } from '@context-action/react';

function MyPage() {
  return (
    <PageStores.Provider registryId="my-page">
      <MyComponent />
    </PageStores.Provider>
  );
}

// 2. Use stores within the provider context
function MyComponent() {
  // Automatically isolated per provider instance
  const messageStore = PageStores.useStore('message', 'Hello!');
  const counterStore = PageStores.useStore('counter', 0);
  
  const message = useStoreValue(messageStore);
  const count = useStoreValue(counterStore);
  
  const updateMessage = () => messageStore.setValue('Updated!');
  const increment = () => counterStore.update(prev => prev + 1);
  
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
      </PageStores.Provider>
    </PageWithLogMonitor>
  );
}

export default StoreBasicsPage;