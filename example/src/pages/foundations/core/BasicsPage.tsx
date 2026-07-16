import { useStoreValue } from '@context-action/react';
import {
  LogMonitor,
  LogMonitorProvider,
  useActionLoggerWithToast,
} from '@/components/LogMonitor';
import {
  Button,
  CodeBlock,
  CodeExample,
  Container,
  DemoCard,
} from '@/components/ui';
import { SourceLink } from '@/components/ui/SourceLink';
import { useSourceLinkRegistration } from '@/hooks/useSourceLinkRegistration';
import {
  useCoreAction,
  useCoreActionWithResult,
  useCoreStore,
} from './contexts/CoreBasicsContexts';
import { CoreBasicsProviders } from './handlers/CoreBasicsHandlerRegistry';

// 4. Component Usage with Renamed Hooks
function CoreBasicsDemo() {
  const count = useStoreValue(useCoreStore('count'));
  const dispatch = useCoreAction();

  // Action dispatch functions using renamed hooks (React 컴파일러가 자동으로 메모이제이션)
  const handleIncrement = () => {
    dispatch('increment');
  };

  const handleDecrement = () => {
    dispatch('decrement');
  };

  const handleSetCount = () => {
    dispatch('setCount', 10);
  };

  const handleReset = () => {
    dispatch('reset');
  };

  const handleGenerateLog = () => {
    dispatch('generateLog');
  };

  return (
    <div className="space-y-6">
      {/* 카운터 데모 */}
      <DemoCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Counter
        </h3>
        <div className="text-center my-8">
          <span className="text-2xl font-bold text-primary-600 text-center block">
            {count}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleIncrement} variant="primary">
            +1
          </Button>
          <Button onClick={handleDecrement} variant="primary">
            -1
          </Button>
          <Button onClick={handleSetCount} variant="secondary">
            Set to 10
          </Button>
          <Button onClick={handleReset} variant="danger">
            Reset
          </Button>
        </div>
      </DemoCard>

      {/* 사용자 정의 로그 */}
      <DemoCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Custom Logging
        </h3>
        <p className="text-gray-600 mb-4">
          Generate random log messages to test the logging system
        </p>
        <Button onClick={handleGenerateLog} variant="info">
          🎲 Generate Random Log
        </Button>
      </DemoCard>

      {/* 액션 시스템 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How ActionRegister Works
        </h3>
        <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
          <li className="pl-2">
            <strong className="text-gray-900 font-semibold">
              Create ActionRegister:
            </strong>{' '}
            Instantiate with action type map
          </li>
          <li className="pl-2">
            <strong className="text-gray-900 font-semibold">
              Register Handlers:
            </strong>{' '}
            Define what happens for each action
          </li>
          <li className="pl-2">
            <strong className="text-gray-900 font-semibold">
              Dispatch Actions:
            </strong>{' '}
            Trigger actions from UI components
          </li>
          <li className="pl-2">
            <strong className="text-gray-900 font-semibold">
              Handle Results:
            </strong>{' '}
            Handlers automatically continue or use controller.abort()
          </li>
        </ol>
      </DemoCard>

      {/* 주요 특징 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Features
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            ✓ Type-safe action dispatching
          </li>
          <li className="flex items-start gap-2">
            ✓ Centralized action handling
          </li>
          <li className="flex items-start gap-2">
            ✓ Automatic logging integration
          </li>
          <li className="flex items-start gap-2">
            ✓ Clean unsubscribe mechanism
          </li>
          <li className="flex items-start gap-2">✓ Middleware support</li>
        </ul>
      </DemoCard>

      {/* Advanced Features Demo */}
      <AdvancedFeaturesDemo />

      {/* 로그 모니터 */}
      <LogMonitor title="Core Basics - Action Log" />
    </div>
  );
}

// Advanced Features Component
function AdvancedFeaturesDemo() {
  const { dispatchWithResult, abortAll } = useCoreActionWithResult();
  const { logAction } = useActionLoggerWithToast();
  const asyncStatus = useStoreValue(useCoreStore('asyncStatus'));
  const { isRunning, runningCount } = asyncStatus;

  const handleAsyncAction = async () => {
    try {
      const result = await dispatchWithResult('asyncOperation', 'test-payload');
      console.log('Action result:', result);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleAbortAll = () => {
    const abortedCount = abortAll(); // Abort all pending actions
    logAction('abortAll', `🛑 Aborted ${abortedCount} pending actions`);
  };

  return (
    <DemoCard variant="info">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Advanced Features
      </h3>
      <div className="space-y-4">
        <p className="text-gray-600">
          Demonstrate advanced action features like result handling and abort
          functionality.
        </p>

        {/* Status Display */}
        {(isRunning || runningCount > 0) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">
                {runningCount > 1
                  ? `${runningCount}개의 비동기 액션이 실행 중입니다...`
                  : '비동기 액션이 실행 중입니다... (3초 소요)'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAsyncAction}
            variant="secondary"
            disabled={false} // 여러 비동기 액션 동시 실행 허용
          >
            {isRunning ? '🔄 ' : ''}Async Action with Result
          </Button>
          <Button
            onClick={handleAbortAll}
            variant="danger"
            disabled={runningCount === 0}
          >
            🛑 Abort All Actions {runningCount > 0 && `(${runningCount})`}
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

// 3. Provider Setup
function CoreBasicsPage() {
  // 🎯 소스 링크 등록
  useSourceLinkRegistration({
    id: 'core-basics-page',
    name: 'Core Basics Page',
    filePath: 'pages/foundations/core/BasicsPage.tsx',
    category: 'core',
    description:
      'Fundamentals of Action Context pattern with handlers and dispatching',
    tags: ['core', 'basics', 'action-context', 'handlers', 'dispatching'],
  });

  return (
    <LogMonitorProvider
      pageId="core-basics"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <CoreBasicsProviders>
        <Container>
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Core Action Context Basics
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Learn the fundamentals of the Action Context pattern -
                  creating context with renaming patterns, registering handlers,
                  and dispatching type-safe actions using the recommended
                  approach.
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <SourceLink
                  filePath="pages/foundations/core/BasicsPage.tsx"
                  variant="badge"
                />
              </div>
            </div>
          </header>

          <CoreBasicsDemo />

          {/* 코드 예제 */}
          <CodeExample title="Action Context Pattern Implementation">
            <CodeBlock>
              {`// contexts/CoreBasicsContexts.tsx
const { Provider: CoreActionProvider, useActionDispatch: useCoreAction } =
  createActionContext<CoreBasicsActions>('CoreBasics');
const { Provider: CoreStoreProvider, useStore: useCoreStore } =
  createStoreContext('CoreBasicsStores', { count: { initialValue: 0 } });

// handlers/CoreBasicsHandlerRegistry.tsx
function CoreBasicsHandlerRegistry({ children }) {
  useCoreActionHandler('increment', (payload, controller) => {
    countStore.update((count) => count + 1);
  });
  return children;
}

// Page composition: Action → Store → Handler Registry → View
<CoreActionProvider>
  <CoreStoreProvider>
    <CoreBasicsHandlerRegistry>
      <CounterView />
    </CoreBasicsHandlerRegistry>
  </CoreStoreProvider>
</CoreActionProvider>`}
            </CodeBlock>
          </CodeExample>
        </Container>
      </CoreBasicsProviders>
    </LogMonitorProvider>
  );
}

export default CoreBasicsPage;
