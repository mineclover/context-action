# `ExecutionMode` 타입

## 1. 목적

`ExecutionMode` 타입 별칭은 동일한 액션에 등록된 여러 액션 핸들러를 실행하는 전략을 정의합니다. 핸들러가 순차적으로 실행될지, 병렬로 실행될지, 또는 서로 경쟁하여 실행될지 제어할 수 있습니다.

## 2. 구조

`ExecutionMode`는 다음 값 중 하나가 될 수 있는 문자열 리터럴 타입입니다.

```typescript
export type ExecutionMode = 'sequential' | 'parallel' | 'race';
```

-   `'sequential'`: 핸들러는 `priority` 순서대로 하나씩 실행됩니다. 이것이 기본 모드입니다.
-   `'parallel'`: 모든 핸들러가 동시에 실행됩니다.
-   `'race'`: 모든 핸들러가 동시에 실행되지만, 첫 번째 핸들러가 완료되는 즉시 파이프라인이 종료됩니다.

## 3. 사용 패턴

`ActionRegister` 인스턴스의 `setActionExecutionMode` 메서드를 사용하여 특정 액션에 대한 실행 모드를 설정하거나, 단일 디스패치 호출에 대해 재정의할 수 있습니다.

### 액션에 대한 기본 모드 설정하기

이는 액션에 대한 표준 동작을 정의하는 데 유용합니다.

```typescript
// 순서가 중요한 액션의 경우
actionRegister.setActionExecutionMode('processOrder', 'sequential');

// 독립적인 로깅 또는 추적 액션의 경우
actionRegister.setActionExecutionMode('trackEvent', 'parallel');

// 가장 빠른 데이터만 필요한 여러 소스에서 데이터를 가져오는 경우
actionRegister.setActionExecutionMode('fetchFastest', 'race');
```

### 특정 디스패치에 대한 모드 재정의하기

`DispatchOptions`를 사용하여 특정 `dispatch` 호출에 대한 기본 실행 모드를 재정의할 수 있습니다.

```typescript
// 기본값이 순차적이라도 이 특정 디스패치에 대해 병렬 실행을 강제합니다.
await actionRegister.dispatch('trackEvent', eventData, {
  executionMode: 'parallel',
});
```

## 4. TypeDoc 링크

[types.ts의 ExecutionMode](../../../packages/core/src/types.ts)
