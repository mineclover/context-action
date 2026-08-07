# 디스패치 패턴

실행 모드, 필터링, 성능 최적화를 포함한 Context-Action 프레임워크의 핵심 액션 디스패칭 패턴입니다.

## Import
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## 필수 조건

타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

이 문서는 설정 가이드의 `AppActions` 패턴을 사용합니다:
- 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
- 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
- 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)

예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다:
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  processOrder: { orderId: string; items: any[]; total: number };
  broadcastEvent: { event: string; data: any };
  fastestResponse: { query: string };
  sensitiveOperation: { token: string; data: any };
  dynamicAction: { type: string; payload: any };
  slowOperation: { complexData: any };
  criticalAction: { priority: number; data: any };
  riskyAction: { operation: string };
  bestEffortAction: { data: any };
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppDispatch,
  useActionHandler: useAppHandler,
  useActionRegister: useAppRegister
} = createActionContext<AppActions>('App');
```

## 기본 디스패치

결과 수집 없이 간단한 액션 디스패칭.

```typescript
function UserComponent() {
  const dispatch = useAppDispatch();
  
  const handleUserUpdate = async () => {
    // 기본 액션 디스패치
    await dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' });
  };
  
  const handleOrderProcess = async (orderData) => {
    // 실행 옵션이 있는 디스패치
    await dispatch('processOrder', orderData, {
      executionMode: 'parallel',
      timeout: 5000
    });
  };
  
  return (
    <div>
      <button onClick={handleUserUpdate}>사용자 업데이트</button>
      <button onClick={() => handleOrderProcess(orderData)}>주문 처리</button>
    </div>
  );
}
```

## 실행 모드

같은 액션에 대한 여러 핸들러가 실행되는 방식을 제어합니다.

### 순차 실행 (기본값)

```typescript
function OrderComponent() {
  const dispatch = useAppDispatch();
  
  const handleProcessOrder = async (orderData) => {
    // 핸들러들이 우선순위 순서대로 하나씩 실행
    await dispatch('processOrder', orderData, {
      executionMode: 'sequential'
    });
  };
  
  return <button onClick={() => handleProcessOrder(orderData)}>주문 처리</button>;
}
```

핸들러들이 순서대로 실행되어 초기 핸들러가 후속 핸들러를 위해 페이로드를 수정할 수 있습니다.

### 병렬 실행

```typescript
function EventComponent() {
  const dispatch = useAppDispatch();
  
  const handleBroadcast = async (eventData) => {
    // 모든 핸들러가 동시에 실행
    await dispatch('broadcastEvent', eventData, {
      executionMode: 'parallel'
    });
  };
  
  return <button onClick={() => handleBroadcast(eventData)}>이벤트 브로드캐스트</button>;
}
```

분석, 로깅, 알림 같은 독립적인 작업에 최적입니다.

결과 수집을 활성화하면 모든 parallel handler가 끝난 뒤 등록 우선순위 순서로
결과를 조립합니다. 부수 효과의 완료 시점은 달라질 수 있지만 `first`, `last`,
`all` 결과 전략의 의미는 실행마다 달라지지 않습니다.

### 경쟁 실행

```typescript
function SearchComponent() {
  const dispatch = useAppDispatch();
  
  const handleFastSearch = async (queryData) => {
    // 첫 번째 완료된 핸들러가 승리
    await dispatch('fastestResponse', queryData, {
      executionMode: 'race'
    });
  };
  
  return <button onClick={() => handleFastSearch(queryData)}>빠른 검색</button>;
}
```

폴백 메커니즘과 성능 중요 작업에 유용합니다.

## 핸들러 필터링

어떤 핸들러를 실행할지 세밀하게 제어합니다.

### 태그 기반 필터링

```typescript
function UserManagementComponent() {
  const dispatch = useAppDispatch();
  
  const handleUserUpdate = async (payload) => {
    await dispatch('updateUser', payload, {
      filter: {
        handlerIds: ['validator', 'business-logic'],
        excludeHandlerIds: ['analytics', 'logging']
      }
    });
  };
  
  return <button onClick={() => handleUserUpdate(userData)}>사용자 업데이트</button>;
}
```

### 핸들러 ID 필터링

```typescript
function SecurityComponent() {
  const dispatch = useAppDispatch();
  
  const handleSensitiveOperation = async (data) => {
    // 보안 관련 핸들러만 실행
    await dispatch('sensitiveOperation', data, {
      filter: {
        handlerIds: ['security-check'],
        excludeHandlerIds: ['analytics']
      }
    });
  };
  
  return <button onClick={() => handleSensitiveOperation(secureData)}>보안 작업</button>;
}
```

### 커스텀 핸들러 필터링

```typescript
function DynamicActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleDynamicAction = async (payload) => {
    await dispatch('dynamicAction', payload, {
      filter: {
        custom: (config) => {
          // 복잡한 필터링 로직
          return config.priority > 50 && 
                 !config.id?.includes('optional');
        }
      }
    });
  };
  
  return <button onClick={() => handleDynamicAction(dynamicData)}>동적 액션</button>;
}
```

## 성능 최적화

### 타임아웃 제어

```typescript
function SlowOperationComponent() {
  const dispatch = useAppDispatch();
  
  const handleSlowOperation = async (data) => {
    // 액션 실행에 타임아웃 설정
    await dispatch('slowOperation', data, {
      timeout: 10000  // 10초 타임아웃
    });
  };
  
  return <button onClick={() => handleSlowOperation(complexData)}>느린 작업 시작</button>;
}
```

### 우선순위 기반 실행

```typescript
function CriticalActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleCriticalAction = async (payload) => {
    // 고우선순위 핸들러만 실행
    await dispatch('criticalAction', payload, {
      filter: {
        custom: (config) => config.priority >= 80
      }
    });
  };
  
  return <button onClick={() => handleCriticalAction(criticalData)}>중요한 액션</button>;
}
```

## 에러 처리

### 기본 에러 처리

```typescript
function RiskyActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleRiskyAction = async (payload) => {
    try {
      await dispatch('riskyAction', payload);
    } catch (error) {
      console.error('액션 실패:', error);
    }
  };
  
  return <button onClick={() => handleRiskyAction(riskyData)}>위험한 액션</button>;
}
```

### 조용한 실패

```typescript
function BestEffortComponent() {
  const register = useAppRegister();
  
  const handleBestEffortAction = async (payload) => {
    // 핸들러별 실패 정보가 필요하면 dispatchWithResult를 사용합니다.
    const result = await register.dispatchWithResult('bestEffortAction', payload, {
      result: { collect: true }
    });
    if (!result.success) console.error('일부 핸들러 실패:', result.errors);
  };
  
  return <button onClick={() => handleBestEffortAction(effortData)}>최선 액션</button>;
}
```

## 실제 예제

- [검색 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - 필터링을 사용한 디바운스 검색
- [스크롤 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - 성능 최적화된 스크롤 처리
- [우선순위 데모](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - 우선순위 기반 실행 패턴

## 관련 패턴

- **[액션 기본 사용법](./basic-usage.md)** - 기본 액션 패턴
- **[결과와 함께 디스패치](./dispatch-with-result.md)** - 결과 수집 패턴
- **[등록 패턴](./register-patterns.md)** - 핸들러 등록 패턴
- **[타입 시스템](./type-system.md)** - TypeScript 통합
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 설정 패턴 및 타입 정의
