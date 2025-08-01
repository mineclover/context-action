/**
 * @fileoverview HOC Patterns Demo Page
 * Demonstrates different Higher-Order Component patterns for Store integration
 */

import React, { useState } from 'react';
import { 
  StoreRegistry,
  withStoreProvider,
  withActionProvider,
  withStoreAndActionProvider,
  withStore,
  withManagedStore,
  withStoreData,
  createBasicStore,
  ActionRegister,
  useRegistryStore,
  useStoreValue,
  type ActionPayloadMap
} from '@context-action/react';

// 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Settings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: 'en' | 'ko';
}

interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name?: string; email?: string };
  updateSettings: Partial<Settings>;
  resetUser: void;
}

// 전역 레지스트리 설정
const globalRegistry = new StoreRegistry();
const userStore = createBasicStore('user', { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' as const });
const settingsStore = createBasicStore('settings', { theme: 'light' as const, notifications: true, language: 'en' as const });

globalRegistry.register('user', userStore);
globalRegistry.register('settings', settingsStore);

export default function HOCPatternsPage() {
  const [activeDemo, setActiveDemo] = useState<string>('single-registry');

  const demos = [
    { id: 'single-registry', name: '1. Single Registry Management', component: SingleRegistryDemo },
    { id: 'component-stores', name: '2. Component-level Stores', component: ComponentStoresDemo },
    { id: 'mixed-pattern', name: '3. Mixed Pattern', component: MixedPatternDemo },
    { id: 'store-data-mapping', name: '4. Store Data Mapping', component: StoreDataMappingDemo },
  ];

  const ActiveComponent = demos.find(demo => demo.id === activeDemo)?.component || SingleRegistryDemo;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">HOC Patterns Examples</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Demonstrates different Higher-Order Component patterns for Store and Action integration:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
          <li><strong>Single Registry</strong>: 앱 전체에서 하나의 StoreRegistry 관리</li>
          <li><strong>Component-level Stores</strong>: 컴포넌트별로 독립적인 Store 생성</li>
          <li><strong>Mixed Pattern</strong>: Registry + Individual stores 혼합 사용</li>
          <li><strong>Store Data Mapping</strong>: Store 값들을 props로 변환하는 패턴</li>
        </ul>
      </div>

      {/* Demo Selector */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {demos.map(demo => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeDemo === demo.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Demo */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <ActiveComponent />
      </div>
    </div>
  );
}

// ===== 1. Single Registry Management =====
// 앱 전체에서 하나의 StoreRegistry를 관리하는 패턴
function SingleRegistryDemo() {
  // 기본 컴포넌트들
  const UserProfile = ({ title }: { title: string }) => {
    return (
      <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-2">{title}</h3>
        <UserInfo />
        <UserActions />
      </div>
    );
  };

  const UserInfo = () => {
    const userStore = useRegistryStore('user');
    const settingsStore = useRegistryStore('settings');
    const user = useStoreValue(userStore);
    const settings = useStoreValue(settingsStore);
    
    return (
      <div className="space-y-2 text-sm">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Theme:</strong> {settings?.theme}</p>
        <p><strong>Language:</strong> {settings?.language}</p>
      </div>
    );
  };

  const UserActions = withStoreAndActionProvider<AppActions>()(
    () => {
      // 실제로는 useActionDispatch, useStoreRegistry 등을 사용하지만
      // 데모를 위해 간단히 구현
      return (
        <div className="mt-4 space-x-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            onClick={() => {
              const store = globalRegistry.getStore('user');
              if (store) {
                store.setValue({ ...store.getValue(), name: 'Jane Smith' });
              }
            }}
          >
            Update Name
          </button>
          <button 
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            onClick={() => {
              const store = globalRegistry.getStore('settings');
              if (store) {
                const current = store.getValue();
                store.setValue({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' });
              }
            }}
          >
            Toggle Theme
          </button>
        </div>
      );
    }
  );

  // withStoreProvider로 전체 앱을 감싸기
  const AppWithStores = withStoreProvider(globalRegistry)(UserProfile);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">1. Single Registry Management</h3>
      <p className="text-sm text-gray-600 mb-4">
        <code>withStoreProvider(globalRegistry)</code>로 전체 앱을 감싸서 하나의 StoreRegistry를 제공합니다.
      </p>
      
      <AppWithStores title="Global Registry Example" />
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Pattern Usage:</h4>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 1. Global registry 생성
const globalRegistry = new StoreRegistry();
globalRegistry.register('user', userStore);

// 2. 앱 전체를 Provider로 감싸기
const AppWithStores = withStoreProvider(globalRegistry)(App);

// 3. 컴포넌트에서 Registry stores 사용 (Hook 기반)
const UserInfo = () => {
  const userStore = useRegistryStore('user');
  const settingsStore = useRegistryStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  return <div>{user?.name} - {settings?.theme}</div>;
};`}
        </pre>
      </div>
    </div>
  );
}

// ===== 2. Component-level Stores =====
// 컴포넌트별로 독립적인 Store를 생성하는 패턴
function ComponentStoresDemo() {
  // 기본 Counter 컴포넌트 정의
  interface CounterProps {
    label: string;
    color: string;
    counterStore?: any;
  }

  const BaseCounter: React.FC<CounterProps> = ({ counterStore, label, color }) => {
    const [count, setCount] = useState(counterStore.getValue());
    
    React.useEffect(() => {
      return counterStore.subscribe(() => {
        setCount(counterStore.getValue());
      });
    }, [counterStore]);

    return (
      <div className={`p-4 border rounded ${color}`}>
        <h4 className="font-medium mb-2">{label}</h4>
        <div className="text-2xl font-bold text-center py-2">
          {count}
        </div>
        <div className="flex justify-center space-x-2">
          <button 
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            onClick={() => counterStore.setValue(counterStore.getValue() - 1)}
          >
            -1
          </button>
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            onClick={() => counterStore.setValue(0)}
          >
            Reset
          </button>
          <button 
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            onClick={() => counterStore.setValue(counterStore.getValue() + 1)}
          >
            +1
          </button>
        </div>
      </div>
    );
  };

  // withStore로 HOC 생성
  const IndependentCounter = withStore<number>({ name: 'counter', initialValue: 0 })(BaseCounter as any);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">2. Component-level Stores</h3>
      <p className="text-sm text-gray-600 mb-4">
        <code>withStore()</code>로 각 컴포넌트마다 독립적인 Store 인스턴스를 생성합니다.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IndependentCounter label="Counter A" color="bg-blue-50" />
        <IndependentCounter label="Counter B" color="bg-green-50" />
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Pattern Usage:</h4>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 각 컴포넌트 인스턴스마다 독립적인 store 생성
const IndependentCounter = ({ label, color }) => {
  // useLocalStore로 컴포넌트 인스턴스마다 완전히 독립적인 스토어 생성
  const counterStore = useLocalStore('counter', 0);
  const count = useStoreValue(counterStore);
  
  useEffect(() => {
    return counterStore.subscribe(() => setCount(counterStore.getValue()));
  }, [counterStore]);
  
  return <div>{label}: {count}</div>;
});

// 사용 - 각각 독립적인 store를 가짐
<IndependentCounter label="Counter A" />
<IndependentCounter label="Counter B" />`}
        </pre>
      </div>
    </div>
  );
}

// ===== 3. Mixed Pattern =====
// Registry stores + Individual stores 혼합 사용
function MixedPatternDemo() {
  // ManagedStore를 사용한 컴포넌트 (Registry에 자동 등록)
  const TodoComponent = withManagedStore<string[]>({
    name: 'todos',
    initialValue: ['Learn React', 'Try HOC patterns']
  })(
    ({ todosStore }: any) => {
      const [todos, setTodos] = useState<string[]>(todosStore.getValue());
      const [newTodo, setNewTodo] = useState('');

      React.useEffect(() => {
        return todosStore.subscribe(() => {
          setTodos(todosStore.getValue());
        });
      }, [todosStore]);

      const addTodo = () => {
        if (newTodo.trim()) {
          todosStore.setValue([...todos, newTodo.trim()]);
          setNewTodo('');
        }
      };

      const removeTodo = (index: number) => {
        todosStore.setValue(todos.filter((_, i) => i !== index));
      };

      return (
        <div className="p-4 border rounded bg-white">
          <h4 className="font-medium mb-3">Todo List (ManagedStore)</h4>
          
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add new todo..."
              className="flex-1 px-2 py-1 border rounded text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <button 
              onClick={addTodo}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Add
            </button>
          </div>

          <ul className="space-y-1">
            {todos.map((todo, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span>{todo}</span>
                <button
                  onClick={() => removeTodo(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  );

  // Registry stores를 사용한 컴포넌트 (Hook 기반)
  const UserSettingsComponent = () => {
    const userStore = useRegistryStore('user');
    const settingsStore = useRegistryStore('settings');
    const user = useStoreValue(userStore);
    const settings = useStoreValue(settingsStore);

    return (
      <div className="p-4 border rounded bg-white">
        <h4 className="font-medium mb-3">User Settings (Registry Stores)</h4>
        <div className="space-y-2 text-sm">
          <p><strong>User:</strong> {user?.name}</p>
          <p><strong>Theme:</strong> {settings?.theme}</p>
          <button 
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
            onClick={() => {
              settingsStore?.setValue({
                ...settings,
                theme: settings?.theme === 'light' ? 'dark' : 'light'
              });
            }}
          >
            Toggle Theme
          </button>
        </div>
      </div>
    );
  };

  // 전체를 StoreProvider로 감싸기
  const MixedPatternApp = withStoreProvider(globalRegistry)(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TodoComponent />
      <UserSettingsComponent />
    </div>
  ));

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">3. Mixed Pattern</h3>
      <p className="text-sm text-gray-600 mb-4">
        Registry stores와 Individual stores를 함께 사용하는 패턴입니다.
      </p>
      
      <MixedPatternApp />
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Pattern Usage:</h4>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 1. ManagedStore - Registry에 자동 등록
const TodoComponent = withManagedStore({ 
  name: 'todos', 
  initialValue: [] 
})(Component);

// 2. Registry stores - 기존 stores 사용 (Hook 기반)
const UserSettings = () => {
  const userStore = useRegistryStore('user');
  const settingsStore = useRegistryStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  return <div>{user?.name} - {settings?.theme}</div>;
};

// 3. StoreProvider로 전체 감싸기
const App = withStoreProvider(globalRegistry)(AppComponent);`}
        </pre>
      </div>
    </div>
  );
}

// ===== 4. Store Data Mapping =====
// Store 값들을 props로 변환하는 패턴
function StoreDataMappingDemo() {
  // Store 값들을 직접 props로 매핑
  const UserSummaryComponent = withStoreData<{
    displayName: string;
    userRole: string;
    themeClass: string;
    isAdmin: boolean;
  }>({
    displayName: (stores: any) => {
      const user = stores.user;
      return user ? `${user.name} (${user.email})` : 'Unknown User';
    },
    userRole: (stores: any) => stores.user?.role?.toUpperCase() || 'UNKNOWN',
    themeClass: (stores: any) => {
      const theme = stores.settings?.theme;
      return theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black';
    },
    isAdmin: (stores: any) => stores.user?.role === 'admin'
  })(
    ({ displayName, userRole, themeClass, isAdmin, title }: {
      displayName: string;
      userRole: string;
      themeClass: string;
      isAdmin: boolean;
      title: string;
    }) => {
      return (
        <div className={`p-4 border rounded ${themeClass}`}>
          <h4 className="font-medium mb-3">{title}</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Display Name:</strong> {displayName}</p>
            <p><strong>Role:</strong> {userRole}</p>
            <p><strong>Admin Access:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
            <div className="mt-3">
              <button 
                className={`px-3 py-1 rounded text-sm ${
                  isAdmin 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isAdmin}
              >
                Admin Action
              </button>
            </div>
          </div>
        </div>
      );
    }
  );

  // 여러 데이터 포맷으로 표시
  const StatsComponent = withStoreData<{
    totalItems: number;
    userStatus: string;
    lastActivity: string;
  }>({
    totalItems: (stores: any) => 42, // 예시 데이터
    userStatus: (stores: any) => {
      const user = stores.user;
      const settings = stores.settings;
      return `${user?.role || 'user'} (${settings?.language || 'en'})`;
    },
    lastActivity: (stores: any) => new Date().toLocaleDateString()
  })(
    ({ totalItems, userStatus, lastActivity }: {
      totalItems: number;
      userStatus: string;
      lastActivity: string;
    }) => {
      return (
        <div className="p-4 border rounded bg-blue-50">
          <h4 className="font-medium mb-3">Dashboard Stats</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
              <div className="text-xs text-gray-600">Total Items</div>
            </div>
            <div>
              <div className="text-sm font-medium">{userStatus}</div>
              <div className="text-xs text-gray-600">User Status</div>
            </div>
            <div>
              <div className="text-sm">{lastActivity}</div>
              <div className="text-xs text-gray-600">Last Activity</div>
            </div>
          </div>
        </div>
      );
    }
  );

  const DataMappingApp = withStoreProvider(globalRegistry)(() => (
    <div className="space-y-4">
      <UserSummaryComponent title="User Summary (Mapped Data)" />
      <StatsComponent />
      
      <div className="flex gap-2">
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={() => {
            const store = globalRegistry.getStore('user');
            if (store) {
              const current = store.getValue();
              store.setValue({ 
                ...current, 
                role: current.role === 'admin' ? 'user' : 'admin' 
              });
            }
          }}
        >
          Toggle Admin Role
        </button>
        <button 
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          onClick={() => {
            const store = globalRegistry.getStore('settings');
            if (store) {
              const current = store.getValue();
              store.setValue({ 
                ...current, 
                language: current.language === 'en' ? 'ko' : 'en' 
              });
            }
          }}
        >
          Toggle Language
        </button>
      </div>
    </div>
  ));

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">4. Store Data Mapping</h3>
      <p className="text-sm text-gray-600 mb-4">
        <code>withStoreData()</code>로 Store 값들을 selector를 통해 변환하여 props로 직접 전달합니다.
      </p>
      
      <DataMappingApp />
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Pattern Usage:</h4>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`// Store 값들을 props로 변환
const UserSummary = withStoreData<{
  displayName: string;
  isAdmin: boolean;
}>({
  displayName: (stores) => \`\${stores.user?.name} (\${stores.user?.email})\`,
  isAdmin: (stores) => stores.user?.role === 'admin'
})(({ displayName, isAdmin }) => {
  // Store instances가 아닌 변환된 값들을 직접 받음
  return <div>{displayName} - Admin: {isAdmin}</div>;
});`}
        </pre>
      </div>
    </div>
  );
}