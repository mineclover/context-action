# 빠른 시작

Context Action을 사용하여 첫 번째 액션을 만들어 보세요.

## 기본 설정

```typescript
import { ActionRegister } from '@context-action/core'

const register = new ActionRegister()
```

## 첫 번째 액션

```typescript
register.register({
  type: 'hello',
  handler: () => {
    console.log('Hello, Context Action!')
  }
})
```