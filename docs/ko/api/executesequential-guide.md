# `executeSequential` 함수

## 1. 목적

`executeSequential` 함수는 액션 핸들러 파이프라인의 실행 모드 중 하나입니다. 이 함수는 액션 핸들러가 정의된 우선순위에 따라 순차적으로 하나씩 실행되도록 보장합니다. 이 모드는 실행 순서가 중요하거나, 한 핸들러의 출력이 후속 핸들러의 입력으로 필요한 시나리오에 적합합니다.

## 2. 시그니처

```typescript
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: 액션 페이로드, 등록된 핸들러 및 실행 상태를 포함하는 `PipelineContext` 객체입니다.
-   `createController`: 각 핸들러에 대한 `PipelineController`를 생성하는 팩토리 함수로, 핸들러가 파이프라인과 상호 작용(예: 중단, 페이로드 수정)할 수 있도록 합니다.

## 3. 사용 패턴

일반적으로 `executeSequential`을 직접 호출하지 않습니다. `executionMode`가 `'sequential'`(기본값)로 설정되었을 때 `ActionRegister`에 의해 내부적으로 사용됩니다.

### 기본 순차 실행

기본적으로 `ActionRegister`에 등록된 핸들러는 순차적으로 실행됩니다.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

register.register('processOrder', async (payload, controller) => {
  console.log('1단계: 주문 유효성 검사');
  // ... 유효성 검사 로직
});

register.register('processOrder', async (payload, controller) => {
  console.log('2단계: 결제 처리');
}, { priority: 10 }); // 이 핸들러는 우선순위 때문에 첫 번째 핸들러보다 먼저 실행됩니다.

// 액션을 디스패치하면 핸들러가 순차적으로 실행됩니다.
register.dispatch('processOrder', { orderId: '123' });
```

## 4. TypeDoc 링크

[execution-modes.ts의 executeSequential](../../../packages/core/src/execution-modes.ts)
