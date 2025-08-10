import {
  createActionContextPattern,
  useStoreValue,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
  Input,
} from '../../components/ui';

// Store Basics 데모용 Action Context 패턴
const PageStores = createActionContextPattern('StoreBasics');

// 커스텀 훅 - 메시지 스토어 관리 (PageStores 패턴 사용)
function useMessageDemo() {
  // PageStores 영역 내에서 'message' Store 사용 - 페이지별로 독립적
  const messageStore = PageStores.useStore(
    'message',
    'Hello, Context-Action!',
    {
      strategy: 'reference', // 단순 string이므로 reference 비교
      debug: true,
      description: 'Message store for demo purposes',
      tags: ['demo', 'message'],
      version: '1.0.0',
    }
  );

  const message = useStoreValue(messageStore);
  const { logAction } = useActionLoggerWithToast();

  const updateMessage = useCallback(
    (newMessage: string) => {
      logAction('updateMessage', { oldMessage: message, newMessage });
      messageStore.setValue(newMessage);
    },
    [logAction, message, messageStore]
  );

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
    debug: true,
  });

  const count = useStoreValue(counterStore);
  const { logAction } = useActionLoggerWithToast();

  const increment = useCallback(() => {
    logAction('increment', { currentCount: count });
    counterStore.update((prev) => prev + 1);
  }, [logAction, count, counterStore]);

  const decrement = useCallback(() => {
    logAction('decrement', { currentCount: count });
    counterStore.update((prev) => prev - 1);
  }, [logAction, count, counterStore]);

  const addValue = useCallback(
    (value: number) => {
      logAction('addValue', { currentCount: count, addedValue: value });
      counterStore.update((prev) => prev + value);
    },
    [logAction, count, counterStore]
  );

  const reset = useCallback(() => {
    logAction('resetCounter', { currentCount: count });
    counterStore.setValue(0);
  }, [logAction, count, counterStore]);

  return { count, increment, decrement, addValue, reset };
}

// 커스텀 훅 - 사용자 스토어 관리 (PageStores 패턴 사용)
function useUserDemo() {
  // PageStores 영역 내에서 'user' Store 사용 - 페이지별로 독립적
  const userStore = PageStores.useStore(
    'user',
    { name: 'John Doe', email: 'john@example.com' },
    {
      strategy: 'shallow', // 객체의 첫 번째 레벨 프로퍼티 비교
      debug: true,
      description: 'User profile store with shallow comparison',
      tags: ['demo', 'user', 'profile'],
      version: '1.0.0',
    }
  );

  const user = useStoreValue(userStore);
  const { logAction } = useActionLoggerWithToast();

  const updateName = useCallback(
    (name: string) => {
      logAction('updateUserName', { oldName: user?.name, newName: name });
      userStore.update((prev) => ({ ...prev, name }));
    },
    [logAction, user, userStore]
  );

  const updateEmail = useCallback(
    (email: string) => {
      logAction('updateUserEmail', { oldEmail: user?.email, newEmail: email });
      userStore.update((prev) => ({ ...prev, email }));
    },
    [logAction, user, userStore]
  );

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
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        String Store Demo
      </h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xl font-mono text-center text-gray-800">
          "{message}"
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new message"
          className="w-full"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            Update Message
          </Button>
          <Button type="button" onClick={resetMessage} variant="secondary">
            Reset
          </Button>
        </div>
      </form>
    </DemoCard>
  );
}

// 카운터 데모 컴포넌트
function CounterDemo() {
  const { count, increment, decrement, addValue, reset } = useCounterDemo();
  const [addValueInput, setAddValueInput] = useState('');

  const handleAddValue = () => {
    const value = parseInt(addValueInput);
    if (!Number.isNaN(value)) {
      addValue(value);
      setAddValueInput('');
    }
  };

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Number Store Demo
      </h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-3xl font-bold text-center text-blue-600">
          {count}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          <Button onClick={increment} variant="primary">
            +1
          </Button>
          <Button onClick={decrement} variant="primary">
            -1
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={addValueInput}
            onChange={(e) => setAddValueInput(e.target.value)}
            placeholder="Enter value to add"
            className="flex-1"
          />
          <Button onClick={handleAddValue} variant="secondary">
            Add Value
          </Button>
        </div>
        <Button onClick={reset} variant="danger" className="w-full">
          Reset Counter
        </Button>
      </div>
    </DemoCard>
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
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Object Store Demo
      </h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Name:</span>
            <span className="text-gray-800">{user?.name ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Email:</span>
            <span className="text-gray-800">{user?.email ?? 'Unknown'}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter new name"
            className="flex-1"
          />
          <Button onClick={handleUpdateName} variant="primary">
            Update Name
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter new email"
            className="flex-1"
          />
          <Button onClick={handleUpdateEmail} variant="primary">
            Update Email
          </Button>
        </div>
        <Button onClick={resetUser} variant="secondary" className="w-full">
          Reset User
        </Button>
      </div>
    </DemoCard>
  );
}

