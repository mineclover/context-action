# 빠른 시작

Context Action을 사용하여 첫 번째 액션을 만들어보세요.

## 기본 설정

```typescript
import { ActionRegister } from '@context-action/core'

// 액션 등록기 생성
const actionRegister = new ActionRegister()

// 간단한 액션 정의
const greetAction = actionRegister.register('greet', {
  handler: (name: string) => {
    return `안녕하세요, ${name}님!`
  }
})

// 액션 실행
const result = greetAction.execute('김철수')
console.log(result) // "안녕하세요, 김철수님!"
```

## React와 함께 사용

```typescript
import { ActionContext } from '@context-action/react'

function App() {
  return (
    <ActionContext.Provider value={actionRegister}>
      <MyComponent />
    </ActionContext.Provider>
  )
}
```

## 다음 단계

- [Core 패키지](/api/core/)에서 더 자세한 API를 확인하세요
- [React 통합](/api/react/)으로 React 앱에서 사용하는 방법을 배우세요