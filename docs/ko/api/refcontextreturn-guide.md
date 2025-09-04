# `RefContextReturn` 인터페이스

## 1. 목적

`RefContextReturn` 인터페이스는 `createRefContext` 함수가 반환하는 객체를 정의합니다. 이 객체는 React `Provider` 컴포넌트와 컨텍스트 내에서 ref를 관리하고 상호 작용하기 위한 사용자 정의 훅 컬렉션을 제공합니다.

## 2. 구조

`RefContextReturn` 인터페이스는 다음 속성을 제공합니다.

```typescript
export interface RefContextReturn<T> {
  // 컴포넌트 트리를 감싸는 React Provider 컴포넌트입니다.
  Provider: React.FC<{ children: ReactNode }>;

  // 특정 ref에 대한 핸들러를 가져오는 훅입니다.
  useRefHandler: <K extends keyof T>(refName: K) => { ... };

  // 여러 ref가 마운트될 때까지 기다리는 훅입니다.
  useWaitForRefs: () => <K extends keyof T>(...refNames: K[]) => Promise<Pick<T, K>>;

  // 현재 마운트된 모든 ref를 가져오는 훅입니다.
  useGetAllRefs: () => () => Partial<T>;

  // ref가 마운트될 때까지 폴링하는 훅입니다.
  useRefPolling: () => <K extends keyof T>(...) => { ... };

  // ref의 마운트 상태를 가져오는 훅입니다.
  useRefMountState: <K extends keyof T>(refName: K) => { ... };

  // ref의 마운트 상태 변경을 구독하는 훅입니다.
  useOnMountStateChange: <K extends keyof T>(...) => void;

  // ref의 마운트 상태를 확인하는 함수를 가져오는 훅입니다.
  useRefMountChecker: <K extends keyof T>(refName: K) => () => { ... };

  // 컨텍스트의 이름입니다.
  contextName: string;

  // 제공된 경우 컨텍스트의 ref 정의입니다.
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}
```
*(참고: 훅의 반환 타입은 복잡하여 간결성을 위해 여기서는 단순화되었습니다. 전체 세부 정보는 소스 코드를 참조하십시오.)*

## 3. 사용 패턴

`RefContextReturn` 객체는 `Provider`와 ref와 상호 작용하기 위한 다양한 훅에 접근하기 위해 구조 분해됩니다.

### Ref 컨텍스트 생성 및 사용

먼저 컨텍스트를 생성합니다. 그런 다음 컴포넌트 트리를 `Provider`로 감쌉니다.

```typescript
// 컨텍스트 파일(예: AppRefs.ts)
import { createRefContext } from '@context-action/react';

export const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
}>('AppRefs');

// 메인 애플리케이션 파일(예: App.tsx)
import { Provider as AppRefProvider } from './AppRefs';

const App = () => (
  <AppRefProvider>
    {/* ... 컴포넌트 ... */}
  </AppRefProvider>
);
```

### 컴포넌트에 Ref 연결하기

`useRefHandler` 훅을 사용하여 컴포넌트나 DOM 요소에 연결할 수 있는 `setRef` 함수를 가져옵니다.

```typescript
// 컴포넌트 내부
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { setRef, isMounted } = useRefHandler('myDiv');

  return (
    <div ref={setRef}>
      My Div는 {isMounted ? '마운트됨' : '마운트되지 않음'}.
    </div>
  );
};
```

## 4. TypeDoc 링크

[createRefContext.ts의 RefContextReturn](../../../packages/react/src/refs/createRefContext.ts)
