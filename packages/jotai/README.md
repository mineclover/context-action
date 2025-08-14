# @context-action/jotai

> **⚠️ DEPRECATED**: 이 패키지는 더 이상 유지보수되지 않으며 업데이트를 받지 않습니다. 상태 관리를 위해 `@context-action/react`를 사용하세요.

Context 내에서 Jotai atom을 공유하기 위한 헬퍼 라이브러리입니다.

## 목적

이 패키지는 React Context를 통해 Jotai atom을 컴포넌트 트리에서 공유할 수 있도록 도와줍니다. 전역 상태 관리 없이도 특정 컴포넌트 트리 범위 내에서 상태를 격리하고 관리할 수 있습니다.

## 설치

```bash
npm install @context-action/jotai
# 또는
pnpm add @context-action/jotai
```

## 기본 사용법

```tsx
import { createAtomContext } from '@context-action/jotai'

// 초기값과 함께 atom context 생성
const { Provider, useAtomState, useAtomReadOnly, useAtomSetter } = createAtomContext(0)

function App() {
  return (
    <Provider>
      <Counter />
      <Display />
    </Provider>
  )
}

function Counter() {
  const [count, setCount] = useAtomState()
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}

function Display() {
  const count = useAtomReadOnly()
  
  return <div>Current count: {count}</div>
}
```

## API

### `createAtomContext<T>(initialValue: T)`

주어진 초기값으로 atom context를 생성합니다.

**반환값:**
- `Provider`: atom을 제공하는 Context Provider 컴포넌트
- `useAtomContext`: Context 접근을 위한 기본 hook
- `useAtomState`: atom 값과 setter를 모두 반환하는 hook
- `useAtomReadOnly`: atom 값만 반환하는 읽기 전용 hook
- `useAtomSelect`: atom 값의 일부를 선택하여 반환하는 hook
- `useAtomSetter`: atom setter만 반환하는 hook

### Hooks

#### `useAtomState()`
atom의 현재 값과 setter 함수를 반환합니다.

```tsx
const [value, setValue] = useAtomState()
```

#### `useAtomReadOnly()`
atom의 현재 값만 반환합니다 (읽기 전용).

```tsx
const value = useAtomReadOnly()
```

#### `useAtomSelect<R>(callback: (item: T) => R)`
atom 값의 특정 부분을 선택하여 반환합니다.

```tsx
const userName = useAtomSelect(user => user.name)
```

#### `useAtomSetter()`
atom의 setter 함수만 반환합니다.

```tsx
const setValue = useAtomSetter()
```

## 고급 사용법

### 복잡한 상태 관리

```tsx
interface User {
  id: number
  name: string
  email: string
}

const { Provider, useAtomState, useAtomSelect } = createAtomContext<User>({
  id: 0,
  name: '',
  email: ''
})

function UserProfile() {
  const userName = useAtomSelect(user => user.name)
  const userEmail = useAtomSelect(user => user.email)
  
  return (
    <div>
      <h1>{userName}</h1>
      <p>{userEmail}</p>
    </div>
  )
}
```

### 여러 Context 사용

```tsx
const CounterContext = createAtomContext(0)
const UserContext = createAtomContext({ name: '', age: 0 })

function App() {
  return (
    <CounterContext.Provider>
      <UserContext.Provider>
        <MyComponent />
      </UserContext.Provider>
    </CounterContext.Provider>
  )
}
```

## 특징

- **타입 안전성**: TypeScript로 작성되어 완전한 타입 지원
- **성능 최적화**: 필요한 부분만 리렌더링되도록 최적화
- **유연성**: 다양한 사용 패턴을 지원하는 hook 제공
- **격리**: 각 Provider는 독립적인 상태 범위를 제공

## 라이선스

MIT