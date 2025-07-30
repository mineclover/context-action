# 아키텍처

Context Action의 전체 아키텍처와 설계 원칙을 설명합니다.

## 🏗️ 전체 구조

```
┌─────────────────────────────────────────┐
│                Frontend                 │
├─────────────────┬───────────────────────┤
│  React Layer    │    Jotai Layer        │
│                 │                       │
│  ┌─────────────┐│  ┌─────────────────┐  │
│  │   Hooks     ││  │   Action Atoms  │  │
│  │             ││  │                 │  │
│  │ useAction   ││  │  actionAtom()   │  │
│  │ useActionS  ││  │  resultAtom()   │  │
│  │ tate        ││  │  loadingAtom()  │  │
│  └─────────────┘│  └─────────────────┘  │
│                 │                       │
│  ┌─────────────┐│  ┌─────────────────┐  │
│  │  Context    ││  │   Utilities     │  │
│  │             ││  │                 │  │
│  │ ActionCont  ││  │  withJotai()    │  │
│  │ ext         ││  │  atomFamily()   │  │
│  │ ActionProv  ││  │  selectAtom()   │  │
│  │ ider        ││  └─────────────────┘  │
│  └─────────────┘│                       │
├─────────────────┴───────────────────────┤
│                Core Layer                │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │         ActionRegister              │ │
│  │                                     │ │
│  │  ┌─────────────┐ ┌─────────────────┐│ │
│  │  │   Actions   │ │   Lifecycle     ││ │
│  │  │             │ │                 ││ │
│  │  │ register()  │ │  onSuccess()    ││ │
│  │  │ get()       │ │  onError()      ││ │
│  │  │ execute()   │ │  onFinally()    ││ │
│  │  └─────────────┘ └─────────────────┘│ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │            Utilities                │ │
│  │                                     │ │
│  │  withRetry() | withTimeout()        │ │
│  │  compose()   | debounce()           │ │
│  │  throttle()  | createAction()       │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 📋 설계 원칙

### 1. 레이어드 아키텍처 (Layered Architecture)

각 패키지는 명확한 책임을 가진 레이어로 구성됩니다:

- **Core Layer**: 핵심 비즈니스 로직
- **Integration Layer**: 외부 라이브러리와의 통합
- **Presentation Layer**: UI 프레임워크 특화 기능

### 2. 의존성 역전 (Dependency Inversion)

```typescript
// Core는 외부 의존성이 없음
export class ActionRegister {
  // 순수한 TypeScript 구현
}

// React 패키지가 Core를 의존
export function useAction(name: string) {
  const register = useContext(ActionContext) // Core의 ActionRegister 사용
  return register.get(name)
}

// Jotai 패키지도 Core를 의존
export function actionAtom(config: ActionConfig) {
  // Core의 개념을 Jotai 아톰으로 변환
}
```

### 3. 단일 책임 원칙 (Single Responsibility)

각 클래스와 함수는 하나의 명확한 책임을 가집니다:

```typescript
// ActionRegister: 액션 등록 및 관리만 담당
class ActionRegister {
  register() { /* 액션 등록 */ }
  get() { /* 액션 조회 */ }
  unregister() { /* 액션 제거 */ }
}

// useAction: React에서 액션 사용만 담당
function useAction(name: string) {
  // 단순히 Context에서 액션을 가져오는 역할
}

// actionAtom: Jotai 아톰 생성만 담당
function actionAtom(config: ActionConfig) {
  // 액션을 Jotai 아톰으로 변환하는 역할
}
```

## 🔄 데이터 흐름

### React에서의 데이터 흐름

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Component   │───▶│ useAction   │───▶│ ActionReg   │
│             │    │ Hook        │    │ ister       │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                                      │
       │           ┌─────────────┐            │
       └───────────│   Action    │◀───────────┘
                   │  Execution  │
                   └─────────────┘
```

### Jotai에서의 데이터 흐름

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Component   │───▶│ useAtom     │───▶│ actionAtom  │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                                      │
       │           ┌─────────────┐            │
       │           │  Atom       │◀───────────┘
       │           │  State      │
       │           └─────────────┘
       │                  │
       └──────────────────┘
         (자동 상태 업데이트)
