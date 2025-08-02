# Context Store Pattern

Provider 별로 독립적인 Registry 영역을 생성하여 Store를 격리하는 패턴입니다.

## 핵심 기능

### 1. createContextStorePattern(contextName)
Context Store 패턴을 생성하는 팩토리 함수입니다.

```typescript
import { createContextStorePattern } from '@context-action/react';

// 특정 도메인을 위한 Context Store 패턴 생성
const PageStores = createContextStorePattern('PageDemo');
```

### 2. Provider 컴포넌트
독립적인 Registry 영역을 생성합니다.

```typescript
function MyPage() {
  return (
    <PageStores.Provider registryId="my-page-demo">
      <MyPageContent />
    </PageStores.Provider>
  );
}
```

**Props:**
- `registryId` (선택적): Registry 고유 식별자. 미제공시 자동 생성.
- `children`: Provider 내부에서 Store를 사용할 컴포넌트들

### 3. useStore(name, initialValue, options)
Provider 영역 내에서 Store에 접근합니다.

```typescript
function MyComponent() {
  const messageStore = PageStores.useStore('message', 'Hello World', {
    strategy: 'reference',
    debug: true
  });
  
  const message = useStoreValue(messageStore);
  
  return <div>{message}</div>;
}
```

**Parameters:**
- `name`: Store 이름 (Provider 내에서 고유)
- `initialValue`: 초기값 또는 초기값 생성 함수
- `options`: 비교 옵션 (`strategy`, `debug`, `comparisonOptions`)

### 4. useIsolatedStore(domain, initialValue, options)
컴포넌트별로 격리된 Store를 생성합니다.

```typescript
function MyComponent() {
  // 컴포넌트별로 자동으로 고유한 Store 생성
  const localStore = PageStores.useIsolatedStore('local-data', { count: 0 });
  
  const data = useStoreValue(localStore);
  
  return <div>Count: {data.count}</div>;
}
```

**Parameters:**
- `domain`: Store 도메인명
- `initialValue`: 초기값 또는 초기값 생성 함수
- `options`: 비교 옵션

## 주요 장점

### 1. 완전한 격리
각 Provider는 독립적인 Registry를 가지므로 Store가 완전히 격리됩니다.

```typescript
// 서로 다른 Provider에서 같은 이름의 Store 사용 가능
<PageStores.Provider registryId="page-1">
  <Component /> {/* 'data' Store 사용 */}
</PageStores.Provider>

<PageStores.Provider registryId="page-2">
  <Component /> {/* 별개의 'data' Store 사용 */}
</PageStores.Provider>
```

### 2. 자동 중복 제거
같은 이름의 Store는 Provider 내에서 자동으로 중복 제거됩니다.

```typescript
function Component1() {
  const store = PageStores.useStore('shared', 'initial');
  // ...
}

function Component2() {
  // 같은 Store 인스턴스를 반환 (중복 생성 없음)
  const store = PageStores.useStore('shared', 'initial');
  // ...
}
```

### 3. 컴포넌트 수준 격리
`useIsolatedStore`는 컴포넌트별로 자동으로 고유한 Store를 생성합니다.

```typescript
function UserCard({ userId }) {
  // 각 UserCard 인스턴스마다 별개의 Store
  const userStore = PageStores.useIsolatedStore('user-data', { id: userId });
  // ...
}
```

## 실제 사용 예제

### 기본 사용법

```typescript
import React from 'react';
import { createContextStorePattern, useStoreValue } from '@context-action/react';

// 1. Context Store 패턴 생성
const AppStores = createContextStorePattern('App');

// 2. 컴포넌트에서 사용
function MessageComponent() {
  const messageStore = AppStores.useStore(
    'message', 
    'Hello, Context-Action!',
    { strategy: 'reference', debug: true }
  );
  
  const message = useStoreValue(messageStore);
  
  const updateMessage = () => {
    messageStore.setValue(`Updated at ${new Date().toLocaleTimeString()}`);
  };
  
  return (
    <div>
      <p>{message}</p>
      <button onClick={updateMessage}>Update Message</button>
    </div>
  );
}

// 3. Provider로 감싸기
function App() {
  return (
    <AppStores.Provider registryId="main-app">
      <MessageComponent />
    </AppStores.Provider>
  );
}
```

### 여러 Provider 사용

```typescript
function MultiPageApp() {
  return (
    <div>
      {/* 첫 번째 페이지 영역 */}
      <AppStores.Provider registryId="page-1">
        <h1>Page 1</h1>
        <MessageComponent />
        <CounterComponent />
      </AppStores.Provider>
      
      {/* 두 번째 페이지 영역 */}
      <AppStores.Provider registryId="page-2">
        <h1>Page 2</h1>
        <MessageComponent /> {/* 독립적인 Store 사용 */}
        <CounterComponent />
      </AppStores.Provider>
    </div>
  );
}
```

### 컴포넌트별 격리 예제

```typescript
function TodoList() {
  return (
    <AppStores.Provider registryId="todo-list">
      <TodoItem id="1" />
      <TodoItem id="2" />
      <TodoItem id="3" />
    </AppStores.Provider>
  );
}

function TodoItem({ id }) {
  // 각 TodoItem마다 별개의 Store 생성
  const todoStore = AppStores.useIsolatedStore(
    'todo-item',
    { id, text: '', completed: false }
  );
  
  const todo = useStoreValue(todoStore);
  
  const toggleCompleted = () => {
    todoStore.update(prev => ({ ...prev, completed: !prev.completed }));
  };
  
  return (
    <div>
      <input 
        type="checkbox" 
        checked={todo.completed}
        onChange={toggleCompleted}
      />
      <span>{todo.text}</span>
    </div>
  );
}
```

## Registry 접근

Provider 내부에서 Registry에 직접 접근해야 하는 경우:

```typescript
function AdvancedComponent() {
  const registry = AppStores.useRegistry();
  
  // Registry의 모든 Store 조회
  const allStores = registry.getAllStores();
  console.log('등록된 Store 수:', allStores.size);
  
  return <div>Advanced Registry Operations</div>;
}
```

## 주의사항

1. **Provider 외부에서 사용 불가**: Store 훅들은 반드시 해당 Provider 내부에서만 사용해야 합니다.

2. **Registry ID 충돌**: 같은 `registryId`를 가진 Provider들은 같은 Registry를 공유합니다.

3. **초기값 일관성**: 같은 이름의 Store를 여러 곳에서 생성할 때는 초기값이 일관되어야 합니다.

## 마이그레이션 가이드

기존 `createStore` 직접 사용에서 Context Store 패턴으로 마이그레이션:

### Before (기존 방식)
```typescript
const messageStore = createStore('message', 'Hello');
const counterStore = createStore('counter', 0);

function MyComponent() {
  const message = useStoreValue(messageStore);
  const counter = useStoreValue(counterStore);
  // ...
}
```

### After (Context Store 패턴)
```typescript
const PageStores = createContextStorePattern('Page');

function MyComponent() {
  const messageStore = PageStores.useStore('message', 'Hello');
  const counterStore = PageStores.useStore('counter', 0);
  
  const message = useStoreValue(messageStore);
  const counter = useStoreValue(counterStore);
  // ...
}

function App() {
  return (
    <PageStores.Provider>
      <MyComponent />
    </PageStores.Provider>
  );
}
```

이 패턴을 사용하면 Store의 생명주기와 범위를 명확하게 관리할 수 있으며, 컴포넌트 간의 상태 격리를 보장할 수 있습니다.