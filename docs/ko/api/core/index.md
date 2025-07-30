# Core API 레퍼런스

`@context-action/core` 패키지는 Context Action 라이브러리의 핵심 기능을 제공합니다. 프레임워크에 구애받지 않는 타입 안전한 액션 관리 시스템입니다.

## 설치

```bash
npm install @context-action/core
```

## ActionRegister

`ActionRegister`는 액션 핸들러를 등록하고 액션을 디스패치하는 핵심 클래스입니다.

### 생성자

```typescript
class ActionRegister<TActions extends Record<string, any>>
```

#### 타입 매개변수

- `TActions`: 액션 인터페이스를 정의하는 타입

#### 예제

```typescript
import { ActionRegister } from '@context-action/core';

interface MyActions {
  increment: void;
  setCount: number;
  updateUser: { id: number; name: string };
}

const register = new ActionRegister<MyActions>();
```

### 메서드

#### `addHandler<K>(actionType, handler, options?)`

액션 핸들러를 등록합니다.

**매개변수:**
- `actionType`: `K` - 처리할 액션 타입
- `handler`: `ActionHandler<TActions[K]>` - 액션 핸들러 함수
- `options?`: `HandlerOptions` - 핸들러 옵션

**반환값:** `() => void` - 핸들러 제거 함수

**예제:**

```typescript
// 동기 핸들러
const removeHandler = register.addHandler('increment', () => {
  console.log('카운터 증가');
});

// 비동기 핸들러
register.addHandler('updateUser', async ({ id, name }) => {
  await api.updateUser(id, { name });
  console.log(`사용자 ${id} 업데이트 완료`);
});

// 우선순위가 있는 핸들러
register.addHandler('increment', () => {
  console.log('먼저 실행됨');
}, { priority: 100 });

// 핸들러 제거
removeHandler();
```

#### `dispatch<K>(actionType, payload?)`

액션을 디스패치합니다.

**매개변수:**
- `actionType`: `K` - 디스패치할 액션 타입
- `payload?`: `TActions[K]` - 액션 페이로드 (필요한 경우)

**반환값:** `Promise<void>` - 모든 핸들러 실행 완료를 나타내는 프로미스

**예제:**

```typescript
// 페이로드가 없는 액션
await register.dispatch('increment');

// 페이로드가 있는 액션
await register.dispatch('setCount', 42);
await register.dispatch('updateUser', { id: 1, name: 'John' });
```

#### `removeAllHandlers(actionType?)`

핸들러를 제거합니다.

**매개변수:**
- `actionType?`: `keyof TActions` - 제거할 액션 타입 (선택사항)

**예제:**

```typescript
// 특정 액션의 모든 핸들러 제거
register.removeAllHandlers('increment');

// 모든 액션의 모든 핸들러 제거
register.removeAllHandlers();
```

#### `hasHandlers(actionType)`

특정 액션에 등록된 핸들러가 있는지 확인합니다.

**매개변수:**
- `actionType`: `keyof TActions` - 확인할 액션 타입

**반환값:** `boolean` - 핸들러 존재 여부

**예제:**

```typescript
if (register.hasHandlers('increment')) {
  console.log('increment 핸들러가 등록되어 있습니다');
}
```

## 타입 정의

### ActionHandler

액션 핸들러 함수의 타입입니다.

```typescript
type ActionHandler<TPayload> = TPayload extends void
  ? () => void | Promise<void>
  : (payload: TPayload) => void | Promise<void>;
```

**예제:**

```typescript
// void 액션 핸들러
const voidHandler: ActionHandler<void> = () => {
  console.log('액션 실행');
};

// 페이로드가 있는 액션 핸들러
const payloadHandler: ActionHandler<number> = (count) => {
  console.log(`카운트: ${count}`);
};
```

### HandlerOptions

핸들러 등록 시 사용할 수 있는 옵션입니다.

```typescript
interface HandlerOptions {
  priority?: number;
}
```

**프로퍼티:**
- `priority` (선택사항): 핸들러 실행 우선순위. 높은 값이 먼저 실행됩니다. 기본값: 0

**예제:**

```typescript
// 높은 우선순위 핸들러 (먼저 실행)
register.addHandler('action', handler1, { priority: 100 });

// 기본 우선순위 핸들러
register.addHandler('action', handler2);

// 낮은 우선순위 핸들러 (나중에 실행)
register.addHandler('action', handler3, { priority: -100 });
```

## 고급 사용법

### 와일드카드 핸들러

모든 액션에 대해 실행되는 핸들러를 등록할 수 있습니다:

