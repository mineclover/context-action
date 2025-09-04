# `createReactDispatcher` 함수

## 1. 목적

`createReactDispatcher` 함수는 React 컴포넌트에서 사용하기에 최적화된 디스패치 함수를 생성하는 팩토리입니다. `useEffect` 의존성 배열 및 컴포넌트 이벤트 핸들러에서 안전하게 사용할 수 있는 안정적이고 메모화된 디스패처를 제공합니다. 또한 액션 디스패치 과정에서 발생하는 예외를 포착하고 관리하기 위한 내장 오류 처리 기능도 포함되어 있습니다.

## 2. 시그니처

```typescript
export function createReactDispatcher<T extends ActionPayloadMap>(
  registry: ActionRegister<T>,
  errorHandler?: (error: any, action: keyof T, payload?: T[keyof T]) => void
): <K extends keyof T>(action: K, payload?: T[K], options?: DispatchOptions) => Promise<void>;
```

-   `registry`: 디스패처가 액션을 보내는 데 사용할 `ActionRegister`의 인스턴스입니다.
-   `errorHandler` (선택 사항): 디스패치 과정에서 오류가 발생하고 핸들러에 의해 포착되지 않은 경우 호출되는 콜백 함수입니다.

## 3. 사용 패턴

이 함수는 React 컴포넌트나 커스텀 훅 내에서 신뢰할 수 있는 디스패치 함수를 생성하기 위해 설계되었습니다.

### 컴포넌트에서 디스패처 생성하기

다음은 React 컴포넌트 내에서 디스패처를 생성하고 사용하는 방법입니다.

```typescript
import { useMemo } from 'react';
import { useActionRegister, createReactDispatcher } from '@context-action/react';
import { ActionPayloadMap } from '../types'; // 사용자의 액션 페이로드 맵

function UserActions() {
  const registry = useActionRegister<ActionPayloadMap>();

  // 오류 처리를 포함한 디스패처 생성
  const dispatch = useMemo(() => createReactDispatcher(registry, (error, action) => {
    console.error(`액션 [${String(action)}] 처리 중 오류 발생:`, error);
  }), [registry]);

  const handleLogin = () => {
    dispatch('login', { username: 'testuser' });
  };

  return (
    <button onClick={handleLogin}>로그인</button>
  );
}
```

`createReactDispatcher`를 `useMemo`로 감싸면 리렌더링 시에도 `dispatch` 함수가 안정적인 참조 동일성을 유지하도록 보장하여, 이 함수에 의존하는 이펙트나 콜백이 불필요하게 다시 실행되는 것을 방지합니다.

### `useCallback`과 함께 사용하기

안정적인 `dispatch` 함수는 `useCallback`의 의존성 배열에 안전하게 포함하여 이벤트 핸들러를 메모화할 수 있습니다.

```typescript
const handleLogout = useCallback(() => {
  dispatch('logout');
}, [dispatch]); // 여기에 dispatch를 포함해도 안전합니다
```

## 4. TypeDoc 링크

[react-helpers.ts의 createReactDispatcher](../../../packages/core/src/react-helpers.ts)
