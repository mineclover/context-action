import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { Button, DemoCard } from '@/components/ui';

// 액션 이름 상수 관리
const ACTION_NAMES = {
  INCREMENT: 'increment',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  ERROR_ACTION: 'errorAction',
} as const;

// 고급 액션 맵 정의
interface BasicActionMap extends ActionPayloadMap {
  [ACTION_NAMES.INCREMENT]: undefined;
  [ACTION_NAMES.MULTIPLY]: number;
  [ACTION_NAMES.DIVIDE]: number;
  [ACTION_NAMES.ERROR_ACTION]: undefined;
}

export function BasicActionsDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(
    () => new ActionRegister<BasicActionMap>()
  );
  const { logAction, logSystem, logError } = useActionLoggerWithToast();

  const logActionRef = useRef(logAction);
  const logSystemRef = useRef(logSystem);
  const logErrorRef = useRef(logError);
  
  // Update refs when logger functions change
  logActionRef.current = logAction;
  logSystemRef.current = logSystem;
  logErrorRef.current = logError;

  useEffect(() => {
    logSystemRef.current('BasicActionsDemo - ActionRegister 초기화');

    // 1. 기본 액션 핸들러 - 낮은 우선순위
      const unsubscribeIncrement = actionRegister.register(
        ACTION_NAMES.INCREMENT,
        (_) => {
        setCount((prev) => prev + 1);
        logActionRef.current(ACTION_NAMES.INCREMENT, undefined);
      },
      { priority: 1 }
    );

    // 2. 곱하기 액션 - 높은 우선순위로 먼저 실행
      const unsubscribeMultiply = actionRegister.register(
        ACTION_NAMES.MULTIPLY,
        (factor) => {
        setCount((prev) => prev * factor);
        logActionRef.current(ACTION_NAMES.MULTIPLY, factor, { priority: 2 });
      },
      { priority: 2 }
    );

    // 3. 나누기 액션 - 0으로 나누기 방지 로직 포함
    const unsubscribeDivide = actionRegister.register(
      ACTION_NAMES.DIVIDE,
      (divisor, controller) => {
        if (divisor === 0) {
          logErrorRef.current('Cannot divide by zero', new Error('Division by zero'));
          controller.abort('Division by zero is not allowed');
          return;
        }
        setCount((prev) => Math.floor(prev / divisor));
        logActionRef.current(ACTION_NAMES.DIVIDE, divisor);
      },
      { priority: 1 }
    );

    // 4. 에러 액션 핸들러 - 에러 처리 데모
    const unsubscribeError = actionRegister.register(
      ACTION_NAMES.ERROR_ACTION,
      (_, controller) => {
        logActionRef.current(ACTION_NAMES.ERROR_ACTION, undefined);
        logSystemRef.current('의도적인 에러 발생 테스트');
        try {
          throw new Error('Intentional error for testing');
        } catch (error) {
          logErrorRef.current('Action handler error', error);
          controller.abort('Handler error occurred - 핸들러에서 에러 발생');
        }
      }
    );

    logSystemRef.current('BasicActionsDemo - 핸들러 등록 완료');

    return () => {
      unsubscribeIncrement();
      unsubscribeMultiply();
      unsubscribeDivide();
      unsubscribeError();
      logSystemRef.current('BasicActionsDemo - 핸들러 등록 해제 완료');
    };
  }, [actionRegister]); // Only depend on actionRegister

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
            에러 액션
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          각 버튼은 서로 다른 우선순위의 액션 핸들러를 실행합니다. 에러 처리와
          abort 기능도 함께 테스트할 수 있습니다.
        </p>
      </DemoCard>
    </div>
  );
}