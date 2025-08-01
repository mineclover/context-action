# 아키텍처 용어

Context-Action 프레임워크 전반에 걸쳐 사용되는 MVVM 아키텍처 및 설계 패턴입니다.

> **구현 현황**: 7개 용어 구현 완료 ✅  
> **매핑된 파일**: 5개 파일에서 실제 아키텍처 패턴 발견

## MVVM 패턴

**정의**: 중앙집중식 상태 관리와 액션 기반 비즈니스 로직을 사용하는 React 애플리케이션에 맞게 적응된 Model-View-ViewModel 아키텍처 패턴입니다.

**코드 참조**: 모든 패키지에 걸친 프레임워크 전체 구현

**사용 맥락**:
- 애플리케이션 아키텍처 설계
- 관심사의 분리 구현
- 확장 가능한 애플리케이션 구조
- 깔끔한 코드 조직

**주요 특징**:
- **View**: 프레젠테이션을 담당하는 React 컴포넌트
- **ViewModel**: 비즈니스 로직을 포함하는 액션 핸들러
- **Model**: 애플리케이션 상태를 관리하는 스토어
- 액션을 통한 단방향 데이터 플로우
- 레이어 간 타입 안전 통신

**예제**:
```typescript
// View 레이어 (React 컴포넌트)
function UserProfile() {
  const user = useStoreValue(userStore);  // Model 레이어
  const dispatch = useActionDispatch();   // ViewModel 레이어
  
  const updateName = (name: string) => {
    dispatch('updateUser', { id: user.id, name });  // ViewModel로 디스패치
  };
  
  return <div>{user.name}</div>;  // View 프레젠테이션
}

// ViewModel 레이어 (액션 핸들러)
actionRegister.register('updateUser', async (payload, controller) => {
  const currentUser = userStore.getValue();  // Model 레이어 접근
  userStore.setValue({ ...currentUser, ...payload });  // Model 업데이트
});
```

