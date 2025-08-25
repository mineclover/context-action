# 고급 액션 패턴

멀티 컨텍스트 설정 기반을 기반으로 구축된 Context-Action 프레임워크의 고급 액션 패턴 개요입니다.

## 필수 조건

이 가이드는 완전한 멀티 컨텍스트 설정 패턴을 기반으로 합니다. 기본적인 아키텍처와 타입 정의는 다음을 참조하세요:

**[📚 멀티 컨텍스트 설정 →](../setup/multi-context-setup.md)** - 완전한 MVVM 아키텍처, 도메인 분리, 프로바이더 조합 패턴

### 필수 설정 컴포넌트

이 가이드의 모든 고급 패턴은 다음을 포함한 멀티 컨텍스트 설정이 필요합니다:

- **MVVM 아키텍처 설정**: Model, ViewModel, Performance 레이어 컨텍스트
- **도메인 컨텍스트 아키텍처**: User, Product, UI, Business, Validation, Design 도메인
- **프로바이더 조합**: 레이어 기반 및 도메인 기반 조합 패턴
- **크로스 컨텍스트 통신**: 이벤트 버스 및 컨텍스트 브리지 유틸리티
- **타입 시스템**: 스토어, 액션, 참조를 위한 완전한 인터페이스 정의

## 패턴 카테고리

Context-Action 프레임워크는 멀티 컨텍스트 설정을 활용하는 액션 패턴의 세 가지 주요 카테고리를 제공합니다:

### 🚀 디스패치 패턴
MVVM 아키텍처 분리와 함께 멀티 컨텍스트 설정을 사용한 크로스 도메인 액션 디스패칭.

- **크로스 도메인 실행**: User, Product, UI, Business 도메인에 걸쳐 액션 디스패치
- **레이어 인식 필터링**: Model, ViewModel, Performance 레이어별 실행
- **멀티 컨텍스트 성능**: 공유 이벤트 버스를 통한 도메인 격리 실행

**[디스패치 패턴 보기 →](./dispatch-patterns.md)**

### 📊 결과 수집 패턴
도메인 경계를 넘나드는 복잡한 비즈니스 워크플로우를 위한 고급 결과 집계.

- **도메인 결과 집계**: User, Product, Business 컨텍스트에서 결과 수집
- **크로스 컨텍스트 검증**: 결과 처리와 검증 도메인 통합
- **엔터프라이즈 결과 처리**: 도메인 분리를 통한 대규모 데이터 처리

**[결과와 함께 디스패치 패턴 보기 →](./dispatch-with-result.md)**

### ⚙️ 등록 패턴
MVVM 레이어 구성과 크로스 컨텍스트 조정을 갖춘 도메인 인식 핸들러 등록.

- **도메인별 구성**: 비즈니스 도메인 기반 우선순위 및 태그
- **레이어 인식 등록**: Model, ViewModel, Performance 레이어 타겟팅
- **크로스 컨텍스트 조정**: 이벤트 버스 통합 및 컨텍스트 브리지 패턴

**[등록 패턴 보기 →](./register-patterns.md)**

### 🔌 디스패치 접근 패턴
도메인별 훅과 컨텍스트 브리지 유틸리티를 사용한 멀티 컨텍스트 디스패치 접근.

- **도메인 훅 접근**: `useUserActionDispatch()`, `useProductActionDispatch()` 패턴
- **컨텍스트 브리지 접근**: `useContextBridge()` 유틸리티를 사용한 크로스 도메인 디스패치
- **MVVM 레이어 접근**: 복잡한 아키텍처용 레이어별 디스패치 패턴

**[디스패치 접근 패턴 보기 →](./dispatch-access.md)**

### 🔧 핸들러 상태 접근 패턴
MVVM 아키텍처 통합을 갖춘 도메인 컨텍스트에 걸친 고급 상태 접근 패턴.

- **크로스 도메인 상태 접근**: 모든 도메인에서 User, Product, UI 상태 접근
- **스토어 매니저 통합**: `useStoreManager()` 패턴을 사용한 고급 상태 관리
- **컨텍스트 브리지 상태 접근**: 도메인 경계를 넘나드는 통합 상태 접근

**[핸들러 상태 접근 패턴 보기 →](./handler-state-access.md)**

## 설정 기반 고급 패턴 예제

