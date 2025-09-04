# `executeRace` 함수

## 1. 목적

`executeRace` 함수는 액션 핸들러 파이프라인의 실행 모드 중 하나입니다. 이 함수는 자격이 있는 모든 액션 핸들러를 동시에 실행하지만, 가장 먼저 완료된 핸들러의 결과만 고려합니다. 다른 핸들러들은 사실상 취소됩니다. 이 모드는 여러 동등한 핸들러로부터 가장 빠른 응답이 필요할 때 유용합니다. 예를 들어, 여러 소스에서 데이터를 가져오고 가장 먼저 응답하는 것을 사용하는 경우입니다.

## 2. 시그니처

```typescript
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: 액션 페이로드, 등록된 핸들러 및 실행 상태를 포함하는 `PipelineContext` 객체입니다.
-   `createController`: 각 핸들러에 대한 `PipelineController`를 생성하는 팩토리 함수로, 핸들러가 파이프라인과 상호 작용(예: 중단, 페이로드 수정)할 수 있도록 합니다.

## 3. 사용 패턴

일반적으로 `executeRace`를 직접 호출하지 않습니다. `executionMode`가 `'race'`로 설정되었을 때 `ActionRegister`에 의해 내부적으로 사용됩니다.

### Race 실행 모드 설정하기

특정 액션에 대해 race 실행을 사용하도록 `ActionRegister`를 구성할 수 있습니다.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

// 'fetchData' 액션의 핸들러를 race 모드로 실행하도록 설정
register.setActionExecutionMode('fetchData', 'race');

register.register('fetchData', async (payload, controller) => {
  console.log('API A에서 가져오는 중');
  // 비동기 작업 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));
  return 'API A의 데이터';
});

register.register('fetchData', async (payload, controller) => {
  console.log('API B에서 가져오는 중');
  // 비동기 작업 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200));
  return 'API B의 데이터';
});

// 디스패치는 가장 빠른 핸들러('API B의 데이터')의 결과를 반환합니다.
const result = await register.dispatchWithResult('fetchData', {});
console.log('가장 빠른 데이터:', result.result);
```

## 4. TypeDoc 링크

[execution-modes.ts의 executeRace](../../../packages/core/src/execution-modes.ts)
