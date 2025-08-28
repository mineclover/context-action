import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '@/components/LogMonitor';
import { Button, CodeBlock, CodeExample, DemoCard } from '@/components/ui';

// 액션 이름 상수 관리
const ACTION_NAMES = {
  INCREMENT: 'increment',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  ERROR_ACTION: 'errorAction',
} as const;

// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  [ACTION_NAMES.INCREMENT]: undefined;
  [ACTION_NAMES.MULTIPLY]: number;
  [ACTION_NAMES.DIVIDE]: number;
  [ACTION_NAMES.ERROR_ACTION]: undefined;
}

// 데모 컴포넌트
function CoreAdvancedDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(
    () => new ActionRegister<AdvancedActionMap>()
  );
  const { logAction, logSystem, logError } = useActionLoggerWithToast();

  useEffect(() => {
    logSystem('ActionRegister 고급 기능 초기화');

    // 1. 기본 액션 핸들러 - 낮은 우선순위
    const unsubscribeIncrement = actionRegister.register(
      ACTION_NAMES.INCREMENT,
      (_, controller) => {
        setCount((prev) => prev + 1);
        logAction(ACTION_NAMES.INCREMENT, undefined);
      },
      { priority: 1 }
    );

    // 2. 곱하기 액션 - 높은 우선순위로 먼저 실행
    const unsubscribeMultiply = actionRegister.register(
      ACTION_NAMES.MULTIPLY,
      (factor, controller) => {
        setCount((prev) => prev * factor);
        logAction(ACTION_NAMES.MULTIPLY, factor, { priority: 2 });
      },
      { priority: 2 }
    );

    // 3. 나누기 액션 - 0으로 나누기 방지 로직 포함
    const unsubscribeDivide = actionRegister.register(
      ACTION_NAMES.DIVIDE,
      (divisor, controller) => {
        if (divisor === 0) {
          logError('Cannot divide by zero', new Error('Division by zero'));
          controller.abort('Division by zero is not allowed');
          return;
        }
        setCount((prev) => Math.floor(prev / divisor));
        logAction(ACTION_NAMES.DIVIDE, divisor);
      },
      { priority: 1 }
    );

    // 4. 에러 액션 핸들러 - 에러 처리 데모
    const unsubscribeError = actionRegister.register(
      ACTION_NAMES.ERROR_ACTION,
      (_, controller) => {
        logAction(ACTION_NAMES.ERROR_ACTION, undefined);
        logSystem('의도적인 에러 발생 테스트');
        try {
          throw new Error('Intentional error for testing');
        } catch (error) {
          logError('Action handler error', error);
          controller.abort('Handler error occurred - 핸들러에서 에러 발생');
        }
      }
    );

    logSystem('기본 핸들러 등록 완료');

    return () => {
      unsubscribeIncrement();
      unsubscribeMultiply();
      unsubscribeDivide();
      unsubscribeError();
      logSystem('핸들러 등록 해제 완료');
    };
  }, [actionRegister, logAction, logSystem, logError]);

  // 액션 디스패치 함수들
  const handleIncrement = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.INCREMENT);
  }, [actionRegister]);

  const handleMultiply = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.MULTIPLY, 2);
  }, [actionRegister]);

  const handleDivide = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.DIVIDE, 2);
  }, [actionRegister]);

  const handleDivideByZero = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.DIVIDE, 0);
  }, [actionRegister]);

  const handleError = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.ERROR_ACTION);
  }, [actionRegister]);

  return (
    <div className="space-y-6">
      {/* 상태 표시 */}
      <DemoCard title="ActionRegister 상태">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{count}</div>
          <div className="text-sm text-gray-600">Current Count</div>
        </div>
      </DemoCard>

      {/* 기본 액션들 */}
      <DemoCard title="ActionRegister 기본 액션">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button onClick={handleIncrement}>증가 (+1)</Button>
          <Button variant="secondary" onClick={handleMultiply}>
            곱하기 (×2)
          </Button>
          <Button variant="outline" onClick={handleDivide}>
            나누기 (÷2)
          </Button>
          <Button variant="danger" onClick={handleDivideByZero}>
            0으로 나누기 (에러)
          </Button>
          <Button variant="warning" onClick={handleError}>
            💥 에러 테스트
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          기본 수치 연산과 에러 처리 예제입니다.
        </div>
      </DemoCard>

      {/* ActionRegister 설명 */}
      <DemoCard title="ActionRegister 개념" variant="info">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🔧 핵심 기능</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>우선순위 핸들러:</strong> 실행 순서 제어</li>
              <li>• <strong>에러 처리:</strong> 우아한 실패 처리</li>
              <li>• <strong>파이프라인 제어:</strong> abort 메커니즘</li>
              <li>• <strong>타입 안전성:</strong> TypeScript 완전 지원</li>
            </ul>
          </div>
        </div>
      </DemoCard>
    </div>
  );
}

function CoreAdvancedPage() {
  return (
    <PageWithLogMonitor
      pageId="core-advanced"
      title="Core ActionRegister Advanced"
      initialConfig={{
        enableToast: true,
        maxLogs: 150,
        defaultLogLevel: 1,
      }}
    >
      <CoreAdvancedDemo />

      {/* 코드 예제 */}
      <DemoCard title="ActionRegister 고급 패턴 코드">
        <CodeExample>
          <CodeBlock>
            {`// 1. 우선순위별 핸들러 등록 (높은 숫자가 먼저 실행됨)
actionRegister.register('increment', (_, controller) => {
  setCount(prev => prev + 1);
  logAction('increment', undefined);
}, { priority: 1 });

// 2. 곱하기 액션 - 높은 우선순위로 먼저 실행
actionRegister.register('multiply', (factor, controller) => {
  setCount(prev => prev * factor);
  logAction('multiply', factor);
}, { priority: 2 });

// 3. 나누기 액션 - 0으로 나누기 방지 로직 포함
actionRegister.register('divide', (divisor, controller) => {
  if (divisor === 0) {
    logError('Cannot divide by zero', new Error('Division by zero'));
    controller.abort('Division by zero is not allowed');
    return;
  }
  setCount(prev => Math.floor(prev / divisor));
  logAction('divide', divisor);
}, { priority: 1 });

// 4. 에러 액션 핸들러 - 에러 처리 데모
actionRegister.register('errorAction', (_, controller) => {
  try {
    throw new Error('Intentional error for testing');
  } catch (error) {
    logError('Action handler error', error);
    controller.abort('Handler error occurred');
  }
});`}
          </CodeBlock>
        </CodeExample>
      </DemoCard>
    </PageWithLogMonitor>
  );
}

export default CoreAdvancedPage;