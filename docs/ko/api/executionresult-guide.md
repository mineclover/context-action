# `ExecutionResult` 인터페이스

## 1. 목적

`ExecutionResult` 인터페이스는 액션 디스패치의 결과를 나타냅니다. 실행 성공 여부, 핸들러가 반환한 결과, 실행 과정에 대한 상세 메타데이터 등 실행에 대한 포괄적인 정보를 포함합니다.

## 2. 구조

`ExecutionResult` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  terminated: boolean;
  result: R | undefined;
  successResults: R[];
  results: Array<R | undefined>;
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  execution: {
    duration: number;
    handlersExecuted: number;
    handlersSkipped: number;
    handlersFailed: number;
    startTime: number;
    endTime: number;
  };
  handlers: Array<{
    id: string;
    executed: boolean;
    duration: number | undefined;
    result: R | undefined;
    error: Error | undefined;
    metadata: Record<string, any> | undefined;
  }>;
  errors: HandlerError[];
}
```

## 3. 사용 패턴

`ActionRegister`의 `dispatchWithResult` 메서드를 사용하면 `ExecutionResult` 객체를 받게 됩니다.

### 디스패치 결과 확인하기

```typescript
const result = await actionRegister.dispatchWithResult('my-action', { id: 1 });

if (result.success) {
  console.log('액션 성공!');
  console.log('결과:', result.result);
} else {
  console.error('액션 실패:', result.abortReason);
}
```

### 핸들러 성능 분석하기

`execution` 및 `handlers` 속성은 성능 분석을 위한 상세 정보를 제공합니다.

```typescript
const result = await actionRegister.dispatchWithResult('my-action');

console.log(`실행에 ${result.execution.duration}ms 소요됨`);

for (const handler of result.handlers) {
  if (handler.duration && handler.duration > 10) {
    console.warn(`핸들러 ${handler.id}가 느립니다: ${handler.duration}ms`);
  }
}
```

## 4. TypeDoc 링크

[types.ts의 ExecutionResult](../../../packages/core/src/types.ts)
