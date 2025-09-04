# `StoreErrorBoundary` 클래스

## 1. 목적

`StoreErrorBoundary`는 `@context-action/react` 스토어 시스템 내에서 발생하는 오류에 대한 오류 경계 역할을 하는 React 컴포넌트입니다. 스토어 또는 연결된 컴포넌트에서 발생하는 오류를 포착하고 전체 컴포넌트 트리를 충돌시키는 대신 대체 UI를 표시합니다.

## 2. 구조

`StoreErrorBoundary`는 다음 props를 사용하는 클래스 기반 React 컴포넌트입니다.

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

스토어 관련 오류가 발생할 수 있는 컴포넌트 트리의 모든 부분을 `StoreErrorBoundary`로 감쌀 수 있습니다.

### 기본 사용법

스토어를 사용하는 UI의 일부를 컴포넌트로 감쌉니다.

```typescript
import { StoreErrorBoundary } from '@context-action/react';
import MyComponentThatUsesStores from './MyComponentThatUsesStores';

const App = () => (
  <div>
    <h1>내 애플리케이션</h1>
    <StoreErrorBoundary>
      <MyComponentThatUsesStores />
    </StoreErrorBoundary>
  </div>
);
```

### 사용자 정의 대체 UI 제공하기

오류가 발생했을 때 렌더링할 사용자 정의 컴포넌트나 JSX를 제공할 수 있습니다.

```typescript
const CustomFallback = ({ error, errorInfo }) => (
  <div>
    <h2>문제가 발생했습니다!</h2>
    <p>{error.message}</p>
  </div>
);

const App = () => (
  <StoreErrorBoundary fallback={CustomFallback}>
    <MyComponentThatUsesStores />
  </StoreErrorBoundary>
);
```

### 오류 경계 재설정하기

`resetOnPropsChange` 또는 `resetKeys`를 전달하여 오류 경계를 자동으로 재설정할 수 있습니다.

```typescript
const App = ({ userId }) => (
  <StoreErrorBoundary resetKeys={[userId]}>
    <UserProfile userId={userId} />
  </StoreErrorBoundary>
);
```
이 예제에서 `userId` prop이 변경되면 `StoreErrorBoundary`는 상태를 재설정하여 `UserProfile` 컴포넌트가 다시 렌더링되도록 합니다.

## 4. TypeDoc 링크

[StoreErrorBoundary.tsx의 StoreErrorBoundary](../../../packages/react/src/stores/components/StoreErrorBoundary.tsx)
