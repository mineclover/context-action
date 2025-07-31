# 스토어 통합 패턴

## 개요

Context-Action 프레임워크에서 스토어 통합은 **액션**(비즈니스 로직)과 **스토어**(상태 관리) 간의 원활한 조정을 가능하게 합니다. 이 가이드는 단일 및 다중 스토어와 액션을 통합하고, 복잡한 상태 전환을 관리하며, 견고한 에러 처리를 구현하는 고급 패턴을 다룹니다.

### 핵심 통합 원칙

- **🔄 지연 평가**: 스토어 값은 실행 시점에 가져와서 최신 상태 보장
- **🎯 원자적 작업**: 관련된 상태 변경을 함께 조정
- **🛡️ 에러 복구**: 실패한 작업에 대한 롤백 전략
- **⚡ 성능**: 최적화된 스토어 업데이트와 구독
- **🧪 테스트 가능성**: 격리된 테스트를 위한 모의 친화적 아키텍처

## 기본 스토어 통합

### 1. 단일 스토어 작업

가장 간단한 형태의 스토어 통합은 단일 스토어에서 읽고 쓰는 액션입니다.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  updatedAt: number;
}

const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  updatedAt: 0
});

// 간단한 단일 스토어 액션
actionRegister.register('updateUserName', async (payload: { name: string }, controller) => {
  // 현재 상태 읽기
  const currentUser = userStore.getValue();
  
  // 검증 (비즈니스 로직)
  if (!payload.name.trim()) {
    controller.abort('이름은 비워둘 수 없습니다');
    return;
  }
  
  // 새로운 상태로 스토어 업데이트
  userStore.setValue({
    ...currentUser,
    name: payload.name,
    updatedAt: Date.now()
  });
});
```

### 2. 스토어 업데이트 패턴

#### setValue() - 완전 교체
```typescript
// 전체 스토어 값 교체
userStore.setValue({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  updatedAt: Date.now()
});
```

#### update() - 부분 업데이트
```typescript
// 다른 필드를 보존하면서 특정 필드 업데이트
userStore.update(user => ({
  ...user,
  name: 'Jane Doe',
  updatedAt: Date.now()
}));

// 배열 업데이트
todoStore.update(todos => [
  ...todos.filter(todo => todo.id !== payload.id),
  { ...payload, updatedAt: Date.now() }
]);
```

## 다중 스토어 조정

### 1. 크로스 스토어 읽기 작업

액션은 종종 정보에 입각한 결정을 내리기 위해 여러 스토어에서 읽어야 합니다.

```typescript
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

const cartStore = createStore<{ items: CartItem[] }>({ items: [] });
const inventoryStore = createStore<Record<string, Product>>({});
const userStore = createStore<User>({ id: '', name: '', email: '', updatedAt: 0 });

