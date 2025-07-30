# 시작하기

Context Action은 React 애플리케이션에서 타입 안전한 액션 관리를 제공하는 경량 라이브러리입니다. 이 가이드는 프로젝트에 Context Action을 설치하고 사용하는 방법을 안내합니다.

## 설치

Context Action을 사용하려면 core 패키지와 React 통합 패키지를 설치해야 합니다:

::: code-group

```bash [npm]
npm install @context-action/core @context-action/react
```

```bash [pnpm]
pnpm add @context-action/core @context-action/react
```

```bash [yarn]
yarn add @context-action/core @context-action/react
```

:::

## 기본 사용법

### 1단계: 액션 타입 정의

먼저 애플리케이션에서 사용할 액션 타입을 정의합니다:

```typescript
interface CounterActions {
  increment: void;        // 페이로드가 없는 액션
  decrement: void;
  setCount: number;       // 숫자 페이로드를 받는 액션
  reset: void;
}
```

### 2단계: 액션 컨텍스트 생성

`createActionContext`를 사용하여 액션 컨텍스트를 생성합니다:

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();
```

### 3단계: Provider 설정

앱의 루트나 필요한 컴포넌트를 Provider로 감쌉니다:

```typescript
function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}
```

### 4단계: 액션 핸들러 등록

컴포넌트에서 `useActionHandler`를 사용하여 액션 핸들러를 등록합니다:

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // 액션 핸들러 등록
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  });

  useActionHandler('decrement', () => {
    setCount(prev => prev - 1);
  });

  useActionHandler('setCount', (value: number) => {
    setCount(value);
  });

  useActionHandler('reset', () => {
    setCount(0);
  });

  return (
    <div>
      <h1>카운터: {count}</h1>
      <button onClick={() => action.dispatch('increment')}>증가</button>
      <button onClick={() => action.dispatch('decrement')}>감소</button>
      <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
      <button onClick={() => action.dispatch('reset')}>리셋</button>
    </div>
  );
}
```

## 완전한 예제

다음은 위의 모든 단계를 포함한 완전한 예제입니다:

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';

// 액션 타입 정의
interface CounterActions {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}

// 액션 컨텍스트 생성
const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();

function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // 액션 핸들러 등록
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('decrement', () => setCount(prev => prev - 1));
  useActionHandler('setCount', (value: number) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <h1>카운터: {count}</h1>
      <div>
        <button onClick={() => action.dispatch('increment')}>증가</button>
        <button onClick={() => action.dispatch('decrement')}>감소</button>
        <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
        <button onClick={() => action.dispatch('reset')}>리셋</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}

export default App;
```

## 다음 단계

이제 Context Action의 기본 사용법을 익혔습니다. 다음 주제들을 살펴보세요:

- [Core 패키지](/ko/api/core/) - 핵심 ActionRegister 클래스와 타입들
- [React 패키지](/ko/api/react/) - React 통합 훅과 컨텍스트
- [Jotai 통합](/ko/api/jotai/) - Jotai와 함께 사용하기
- [고급 사용법](/ko/guide/advanced) - 비동기 액션, 에러 처리, 우선순위 설정

::: tip 팁
Context Action은 TypeScript로 작성되어 뛰어난 타입 안전성을 제공합니다. IDE에서 자동완성과 타입 검사를 활용하여 더 안전한 코드를 작성하세요.
:::