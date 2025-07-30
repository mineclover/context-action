# React 훅

Context Action에서 제공하는 React 훅들입니다.

## useActionRegister

ActionRegister 인스턴스에 접근하는 훅입니다.

```tsx
import { useActionRegister } from '@context-action/react'

function MyComponent() {
  const register = useActionRegister()
  
  // 액션 등록 및 사용
}
```

## 기타 훅들

다양한 편의 훅들을 제공합니다.