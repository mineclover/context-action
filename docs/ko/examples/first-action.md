# 첫 번째 액션

간단한 액션을 만들고 실행해보는 예제입니다.

## 액션 생성

```typescript
import { ActionRegister } from '@context-action/core'

const register = new ActionRegister()

// 간단한 로그 액션
register.register({
  type: 'log/info',
  handler: (payload) => {
    console.log('정보:', payload.message)
  }
})
```

## 액션 실행

```typescript
// 액션 실행
register.execute({
  type: 'log/info',
  payload: { message: '첫 번째 액션이 실행되었습니다!' }
})
```

## 비동기 액션

```typescript
register.register({
  type: 'user/fetch',
  handler: async (payload) => {
    const response = await fetch(`/api/users/${payload.id}`)
    return response.json()
  }
})
```