# ActionContext

React 앱에서 Context Action을 사용하기 위한 React Context입니다.

## 기본 사용법

```typescript
import { ActionContext } from '@context-action/react'
import { ActionRegister } from '@context-action/core'

// 액션 등록기 생성
const actionRegister = new ActionRegister()

function App() {
  return (
    <ActionContext.Provider value={actionRegister}>
      <MyComponent />
    </ActionContext.Provider>
  )
}
```

## ActionProvider

편의를 위한 Provider 컴포넌트입니다.

```typescript
import { ActionProvider } from '@context-action/react'

function App() {
  return (
    <ActionProvider>
      <MyComponent />
    </ActionProvider>
  )
}
```

### Props

```typescript
interface ActionProviderProps {
  children: ReactNode
  register?: ActionRegister
}
```

- `children`: 자식 컴포넌트
- `register`: 사용할 ActionRegister 인스턴스 (선택사항, 기본값: 새 인스턴스)

## 고급 사용법

### 초기 액션 등록

```typescript
import { ActionProvider } from '@context-action/react'
import { ActionRegister } from '@context-action/core'

// 액션들을 미리 등록
const actionRegister = new ActionRegister()

actionRegister.register('fetchUsers', {
  handler: async () => {
    const response = await fetch('/api/users')
    return response.json()
  }
})

actionRegister.register('createUser', {
  handler: async (userData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    return response.json()
  }
})

function App() {
  return (
    <ActionProvider register={actionRegister}>
      <UserManagement />
    </ActionProvider>
  )
}
```

### 중첩된 Provider

```typescript
// 전역 액션들
const globalActionRegister = new ActionRegister()
globalActionRegister.register('auth', authAction)

// 사용자 관련 액션들
const userActionRegister = new ActionRegister()
userActionRegister.register('fetchUser', fetchUserAction)

function App() {
  return (
    <ActionProvider register={globalActionRegister}>
      <Layout>
        <ActionProvider register={userActionRegister}>
          <UserDashboard />
        </ActionProvider>
      </Layout>
    </ActionProvider>
  )
}
```

## 관련 문서

- [useAction](/api/react/use-action) - 액션을 사용하는 Hook
- [Hooks](/api/react/hooks) - 기타 유용한 Hook들