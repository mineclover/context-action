# actionAtom

Jotai와 Context Action을 통합하는 핵심 아톰 생성 함수입니다.

## 기본 사용법

```typescript
import { actionAtom } from '@context-action/jotai'
import { atom } from 'jotai'

// 사용자 데이터 아톰
const userAtom = atom<User | null>(null)

// 사용자 가져오기 액션 아톰
const fetchUserAtom = actionAtom({
  name: 'fetchUser',
  handler: async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
  onSuccess: (user, { set }) => {
    set(userAtom, user)
  }
})
```

## 타입 정의

```typescript
interface ActionAtomConfig<T, R> {
  name: string
  handler: (payload: T, helpers: ActionHelpers) => R | Promise<R>
  onSuccess?: (result: R, helpers: ActionHelpers) => void
  onError?: (error: Error, helpers: ActionHelpers) => void
  onFinally?: (helpers: ActionHelpers) => void
}

interface ActionHelpers {
  get: <V>(atom: Atom<V>) => V
  set: <V>(atom: WritableAtom<V, any[], any>, value: V) => void
}
```

## 사용 예제

### CRUD 작업

```typescript
import { actionAtom } from '@context-action/jotai'
import { atom } from 'jotai'

// 상태 아톰들
const usersAtom = atom<User[]>([])
const loadingAtom = atom(false)
const errorAtom = atom<string | null>(null)

// 사용자 목록 가져오기
const fetchUsersAtom = actionAtom({
  name: 'fetchUsers',
  handler: async (_, { set }) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('사용자 목록을 가져올 수 없습니다')
    }
    return response.json()
  },
  onSuccess: (users, { set }) => {
    set(usersAtom, users)
    set(loadingAtom, false)
  },
  onError: (error, { set }) => {
    set(errorAtom, error.message)
    set(loadingAtom, false)
  }
})

// 사용자 생성
const createUserAtom = actionAtom({
  name: 'createUser',
  handler: async (userData: Omit<User, 'id'>) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  },
  onSuccess: (newUser, { get, set }) => {
    const currentUsers = get(usersAtom)
    set(usersAtom, [...currentUsers, newUser])
  }
})

// 사용자 업데이트
const updateUserAtom = actionAtom({
  name: 'updateUser',
  handler: async ({ id, ...updates }: Partial<User> & { id: string }) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return response.json()
  },
  onSuccess: (updatedUser, { get, set }) => {
    const currentUsers = get(usersAtom)
    set(usersAtom, currentUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
  }
})
```

### 컴포넌트에서 사용

```typescript
import { useAtom, useSetAtom } from 'jotai'

function UserList() {
  const [users] = useAtom(usersAtom)
  const [loading] = useAtom(loadingAtom)
  const [error] = useAtom(errorAtom)
  const fetchUsers = useSetAtom(fetchUsersAtom)
  const createUser = useSetAtom(createUserAtom)
  
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  const handleCreateUser = () => {
    createUser({
      name: '새 사용자',
      email: 'new@example.com'
    })
  }
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>
  
  return (
    <div>
      <button onClick={handleCreateUser}>사용자 추가</button>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

## 고급 기능

### 조건부 실행

```typescript
const conditionalActionAtom = actionAtom({
  name: 'conditionalAction',
  handler: async (data, { get }) => {
    const isEnabled = get(enabledAtom)
    if (!isEnabled) {
      throw new Error('액션이 비활성화되었습니다')
    }
    
    return processData(data)
  }
})
```

### 캐싱

```typescript
const cacheAtom = atom<Map<string, any>>(new Map())

const cachedFetchAtom = actionAtom({
  name: 'cachedFetch',
  handler: async (key: string, { get, set }) => {
    const cache = get(cacheAtom)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const data = await fetchData(key)
    
    const newCache = new Map(cache)
    newCache.set(key, data)
    set(cacheAtom, newCache)
    
    return data
  }
})
```

## 관련 문서

- [Atoms](/api/jotai/atoms) - 유용한 미리 정의된 아톰들
- [Utilities](/api/jotai/utilities) - Jotai 통합 유틸리티들