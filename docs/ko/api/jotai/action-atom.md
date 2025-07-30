# actionAtom

Jotai와 Context Action을 통합하는 액션 아톰입니다.

## 기본 사용법

```typescript
import { actionAtom } from '@context-action/jotai'

const loginAtom = actionAtom({
  type: 'user/login',
  handler: async ({ username, password }) => {
    // 로그인 로직
  }
})
```

## 사용 예제

```tsx
import { useAtom } from 'jotai'

function LoginComponent() {
  const [, execute] = useAtom(loginAtom)
  
  const handleLogin = () => {
    execute({ username: 'john', password: 'secret' })
  }
  
  return <button onClick={handleLogin}>로그인</button>
}
```