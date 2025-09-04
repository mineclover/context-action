# `CreateRefContextOptions` 인터페이스

## 1. 목적

`CreateRefContextOptions` 인터페이스는 `createRefContext` 함수에 대한 구성 옵션을 제공합니다. 이를 통해 컨텍스트 내의 모든 ref에 대한 기본 마운트 타임아웃을 설정하고 타임아웃을 완전히 비활성화할 수 있습니다.

## 2. 구조

`CreateRefContextOptions` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface CreateRefContextOptions {
  // 컨텍스트의 모든 ref에 대한 기본 마운트 타임아웃(밀리초)입니다.
  // undefined이면 타임아웃이 없습니다.
  defaultMountTimeout?: number;

  // true이면 개별 ref에 대한 모든 타임아웃이 비활성화됩니다.
  disableTimeout?: boolean;
}
```

## 3. 사용 패턴

`createRefContext` 함수에 `CreateRefContextOptions` 객체를 전달합니다.

### 기본 타임아웃 설정하기

컨텍스트의 모든 ref가 일관된 타임아웃 동작을 갖도록 하는 데 유용합니다.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext(
  'AppRefs',
  {
    defaultMountTimeout: 5000, // 5초
  }
);
```

### 타임아웃 비활성화하기

경우에 따라, 예를 들어 테스트에서 또는 마운트하는 데 오랜 시간이 걸릴 것으로 예상되는 ref에 대해 타임아웃을 완전히 비활성화할 수 있습니다.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext(
  'TestRefs',
  {
    disableTimeout: true,
  }
);
```

## 4. TypeDoc 링크

[createRefContext.ts의 CreateRefContextOptions](../../../packages/react/src/refs/createRefContext.ts)
