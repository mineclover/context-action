# Context-Action 프레임워크의 타입 안전성

Context-Action 프레임워크는 **엄격한 타입 안전성**을 핵심 원칙으로 설계되었습니다. 이 가이드는 타입 시스템의 동작 방식과 애플리케이션 전반에 걸쳐 견고한 컴파일 타임 안전성을 보장하는 최근 개선사항들을 설명합니다.

## 개요

Context-Action 프레임워크의 타입 안전성은 다음을 통해 달성됩니다:

1. **엄격한 TypeScript 통합** - `any` 타입 없는 완전한 타입 커버리지
2. **액션 페이로드 검증** - 액션 페이로드의 컴파일 타임 검증
3. **Store 타입 보장** - 초기화된 Store에 대한 undefined 없는 반환 보장
4. **Context Pattern 안전성** - 자동 컨텍스트 검증 및 오류 처리

## 핵심 타입 안전성 기능

### 1. 액션 페이로드 타입 안전성

모든 액션은 `ActionPayloadMap` 인터페이스를 확장해야 하며, 액션 디스패치에 대한 완전한 타입 안전성을 제공합니다:

```typescript
import { ActionPayloadMap } from '@context-action/react';

interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  clearUser: void; // 페이로드 없는 액션
}

// ✅ 타입 안전한 디스패치
const dispatch = useActionDispatch<UserActions>();
dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });

// ❌ 컴파일 타임 오류 - 잘못된 페이로드 타입
dispatch('updateUser', { id: 1 }); // 오류: id는 string이어야 함
dispatch('updateUser', { name: 'John' }); // 오류: 필수 필드 누락
```

### 2. Store 값 타입 안전성

#### 기존 `useStoreValue`의 문제점

이전에는 `useStoreValue`가 초기값이 있는 Store에 대해서도 `T | undefined`를 반환하여 불필요한 null 체크가 필요했습니다:

```typescript
// ❌ 기존 방식 - 불필요한 undefined 처리
const userStore = createStore({ name: 'John', age: 30 });
const user = useStoreValue(userStore); // 타입: User | undefined

// Store에 초기값이 있음에도 undefined 케이스 처리 강제
if (user) {
  console.log(user.name); // TypeScript가 이 체크를 요구함
}
```

#### 해결책: `useStoreValueSafe`

새로운 `useStoreValueSafe` 훅은 초기값이 있는 Store에 대해 엄격한 타입 안전성을 제공합니다:

```typescript
// ✅ 새로운 방식 - undefined 없는 보장된 반환
const userStore = createStore({ name: 'John', age: 30 });
const user = useStoreValueSafe(userStore); // 타입: User (절대 undefined 아님)

// null 체크 없이 직접 접근
console.log(user.name); // ✅ 항상 안전
```

#### 다중 훅 오버로드

두 훅 모두 다양한 사용 사례를 위한 다중 오버로드를 지원합니다:

```typescript
// 기본 사용법
const value = useStoreValueSafe(store);

// 셀렉터와 함께
const userName = useStoreValueSafe(userStore, user => user.name);

// 레거시 호환성 유지
const value = useStoreValue(store); // 여전히 작동, T | undefined 반환
```

### 3. Context Pattern 타입 안전성

통합 Context Pattern은 전체 컨텍스트 계층 구조에서 완전한 타입 안전성을 보장합니다:

```typescript
// ✅ 타입 안전한 컨텍스트 패턴 생성
const UserContext = createContextPattern<UserActions>('User');

// ✅ 보장된 타입으로 타입 안전한 Store 생성
const UserComponent = () => {
  const userStore = UserContext.useStore('user', { name: '', email: '' });
  const user = useStoreValueSafe(userStore); // 타입: User (절대 undefined 아님)
  
  // ✅ 타입 안전한 액션 처리
  UserContext.useActionHandler('updateUser', ({ id, name, email }) => {
    // 페이로드가 완전히 타입화됨 - 타입 어설션 불필요
    userStore.setValue({ id, name, email });
  });
  
  // ✅ 타입 안전한 디스패치
  const dispatch = UserContext.useAction();
  dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
};
```