### 크로스 도메인 액션 조정
```typescript
// 복잡한 워크플로우를 위한 멀티 컨텍스트 설정 사용
function useCheckoutWorkflow() {
  const userActions = useUserActionDispatch();
  const productActions = useProductActionDispatch();
  const businessActions = useBusinessActionDispatch();
  const validationActions = useValidationActionDispatch();
  const eventBus = useEventBus();

  const executeCheckout = useCallback(async () => {
    // 1단계: 사용자 세션 및 장바구니 검증
    await validationActions('validateForm', {
      formId: 'checkout',
      data: { userId, cartItems },
      schema: checkoutSchema
    });

    // 2단계: 비즈니스 도메인을 통한 주문 처리
    const orderResult = await businessActions('processOrder', {
      customerId: userId,
      items: cartItems
    });

    // 3단계: 제품 재고 업데이트
    await productActions('updateInventory', {
      items: orderResult.items
    });

    // 4단계: 사용자 장바구니 비우기 및 세션 업데이트
    await userActions('clearCart');
    await userActions('updateSession', {
      lastActivity: Date.now(),
      orderCount: userSession.orderCount + 1
    });

    // 5단계: 도메인에 걸쳐 알림
    eventBus('orderCompleted', {
      orderId: orderResult.id,
      userId,
      total: orderResult.total
    });
  }, [userActions, productActions, businessActions, validationActions, eventBus]);

  return { executeCheckout };
}
```

### 도메인별 핸들러 등록
```typescript
// MVVM 설정을 사용한 멀티 도메인 핸들러 등록
function BusinessLogicSetup() {
  // 비즈니스 도메인 핸들러
  useBusinessActionHandler('processOrder', async (payload, controller) => {
    const businessStore = useBusinessStoreManager();
    const validationStore = useValidationStoreManager();
    
    // 크로스 도메인 상태 검증
    const validationResults = validationStore.getStore('validationResults').getValue();
    if (!validationResults.every(r => r.isValid)) {
      controller.abort('검증 실패');
      return;
    }

    // 재고 확인과 함께 주문 처리
    const inventory = businessStore.getStore('inventory').getValue();
    const updatedOrder = processOrderLogic(payload, inventory);
    
    businessStore.getStore('orders').update(orders => [...orders, updatedOrder]);
  });

  // 크로스 도메인 이벤트 핸들러
  useEventHandler('userLoggedIn', async (payload) => {
    const userStore = useUserStoreManager();
    const businessStore = useBusinessStoreManager();
    
    // 사용자별 비즈니스 데이터 로드
    const userOrders = await loadUserOrders(payload.userId);
    businessStore.getStore('orders').setValue(userOrders);
  });

  return null;
}
```

### 고급 상태 접근 패턴
```typescript
// 복잡한 크로스 도메인 작업을 위한 컨텍스트 브리지
function useAdvancedUserOperations() {
  const bridge = useContextBridge();

  const updateUserWithValidation = useCallback(async (userData: Partial<User>) => {
    // 1단계: 검증 도메인을 사용해 데이터 검증
    const validationResult = await bridge.validation.actions('validateField', {
      fieldName: 'userProfile',
      value: userData,
      rules: userValidationRules
    });

    if (!validationResult.isValid) {
      // UI를 오류로 업데이트
      bridge.ui.actions('showNotification', {
        message: '검증 실패',
        type: 'error'
      });
      return;
    }

    // 2단계: 사용자 데이터 업데이트
    const currentUser = bridge.user.store.getStore('profile').getValue();
    const updatedUser = { ...currentUser, ...userData };
    bridge.user.store.getStore('profile').setValue(updatedUser);

    // 3단계: 테마가 변경된 경우 디자인 설정 업데이트
    if (userData.preferences?.theme) {
      bridge.design?.actions('changeColorScheme', {
        scheme: userData.preferences.theme
      });
    }

    // 4단계: 성공 알림
    bridge.ui.actions('showNotification', {
      message: '프로필이 성공적으로 업데이트되었습니다',
      type: 'success'
    });
  }, [bridge]);

  return { updateUserWithValidation };
}
```

## 실제 예제

멀티 컨텍스트 설정은 정교한 실제 패턴을 가능하게 합니다:

- [우선순위 성능 데모](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - 크로스 도메인 우선순위 실행
- [검색 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - 검증과 함께 멀티 도메인 검색
- [스크롤 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - 성능 최적화된 UI 상태 관리

## 관련 패턴

### 설정 기반
- **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 완전한 아키텍처 기반
- **[MVVM 아키텍처](../architecture/mvvm.md)** - 레이어 분리 패턴
- **[도메인 컨텍스트](../architecture/domain-context.md)** - 비즈니스 도메인 격리

### 기본 패턴
- [액션 기본 사용법](./basic-usage.md) - 단일 컨텍스트 기본 패턴
- [타입 시스템](./type-system.md) - 멀티 컨텍스트 TypeScript 통합
- [등록 위임](./register-delegation.md) - 크로스 도메인 핸들러 구성