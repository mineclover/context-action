# React 컨텍스트 설정

React 애플리케이션에서 Context Action을 설정하는 방법입니다.

## 프로바이더 설정

```tsx
import React from 'react'
import { ActionProvider } from '@context-action/react'

function App() {
  return (
    <ActionProvider>
      <div className="app">
        <Header />
        <Main />
        <Footer />
      </div>
    </ActionProvider>
  )
}

export default App
```

## 컴포넌트에서 사용

```tsx
import { useAction } from '@context-action/react'

function LoginForm() {
  const [login, { loading, error }] = useAction('user/login')
  
  const handleSubmit = (formData) => {
    login(formData)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 내용 */}
    </form>
  )
}
```

## 액션 등록

```tsx
import { useActionRegister } from '@context-action/react'

function useAuthActions() {
  const register = useActionRegister()
  
  React.useEffect(() => {
    register.register({
      type: 'user/login',
      handler: async (credentials) => {
        // 로그인 로직
      }
    })
  }, [register])
}
```