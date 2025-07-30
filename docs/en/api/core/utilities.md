# 유틸리티 함수

Core 패키지에서 제공하는 유틸리티 함수들을 소개합니다.

## createAction()

액션을 생성하는 헬퍼 함수입니다.

```typescript
function createAction<T, R>(
  name: string, 
  handler: ActionHandler<T, R>
): ActionConfig<T, R>
```

**예제:**

```typescript
import { createAction } from '@context-action/core'

const fetchUserAction = createAction('fetchUser', async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
})
```

## withRetry()

재시도 로직을 추가하는 고차 함수입니다.

```typescript
function withRetry<T, R>(
  handler: ActionHandler<T, R>, 
  retries: number = 3
): ActionHandler<T, R>
```

**예제:**

```typescript
import { withRetry } from '@context-action/core'

const resilientHandler = withRetry(async (data) => {
  // 실패할 수 있는 작업
  const result = await apiCall(data)
  return result
}, 3)
```

## withTimeout()

타임아웃을 추가하는 고차 함수입니다.

```typescript
function withTimeout<T, R>(
  handler: ActionHandler<T, R>, 
  timeout: number
): ActionHandler<T, R>
```

**예제:**

```typescript
import { withTimeout } from '@context-action/core'

const timedHandler = withTimeout(async (data) => {
  // 오래 걸릴 수 있는 작업
  return await longRunningOperation(data)
}, 5000) // 5초 타임아웃
```

## compose()

여러 핸들러를 조합하는 함수입니다.

```typescript
function compose<T>(...handlers: ActionHandler<T, T>[]): ActionHandler<T, T>
```

**예제:**

```typescript
import { compose, withRetry, withTimeout } from '@context-action/core'

const robustHandler = compose(
  withTimeout(5000),
  withRetry(3),
  async (data) => {
    return await processData(data)
  }
)
```

## debounce()

디바운스를 적용하는 함수입니다.

```typescript
function debounce<T, R>(
  handler: ActionHandler<T, R>, 
  delay: number
): ActionHandler<T, R>
```

**예제:**

```typescript
import { debounce } from '@context-action/core'

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query)
  return results
}, 300) // 300ms 디바운스
```

## throttle()

스로틀을 적용하는 함수입니다.

```typescript
function throttle<T, R>(
  handler: ActionHandler<T, R>, 
  interval: number
): ActionHandler<T, R>
```

**예제:**

```typescript
import { throttle } from '@context-action/core'

const throttledUpdate = throttle(async (data) => {
  await updateServer(data)
}, 1000) // 1초에 한 번만 실행
```