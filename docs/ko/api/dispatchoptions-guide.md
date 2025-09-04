# `DispatchOptions` 인터페이스

## 1. 목적

`DispatchOptions` 인터페이스는 디스패치된 액션의 동작을 제어하기 위한 포괄적인 옵션 집합을 제공합니다. 이를 통해 디스패치별로 타이밍, 실행 모드, 취소 등을 세밀하게 제어할 수 있습니다.

## 2. 구조

`DispatchOptions` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: ExecutionMode;
  signal?: AbortSignal;
  immediate?: boolean;
  queuePriority?: number;
  timeout?: number;
  retryOnError?: {
    maxAttempts: number;
    delay: number;
  };
  autoAbort?: {
    enabled: boolean;
    onControllerCreated?: (controller: AbortController) => void;
    allowHandlerAbort?: boolean;
  };
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: {
      min?: number;
      max?: number;
    };
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
    includeErrors?: boolean;
  };
}
```

## 3. 사용 패턴

`ActionRegister`의 `dispatch` 또는 `dispatchWithResult` 메서드에 세 번째 인수로 `DispatchOptions` 객체를 전달합니다.

### 디바운싱 및 스로틀링

```typescript
// 이 액션은 마지막 호출 후 300ms가 지나야 디스패치됩니다.
actionRegister.dispatch('search', { query }, { debounce: 300 });

// 이 액션은 1000ms당 최대 한 번만 디스패치됩니다.
actionRegister.dispatch('track-scroll', { position }, { throttle: 1000 });
```

### 핸들러 필터링

특정 디스패치에 대해 실행할 핸들러를 필터링할 수 있습니다.

```typescript
actionRegister.dispatch('update-user', userData, {
  filter: {
    // 'validation' 태그가 있는 핸들러만 실행
    custom: (config) => config.tags?.includes('validation'),
  },
});
```

### 액션 중단하기

`AbortController`를 사용하여 디스패치를 취소할 수 있습니다.

```typescript
const controller = new AbortController();

actionRegister.dispatch('long-running-task', {}, { signal: controller.signal });

// 나중에 작업을 취소하려면
controller.abort();
```

## 4. TypeDoc 링크

[types.ts의 DispatchOptions](../../../packages/core/src/types.ts)
