# `createRefContext` 함수

## 1. 목적

`createRefContext` 함수는 ref 컨텍스트를 생성하기 위한 팩토리입니다. 이 함수는 `Provider` 컴포넌트와 ref를 관리하고 상호 작용하기 위한 훅 세트를 포함하는 `RefContextReturn` 객체를 반환합니다.

## 2. 시그니처

`createRefContext` 함수에는 두 가지 오버로드가 있습니다.

### 간단한 오버로드

```typescript
export function createRefContext<T extends Record<string, any>>(
  contextName: string,
  options?: CreateRefContextOptions
): RefContextReturn<T>;
```

### Ref 정의를 사용한 오버로드

```typescript
export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T,
  options?: CreateRefContextOptions
): RefContextReturn<InferRefTypes<T>>;
```

## 3. 사용 패턴

`createRefContext`를 사용하여 애플리케이션 전체에서 사용할 수 있는 ref 컨텍스트를 생성합니다.

### 간단한 Ref 컨텍스트 생성하기

```typescript
import { createRefContext } from '@context-action/react';

export const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
}>('AppRefs');
```

### 정의를 사용하여 Ref 컨텍스트 생성하기

ref를 미리 구성하기 위해 `createRefContext`에 ref 정의 세트를 제공할 수 있습니다.

```typescript
import { createRefContext } from '@context-action/react';

const refDefinitions = {
  myDiv: { name: 'myDiv' },
  myCanvas: { name: 'myCanvas', mountTimeout: 5000 },
};

export const { Provider, useRefHandler } = createRefContext(
  'AppRefs',
  refDefinitions
);
```

## 4. TypeDoc 링크

[createRefContext.ts의 createRefContext](../../../packages/react/src/refs/createRefContext.ts)