// Registry 액션들을 테스트하기 위한 컴포넌트
function RegistryActionsDemo() {
  const { clearStores, clearActions, clearAll, removeStore } =
    PageStores.useRegistryActions();
  const registryInfo = PageStores.useRegistryInfo();

  return (
    <DemoCard variant="info">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Registry Management (New API)
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Registry Name:</strong> {registryInfo.name}
          </div>
          <div>
            <strong>Store Count:</strong> {registryInfo.storeCount}
          </div>
          <div className="col-span-2">
            <strong>Active Stores:</strong> {registryInfo.storeNames.join(', ')}
          </div>
          <div className="col-span-2">
            <strong>Initialized:</strong> {registryInfo.initialized.join(', ')}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={clearStores} variant="danger" size="sm">
            Clear Stores
          </Button>
          <Button onClick={clearActions} variant="danger" size="sm">
            Clear Actions
          </Button>
          <Button onClick={clearAll} variant="danger" size="sm">
            Clear All
          </Button>
          <Button
            onClick={() => removeStore('message')}
            variant="secondary"
            size="sm"
          >
            Remove Message Store
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

function StoreBasicsPage() {
  return (
    <PageWithLogMonitor
      pageId="store-basics"
      title="Store System Basics"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <PageStores.Provider registryId="store-basics-demo">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Store System Basics
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Learn the fundamentals of the Store system - reactive state
              management, subscriptions, and React integration with hooks.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🏗️ <strong>Architecture:</strong> Each page instance has its own
                isolated Store registry. Multiple tabs or instances will have
                completely independent state.
              </p>
            </div>
          </header>

          <div className="space-y-6">
            <MessageDemo />
            <CounterDemo />
            <UserDemo />

            {/* Registry Actions Demo - New API */}
            <RegistryActionsDemo />

            {/* Store Concepts */}
            <DemoCard variant="info">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Store Concepts
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col gap-1">
                  <strong className="text-gray-900 font-semibold">
                    createStore():
                  </strong>
                  <span>Factory function to create new store instances</span>
                </li>
                <li className="flex flex-col gap-1">
                  <strong className="text-gray-900 font-semibold">
                    useStoreValue():
                  </strong>
                  <span>React hook for reactive subscriptions</span>
                </li>
                <li className="flex flex-col gap-1">
                  <strong className="text-gray-900 font-semibold">
                    setValue():
                  </strong>
                  <span>Replace the entire store value</span>
                </li>
                <li className="flex flex-col gap-1">
                  <strong className="text-gray-900 font-semibold">
                    update():
                  </strong>
                  <span>Update using a callback function</span>
                </li>
                <li className="flex flex-col gap-1">
                  <strong className="text-gray-900 font-semibold">
                    getSnapshot():
                  </strong>
                  <span>Get current value without subscription</span>
                </li>
              </ul>
            </DemoCard>

            {/* Store Features */}
            <DemoCard variant="info">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Store Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  ✓ Type-safe operations
                </li>
                <li className="flex items-start gap-2">
                  ✓ Automatic React re-renders
                </li>
                <li className="flex items-start gap-2">✓ Immutable updates</li>
                <li className="flex items-start gap-2">✓ Memory efficient</li>
                <li className="flex items-start gap-2">
                  ✓ Cross-component state sharing
                </li>
              </ul>
            </DemoCard>
          </div>

          {/* Code Example - Updated for Action Context Pattern */}
          <CodeExample title="Action Context Pattern">
            <CodeBlock>
              {`// 1. Create Action Context Pattern for automatic registry isolation
import { createActionContextPattern, useStoreValue } from '@context-action/react';

const PageStores = createActionContextPattern('MyPage');

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
            </CodeBlock>
          </CodeExample>
        </div>
      </PageStores.Provider>
    </PageWithLogMonitor>
  );
}

export default StoreBasicsPage;
