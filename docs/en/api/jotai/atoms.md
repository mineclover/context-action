# 미리 정의된 아톰들

Context Action Jotai 통합에서 제공하는 유용한 아톰들을 소개합니다.

## loadingAtom

액션의 로딩 상태를 관리하는 아톰입니다.

```typescript
import { loadingAtom } from '@context-action/jotai'

// 특정 액션의 로딩 상태
const fetchUserLoadingAtom = loadingAtom('fetchUser')

function UserProfile() {
  const [isLoading] = useAtom(fetchUserLoadingAtom)
  
  return (
    <div>
      {isLoading && <div>사용자 정보를 불러오는 중...</div>}
    </div>
  )
}
```

## errorAtom

액션의 에러 상태를 관리하는 아톰입니다.

```typescript
import { errorAtom } from '@context-action/jotai'

const fetchUserErrorAtom = errorAtom('fetchUser')

function UserProfile() {
  const [error] = useAtom(fetchUserErrorAtom)
  
  return (
    <div>
      {error && (
        <div className="error">
          에러 발생: {error.message}
        </div>
      )}
    </div>
  )
}
```

## statusAtom

액션의 전체 상태를 관리하는 아톰입니다.

```typescript
import { statusAtom, ActionStatus } from '@context-action/jotai'

const fetchUserStatusAtom = statusAtom('fetchUser')

function UserProfile() {
  const [status] = useAtom(fetchUserStatusAtom)
  
  const getStatusText = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.IDLE: return '대기 중'
      case ActionStatus.PENDING: return '실행 중'
      case ActionStatus.SUCCESS: return '성공'
      case ActionStatus.ERROR: return '실패'
      default: return '알 수 없음'
    }
  }
  
  return (
    <div>
      상태: {getStatusText(status)}
    </div>
  )
}
```

## resultAtom

액션의 실행 결과를 저장하는 아톰입니다.

```typescript
import { resultAtom } from '@context-action/jotai'

const fetchUserResultAtom = resultAtom<User>('fetchUser')

function UserProfile() {
  const [result] = useAtom(fetchUserResultAtom)
  
  return (
    <div>
      {result && (
        <div>
          <h2>{result.name}</h2>
          <p>{result.email}</p>
        </div>
      )}
    </div>
  )
}
```

## actionStateAtom

액션의 전체 상태를 하나의 객체로 관리하는 아톰입니다.

```typescript
import { actionStateAtom } from '@context-action/jotai'

const fetchUserStateAtom = actionStateAtom<User>('fetchUser')

function UserProfile() {
  const [state] = useAtom(fetchUserStateAtom)
  
  return (
    <div>
      {state.loading && <div>로딩 중...</div>}
      {state.error && <div>에러: {state.error.message}</div>}
      {state.data && (
        <div>
          <h2>{state.data.name}</h2>
          <p>{state.data.email}</p>
        </div>
      )}
    </div>
  )
}
```

## 복합 아톰들

### globalLoadingAtom

모든 액션의 로딩 상태를 통합 관리하는 아톰입니다.

```typescript
import { globalLoadingAtom } from '@context-action/jotai'

function GlobalLoadingIndicator() {
  const [isAnyLoading] = useAtom(globalLoadingAtom)
  
  if (!isAnyLoading) return null
  
  return (
    <div className="global-loading">
      <div className="spinner" />
      처리 중...
    </div>
  )
}
```

### errorCountAtom

현재 발생한 에러의 개수를 세는 아톰입니다.

```typescript
import { errorCountAtom } from '@context-action/jotai'

function ErrorBadge() {
  const [errorCount] = useAtom(errorCountAtom)
  
  if (errorCount === 0) return null
  
  return (
    <div className="error-badge">
      {errorCount}개의 에러
    </div>
  )
}
```

## 사용자 정의 아톰 생성

### createLoadingAtom

특정 액션들의 로딩 상태를 조합하는 아톰을 생성합니다.

```typescript
import { createLoadingAtom } from '@context-action/jotai'

// 여러 액션의 로딩 상태를 OR 조건으로 결합
const userDataLoadingAtom = createLoadingAtom([
  'fetchUser',
  'fetchUserPosts',
  'fetchUserFriends'
])

function UserDashboard() {
  const [isLoadingUserData] = useAtom(userDataLoadingAtom)
  
  return (
    <div>
      {isLoadingUserData && (
        <div>사용자 데이터를 불러오는 중...</div>
      )}
    </div>
  )
}
```

### createResultAtom

여러 액션의 결과를 조합하는 아톰을 생성합니다.

```typescript
import { createResultAtom } from '@context-action/jotai'

const userDashboardDataAtom = createResultAtom({
  user: 'fetchUser',
  posts: 'fetchUserPosts',
  friends: 'fetchUserFriends'
})

function UserDashboard() {
  const [dashboardData] = useAtom(userDashboardDataAtom)
  
  return (
    <div>
      {dashboardData.user && <UserInfo user={dashboardData.user} />}
      {dashboardData.posts && <PostList posts={dashboardData.posts} />}
      {dashboardData.friends && <FriendList friends={dashboardData.friends} />}
    </div>
  )
}
```

## 아톰 조합 패턴

### 조건부 데이터 표시

```typescript
const userAtom = resultAtom<User>('fetchUser')
const userLoadingAtom = loadingAtom('fetchUser')
const userErrorAtom = errorAtom('fetchUser')

const userDisplayAtom = atom((get) => {
  const user = get(userAtom)
  const loading = get(userLoadingAtom)
  const error = get(userErrorAtom)
  
  if (loading) return { type: 'loading' }
  if (error) return { type: 'error', error }
  if (user) return { type: 'success', user }
  return { type: 'idle' }
})

function UserDisplay() {
  const [display] = useAtom(userDisplayAtom)
  
  switch (display.type) {
    case 'loading':
      return <div>로딩 중...</div>
    case 'error':
      return <div>에러: {display.error.message}</div>
    case 'success':
      return <div>안녕하세요, {display.user.name}님!</div>
    default:
      return <div>사용자 정보를 불러오세요</div>
  }
}
```