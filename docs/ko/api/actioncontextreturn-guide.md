# `ActionContextReturn` 인터페이스

## 1. 목적

`ActionContextReturn` 인터페이스는 `createActionContext` 함수가 반환하는 객체를 정의합니다. 이 객체는 React `Provider` 컴포넌트와 액션 컨텍스트와 상호 작용하기 위한 사용자 정의 훅 세트를 포함합니다.

## 2. 구조

`ActionContextReturn` 인터페이스는 다음 속성을 제공합니다.

```typescript
export interface ActionContextReturn<T extends {}> {
  // 컴포넌트 트리를 감싸는 React Provider 컴포넌트입니다.
  Provider: React.FC<{ children: ReactNode }>;

  // 원시 액션 컨텍스트를 가져오는 훅입니다.
  useActionContext: () => ActionContextType<T>;

  // 액션을 디스패치하기 위한 `dispatch` 함수를 가져오는 훅입니다.
  useActionDispatch: () => ActionRegister<T>['dispatch'];

  // 컴포넌트 내에서 액션 핸들러를 등록하는 훅입니다.
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;

  // 기본 ActionRegister 인스턴스를 가져오는 훅입니다.
  useActionRegister: () => ActionRegister<T> | null;

  // 결과 및 중단을 포함한 향상된 디스패치 기능을 제공하는 훅입니다.
  useActionDispatchWithResult: () => {
    dispatch: <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<void>;
    dispatchWithResult: <K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<ExecutionResult<R>>;
    abortAll: () => void;
    resetAbortScope: () => void;
  };

  // 실제 React Context 객체입니다.
  context: React.Context<ActionContextType<T> | null>;
}
```

## 3. 사용 패턴

`ActionContextReturn` 객체는 `Provider`와 훅에 접근하기 위해 구조 분해됩니다.

### 액션 컨텍스트 생성 및 사용

먼저 컨텍스트를 생성한 다음 애플리케이션이나 컴포넌트를 `Provider`로 감쌉니다.

```typescript
// 컨텍스트 파일(예: AppActions.ts)
import { createActionContext } from '@context-action/react';

export const { Provider, useActionDispatch, useActionHandler } = createActionContext();

// 메인 애플리케이션 파일(예: App.tsx)
import { Provider as AppActionProvider } from './AppActions';

const App = () => (
  <AppActionProvider>
    {/* ... 컴포넌트 ... */}
  </AppActionProvider>
);
```

### 액션 디스패치 및 핸들러 등록

`Provider` 내의 컴포넌트는 훅을 사용하여 액션을 디스패치하거나 핸들러를 등록할 수 있습니다.

```typescript
// 컴포넌트 내부
import { useActionDispatch, useActionHandler } from './AppActions';

const MyComponent = () => {
  const dispatch = useActionDispatch();

  useActionHandler('myAction', (payload) => {
    console.log('myAction이 다음 페이로드로 디스패치되었습니다:', payload);
  });

  return (
    <button onClick={() => dispatch('myAction', { id: 1 })}>
      액션 디스패치
    </button>
  );
};
```

## 4. TypeDoc 링크

[ActionContext.types.ts의 ActionContextReturn](../../../packages/react/src/actions/ActionContext.types.ts)
