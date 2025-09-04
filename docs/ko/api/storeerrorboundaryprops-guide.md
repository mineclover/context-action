# `StoreErrorBoundaryProps` 인터페이스

## 1. 목적

`StoreErrorBoundaryProps` 인터페이스는 `StoreErrorBoundary` 컴포넌트가 받는 props를 정의합니다. 이 props를 사용하여 대체 UI 제공 및 오류 처리를 포함하여 오류 경계의 동작을 구성할 수 있습니다.

## 2. 구조

`StoreErrorBoundaryProps` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface StoreErrorBoundaryProps {
  // 이 오류 경계가 감쌀 컴포넌트입니다.
  children: ReactNode;

  // 오류가 포착되었을 때 렌더링할 대체 UI입니다.
  // ReactNode 또는 ReactNode를 반환하는 함수일 수 있습니다.
  fallback?: ReactNode | ((error: ContextActionError, errorInfo: ErrorInfo) => ReactNode);

  // 오류가 포착되었을 때 호출되는 콜백 함수입니다.
  onError?: (error: ContextActionError, errorInfo: ErrorInfo) => void;

  // true이면 props가 변경될 때 오류 경계가 재설정됩니다.
  resetOnPropsChange?: boolean;

  // 변경을 감시할 키 배열입니다. 이 키 중 하나라도 변경되면
  // 오류 경계가 재설정됩니다.
  resetKeys?: Array<string | number>;
}
```

## 3. 사용 패턴

props는 `StoreErrorBoundary` 컴포넌트로 전달됩니다.

### 대체 컴포넌트 제공하기

대체 UI로 렌더링할 사용자 정의 컴포넌트를 제공할 수 있습니다.

```typescript
import { StoreErrorBoundary, StoreErrorBoundaryProps } from '@context-action/react';

const MyFallbackComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div>
    <h1>오류가 발생했습니다!</h1>
    <p>{error.message}</p>
  </div>
);

const App = () => (
  <StoreErrorBoundary fallback={<MyFallbackComponent />}>
    {/* ... */}
  </StoreErrorBoundary>
);
```

### 오류 처리하기

`onError` prop을 사용하여 보고 서비스에 오류를 기록할 수 있습니다.

```typescript
import { StoreErrorBoundary, StoreErrorBoundaryProps } from '@context-action/react';

const handleError = (error, errorInfo) => {
  // logErrorToMyService(error, errorInfo);
};

const App = () => (
  <StoreErrorBoundary onError={handleError}>
    {/* ... */}
  </StoreErrorBoundary>
);
```

## 4. TypeDoc 링크

[StoreErrorBoundary.tsx의 StoreErrorBoundaryProps](../../../packages/react/src/stores/components/StoreErrorBoundary.tsx)
