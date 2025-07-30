# React Context 설정

React 애플리케이션에서 Context Action을 효과적으로 설정하고 사용하는 방법을 안내합니다.

## 기본 Context 설정

### ActionProvider 사용

```typescript
// App.tsx
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { HomePage } from './components/HomePage'

function App() {
  return (
    <ActionProvider>
      <div className="App">
        <HomePage />
      </div>
    </ActionProvider>
  )
}

export default App
```

### 커스텀 ActionRegister 제공

```typescript
// actions/index.ts
import { ActionRegister } from '@context-action/core'

export const actionRegister = new ActionRegister()

// 기본 액션들 등록
actionRegister.register('fetchUsers', {
  handler: async () => {
    const response = await fetch('/api/users')
    return response.json()
  }
})

actionRegister.register('createUser', {
  handler: async (userData: Omit<User, 'id'>) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  }
})
```

```typescript
// App.tsx
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { actionRegister } from './actions'
import { HomePage } from './components/HomePage'

function App() {
  return (
    <ActionProvider register={actionRegister}>
      <div className="App">
        <HomePage />
      </div>
    </ActionProvider>
  )
}
```

## 다중 Context 설정

### 계층적 Context 구조

```typescript
// actions/global.ts - 전역 액션들
export const globalActionRegister = new ActionRegister()

globalActionRegister.register('auth', {
  handler: async (credentials: LoginCredentials) => {
    // 인증 로직
  }
})

globalActionRegister.register('logout', {
  handler: async () => {
    // 로그아웃 로직
    localStorage.removeItem('authToken')
  }
})
```

```typescript
// actions/user.ts - 사용자 관련 액션들
export const userActionRegister = new ActionRegister()

userActionRegister.register('fetchProfile', {
  handler: async () => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.json()
  }
})

userActionRegister.register('updateProfile', {
  handler: async (profileData: Partial<User>) => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    })
    return response.json()
  }
})
```

```typescript
// App.tsx - 중첩된 Provider 설정
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { globalActionRegister } from './actions/global'
import { userActionRegister } from './actions/user'
import { Layout } from './components/Layout'
import { UserDashboard } from './components/UserDashboard'

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

## 조건부 Context 설정

### 인증 상태에 따른 액션 등록

```typescript
// hooks/useAuthenticatedActions.ts
import { useMemo } from 'react'
import { ActionRegister } from '@context-action/core'
import { useAuth } from './useAuth'

