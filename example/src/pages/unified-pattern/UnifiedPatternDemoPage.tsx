import {
  type ActionPayloadMap,
  createActionContextPattern,
  useStoreValueSafe,
} from '@context-action/react';
import type React from 'react';
import { useState } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Grid,
  HOCPatternBadge,
  ProviderPatternBadge,
} from '../../components/ui';

// Action 타입 정의
interface CounterActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  reset: void;
  setCount: { value: number };
}

interface UserActions extends ActionPayloadMap {
  updateUser: { name: string; email: string };
  clearUser: void;
}

// 통합 Context Pattern 생성
const CounterContext = createActionContextPattern<CounterActions>('Counter', {
  logLevel: 1, // DEBUG level
  debug: true,
});

const UserContext = createActionContextPattern<UserActions>('User', {
  logLevel: 1, // DEBUG level
  debug: true,
});

// Counter 컴포넌트 - HOC 패턴 사용
const CounterWithProvider = CounterContext.withProvider('counter-demo')(() => {
  // Store 생성
  const countStore = CounterContext.useStore('count', 0);
  const historyStore = CounterContext.useStore<number[]>('history', []);

  const count = useStoreValueSafe(countStore);
  const history = useStoreValueSafe(historyStore);

  // Action Handler 등록
  CounterContext.useActionHandler('increment', () => {
    const newCount = count + 1;
    countStore.setValue(newCount);
    historyStore.update((prev) => [...prev, newCount]);
  });

  CounterContext.useActionHandler('decrement', () => {
    const newCount = count - 1;
    countStore.setValue(newCount);
    historyStore.update((prev) => [...prev, newCount]);
  });

  CounterContext.useActionHandler('reset', () => {
    countStore.setValue(0);
    historyStore.setValue([0]);
  });

  CounterContext.useActionHandler('setCount', ({ value }) => {
    countStore.setValue(value);
    historyStore.update((prev) => [...prev, value]);
  });

  // Action dispatch
  const dispatch = CounterContext.useAction();

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🔢 Counter (HOC Pattern)
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Count: {count}
            </Badge>
            <HOCPatternBadge />
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded border text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{count}</div>
          <div className="text-sm text-gray-600">Current Count</div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant="primary"
            onClick={() => dispatch('increment')}
          >
            + Increment
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => dispatch('decrement')}
          >
            - Decrement
          </Button>
          <Button size="sm" variant="warning" onClick={() => dispatch('reset')}>
            🔄 Reset
          </Button>
          <Button
            size="sm"
            variant="info"
            onClick={() =>
              dispatch('setCount', { value: Math.floor(Math.random() * 100) })
            }
          >
            🎲 Random
          </Button>
        </div>

        <div className="mt-4 p-3 bg-white rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">History:</div>
          <div className="flex flex-wrap gap-1">
            {history.slice(-10).map((value, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// User Profile 컴포넌트 - Provider 패턴 사용
function UserProfile() {
  // Store 생성
  const userStore = UserContext.useStore('user', { name: '', email: '' });
  const loginCountStore = UserContext.useStore('loginCount', 0);

  const user = useStoreValueSafe(userStore);
  const loginCount = useStoreValueSafe(loginCountStore);

  // Action Handler 등록
  UserContext.useActionHandler('updateUser', ({ name, email }) => {
    userStore.setValue({ name, email });
    loginCountStore.update((prev) => prev + 1);
  });

  UserContext.useActionHandler('clearUser', () => {
    userStore.setValue({ name: '', email: '' });
    loginCountStore.setValue(0);
  });

  // Action dispatch
  const dispatch = UserContext.useAction();

  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      dispatch('updateUser', formData);
      setFormData({ name: '', email: '' });
    }
  };

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            👤 User Profile (Provider Pattern)
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              Logins: {loginCount}
            </Badge>
            <ProviderPatternBadge />
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Name:</span>{' '}
              <span className="text-gray-900">{user.name || 'Not set'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Email:</span>{' '}
              <span className="text-gray-900">{user.email || 'Not set'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              💾 Update Profile
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => dispatch('clearUser')}
            >
              🗑️ Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// 메인 페이지 컴포넌트
function UnifiedPatternDemoPage() {
  return (
    <PageWithLogMonitor
      pageId="unified-pattern-demo"
      title="Unified Pattern Demo"
    >
      <div className="page-container">
        <header className="page-header">
          <h1>Unified Context Pattern Demo</h1>
          <p className="page-description">
            Explore the new Unified Context Pattern that combines Store and
            Action management. See two different usage patterns: HOC
            (Higher-Order Component) and Provider patterns.
          </p>
        </header>

        <Grid cols={2} gap="lg" className="mb-6">
          {/* HOC Pattern 예제 */}
          <CounterWithProvider />

          {/* Provider Pattern 예제 */}
          <UserContext.Provider registryId="user-profile">
            <UserProfile />
          </UserContext.Provider>
        </Grid>

        {/* 패턴 비교 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Pattern Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">
                  🔧 HOC Pattern
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div>✅ Automatic Provider wrapping</div>
                  <div>✅ Self-contained components</div>
                  <div>✅ No manual Provider setup</div>
                  <div>✅ Reusable anywhere</div>
                  <div>💡 Best for: Isolated components</div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">
                  🏗️ Provider Pattern
                </h4>
                <div className="space-y-2 text-sm text-purple-800">
                  <div>✅ Explicit context boundaries</div>
                  <div>✅ Multiple components sharing context</div>
                  <div>✅ Custom registry IDs</div>
                  <div>✅ Fine-grained control</div>
                  <div>💡 Best for: Component trees</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 코드 예제 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💻 Code Examples
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">HOC Pattern</h4>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {`// 1. Create Action Context Pattern
const CounterContext = createActionContextPattern<CounterActions>('Counter');

// 2. Use HOC Pattern
const CounterWithProvider = CounterContext.withProvider('counter-demo')(() => {
  // Store & Action usage
  const countStore = CounterContext.useStore('count', 0);
  const dispatch = CounterContext.useAction();
  
  CounterContext.useActionHandler('increment', () => {
    countStore.setValue(count + 1);
  });
  
  return <div>Counter UI</div>;
});

// 3. Use anywhere without Provider
<CounterWithProvider />`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Provider Pattern
                </h4>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {`// 1. Explicit Provider wrapping
<UserContext.Provider registryId="user-profile">
  <UserProfile />
</UserContext.Provider>

// 2. Inside component
function UserProfile() {
  const userStore = UserContext.useStore('user', {});
  const dispatch = UserContext.useAction();
  
  UserContext.useActionHandler('updateUser', (payload) => {
    userStore.setValue(payload);
  });
  
  return <div>User Profile UI</div>;
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default UnifiedPatternDemoPage;
