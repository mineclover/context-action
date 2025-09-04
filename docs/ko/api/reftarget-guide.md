# `RefTarget` 타입

## 1. 목적

`RefTarget` 타입은 ref 대상으로 사용할 수 있는 모든 객체를 나타내는 제네릭 타입 별칭입니다. 가능한 한 유연하게 사용하기 위해 의도적으로 `any`로 정의되었으며, 이를 통해 DOM 요소, Three.js 객체 또는 ref로 관리하려는 다른 종류의 객체에 사용할 수 있습니다.

## 2. 구조

`RefTarget`은 `any`에 대한 타입 별칭입니다.

```typescript
export type RefTarget = any;
```

## 3. 사용 패턴

일반적으로 `RefTarget`을 직접 사용하지 않습니다. 대신 ref 컨텍스트를 생성할 때 더 구체적인 타입을 제공합니다. `RefTarget` 타입은 ref 시스템 내의 다른 제네릭 타입에 대한 기본 제약 조건 역할을 합니다.

### 더 구체적인 타입의 예

ref 컨텍스트를 생성할 때 ref의 구체적인 타입을 정의합니다.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
  myCanvas: HTMLCanvasElement;
}>('AppRefs');
```

이 예에서 `HTMLDivElement`와 `HTMLCanvasElement`가 구체적인 "ref 대상"입니다.

## 4. TypeDoc 링크

[types.ts의 RefTarget](../../../packages/react/src/refs/types.ts)
