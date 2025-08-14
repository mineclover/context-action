import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useState } from 'react';
import {
  LogMonitor,
  LogMonitorProvider,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeBlock,
  CodeExample,
  Container,
  DemoCard,
} from '../../components/ui';

// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// 데모 컴포넌트
function CoreBasicsDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());
  const { logAction, logSystem } = useActionLoggerWithToast();

  useEffect(() => {
    logSystem('ActionRegister initialized');

    // 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        logAction('increment', undefined);
        
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        logAction('decrement', undefined);
        
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        logAction('setCount', payload);
        
      }
    );

    const unsubscribeReset = actionRegister.register(
      'reset',
      (_, controller) => {
        setCount(0);
        logAction('reset', undefined);
        
      }
    );

    const unsubscribeLog = actionRegister.register(
      'log',
      (payload, controller) => {
        logAction('log', payload);
        
      }
    );

    logSystem('All action handlers registered');

    // 정리 함수
    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
      unsubscribeReset();
      unsubscribeLog();
      logSystem('All handlers unregistered');
    };
  }, [actionRegister, logAction, logSystem]);

  // 액션 디스패치 함수들
  const handleIncrement = useCallback(() => {
    actionRegister.dispatch('increment');
  }, [actionRegister]);

  const handleDecrement = useCallback(() => {
    actionRegister.dispatch('decrement');
  }, [actionRegister]);

  const handleSetCount = useCallback(() => {
    actionRegister.dispatch('setCount', 10);
  }, [actionRegister]);

  const handleReset = useCallback(() => {
    actionRegister.dispatch('reset');
  }, [actionRegister]);

  const handleCustomLog = useCallback(() => {
    // 랜덤 문자열 생성 함수
    const generateRandomString = () => {
      const adjectives = [
        'Amazing',
        'Brilliant',
        'Creative',
        'Dynamic',
        'Elegant',
        'Fantastic',
        'Gorgeous',
        'Incredible',
        'Joyful',
        'Magnificent',
      ];
      const nouns = [
        'Action',
        'Event',
        'Process',
        'Operation',
        'Task',
        'Function',
        'Method',
        'Handler',
        'Request',
        'Response',
      ];
      const colors = [
        'Red',
        'Blue',
        'Green',
        'Purple',
        'Orange',
        'Yellow',
        'Pink',
        'Cyan',
        'Magenta',
        'Lime',
      ];

      const randomAdjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomNumber = Math.floor(Math.random() * 1000) + 1;

      return `${randomAdjective} ${randomColor} ${randomNoun} #${randomNumber}`;
    };

    const randomMessage = generateRandomString();
    actionRegister.dispatch('log', randomMessage);
  }, [actionRegister]);

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
        <Button onClick={handleCustomLog} variant="info">
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

      {/* 로그 모니터 */}
      <LogMonitor title="Core Basics - Action Log" />
    </div>
  );
}

function CoreBasicsPage() {
  return (
    <LogMonitorProvider
      pageId="core-basics"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <Container>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Core ActionRegister Basics
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Learn the fundamentals of the ActionRegister system - creating,
            registering handlers, and dispatching type-safe actions in your
            application.
          </p>
        </header>

        <CoreBasicsDemo />

        {/* 코드 예제 */}
        <CodeExample title="ActionRegister Implementation">
          <CodeBlock>
            {`// 1. 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  increment: undefined;
  setCount: number;
  reset: undefined;
}

// 2. ActionRegister 생성
const actionRegister = new ActionRegister<AppActions>();

// 3. 핸들러 등록
const unsubscribe = actionRegister.register('increment', (_, controller) => {
  setCount(prev => prev + 1);
  console.log('Counter incremented');
   // 성공적으로 완료
});

// 4. 액션 디스패치
actionRegister.dispatch('increment');
actionRegister.dispatch('setCount', 42);

// 5. 정리
unsubscribe();`}
          </CodeBlock>
        </CodeExample>
      </Container>
    </LogMonitorProvider>
  );
}

export default CoreBasicsPage;
