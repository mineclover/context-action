import { createStoreContext, useStoreValue } from '@context-action/react';
import type React from 'react';
import { Activity, useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '@/components/LogMonitor';
import { Badge, Button, Card, CardContent, CodeBlock } from '@/components/ui';
import {
  ProviderActionContext,
  ProviderStoreContext,
} from './contexts/ProviderContexts';
import { ProviderRuntime } from './handlers/ProviderHandlerRegistry';

const ActivityDemoStores = createStoreContext('ActivityProviderDemo', {
  sharedDraft: '',
});

function ActivityDraftPanel() {
  const draftStore = ActivityDemoStores.useStore('sharedDraft');
  const sharedDraft = useStoreValue(draftStore);
  const [localDraft, setLocalDraft] = useState('');

  return (
    <div className="space-y-4 rounded border border-violet-200 bg-violet-50 p-4">
      <label className="block text-sm font-medium text-violet-950">
        Component-local draft
        <input
          className="mt-1 w-full rounded border border-violet-300 bg-white px-3 py-2"
          value={localDraft}
          onChange={(event) => setLocalDraft(event.target.value)}
          placeholder="Type text that belongs to this component"
        />
      </label>
      <label className="block text-sm font-medium text-violet-950">
        Context-Action Store draft
        <input
          className="mt-1 w-full rounded border border-violet-300 bg-white px-3 py-2"
          value={sharedDraft}
          onChange={(event) => draftStore.setValue(event.target.value)}
          placeholder="Type text that belongs to the Store"
        />
      </label>
      <p className="text-sm text-violet-900">
        Hide this panel and reveal it again: both values are restored.
      </p>
    </div>
  );
}

function ActivityProviderDemo() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ⚛️ React 19.2 Activity
            </h3>
            <p className="text-sm text-gray-600">
              Hide and reveal a Store Provider without losing draft state.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? 'Hide panel' : 'Reveal panel'}
          </Button>
        </div>

        <Activity mode={isVisible ? 'visible' : 'hidden'}>
          <ActivityDemoStores.Provider>
            <ActivityDraftPanel />
          </ActivityDemoStores.Provider>
        </Activity>
      </CardContent>
    </Card>
  );
}

// 카운터 컴포넌트 - Store Only + Action Only 패턴 사용
function CounterComponent() {
  const counterStore = ProviderStoreContext.useStore('counter');
  const count = useStoreValue(counterStore);
  const dispatch = ProviderActionContext.useActionDispatch();
  const { logAction } = useActionLoggerWithToast();

  const handleIncrement = useCallback(() => {
    const newValue = count + 1;
    dispatch('updateCounter', { value: newValue });
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logAction('updateCounter', { value: newValue }, { toast: true });
  }, [count, dispatch, logAction]);

  const handleDecrement = useCallback(() => {
    const newValue = count - 1;
    dispatch('updateCounter', { value: newValue });
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logAction('updateCounter', { value: newValue }, { toast: true });
  }, [count, dispatch, logAction]);

  const handleReset = useCallback(() => {
    dispatch('resetCounter');
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logAction('resetCounter', undefined, { toast: true });
  }, [dispatch, logAction]);

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🔢 Counter Component
          </h3>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Count: {count}
          </Badge>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded border text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{count}</div>
          <div className="text-sm text-gray-600">Current Value</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={handleIncrement}>
            + Increment
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDecrement}>
            - Decrement
          </Button>
          <Button size="sm" variant="danger" onClick={handleReset}>
            🔄 Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 메시지 컴포넌트 - Store Only + Action Only 패턴 사용
