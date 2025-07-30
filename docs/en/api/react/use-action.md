# useAction

Context에서 액션을 가져와 사용하는 React Hook입니다.

## 기본 사용법

```typescript
import { useAction } from '@context-action/react'

function UserProfile({ userId }: { userId: string }) {
  const fetchUser = useAction('fetchUser')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetchUser = async () => {
    setLoading(true)
    try {
      const userData = await fetchUser.execute(userId)
      setUser(userData)
    } catch (error) {
      console.error('사용자 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleFetchUser} disabled={loading}>
        {loading ? '로딩 중...' : '사용자 정보 로드'}
      </button>
      {user && <div>{user.name}</div>}
    </div>
  )
}
```

## 타입 안전성

TypeScript와 함께 사용할 때 타입 안전성을 보장합니다.

```typescript
// 액션 등록 시 타입 정의
actionRegister.register('fetchUser', {
  handler: async (userId: string): Promise<User> => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }
})

// 컴포넌트에서 사용
function UserComponent() {
  const fetchUser = useAction('fetchUser')
  
  // TypeScript가 매개변수와 반환 타입을 추론
  const handleClick = async () => {
    const user = await fetchUser.execute('123') // user는 User 타입
  }
}
```

## 에러 처리

```typescript
function UserComponent() {
  const fetchUser = useAction('fetchUser')
  
  const handleFetchUser = async (userId: string) => {
    try {
      const user = await fetchUser.execute(userId)
      // 성공 처리
    } catch (error) {
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message)
      }
    }
  }
}
```

## 액션 존재 확인

```typescript
function UserComponent() {
  const fetchUser = useAction('fetchUser')
  
  if (!fetchUser) {
    return <div>액션을 찾을 수 없습니다</div>
  }
  
  // 액션 사용
}
```

## 동적 액션 이름

```typescript
function DynamicActionComponent({ actionName }: { actionName: string }) {
  const action = useAction(actionName)
  
  const handleExecute = async (payload: any) => {
    if (action) {
      await action.execute(payload)
    }
  }
  
  return (
    <button onClick={() => handleExecute({})}>
      {actionName} 실행
    </button>
  )
}
```

## 관련 문서

- [ActionContext](/api/react/action-context) - React Context 설정
- [Hooks](/api/react/hooks) - 기타 유용한 Hook들