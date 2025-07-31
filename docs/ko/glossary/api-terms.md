# API 용어

Context-Action 프레임워크의 기술적 구현 및 API 개념입니다.

## ActionRegister

**정의**: 액션 파이프라인을 관리하고, 핸들러 등록을 담당하며, 타입 안전 액션 디스패치 기능을 제공하는 핵심 클래스입니다.

**코드 참조**: `packages/core/src/ActionRegister.ts`의 `ActionRegister<T>` 클래스

**사용 맥락**:
- 중앙 액션 관리 시스템
- 비즈니스 로직 오케스트레이션
- 타입 안전 액션 디스패치
- 핸들러 생명주기 관리

**주요 특징**:
- 액션 페이로드 맵을 위한 제네릭 타입 지원
- 우선순위 기반 핸들러 실행
- 모니터링을 위한 이벤트 발생
- 구성 가능한 로깅 및 디버깅
- 파이프라인 플로우 제어

**예제**:
```typescript
// 타입이 지정된 ActionRegister 인스턴스 생성
interface AppActions extends ActionPayloadMap {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

const actionRegister = new ActionRegister<AppActions>({
  name: 'MyApp',
  debug: true,
  logLevel: LogLevel.INFO
});

// 핸들러 등록
actionRegister.register('updateUser', async (payload, controller) => {
  const user = userStore.getValue();
  userStore.setValue({ ...user, ...payload });
}, { priority: 10, blocking: true });

// 타입 안전 액션 디스패치
await actionRegister.dispatch('updateUser', { id: '123', name: 'John' });
```