### 4. 런타임 검증 (개발 모드)

컴파일 타임 안전성 외에도, 프레임워크는 개발 모드에서 런타임 검증을 제공합니다:

```typescript
// 디버깅을 위한 개발 모드 경고
const store = MyContext.useStore('data', undefined);
const value = useStoreValueSafe(store);
// 콘솔 경고: "Store 'data' initialized with undefined value"

// 런타임 검증으로 일반적인 실수 방지
const invalidStore = null;
const value = useStoreValueSafe(invalidStore);
// 런타임 오류: "useStoreValueSafe: Store cannot be null or undefined"
```

## 마이그레이션 가이드

### 레거시 Store 패턴에서 마이그레이션

레거시 패턴에서 마이그레이션하는 경우 다음 단계를 따르세요:

```typescript
// ❌ 기존 패턴 - 분리된 프로바이더
<StoreProvider>
  <ActionProvider>
    <MyComponent />
  </ActionProvider>
</StoreProvider>

// ✅ 새로운 통합 패턴
const MyContext = createContextPattern<MyActions>('MyContext');

<MyContext.Provider registryId="my-app">
  <MyComponent />
</MyContext.Provider>
```

### `useStoreValue`에서 `useStoreValueSafe`로 마이그레이션

```typescript
// ❌ 불필요한 null 체크가 있는 기존 방식
const user = useStoreValue(userStore);
const userName = user?.name ?? 'Unknown';

// ✅ 보장된 안전성을 가진 새로운 방식
const user = useStoreValueSafe(userStore);
const userName = user.name; // 항상 안전, null 체크 불필요
```

## 타입 안전성 모범 사례

### 1. 항상 초기값 사용

```typescript
// ✅ 좋음 - Store가 보장된 초기값을 가짐
const counterStore = MyContext.useStore('counter', 0);
const count = useStoreValueSafe(counterStore); // 타입: number

// ⚠️ 피해야 함 - Store가 undefined일 수 있음
const maybeStore = MyContext.useStore('maybe-data', undefined);
const data = useStoreValue(maybeStore); // 타입: unknown | undefined
```

### 2. 포괄적인 액션 인터페이스 정의

```typescript
// ✅ 좋음 - 완전한 액션 인터페이스
interface TodoActions extends ActionPayloadMap {
  addTodo: { text: string; priority: 'high' | 'medium' | 'low' };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  updateTodo: { id: string; text?: string; priority?: 'high' | 'medium' | 'low' };
  clearCompleted: void;
}

// ❌ 피해야 함 - 느슨한 타이핑
interface LooseActions extends ActionPayloadMap {
  updateSomething: any; // 타입 안전성 이점 상실
}
```

### 3. 복잡한 상태에 Context Pattern 사용

```typescript
// ✅ 좋음 - 완전한 타이핑으로 격리된 컨텍스트
const ShoppingCartContext = createContextPattern<CartActions>('ShoppingCart');

const CartComponent = () => {
  const cartStore = ShoppingCartContext.useStore('items', []);
  const items = useStoreValueSafe(cartStore); // 타입: CartItem[]
  
  ShoppingCartContext.useActionHandler('addItem', ({ item }) => {
    cartStore.update(prev => [...prev, item]);
  });
};
```

### 4. TypeScript Strict Mode 활용

`tsconfig.json`에서 strict mode가 활성화되어 있는지 확인하세요:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## 고급 타입 안전성 기능

### 제네릭 Store 타입

```typescript
// ✅ 완전한 타입 안전성을 가진 제네릭 Store
interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const useApiData = <T>() => {
  const apiStore = MyContext.useStore<ApiResponse<T>>('api', {
    data: {} as T,
    loading: false,
    error: null
  });
  
  const apiData = useStoreValueSafe(apiStore); // 타입: ApiResponse<T>
  return apiData;
};
```

