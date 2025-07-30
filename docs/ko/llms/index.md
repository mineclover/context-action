# LLM 통합

Context Action과 Large Language Model을 통합하는 방법입니다.

## 개요

Context Action을 사용하여 LLM과의 상호작용을 체계적으로 관리할 수 있습니다.

## 기본 설정

```typescript
import { ActionRegister } from '@context-action/core'

const register = new ActionRegister()

// LLM 액션 등록
register.register({
  type: 'llm/chat',
  handler: async (payload) => {
    // LLM API 호출 로직
  }
})
```

## 사용 예제

```typescript
// 채팅 액션 실행
await register.execute({
  type: 'llm/chat',
  payload: {
    message: '안녕하세요!',
    model: 'gpt-4'
  }
})
```