actionRegister.register('addToCart', async (payload: { productId: string; quantity: number }, controller) => {
  // 여러 스토어에서 읽기
  const cart = cartStore.getValue();
  const inventory = inventoryStore.getValue();
  const user = userStore.getValue();
  
  // 여러 스토어 값을 사용한 비즈니스 로직
  const product = inventory[payload.productId];
  if (!product) {
    controller.abort('제품을 찾을 수 없습니다');
    return;
  }
  
  if (product.stock < payload.quantity) {
    controller.abort(`재고가 ${product.stock}개만 남았습니다`);
    return;
  }
  
  // 사용자 권한 확인
  if (!user.id) {
    controller.abort('로그인이 필요합니다');
    return;
  }
  
  // 검증된 데이터로 장바구니 업데이트
  const existingItem = cart.items.find(item => item.productId === payload.productId);
  
  if (existingItem) {
    cartStore.update(cart => ({
      items: cart.items.map(item =>
        item.productId === payload.productId
          ? { ...item, quantity: item.quantity + payload.quantity }
          : item
      )
    }));
  } else {
    cartStore.update(cart => ({
      items: [...cart.items, {
        id: generateId(),
        productId: payload.productId,
        quantity: payload.quantity,
        price: product.price
      }]
    }));
  }
});
```

### 2. 조정된 스토어 업데이트

복잡한 작업은 종종 여러 스토어를 조정하여 업데이트해야 합니다.

```typescript
actionRegister.register('processCheckout', async (payload: { paymentMethod: string }, controller) => {
  // 여러 스토어에서 현재 상태 읽기
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // 검증 단계
  if (cart.items.length === 0) {
    controller.abort('장바구니가 비어있습니다');
    return;
  }
  
  // 모든 아이템의 재고 가용성 확인
  const unavailableItems = cart.items.filter(item => 
    inventory[item.productId]?.stock < item.quantity
  );
  
  if (unavailableItems.length > 0) {
    controller.abort('일부 상품이 더 이상 사용할 수 없습니다');
    return;
  }
  
  // 총액 계산
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = calculateTax(subtotal, user.location);
  const total = subtotal + tax;
  
  // 주문 객체 생성
  const order = {
    id: generateOrderId(),
    userId: user.id,
    items: cart.items,
    subtotal,
    tax,
    total,
    paymentMethod: payload.paymentMethod,
    status: 'processing' as const,
    createdAt: Date.now()
  };
  
  try {
    // 여러 스토어를 원자적으로 업데이트
    orderStore.setValue(order);
    cartStore.setValue({ items: [] });
    
    // 재고 업데이트
    inventoryStore.update(inventory => {
      const updatedInventory = { ...inventory };
      cart.items.forEach(item => {
        if (updatedInventory[item.productId]) {
          updatedInventory[item.productId] = {
            ...updatedInventory[item.productId],
            stock: updatedInventory[item.productId].stock - item.quantity
          };
        }
      });
      return updatedInventory;
    });
    
    // 결제 처리 (비동기 작업)
    await processPayment(order);
    
    // 성공적인 결제 시 주문 상태 업데이트
    orderStore.update(order => ({ ...order, status: 'confirmed' }));
    
  } catch (error) {
    // 실패 시 롤백
    orderStore.setValue(null);
    cartStore.setValue(cart); // 원래 장바구니 복원
    
    // 재고 복원
    inventoryStore.update(inventory => {
      const restoredInventory = { ...inventory };
      cart.items.forEach(item => {
        if (restoredInventory[item.productId]) {
          restoredInventory[item.productId] = {
            ...restoredInventory[item.productId],
            stock: restoredInventory[item.productId].stock + item.quantity
          };
        }
      });
      return restoredInventory;
    });
    
    controller.abort('결제 처리에 실패했습니다');
  }
});
```

## 고급 통합 패턴

### 1. 계산된 스토어 통합

계산된 스토어는 다른 스토어에서 자동으로 값을 파생시키며, 액션은 이를 읽고 재계산을 트리거할 수 있습니다.

```typescript
// 장바구니 요약용 계산된 스토어
const cartSummaryStore = createComputedStore(
  [cartStore, inventoryStore, userStore],
  (cart, inventory, user) => {
    const validItems = cart.items.filter(item => 
      inventory[item.productId] && inventory[item.productId].stock >= item.quantity
    );
    
    const subtotal = validItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    const discount = calculateDiscount(user.membershipLevel, subtotal);
    const tax = calculateTax(subtotal - discount, user.location);
    
    return {
      itemCount: validItems.length,
      invalidItemCount: cart.items.length - validItems.length,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      hasInvalidItems: validItems.length < cart.items.length
    };
  }
);

// 계산된 스토어에서 읽는 액션
actionRegister.register('validateCartBeforeCheckout', async (payload, controller) => {
  const summary = cartSummaryStore.getValue();
  
  if (summary.hasInvalidItems) {
    controller.abort(`${summary.invalidItemCount}개의 상품이 더 이상 사용할 수 없습니다`);
    return;
  }
  
  if (summary.total <= 0) {
    controller.abort('장바구니 총액이 0보다 커야 합니다');
    return;
  }
  
  // 체크아웃 검증 진행
  return { valid: true, summary };
});
```

### 2. 상태 동기화 패턴

#### 마스터-디테일 동기화
```typescript
const userListStore = createStore<User[]>([]);
const selectedUserStore = createStore<User | null>(null);

actionRegister.register('selectUser', async (payload: { userId: string }, controller) => {
  const users = userListStore.getValue();
  const selectedUser = users.find(user => user.id === payload.userId);
  
  if (!selectedUser) {
    controller.abort('사용자를 찾을 수 없습니다');
    return;
  }
  
  selectedUserStore.setValue(selectedUser);
});

actionRegister.register('updateSelectedUser', async (payload: Partial<User>, controller) => {
  const currentUser = selectedUserStore.getValue();
  if (!currentUser) {
    controller.abort('선택된 사용자가 없습니다');
    return;
  }
  
  const updatedUser = { ...currentUser, ...payload, updatedAt: Date.now() };
  
  // 선택된 사용자와 사용자 목록 모두 업데이트
  selectedUserStore.setValue(updatedUser);
  userListStore.update(users => 
    users.map(user => user.id === updatedUser.id ? updatedUser : user)
  );
});
```

#### 캐시 동기화
```typescript
const userCacheStore = createStore<Record<string, User>>({});
const currentUserStore = createStore<User | null>(null);