export function useAuthenticatedActions() {
  const { isAuthenticated, user } = useAuth()
  
  return useMemo(() => {
    const register = new ActionRegister()
    
    if (isAuthenticated) {
      // 인증된 사용자용 액션들
      register.register('fetchPrivateData', {
        handler: async () => {
          const response = await fetch('/api/private/data', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
          return response.json()
        }
      })
      
      register.register('deleteAccount', {
        handler: async () => {
          const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${user.token}` }
          })
          return response.json()
        }
      })
    } else {
      // 비인증 사용자용 액션들
      register.register('requestPasswordReset', {
        handler: async (email: string) => {
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })
          return response.json()
        }
      })
    }
    
    return register
  }, [isAuthenticated, user])
}
```

```typescript
// components/AuthenticatedApp.tsx
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { useAuthenticatedActions } from '../hooks/useAuthenticatedActions'

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const actionRegister = useAuthenticatedActions()
  
  return (
    <ActionProvider register={actionRegister}>
      {children}
    </ActionProvider>
  )
}
```

## 컴포넌트에서 Context 사용

### 기본 사용법

```typescript
// components/UserList.tsx
import React, { useEffect, useState } from 'react'
import { useAction } from '@context-action/react'

interface User {
  id: string
  name: string
  email: string
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchUsers = useAction('fetchUsers')
  const createUser = useAction('createUser')
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  const loadUsers = async () => {
    if (!fetchUsers) return
    
    setLoading(true)
    setError(null)
    
    try {
      const userData = await fetchUsers.execute()
      setUsers(userData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 로드 실패')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateUser = async () => {
    if (!createUser) return
    
    try {
      const newUser = await createUser.execute({
        name: '새 사용자',
        email: 'new@example.com'
      })
      setUsers(prev => [...prev, newUser])
    } catch (err) {
      alert('사용자 생성 실패')
    }
  }
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>오류: {error}</div>
  
  return (
    <div>
      <h2>사용자 목록</h2>
      <button onClick={handleCreateUser}>사용자 추가</button>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 에러 바운더리와 함께 사용

```typescript
// components/ActionErrorBoundary.tsx
import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ActionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('액션 실행 중 오류 발생:', error, errorInfo)
    
    // 에러 리포팅 서비스로 전송
    if (window.errorReporting) {
      window.errorReporting.captureException(error, errorInfo)
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>오류가 발생했습니다</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: undefined })}>
            다시 시도
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

```typescript
// App.tsx - 에러 바운더리 적용
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { ActionErrorBoundary } from './components/ActionErrorBoundary'
import { actionRegister } from './actions'
import { HomePage } from './components/HomePage'

function App() {
  return (
    <ActionProvider register={actionRegister}>
      <ActionErrorBoundary>
        <div className="App">
          <HomePage />
        </div>
      </ActionErrorBoundary>
    </ActionProvider>
  )
}
```

## 개발 도구 통합

### Redux DevTools 연동

```typescript
// utils/devtools.ts
import { ActionRegister } from '@context-action/core'

export function withDevTools(register: ActionRegister) {
  if (process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: 'Context Action'
    })
    
    // 액션 실행 추적
    const originalRegister = register.register.bind(register)
    register.register = function(name, config) {
      const action = originalRegister(name, {
        ...config,
        handler: async (payload) => {
          devTools.send(`${name}/START`, { payload })
          
          try {
            const result = await config.handler(payload)
            devTools.send(`${name}/SUCCESS`, { payload, result })
            return result
          } catch (error) {
            devTools.send(`${name}/ERROR`, { payload, error: error.message })
            throw error
          }
        }
      })
      
      return action
    }
  }
  
  return register
}
```

```typescript
// actions/index.ts
import { ActionRegister } from '@context-action/core'
import { withDevTools } from '../utils/devtools'

let actionRegister = new ActionRegister()

if (process.env.NODE_ENV === 'development') {
  actionRegister = withDevTools(actionRegister)
}

export { actionRegister }
```

## 테스팅

### Context Provider 모킹

```typescript
// __tests__/utils/ActionTestProvider.tsx
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { ActionRegister } from '@context-action/core'

export function ActionTestProvider({ 
  children, 
  mockActions = {} 
}: { 
  children: React.ReactNode
  mockActions?: Record<string, any>
}) {
  const testRegister = new ActionRegister()
  
  // 모킹된 액션들 등록
  Object.entries(mockActions).forEach(([name, mockHandler]) => {
    testRegister.register(name, {
      handler: mockHandler
    })
  })
  
  return (
    <ActionProvider register={testRegister}>
      {children}
    </ActionProvider>
  )
}
```

```typescript
// __tests__/UserList.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserList } from '../components/UserList'
import { ActionTestProvider } from './utils/ActionTestProvider'

describe('UserList', () => {
  it('사용자 목록을 로드하고 표시한다', async () => {
    const mockUsers = [
      { id: '1', name: '김철수', email: 'kim@example.com' },
      { id: '2', name: '이영희', email: 'lee@example.com' }
    ]
    
    const mockActions = {
      fetchUsers: jest.fn().mockResolvedValue(mockUsers),
      createUser: jest.fn().mockResolvedValue({ id: '3', name: '새 사용자', email: 'new@example.com' })
    }
    
    render(
      <ActionTestProvider mockActions={mockActions}>
        <UserList />
      </ActionTestProvider>
    )
    
    // 로딩 후 사용자 목록 표시 확인
    await waitFor(() => {
      expect(screen.getByText('김철수 (kim@example.com)')).toBeInTheDocument()
      expect(screen.getByText('이영희 (lee@example.com)')).toBeInTheDocument()
    })
    
    // 사용자 추가 버튼 클릭
    fireEvent.click(screen.getByText('사용자 추가'))
    
    await waitFor(() => {
      expect(mockActions.createUser).toHaveBeenCalled()
    })
  })
})