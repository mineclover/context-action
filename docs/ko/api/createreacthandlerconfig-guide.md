# `createReactHandlerConfig` 함수

## 1. 목적

`createReactHandlerConfig` 함수는 React 환경에 최적화된 핸들러 설정을 생성하기 위한 팩토리입니다. 이 함수는 고유한 핸들러 ID를 생성하고 적절한 클린업을 보장하는 과정을 단순화하여, 컴포넌트 기반 아키텍처에서 메모리 누수를 방지하는 데 중요한 역할을 합니다.

## 2. 시그니처

```typescript
export function createReactHandlerConfig<T>(
  action: keyof T,
  componentId?: string,
  config: HandlerConfig<T> = {}
): Required<HandlerConfig<T>>;
```

-   `action`: 핸들러가 응답할 액션의 이름입니다.
-   `componentId` (선택 사항): 디버깅 목적으로 사용되는 컴포넌트의 문자열 식별자입니다.
-   `config` (선택 사항): React 관련 최적화가 추가될 기본 `HandlerConfig` 객체입니다.

## 3. 사용 패턴

이 함수는 React 컴포넌트 내에서, 특히 `useEffect` 훅 안에서 사용할 때 가장 유용합니다. 이를 통해 컴포넌트가 마운트될 때 핸들러를 등록하고 언마운트될 때 등록을 해제할 수 있습니다.

### React에 최적화된 핸들러 생성하기

다음은 React 컴포넌트 내에서 `createReactHandlerConfig`를 사용하여 핸들러를 등록하는 예제입니다.

```typescript
import { useEffect } from 'react';
import { useActionRegister, createReactHandlerConfig } from '@context-action/react';
import { ActionPayloadMap } from '../types'; // 사용자의 액션 페이로드 맵

function UserProfile({ userId }: { userId: string }) {
  const registry = useActionRegister<ActionPayloadMap>();

  const handleUserUpdate = (payload) => {
    console.log('사용자 업데이트:', payload);
  };

  useEffect(() => {
    // React에 최적화된 핸들러 설정 생성
    const config = createReactHandlerConfig('updateUser', 'UserProfile', {
      priority: 5,
    });

    // 생성된 설정으로 핸들러 등록
    const unregister = registry.register('updateUser', handleUserUpdate, config);

    // 클린업을 위해 unregister 함수 반환
    return unregister;
  }, [registry, handleUserUpdate]);

  return (
    <div>
      {/* 컴포넌트 UI */}
    </div>
  );
}
```

이 패턴에서 `createReactHandlerConfig`는 핸들러 인스턴스에 대한 고유 ID를 생성하고 필요한 클린업 로직을 설정합니다. `registry.register`에서 반환된 `unregister` 함수는 `useEffect`의 클린업 단계에서 핸들러를 올바르게 제거하는 데 사용됩니다.

## 4. TypeDoc 링크

[react-helpers.ts의 createReactHandlerConfig](../../../packages/core/src/react-helpers.ts)
