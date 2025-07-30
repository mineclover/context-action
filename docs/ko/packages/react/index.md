# @context-action/react

React 애플리케이션에서 Context Action을 사용하기 위한 패키지입니다.

## 개요

React 훅과 컨텍스트를 통해 Context Action을 쉽게 사용할 수 있습니다.

## 주요 기능

- ActionProvider 컴포넌트
- useAction 훅
- useActionRegister 훅

## 설치

```bash
npm install @context-action/react
```

## 기본 사용법

```tsx
import { ActionProvider, useAction } from '@context-action/react'

function App() {
  return (
    <ActionProvider>
      <MyComponent />
    </ActionProvider>
  )
}

function MyComponent() {
  const [execute] = useAction('my-action')
  
  return <button onClick={() => execute()}>실행</button>
}
```

## API 참조

- [ActionContext](../../api/react/action-context.md)
- [useAction](../../api/react/use-action.md)
- [훅들](../../api/react/hooks.md)