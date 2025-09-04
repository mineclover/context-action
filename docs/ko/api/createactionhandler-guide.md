# `createActionHandler` 함수

## 1. 목적

`createActionHandler` 함수는 React 컴포넌트 내에서, 특히 `useEffect` 훅을 다룰 때 액션 핸들러의 등록 및 등록 해제를 단순화하기 위해 설계된 유틸리티입니다. 이 함수는 액션 핸들러의 생명주기를 관리하는 편리한 방법을 제공하여, 컴포넌트가 마운트될 때 핸들러가 올바르게 등록되고 언마운트될 때 등록 해제되도록 보장합니다.

## 2. 시그니처

```typescript
export function createActionHandler<T extends ActionPayloadMap, K extends keyof T>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: Required<HandlerConfig>;
};
```

-   `registry`: 핸들러가 등록될 `ActionRegister` 인스턴스입니다.
-   `action`: 핸들러를 등록할 액션의 이름입니다.
-   `handler`: 액션 핸들러 함수입니다. 불필요한 재등록을 방지하기 위해 `useCallback`을 사용하여 이 함수를 메모화하는 것이 좋습니다.
-   `config` (선택 사항): 핸들러에 대한 설정 옵션으로, `priority`, `id`, `blocking` 등이 있습니다.

이 함수는 다음 메서드를 포함하는 객체를 반환합니다.
-   `register()`: 핸들러를 등록하고 `UnregisterFunction`을 반환합니다.
-   `unregister()`: 핸들러를 등록 해제합니다.
-   `registerWithCleanup()`: 핸들러를 등록하고 `useEffect`에 적합한 클린업 함수를 반환합니다.

## 3. 사용 패턴

`createActionHandler`는 일반적으로 React의 `useEffect` 훅 내에서 액션 핸들러 구독을 관리하는 데 사용됩니다.

### `useEffect`와 함께 기본 사용법

```typescript
import { useCallback, useEffect } from 'react';
import { createActionHandler } from '@context-action/core/react-helpers';
import { useActionRegister } from '@context-action/react'; // 이 훅이 있다고 가정합니다

function MyComponent() {
  const registry = useActionRegister(); // ActionRegister 인스턴스 가져오기

  const handleUserUpdate = useCallback(async (payload, controller) => {
    console.log('사용자 업데이트:', payload);
  }, []);

  useEffect(() => {
    if (!registry) return;

    const { register, unregister } = createActionHandler(
      registry,
      'updateUser',
      handleUserUpdate,
      { priority: 10 }
    );

    const cleanup = register(); // 핸들러 등록
    return () => {
      cleanup(); // 컴포넌트가 언마운트될 때 등록 해제
      unregister(); // 수동으로 cleanup이 호출될 경우 등록 해제 보장
    };
  }, [registry, handleUserUpdate]);

  return <div>My Component</div>;
}
```

### `registerWithCleanup`을 사용한 간소화된 클린업

`useEffect` 내에서 더 간결한 구문을 사용하려면 `registerWithCleanup`을 사용할 수 있습니다.

```typescript
import { useCallback, useEffect } from 'react';
import { createActionHandler } from '@context-action/core/react-helpers';
import { useActionRegister } from '@context-action/react';

function MyComponent() {
  const registry = useActionRegister();

  const handleItemAdded = useCallback(async (payload) => {
    console.log('항목 추가됨:', payload);
  }, []);

  useEffect(() => {
    if (!registry) return;
    // useEffect를 위한 클린업 함수를 직접 반환합니다
    return createActionHandler(registry, 'itemAdded', handleItemAdded).registerWithCleanup();
  }, [registry, handleItemAdded]);

  return <div>My Component</div>;
}
```

## 4. TypeDoc 링크

[react-helpers.ts의 createActionHandler](../../../packages/core/src/react-helpers.ts)
