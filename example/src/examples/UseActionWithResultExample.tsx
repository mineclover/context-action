import React, { useState, useCallback } from 'react';
import { createActionContext } from '@context-action/react';
import { useStoreValue, createStore } from '@context-action/react';
import type { ActionPayloadMap, ActionHandler } from '@context-action/core';

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
  useAction: useCartAction,
  useActionHandler: useCartHandler,
  useActionWithResult: useCartActionWithResult,
} = createActionContext<CartActions>({ name: 'CartExample' });

// 스토어 생성
const cartStore = createStore<CartItem[]>('cart', []);
const validationStore = createStore<ValidationResult | null>('validation', {
  isValid: false,
  errors: [],
  validatedBy: 'initial'
});
const calculationStore = createStore<CalculationResult | null>('calculation', {
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  timestamp: Date.now(),
  calculatedBy: 'initial'
});
const orderStore = createStore<ProcessingResult | null>('order', {
  orderId: '',
  status: 'processing',
  processedBy: 'initial',
  timestamp: Date.now()
});

// 핸들러 컴포넌트
function CartHandlers() {
  // 장바구니 검증 핸들러
  const validateCartHandler: ActionHandler<{ items: CartItem[] }> = useCallback(async (payload: { items: CartItem[] }, controller) => {
    console.log('🔍 Validating cart...');
    
    const { items } = payload;
    const errors: string[] = [];
    
    // 검증 로직
    if (items.length === 0) {
      errors.push('Cart is empty');
    }
    
    items.forEach(item => {
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
    
    // Note: For dispatchWithResult, handlers should still update stores
    // The result collection is handled by the framework
  }, []);

  // 총합 계산 핸들러
  const calculateTotalHandler: ActionHandler<{ items: CartItem[]; discountCode?: string }> = useCallback(async (payload: { items: CartItem[]; discountCode?: string }, controller) => {
    console.log('💰 Calculating total...');
    
    const { items, discountCode } = payload;
    
    // 계산 로직
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    
    if (discountCode === 'SAVE10') {
      discount = subtotal * 0.1;
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
    
    // Note: For dispatchWithResult, handlers should still update stores
    // The result collection is handled by the framework
  }, []);

  // 주문 처리 핸들러
  const processOrderHandler: ActionHandler<{ items: CartItem[]; paymentMethod: string }> = useCallback(async (payload: { items: CartItem[]; paymentMethod: string }, controller) => {
    console.log('🛒 Processing order...');
    
    const { items, paymentMethod } = payload;
    
    // 주문 처리 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result: ProcessingResult = {
      orderId: `order_${Date.now()}`,
      status: 'completed',
      processedBy: 'ProcessingHandler',
      timestamp: Date.now(),
    };
    
    // 스토어 업데이트
    orderStore.setValue(result);
    
    // 장바구니 비우기
    cartStore.setValue([]);
    
    // Note: For dispatchWithResult, handlers should still update stores
    // The result collection is handled by the framework
  }, []);

  // 핸들러 등록
  useCartHandler('validateCart', validateCartHandler as ActionHandler<{ items: CartItem[] }>, {
    priority: 100,
    tags: ['validation', 'business-logic'],
    category: 'cart-validation',
    returnType: 'value'
  });

  useCartHandler('calculateTotal', calculateTotalHandler as ActionHandler<{ items: CartItem[]; discountCode?: string }>, {
    priority: 90,
    tags: ['calculation', 'business-logic'],
    category: 'cart-calculation',
    returnType: 'value'
  });

  useCartHandler('processOrder', processOrderHandler as ActionHandler<{ items: CartItem[]; paymentMethod: string }>, {
    priority: 80,
    tags: ['processing', 'business-logic'],
    category: 'order-processing',
    returnType: 'value',
    blocking: true // 완료까지 대기
  });

  return null;
}

// 메인 컴포넌트
function UseActionWithResultExample() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'MacBook Pro', price: 2000, quantity: 1 },
    { id: '2', name: 'iPhone', price: 1000, quantity: 2 },
  ]);
  const [discountCode, setDiscountCode] = useState('');
  const [results, setResults] = useState<string>('');

  // 훅들
  const dispatch = useCartAction();
  const dispatchWithResult = useCartActionWithResult();
  
  // 스토어 구독
  const cartItems = useStoreValue(cartStore);
  const validation = useStoreValue(validationStore);
  const calculation = useStoreValue(calculationStore);
  const order = useStoreValue(orderStore);

  // 개별 액션 실행 (결과 수집)
  const handleValidateCart = async () => {
    console.log('\n=== Validate Cart (개별 실행) ===');
    
    const result = await dispatchWithResult('validateCart', { items }, {
      result: {
        collect: true,
        strategy: 'first'
      }
    });
    
    console.log('Execution Result:', result);
    setResults(JSON.stringify(result, null, 2));
  };

  // 필터링된 액션 실행
  const handleCalculateWithFiltering = async () => {
    console.log('\n=== Calculate Total (태그 필터링) ===');
    
    const result = await dispatchWithResult('calculateTotal', { items, discountCode }, {
      result: {
        collect: true,
        strategy: 'all'
      },
      filter: {
        tags: ['calculation'], // calculation 태그만 실행
        excludeTags: ['logging'] // logging 태그 제외
      }
    });
    
    console.log('Filtered Execution Result:', result);
    setResults(JSON.stringify(result, null, 2));
  };

  // 복합 워크플로우 실행
  const handleCompleteWorkflow = async () => {
    console.log('\n=== Complete Workflow (순차 실행) ===');
    
    try {
      // 1단계: 장바구니 검증
      const validationResult = await dispatchWithResult('validateCart', { items }, {
        result: { collect: true, strategy: 'first' }
      });
      
      console.log('1. Validation:', validationResult.result);
      
      if (!validationResult.success) {
        throw new Error('Cart validation failed');
      }
      
      // 2단계: 총합 계산
      const calculationResult = await dispatchWithResult('calculateTotal', { items, discountCode }, {
        result: { collect: true, strategy: 'first' }
      });
      
      console.log('2. Calculation:', calculationResult.result);
      
      // 3단계: 주문 처리
      const processResult = await dispatchWithResult('processOrder', 
        { items, paymentMethod: 'credit-card' }, 
        {
          result: { collect: true, strategy: 'first' },
          filter: { category: 'order-processing' }
        }
      );
      
      console.log('3. Processing:', processResult.result);
      
      // 전체 결과 표시
      const workflowResult = {
        validation: validationResult.result,
        calculation: calculationResult.result,
        processing: processResult.result,
        totalDuration: validationResult.execution.duration + 
                      calculationResult.execution.duration + 
                      processResult.execution.duration
      };
      
      setResults(JSON.stringify(workflowResult, null, 2));
      
    } catch (error) {
      console.error('Workflow failed:', error);
      setResults(`Error: ${error}`);
    }
  };

  // 병렬 실행 예시
  const handleParallelExecution = async () => {
    console.log('\n=== Parallel Execution ===');
    
    const result = await dispatchWithResult('calculateTotal', { items, discountCode }, {
      result: {
        collect: true,
        strategy: 'all'
      },
      executionMode: 'parallel' // 병렬 실행
    });
    
    console.log('Parallel Execution Result:', result);
    setResults(JSON.stringify(result, null, 2));
  };

  // 결과 병합 예시
  const handleMergedResults = async () => {
    console.log('\n=== Merged Results ===');
    
    const result = await dispatchWithResult('calculateTotal', { items, discountCode }, {
      result: {
        collect: true,
        strategy: 'merge',
        merger: (results: any[]): any => {
          // 커스텀 병합 로직
          return results.reduce((merged, current) => ({
            ...merged,
            ...current,
            mergedAt: Date.now(),
            totalHandlers: results.length
          }), {} as any);
        }
      }
    });
    
    console.log('Merged Result:', result);
    setResults(JSON.stringify(result, null, 2));
  };

  // 장바구니 아이템 추가
  const addItem = () => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      name: `Item ${items.length + 1}`,
      price: Math.floor(Math.random() * 1000) + 100,
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  // 장바구니 비우기 (일반 dispatch)
  const clearCart = () => {
    dispatch('clearCart');
    setItems([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>useActionWithResult 사용 예시</h2>
      
      {/* 현재 상태 */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>현재 상태</h3>
        <div><strong>Cart Items:</strong> {cartItems.length}개</div>
        <div><strong>Validation:</strong> {validation ? (validation.isValid ? '✅ 유효' : '❌ 오류') : '미검증'}</div>
        <div><strong>Calculation:</strong> {calculation ? `$${calculation.total}` : '미계산'}</div>
        <div><strong>Order:</strong> {order ? order.status : '미처리'}</div>
      </div>

      {/* 장바구니 관리 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>장바구니 관리</h3>
        <button onClick={addItem} style={{ marginRight: '10px' }}>
          아이템 추가
        </button>
        <button onClick={clearCart}>
          장바구니 비우기
        </button>
        <div style={{ marginTop: '10px' }}>
          <label>
            할인코드: 
            <input 
              value={discountCode} 
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="SAVE10"
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>useActionWithResult 예시</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={handleValidateCart}>
            1. 장바구니 검증 (개별 실행)
          </button>
          <button onClick={handleCalculateWithFiltering}>
            2. 총합 계산 (태그 필터링)
          </button>
          <button onClick={handleCompleteWorkflow}>
            3. 전체 워크플로우 (순차 실행)
          </button>
          <button onClick={handleParallelExecution}>
            4. 병렬 실행
          </button>
          <button onClick={handleMergedResults}>
            5. 결과 병합
          </button>
        </div>
      </div>

      {/* 결과 표시 */}
      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3>실행 결과</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '12px'
          }}>
            {results}
          </pre>
        </div>
      )}

      {/* 설명 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8' }}>
        <h3>주요 기능</h3>
        <ul>
          <li><strong>결과 수집:</strong> 핸들러 실행 결과를 자동 수집</li>
          <li><strong>실행 정보:</strong> 실행 시간, 성공/실패, 에러 정보 제공</li>
          <li><strong>필터링:</strong> 태그, 카테고리, 환경별 핸들러 필터링</li>
          <li><strong>결과 전략:</strong> first, last, all, merge, custom 전략 지원</li>
          <li><strong>실행 모드:</strong> sequential, parallel, race 모드 지원</li>
          <li><strong>타입 안전성:</strong> 완전한 TypeScript 지원</li>
        </ul>
      </div>

      {/* 비교 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd' }}>
        <h3>일반 dispatch vs dispatchWithResult</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>일반 dispatch (기존)</h4>
            <pre style={{ fontSize: '12px' }}>{`
// 결과 없음, 단순 실행
await dispatch('calculateTotal', { items });
            `}</pre>
          </div>
          <div>
            <h4>dispatchWithResult (신규)</h4>
            <pre style={{ fontSize: '12px' }}>{`
// 상세한 실행 결과 반환
const result = await dispatchWithResult(
  'calculateTotal', 
  { items }, 
  {
    result: { collect: true },
    filter: { tags: ['calculation'] }
  }
);

console.log(result.success);     // 성공 여부
console.log(result.results);     // 핸들러 결과들
console.log(result.execution);   // 실행 메타데이터
            `}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 App 컴포넌트
export default function App() {
  return (
    <CartProvider>
      <CartHandlers />
      <UseActionWithResultExample />
    </CartProvider>
  );
}