```typescript
// 모든 액션에 대한 로깅
register.addHandler('*' as any, (payload: any, actionType: string) => {
  console.log(`액션 실행: ${actionType}`, payload);
});
```

### 에러 처리

핸들러에서 발생한 에러는 자동으로 catch되며, `dispatch` 호출에서 재throw됩니다:

```typescript
register.addHandler('riskyAction', () => {
  throw new Error('무언가 잘못되었습니다');
});

try {
  await register.dispatch('riskyAction');
} catch (error) {
  console.error('액션 실행 중 에러:', error.message);
}
```

### 조건부 실행

핸들러 내에서 조건을 확인하여 실행을 제어할 수 있습니다:

```typescript
let isEnabled = true;

register.addHandler('conditionalAction', (payload) => {
  if (!isEnabled) {
    console.log('액션이 비활성화되어 있습니다');
    return;
  }
  
  // 실제 로직 실행
  processPayload(payload);
});
```

### 체이닝 패턴

액션이 다른 액션을 트리거하는 패턴:

```typescript
register.addHandler('login', async (credentials) => {
  const user = await api.login(credentials);
  
  // 로그인 성공 후 다른 액션 트리거
  await register.dispatch('setUser', user);
  await register.dispatch('loadUserPreferences', { userId: user.id });
});
```

## 성능 고려사항

- **제로 디펜던시**: 외부 라이브러리에 의존하지 않습니다
- **최소 번들 크기**: 핵심 기능만 포함하여 번들 크기를 최소화합니다
- **메모리 효율성**: 핸들러는 WeakMap을 사용하여 메모리 누수를 방지합니다
- **비동기 최적화**: Promise 기반으로 비동기 작업을 효율적으로 처리합니다

## 예제

### 기본 카운터

```typescript
import { ActionRegister } from '@context-action/core';

interface CounterActions {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}

class Counter {
  private count = 0;
  private actions = new ActionRegister<CounterActions>();

  constructor() {
    this.setupHandlers();
  }

  private setupHandlers() {
    this.actions.addHandler('increment', () => {
      this.count++;
      this.notifyChange();
    });

    this.actions.addHandler('decrement', () => {
      this.count--;
      this.notifyChange();
    });

    this.actions.addHandler('setCount', (value) => {
      this.count = value;
      this.notifyChange();
    });

    this.actions.addHandler('reset', () => {
      this.count = 0;
      this.notifyChange();
    });
  }

  public async increment() {
    await this.actions.dispatch('increment');
  }

  public async setCount(value: number) {
    await this.actions.dispatch('setCount', value);
  }

  public getCount() {
    return this.count;
  }

  private notifyChange() {
    console.log(`카운트 변경됨: ${this.count}`);
  }
}

// 사용 예제
const counter = new Counter();
await counter.increment(); // 카운트 변경됨: 1
await counter.setCount(10); // 카운트 변경됨: 10
```

### 비동기 데이터 관리

```typescript
interface DataActions {
  fetchUser: { id: number };
  updateUser: { id: number; data: Partial<User> };
  deleteUser: { id: number };
}

class UserService {
  private actions = new ActionRegister<DataActions>();
  private cache = new Map<number, User>();

  constructor() {
    this.setupHandlers();
  }

  private setupHandlers() {
    this.actions.addHandler('fetchUser', async ({ id }) => {
      if (this.cache.has(id)) {
        console.log('캐시에서 사용자 로드:', id);
        return;
      }

      console.log('서버에서 사용자 로드:', id);
      const user = await api.getUser(id);
      this.cache.set(id, user);
    });

    this.actions.addHandler('updateUser', async ({ id, data }) => {
      const updatedUser = await api.updateUser(id, data);
      this.cache.set(id, updatedUser);
      console.log('사용자 업데이트 완료:', id);
    });

    this.actions.addHandler('deleteUser', async ({ id }) => {
      await api.deleteUser(id);
      this.cache.delete(id);
      console.log('사용자 삭제 완료:', id);
    });
  }

  public async getUser(id: number) {
    await this.actions.dispatch('fetchUser', { id });
    return this.cache.get(id);
  }

  public async updateUser(id: number, data: Partial<User>) {
    await this.actions.dispatch('updateUser', { id, data });
    return this.cache.get(id);
  }
}
```

이제 Core 패키지의 모든 주요 기능을 이해했습니다. [React 패키지](/ko/api/react/)나 [Jotai 패키지](/ko/api/jotai/)를 통해 UI 프레임워크와 통합하는 방법을 살펴보세요.