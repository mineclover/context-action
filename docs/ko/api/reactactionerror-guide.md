# `ReactActionError` 클래스

## 1. 목적

`ReactActionError` 클래스는 액션 파이프라인 내에서 발생하는 오류를 나타내는 데 사용되는 사용자 정의 오류 유형입니다. 내장 `Error` 클래스를 확장하고 실패한 액션에 대한 추가 컨텍스트(예: 액션 이름, 페이로드, 핸들러 ID)를 추가합니다.

## 2. 구조

`ReactActionError` 클래스는 다음 속성을 가집니다.

```typescript
export class ReactActionError extends Error {
  public readonly action: string;
  public readonly payload?: any;
  public readonly handlerId: string | undefined;
  public readonly timestamp: number;
  // ...
}
```

## 3. 사용 패턴

일반적으로 `ReactActionError` 인스턴스를 직접 생성하지 않습니다. 액션 핸들러에서 오류가 발생하면 라이브러리 내부에서 생성됩니다. 그런 다음 `isReactActionError` 타입 가드를 사용하여 오류 경계와 같은 오류 처리 로직에서 이 특정 오류 유형을 확인할 수 있습니다.

### 오류 경계에서 타입 가드 사용하기

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { isReactActionError, ReactActionError } from '@context-action/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MyErrorBoundary extends Component<Props, State> {
  // ...

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isReactActionError(error)) {
      console.log('액션 실패:', error.action);
      console.log('페이로드:', error.payload);
    }
    // ...
  }

  // ...
}
```

## 4. TypeDoc 링크

[react-helpers.ts의 ReactActionError](../../../packages/core/src/react-helpers.ts)
