# API Specification

Context Action의 완전한 API 명세와 타입스크립트 설계 방향성을 설명합니다.

## Specification Overview

Context Action은 타입 안전한 액션 파이프라인 관리를 위한 TypeScript 라이브러리입니다. 이 명세서는 라이브러리의 전체 설계 철학, 타입 시스템, 그리고 구현 세부사항을 다룹니다.

## Design Goals

### 1. Type Safety First
모든 액션은 컴파일 타임에 타입이 검증되어야 합니다.

```typescript
// ✅ 타입 안전한 액션 정의
const fetchUser = actionRegister.register<string, User>('fetchUser', {
  handler: async (userId: string): Promise<User> => {
    // TypeScript가 입력과 출력 타입을 강제함
    const response = await fetch(`/api/users/${userId}`)
    return response.json() // User 타입이어야 함
  }
})

// ✅ 사용 시에도 타입 안전성 보장
const user: User = await fetchUser.execute('123') // string 입력 강제
```

### 2. Framework Agnostic Core
Core 패키지는 어떤 UI 프레임워크에도 의존하지 않습니다.

```typescript
// Core는 순수 TypeScript
export class ActionRegister {
  // React, Vue, Angular 등 어떤 프레임워크와도 사용 가능
}
```

### 3. Extensible Architecture
플러그인과 미들웨어를 통한 확장성을 제공합니다.

```typescript
interface ActionPlugin {
  name: string
  beforeExecute?: (action: Action, payload: any) => void
  afterExecute?: (action: Action, result: any) => void
}
```

### 4. Developer Experience
직관적인 API와 뛰어난 TypeScript 지원을 제공합니다.

```typescript
// 간단한 액션 등록
actionRegister.register('greet', {
  handler: (name: string) => `Hello, ${name}!`
})

// 자동 타입 추론
const greeting = await actionRegister.get('greet')?.execute('World')
// greeting의 타입은 자동으로 string으로 추론됨
```

## Architecture Principles

### Single Responsibility
각 클래스와 인터페이스는 단일 책임을 가집니다:

- `ActionRegister`: 액션 등록 및 관리
- `Action`: 액션 실행 및 상태 관리
- `ActionHandler`: 비즈니스 로직 실행

### Dependency Inversion
상위 레벨 모듈이 하위 레벨 모듈에 의존하지 않습니다:

```typescript
// ActionRegister는 구체적인 핸들러 구현에 의존하지 않음
interface ActionHandler<T, R> {
  (payload: T): R | Promise<R>
}

class ActionRegister {
  register<T, R>(name: string, config: ActionConfig<T, R>) {
    // 추상화에만 의존
  }
}
```

### Open/Closed Principle
확장에는 열려있고 수정에는 닫혀있습니다:

```typescript
// 새로운 기능은 플러그인으로 추가
const loggingPlugin: ActionPlugin = {
  name: 'logging',
  beforeExecute: (action, payload) => {
    console.log(`Executing ${action.name}`)
  }
}

actionRegister.use(loggingPlugin)
```

## Type System Design

### Generic Constraints
제네릭을 통한 타입 안전성 보장:

```typescript
interface ActionConfig<TInput = unknown, TOutput = unknown> {
  handler: ActionHandler<TInput, TOutput>
  onSuccess?: (result: TOutput) => void
  onError?: (error: Error) => void
}
```

### Conditional Types
조건부 타입을 통한 고급 타입 추론:

```typescript
type InferActionInput<T> = T extends Action<infer I, any> ? I : never
type InferActionOutput<T> = T extends Action<any, infer O> ? O : never
```

### Utility Types
일반적인 패턴을 위한 유틸리티 타입 제공:

```typescript
type AsyncActionHandler<T, R> = (payload: T) => Promise<R>
type SyncActionHandler<T, R> = (payload: T) => R
type ActionHandler<T, R> = AsyncActionHandler<T, R> | SyncActionHandler<T, R>
```

## Integration Specifications

### React Integration
React의 Hook 패턴과 Context API를 활용:

```typescript
// Context를 통한 의존성 주입
const ActionContext = createContext<ActionRegister>()

// Hook을 통한 편리한 액세스
function useAction<T, R>(name: string): Action<T, R> | undefined
```

### Jotai Integration
Jotai의 아톰 패턴과 완벽 통합:

```typescript
// 액션을 아톰으로 변환
function actionAtom<T, R>(config: ActionConfig<T, R>) {
  return atom(
    (get) => ({ /* 상태 */ }),
    (get, set, payload: T) => { /* 액션 실행 */ }
  )
}
```

## Performance Considerations

### Lazy Loading
액션은 필요할 때만 로드됩니다:

```typescript
const lazyAction = () => import('./heavy-action').then(m => m.default)

actionRegister.register('heavy', {
  handler: async (payload) => {
    const action = await lazyAction()
    return action(payload)
  }
})
```

### Memory Management
불필요한 액션은 자동으로 정리됩니다:

```typescript
// WeakMap을 사용한 메모리 효율적인 캐싱
const actionCache = new WeakMap<object, Action>()
```

### Bundle Size Optimization
Tree shaking을 통한 번들 크기 최적화:

```typescript
// 각 패키지는 독립적으로 import 가능
import { ActionRegister } from '@context-action/core'
import { useAction } from '@context-action/react' // React 사용 시에만
import { actionAtom } from '@context-action/jotai' // Jotai 사용 시에만
```

## Next Steps

- [Design Principles](/api-spec/design-principles) - 상세한 설계 원칙
- [TypeScript Specification](/api-spec/type-system) - 타입 시스템 명세
- [Core Specification](/api-spec/core/action-interface) - 핵심 인터페이스 명세