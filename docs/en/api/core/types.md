# 타입 정의

Core 패키지에서 사용되는 주요 타입들을 설명합니다.

## ActionConfig

액션 설정을 정의하는 인터페이스입니다.

```typescript
interface ActionConfig<T = any, R = any> {
  handler: ActionHandler<T, R>
  onSuccess?: (result: R) => void
  onError?: (error: Error) => void
  onFinally?: () => void
  timeout?: number
  retries?: number
}
```

### 속성

- `handler`: 액션의 핵심 로직을 담당하는 함수
- `onSuccess`: 액션 성공 시 호출되는 콜백
- `onError`: 액션 실패 시 호출되는 콜백  
- `onFinally`: 액션 완료 시 항상 호출되는 콜백
- `timeout`: 타임아웃 시간 (밀리초)
- `retries`: 재시도 횟수

## ActionHandler

액션 핸들러 함수의 타입입니다.

```typescript
type ActionHandler<T, R> = (payload: T) => R | Promise<R>
```

## ActionResult

액션 실행 결과를 나타내는 타입입니다.

```typescript
interface ActionResult<R> {
  success: boolean
  data?: R
  error?: Error
  executionTime: number
}
```

## ActionStatus

액션의 현재 상태를 나타내는 열거형입니다.

```typescript
enum ActionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}
```

## 예제

```typescript
import type { ActionConfig, ActionHandler } from '@context-action/core'

// 사용자 정의 핸들러
const userHandler: ActionHandler<string, User> = async (userId) => {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) {
    throw new Error('사용자를 찾을 수 없습니다')
  }
  return response.json()
}

// 액션 설정
const userActionConfig: ActionConfig<string, User> = {
  handler: userHandler,
  timeout: 5000,
  retries: 3,
  onSuccess: (user) => console.log(`${user.name} 로드 완료`),
  onError: (error) => console.error('로드 실패:', error.message)
}
```