function MessageComponent() {
  const messageStore = ProviderStoreContext.useStore('message');
  const message = useStoreValue(messageStore);
  const [inputValue, setInputValue] = useState('');
  const dispatch = ProviderActionContext.useActionDispatch();
  const { logAction } = useActionLoggerWithToast();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        const newText = inputValue.trim();
        dispatch('updateMessage', { text: newText });
        // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
        logAction('updateMessage', { text: newText }, { toast: true });
        setInputValue('');
      }
    },
    [inputValue, dispatch, logAction]
  );

  const handleReset = useCallback(() => {
    dispatch('resetMessage');
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logAction('resetMessage', undefined, { toast: true });
  }, [dispatch, logAction]);

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            💬 Message Component
          </h3>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Length: {message.length}
          </Badge>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Current Message:
          </div>
          <div className="text-gray-900">"{message}"</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter new message"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              💾 Update Message
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              🔄 Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// 액티비티 로거 컴포넌트 - Store Only + Action Only 패턴 사용
function ActivityLogger() {
  const activitiesStore = ProviderStoreContext.useStore('activities');
  const activities = useStoreValue(activitiesStore);
  const dispatch = ProviderActionContext.useActionDispatch();
  const { logAction } = useActionLoggerWithToast();

  const logCustomActivity = useCallback(() => {
    // 랜덤 활동 생성 함수
    const generateRandomActivity = () => {
      const activityTypes = [
        'User logged in from mobile app',
        'Downloaded quarterly report',
        'Updated profile settings',
        'Shared document with team',
        'Completed security training',
        'Created new project workspace',
        'Joined video conference',
        'Submitted expense report',
        'Reviewed code changes',
        'Scheduled team meeting',
      ];

      return activityTypes[Math.floor(Math.random() * activityTypes.length)];
    };

    const randomActivity = generateRandomActivity();
    if (randomActivity) {
      dispatch('logActivity', { activity: randomActivity });
    }
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    if (randomActivity) {
      logAction('logActivity', { activity: randomActivity }, { toast: true });
    }
  }, [dispatch, logAction]);

  const clearActivities = useCallback(() => {
    activitiesStore.setValue([]);
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logAction('clearActivities', undefined, { toast: true });
  }, [activitiesStore, logAction]);

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📝 Activity Logger
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              Count: {activities.length}
            </Badge>
            <Button size="sm" variant="primary" onClick={logCustomActivity}>
              🎲 Random Activity
            </Button>
            <Button size="sm" variant="secondary" onClick={clearActivities}>
              🗑️ Clear
            </Button>
          </div>
        </div>

        <div className="border rounded-lg bg-gray-50 p-4 max-h-48 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No activities logged yet...
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{activity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 스토어 모니터 컴포넌트 - Store Only + Action Only 패턴 사용
function StoreMonitor() {
  const counterStore = ProviderStoreContext.useStore('counter');
  const messageStore = ProviderStoreContext.useStore('message');
  const activitiesStore = ProviderStoreContext.useStore('activities');

  const counter = useStoreValue(counterStore);
  const message = useStoreValue(messageStore);
  const activities = useStoreValue(activitiesStore);

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Store Registry Monitor
          </h3>
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Active Stores: 3
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-1">
                counter
              </div>
              <div className="text-lg font-bold text-blue-900">{counter}</div>
              <div className="text-xs text-blue-600">number</div>
            </div>

            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-1">
                message
              </div>
              <div className="text-sm font-bold text-green-900 truncate">
                "{message}"
              </div>
              <div className="text-xs text-green-600">
                string ({message.length} chars)
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-1">
                activities
              </div>
              <div className="text-lg font-bold text-purple-900">
                {activities.length} items
              </div>
              <div className="text-xs text-purple-600">string[]</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Store Status:
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 text-xs"
              >
                ✅ All stores initialized
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 text-xs"
              >
                🔄 Real-time updates
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 text-xs"
              >
                🎯 Type-safe access
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 메인 애플리케이션 컴포넌트 - 통합 패턴 사용
function ProviderApp() {
  return (
    <>
      <div className="space-y-6">
        <CounterComponent />
        <MessageComponent />
        <ActivityLogger />
        <StoreMonitor />

        {/* Provider 패턴 특징 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏗️ Provider Pattern Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>전역 상태 관리 및 공유</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>컴포넌트 간 통신 표준화</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>액션 중앙 집중화</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>완전한 타입 안전성</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>향상된 디버깅 편의성</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span>로거 모니터 통합</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사용법 가이드 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📖 Separated Provider Usage Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    Create Separated Patterns
                  </div>
                  <div className="text-sm text-gray-600">
                    const MyActions = createActionContext&lt;Actions&gt;(...);
                    <br />
                    const MyStores = createStoreContext(...);
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    Wrap with Provider
                  </div>
                  <div className="text-sm text-gray-600">
                    &lt;MyActions.Provider&gt;&lt;MyStores.Provider&gt;
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    Use Integrated Hooks
                  </div>
                  <div className="text-sm text-gray-600">
                    MyStores.useStore(), MyActions.useActionDispatch(),
                    MyActions.useActionHandler()
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    Safe Value Access
                  </div>
                  <div className="text-sm text-gray-600">
                    useStoreValue() for guaranteed type safety
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ReactProviderPage() {
  return (
    <PageWithLogMonitor
      pageId="react-provider"
      title="Unified Provider Pattern Demo"
    >
      <div className="page-container">
        <header className="page-header">
          <h1>Separated Provider Pattern Demo</h1>
          <p className="page-description">
            Experience the separated Action Only + Store Only patterns that
            provide clear separation of concerns. This demo shows complete
            integration with the Logger Monitor and demonstrates modern
            Context-Action framework usage.
          </p>
        </header>

        {/* Store Only + Action Only Provider 패턴 사용 */}
        <ProviderRuntime>
          <ProviderApp />
        </ProviderRuntime>

        <ActivityProviderDemo />

        {/* 코드 예제 */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💻 Separated Provider Pattern Code
            </h3>
            <CodeBlock size="sm">
              {`// 1. Create Separated Patterns
const ProviderActions = createActionContext<ProviderActions>(
  'ReactProviderDemo-actions'
);
const ProviderStores = createStoreContext('ReactProviderDemo-stores', {
  'counter': { initialValue: 0 },
  'message': { initialValue: 'Hello from Provider!' }
});

// 2. Register handlers in a dedicated Handler Registry
function ProviderHandlerRegistry({ children }) {
  const counterStore = ProviderStores.useStore('counter');
  ProviderActions.useActionHandler('updateCounter', ({ value }) => {
    counterStore.setValue(value);
  });
  return children;
}

// 3. Nested Provider Wrapping
function App() {
  return (
    <ProviderActions.Provider>
      <ProviderStores.Provider registryId="react-provider-demo">
        <ProviderHandlerRegistry>
          <MyApp />
        </ProviderHandlerRegistry>
      </ProviderStores.Provider>
    </ProviderActions.Provider>
  );
}

// 4. Separated Store & Action Usage
function MyComponent() {
  // Store management
  const counterStore = ProviderStores.useStore('counter');
  const count = useStoreValue(counterStore); // Type-safe!
  
  // Action dispatching
  const dispatch = ProviderActions.useActionDispatch();
  
  // Logger integration
  const { logAction } = useActionLoggerWithToast();
  
  const handleIncrement = () => {
    const newValue = count + 1;
    dispatch('updateCounter', { value: newValue });
    logAction('updateCounter', { value: newValue }, { toast: true });
  };
  
  return (
    <div>
      <div>Count: {count}</div>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
}`}
            </CodeBlock>
          </CardContent>
        </Card>

        {/* 패턴 비교 */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔄 Pattern Evolution
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-red-50 rounded border border-red-200">
                <h4 className="font-semibold text-red-900 mb-3">
                  ❌ Legacy Approach
                </h4>
                <div className="space-y-2 text-sm text-red-800">
                  <div>• Multiple separate providers</div>
                  <div>• Manual ActionRegister management</div>
                  <div>• Complex setup and configuration</div>
                  <div>• Type safety issues with undefined</div>
                  <div>• Poor logger integration</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">
                  ✅ Separated Pattern
                </h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div>• Clear separation of concerns</div>
                  <div>• Independent action and store management</div>
                  <div>• Flexible configuration</div>
                  <div>• Guaranteed type safety</div>
                  <div>• Improved maintainability</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactProviderPage;