### 조건부 타입 안전성

```typescript
// ✅ 다양한 Store 상태에 대한 조건부 타입
type StoreState<T> = T extends undefined ? T | undefined : T;

// 프레임워크가 자동으로 올바른 타이핑 적용
const definedStore = createStore('initial'); // StoreState<string> = string
const undefinedStore = createStore(undefined); // StoreState<undefined> = undefined
```

## 일반적인 타입 안전성 패턴

### 패턴 1: 타입 안전성을 가진 HOC

```typescript
const UserModuleContext = createContextPattern<UserActions>('UserModule');

const withUserModule = UserModuleContext.withProvider('user-module')(() => {
  const userStore = UserModuleContext.useStore('user', { name: '', email: '' });
  const user = useStoreValueSafe(userStore); // ✅ 항상 User로 타입화됨
  
  return <UserProfile user={user} />;
});
```

### 패턴 2: 크로스 컨텍스트 통신

```typescript
// ✅ 컨텍스트 간 타입 안전한 통신
const GlobalContext = createContextPattern<GlobalActions>('Global');
const LocalContext = createContextPattern<LocalActions>('Local');

const LocalComponent = () => {
  LocalContext.useActionHandler('requestGlobal', ({ message }) => {
    // 다른 컨텍스트로의 타입 안전한 디스패치
    const globalDispatch = GlobalContext.useAction();
    globalDispatch('showNotification', { message, type: 'info' });
  });
};
```

## 타입 이슈 트러블슈팅

### 일반적인 문제와 해결책

1. **"Property might be undefined" 오류**
   ```typescript
   // ❌ 문제
   const value = useStoreValue(store);
   console.log(value.property); // 오류: Object is possibly undefined
   
   // ✅ 해결책
   const value = useStoreValueSafe(store);
   console.log(value.property); // ✅ 항상 안전
   ```

2. **"Argument type not assignable" 오류**
   ```typescript
   // ❌ 문제 - 액션 페이로드 불일치
   dispatch('updateUser', { name: 'John' }); // 필수 필드 누락
   
   // ✅ 해결책 - 완전한 페이로드 제공
   dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
   ```

3. **Context provider not found 오류**
   ```typescript
   // ❌ 문제 - 프로바이더 외부에서 훅 사용
   const MyComponent = () => {
     const store = MyContext.useStore('data', initial); // 오류: Provider not found
   };
   
   // ✅ 해결책 - 프로바이더로 감싸기
   const App = () => (
     <MyContext.Provider registryId="app">
       <MyComponent />
     </MyContext.Provider>
   );
   ```

## 성능 고려사항

타입 안전성 개선은 성능도 향상시킵니다:

1. **컴파일 타임 최적화** - TypeScript가 보장된 타입을 기반으로 최적화 가능
2. **개발 모드에서만 런타임 검증** - 프로덕션 오버헤드 제로
3. **조건부 체크 감소** - 핫 패스에서 분기 감소
4. **더 나은 트리 쉐이킹** - 사용되지 않는 타입 분기 제거

## 결론

Context-Action 프레임워크의 타입 안전성 개선사항은 다음을 제공합니다:

- **적절히 초기화된 Store에 대한 undefined 오류 제로**
- **컴파일 타임의 완전한 액션 페이로드 검증**
- **보장된 타입 경계로 컨텍스트 격리**
- **조기 오류 감지를 위한 개발 타임 검증**
- **타입 보장을 통한 성능 최적화**

이러한 패턴을 따르고 제공된 타입 안전한 훅을 사용하면, 타입 오류가 런타임이 아닌 컴파일 타임에 잡힌다는 확신을 가지고 견고한 애플리케이션을 구축할 수 있습니다.