```

## 🎯 핵심 개념

### 1. ActionRegister

모든 액션을 중앙에서 관리하는 레지스트리:

```typescript
interface ActionRegister {
  register<T, R>(name: string, config: ActionConfig<T, R>): Action<T, R>
  get(name: string): Action | undefined
  getAll(): Map<string, Action>
  unregister(name: string): boolean
}
```

**특징:**
- 타입 안전성 보장
- 런타임 액션 등록/해제
- 메모리 효율적인 관리

### 2. Action

실제 실행 가능한 액션 인스턴스:

```typescript
interface Action<T, R> {
  name: string
  execute(payload: T): Promise<R>
  status: ActionStatus
}
```

**특징:**
- 비동기 실행 지원
- 상태 추적
- 에러 처리

### 3. ActionConfig

액션의 동작을 정의하는 설정:

```typescript
interface ActionConfig<T, R> {
  handler: ActionHandler<T, R>
  onSuccess?: (result: R) => void
  onError?: (error: Error) => void
  onFinally?: () => void
}
```

**특징:**
- 라이프사이클 훅
- 타입 추론
- 확장 가능한 설정

## 🔌 통합 패턴

### React 통합

```typescript
// 1. Context를 통한 의존성 주입
const ActionContext = createContext<ActionRegister>()

// 2. Hook을 통한 간편한 액세스
function useAction(name: string) {
  const register = useContext(ActionContext)
  return register.get(name)
}

// 3. 상태 관리와의 통합
function useActionState(name: string) {
  const action = useAction(name)
  const [state, setState] = useState(initialState)
  
  // 액션 실행과 React 상태 동기화
}
```

### Jotai 통합

```typescript
// 1. 액션을 아톰으로 변환
function actionAtom(config: ActionConfig) {
  return atom(
    (get) => ({ /* 현재 상태 */ }),
    (get, set, payload) => { /* 액션 실행 */ }
  )
}

// 2. 상태 아톰들과 자동 연동
const loadingAtom = atom(false)
const errorAtom = atom(null)
const resultAtom = atom(null)

// 3. 액션 실행 시 관련 아톰들 자동 업데이트
```

## 🛡️ 타입 안전성

### 제네릭 활용

```typescript
// 입력과 출력 타입을 명시적으로 정의
interface User {
  id: string
  name: string
}

const fetchUserAction = register<string, User>('fetchUser', {
  handler: async (userId: string): Promise<User> => {
    // TypeScript가 반환 타입을 검증
    const response = await fetch(`/api/users/${userId}`)
    return response.json() // User 타입이어야 함
  }
})

// 사용 시에도 타입이 보장됨
const user: User = await fetchUserAction.execute('123')
```

### 타입 추론

```typescript
// 핸들러 함수의 타입에서 자동으로 추론
const action = register('example', {
  handler: (data: { name: string }) => ({ result: data.name.toUpperCase() })
})

// TypeScript가 자동으로 추론:
// - 입력 타입: { name: string }
// - 출력 타입: { result: string }
```

## 🎛️ 확장성

### 플러그인 시스템

```typescript
interface ActionPlugin {
  name: string
  beforeExecute?: (action: Action, payload: any) => void
  afterExecute?: (action: Action, result: any) => void
  onError?: (action: Action, error: Error) => void
}

class ActionRegister {
  plugins: ActionPlugin[] = []
  
  use(plugin: ActionPlugin) {
    this.plugins.push(plugin)
  }
}
```

### 미들웨어 패턴

```typescript
type ActionMiddleware = (
  action: Action,
  payload: any,
  next: () => Promise<any>
) => Promise<any>

const loggingMiddleware: ActionMiddleware = async (action, payload, next) => {
  console.log(`Executing ${action.name}`)
  const result = await next()
  console.log(`Completed ${action.name}`)
  return result
}
```

이 아키텍처는 확장성, 유지보수성, 타입 안전성을 모두 고려하여 설계되었습니다.