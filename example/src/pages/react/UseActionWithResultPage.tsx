import type { ActionHandler, ActionPayloadMap } from '@context-action/core';
import { LogArtHelpers } from '@context-action/logger';
import {
  createActionContext,
  createStore,
  useStoreValue,
} from '@context-action/react';
import React, { useCallback, useState } from 'react';

// 예시 데이터 타입
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedBy: string;
}

interface CalculationResult {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  timestamp: number;
  calculatedBy: string;
}

interface ProcessingResult {
  orderId: string;
  status: 'processing' | 'completed' | 'failed';
  processedBy: string;
  timestamp: number;
}

// 액션 정의
interface CartActions extends ActionPayloadMap {
  validateCart: { items: CartItem[] };
  calculateTotal: { items: CartItem[]; discountCode?: string };
  processOrder: { items: CartItem[]; paymentMethod: string };
  clearCart: void;
}

// Context 생성
const {
  Provider: CartProvider,
  useActionDispatch: useCartAction,
  useActionHandler: useCartHandler,
  useActionDispatchWithResult: useCartActionWithResult,
} = createActionContext<CartActions>({ name: 'CartExample' });

// 스토어 생성 - 초기값을 빈 객체 대신 구체적인 값으로 설정
const cartStore = createStore<CartItem[]>('cart', []);
const validationStore = createStore<ValidationResult | null>('validation', {
  isValid: false,
  errors: [],
  validatedBy: 'initial',
});
const calculationStore = createStore<CalculationResult | null>('calculation', {
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  timestamp: Date.now(),
  calculatedBy: 'initial',
});
const orderStore = createStore<ProcessingResult | null>('order', {
  orderId: '',
  status: 'processing',
  processedBy: 'initial',
  timestamp: Date.now(),
});