actionRegister.register('loadUser', async (payload: { userId: string }, controller) => {
  const cache = userCacheStore.getValue();
  
  // 먼저 캐시 확인
  if (cache[payload.userId]) {
    currentUserStore.setValue(cache[payload.userId]);
    return;
  }
  
  try {
    // API에서 가져오기
    const user = await api.getUser(payload.userId);
    
    // 캐시와 현재 사용자 모두 업데이트
    userCacheStore.update(cache => ({ ...cache, [user.id]: user }));
    currentUserStore.setValue(user);
  } catch (error) {
    controller.abort('사용자 로드에 실패했습니다');
  }
});
```

### 3. 트랜잭션과 같은 작업

여러 스토어를 원자적으로 업데이트해야 하는 작업의 경우 트랜잭션과 유사한 패턴을 구현할 수 있습니다.

```typescript
interface Transaction {
  id: string;
  operations: Array<{
    store: string;
    oldValue: any;
    newValue: any;
  }>;
  committed: boolean;
}

const transactionStore = createStore<Transaction | null>(null);

actionRegister.register('beginTransaction', async (payload, controller) => {
  const transaction: Transaction = {
    id: generateTransactionId(),
    operations: [],
    committed: false
  };
  
  transactionStore.setValue(transaction);
});

actionRegister.register('transferFunds', async (payload: { fromAccount: string; toAccount: string; amount: number }, controller) => {
  const accounts = accountStore.getValue();
  const transaction = transactionStore.getValue();
  
  if (!transaction) {
    controller.abort('활성 트랜잭션이 없습니다');
    return;
  }
  
  const fromAccount = accounts[payload.fromAccount];
  const toAccount = accounts[payload.toAccount];
  
  if (!fromAccount || !toAccount) {
    controller.abort('계정을 찾을 수 없습니다');
    return;
  }
  
  if (fromAccount.balance < payload.amount) {
    controller.abort('잔액이 부족합니다');
    return;
  }
  
  try {
    // 롤백을 위한 작업 기록
    const updatedTransaction = {
      ...transaction,
      operations: [
        ...transaction.operations,
        {
          store: 'accounts',
          oldValue: accounts,
          newValue: {
            ...accounts,
            [payload.fromAccount]: {
              ...fromAccount,
              balance: fromAccount.balance - payload.amount
            },
            [payload.toAccount]: {
              ...toAccount,
              balance: toAccount.balance + payload.amount
            }
          }
        }
      ]
    };
    
    transactionStore.setValue(updatedTransaction);
    
    // 변경사항 적용
    accountStore.setValue(updatedTransaction.operations[0].newValue);
    
    // 트랜잭션 커밋
    await api.recordTransaction({
      from: payload.fromAccount,
      to: payload.toAccount,
      amount: payload.amount
    });
    
    transactionStore.update(tx => tx ? { ...tx, committed: true } : null);
    
  } catch (error) {
    // 실패 시 롤백
    const operations = transaction.operations;
    if (operations.length > 0) {
      accountStore.setValue(operations[0].oldValue);
    }
    
    transactionStore.setValue(null);
    controller.abort('트랜잭션에 실패했습니다');
  }
});
```

## 에러 처리 및 복구

### 1. 롤백 전략

```typescript
actionRegister.register('complexUpdate', async (payload, controller) => {
  // 롤백을 위한 원래 상태 캡처
  const originalUser = userStore.getValue();
  const originalSettings = settingsStore.getValue();
  const originalPreferences = preferencesStore.getValue();
  
  try {
    // 1단계: 사용자 업데이트
    userStore.setValue({
      ...originalUser,
      ...payload.user,
      updatedAt: Date.now()
    });
    
    // 2단계: 설정 업데이트
    settingsStore.setValue({
      ...originalSettings,
      ...payload.settings
    });
    
    // 3단계: 실패할 수 있는 비동기 작업
    await api.syncUserData({
      user: userStore.getValue(),
      settings: settingsStore.getValue()
    });
    
    // 4단계: 환경설정 업데이트
    preferencesStore.setValue({
      ...originalPreferences,
      ...payload.preferences
    });
    
  } catch (error) {
    // 모든 변경사항 롤백
    userStore.setValue(originalUser);
    settingsStore.setValue(originalSettings);
    preferencesStore.setValue(originalPreferences);
    
    controller.abort(`업데이트 실패: ${error.message}`);
  }
});
```

### 2. 보상 액션

```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  const compensationActions: Array<() => Promise<void>> = [];
  
  try {
    // 1단계: 재고 예약
    await reserveInventory(payload.items);
    compensationActions.push(() => releaseInventory(payload.items));
    
    // 2단계: 결제 처리
    const paymentResult = await processPayment(payload.payment);
    compensationActions.push(() => refundPayment(paymentResult.transactionId));
    
    // 3단계: 주문 생성
    const order = await createOrder(payload);
    orderStore.setValue(order);
    
    // 4단계: 확인 이메일 발송
    await sendOrderConfirmation(order);
    
  } catch (error) {
    // 보상 액션을 역순으로 실행
    for (const compensate of compensationActions.reverse()) {
      try {
        await compensate();
      } catch (compensationError) {
        console.error('보상 실패:', compensationError);
      }
    }
    
    controller.abort(`주문 처리 실패: ${error.message}`);
  }
});
```

## 성능 최적화

### 1. 스토어 업데이트 배치화

```typescript
// ❌ 비효율적: 여러 개별 업데이트로 여러 번 리렌더링 유발
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({ ...user, name: payload.name }));
  userStore.update(user => ({ ...user, email: payload.email }));
  userStore.update(user => ({ ...user, phone: payload.phone }));
  userStore.update(user => ({ ...user, updatedAt: Date.now() }));
});

