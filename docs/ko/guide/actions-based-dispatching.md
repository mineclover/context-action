# Actions 기반 디스패칭

Actions 기반 디스패칭은 Context-Action에서 액션을 디스패치하는 더 직관적이고 함수형 접근 방식을 제공합니다. 기존의 `registry.dispatch()` 메서드 대신 `registry.actions` 속성을 통해 액션을 직접 함수로 호출할 수 있습니다.

## 개요

`actions` 속성은 각 등록된 액션이 호출 가능한 함수가 되는 함수형 인터페이스를 제공합니다. 이 접근 방식은 향상된 타입 안전성과 더 직관적인 구문으로 더 나은 개발자 경험을 제공합니다.

```typescript
// 기존 방식
await registry.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

// Actions 기반 방식
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
```

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
}

interface AppResults {
  userLogin: { accepted: boolean };
}

const registry = new ActionRegister<AppActions, AppResults>();
registry.register('userLogin', payload => ({
  accepted: payload.email.includes('@'),
}));

const loginResult = await registry.actionsWithResult.userLogin({
  userId: '123',
  email: 'user@example.com',
});

if (loginResult.outcome === 'completed') {
  console.log(loginResult.result);
}
```

## 기본 사용법

### 1. 액션 타입 정의

먼저 `ActionPayloadMap` 인터페이스를 사용하여 액션 타입을 정의합니다:

```typescript
interface AppActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  sendNotification: { message: string; userId: string };
  resetApp: void;
}
```

### 2. ActionRegister 생성

액션 타입과 함께 ActionRegister 인스턴스를 생성합니다:

```typescript
const registry = new ActionRegister<AppActions>({
  name: 'MyApp',
  registry: { debug: true }
});
```

### 3. 핸들러 등록

액션에 대한 핸들러를 등록합니다:

```typescript
registry.register('userLogin', (payload) => {
  console.log('사용자 로그인:', payload.userId, payload.email);
  return { success: true };
}, { id: 'login-handler', priority: 100 });

registry.register('userLogout', () => {
  console.log('사용자 로그아웃');
  return { success: true };
}, { id: 'logout-handler', priority: 100 });
```

### 4. 액션 디스패치

Actions 기반 접근 방식을 사용하여 액션을 디스패치합니다:

```typescript
// 페이로드가 있는 액션
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
await registry.actions.processData({ data: { name: 'test' }, type: 'json' });
await registry.actions.sendNotification({ message: '안녕하세요!', userId: '123' });

// 페이로드가 없는 액션
await registry.actions.userLogout();
await registry.actions.resetApp();
```

호출 가능한 `actions` 및 `actionsWithResult` Proxy는 `then`, `catch`,
`finally`, `toJSON`, `constructor`, `__proto__`, `prototype` 등의 프로토콜
속성명을 예약합니다. Promise/직렬화 프로토콜 충돌을 방지하기 위해 이
이름들은 Proxy 타입에서 제외됩니다. 기존 액션이 이 이름을 사용한다면
`dispatch()` 또는 `dispatchWithResult()`를 직접 사용하세요.

### 5. 결과 수집이 있는 액션

상세한 실행 결과가 필요한 경우 `actionsWithResult`를 사용하세요:

```typescript
// 결과 수집이 있는 액션
const loginResult = await registry.actionsWithResult.userLogin({ 
  userId: '123', 
  email: 'user@example.com' 
});

console.log('로그인 결과:', {
  success: loginResult.success,
  duration: loginResult.execution.duration,
  handlersExecuted: loginResult.execution.handlersExecuted,
  results: loginResult.results
});

// 페이로드가 없는 액션의 결과 수집
const logoutResult = await registry.actionsWithResult.userLogout();
console.log('로그아웃 결과:', logoutResult);
```

## 고급 기능

### 옵션 지원

Actions 기반 디스패칭은 기존 디스패칭과 동일한 모든 옵션을 지원합니다:

```typescript
// 실행 옵션과 함께
await registry.actions.processData(
  { data: { name: 'test2' }, type: 'json' },
  { executionMode: 'parallel' }
);

// 디바운스와 함께
await registry.actions.sendNotification(
  { message: '디바운스된 메시지', userId: '456' },
  { debounce: 100 }
);

// 스로틀과 함께
await registry.actions.userLogin(
  { userId: '789', email: 'throttled@example.com' },
  { throttle: 1000 }
);
```

### 타입 안전성

Actions 기반 접근 방식은 훌륭한 타입 안전성을 제공합니다:

```typescript
// ✅ 올바른 사용법 - TypeScript가 자동완성을 제공합니다
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });

// ❌ TypeScript 오류 - 잘못된 페이로드 구조
// await registry.actions.userLogin({ wrongField: 'value' });

// ❌ TypeScript 오류 - void 액션에는 페이로드가 허용되지 않음
// await registry.actions.userLogout({ payload: 'should not exist' });
```

### 필터링 및 고급 옵션

모든 고급 필터링 및 실행 옵션을 사용할 수 있습니다:

```typescript
// 필터링과 함께
await registry.actions.processData(
  { data: { name: 'test' }, type: 'json' },
  {
    filter: {
      handlerIds: ['data-processor'],
      priority: { min: 80 }
    }
  }
);

