# useAction

액션을 쉽게 사용할 수 있게 해주는 핵심 훅입니다.

## 기본 사용법

```tsx
import { useAction } from '@context-action/react'

function MyComponent() {
  const [execute, { loading, error }] = useAction('user/login')
  
  const handleLogin = () => {
    execute({ username: 'john' })
  }
  
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? '로그인 중...' : '로그인'}
    </button>
  )
}
```

## 반환값

- `execute`: 액션 실행 함수
- `loading`: 로딩 상태
- `error`: 에러 상태