// ✅ 효율적: 단일 배치 업데이트
actionRegister.register('updateUserProfile', async (payload, controller) => {
  userStore.update(user => ({
    ...user,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    updatedAt: Date.now()
  }));
});
```

### 2. 조건부 업데이트

```typescript
actionRegister.register('updateUserIfChanged', async (payload, controller) => {
  const currentUser = userStore.getValue();
  
  // 업데이트가 실제로 필요한지 확인
  const hasChanges = 
    currentUser.name !== payload.name ||
    currentUser.email !== payload.email ||
    currentUser.phone !== payload.phone;
  
  if (!hasChanges) {
    return; // 업데이트 불필요
  }
  
  userStore.setValue({
    ...currentUser,
    ...payload,
    updatedAt: Date.now()
  });
});
```

### 3. 선택적 스토어 알림

```typescript
// 스토어 선택자를 사용하여 리렌더링 최소화
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// 컴포넌트는 이름이 변경될 때만 리렌더링되고, 다른 사용자 속성은 무시
function UserNameDisplay() {
  const name = useStoreValue(userStore, user => user.name);
  return <div>{name}</div>;
}
```

## 스토어 통합 테스트

### 1. 모의 스토어를 사용한 액션 단위 테스트

```typescript
describe('updateUser action', () => {
  let mockUserStore: jest.Mocked<Store<User>>;
  let mockSettingsStore: jest.Mocked<Store<Settings>>;
  
  beforeEach(() => {
    mockUserStore = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      update: jest.fn(),
      subscribe: jest.fn()
    };
    
    mockSettingsStore = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      update: jest.fn(),
      subscribe: jest.fn()
    };
  });
  
  it('should update user with valid data', async () => {
    // 준비
    const currentUser = { id: '1', name: 'John', email: 'john@example.com', updatedAt: 0 };
    const settings = { validateNames: true };
    
    mockUserStore.getValue.mockReturnValue(currentUser);
    mockSettingsStore.getValue.mockReturnValue(settings);
    
    const payload = { name: 'Jane Doe' };
    const controller = { abort: jest.fn() };
    
    // 실행
    await updateUserHandler(payload, controller);
    
    // 검증
    expect(mockUserStore.setValue).toHaveBeenCalledWith({
      ...currentUser,
      name: 'Jane Doe',
      updatedAt: expect.any(Number)
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should abort with invalid name when validation is enabled', async () => {
    // 준비
    const currentUser = { id: '1', name: 'John', email: 'john@example.com', updatedAt: 0 };
    const settings = { validateNames: true };
    
    mockUserStore.getValue.mockReturnValue(currentUser);
    mockSettingsStore.getValue.mockReturnValue(settings);
    
    const payload = { name: '' };
    const controller = { abort: jest.fn() };
    
    // 실행
    await updateUserHandler(payload, controller);
    
    // 검증
    expect(controller.abort).toHaveBeenCalledWith('이름은 비워둘 수 없습니다');
    expect(mockUserStore.setValue).not.toHaveBeenCalled();
  });
});
```

### 2. 실제 스토어를 사용한 통합 테스트

```typescript
describe('Cart Operations Integration', () => {
  let cartStore: Store<{ items: CartItem[] }>;
  let inventoryStore: Store<Record<string, Product>>;
  
  beforeEach(() => {
    cartStore = createStore({ items: [] });
    inventoryStore = createStore({
      'product1': { id: 'product1', name: 'Product 1', stock: 10, price: 99.99 },
      'product2': { id: 'product2', name: 'Product 2', stock: 5, price: 149.99 }
    });
  });
  
  it('should add item to cart when inventory is available', async () => {
    // 준비
    const payload = { productId: 'product1', quantity: 2 };
    const controller = { abort: jest.fn() };
    
    // 실행
    await addToCartHandler(payload, controller);
    
    // 검증
    const cart = cartStore.getValue();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      productId: 'product1',
      quantity: 2,
      price: 99.99
    });
    expect(controller.abort).not.toHaveBeenCalled();
  });
  
  it('should abort when insufficient inventory', async () => {
    // 준비
    const payload = { productId: 'product2', quantity: 10 }; // 재고는 5개만 있음
    const controller = { abort: jest.fn() };
    
    // 실행
    await addToCartHandler(payload, controller);
    
    // 검증
    expect(controller.abort).toHaveBeenCalledWith('재고가 5개만 남았습니다');
    
    const cart = cartStore.getValue();
    expect(cart.items).toHaveLength(0);
  });
});
```

## 모범 사례

### ✅ 스토어 통합에서 해야 할 것

1. **항상 최신 상태 읽기**: 클로저가 아닌 실행 시점에 `getValue()` 사용
2. **업데이트 전 검증**: 변경하기 전에 비즈니스 규칙 확인
3. **에러를 우아하게 처리**: 복잡한 작업에 대한 롤백 전략 구현
4. **원자적 업데이트 사용**: 관련 변경사항을 함께 조정
5. **통합 지점 테스트**: 다중 스토어 작업에 대한 테스트 작성
6. **비즈니스 로직 문서화**: 복잡한 조정 패턴에 주석 작성
7. **TypeScript 사용**: 스토어 작업에서 타입 안전성 활용

### ❌ 스토어 통합에서 하지 말 것

1. **참조를 저장하지 말 것**: 비동기 작업 전반에 걸쳐 스토어 값을 캐시하지 말 것
2. **검증을 건너뛰지 말 것**: 스토어 업데이트 전에 항상 데이터 검증
3. **실패를 무시하지 말 것**: 에러를 처리하고 의미 있는 피드백 제공
4. **스토어를 직접 업데이트하지 말 것**: 항상 액션 핸들러를 통해 처리
5. **정리를 잊지 말 것**: 에러 시나리오에서 정리 처리
6. **과도하게 복잡하게 만들지 말 것**: 간단하게 시작하고 점진적으로 복잡성 추가
7. **테스트를 건너뛰지 말 것**: 성공과 실패 시나리오 모두 테스트

## 일반적인 패턴 요약

| 패턴 | 사용 사례 | 복잡성 | 장점 |
|---------|----------|------------|----------|
| 단일 스토어 업데이트 | 간단한 CRUD 작업 | 낮음 | 이해하고 테스트하기 쉬움 |
| 다중 스토어 읽기 | 여러 데이터 소스를 통한 검증 | 중간 | 포괄적인 검증 |
| 조정된 업데이트 | 트랜잭션과 같은 작업 | 높음 | 데이터 일관성 |
| 계산된 스토어 통합 | 파생 상태 계산 | 중간 | 자동 재계산 |
| 롤백 전략 | 에러 복구 | 높음 | 데이터 무결성 |
| 상태 동기화 | 마스터-디테일 관계 | 중간 | 뷰 간 일관성 |

## 관련 자료

- [아키텍처 개요](./architecture.md) - 구현 패턴을 포함한 포괄적인 아키텍처 가이드
- [아키텍처 다이어그램](./architecture-diagrams.md) - 스토어 통합 플로우의 시각적 다이어그램
- [MVVM 아키텍처 가이드](./mvvm-architecture.md) - 전체 아키텍처 패턴
- [데이터 플로우 패턴](./data-flow-patterns.md) - 고급 데이터 플로우 기법
- [모범 사례](./best-practices.md) - 개발 모범 사례
- [API 참조 - 스토어](/api/stores/) - 스토어 API 문서
- [예제 - MVVM 패턴](/examples/mvvm-patterns/) - 실용적인 예제