**관련 용어**: [View 레이어](#view-레이어), [ViewModel 레이어](#viewmodel-레이어), [Model 레이어](#model-레이어), [단방향 데이터 플로우](#단방향-데이터-플로우)

---

## View 레이어

**정의**: UI 렌더링과 사용자 상호작용 캡처를 담당하는 React 컴포넌트로 구성된 프레젠테이션 레이어입니다.

**코드 참조**: Context-Action 훅을 사용하는 React 컴포넌트

**사용 맥락**:
- 사용자 인터페이스 렌더링
- 사용자 상호작용 처리
- 반응형 업데이트를 위한 스토어 구독
- 비즈니스 로직을 위한 액션 디스패치

**책임사항**:
- ✅ **해야 할 것**: 프레젠테이션과 사용자 상호작용 처리
- ✅ **해야 할 것**: 관련 스토어 구독
- ✅ **해야 할 것**: 페이로드와 함께 액션 디스패치
- ❌ **하지 말 것**: 비즈니스 로직 포함
- ❌ **하지 말 것**: 스토어 상태 직접 조작
- ❌ **하지 말 것**: API 호출이나 사이드 이펙트

**예제**:
```typescript
function ShoppingCart() {
  // 스토어 구독 (Model 레이어)
  const cart = useStoreValue(cartStore);
  const user = useStoreValue(userStore);
  
  // 액션 디스패처 (ViewModel 레이어)
  const dispatch = useActionDispatch();
  
  // 사용자 상호작용 핸들러
  const handleAddItem = (item: CartItem) => {
    dispatch('addToCart', { userId: user.id, item });
  };
  
  const handleCheckout = () => {
    dispatch('checkout', { cartId: cart.id });
  };
  
  // 프레젠테이션
  return (
    <div>
      <h2>장바구니 ({cart.items.length})</h2>
      {cart.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
      <button onClick={handleCheckout}>결제하기</button>
    </div>
  );
}
```

**관련 용어**: [ViewModel 레이어](#viewmodel-레이어), [Model 레이어](#model-레이어), [스토어 훅](./api-terms.md#스토어-훅), [액션 디스패처](./api-terms.md#액션-디스패처)

---

## ViewModel 레이어

**정의**: 사용자 액션을 처리하고 View와 Model 레이어 간을 조정하는 액션 핸들러를 통해 구현되는 비즈니스 로직 레이어입니다.

**코드 참조**: `ActionRegister`를 통해 등록된 액션 핸들러

**사용 맥락**:
- 비즈니스 로직 구현
- 상태 변환 및 검증
- 크로스 스토어 조정
- 사이드 이펙트 관리

**책임사항**:
- ✅ **해야 할 것**: 비즈니스 로직과 검증 구현
- ✅ **해야 할 것**: 여러 스토어 조정
- ✅ **해야 할 것**: 비동기 작업과 사이드 이펙트 처리
- ✅ **해야 할 것**: 에러 처리와 롤백 제공
- ❌ **하지 말 것**: DOM 직접 조작
- ❌ **하지 말 것**: 프레젠테이션 로직 처리
- ❌ **하지 말 것**: 로컬 상태 유지

**예제**:
```typescript
// ViewModel 레이어의 비즈니스 로직
actionRegister.register('processPayment', async (payload, controller) => {
  // 현재 상태 읽기 (Model 레이어)
  const order = orderStore.getValue();
  const user = userStore.getValue();
  const payment = paymentStore.getValue();
  
  // 비즈니스 검증
  if (!payment.isValid) {
    controller.abort('유효하지 않은 결제 수단');
    return;
  }
  
  if (order.total > user.creditLimit) {
    controller.abort('신용 한도 부족');
    return;
  }
  
  // 상태 업데이트 (Model 레이어)
  orderStore.update(o => ({ ...o, status: 'processing' }));
  
  // 사이드 이펙트 (외부 API 호출)
  try {
    const result = await paymentService.processPayment({
      amount: order.total,
      paymentMethod: payment.method
    });
    
    orderStore.update(o => ({ ...o, status: 'completed', transactionId: result.id }));
  } catch (error) {
    orderStore.update(o => ({ ...o, status: 'failed' }));
    controller.abort('결제 처리 실패');
  }
});
```

**관련 용어**: [View 레이어](#view-레이어), [Model 레이어](#model-레이어), [액션 핸들러](./core-concepts.md#액션-핸들러), [비즈니스 로직](#비즈니스-로직)

---

## Model 레이어

**정의**: 애플리케이션 상태, 지속성, 변경 알림을 처리하는 스토어로 구성된 데이터 관리 레이어입니다.

**코드 참조**: 스토어 구현 및 `StoreRegistry`

**사용 맥락**:
- 애플리케이션 상태 관리
- 데이터 지속성 및 검색
- 구독자에게 변경 알림
- 계산된 값 파생

**책임사항**:
- ✅ **해야 할 것**: 애플리케이션 상태 관리
- ✅ **해야 할 것**: 데이터에 대한 제어된 접근 제공
- ✅ **해야 할 것**: 변경사항을 구독자에게 알림
- ✅ **해야 할 것**: 지속성 레이어와 통합
- ❌ **하지 말 것**: 비즈니스 로직 포함
- ❌ **하지 말 것**: UI 관련 처리
- ❌ **하지 말 것**: 직접 API 호출

**예제**:
```typescript
// 스토어 정의 (Model 레이어)
interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  preferences: defaultPreferences
});

// 계산된 스토어 (파생 상태)
const userDisplayStore = createComputedStore(
  [userStore, settingsStore], 
  (user, settings) => ({
    displayName: settings.showFullName ? user.name : user.name.split(' ')[0],
    avatar: generateAvatar(user.id, settings.theme),
    isOnline: user.lastActivity > Date.now() - 300000
  })
);

// 컴포넌트에서 스토어 사용 (반응형)
function UserHeader() {
  const userDisplay = useStoreValue(userDisplayStore);
  return <div>{userDisplay.displayName}</div>;
}
```

**관련 용어**: [View 레이어](#view-레이어), [ViewModel 레이어](#viewmodel-레이어), [스토어 레지스트리](./core-concepts.md#스토어-레지스트리), [계산된 스토어](./api-terms.md#계산된-스토어)

---

## 지연 평가

**정의**: 등록 시점이 아닌 실행 시점에 스토어 값을 검색하여 핸들러가 항상 최신 상태를 받도록 보장하는 설계 패턴입니다.

**코드 참조**: 액션 핸들러의 스토어 getter 패턴

**사용 맥락**:
- 액션 핸들러 구현
- 상태 일관성 보장
- 오래된 클로저 문제 회피
- 동적 상태 접근

**주요 이점**:
- 오래된 클로저 문제 제거
- 최신 상태 값 보장
- 동적 스토어 내용 지원
- 유연한 핸들러 구성 가능

**예제**:
```typescript
// 액션 핸들러에서의 지연 평가
actionRegister.register('updateCart', (payload, controller) => {
  // getValue()는 등록 시점이 아닌 실행 시점에 호출됨
  const currentCart = cartStore.getValue();    // 항상 최신
  const userPrefs = preferencesStore.getValue(); // 항상 최신
  const inventory = inventoryStore.getValue();   // 항상 최신
  
  // 보장된 최신 값으로 처리
  const updatedCart = processCartUpdate(currentCart, payload, userPrefs, inventory);
  cartStore.setValue(updatedCart);
});

// 문제가 있는 클로저 패턴과의 대조
const badPattern = () => {
  const cart = cartStore.getValue(); // 클로저 생성 시점에 캡처됨
  
  return actionRegister.register('updateCart', (payload, controller) => {
    // 여기서 'cart'는 오래된 값일 수 있음!
    const updatedCart = { ...cart, ...payload };
    cartStore.setValue(updatedCart);
  });
};
```

**관련 용어**: [액션 핸들러](./core-concepts.md#액션-핸들러), [스토어 통합 패턴](./core-concepts.md#스토어-통합-패턴), [최신 상태 접근](#최신-상태-접근)

---

## 분리된 아키텍처

**정의**: 컴포넌트, 액션, 스토어가 직접적인 의존성보다는 잘 정의된 인터페이스를 통해 통신하는 느슨하게 결합된 아키텍처 접근 방식입니다.

**코드 참조**: 프레임워크 전체의 관심사 분리

**사용 맥락**:
- 시스템 설계 및 조직
- 모듈 독립성
- 테스팅 및 유지보수
- 확장성 계획

**주요 원칙**:
- 액션은 컴포넌트에 대해 알지 못함
- 스토어는 액션에 대해 알지 못함
- 컴포넌트는 액션 이름과 페이로드만 알고 있음
- 표준화된 인터페이스를 통한 통신

**이점**:
- 각 레이어의 독립적 테스팅
- 쉬운 리팩터링 및 유지보수
- 재사용 가능한 비즈니스 로직
- 명확한 관심사 분리

**예제**:
```typescript
// 분리된 컴포넌트 (View 레이어)
function ProductCard({ productId }: { productId: string }) {
  const product = useStoreValue(productStore, store => store[productId]);
  const dispatch = useActionDispatch();
  
  // 컴포넌트는 액션 이름과 페이로드 구조만 알고 있음
  const handleAddToCart = () => {
    dispatch('addToCart', { productId, quantity: 1 });
  };
  
  return <button onClick={handleAddToCart}>장바구니에 추가</button>;
}

// 분리된 액션 핸들러 (ViewModel 레이어)  
actionRegister.register('addToCart', async (payload, controller) => {
  // 핸들러는 컴포넌트에 대해 알지 못함
  const cart = cartStore.getValue();
  const product = productStore.getValue()[payload.productId];
  
  // UI와 독립적인 비즈니스 로직
  cartStore.update(cart => ({
    ...cart,
    items: [...cart.items, { ...product, quantity: payload.quantity }]
  }));
});

// 분리된 스토어 (Model 레이어)
const cartStore = createStore<Cart>({
  items: [],
  total: 0
});
// 스토어는 액션이나 컴포넌트에 대해 알지 못함
```

**관련 용어**: [MVVM 패턴](#mvvm-패턴), [관심사의 분리](#관심사의-분리), [느슨한 결합](#느슨한-결합)

---

## 단방향 데이터 플로우

**정의**: 정보가 단일 방향으로 이동하는 데이터 플로우 패턴으로, 사용자 상호작용에서 액션을 통해 상태 업데이트로, 그리고 다시 UI 렌더링으로 이동합니다.

**코드 참조**: 액션 디스패치 및 스토어 구독 패턴

**사용 맥락**:
- 데이터 플로우 설계
- 상태 관리 예측 가능성
- 디버깅 및 추적 가능성
- 성능 최적화

**플로우 시퀀스**:
1. **사용자 상호작용** → 컴포넌트가 이벤트 캡처
2. **액션 디스패치** → 컴포넌트가 페이로드와 함께 액션 디스패치
3. **핸들러 실행** → ViewModel이 비즈니스 로직 처리
4. **상태 업데이트** → Model 레이어가 스토어 업데이트
5. **컴포넌트 리렌더링** → View 레이어가 변경사항 반영

**예제**:
```typescript
// 완전한 단방향 플로우 예제
function Counter() {
  // 5. 컴포넌트가 업데이트된 상태 받음
  const count = useStoreValue(counterStore);
  const dispatch = useActionDispatch();
  
  // 1. 사용자 상호작용
  const handleIncrement = () => {
    // 2. 액션 디스패치
    dispatch('increment', { amount: 1 });
  };
  
  return <button onClick={handleIncrement}>카운트: {count}</button>;
}

// 3. 핸들러 실행 (ViewModel)
actionRegister.register('increment', (payload, controller) => {
  const current = counterStore.getValue();
  // 4. 상태 업데이트 (Model)
  counterStore.setValue(current + payload.amount);
});
```

**관련 용어**: [MVVM 패턴](#mvvm-패턴), [액션 파이프라인 시스템](./core-concepts.md#액션-파이프라인-시스템), [예측 가능한 상태 업데이트](#예측-가능한-상태-업데이트)

---

## 타입 안전성

**정의**: 액션 페이로드부터 스토어 값까지 아키텍처의 모든 레이어에서 타입 정확성을 보장하는 컴파일 타임 타입 검사입니다.

**코드 참조**: 프레임워크 전반의 TypeScript 인터페이스 및 제네릭 타입

**사용 맥락**:
- 개발 시점 에러 방지
- API 계약 강제
- 리팩터링 안전성
- 개발자 경험 향상

**주요 특징**:
- 강력하게 타입이 지정된 액션 페이로드
- 타입 안전 스토어 접근
- 컴파일 타임 인터페이스 검증
- 제네릭 타입 전파

**예제**:
```typescript
// 타입 안전 액션 정의
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email?: string };
  deleteUser: { id: string };
  incrementCounter: void;
}

const actionRegister = new ActionRegister<AppActions>();

// 컴파일 타임 타입 검사
await actionRegister.dispatch('updateUser', { 
  id: '123', 
  name: 'John',
  email: 'john@example.com' 
}); // ✓ 유효

await actionRegister.dispatch('updateUser', { 
  id: '123' 
}); // ✗ 타입 에러: 'name' 누락

await actionRegister.dispatch('incrementCounter'); // ✓ 유효

await actionRegister.dispatch('incrementCounter', { count: 1 }); // ✗ 타입 에러: 예상치 못한 페이로드

// 타입 안전 핸들러 등록
actionRegister.register('updateUser', (payload, controller) => {
  // payload는 { id: string; name: string; email?: string }로 올바르게 타입 지정됨
  console.log(payload.name); // ✓ 유효
  console.log(payload.age);  // ✗ 타입 에러: 속성이 존재하지 않음
});
```

**관련 용어**: [액션 페이로드 맵](./core-concepts.md#액션-페이로드-맵), [액션 핸들러](./core-concepts.md#액션-핸들러), [컴파일 타임 검증](#컴파일-타임-검증)

---

## 비즈니스 로직

**정의**: 데이터가 어떻게 처리되고 비즈니스 요구사항이 어떻게 구현되는지를 정의하는 핵심 애플리케이션 규칙, 프로세스, 워크플로우입니다.

**코드 참조**: 액션 핸들러 내에서 구현된 로직

**사용 맥락**:
- 액션 핸들러 구현
- 검증 및 처리 규칙
- 워크플로우 오케스트레이션
- 도메인별 작업

**특징**:
- ViewModel 레이어(액션 핸들러)에 중앙집중화
- UI 프레젠테이션과 독립적
- 격리되어 테스트 가능
- 다양한 인터페이스에서 재사용 가능

**예제**:
```typescript
// 주문 처리를 위한 비즈니스 로직
actionRegister.register('processOrder', async (payload, controller) => {
  // 비즈니스 규칙 및 검증
  const order = orderStore.getValue();
  const customer = customerStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // 규칙: 고객은 유효한 결제 수단을 가져야 함
  if (!customer.paymentMethods.some(pm => pm.isValid)) {
    controller.abort('유효한 결제 수단이 없습니다');
    return;
  }
  
  // 규칙: 모든 상품이 재고에 있어야 함
  const unavailableItems = order.items.filter(item => 
    inventory[item.productId].quantity < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('일부 상품이 품절되었습니다');
    return;
  }
  
  // 비즈니스 프로세스: 세금 및 할인을 포함한 총액 계산
  const subtotal = order.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  const discount = calculateCustomerDiscount(customer, subtotal);
  const tax = calculateTax(customer.location, subtotal - discount);
  const total = subtotal - discount + tax;
  
  // 규칙: 주문 총액이 고객의 신용 한도를 초과하지 않아야 함
  if (total > customer.creditLimit) {
    controller.abort('주문이 신용 한도를 초과합니다');
    return;
  }
  
  // 비즈니스 프로세스: 주문 및 재고 업데이트
  orderStore.update(o => ({
    ...o,
    subtotal,
    discount,
    tax,
    total,
    status: 'confirmed'
  }));
  
  // 재고 업데이트
  inventoryStore.update(inv => {
    const newInv = { ...inv };
    order.items.forEach(item => {
      newInv[item.productId].quantity -= item.quantity;
    });
    return newInv;
  });
});
```

**관련 용어**: [ViewModel 레이어](#viewmodel-레이어), [액션 핸들러](./core-concepts.md#액션-핸들러), [도메인 규칙](#도메인-규칙)