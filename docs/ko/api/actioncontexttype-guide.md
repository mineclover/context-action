# `ActionContextType` 인터페이스

## 1. 목적

`ActionContextType` 인터페이스는 `createActionContext`에 의해 생성된 React 컨텍스트에 저장되는 값의 형태를 정의합니다. 컨텍스트에 대한 `ActionRegister` 인스턴스의 참조를 보유합니다.

## 2. 구조

`ActionContextType` 인터페이스는 단일 속성을 가집니다.

```typescript
export interface ActionContextType<T extends {}> {
  // ActionRegister 인스턴스를 가리키는 React ref 객체입니다.
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}
```

## 3. 사용 패턴

일반적으로 `ActionContextType`과 직접 상호 작용하지 않습니다. `createActionContext`에서 반환된 훅(`useActionDispatch` 및 `useActionHandler`와 같은)에 의해 내부적으로 `ActionRegister`에 접근하는 데 사용됩니다.

그러나 고급 사용 사례나 디버깅과 같이 컨텍스트 값에 직접 접근해야 하는 경우 `useActionContext` 훅을 사용할 수 있습니다.

### 컨텍스트 값에 접근하기

```typescript
import { useActionContext } from './AppActions'; // 여기서 컨텍스트를 생성했다고 가정합니다

const MyAdvancedComponent = () => {
  const contextValue = useActionContext();

  // 이제 actionRegisterRef에 접근할 수 있습니다
  // 참고: ref의 `current` 속성은 초기에 null일 수 있습니다
  if (contextValue.actionRegisterRef.current) {
    // ... ActionRegister 인스턴스로 무언가를 수행합니다
  }

  return (
    // ...
  );
};
```

## 4. TypeDoc 링크

[ActionContext.types.ts의 ActionContextType](../../../packages/react/src/actions/ActionContext.types.ts)
