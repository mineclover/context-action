import { createActionContext } from '@context-action/react';
import type { ActionHandler, PipelineController } from '@context-action/core';
import { useCallback, useState } from 'react';
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
import { useSourceLinkRegistration } from '@/hooks/useSourceLinkRegistration';
import { SourceLink } from '@/components/ui/SourceLink';

// 1. Define Actions following EventActions pattern
interface CoreBasicsActions {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
  generateLog: void;
  asyncOperation: string;
}

// 2. Create Context with Renaming Pattern
const {
  Provider: CoreActionProvider,
  useActionDispatch: useCoreAction,
  useActionHandler: useCoreActionHandler,
  useActionDispatchWithResult: useCoreActionWithResult
} = createActionContext<CoreBasicsActions>('CoreBasics');

// 4. Component Usage with Renamed Hooks
function CoreBasicsDemo() {
  const [count, setCount] = useState(0);
  const dispatch = useCoreAction();
  const { logAction, logSystem } = useActionLoggerWithToast();

  // Register action handlers with renamed hook (properly memoized)
  const incrementHandler = useCallback<ActionHandler<void>>((payload, controller) => {
    setCount((prev) => prev + 1);
    logAction('increment', undefined);
  }, [logAction]);

  const decrementHandler = useCallback<ActionHandler<void>>((payload, controller) => {
    setCount((prev) => prev - 1);
    logAction('decrement', undefined);
  }, [logAction]);

  const setCountHandler = useCallback<ActionHandler<number>>((payload, controller) => {
    setCount(payload);
    logAction('setCount', payload);
  }, [logAction]);

  const resetHandler = useCallback<ActionHandler<void>>((payload, controller) => {
    setCount(0);
    logAction('reset', undefined);
  }, [logAction]);

  const generateLogHandler = useCallback<ActionHandler<void>>((payload, controller) => {
    // Generate random log message
    const adjectives = ['Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Elegant'];
    const nouns = ['Action', 'Event', 'Process', 'Operation', 'Task'];
    const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    
    const message = `${randomAdjective} ${randomColor} ${randomNoun} #${randomNumber}`;
    logAction('generateLog', message);
  }, [logAction]);

  useCoreActionHandler('increment', incrementHandler);
  useCoreActionHandler('decrement', decrementHandler);
  useCoreActionHandler('setCount', setCountHandler);
  useCoreActionHandler('reset', resetHandler);
  useCoreActionHandler('generateLog', generateLogHandler);

  // Action dispatch functions using renamed hooks
  const handleIncrement = useCallback(() => {
    dispatch('increment');
  }, [dispatch]);

  const handleDecrement = useCallback(() => {
    dispatch('decrement');
  }, [dispatch]);

  const handleSetCount = useCallback(() => {
    dispatch('setCount', 10);
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch('reset');
  }, [dispatch]);

  const handleGenerateLog = useCallback(() => {
    dispatch('generateLog');
  }, [dispatch]);

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
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useCoreActionWithResult();
  const { logAction } = useActionLoggerWithToast();

  // Advanced async handler
  const asyncOperationHandler = useCallback<ActionHandler<string>>(async (payload, controller) => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    logAction('asyncOperation', 'Async operation completed successfully');
  }, [logAction]);

  useCoreActionHandler('asyncOperation', asyncOperationHandler);

  const handleAsyncAction = useCallback(async () => {
    try {
      const result = await dispatchWithResult('asyncOperation', 'test-payload');
      console.log('Action result:', result);
    } catch (error) {
      console.error('Action failed:', error);
    }
  }, [dispatchWithResult]);

  const handleAbortAll = useCallback(() => {
    abortAll(); // Abort all pending actions
  }, [abortAll]);

  return (
    <DemoCard variant="info">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Advanced Features
      </h3>
      <div className="space-y-4">
        <p className="text-gray-600">
          Demonstrate advanced action features like result handling and abort functionality.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAsyncAction} variant="secondary">
            Async Action with Result
          </Button>
          <Button onClick={handleAbortAll} variant="danger">
            Abort All Actions
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
    description: 'Fundamentals of Action Context pattern with handlers and dispatching',
    tags: ['core', 'basics', 'action-context', 'handlers', 'dispatching']
  });

  return (
    <LogMonitorProvider
      pageId="core-basics"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <CoreActionProvider>
        <Container>
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Core Action Context Basics
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Learn the fundamentals of the Action Context pattern - creating context with renaming patterns,
                  registering handlers, and dispatching type-safe actions using the recommended approach.
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <SourceLink id="core-basics-page" variant="badge" />
              </div>
            </div>
          </header>

          <CoreBasicsDemo />

        {/* 코드 예제 */}
        <CodeExample title="Action Context Pattern Implementation">
          <CodeBlock>
            {`// 1. Define Actions following EventActions pattern
interface CoreBasicsActions {
  increment: undefined;
  setCount: number;
  reset: undefined;
  generateLog: undefined;
}

// 2. Create Context with Renaming Pattern
const {
  Provider: CoreActionProvider,
  useActionDispatch: useCoreAction,
  useActionHandler: useCoreActionHandler,
  useActionDispatchWithResult: useCoreActionWithResult
} = createActionContext<CoreBasicsActions>('CoreBasics');

// 3. Provider Setup
function App() {
  return (
    <CoreActionProvider>
      <CounterComponent />
    </CoreActionProvider>
  );
}

// 4. Component Usage with Renamed Hooks
function CounterComponent() {
  const [count, setCount] = useState(0);
  const dispatch = useCoreAction();
  
  // Register action handlers with renamed hook (properly memoized)
  const incrementHandler = useCallback((payload, controller) => {
    setCount(prev => prev + 1);
    console.log('Counter incremented');
  }, []);
  
  useCoreActionHandler('increment', incrementHandler);
  
  const handleClick = () => {
    dispatch('increment');
  };
  
  return <button onClick={handleClick}>Count: {count}</button>;
}`}
          </CodeBlock>
        </CodeExample>
        </Container>
      </CoreActionProvider>
    </LogMonitorProvider>
  );
}

export default CoreBasicsPage;
