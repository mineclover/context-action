import { type ActionPayloadMap, ActionRegister } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import { Button, CodeBlock, CodeExample, DemoCard } from '../../components/ui';

// 액션 이름 상수 관리
const ACTION_NAMES = {
  INCREMENT: 'increment',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  CHAINED_ACTION: 'chainedAction',
  CONDITIONAL_ACTION: 'conditionalAction',
  DELAYED_ACTION: 'delayedAction',
  ERROR_ACTION: 'errorAction',
  PRIORITY_TEST: 'priorityTest',
  ABORT_TEST: 'abortTest',
  BLOCKING_TEST: 'blockingTest',
  // 인터셉터가 적용될 실제 비즈니스 액션들
  SECURE_OPERATION: 'secureOperation', // 보안이 필요한 작업
  PAYMENT_PROCESS: 'paymentProcess', // 결제 처리
  DATA_EXPORT: 'dataExport', // 데이터 내보내기
} as const;

// 권한 검사 함수들 (실제 애플리케이션에서는 외부 서비스나 상태에서 가져옴)
const hasPermission = (userId: string, operation: string): boolean => {
  // 시뮬레이션: admin 사용자만 secure operation 허용
  return userId === 'admin' && operation === 'sensitive-data-access';
};

const hasDataExportPermission = (userId: string, format: string): boolean => {
  // 시뮬레이션: admin과 manager만 CSV 내보내기 허용
  return (userId === 'admin' || userId === 'manager') && format === 'CSV';
};

// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  [ACTION_NAMES.INCREMENT]: undefined;
  [ACTION_NAMES.MULTIPLY]: number;
  [ACTION_NAMES.DIVIDE]: number;
  [ACTION_NAMES.CHAINED_ACTION]: { step: number; data: string };
  [ACTION_NAMES.CONDITIONAL_ACTION]: { condition: boolean; value: number };
  [ACTION_NAMES.DELAYED_ACTION]: { delay: number; message: string };
  [ACTION_NAMES.ERROR_ACTION]: undefined;
  [ACTION_NAMES.PRIORITY_TEST]: { level: number };
  [ACTION_NAMES.ABORT_TEST]: undefined;
  [ACTION_NAMES.BLOCKING_TEST]: { shouldBlock: boolean };
  // 인터셉터가 적용될 비즈니스 액션들
  [ACTION_NAMES.SECURE_OPERATION]: { operation: string; userId: string };
  [ACTION_NAMES.PAYMENT_PROCESS]: { amount: number; currency: string };
  [ACTION_NAMES.DATA_EXPORT]: { format: string; userId: string };
}

// 액션 실행 결과 타입
interface ActionResult {
  id: string;
  action: string;
  status: 'success' | 'blocked' | 'error';
  message: string;
  timestamp: Date;
  userId?: string;
  amount?: number;
  details?: string;
}

