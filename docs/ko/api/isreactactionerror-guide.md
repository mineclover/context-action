# `isReactActionError` 함수

## 1. 목적

`isReactActionError` 함수는 주어진 오류 객체가 `ReactActionError`의 인스턴스인지 확인하는 타입 가드입니다. 이는 React 컴포넌트 내에서 액션 파이프라인에서 발생한 오류를 안전하게 처리하는 데 특히 유용하며, `ReactActionError`의 특정 속성(예: `action`, `payload` 등)에 타입-세이프하게 접근할 수 있도록 합니다.

## 2. 시그니처

```typescript
export function isReactActionError(error: any): error is ReactActionError;
```

-   `error`: 확인할 오류 객체입니다.

## 3. 사용 패턴

일반적으로 `isReactActionError`는 `catch` 블록이나 React 오류 경계(Error Boundary) 내에서 오류의 타입을 좁히기 위해 사용합니다.

### `try-catch` 블록에서 타입 가드 사용하기

```typescript
import { isReactActionError } from '@context-action/core';

try {
  // ReactActionError를 발생시킬 수 있는 액션을 디스패치하는 코드
} catch (error) {
  if (isReactActionError(error)) {
    console.error(`액션 "${error.action}"이(가) 다음 페이로드로 실패했습니다:`, error.payload);
  } else {
    console.error('예상치 못한 오류가 발생했습니다:', error);
  }
}
```

### React 오류 경계에서 사용하기

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { isReactActionError } from '@context-action/core';

interface MyErrorBoundaryProps {
  children: ReactNode;
}

interface MyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MyErrorBoundary extends Component<MyErrorBoundaryProps, MyErrorBoundaryState> {
  state: MyErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): MyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isReactActionError(error)) {
      console.error('ReactActionError 포착:', error.action, error.payload);
    } else {
      console.error('다른 오류 포착:', error);
    }
    // 여기서 errorInfo.componentStack을 로깅할 수도 있습니다
  }

  render() {
    if (this.state.hasError) {
      return <h1>문제가 발생했습니다.</h1>;
    }
    return this.props.children;
  }
}
```

## 4. TypeDoc 링크

[react-helpers.ts의 isReactActionError](../../../packages/core/src/react-helpers.ts)
