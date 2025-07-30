# ActionContext

React 컴포넌트에서 Context Action을 사용하기 위한 컨텍스트입니다.

## 기본 사용법

```tsx
import { ActionContext, ActionProvider } from '@context-action/react'

function App() {
  return (
    <ActionProvider>
      <MyComponent />
    </ActionProvider>
  )
}
```

## 컨텍스트 값

ActionContext는 ActionRegister 인스턴스를 제공합니다.