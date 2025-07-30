# Jotai 유틸리티

Context Action과 Jotai를 함께 사용할 때 유용한 유틸리티 함수들을 소개합니다.

## withJotai()

기존 ActionRegister를 Jotai와 통합하는 고차 함수입니다.

```typescript
import { withJotai } from '@context-action/jotai'
import { ActionRegister } from '@context-action/core'

const actionRegister = new ActionRegister()
const jotaiActionRegister = withJotai(actionRegister)

// 이제 액션 실행 시 자동으로 상태 아톰들이 업데이트됩니다
jotaiActionRegister.register('fetchUser', {
  handler: async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }
})
```

## createAtomicAction()

아톰과 밀접하게 연동되는 액션을 생성하는 함수입니다.

```typescript
import { createAtomicAction } from '@context-action/jotai'
import { atom } from 'jotai'

const usersAtom = atom<User[]>([])

const fetchUsersAction = createAtomicAction({
  name: 'fetchUsers',
  targetAtom: usersAtom,
  handler: async () => {
    const response = await fetch('/api/users')
    return response.json()
  }
})

// 컴포넌트에서 사용
function UserList() {
  const [users] = useAtom(usersAtom)
  const fetchUsers = useSetAtom(fetchUsersAction)
  
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## atomFamily()

동적으로 액션 아톰을 생성하는 팩토리 함수입니다.

```typescript
import { atomFamily } from '@context-action/jotai'

// 사용자별 데이터 가져오기 아톰들을 동적 생성
const fetchUserAtomFamily = atomFamily((userId: string) =>
  actionAtom({
    name: `fetchUser-${userId}`,
    handler: async () => {
      const response = await fetch(`/api/users/${userId}`)
      return response.json()
    }
  })
)

function UserProfile({ userId }: { userId: string }) {
  const fetchUserAtom = fetchUserAtomFamily(userId)
  const fetchUser = useSetAtom(fetchUserAtom)
  
  useEffect(() => {
    fetchUser()
  }, [fetchUser])
  
  // ...
}
```

## selectAtom()

액션 결과에서 특정 부분만 선택하는 아톰을 생성합니다.

```typescript
import { selectAtom } from '@context-action/jotai'

const fetchUserResultAtom = resultAtom<User>('fetchUser')

// 사용자 이름만 선택
const userNameAtom = selectAtom(fetchUserResultAtom, (user) => user?.name)

// 사용자가 관리자인지 확인
const isAdminAtom = selectAtom(fetchUserResultAtom, (user) => 
  user?.role === 'admin'
)

function UserInfo() {
  const [userName] = useAtom(userNameAtom)
  const [isAdmin] = useAtom(isAdminAtom)
  
  return (
    <div>
      <h2>{userName}</h2>
      {isAdmin && <span>관리자</span>}
    </div>
  )
}
```

## combineActions()

여러 액션을 하나로 조합하는 함수입니다.

```typescript
import { combineActions } from '@context-action/jotai'

const initializeUserDashboard = combineActions([
  'fetchUser',
  'fetchUserPosts', 
  'fetchUserNotifications'
])

function UserDashboard() {
  const initialize = useSetAtom(initializeUserDashboard)
  
  useEffect(() => {
    initialize({ userId: '123' })
  }, [initialize])
  
  // ...
}
```

## retryAtom()

실패한 액션을 재시도하는 아톰을 생성합니다.

```typescript
import { retryAtom } from '@context-action/jotai'

const retryFetchUserAtom = retryAtom('fetchUser')

function UserProfile() {
  const [error] = useAtom(errorAtom('fetchUser'))
  const retry = useSetAtom(retryFetchUserAtom)
  
  return (
    <div>
      {error && (
        <div>
          <p>에러 발생: {error.message}</p>
          <button onClick={() => retry()}>다시 시도</button>
        </div>
      )}
    </div>
  )
}
```

## persistAtom()

액션 결과를 로컬 스토리지에 지속 저장하는 아톰을 생성합니다.

```typescript
import { persistAtom } from '@context-action/jotai'

const persistentUserAtom = persistAtom(
  resultAtom<User>('fetchUser'),
  'user-data'
)

function UserProfile() {
  const [user] = useAtom(persistentUserAtom)
  
  // 페이지 새로고침 후에도 사용자 데이터가 유지됩니다
  return (
    <div>
      {user && <h2>안녕하세요, {user.name}님!</h2>}
    </div>
  )
}
```

## debounceAtom()

액션 실행을 디바운스하는 아톰을 생성합니다.

```typescript
import { debounceAtom } from '@context-action/jotai'

const searchQueryAtom = atom('')
const debouncedSearchAtom = debounceAtom(
  actionAtom({
    name: 'search',
    handler: async (query: string) => {
      const response = await fetch(`/api/search?q=${query}`)
      return response.json()
    }
  }),
  300 // 300ms 디바운스
)

function SearchBox() {
  const [query, setQuery] = useAtom(searchQueryAtom)
  const search = useSetAtom(debouncedSearchAtom)
  
  useEffect(() => {
    if (query) {
      search(query)
    }
  }, [query, search])
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="검색어를 입력하세요"
    />
  )
}
```

## 고급 패턴

### 액션 체이닝

```typescript
import { chainAtoms } from '@context-action/jotai'

const loginAndFetchDataAtom = chainAtoms([
  actionAtom({
    name: 'login',
    handler: async (credentials) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })
      return response.json()
    }
  }),
  actionAtom({
    name: 'fetchUserData',
    handler: async (loginResult) => {
      const response = await fetch('/api/user', {
        headers: {
          Authorization: `Bearer ${loginResult.token}`
        }
      })
      return response.json()
    }
  })
])
```

### 조건부 실행

```typescript
import { conditionalAtom } from '@context-action/jotai'

const isOnlineAtom = atom(true)

const onlineOnlyActionAtom = conditionalAtom(
  actionAtom({
    name: 'syncData',
    handler: async () => {
      await syncWithServer()
    }
  }),
  isOnlineAtom
)

function SyncButton() {
  const sync = useSetAtom(onlineOnlyActionAtom)
  const [isOnline] = useAtom(isOnlineAtom)
  
  return (
    <button 
      onClick={() => sync()}
      disabled={!isOnline}
    >
      {isOnline ? '동기화' : '오프라인'}
    </button>
  )
}
```