// 핸들러 컴포넌트
function CartHandlers() {
  // 장바구니 검증 핸들러
  const validateCartHandler: ActionHandler<{ items: CartItem[] }> = useCallback(
    async (payload: { items: CartItem[] }, controller) => {
      console.log(LogArtHelpers.react.info('🔍 장바구니 검증 시작'));

      const { items } = payload;
      const errors: string[] = [];

      // 검증 로직
      if (items.length === 0) {
        errors.push('Cart is empty');
      }

      items.forEach((item) => {
        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for ${item.name}`);
        }
        if (item.price <= 0) {
          errors.push(`Invalid price for ${item.name}`);
        }
      });

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        validatedBy: 'ValidationHandler',
      };

      // 스토어 업데이트
      validationStore.setValue(result);

      console.log(
        LogArtHelpers.react.info(
          `✅ 검증 완료: ${result.isValid ? '성공' : '실패'}`
        )
      );

      // Note: For dispatchWithResult, handlers should still update stores
      // The result collection is handled by the framework
    },
    []
  );

  // 총합 계산 핸들러
  const calculateTotalHandler: ActionHandler<{
    items: CartItem[];
    discountCode?: string;
  }> = useCallback(
    async (
      payload: { items: CartItem[]; discountCode?: string },
      controller
    ) => {
      console.log(LogArtHelpers.react.info('💰 총합 계산 시작'));

      const { items, discountCode } = payload;

      // 계산 로직
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let discount = 0;

      if (discountCode === 'SAVE10') {
        discount = subtotal * 0.1;
        console.log(
          LogArtHelpers.react.info(`🎟️ 할인 적용: 10% ($${discount.toFixed(2)})`)
        );
      }

      const tax = (subtotal - discount) * 0.1;
      const total = subtotal - discount + tax;

      const result: CalculationResult = {
        subtotal,
        tax,
        total,
        itemCount: items.length,
        timestamp: Date.now(),
        calculatedBy: 'CalculationHandler',
      };

      // 스토어 업데이트
      calculationStore.setValue(result);

      console.log(
        LogArtHelpers.react.info(`✅ 계산 완료: $${total.toFixed(2)}`)
      );

      // Note: For dispatchWithResult, handlers should still update stores
      // The result collection is handled by the framework
    },
    []
  );

  // 주문 처리 핸들러
  const processOrderHandler: ActionHandler<{
    items: CartItem[];
    paymentMethod: string;
  }> = useCallback(
    async (
      payload: { items: CartItem[]; paymentMethod: string },
      controller
    ) => {
      console.log(LogArtHelpers.react.info('🛒 주문 처리 시작'));

      const { items, paymentMethod } = payload;

      // 주문 처리 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result: ProcessingResult = {
        orderId: `order_${Date.now()}`,
        status: 'completed',
        processedBy: 'ProcessingHandler',
        timestamp: Date.now(),
      };

      // 스토어 업데이트
      orderStore.setValue(result);

      console.log(LogArtHelpers.react.info(`✅ 주문 완료: ${result.orderId}`));

      // Note: For dispatchWithResult, handlers should still update stores
      // The result collection is handled by the framework
    },
    []
  );

  // 장바구니 비우기 핸들러
  const clearCartHandler: ActionHandler<void, void> = useCallback(
    async (payload: void, controller) => {
      console.log(LogArtHelpers.react.info('🗑️ 장바구니 비우기'));

      cartStore.setValue([]);
      validationStore.setValue(null);
      calculationStore.setValue(null);
      orderStore.setValue(null);

      console.log(LogArtHelpers.react.info('✅ 장바구니 비우기 완료'));
    },
    []
  );

  // 핸들러 등록
  useCartHandler(
    'validateCart',
    validateCartHandler as ActionHandler<{ items: CartItem[] }>,
    {
      priority: 100,
      tags: ['validation', 'business-logic'],
      category: 'cart-validation',
      returnType: 'value',
    }
  );

  useCartHandler(
    'calculateTotal',
    calculateTotalHandler as ActionHandler<{
      items: CartItem[];
      discountCode?: string;
    }>,
    {
      priority: 90,
      tags: ['calculation', 'business-logic'],
      category: 'cart-calculation',
      returnType: 'value',
    }
  );

  useCartHandler(
    'processOrder',
    processOrderHandler as ActionHandler<{
      items: CartItem[];
      paymentMethod: string;
    }>,
    {
      priority: 80,
      tags: ['processing', 'business-logic'],
      category: 'order-processing',
      returnType: 'value',
      blocking: true, // 완료까지 대기
    }
  );

  useCartHandler('clearCart', clearCartHandler, {
    priority: 70,
    tags: ['cleanup'],
    category: 'cart-management',
  });

  return null;
}

// 메인 컴포넌트 (내부)
function UseActionWithResultContent() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'MacBook Pro', price: 2000, quantity: 1 },
    { id: '2', name: 'iPhone', price: 1000, quantity: 2 },
  ]);

  // Store와 컴포넌트 state 동기화
  React.useEffect(() => {
    cartStore.setValue(items);
  }, [items]);
  const [discountCode, setDiscountCode] = useState('');
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 훅들 (이제 Provider 내부에서 호출됨)
  const dispatch = useCartAction();
  const { dispatchWithResult } = useCartActionWithResult();

  // 스토어 구독
  const cartItems = useStoreValue(cartStore);
  const validation = useStoreValue(validationStore);
  const calculation = useStoreValue(calculationStore);
  const order = useStoreValue(orderStore);

  // 개별 액션 실행 (결과 수집)
  const handleValidateCart = async () => {
    console.clear();
    console.log(LogArtHelpers.react.separator('장바구니 검증 (개별 실행)'));
    setIsLoading(true);

    try {
      const result = await dispatchWithResult('validateCart', { items }, {});

      console.log(LogArtHelpers.react.info('실행 결과:'), result);
      setResults(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(LogArtHelpers.react.error('실행 실패', String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 액션 실행
  const handleCalculateWithFiltering = async () => {
    console.clear();
    console.log(LogArtHelpers.react.separator('총합 계산 (태그 필터링)'));
    setIsLoading(true);

    try {
      const result = await dispatchWithResult(
        'calculateTotal',
        { items, discountCode },
        {}
      );

      console.log(LogArtHelpers.react.info('필터링된 실행 결과:'), result);
      setResults(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(LogArtHelpers.react.error('실행 실패', String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 복합 워크플로우 실행
  const handleCompleteWorkflow = async () => {
    console.clear();
    console.log(LogArtHelpers.react.separator('전체 워크플로우 (순차 실행)'));
    setIsLoading(true);

    try {
      // 1단계: 장바구니 검증
      console.log(LogArtHelpers.react.info('1단계: 장바구니 검증'));
      const validationResult = await dispatchWithResult(
        'validateCart',
        { items },
        {}
      );

      if (!validationResult.success) {
        throw new Error('Cart validation failed');
      }

      // 2단계: 총합 계산
      console.log(LogArtHelpers.react.info('2단계: 총합 계산'));
      const calculationResult = await dispatchWithResult(
        'calculateTotal',
        { items, discountCode },
        {}
      );

      // 3단계: 주문 처리
      console.log(LogArtHelpers.react.info('3단계: 주문 처리'));
      const processResult = await dispatchWithResult('processOrder', {
        items,
        paymentMethod: 'credit-card',
      });

      // 전체 결과 표시
      const workflowResult = {
        validation: validationResult.result,
        calculation: calculationResult.result,
        processing: processResult.result,
        totalDuration:
          validationResult.execution.duration +
          calculationResult.execution.duration +
          processResult.execution.duration,
        summary: {
          totalSteps: 3,
          successfulSteps: 3,
          totalHandlersExecuted:
            validationResult.execution.handlersExecuted +
            calculationResult.execution.handlersExecuted +
            processResult.execution.handlersExecuted,
        },
      };

      console.log(LogArtHelpers.react.info('✅ 전체 워크플로우 완료'));
      setResults(JSON.stringify(workflowResult, null, 2));
    } catch (error) {
      console.error(
        LogArtHelpers.react.error('워크플로우 실패', String(error))
      );
      setResults(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 병렬 실행 예시
  const handleParallelExecution = async () => {
    console.clear();
    console.log(LogArtHelpers.react.separator('병렬 실행'));
    setIsLoading(true);

    try {
      const result = await dispatchWithResult(
        'calculateTotal',
        { items, discountCode },
        {}
      );

      console.log(LogArtHelpers.react.info('병렬 실행 결과:'), result);
      setResults(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(LogArtHelpers.react.error('실행 실패', String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 결과 병합 예시
  const handleMergedResults = async () => {
    console.clear();
    console.log(LogArtHelpers.react.separator('결과 병합'));
    setIsLoading(true);

    try {
      const result = await dispatchWithResult(
        'calculateTotal',
        { items, discountCode },
        {}
      );

      console.log(LogArtHelpers.react.info('병합된 결과:'), result);
      setResults(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(LogArtHelpers.react.error('실행 실패', String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 장바구니 아이템 추가
  const addItem = () => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      name: `Item ${items.length + 1}`,
      price: Math.floor(Math.random() * 1000) + 100,
      quantity: 1,
    };
    setItems([...items, newItem]);
    console.log(LogArtHelpers.react.info(`🛍️ 아이템 추가: ${newItem.name}`));
  };

  // 장바구니 비우기 (일반 dispatch)
  const clearCart = () => {
    dispatch('clearCart');
    setItems([]);
    setResults('');
    console.log(LogArtHelpers.react.info('🗑️ 장바구니 비우기 (일반 dispatch)'));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>useActionWithResult 사용 예시</h1>
      <p>
        <code>useActionWithResult</code> 훅을 사용하여 액션 실행 결과를 수집하고
        처리하는 방법을 보여줍니다.
      </p>

      {/* 현재 상태 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
        }}
      >
        <h3>📊 현재 상태</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}
        >
          <div>
            <strong>장바구니:</strong> {cartItems.length}개 아이템
          </div>
          <div>
            <strong>검증:</strong>{' '}
            {validation && validation.validatedBy !== 'initial'
              ? validation.isValid
                ? '✅ 유효'
                : '❌ 오류'
              : '⏳ 미검증'}
          </div>
          <div>
            <strong>계산:</strong>{' '}
            {calculation && calculation.calculatedBy !== 'initial'
              ? `💰 $${calculation.total.toFixed(2)}`
              : '⏳ 미계산'}
          </div>
          <div>
            <strong>주문:</strong>{' '}
            {order && order.processedBy !== 'initial'
              ? `📦 ${order.status}`
              : '⏳ 미처리'}
          </div>
        </div>
      </div>

      {/* 장바구니 관리 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
        }}
      >
        <h3>🛒 장바구니 관리</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={addItem}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ➕ 아이템 추가
          </button>
          <button
            onClick={clearCart}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ 장바구니 비우기
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎟️ 할인코드:
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="SAVE10 입력해보세요"
              style={{
                padding: '6px 10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '150px',
              }}
            />
          </label>
        </div>
      </div>

      {/* 아이템 목록 */}
      {items.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e8f4f8',
            border: '1px solid #bee5eb',
            borderRadius: '8px',
          }}
        >
          <h4>🛍️ 장바구니 아이템</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }}
              >
                <span>{item.name}</span>
                <span>
                  ${item.price} × {item.quantity} = $
                  {item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
        }}
      >
        <h3>🚀 useActionWithResult 예시</h3>
        <p>
          각 버튼을 클릭하여 다양한 결과 수집 패턴을 확인해보세요. 콘솔도 함께
          확인하세요!
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '10px',
          }}
        >
          <button
            onClick={handleValidateCart}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🔍 1. 장바구니 검증 (개별 실행)
          </button>

          <button
            onClick={handleCalculateWithFiltering}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🏷️ 2. 총합 계산 (태그 필터링)
          </button>

          <button
            onClick={handleCompleteWorkflow}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            📋 3. 전체 워크플로우 (순차 실행)
          </button>

          <button
            onClick={handleParallelExecution}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            ⚡ 4. 병렬 실행
          </button>

          <button
            onClick={handleMergedResults}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#e83e8c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🔗 5. 결과 병합
          </button>
        </div>

        {isLoading && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            ⏳ 실행 중... 콘솔을 확인하세요!
          </div>
        )}
      </div>

      {/* 결과 표시 */}
      {results && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
          }}
        >
          <h3>📊 실행 결과</h3>
          <pre
            style={{
              backgroundColor: '#2d3748',
              color: '#e2e8f0',
              padding: '15px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '12px',
              borderRadius: '6px',
              margin: 0,
            }}
          >
            {results}
          </pre>
        </div>
      )}

      {/* 기능 설명 */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#e8f4f8',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
        }}
      >
        <h3>✨ 주요 기능</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px',
          }}
        >
          <div>
            <h4>🎯 결과 수집</h4>
            <ul>
              <li>핸들러 실행 결과 자동 수집</li>
              <li>실행 시간, 성공/실패 상태</li>
              <li>상세한 메타데이터 제공</li>
            </ul>
          </div>
          <div>
            <h4>🔍 필터링</h4>
            <ul>
              <li>태그 기반 핸들러 선택</li>
              <li>카테고리별 실행</li>
              <li>환경별 조건부 실행</li>
            </ul>
          </div>
          <div>
            <h4>📈 결과 전략</h4>
            <ul>
              <li>first, last, all, merge 전략</li>
              <li>커스텀 병합 로직</li>
              <li>결과 개수 제한</li>
            </ul>
          </div>
          <div>
            <h4>⚡ 실행 모드</h4>
            <ul>
              <li>sequential, parallel, race</li>
              <li>모드별 최적화된 결과 수집</li>
              <li>실행 중단 및 조기 종료</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 비교 테이블 */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
        }}
      >
        <h3>⚖️ 일반 dispatch vs dispatchWithResult</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '15px',
          }}
        >
          <div
            style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
            }}
          >
            <h4 style={{ color: '#6c757d' }}>일반 dispatch (기존)</h4>
            <pre
              style={{
                fontSize: '12px',
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                margin: '10px 0',
              }}
            >{`// 결과 없음, 단순 실행
await dispatch('calculateTotal', { items });

// 스토어에서 직접 확인 필요
const result = cartStore.getValue();`}</pre>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              ❌ 실행 결과 미제공
              <br />❌ 실행 시간 정보 없음
              <br />❌ 에러 추적 어려움
            </div>
          </div>

          <div
            style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #28a745',
            }}
          >
            <h4 style={{ color: '#28a745' }}>dispatchWithResult (신규)</h4>
            <pre
              style={{
                fontSize: '12px',
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                margin: '10px 0',
              }}
            >{`// 상세한 실행 결과 반환
const result = await dispatchWithResult(
  'calculateTotal', 
  { items }, 
  {
    result: { collect: true },
    filter: { tags: ['calculation'] }
  }
);

// 풍부한 정보 제공
console.log(result.success);     // 성공 여부
console.log(result.results);     // 핸들러 결과들
console.log(result.execution);   // 실행 메타데이터`}</pre>
            <div style={{ fontSize: '14px', color: '#28a745' }}>
              ✅ 상세한 실행 결과
              <br />✅ 성능 메트릭 제공
              <br />✅ 완전한 에러 추적
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트 래퍼 (CartProvider로 감싸기)
function UseActionWithResultPage() {
  return (
    <CartProvider>
      <CartHandlers />
      <UseActionWithResultContent />
    </CartProvider>
  );
}

export default UseActionWithResultPage;
