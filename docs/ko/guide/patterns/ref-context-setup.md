# RefContext 설정 패턴

적절한 TypeScript 타입으로 RefContext를 설정하는 핵심 패턴입니다.

## 기본 설정

```typescript
import { createRefContext } from '@context-action/react';

type AppRefs = {
  targetElement: HTMLDivElement;
  inputElement: HTMLInputElement;
  modalElement: HTMLDialogElement;
};

const {
  Provider: RefProvider,
  useRefHandler: useAppRef,
  useWaitForRefs
} = createRefContext<AppRefs>('App');
```

## Provider 통합

```typescript
function App() {
  return (
    <RefProvider>
      <YourComponents />
    </RefProvider>
  );
}
```

## Ref 등록

```typescript
function MyComponent() {
  const targetRef = useAppRef('targetElement');
  
  return <div ref={targetRef}>대상 요소</div>;
}
```