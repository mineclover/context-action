# 첫 번째 액션

Context Action으로 첫 번째 액션을 만들고 실행하는 방법을 단계별로 안내합니다.

## 1단계: 간단한 동기 액션

### 액션 정의

```typescript
import { ActionRegister } from '@context-action/core'

const actionRegister = new ActionRegister()

// 가장 간단한 액션
const simpleAction = actionRegister.register('hello', {
  handler: () => {
    return 'Hello, World!'
  }
})

// 액션 실행
const result = simpleAction.execute()
console.log(result) // "Hello, World!"
```

### 매개변수가 있는 액션

```typescript
// 매개변수를 받는 액션
const greetAction = actionRegister.register('greet', {
  handler: (name: string) => {
    return `안녕하세요, ${name}님!`
  }
})

// 실행
const greeting = greetAction.execute('김철수')
console.log(greeting) // "안녕하세요, 김철수님!"
```

## 2단계: 비동기 액션

### 기본 비동기 액션

```typescript
// Promise를 반환하는 액션
const asyncAction = actionRegister.register('fetchTime', {
  handler: async () => {
    // 1초 대기 후 현재 시간 반환
    await new Promise(resolve => setTimeout(resolve, 1000))
    return new Date().toLocaleString()
  }
})

// await로 실행
const currentTime = await asyncAction.execute()
console.log(currentTime) // "2024-01-15 오후 3:30:45"
```

### API 호출 액션

```typescript
interface User {
  id: number
  name: string
  email: string
}

// API 호출 액션
const fetchUserAction = actionRegister.register('fetchUser', {
  handler: async (userId: number): Promise<User> => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
    
    if (!response.ok) {
      throw new Error(`사용자를 찾을 수 없습니다: ${response.status}`)
    }
    
    return response.json()
  }
})

// 사용 예제
try {
  const user = await fetchUserAction.execute(1)
  console.log('사용자 정보:', user.name, user.email)
} catch (error) {
  console.error('오류 발생:', error.message)
}
```

## 3단계: 라이프사이클 훅 활용

### 성공/실패 처리

```typescript
const robustAction = actionRegister.register('robustFetch', {
  handler: async (url: string) => {
    console.log(`데이터 요청 시작: ${url}`)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  },
  
  onSuccess: (data) => {
    console.log('✅ 데이터 로드 성공!')
    console.log('받은 데이터:', data)
  },
  
  onError: (error) => {
    console.error('❌ 데이터 로드 실패!')
    console.error('오류 내용:', error.message)
  },
  
  onFinally: () => {
    console.log('🏁 데이터 로드 작업 완료')
  }
})

// 실행 (훅들이 자동으로 호출됨)
await robustAction.execute('https://api.example.com/data')
```

## 4단계: React에서 사용하기

### Hook으로 액션 사용

```typescript
import React, { useState } from 'react'
import { useAction } from '@context-action/react'

function UserProfile() {
  const [userId, setUserId] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchUser = useAction('fetchUser')
  
  const handleFetchUser = async () => {
    if (!fetchUser || !userId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const userData = await fetchUser.execute(parseInt(userId))
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <h2>사용자 프로필</h2>
      
      <div>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="사용자 ID 입력"
        />
        <button onClick={handleFetchUser} disabled={loading}>
          {loading ? '로딩 중...' : '사용자 정보 가져오기'}
        </button>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          오류: {error}
        </div>
      )}
      
      {user && (
        <div style={{ marginTop: '1rem' }}>
          <h3>{user.name}</h3>
          <p>이메일: {user.email}</p>
        </div>
      )}
    </div>
  )
}
```

## 5단계: 복잡한 액션 만들기

### 여러 단계가 있는 액션

```typescript
interface LoginCredentials {
  email: string
  password: string
}

interface LoginResult {
  token: string
  user: User
}

const loginAction = actionRegister.register('login', {
  handler: async (credentials: LoginCredentials): Promise<LoginResult> => {
    // 1단계: 로그인 요청
    console.log('1단계: 로그인 시도 중...')
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    
    if (!loginResponse.ok) {
      throw new Error('로그인 실패: 이메일 또는 비밀번호가 올바르지 않습니다')
    }
    
    const { token } = await loginResponse.json()
    
    // 2단계: 사용자 정보 가져오기
    console.log('2단계: 사용자 정보 조회 중...')
    const userResponse = await fetch('/api/user/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!userResponse.ok) {
      throw new Error('사용자 정보 조회 실패')
    }
    
    const user = await userResponse.json()
    
    // 3단계: 로컬 스토리지에 토큰 저장
    console.log('3단계: 인증 정보 저장 중...')
    localStorage.setItem('authToken', token)
    localStorage.setItem('currentUser', JSON.stringify(user))
    
    return { token, user }
  },
  
  onSuccess: ({ user }) => {
    console.log(`환영합니다, ${user.name}님!`)
    // 페이지 리다이렉트나 상태 업데이트
    window.location.href = '/dashboard'
  },
  
  onError: (error) => {
    console.error('로그인 실패:', error.message)
    // 에러 메시지 UI에 표시
  }
})

// 사용 예제
const handleLogin = async (email: string, password: string) => {
  try {
    await loginAction.execute({ email, password })
  } catch (error) {
    // 에러는 onError 훅에서 처리됨
  }
}
```

### 폼 처리 액션

```typescript
interface FormData {
  name: string
  email: string
  message: string
}

const submitContactForm = actionRegister.register('submitContact', {
  handler: async (formData: FormData) => {
    // 유효성 검사
    if (!formData.name.trim()) {
      throw new Error('이름을 입력해주세요')
    }
    if (!formData.email.includes('@')) {
      throw new Error('올바른 이메일 주소를 입력해주세요')
    }
    if (formData.message.length < 10) {
      throw new Error('메시지는 10자 이상 입력해주세요')
    }
    
    // API 전송
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) {
      throw new Error('메시지 전송 실패')
    }
    
    return await response.json()
  },
  
  onSuccess: () => {
    alert('메시지가 성공적으로 전송되었습니다!')
  },
  
  onError: (error) => {
    alert(`오류: ${error.message}`)
  }
})
```

## 다음 단계

첫 번째 액션을 성공적으로 만들었습니다! 이제 다음 내용들을 살펴보세요:

- [Core 예제](/examples/core/action-registration) - 더 고급 액션 등록 방법
- [React 예제](/examples/react/context-setup) - React에서의 활용법
- [고급 패턴](/examples/advanced/custom-handlers) - 커스텀 핸들러와 미들웨어