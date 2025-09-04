# `RefOperationOptions` 인터페이스

## 1. 목적

`RefOperationOptions` 인터페이스는 `withTarget` 함수를 사용하여 ref 대상에 대해 수행되는 작업의 동작을 제어하는 옵션 집합을 제공합니다. 이러한 옵션을 사용하면 타임아웃, 재시도, 취소 등을 세밀하게 제어할 수 있습니다.

## 2. 구조

`RefOperationOptions` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface RefOperationOptions {
  // 작업의 타임아웃(밀리초)입니다.
  timeout?: number;

  // 작업이 실패할 경우 재시도할 횟수입니다.
  retries?: number;

  // 작업을 취소하기 위한 AbortSignal입니다.
  signal?: AbortSignal;

  // 작업의 우선순위입니다.
  priority?: number;

  // 작업의 고유 식별자입니다.
  operationId?: string;

  // 작업에 대한 추가 메타데이터입니다.
  metadata?: Record<string, any>;
}
```

## 3. 사용 패턴

`withTarget` 함수에 `RefOperationOptions` 객체를 전달합니다.

### 타임아웃 설정하기

작업이 너무 오래 실행되는 것을 방지하는 데 유용합니다.

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');

  const handleClick = async () => {
    const operationResult = await withTarget(
      (div) => {
        // 오래 실행되는 작업
      },
      { timeout: 1000 } // 1초
    );

    if (!operationResult.success) {
      console.error('작업 시간 초과:', operationResult.error);
    }
  };

  return <button onClick={handleClick}>타임아웃으로 작업 실행</button>;
};
```

### 작업 취소하기

진행 중인 작업을 취소하기 위해 `AbortController`를 사용할 수 있습니다.

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');
  const abortController = new AbortController();

  const handleStart = () => {
    withTarget(
      (div) => {
        // 오래 실행되는 작업
      },
      { signal: abortController.signal }
    );
  };

  const handleCancel = () => {
    abortController.abort();
  };

  return (
    <div>
      <button onClick={handleStart}>작업 시작</button>
      <button onClick={handleCancel}>작업 취소</button>
    </div>
  );
};
```

## 4. TypeDoc 링크

[types.ts의 RefOperationOptions](../../../packages/react/src/refs/types.ts)
