# React Hooks

Context Action에서 제공하는 추가적인 React Hook들을 소개합니다.

## useActionState

액션의 실행 상태를 관리하는 Hook입니다.

```typescript
import { useActionState } from '@context-action/react'

function UserProfile({ userId }: { userId: string }) {
  const [state, execute] = useActionState('fetchUser')
  
  const handleFetch = () => {
    execute(userId)
  }
  
  return (
    <div>
      <button onClick={handleFetch} disabled={state.loading}>
        {state.loading ? '로딩 중...' : '사용자 로드'}
      </button>
      
      {state.error && (
        <div>에러: {state.error.message}</div>
      )}
      
      {state.data && (
        <div>사용자: {state.data.name}</div>
      )}
    </div>
  )
}
```

### 반환값

```typescript
interface ActionState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

type UseActionStateReturn<T, P> = [
  ActionState<T>,
  (payload: P) => Promise<void>
]
```

## useActionCallback

액션을 useCallback으로 감싼 Hook입니다.

```typescript
import { useActionCallback } from '@context-action/react'

function UserForm() {
  const saveUser = useActionCallback('saveUser', [])
  
  const handleSubmit = async (formData: FormData) => {
    try {
      await saveUser(formData)
      // 성공 처리
    } catch (error) {
      // 에러 처리
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}
    </form>
  )
}
```

## useActionEffect

액션을 useEffect 내에서 실행하는 Hook입니다.

```typescript
import { useActionEffect } from '@context-action/react'

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)
  
  useActionEffect('fetchUser', {
    payload: userId,
    deps: [userId],
    onSuccess: (userData) => {
      setUser(userData)
    },
    onError: (error) => {
      console.error('사용자 로드 실패:', error)
    }
  })
  
  return <div>{user?.name}</div>
}
```

### 옵션

```typescript
interface UseActionEffectOptions<T, P> {
  payload: P
  deps: React.DependencyList
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}
```

## useActionMutation

데이터 변경 작업을 위한 Hook입니다.

```typescript
import { useActionMutation } from '@context-action/react'

function UserEditForm({ user }: { user: User }) {
  const updateUser = useActionMutation('updateUser', {
    onSuccess: () => {
      alert('사용자 정보가 업데이트되었습니다!')
    },
    onError: (error) => {
      alert(`업데이트 실패: ${error.message}`)
    }
  })
  
  const handleSubmit = (formData: Partial<User>) => {
    updateUser.mutate({ id: user.id, ...formData })
  }
  
  return (
    <div>
      <button 
        onClick={() => handleSubmit({ name: '새 이름' })}
        disabled={updateUser.loading}
      >
        {updateUser.loading ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
```

## useActionRegistry

ActionRegister 인스턴스에 직접 접근하는 Hook입니다.

```typescript
import { useActionRegistry } from '@context-action/react'

function ActionManager() {
  const registry = useActionRegistry()
  
  const addNewAction = () => {
    registry.register('newAction', {
      handler: () => console.log('새 액션 실행!')
    })
  }
  
  const removeAction = () => {
    registry.unregister('someAction')
  }
  
  return (
    <div>
      <button onClick={addNewAction}>액션 추가</button>
      <button onClick={removeAction}>액션 제거</button>
    </div>
  )
}
```

## 사용 예제

### 폼 처리

```typescript
function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [submitState, submitForm] = useActionState('submitContact')
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitForm(formData)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="이름"
      />
      <input 
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="이메일"
      />
      <button type="submit" disabled={submitState.loading}>
        {submitState.loading ? '전송 중...' : '전송'}
      </button>
      
      {submitState.error && (
        <div>오류: {submitState.error.message}</div>
      )}
      
      {submitState.data && (
        <div>전송 완료!</div>
      )}
    </form>
  )
}
```