// 데모 컴포넌트
function CoreAdvancedDemo() {
  const [count, setCount] = useState(0);
  const [actionRegister] = useState(
    () => new ActionRegister<AdvancedActionMap>()
  );
  const [enableInterceptor, setEnableInterceptor] = useState(true);
  const [chainStep, setChainStep] = useState(0);
  const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);
  const { logAction, logSystem, logError } = useActionLoggerWithToast();

  // useRef를 사용해서 최신 인터셉터 상태를 추적
  const interceptorEnabledRef = useRef(enableInterceptor);

  // 인터셉터 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    interceptorEnabledRef.current = enableInterceptor;
  }, [enableInterceptor]);

  // 액션 결과 기록 함수
  const addActionResult = useCallback(
    (result: Omit<ActionResult, 'id' | 'timestamp'>) => {
      const newResult: ActionResult = {
        ...result,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      setActionResults((prev) => [newResult, ...prev].slice(0, 10)); // 최대 10개만 유지
    },
    []
  );

  const clearActionResults = useCallback(() => {
    setActionResults([]);
    logSystem('액션 결과 기록 초기화');
  }, [logSystem]);

  useEffect(() => {
    logSystem('ActionRegister 고급 기능 초기화');

    // 기본 액션 핸들러 - 낮은 우선순위
    const unsubscribeIncrement = actionRegister.register(
      ACTION_NAMES.INCREMENT,
      (_, controller) => {
        setCount((prev) => prev + 1);
        logAction(ACTION_NAMES.INCREMENT, undefined);
        controller.next();
      },
      { priority: 1 }
    );

    // 곱하기 액션 - 높은 우선순위로 먼저 실행
    const unsubscribeMultiply = actionRegister.register(
      ACTION_NAMES.MULTIPLY,
      (factor, controller) => {
        setCount((prev) => prev * factor);
        logAction(ACTION_NAMES.MULTIPLY, factor, { priority: 2 });
        controller.next();
      },
      { priority: 2 }
    );

    // 나누기 액션 - 0으로 나누기 방지 로직 포함
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
        controller.next();
      },
      { priority: 1 }
    );

    // 체인 액션 핸들러 - 순차적으로 실행되는 액션들
    const unsubscribeChained = actionRegister.register(
      ACTION_NAMES.CHAINED_ACTION,
      ({ step, data }, controller) => {
        setChainStep(step);
        logSystem(`📋 [단계 ${step}] ${data} - 체인 액션 실행 중`);
        logAction(ACTION_NAMES.CHAINED_ACTION, { step, data });

        // 다음 체인 액션 자동 실행 (최대 3단계)
        if (step < 3) {
          setTimeout(() => {
            actionRegister.dispatch(ACTION_NAMES.CHAINED_ACTION, {
              step: step + 1,
              data: `Chain step ${step + 1}`,
            });
          }, 1000);
        } else {
          logSystem('🎉 [체인 완료] 모든 3단계 완료 - Chain action completed');
        }

        controller.next();
      }
    );

    // 조건부 액션 핸들러 - 조건에 따라 실행/중단
    const unsubscribeConditional = actionRegister.register(
      ACTION_NAMES.CONDITIONAL_ACTION,
      ({ condition, value }, controller) => {
        logAction(ACTION_NAMES.CONDITIONAL_ACTION, { condition, value });

        if (condition) {
          setCount(value);

          // 성공 시각적 피드백
          addActionResult({
            action: '✅ 조건부 작업',
            status: 'success',
            message: `조건이 만족되어 값을 ${value}로 설정`,
            details: `조건: ${condition}, 새 값: ${value}`,
          });

          // Toast와 함께 로그 (명시적 Toast 요청)
          logSystem(`조건부 액션 성공: 값을 ${value}로 설정`, {
            toast: {
              type: 'success',
              title: '조건부 액션 성공',
              message: `값이 ${value}로 설정되었습니다`,
            },
          });

          controller.next();
        } else {
          // 실패 시각적 피드백
          addActionResult({
            action: '❌ 조건부 작업',
            status: 'blocked',
            message: '조건이 만족되지 않아 작업이 차단됨',
            details: `조건: ${condition}, 요청 값: ${value}`,
          });

          // Toast와 함께 로그 (명시적 Toast 요청)
          logSystem('조건부 액션 실패: 조건이 만족되지 않음', {
            toast: {
              type: 'error',
              title: '조건부 액션 실패',
              message: '조건이 만족되지 않아 실행되지 않았습니다',
            },
          });

          controller.abort('Condition not met - 조건 불만족으로 액션 중단');
        }
      }
    );

    // 지연 액션 핸들러 - 비동기 처리 데모
    const unsubscribeDelayed = actionRegister.register(
      ACTION_NAMES.DELAYED_ACTION,
      async ({ delay, message }, controller) => {
        logAction(ACTION_NAMES.DELAYED_ACTION, { delay, message });

        // 지연 시작 시각적 피드백
        addActionResult({
          action: '⏳ 지연 작업',
          status: 'success',
          message: `${delay}ms 지연 작업 시작`,
          details: `메시지: ${message}, 지연 시간: ${delay}ms`,
        });

        // 시작 Toast
        logSystem(`지연 액션 시작: ${delay}ms 후 실행`, {
          toast: {
            type: 'info',
            title: '지연 액션 시작',
            message: `${delay}ms 후에 실행됩니다`,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, delay));

        // 완료 시각적 피드백
        addActionResult({
          action: '✅ 지연 작업 완료',
          status: 'success',
          message: `지연 작업이 완료됨: ${message}`,
          details: `실행된 메시지: ${message}, 지연 시간: ${delay}ms`,
        });

        // 완료 Toast
        logSystem(`지연 액션 완료: ${message}`, {
          toast: {
            type: 'success',
            title: '지연 액션 완료',
            message: `"${message}" 작업이 완료되었습니다`,
          },
        });

        controller.next();
      }
    );

    // 에러 액션 핸들러 - 에러 처리 데모
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

    // 보안 인터셉터 패턴: 실제 비즈니스 액션을 가로채서 제어
    // 1. 보안 작업(secureOperation)에 대한 인터셉터 (높은 우선순위)
    const unsubscribeSecurityInterceptor = actionRegister.register(
      ACTION_NAMES.SECURE_OPERATION,
      ({ operation, userId }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;

        if (isInterceptorEnabled) {
          // 권한 검사 로직
          if (!hasPermission(userId, operation)) {
            setInterceptedActions((prev) => [
              ...prev,
              `🛡️ BLOCKED: ${operation} by user ${userId} at ${new Date().toLocaleTimeString()}`,
            ]);
            addActionResult({
              action: '🔒 보안 작업',
              status: 'blocked',
              message: `${operation} 작업이 차단됨`,
              userId,
              details: '권한 없는 사용자의 민감한 작업 접근 시도',
            });
            logSystem(
              `🛡️ 보안 인터셉터: ${operation} 작업이 차단됨 (사용자: ${userId})`
            );
            logAction(ACTION_NAMES.SECURE_OPERATION, {
              operation,
              userId,
              intercepted: true,
              status: 'blocked',
            });

            controller.abort(
              `Security interceptor blocked ${operation} for user ${userId}`
            );
            return;
          }
        }

        logSystem(
          `✅ 보안 검사 통과: ${operation} 작업 승인 (사용자: ${userId})`
        );
        controller.next();
      },
      { priority: 100 } // 보안 검사는 최고 우선순위
    );

    // 2. 실제 보안 작업 비즈니스 로직 (낮은 우선순위)
    const unsubscribeSecureOperation = actionRegister.register(
      ACTION_NAMES.SECURE_OPERATION,
      ({ operation, userId }, controller) => {
        addActionResult({
          action: '🔒 보안 작업',
          status: 'success',
          message: `${operation} 작업 성공`,
          userId,
          details: '권한 있는 사용자의 정상적인 보안 작업 완료',
        });
        logSystem(`🎯 보안 작업 실행: ${operation} (사용자: ${userId})`);
        logAction(ACTION_NAMES.SECURE_OPERATION, {
          operation,
          userId,
          intercepted: false,
          status: 'processed',
        });

        // 실제 보안 작업 수행
        setCount((prev) => prev + 10);

        controller.next();
      },
      { priority: 1 }
    );

    // 3. 결제 처리(paymentProcess)에 대한 인터셉터
    const unsubscribePaymentInterceptor = actionRegister.register(
      ACTION_NAMES.PAYMENT_PROCESS,
      ({ amount, currency }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;

        if (isInterceptorEnabled) {
          // 결제 한도 검사
          if (amount > 1000) {
            setInterceptedActions((prev) => [
              ...prev,
              `💳 BLOCKED: Payment ${amount} ${currency} exceeds limit at ${new Date().toLocaleTimeString()}`,
            ]);
            addActionResult({
              action: '💳 결제 처리',
              status: 'blocked',
              message: `${amount} ${currency} 결제가 한도 초과로 차단됨`,
              amount,
              details: '결제 한도($1000)를 초과하는 거래 시도',
            });
            logSystem(
              `💳 결제 인터셉터: ${amount} ${currency} 결제가 한도 초과로 차단됨`
            );
            logAction(ACTION_NAMES.PAYMENT_PROCESS, {
              amount,
              currency,
              intercepted: true,
              status: 'blocked',
            });

            controller.abort(
              `Payment amount ${amount} ${currency} exceeds limit`
            );
            return;
          }
        }

        logSystem(`✅ 결제 검사 통과: ${amount} ${currency} 결제 승인`);
        controller.next();
      },
      { priority: 90 } // 결제 검사는 높은 우선순위
    );

    // 4. 실제 결제 처리 비즈니스 로직
    const unsubscribePaymentProcess = actionRegister.register(
      ACTION_NAMES.PAYMENT_PROCESS,
      ({ amount, currency }, controller) => {
        addActionResult({
          action: '💳 결제 처리',
          status: 'success',
          message: `${amount} ${currency} 결제 성공`,
          amount,
          details: '정상적인 결제 처리 완료',
        });
        logSystem(`💳 결제 처리 실행: ${amount} ${currency}`);
        logAction(ACTION_NAMES.PAYMENT_PROCESS, {
          amount,
          currency,
          intercepted: false,
          status: 'processed',
        });

        // 실제 결제 처리
        setCount((prev) => prev + amount);

        controller.next();
      },
      { priority: 1 }
    );

    // 5. 데이터 내보내기(dataExport)에 대한 인터셉터
    const unsubscribeDataExportInterceptor = actionRegister.register(
      ACTION_NAMES.DATA_EXPORT,
      ({ format, userId }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;

        if (isInterceptorEnabled) {
          // 데이터 내보내기 권한 검사
          if (!hasDataExportPermission(userId, format)) {
            setInterceptedActions((prev) => [
              ...prev,
              `📊 BLOCKED: Data export ${format} by user ${userId} at ${new Date().toLocaleTimeString()}`,
            ]);
            addActionResult({
              action: '📊 데이터 내보내기',
              status: 'blocked',
              message: `${format} 내보내기가 권한 부족으로 차단됨`,
              userId,
              details: '데이터 내보내기 권한이 없는 사용자의 접근 시도',
            });
            logSystem(
              `📊 데이터 인터셉터: ${format} 내보내기가 권한 부족으로 차단됨 (사용자: ${userId})`
            );
            logAction(ACTION_NAMES.DATA_EXPORT, {
              format,
              userId,
              intercepted: true,
              status: 'blocked',
            });

            controller.abort(
              `Data export permission denied for user ${userId}`
            );
            return;
          }
        }

        logSystem(
          `✅ 데이터 내보내기 권한 확인: ${format} 내보내기 승인 (사용자: ${userId})`
        );
        controller.next();
      },
      { priority: 80 } // 데이터 접근 검사는 높은 우선순위
    );

    // 6. 실제 데이터 내보내기 비즈니스 로직
    const unsubscribeDataExport = actionRegister.register(
      ACTION_NAMES.DATA_EXPORT,
      ({ format, userId }, controller) => {
        addActionResult({
          action: '📊 데이터 내보내기',
          status: 'success',
          message: `${format} 형식으로 데이터 내보내기 성공`,
          userId,
          details: '권한 있는 사용자의 정상적인 데이터 내보내기 완료',
        });
        logSystem(
          `📊 데이터 내보내기 실행: ${format} 형식 (사용자: ${userId})`
        );
        logAction(ACTION_NAMES.DATA_EXPORT, {
          format,
          userId,
          intercepted: false,
          status: 'processed',
        });

        // 실제 데이터 내보내기 처리
        setCount((prev) => prev + 5);

        controller.next();
      },
      { priority: 1 }
    );

    // 블로킹 테스트 핸들러 - 조건부 블로킹
    const unsubscribeBlockingTest = actionRegister.register(
      ACTION_NAMES.BLOCKING_TEST,
      ({ shouldBlock }, controller) => {
        logAction(ACTION_NAMES.BLOCKING_TEST, { shouldBlock });

        if (shouldBlock) {
          // 차단 시각적 피드백
          addActionResult({
            action: '🚫 블로킹 테스트',
            status: 'blocked',
            message: '사용자 설정에 의해 액션이 차단됨',
            details: `차단 플래그: ${shouldBlock}, 액션 실행 거부됨`,
          });

          // 차단 Toast
          logSystem('블로킹 테스트: 액션이 차단됨', {
            toast: {
              type: 'error',
              title: '액션 차단됨',
              message: '사용자 설정에 의해 작업이 차단되었습니다',
            },
          });

          controller.abort('Action blocked by user setting');
          return;
        }

        // 통과 시각적 피드백
        addActionResult({
          action: '✅ 블로킹 테스트',
          status: 'success',
          message: '액션이 블로킹 검사를 통과하여 실행됨',
          details: `차단 플래그: ${shouldBlock}, Count +10 증가`,
        });

        // 통과 Toast
        logSystem('블로킹 테스트: 액션이 통과됨', {
          toast: {
            type: 'success',
            title: '액션 통과',
            message: '블로킹 검사를 통과하여 Count가 +10 증가했습니다',
          },
        });

        setCount((prev) => prev + 10);
        controller.next();
      }
    );

    // 우선순위 테스트 핸들러들 - 높은 숫자가 먼저 실행됨
    const unsubscribePriority1 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logAction(
          'priorityTest (우선순위 3 - 높음)',
          { level },
          { priority: 3 }
        );
        logSystem('🥇 첫 번째 우선순위 핸들러 실행 (priority: 3)');
        controller.next();
      },
      { priority: 3 } // 가장 높은 숫자로 첫 번째 실행
    );

    const unsubscribePriority2 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logAction(
          'priorityTest (우선순위 2 - 중간)',
          { level },
          { priority: 2 }
        );
        logSystem('🥈 두 번째 우선순위 핸들러 실행 (priority: 2)');
        controller.next();
      },
      { priority: 2 }
    );

    const unsubscribePriority3 = actionRegister.register(
      'priorityTest',
      ({ level }, controller) => {
        logAction(
          'priorityTest (우선순위 1 - 낮음)',
          { level },
          { priority: 1 }
        );
        logSystem('🥉 세 번째 우선순위 핸들러 실행 (priority: 1)');
        controller.next();
      },
      { priority: 1 } // 가장 낮은 숫자로 마지막 실행
    );

    // 중단 테스트 핸들러 - 의도적으로 액션을 중단
    const unsubscribeAbort = actionRegister.register(
      'abortTest',
      (_, controller) => {
        logAction('abortTest', undefined);
        logSystem('액션 중단 테스트 - 의도적으로 파이프라인 중단');
        controller.abort(
          'Action intentionally aborted for testing - 테스트를 위한 의도적 중단'
        );
      }
    );

    logSystem('모든 고급 핸들러 등록 완료');

    return () => {
      unsubscribeIncrement();
      unsubscribeMultiply();
      unsubscribeDivide();
      unsubscribeChained();
      unsubscribeConditional();
      unsubscribeDelayed();
      unsubscribeError();
      unsubscribeSecurityInterceptor();
      unsubscribeSecureOperation();
      unsubscribePaymentInterceptor();
      unsubscribePaymentProcess();
      unsubscribeDataExportInterceptor();
      unsubscribeDataExport();
      unsubscribeBlockingTest();
      unsubscribePriority1();
      unsubscribePriority2();
      unsubscribePriority3();
      unsubscribeAbort();
      logSystem('모든 핸들러 등록 해제 완료');
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

  const handleChainedAction = useCallback(() => {
    setChainStep(0);
    actionRegister.dispatch(ACTION_NAMES.CHAINED_ACTION, {
      step: 1,
      data: 'Chain started',
    });
  }, [actionRegister]);

  const handleConditionalTrue = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.CONDITIONAL_ACTION, {
      condition: true,
      value: 100,
    });
  }, [actionRegister]);

  const handleConditionalFalse = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.CONDITIONAL_ACTION, {
      condition: false,
      value: 100,
    });
  }, [actionRegister]);

  const handleDelayed = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.DELAYED_ACTION, {
      delay: 2000,
      message: 'Delayed execution complete',
    });
  }, [actionRegister]);

  const handleError = useCallback(() => {
    actionRegister.dispatch(ACTION_NAMES.ERROR_ACTION);
  }, [actionRegister]);

  // 새로운 인터셉터 액션 핸들러들
  const handleSecureOperation = useCallback(
    (userId: string) => {
      actionRegister.dispatch(ACTION_NAMES.SECURE_OPERATION, {
        operation: 'sensitive-data-access',
        userId,
      });
    },
    [actionRegister]
  );

  const handlePaymentProcess = useCallback(
    (amount: number) => {
      actionRegister.dispatch(ACTION_NAMES.PAYMENT_PROCESS, {
        amount,
        currency: 'USD',
      });
    },
    [actionRegister]
  );

  const handleDataExport = useCallback(
    (userId: string) => {
      actionRegister.dispatch(ACTION_NAMES.DATA_EXPORT, {
        format: 'CSV',
        userId,
      });
    },
    [actionRegister]
  );

  const handleBlockingTest = useCallback(
    (shouldBlock: boolean) => {
      actionRegister.dispatch(ACTION_NAMES.BLOCKING_TEST, { shouldBlock });
    },
    [actionRegister]
  );

  const handlePriorityTest = useCallback(() => {
    actionRegister.dispatch('priorityTest', {
      level: Math.floor(Math.random() * 10),
    });
  }, [actionRegister]);

  const handleAbortTest = useCallback(() => {
    actionRegister.dispatch('abortTest');
  }, [actionRegister]);

  const toggleInterceptor = useCallback(() => {
    setEnableInterceptor((prev) => {
      const newValue = !prev;
      logSystem(`인터셉터 ${newValue ? '활성화' : '비활성화'}`);
      return newValue;
    });
  }, [logSystem]);

  const clearInterceptedActions = useCallback(() => {
    setInterceptedActions([]);
    logSystem('인터셉트된 액션 목록 초기화');
  }, [logSystem]);

  return (
    <div className="space-y-6">
      {/* 상태 표시 */}
      <DemoCard title="고급 상태 정보">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{count}</div>
            <div className="text-sm text-gray-600">Count</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{chainStep}</div>
            <div className="text-sm text-gray-600">Chain Step</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div
              className={`text-2xl font-bold ${enableInterceptor ? 'text-purple-600' : 'text-gray-400'}`}
            >
              {enableInterceptor ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">인터셉터</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {interceptedActions.length}
            </div>
            <div className="text-sm text-gray-600">인터셉트 수</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {actionResults.length}
            </div>
            <div className="text-sm text-gray-600">액션 결과</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleInterceptor}>
            {enableInterceptor ? '인터셉터 비활성화' : '인터셉터 활성화'}
          </Button>
          {interceptedActions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearInterceptedActions}>
              목록 초기화
            </Button>
          )}
        </div>
      </DemoCard>

      {/* 기본 수치 액션들 */}
      <DemoCard title="기본 수치 액션">
        <div className="flex flex-wrap gap-2">
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
        </div>
      </DemoCard>

      {/* 고급 플로우 액션들 */}
      <DemoCard title="고급 플로우 제어">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button variant="secondary" onClick={handleChainedAction}>
            🔗 체인 액션 시작
          </Button>
          <Button variant="outline" onClick={handleDelayed}>
            ⏱️ 지연 액션 (2초)
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          체인 액션은 1→2→3 단계로 자동 진행되며, 지연 액션은 비동기 처리를
          보여줍니다.
        </div>
      </DemoCard>

      {/* 조건부 액션들 */}
      <DemoCard title="조건부 액션 제어">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button variant="primary" onClick={handleConditionalTrue}>
            ✅ 조건 만족 (성공)
          </Button>
          <Button variant="danger" onClick={handleConditionalFalse}>
            ❌ 조건 불만족 (중단)
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          조건에 따라 액션이 실행되거나 중단됩니다. 성공시 값이 100으로
          설정됩니다.
        </div>
      </DemoCard>

      {/* 인터셉터 데모 - 역할 명확히 표시 */}
      <DemoCard title="🔍 인터셉터 패턴 (액션 가로채기)" variant="info">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-white border rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              📋 인터셉터 설정
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-3 h-3 rounded-full ${enableInterceptor ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm">
                {enableInterceptor
                  ? '🟢 인터셉터 활성화'
                  : '🔴 인터셉터 비활성화'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={toggleInterceptor}>
              {enableInterceptor ? '인터셉터 끄기' : '인터셉터 켜기'}
            </Button>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              📊 인터셉터 통계
            </h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {interceptedActions.length}
            </div>
            <div className="text-xs text-gray-600">총 인터셉트된 액션 수</div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            🧪 실제 비즈니스 액션 테스트
          </h4>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            {/* 보안 작업 */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">🔒 보안 작업</div>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSecureOperation('admin')}
                  className="w-full"
                >
                  🔑 관리자 접근 (허용)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSecureOperation('user')}
                  className="w-full"
                >
                  👤 일반 사용자 (차단)
                </Button>
                <div className="text-xs text-gray-500">
                  admin만 허용, user는 차단
                </div>
              </div>
            </div>

            {/* 결제 처리 */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">💳 결제 처리</div>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePaymentProcess(500)}
                  className="w-full"
                >
                  💰 $500 결제 (허용)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaymentProcess(1500)}
                  className="w-full"
                >
                  🚫 $1500 결제 (차단)
                </Button>
                <div className="text-xs text-gray-500">$1000 이하만 허용</div>
              </div>
            </div>

            {/* 데이터 내보내기 */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">📊 데이터 내보내기</div>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDataExport('admin')}
                  className="w-full"
                >
                  📋 관리자 내보내기 (허용)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDataExport('guest')}
                  className="w-full"
                >
                  🚫 게스트 내보내기 (차단)
                </Button>
                <div className="text-xs text-gray-500">
                  admin/manager만 허용
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 액션 결과 피드백 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">
              📊 실시간 액션 결과
            </h4>
            {actionResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearActionResults}>
                🗑️ 기록 지우기
              </Button>
            )}
          </div>

          {actionResults.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {actionResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 border rounded-lg transition-all duration-300 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'blocked'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {result.action}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            result.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : result.status === 'blocked'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {result.status === 'success'
                            ? '✅ 성공'
                            : result.status === 'blocked'
                              ? '🛡️ 차단됨'
                              : '⚠️ 에러'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        {result.message}
                      </div>
                      {result.details && (
                        <div className="text-xs text-gray-500 mb-1">
                          {result.details}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{result.timestamp.toLocaleTimeString()}</span>
                        {result.userId && <span>사용자: {result.userId}</span>}
                        {result.amount && <span>금액: ${result.amount}</span>}
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                        result.status === 'success'
                          ? 'bg-green-500'
                          : result.status === 'blocked'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <div className="text-gray-500 text-sm">
                🎯 <strong>액션 결과가 여기에 표시됩니다</strong>
                <br />
                위의 테스트 버튼들을 클릭하여 인터셉터 동작을 확인해보세요
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">
            💡 인터셉터 패턴의 실제 사용 사례
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-blue-700 mb-2">
                🔒 보안 & 감사
              </div>
              <ul className="space-y-1 text-blue-600">
                <li>• 민감한 액션 로깅 (사용자 권한 확인)</li>
                <li>• API 호출 추적 및 모니터링</li>
                <li>• 사용자 행동 패턴 분석</li>
                <li>• 비정상적인 액션 탐지</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-blue-700 mb-2">
                🛠️ 개발 & 디버깅
              </div>
              <ul className="space-y-1 text-blue-600">
                <li>• 액션 실행 시간 측정</li>
                <li>• 개발 환경에서 액션 추적</li>
                <li>• A/B 테스트 데이터 수집</li>
                <li>• 성능 병목 지점 식별</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            ⚡ 우선순위 기반 인터셉터 동작
          </h4>
          <div className="text-xs text-gray-600">
            {enableInterceptor ? (
              <div className="space-y-1">
                <div>
                  🛡️ <strong>인터셉터 활성화:</strong> 높은 우선순위(100, 90, 80)
                  인터셉터가 액션을 가로채서 권한 검사
                </div>
                <div>
                  🚫 <strong>처리 흐름:</strong> 액션 감지 → 권한 검사 → 실패시
                  차단 → 비즈니스 로직 실행 안됨
                </div>
                <div>
                  📝 <strong>결과:</strong> 권한 없는 액션은 차단, 인터셉트
                  기록만 남음
                </div>
                <div className="mt-2 p-2 bg-red-100 rounded text-red-700">
                  🔒 <strong>보안 모드:</strong> 권한이 없는 사용자나 한도를
                  초과하는 액션은 차단됩니다. 높은 우선순위 인터셉터가 먼저
                  검사하여 조건에 맞지 않으면 낮은 우선순위 비즈니스 로직이
                  실행되지 않습니다.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div>
                  ✅ <strong>인터셉터 비활성화:</strong> 권한 검사 없이 모든
                  액션이 통과
                </div>
                <div>
                  ➡️ <strong>처리 흐름:</strong> 액션 감지 → 인터셉터 통과 →
                  비즈니스 로직 실행
                </div>
                <div>
                  📈 <strong>결과:</strong> 모든 액션이 정상 처리되어 Count 증가
                </div>
                <div className="mt-2 p-2 bg-green-100 rounded text-green-700">
                  🎯 <strong>정상 모드:</strong> 모든 비즈니스 액션이 권한 검사
                  없이 실행됩니다. 인터셉터를 통과하여 실제 비즈니스 로직이
                  실행되기 때문입니다.
                </div>
              </div>
            )}
          </div>
        </div>

        {interceptedActions.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-green-800">
                📋 인터셉트된 액션 목록
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearInterceptedActions}
              >
                🗑️ 목록 지우기
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {interceptedActions.slice(-5).map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-white rounded border"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="font-mono text-xs text-gray-700 flex-1">
                    {action}
                  </div>
                </div>
              ))}
              {interceptedActions.length > 5 && (
                <div className="text-center text-xs text-green-600 py-1">
                  ... 그리고 {interceptedActions.length - 5}개의 이전 기록
                </div>
              )}
            </div>
          </div>
        )}

        {interceptedActions.length === 0 && (
          <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-gray-500 text-sm">
              {enableInterceptor ? (
                <>
                  🛡️ <strong>인터셉터 활성화됨</strong>
                  <br />
                  권한이 없는 액션들을 실행하면 차단되고 여기에 기록됩니다
                  <br />
                  <span className="text-xs">
                    (예: 일반 사용자 보안 작업, $1500 결제, 게스트 데이터
                    내보내기)
                  </span>
                </>
              ) : (
                <>
                  ✅ <strong>인터셉터 비활성화됨</strong>
                  <br />
                  모든 액션이 권한 검사 없이 정상 처리됩니다 (차단 기록 없음)
                </>
              )}
            </div>
          </div>
        )}
      </DemoCard>

      {/* 블로킹 테스트 (별도 분리) */}
      <DemoCard title="🚫 액션 블로킹 패턴 (조건부 차단)">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button variant="primary" onClick={() => handleBlockingTest(false)}>
            🟢 블로킹 테스트 (통과)
          </Button>
          <Button variant="danger" onClick={() => handleBlockingTest(true)}>
            🔴 블로킹 테스트 (차단)
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          <strong>블로킹 패턴:</strong> 조건에 따라 액션을 완전히 차단하거나
          통과시킵니다. 차단된 액션은 <code>controller.abort()</code>로
          파이프라인이 중단되며, 통과된 액션은 Count가 +10 증가합니다.
        </div>
      </DemoCard>

      {/* 우선순위 및 테스트 액션들 */}
      <DemoCard title="우선순위 & 테스트 액션">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button variant="secondary" onClick={handlePriorityTest}>
            🏆 우선순위 테스트
          </Button>
          <Button variant="danger" onClick={handleError}>
            💥 에러 테스트
          </Button>
          <Button variant="outline" onClick={handleAbortTest}>
            🛑 중단 테스트
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          우선순위 테스트는 3개의 핸들러가 순서대로 실행됩니다. 에러/중단
          테스트는 예외 상황을 시뮬레이션합니다.
        </div>
      </DemoCard>

      {/* 고급 개념 설명 */}
      <DemoCard title="ActionRegister 고급 기능" variant="info">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🔧 핵심 기능</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>우선순위 핸들러:</strong> 실행 순서 제어
              </li>
              <li>
                • <strong>액션 체이닝:</strong> 순차적 액션 디스패치
              </li>
              <li>
                • <strong>조건부 로직:</strong> abort/continue 제어
              </li>
              <li>
                • <strong>비동기 처리:</strong> Promise 기반 액션
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">⚡ 고급 패턴</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>인터셉터:</strong> 액션 가로채기 패턴
              </li>
              <li>
                • <strong>블로킹:</strong> 조건부 액션 차단
              </li>
              <li>
                • <strong>에러 핸들링:</strong> 우아한 실패 처리
              </li>
              <li>
                • <strong>파이프라인 제어:</strong> next/abort 메커니즘
              </li>
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
        enableToast: true, // 🔑 Toast 시스템 활성화
        maxLogs: 150,
        defaultLogLevel: 1,
      }}
    >
      <CoreAdvancedDemo />

      {/* 코드 예제 */}
      <DemoCard title="ActionRegister 고급 패턴 코드">
        <CodeExample>
          <CodeBlock>
            {`// 1. 우선순위별 핸들러 등록
actionRegister.register('priorityTest', handler1, { priority: 3 }); // 높은 우선순위
actionRegister.register('priorityTest', handler2, { priority: 2 }); // 중간 우선순위  
actionRegister.register('priorityTest', handler3, { priority: 1 }); // 낮은 우선순위

// 2. 비동기 액션 핸들러
actionRegister.register('delayedAction', async ({ delay, message }, controller) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log(message);
  controller.next();
});

// 3. 조건부 로직과 파이프라인 제어
actionRegister.register('conditionalAction', ({ condition, value }, controller) => {
  if (condition) {
    setState(value);
    controller.next(); // 다음 핸들러로 진행
  } else {
    controller.abort('Condition not met'); // 파이프라인 중단
  }
});

// 4. 액션 체이닝 패턴
actionRegister.register('chainedAction', ({ step, data }, controller) => {
  console.log(\`Step \${step}: \${data}\`);
  
  // 다음 체인 자동 실행
  if (step < 3) {
    setTimeout(() => {
      actionRegister.dispatch('chainedAction', { 
        step: step + 1, 
        data: \`Chain step \${step + 1}\` 
      });
    }, 1000);
  }
  
  controller.next();
});

// 5. 인터셉터 패턴 (액션 가로채기)
actionRegister.register('interceptorTest', ({ data }, controller) => {
  if (enableInterceptor) {
    // 액션을 가로채어 별도 처리
    interceptedActions.push(\`Intercepted: \${data}\`);
    console.log('Action intercepted and logged');
  }
  
  controller.next();
});

// 6. 에러 처리와 복구
actionRegister.register('errorAction', (_, controller) => {
  try {
    // 위험한 작업 실행
    throw new Error('Simulated error');
  } catch (error) {
    logger.error('Action failed:', error);
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
