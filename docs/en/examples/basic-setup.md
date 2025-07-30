# 기본 설정

Context Action을 프로젝트에 설정하는 기본적인 방법을 설명합니다.

## 설치

```bash
npm install @context-action/core
```

React를 사용하는 경우:
```bash
npm install @context-action/core @context-action/react
```

## 기본 ActionRegister 설정

```typescript
import { ActionRegister } from '@context-action/core'

// 전역 액션 레지스트리 생성
export const actionRegister = new ActionRegister()

// 기본 액션들 등록
actionRegister.register('greet', {
  handler: (name: string) => {
    return `안녕하세요, ${name}님!`
  }
})

actionRegister.register('fetchData', {
  handler: async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  },
  onSuccess: (data) => {
    console.log('데이터 로드 성공:', data)
  },
  onError: (error) => {
    console.error('데이터 로드 실패:', error.message)
  }
})
```

## React 프로젝트 설정

### App.tsx 설정

```typescript
import React from 'react'
import { ActionProvider } from '@context-action/react'
import { actionRegister } from './actions'
import { MainComponent } from './components/MainComponent'

function App() {
  return (
    <ActionProvider register={actionRegister}>
      <div className="App">
        <header>
          <h1>Context Action 데모</h1>
        </header>
        <main>
          <MainComponent />
        </main>
      </div>
    </ActionProvider>
  )
}

export default App
```

### 컴포넌트에서 액션 사용

```typescript
import React, { useState } from 'react'
import { useAction } from '@context-action/react'

export function MainComponent() {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  
  const greetAction = useAction('greet')
  
  const handleGreet = async () => {
    if (greetAction) {
      try {
        const result = await greetAction.execute(name)
        setGreeting(result)
      } catch (error) {
        console.error('인사 실패:', error)
      }
    }
  }
  
  return (
    <div>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
        />
        <button onClick={handleGreet}>인사하기</button>
      </div>
      
      {greeting && (
        <div style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          {greeting}
        </div>
      )}
    </div>
  )
}
```

## TypeScript 설정

### 타입 정의

```typescript
// types/actions.ts
export interface User {
  id: string
  name: string
  email: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface ActionTypes {
  greet: {
    input: string
    output: string
  }
  fetchUser: {
    input: string
    output: User
  }
  fetchUsers: {
    input: void
    output: User[]
  }
}
```

### 타입 안전한 액션 등록

```typescript
// actions/index.ts
import { ActionRegister } from '@context-action/core'
import type { User, ApiResponse, ActionTypes } from '../types/actions'

export const actionRegister = new ActionRegister()

// 타입 안전한 액션 등록
actionRegister.register<
  ActionTypes['fetchUser']['input'],
  ActionTypes['fetchUser']['output']
>('fetchUser', {
  handler: async (userId: string): Promise<User> => {
    const response = await fetch(`/api/users/${userId}`)
    const apiResponse: ApiResponse<User> = await response.json()
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message)
    }
    
    return apiResponse.data
  }
})

actionRegister.register<
  ActionTypes['fetchUsers']['input'],
  ActionTypes['fetchUsers']['output']
>('fetchUsers', {
  handler: async (): Promise<User[]> => {
    const response = await fetch('/api/users')
    const apiResponse: ApiResponse<User[]> = await response.json()
    return apiResponse.data
  }
})
```

## 환경별 설정

### 개발 환경

```typescript
// config/development.ts
import { ActionRegister } from '@context-action/core'

export function createDevelopmentRegister() {
  const register = new ActionRegister()
  
  // 개발 환경용 액션들
  register.register('debug', {
    handler: (message: any) => {
      console.log('[DEBUG]', message)
      return message
    }
  })
  
  register.register('mockApi', {
    handler: async (endpoint: string) => {
      // 개발 중에는 모킹된 데이터 반환
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { mock: true, endpoint }
    }
  })
  
  return register
}
```

### 프로덕션 환경

```typescript
// config/production.ts
import { ActionRegister } from '@context-action/core'

export function createProductionRegister() {
  const register = new ActionRegister()
  
  // 프로덕션용 액션들
  register.register('analytics', {
    handler: (event: string, data?: any) => {
      // 실제 분석 서비스로 전송
      analytics.track(event, data)
    }
  })
  
  register.register('errorReport', {
    handler: (error: Error) => {
      // 에러 리포팅 서비스로 전송
      errorReporting.captureException(error)
    }
  })
  
  return register
}
```

### 통합 설정

```typescript
// config/index.ts
import { ActionRegister } from '@context-action/core'
import { createDevelopmentRegister } from './development'
import { createProductionRegister } from './production'

export function createActionRegister(): ActionRegister {
  const baseRegister = new ActionRegister()
  
  // 공통 액션들 등록
  baseRegister.register('greet', {
    handler: (name: string) => `안녕하세요, ${name}님!`
  })
  
  // 환경별 액션들 추가
  if (process.env.NODE_ENV === 'development') {
    const devRegister = createDevelopmentRegister()
    // 개발 액션들을 기본 레지스터에 복사
    devRegister.getAll().forEach((action, name) => {
      baseRegister.register(name, action.config)
    })
  } else {
    const prodRegister = createProductionRegister()
    // 프로덕션 액션들을 기본 레지스터에 복사
    prodRegister.getAll().forEach((action, name) => {
      baseRegister.register(name, action.config)
    })
  }
  
  return baseRegister
}
```

이제 기본 설정이 완료되었습니다! 다음 단계로 [첫 번째 액션](/examples/first-action)을 만들어보세요.