// 결과 수집과 함께
const result = await registry.actions.processData(
  { data: { name: 'test' }, type: 'json' },
  {
    result: { collect: true, strategy: 'all' }
  }
);
```

## 장점

### 1. **직관적인 구문**
Actions 기반 디스패칭은 더 자연스럽고 함수형으로 느껴집니다:

```typescript
// 더 직관적
await registry.actions.userLogin(credentials);

// vs 기존 방식
await registry.dispatch('userLogin', credentials);
```

### 2. **더 나은 타입 안전성**
자동완성과 컴파일 타임 오류 검사가 포함된 완전한 TypeScript 지원:

```typescript
// IDE가 액션 이름에 대한 자동완성을 표시합니다
registry.actions. // ← 표시: userLogin, userLogout, processData 등

// IDE가 페이로드 구조에 대한 자동완성을 표시합니다
registry.actions.userLogin({ // ← 표시: userId, email 속성
```

### 3. **일관된 API**
페이로드가 있는지 여부에 관계없이 모든 액션이 동일한 패턴을 따릅니다:

```typescript
// 페이로드가 있는 액션
await registry.actions.userLogin(payload);
await registry.actions.processData(payload);

// 페이로드가 없는 액션
await registry.actions.userLogout();
await registry.actions.resetApp();
```

### 4. **전체 기능 지원**
모든 기존 디스패치 기능을 사용할 수 있습니다:

- 실행 모드 (순차, 병렬, 경쟁)
- 필터링 (핸들러 ID, 우선순위, 사용자 정의 필터별)
- 스로틀링 및 디바운싱
- 결과 수집
- 중단 신호
- 오류 처리

## 기존 디스패치에서 마이그레이션

현재 기존 디스패치를 사용하고 있다면, 마이그레이션은 간단합니다:

```typescript
// 이전
await registry.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
await registry.dispatch('userLogout', undefined);
await registry.dispatch('processData', { data: {} }, { executionMode: 'parallel' });

// 이후
await registry.actions.userLogin({ userId: '123', email: 'user@example.com' });
await registry.actions.userLogout();
await registry.actions.processData({ data: {} }, { executionMode: 'parallel' });
```

## 모범 사례

### 1. **설명적인 액션 이름 사용**
무엇을 하는지 명확하게 설명하는 액션 이름을 선택하세요:

```typescript
// 좋음
userLogin, processPayment, sendNotification

// 피하기
action1, doSomething, handle
```

### 2. **명확한 페이로드 타입 정의**
페이로드에 대해 구체적인 타입을 사용하세요:

```typescript
interface AppActions extends ActionPayloadMap {
  userLogin: { 
    userId: string; 
    email: string; 
    rememberMe?: boolean;
  };
  processPayment: {
    amount: number;
    currency: string;
    paymentMethod: 'card' | 'bank' | 'paypal';
  };
}
```

### 3. **적절한 오류 처리**
핸들러에서 적절한 오류 처리를 사용하세요:

```typescript
registry.register('processPayment', async (payload) => {
  try {
    const result = await paymentService.process(payload);
    return { success: true, transactionId: result.id };
  } catch (error) {
    console.error('결제 실패:', error);
    throw error; // 프레임워크가 처리하도록 다시 던지기
  }
});
```

### 4. **옵션을 현명하게 사용**
사용 사례에 따라 실행 옵션을 적용하세요:

```typescript
// 반복될 수 있는 사용자 상호작용의 경우
await registry.actions.saveDraft(
  { content: draftContent },
  { debounce: 500 }
);

// 비용이 많이 드는 작업의 경우
await registry.actions.generateReport(
  { reportType: 'monthly' },
  { executionMode: 'parallel' }
);
```

## 예제

### 완전한 예제

```typescript
import { ActionRegister, ActionPayloadMap } from '@context-action/core';

interface ECommerceActions extends ActionPayloadMap {
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  checkout: { paymentMethod: string };
  clearCart: void;
}

async function ecommerceExample() {
  const registry = new ActionRegister<ECommerceActions>({
    name: 'ECommerce',
    registry: { debug: true }
  });

  // 핸들러 등록
  registry.register('addToCart', (payload) => {
    console.log(`장바구니에 상품 ${payload.productId} ${payload.quantity}개 추가`);
    return { success: true };
  });

  registry.register('removeFromCart', (payload) => {
    console.log(`장바구니에서 상품 ${payload.productId} 제거`);
    return { success: true };
  });

  registry.register('checkout', async (payload) => {
    console.log(`${payload.paymentMethod}로 결제 처리 중`);
    // 결제 처리 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, orderId: 'order-123' };
  });

  registry.register('clearCart', () => {
    console.log('장바구니 비움');
    return { success: true };
  });

  // Actions 기반 디스패칭 사용
  await registry.actions.addToCart({ productId: 'prod-1', quantity: 2 });
  await registry.actions.addToCart({ productId: 'prod-2', quantity: 1 });
  
  // 옵션과 함께 체크아웃
  const result = await registry.actions.checkout(
    { paymentMethod: 'card' },
    { executionMode: 'parallel' }
  );
  
  console.log('체크아웃 결과:', result);
  
  // 장바구니 비우기
  await registry.actions.clearCart();
}

ecommerceExample().catch(console.error);
```

Actions 기반 디스패칭은 기존 접근 방식의 모든 힘과 유연성을 유지하면서 Context-Action으로 작업하는 더 직관적이고 개발자 친화적인 방법을 제공합니다.