**관련 용어**: [액션 핸들러](./core-concepts.md#액션-핸들러), [파이프라인 컨트롤러](./core-concepts.md#파이프라인-컨트롤러), [액션 페이로드 맵](./core-concepts.md#액션-페이로드-맵)

---

## StoreProvider

**정의**: 스토어 인스턴스를 관리하고 React 컨텍스트 시스템을 통해 자식 컴포넌트에 제공하는 React 컨텍스트 프로바이더입니다.

**코드 참조**: React 패키지의 `StoreProvider` 컴포넌트

**사용 맥락**:
- 애플리케이션 루트 설정
- 스토어 의존성 주입
- React 컨텍스트 패턴 구현
- 스토어 생명주기 관리

**주요 특징**:
- 중앙집중식 스토어 관리
- 컨텍스트 기반 의존성 주입
- 스토어 인스턴스 생명주기 제어
- React 컴포넌트 트리와의 통합

**예제**:
```typescript
// StoreProvider를 사용한 애플리케이션 설정
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        {/* 자식 컴포넌트에서 스토어 레지스트리 사용 가능 */}
        <UserManagement />
        <ShoppingCart />
        <OrderHistory />
      </ActionProvider>
    </StoreProvider>
  );
}

// 자식 컴포넌트에서 스토어 접근
function UserProfile() {
  const registry = useStoreRegistry();
  const userStore = registry.getStore('user');
  const user = useStoreValue(userStore);
  
  return <div>{user.name}</div>;
}
```

**관련 용어**: [ActionProvider](#actionprovider), [스토어 레지스트리](./core-concepts.md#스토어-레지스트리), [스토어 훅](#스토어-훅)

---

## ActionProvider

**정의**: React 컴포넌트 트리 내에서 액션 등록 및 디스패치 기능을 관리하는 React 컨텍스트 프로바이더입니다.

**코드 참조**: React 패키지의 `ActionProvider` 컴포넌트

**사용 맥락**:
- 액션 핸들러 등록 컨텍스트
- 액션 디스패치 접근성
- 컴포넌트 생명주기 통합
- 핸들러 정리 관리

**주요 특징**:
- 액션 디스패치 컨텍스트 제공
- 핸들러 등록 생명주기
- 언마운트 시 자동 정리
- 스토어 프로바이더와의 통합

**예제**:
```typescript
// ActionProvider 설정
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <Application />
      </ActionProvider>
    </StoreProvider>
  );
}

// 컴포넌트에서 액션 등록
function UserActions() {
  const dispatch = useActionDispatch();
  const registry = useStoreRegistry();
  
  useEffect(() => {
    const userStore = registry.getStore('user');
    
    const unregister = actionRegister.register('updateUser', 
      async (payload, controller) => {
        const user = userStore.getValue();
        userStore.setValue({ ...user, ...payload });
      }
    );
    
    return unregister; // 언마운트 시 정리
  }, [registry]);
  
  return null; // 액션 등록 컴포넌트
}
```

**관련 용어**: [StoreProvider](#storeprovider), [액션 디스패처](#액션-디스패처), [useActionDispatch](#useactiondispatch)

---

## 스토어 훅

**정의**: 스토어 값에 대한 반응형 접근을 제공하고 컴포넌트가 스토어 변경사항을 구독할 수 있게 하는 React 훅입니다.

**코드 참조**: `packages/react/src/store/hooks/`의 다양한 훅

**사용 맥락**:
- 컴포넌트-스토어 통합
- 반응형 UI 업데이트
- 스토어 값 구독
- 성능 최적화

**사용 가능한 훅**:
- `useStoreValue`: 선택적 셀렉터와 함께 스토어 값 구독
- `useStore`: 값과 세터를 포함한 전체 스토어 접근
- `useComputedStore`: 계산된/파생된 값 구독
- `usePersistedStore`: 지속성 통합을 포함한 스토어
- `useDynamicStore`: 동적 스토어 생성 및 관리

**예제**:
```typescript
// 기본 스토어 구독
function UserName() {
  const user = useStoreValue(userStore);
  return <span>{user.name}</span>;
}

// 선택적 구독 (성능 최적화)
function UserEmail() {
  const email = useStoreValue(userStore, user => user.email);
  return <span>{email}</span>; // 이메일 변경 시에만 리렌더링
}

// 계산된 스토어 사용
const userDisplayStore = createComputedStore([userStore, settingsStore], 
  (user, settings) => ({
    displayName: settings.showFullName ? user.name : user.name.split(' ')[0],
    theme: settings.theme
  })
);

function UserDisplay() {
  const display = useStoreValue(userDisplayStore);
  return <div className={display.theme}>{display.displayName}</div>;
}
```

**관련 용어**: [스토어 통합 패턴](./core-concepts.md#스토어-통합-패턴), [계산된 스토어](#계산된-스토어), [선택적 구독](#선택적-구독)

---

## 크로스 스토어 조정

**정의**: 단일 액션 핸들러 내에서 여러 스토어에 걸친 액션을 조정하는 패턴으로, 여러 데이터 도메인에 걸친 복잡한 비즈니스 로직을 가능하게 합니다.

**코드 참조**: 여러 스토어에 접근하는 액션 핸들러

**사용 맥락**:
- 복잡한 비즈니스 작업
- 다중 도메인 데이터 업데이트
- 트랜잭션과 같은 동작
- 데이터 일관성 유지

**주요 패턴**:
- 처리 전 여러 스토어에서 읽기
- 스토어 간 제약조건 검증
- 여러 스토어를 원자적으로 업데이트
- 실패 시 롤백

**예제**:
```typescript
// 여러 스토어에 걸친 복잡한 체크아웃 프로세스
actionRegister.register('checkout', async (payload, controller) => {
  // 여러 스토어에서 읽기
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  const payment = paymentStore.getValue();
  
  // 크로스 스토어 검증
  const unavailableItems = cart.items.filter(item => 
    inventory[item.id].quantity < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('일부 상품이 더 이상 사용할 수 없습니다');
    return;
  }
  
  if (cart.total > user.creditLimit) {
    controller.abort('신용 한도를 초과합니다');
    return;
  }
  
  // 여러 스토어에 걸친 조정된 업데이트
  try {
    // 주문 생성
    const order = {
      id: generateOrderId(),
      userId: user.id,
      items: cart.items,
      total: cart.total,
      status: 'processing'
    };
    
    // 원자적 업데이트
    orderStore.setValue(order);
    cartStore.setValue({ items: [], total: 0 });
    inventoryStore.update(inv => updateInventory(inv, cart.items));
    
    // 외부 API 호출
    await paymentService.processPayment(order);
    
    orderStore.update(o => ({ ...o, status: 'confirmed' }));
    
  } catch (error) {
    // 실패 시 롤백
    orderStore.setValue(null);
    cartStore.setValue(cart);
    inventoryStore.update(inv => restoreInventory(inv, cart.items));
    controller.abort('결제 처리 실패');
  }
});
```

**관련 용어**: [스토어 통합 패턴](./core-concepts.md#스토어-통합-패턴), [액션 핸들러](./core-concepts.md#액션-핸들러), [원자적 업데이트](#원자적-업데이트)

---

## 비동기 작업

**정의**: 적절한 에러 처리와 상태 관리를 유지하면서 외부 API 호출, 데이터베이스 작업 및 기타 논블로킹 작업을 처리하는 액션 핸들러 내의 비동기 작업입니다.

**코드 참조**: `async/await` 패턴을 사용하는 비동기 액션 핸들러

**사용 맥락**:
- 외부 API 통합
- 데이터베이스 작업
- 파일 시스템 작업
- 시간 지연 작업

**주요 특징**:
- 적절한 에러 처리 및 롤백
- 로딩 상태 관리
- 타임아웃 및 취소 지원
- 진행률 추적 기능

**예제**:
```typescript
// 로딩 상태와 에러 처리를 포함한 비동기 작업
actionRegister.register('fetchUserData', async (payload, controller) => {
  // 로딩 상태 설정
  uiStore.update(ui => ({ ...ui, loading: true, error: null }));
  
  try {
    // 외부 API 호출
    const userData = await api.getUserProfile(payload.userId);
    const preferences = await api.getUserPreferences(payload.userId);
    
    // API 응답으로 여러 스토어 업데이트
    userStore.setValue(userData);
    preferencesStore.setValue(preferences);
    
    // 활동 로그
    activityStore.update(activities => [...activities, {
      type: 'user_data_fetched',
      userId: payload.userId,
      timestamp: Date.now()
    }]);
    
  } catch (error) {
    // 에러 처리
    uiStore.update(ui => ({ 
      ...ui, 
      error: '사용자 데이터를 가져오는데 실패했습니다',
      errorDetails: error.message 
    }));
    
    controller.abort('API 요청 실패');
    
  } finally {
    // 항상 로딩 상태 해제
    uiStore.update(ui => ({ ...ui, loading: false }));
  }
});

// 컴포넌트에서 로딩 상태 사용
function UserProfile({ userId }: { userId: string }) {
  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);
  const dispatch = useActionDispatch();
  
  useEffect(() => {
    dispatch('fetchUserData', { userId });
  }, [userId, dispatch]);
  
  if (ui.loading) return <div>로딩 중...</div>;
  if (ui.error) return <div>에러: {ui.error}</div>;
  
  return <div>{user.name}</div>;
}
```

**관련 용어**: [액션 핸들러](./core-concepts.md#액션-핸들러), [에러 처리](#에러-처리), [로딩 상태](#로딩-상태)

---

## 액션 디스패처

**정의**: 적절한 페이로드 검증과 타입 검사를 통해 액션을 디스패치할 수 있게 하는 타입 안전 함수 인터페이스입니다.

**코드 참조**: `packages/core/src/types.ts`의 `ActionDispatcher<T>` 인터페이스

**사용 맥락**:
- 컴포넌트 액션 디스패치
- 타입 안전 액션 호출
- 비즈니스 로직 트리거
- 사용자 상호작용 처리

**주요 특징**:
- 페이로드가 있는 액션과 없는 액션에 대한 오버로드
- 컴파일 타임 타입 검사
- 비동기 작업 지원
- 에러 전파

**예제**:
```typescript
// 타입 안전 액션 디스패처 사용
interface AppActions extends ActionPayloadMap {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

function Counter() {
  const count = useStoreValue(counterStore);
  const dispatch = useActionDispatch<AppActions>();
  
  const handleIncrement = () => {
    dispatch('increment');  // ✓ 유효 - 페이로드 불필요
  };
  
  const handleSetCount = (value: number) => {
    dispatch('setCount', value);  // ✓ 유효 - 올바른 페이로드 타입
  };
  
  const handleUpdateUser = () => {
    dispatch('updateUser', { id: '123', name: 'John' });  // ✓ 유효
    // dispatch('updateUser');  // ✗ 타입 에러 - 페이로드 필요
    // dispatch('setCount');    // ✗ 타입 에러 - 페이로드 필요
  };
  
  return (
    <div>
      <span>카운트: {count}</span>
      <button onClick={handleIncrement}>+</button>
      <button onClick={() => handleSetCount(0)}>리셋</button>
    </div>
  );
}
```

**관련 용어**: [액션 페이로드 맵](./core-concepts.md#액션-페이로드-맵), [타입 안전성](./architecture-terms.md#타입-안전성), [useActionDispatch](#useactiondispatch)

---

## 우선순위 기반 실행

**정의**: 액션 핸들러가 할당된 우선순위 값의 순서대로 실행되는 핸들러 실행 전략으로, 높은 우선순위가 먼저 실행됩니다.

**코드 참조**: `ActionRegister.register()`의 핸들러 정렬 로직

**사용 맥락**:
- 핸들러 실행 순서 제어
- 핸들러 간 의존성 관리
- 중요한 작업 우선순위 지정
- 검증 및 전처리

**주요 특징**:
- 숫자 우선순위 값 (높은 값 = 먼저 실행)
- 등록 시 자동 정렬
- 음수 우선순위 지원
- 일관된 실행 순서

**예제**:
```typescript
// 우선순위 기반 핸들러 등록
actionRegister.register('processOrder', validateOrder, { 
  priority: 100,  // 먼저 실행 - 검증
  id: 'order-validator'
});

actionRegister.register('processOrder', enrichOrderData, { 
  priority: 50,   // 두 번째 실행 - 데이터 보강
  id: 'order-enricher'
});

actionRegister.register('processOrder', saveOrderToDatabase, { 
  priority: 10,   // 세 번째 실행 - 지속성
  id: 'order-persister'
});

actionRegister.register('processOrder', sendConfirmationEmail, { 
  priority: 0,    // 마지막 실행 - 알림
  id: 'order-notifier'
});

// 'processOrder'가 디스패치되면, 핸들러는 우선순위 순서로 실행:
// 1. validateOrder (priority: 100)
// 2. enrichOrderData (priority: 50)  
// 3. saveOrderToDatabase (priority: 10)
// 4. sendConfirmationEmail (priority: 0)

// 가장 높은 우선순위를 가진 중요한 에러 핸들러
actionRegister.register('processOrder', emergencyOrderValidation, { 
  priority: 1000, // 항상 먼저 실행
  blocking: true, // 실패 시 실행 차단
  id: 'emergency-validator'
});
```

**관련 용어**: [핸들러 구성](./core-concepts.md#핸들러-구성), [액션 핸들러](./core-concepts.md#액션-핸들러), [파이프라인 실행](#파이프라인-실행)

---

## 계산된 스토어

**정의**: 하나 이상의 소스 스토어에서 값을 파생시키는 반응형 스토어로, 의존성이 변경될 때 자동으로 업데이트됩니다.

**코드 참조**: `createComputedStore` 함수 및 관련 훅

**사용 맥락**:
- 파생 상태 계산
- 성능 최적화
- 복잡한 데이터 변환
- 반응형 계산

**주요 특징**:
- 자동 의존성 추적
- 지연 계산
- 성능을 위한 메모이제이션
- 여러 소스 스토어 지원

**예제**:
```typescript
// 간단한 계산된 스토어
const fullNameStore = createComputedStore([userStore], 
  (user) => `${user.firstName} ${user.lastName}`
);

// 여러 의존성을 가진 복잡한 계산된 스토어
const shoppingCartSummary = createComputedStore(
  [cartStore, inventoryStore, userStore, promoStore], 
  (cart, inventory, user, promos) => {
    // 사용 가능한 상품 필터링
    const availableItems = cart.items.filter(item => 
      inventory[item.id]?.quantity >= item.quantity
    );
    
    // 소계 계산
    const subtotal = availableItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // 사용자별 할인 적용
    const discount = calculateDiscount(user.membershipLevel, subtotal, promos);
    
    // 사용자 위치 기반 세금 계산
    const tax = calculateTax(user.location, subtotal - discount);
    
    return {
      itemCount: availableItems.length,
      unavailableCount: cart.items.length - availableItems.length,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      isValid: availableItems.length > 0
    };
  }
);

// 컴포넌트에서 사용
function CartSummary() {
  const summary = useStoreValue(shoppingCartSummary);
  
  return (
    <div>
      <div>상품: {summary.itemCount}</div>
      {summary.unavailableCount > 0 && (
        <div>사용 불가: {summary.unavailableCount}</div>
      )}
      <div>소계: ${summary.subtotal}</div>
      <div>할인: -${summary.discount}</div>
      <div>세금: ${summary.tax}</div>
      <div>총계: ${summary.total}</div>
    </div>
  );
}
```

**관련 용어**: [스토어 훅](#스토어-훅), [반응형 업데이트](#반응형-업데이트), [성능 최적화](#성능-최적화)

---

## 파이프라인 컨텍스트

**정의**: 현재 페이로드, 핸들러 큐, 실행 상태를 포함하여 액션 파이프라인 처리 중 상태를 유지하는 내부 실행 컨텍스트입니다.

**코드 참조**: `packages/core/src/types.ts`의 `PipelineContext<T>` 인터페이스

**사용 맥락**:
- 내부 파이프라인 실행
- 핸들러 조정
- 실행 상태 추적
- 에러 처리 및 복구

**주요 속성**:
- `action`: 실행되는 액션 이름
- `payload`: 현재 페이로드 (실행 중 수정 가능)
- `handlers`: 액션에 등록된 핸들러 배열
- `aborted`: 파이프라인 실행이 중단되었는지 여부
- `abortReason`: 해당하는 경우 중단 이유
- `currentIndex`: 현재 실행 중인 핸들러

**예제**:
```typescript
// 파이프라인 컨텍스트는 ActionRegister가 내부적으로 사용
// 사용자는 보통 직접 상호작용하지 않지만, 이를 이해하면
// 디버깅과 고급 사용에 도움됨

// 내부 파이프라인 실행 (단순화됨)
async function executePipeline<T>(context: PipelineContext<T>) {
  for (let i = 0; i < context.handlers.length; i++) {
    if (context.aborted) break;
    
    const handler = context.handlers[i];
    context.currentIndex = i;
    
    const controller = {
      abort: (reason?: string) => {
        context.aborted = true;
        context.abortReason = reason;
      },
      modifyPayload: (modifier: (payload: T) => T) => {
        context.payload = modifier(context.payload);
      },
      getPayload: () => context.payload
    };
    
    await handler.handler(context.payload, controller);
  }
}
```

**관련 용어**: [파이프라인 컨트롤러](./core-concepts.md#파이프라인-컨트롤러), [액션 파이프라인 시스템](./core-concepts.md#액션-파이프라인-시스템), [핸들러 실행](#핸들러-실행)