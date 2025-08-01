# 핵심 개념

Context-Action 프레임워크의 기초를 형성하는 기본적인 프레임워크 개념과 시스템입니다.

> **구현 현황**: 15개 용어 구현 완료 ✅  
> **매핑된 파일**: 11개 파일에서 실제 구현 패턴 발견

## 액션 파이프라인 시스템

**정의**: 디스패치된 액션을 우선순위 순서에 따라 등록된 핸들러 시리즈를 통해 처리하는 중앙 오케스트레이션 시스템입니다.

**코드 참조**: `packages/core/src/ActionRegister.ts`의 `ActionRegister<T>` 클래스

**사용 맥락**: 
- 핵심 프레임워크 기능
- 비즈니스 로직 실행
- 이벤트 기반 아키텍처 구현

**주요 특징**:
- 우선순위 기반 핸들러 실행 (높은 우선순위가 먼저 실행)
- 페이로드 검증을 포함한 타입 안전 액션 디스패치
- 파이프라인 플로우 제어 (중단, 계속, 수정)
- 동기 및 비동기 핸들러 지원

**예제**:
```typescript
// 액션 정의
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  calculateTotal: { items: CartItem[] };
}

// 파이프라인에 핸들러 등록
actionRegister.register('updateUser', async (payload, controller) => {
  // 비즈니스 로직 실행
  const user = userStore.getValue();
  userStore.setValue({ ...user, ...payload });
}, { priority: 10, blocking: true });
```

