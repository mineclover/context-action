# `executeParallel` 함수

## 1. 목적

`executeParallel` 함수는 액션 핸들러 파이프라인의 실행 모드 중 하나입니다. 이 함수는 자격이 있는 모든 액션 핸들러를 동시에 실행합니다. 이 모드는 핸들러들이 독립적이고 실행 순서가 중요하지 않은 시나리오에 이상적이며, 최대의 동시성을 허용하고 잠재적으로 더 빠른 전체 실행을 가능하게 합니다.

## 2. 시그니처

```typescript
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: 액션 페이로드, 등록된 핸들러 및 실행 상태를 포함하는 `PipelineContext` 객체입니다.
-   `createController`: 각 핸들러에 대한 `PipelineController`를 생성하는 팩토리 함수로, 핸들러가 파이프라인과 상호 작용(예: 중단, 페이로드 수정)할 수 있도록 합니다.

## 3. 사용 패턴

일반적으로 `executeParallel`을 직접 호출하지 않습니다. `executionMode`가 `'parallel'`로 설정되었을 때 `ActionRegister`에 의해 내부적으로 사용됩니다.

### 병렬 실행 모드 설정하기

특정 액션에 대해 병렬 실행을 사용하도록 `ActionRegister`를 구성할 수 있습니다.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

// 'logEvent' 액션의 핸들러를 병렬 모드로 실행하도록 설정
register.setActionExecutionMode('logEvent', 'parallel');

register.register('logEvent', async (payload, controller) => {
  console.log('분석 A에 로깅:', payload);
  // 비동기 작업 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 100));
});

register.register('logEvent', async (payload, controller) => {
  console.log('분석 B에 로깅:', payload);
  // 비동기 작업 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 50));
});

// 두 핸들러 모두 거의 동시에 실행을 시작합니다.
register.dispatch('logEvent', { eventName: 'UserClicked', data: {} });
```

## 4. TypeDoc 링크

[execution-modes.ts의 executeParallel](../../../packages/core/src/execution-modes.ts)
