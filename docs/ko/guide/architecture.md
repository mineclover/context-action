# Context-Action 스토어 통합 아키텍처

## 개요

Context-Action 프레임워크는 MVVM에서 영감을 받은 패턴을 통해 명확한 관심사 분리를 구현합니다:
- **Actions**는 비즈니스 로직을 처리 (ViewModel 레이어)
- **Stores**는 상태를 관리 (Model 레이어)  
- **Components**는 UI를 렌더링 (View 레이어)

이러한 아키텍처 접근법은 서로 다른 책임 간의 명확한 경계를 통해 유지보수 가능하고, 테스트 가능하며, 확장 가능한 애플리케이션을 보장합니다.

## 핵심 아키텍처

### 1. Action Pipeline 시스템

Action들은 dispatched 이벤트를 처리하는 중앙 파이프라인에 등록됩니다:

```typescript
// Action 정의
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  calculateTotal: { items: CartItem[] };
}

// Action 핸들러 등록
actionRegister.register('updateUser', async (payload, controller) => {
  // 비즈니스 로직이 여기에 들어갑니다
});
```

### 2. Store 통합 패턴

Action 핸들러는 payload를 받고 store의 getter/setter를 사용하여:
1. Getter를 통해 현재 상태 값 읽기
2. Payload + 현재 상태로 비즈니스 로직 실행
3. Setter를 통해 Store 업데이트

```typescript
// Store 통합을 사용한 Action 핸들러
actionRegister.register('updateUser', async (payload, controller) => {
  // 현재 상태 가져오기
  const currentUser = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // 비즈니스 로직
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now(),
    theme: settings.theme // 크로스 스토어 로직
  };
  
  // Store 업데이트
  userStore.setValue(updatedUser);
  activityStore.update(activities => [...activities, {
    type: 'user_updated',
    timestamp: Date.now(),
    userId: payload.id
  }]);
});
```

## 데이터 흐름

```
┌──────────────┐     dispatch      ┌──────────────┐
│              │ -----------------> │              │
│   Component  │                    │    Action    │
│              │ <----------------- │   Pipeline   │
└──────────────┘     subscribe      └──────────────┘
       │                                    │
       │ useStore                          │ get/set
       ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│              │                    │              │
│ Store Hooks  │ <----------------- │    Stores    │
│              │      observe       │              │
└──────────────┘                    └──────────────┘
```

### 실행 흐름:

1. **Component Dispatch**: 컴포넌트가 `dispatch('actionName', payload)` 호출
2. **Pipeline Processing**: Action 파이프라인이 우선순위 순서로 등록된 핸들러 실행
3. **Store Access**: 핸들러들이 store getter를 사용하여 현재 상태 읽기
4. **Business Logic**: 핸들러들이 현재 상태 값으로 payload 처리
5. **Store Updates**: 핸들러들이 store setter를 호출하여 상태 업데이트
6. **Component Re-render**: 업데이트된 store를 구독하는 컴포넌트들이 자동으로 재렌더링

## 핵심 설계 원칙

### 1. 지연 평가 (Lazy Evaluation)
- Store getter는 실행 시점에 호출되어 신선한 값 보장
- 오래된 클로저 문제 없음 - 핸들러는 항상 현재 상태를 얻음

### 2. 분리된 아키텍처 (Decoupled Architecture)
- Action은 컴포넌트를 알지 못함
- Store는 Action을 알지 못함
- 컴포넌트는 Action 이름과 payload만 알면 됨

### 3. 타입 안전성 (Type Safety)
- 전체에 걸친 완전한 TypeScript 지원
- Action과 payload가 강타이핑됨
- Store 값이 타입 무결성 유지

### 4. 테스트 가능성 (Testability)
- Action을 mock store로 독립적으로 테스트 가능
- Store를 action 파이프라인 없이 테스트 가능
- 컴포넌트를 mock dispatch로 테스트 가능

## React와의 통합

### StoreProvider 설정
```typescript
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <Application />
      </ActionProvider>
    </StoreProvider>
  );
}
```

### 컴포넌트 사용법
```typescript
function UserProfile() {
  const dispatch = useActionDispatch();
  const user = useStoreValue(userStore);
  
  const updateName = (name: string) => {
    dispatch('updateUser', { id: user.id, name });
  };
  
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateName('새로운 이름')}>
        이름 업데이트
      </button>
    </div>
  );
}
```

## 고급 패턴

### 1. 크로스 스토어 조정
```typescript
actionRegister.register('checkout', async (payload, controller) => {
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // 재고 검증
  const unavailable = cart.items.filter(item => 
    inventory[item.id] < item.quantity
  );
  
  if (unavailable.length > 0) {
    controller.abort('상품을 사용할 수 없습니다');
    return;
  }
  
  // 여러 store를 원자적으로 업데이트
  orderStore.setValue({ ...payload, status: 'processing' });
  cartStore.setValue({ items: [] });
  inventoryStore.update(inv => updateInventory(inv, cart.items));
});
```

### 2. 비동기 작업과 상태 업데이트
```typescript
actionRegister.register('fetchUserData', async (payload, controller) => {
  // 로딩 상태 설정
  uiStore.update(ui => ({ ...ui, loading: true }));
  
  try {
    const response = await api.getUser(payload.userId);
    
    // 사용자 store 업데이트
    userStore.setValue(response.user);
    
    // 관련 store 업데이트
    if (response.preferences) {
      preferencesStore.setValue(response.preferences);
    }
    
  } catch (error) {
    errorStore.setValue({ 
      message: '사용자 데이터를 가져올 수 없습니다',
      error 
    });
    controller.abort('API 오류');
  } finally {
    uiStore.update(ui => ({ ...ui, loading: false }));
  }
});
```

## 이점

1. **명확한 분리**: 비즈니스 로직은 Action에, 상태는 Store에, UI는 컴포넌트에
2. **재사용성**: Action은 여러 컴포넌트에서 재사용 가능
3. **테스트 가능성**: 각 레이어를 독립적으로 테스트 가능
4. **타입 안전성**: 컴파일 시점 검사를 통한 완전한 TypeScript 지원
5. **성능**: 변경된 store를 사용하는 컴포넌트만 재렌더링
6. **디버깅**: 파이프라인 추적을 통한 명확한 Action 흐름
7. **확장성**: 앱이 성장함에 따라 새로운 Action과 Store를 쉽게 추가

## 모범 사례

1. **집중된 Action 유지**: 하나의 Action은 하나의 일을 잘 해야 함
2. **우선순위 사용**: 의존적인 작업에 대해 높은 우선순위 핸들러가 먼저 실행
3. **오류 처리**: 비동기 핸들러에서 try-catch와 controller.abort() 사용
4. **부작용 방지**: Store 업데이트를 예측 가능하고 추적 가능하게 유지
5. **모든 것 타이핑**: 안전성과 문서화를 위해 TypeScript 활용
6. **핸들러 테스트**: mock store로 Action 핸들러에 대한 단위 테스트 작성

## 관련 자료

- [MVVM 아키텍처](./mvvm-architecture.md) - MVVM 패턴에 대한 심화 학습
- [Store 통합](./store-integration.md) - 고급 store 통합 패턴
- [Action Pipeline](./action-pipeline.md) - Action 실행 시스템 이해
- [모범 사례](./best-practices.md) - 개발 모범 사례 및 가이드라인