**관련 용어**: [액션 핸들러](#액션-핸들러), [파이프라인 컨트롤러](#파이프라인-컨트롤러), [스토어 통합 패턴](#스토어-통합-패턴)

---

## 스토어 통합 패턴

**정의**: 액션 핸들러가 컴포넌트 간의 느슨한 결합을 유지하면서 스토어를 읽고 업데이트할 수 있게 하는 아키텍처 패턴입니다.

**코드 참조**: 액션 핸들러의 스토어 getter/setter 패턴

**사용 맥락**:
- 액션 핸들러에서의 상태 관리
- 크로스 스토어 조정
- 데이터 플로우 구현

**주요 특징**:
- 실행 시점에서 스토어 값의 지연 평가
- 직접적인 컴포넌트-스토어 결합 없음
- 여러 스토어에 걸친 원자적 업데이트
- 핸들러에서 최신 상태 값 보장

**예제**:
```typescript
actionRegister.register('checkout', async (payload, controller) => {
  // 여러 스토어에서 읽기
  const cart = cartStore.getValue();
  const user = userStore.getValue();
  const inventory = inventoryStore.getValue();
  
  // 크로스 스토어 조정을 포함한 비즈니스 로직
  if (cart.items.some(item => inventory[item.id] < item.quantity)) {
    controller.abort('재고 부족');
    return;
  }
  
  // 여러 스토어 업데이트
  orderStore.setValue({ ...payload, status: 'processing' });
  cartStore.setValue({ items: [] });
  inventoryStore.update(inv => updateInventory(inv, cart.items));
});
```

**관련 용어**: [액션 핸들러](#액션-핸들러), [크로스 스토어 조정](./api-terms.md#크로스-스토어-조정), [지연 평가](./architecture-terms.md#지연-평가)

---

## 액션 핸들러

**정의**: 파이프라인 내에서 특정 액션을 처리하는 함수로, 비즈니스 로직과 스토어 상호작용을 포함합니다.

**코드 참조**: `packages/core/src/types.ts`의 `ActionHandler<T>` 타입

**사용 맥락**:
- 비즈니스 로직 구현
- 상태 변환
- 사이드 이펙트 관리
- 검증 및 에러 처리

**주요 특징**:
- 타입이 지정된 페이로드와 파이프라인 컨트롤러를 받음
- 동기 또는 비동기 가능
- 우선순위, 블로킹, 조건 옵션으로 구성 가능
- 스토어 레지스트리를 통해 모든 등록된 스토어에 접근 가능

**함수 시그니처**:
```typescript
type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;
```

**예제**:
```typescript
// 검증을 포함한 사용자 업데이트 핸들러
actionRegister.register('updateUser', async (payload, controller) => {
  // 입력 검증
  if (!payload.id || !payload.name) {
    controller.abort('유효하지 않은 사용자 데이터');
    return;
  }
  
  // 비즈니스 로직
  const currentUser = userStore.getValue();
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now()
  };
  
  // 스토어 업데이트
  userStore.setValue(updatedUser);
  
  // 사이드 이펙트
  activityStore.update(activities => [...activities, {
    type: 'user_updated',
    userId: payload.id,
    timestamp: Date.now()
  }]);
}, { priority: 10, blocking: true });
```

**관련 용어**: [파이프라인 컨트롤러](#파이프라인-컨트롤러), [액션 파이프라인 시스템](#액션-파이프라인-시스템), [핸들러 구성](./api-terms.md#핸들러-구성)

---

## 파이프라인 컨트롤러

**정의**: 파이프라인 실행 플로우 관리와 페이로드 수정을 위해 액션 핸들러에 제공되는 인터페이스입니다.

**코드 참조**: `packages/core/src/types.ts`의 `PipelineController<T>` 인터페이스

**사용 맥락**:
- 액션 핸들러 내에서의 플로우 제어
- 에러 시 파이프라인 중단
- 후속 핸들러를 위한 페이로드 수정
- 핸들러 조정

**주요 메서드**:
- `next()`: 다음 핸들러로 계속 (자동으로 호출됨)
- `abort(reason?)`: 선택적 이유와 함께 파이프라인 실행 중단
- `modifyPayload(modifier)`: 후속 핸들러를 위한 페이로드 변환
- `getPayload()`: 현재 페이로드 검색

**예제**:
```typescript
actionRegister.register('processOrder', async (payload, controller) => {
  // 검증 단계
  if (!validateOrder(payload)) {
    controller.abort('유효하지 않은 주문 데이터');
    return;
  }
  
  // 다음 핸들러를 위한 페이로드 수정
  controller.modifyPayload(order => ({
    ...order,
    processedAt: Date.now(),
    status: 'processing'
  }));
  
  // 실행 계속 (자동)
});
```

**관련 용어**: [액션 핸들러](#액션-핸들러), [액션 파이프라인 시스템](#액션-파이프라인-시스템), [파이프라인 컨텍스트](./api-terms.md#파이프라인-컨텍스트)

---

## 스토어 레지스트리

**정의**: 스토어 인스턴스를 관리하고 애플리케이션 컨텍스트 내에서 스토어에 대한 접근을 제공하는 중앙집중식 레지스트리입니다.

**코드 참조**: `StoreRegistry` 클래스 및 `useStoreRegistry` 훅

**사용 맥락**:
- 스토어 생명주기 관리
- 액션 핸들러를 위한 의존성 주입
- 스토어 발견 및 접근
- 프로바이더 패턴 구현

**주요 특징**:
- 중앙집중식 스토어 관리
- 키별 타입 안전 스토어 접근
- React 컨텍스트 시스템과의 통합
- 지연 스토어 초기화 지원

**예제**:
```typescript
// 스토어 등록
function App() {
  return (
    <StoreProvider>
      <ActionProvider>
        <Application />
      </ActionProvider>
    </StoreProvider>
  );
}

// 액션 핸들러에서 스토어 접근
function useUserActions() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    const userStore = registry.getStore('user');
    const settingsStore = registry.getStore('settings');
    
    const unregister = actionRegister.register('updateUser', 
      async (payload, controller) => {
        const user = userStore.getValue();
        const settings = settingsStore.getValue();
        
        // 스토어 접근을 포함한 비즈니스 로직
        userStore.setValue({ ...user, ...payload });
      }
    );
    
    return unregister;
  }, [registry]);
}
```

**관련 용어**: [스토어 프로바이더](./api-terms.md#storeprovider), [액션 프로바이더](./api-terms.md#actionprovider), [스토어 통합 패턴](#스토어-통합-패턴)

---

## 액션 페이로드 맵

**정의**: 액션 이름과 해당 페이로드 타입 간의 매핑을 정의하는 TypeScript 인터페이스입니다.

**코드 참조**: `packages/core/src/types.ts`의 `ActionPayloadMap` 인터페이스

**사용 맥락**:
- 액션 디스패치를 위한 타입 안전성
- 액션 핸들러 등록
- 컴파일 타임 검증
- API 계약 정의

**주요 특징**:
- 기본 ActionPayloadMap 인터페이스 확장
- 액션 이름을 페이로드 타입에 매핑
- 매개변수 없는 액션에 대한 void 페이로드 지원
- 컴파일 타임 타입 검사 활성화

**예제**:
```typescript
// 애플리케이션 액션 정의
interface AppActions extends ActionPayloadMap {
  increment: void;                    // 페이로드 없음
  setCount: number;                   // 숫자 페이로드
  updateUser: { id: string; name: string };  // 객체 페이로드
  deleteUser: { id: string };        // 객체 페이로드
}

// 타입 안전 액션 등록
const actionRegister = new ActionRegister<AppActions>();

// 타입 안전 디스패치
await actionRegister.dispatch('increment');     // ✓ 유효
await actionRegister.dispatch('setCount', 42);   // ✓ 유효
await actionRegister.dispatch('setCount');       // ✗ 타입 에러
```

**관련 용어**: [액션 핸들러](#액션-핸들러), [액션 디스패처](./api-terms.md#액션-디스패처), [타입 안전성](./architecture-terms.md#타입-안전성)

---

## 핸들러 구성

**정의**: 파이프라인 내에서 액션 핸들러의 동작을 제어하는 구성 옵션입니다.

**코드 참조**: `packages/core/src/types.ts`의 `HandlerConfig` 인터페이스

**사용 맥락**:
- 핸들러 동작 사용자 정의
- 실행 순서 제어
- 조건부 실행
- 성능 최적화

**구성 옵션**:
- `priority`: 실행 순서 (높은 번호가 먼저 실행)
- `id`: 핸들러의 고유 식별자
- `blocking`: 비동기 완료를 기다릴지 여부
- `once`: 첫 번째 실행 후 핸들러 제거
- `condition`: 핸들러 실행 여부를 결정하는 함수

**예제**:
```typescript
// 높은 우선순위 블로킹 핸들러
actionRegister.register('criticalUpdate', handler, {
  priority: 100,
  blocking: true,
  id: 'critical-update-validator'
});

// 일회성 초기화 핸들러
actionRegister.register('initialize', handler, {
  once: true,
  priority: 1000
});

// 조건부 핸들러
actionRegister.register('premiumFeature', handler, {
  condition: () => user.isPremium,
  priority: 50
});
```

**관련 용어**: [액션 핸들러](#액션-핸들러), [파이프라인 컨트롤러](#파이프라인-컨트롤러), [우선순위 기반 실행](./api-terms.md#우선순위-기반-실행)