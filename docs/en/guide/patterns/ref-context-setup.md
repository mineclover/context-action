# RefContext Setup Pattern

Core pattern for setting up RefContext with proper TypeScript types.

## Basic Setup

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

## Provider Integration

```typescript
function App() {
  return (
    <RefProvider>
      <YourComponents />
    </RefProvider>
  );
}
```

## Ref Registration

```typescript
function MyComponent() {
  const targetRef = useAppRef('targetElement');
  
  return <div ref={targetRef}>Target Element</div>;
}
```