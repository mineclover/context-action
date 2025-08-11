# 공통 함정

Context-Action 구현에서 자주 발생하는 실수들을 학습하고 이를 피하는 방법을 알아보세요. 이 가이드는 개발자들이 가장 자주 겪는 문제들과 해결 방법을 다룹니다.

## 핸들러 등록 문제

### ❌ 정리 누락

**문제:** 컴포넌트 언마운트 시 핸들러가 정리되지 않아 메모리 누수 발생.

```typescript
// ❌ 잘못됨 - 메모리 누수
function useUserHandlers() {
  const register = useUserActionRegister();
  
  useEffect(() => {
    register('updateProfile', handler);
  }, []); // 정리 없음 - 핸들러가 메모리에 누적됨
}
```

**해결책:** 항상 unregister 함수를 반환하세요.

```typescript
// ✅ 올바름 - 적절한 정리
function useUserHandlers() {
  const register = useUserActionRegister();
  
  const handler = useCallback(async (payload, controller) => {
    // 핸들러 로직
  }, []);
  
  useEffect(() => {
    if (!register) return;
    const unregister = register('updateProfile', handler);
    return unregister; // 중요: 언마운트 시 정리
  }, [register, handler]);
}
```

**증상:**
- 시간이 지남에 따라 메모리 사용량 증가
- 핸들러가 여러 번 실행됨
- 스테일 클로저 오류

### ❌ 비동기 핸들러에서 `blocking` 누락

**문제:** 비동기 핸들러들이 순차가 아닌 동시에 실행됨.

```typescript
// ❌ 잘못됨 - 핸들러가 동시에 실행됨
register('processOrder', asyncHandler1, { priority: 100 });
register('processOrder', asyncHandler2, { priority: 90 });
register('processOrder', asyncHandler3, { priority: 80 });
// 모두 동시에 실행됨!
```

**해결책:** 순차 실행이 필요한 비동기 핸들러에는 `blocking: true`를 사용하세요.

```typescript
// ✅ 올바름 - 순차 실행
register('processOrder', asyncHandler1, { 
  priority: 100, 
  blocking: true // 완료까지 대기
});
register('processOrder', asyncHandler2, { 
  priority: 90, 
  blocking: true // handler1 완료 후 실행
});
```

**증상:**
- 핸들러 간 경합 조건
- 일관성 없는 상태 업데이트
- 핸들러가 서로의 변경사항을 덮어씀

### ❌ 스테일 클로저 사용

**문제:** 핸들러가 등록 시점의 오래된 값을 캡처함.

```typescript
// ❌ 잘못됨 - 스테일 클로저
function useUserHandlers() {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue(); // 등록 시점에 캡처됨
  
  const handler = useCallback(async (payload, controller) => {
    console.log(profile); // 이건 스테일 데이터!
    // 핸들러가 등록된 시점의 프로필만 보여줌
  }, [profile]); // 의존성에 스테일 값 포함
}
```

**해결책:** registry.getStore()를 사용한 지연 평가 사용.

```typescript
// ✅ 올바름 - 지연 평가
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const handler = useCallback(async (payload, controller) => {
    const profileStore = registry.getStore('profile');
    const profile = profileStore.getValue(); // 실행 시점의 최신 값
    console.log(profile); // 항상 현재 데이터
  }, [registry]); // 의존성에는 registry만
}
```

**증상:**
- 핸들러가 오래된 데이터로 작업
- 스테일 값에 기반한 상태 업데이트
- 현재 애플리케이션 상태를 반영하지 않는 로직

## 스토어 접근 문제

### ❌ 반응형 구독 미사용

**문제:** 스토어 데이터가 변경되어도 컴포넌트가 재렌더링되지 않음.

```typescript
// ❌ 잘못됨 - 반응형이 아님
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue(); // 일회성 접근, 반응형 아님
  
  // 프로필이 변경되어도 컴포넌트가 재렌더링되지 않음
  return <div>{profile.name}</div>;
}
```

**해결책:** 반응형 구독을 위해 `useStoreValue()`를 사용하세요.

```typescript
// ✅ 올바름 - 반응형 구독
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // 반응형 구독
  
  // 프로필이 변경되면 컴포넌트가 재렌더링됨
  return <div>{profile.name}</div>;
}
```

**증상:**
- 상태가 변경되어도 컴포넌트가 업데이트되지 않음
- 현재 데이터를 반영하지 않는 스테일 UI
- 변경사항을 보기 위해 수동 새로고침 필요

### ❌ 직접 스토어 변경

**문제:** setValue 대신 스토어 객체를 직접 변경함.

```typescript
// ❌ 잘못됨 - 직접 변경
function updateUserName(newName: string) {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue();
  
  profile.name = newName; // 직접 변경 - 구독자들에게 알림 안됨
  // 컴포넌트들이 재렌더링되지 않음!
}
```

**해결책:** 업데이트에 항상 setValue를 사용하세요.

```typescript
// ✅ 올바름 - 불변 업데이트
function updateUserName(newName: string) {
  const profileStore = useUserStore('profile');
  const profile = profileStore.getValue();
  
  profileStore.setValue({
    ...profile,
    name: newName // 새 객체 - 구독자들에게 알림됨
  });
}
```

**증상:**
- UI에 변경사항이 반영되지 않음
- 컴포넌트 간 일관성 없는 상태
- 상태 변경 시점에 대한 디버깅 혼란

### ❌ Null/Undefined 초기값

**문제:** 초기값으로 null이나 undefined 사용 시 TypeScript와 런타임 문제 발생.

```typescript
// ❌ 잘못됨 - Null 초기값
const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: null // TypeScript 오류, 런타임 문제
  }
});

function UserProfile() {
  const profile = useStoreValue(useUserStore('profile'));
  return <div>{profile.name}</div>; // profile이 null이면 런타임 오류
}
```

**해결책:** 적절한 기본값을 제공하세요.

```typescript
// ✅ 올바름 - 적절한 초기값
const userStores = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: ''
    }
  }
});

function UserProfile() {
  const profile = useStoreValue(useUserStore('profile'));
  return <div>{profile.name || '이름 없음'}</div>; // 안전한 접근
}
```

**증상:**
- TypeScript 컴파일 오류
- 런타임 null/undefined 오류
- 모든 곳에서 방어적 코딩 필요

## 타입 안전성 문제

### ❌ 제네릭 훅 사용

**문제:** 도메인별 훅 대신 제네릭 훅 사용으로 타입 안전성 상실.

```typescript
// ❌ 잘못됨 - 타입 안전성 없음
function UserProfile() {
  const store = useStore('user-profile'); // any 타입
  const dispatch = useDispatch(); // any 액션 타입
  
  dispatch('updateUser', { anyData: 'here' }); // 컴파일 타임 체크 없음
}
```

**해결책:** 완전한 타입 안전성을 위해 도메인별 훅을 사용하세요.

```typescript
// ✅ 올바름 - 완전한 타입 안전성
function UserProfile() {
  const profileStore = useUserStore('profile'); // Store<UserProfile>
  const dispatch = useUserAction(); // 타입된 디스패처
  
  dispatch('updateProfile', { 
    data: { name: 'John' } // 컴파일 타임 타입 체크
  });
}
```

### ❌ 인터페이스에서 Any 타입

**문제:** `any` 타입 사용으로 TypeScript의 목적 무력화.

```typescript
// ❌ 잘못됨 - 타입 안전성 상실
interface UserActions {
  updateProfile: any;
  deleteUser: any;
}
```

**해결책:** 적절하고 구체적인 타입을 정의하세요.

```typescript
// ✅ 올바름 - 구체적인 타입
interface UserActions {
  updateProfile: { data: Partial<UserProfile> };
  deleteUser: { userId: string };
  resetProfile: void; // 페이로드 없음을 명시적으로 void
}
```

## Provider 설정 문제

### ❌ 잘못된 Provider 순서

**문제:** 잘못된 provider 중첩으로 컨텍스트 오류 발생.

```typescript
// ❌ 잘못됨 - 액션 provider가 스토어 provider 밖에 있음
function App() {
  return (
    <UserActionProvider>  {/* 액션이 스토어의 존재를 필요로 함 */}
      <UserProvider>      {/* 스토어가 여기서 생성됨 */}
        <UserProfile />
      </UserProvider>
    </UserActionProvider>
  );
}
// 오류: 액션이 스토어에 접근할 수 없음
```

**해결책:** 스토어 provider가 액션 provider를 감싸야 합니다.

```typescript
// ✅ 올바름 - 스토어 provider가 액션 provider를 감쌈
function App() {
  return (
    <UserProvider>         {/* 스토어가 먼저 생성됨 */}
      <UserActionProvider> {/* 액션이 스토어에 접근 가능 */}
        <UserProfile />
      </UserActionProvider>
    </UserProvider>
  );
}
```

### ❌ 핸들러 설정 누락

**문제:** Provider 트리에서 핸들러 설정을 깜빡함.

```typescript
// ❌ 잘못됨 - 핸들러가 등록되지 않음
function App() {
  return (
    <UserProvider>
      <UserActionProvider>
        <UserProfile /> {/* 액션은 디스패치되지만 응답하는 핸들러가 없음 */}
      </UserActionProvider>
    </UserProvider>
  );
}
```

**해결책:** 핸들러 설정 컴포넌트를 포함하세요.

```typescript
// ✅ 올바름 - 핸들러가 적절히 설정됨
function HandlerSetup() {
  useUserHandlers(); // 모든 핸들러 등록
  return null;
}

function App() {
  return (
    <UserProvider>
      <UserActionProvider>
        <HandlerSetup />    {/* 핸들러가 등록됨 */}
        <UserProfile />
      </UserActionProvider>
    </UserProvider>
  );
}
```

## 성능 문제

### ❌ 과도한 구독

**문제:** 필요 이상으로 많은 스토어를 구독하는 컴포넌트.

```typescript
// ❌ 잘못됨 - 불필요한 구독
function UserName() {
  const profile = useStoreValue(useUserStore('profile'));
  const preferences = useStoreValue(useUserStore('preferences')); // 필요 없음
  const session = useStoreValue(useUserStore('session')); // 필요 없음
  const history = useStoreValue(useUserStore('history')); // 필요 없음
  
  // 이 중 아무거나 변경되면 컴포넌트가 재렌더링됨
  return <span>{profile.name}</span>; // profile만 필요함
}
```

**해결책:** 실제로 사용하는 스토어만 구독하세요.

```typescript
// ✅ 올바름 - 최소 구독
function UserName() {
  const profile = useStoreValue(useUserStore('profile'));
  
  // profile이 변경될 때만 재렌더링됨
  return <span>{profile.name}</span>;
}
```

### ❌ 핸들러 재생성

**문제:** 렌더링마다 새로운 핸들러 함수 생성.

```typescript
// ❌ 잘못됨 - 렌더링마다 핸들러 재생성
function useUserHandlers() {
  const register = useUserActionRegister();
  
  // 렌더링마다 새 함수 생성
  const handler = async (payload, controller) => {
    // 핸들러 로직
  };
  
  useEffect(() => {
    const unregister = register('action', handler);
    return unregister;
  }, [register, handler]); // handler가 렌더링마다 바뀜!
}
```

**해결책:** 핸들러 참조를 안정화하기 위해 `useCallback`을 사용하세요.

```typescript
// ✅ 올바름 - 안정한 핸들러 참조
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  // 안정한 함수 참조
  const handler = useCallback(async (payload, controller) => {
    // 핸들러 로직
  }, [registry]); // registry가 변경될 때만 변함
  
  useEffect(() => {
    const unregister = register('action', handler);
    return unregister;
  }, [register, handler]); // 필요할 때만 effect 실행
}
```

## 크로스 도메인 문제

### ❌ 도메인 간 강한 결합

**문제:** 도메인이 서로의 내부를 직접 접근함.

```typescript
// ❌ 잘못됨 - 직접 도메인 결합
function useUserHandlers() {
  const cartStore = useCartStore('items'); // User 도메인이 Cart 내부 접근
  
  const loginHandler = useCallback(async (payload, controller) => {
    // 로그인 로직
    
    // 다른 도메인 직접 조작
    cartStore.setValue([]); // 강한 결합!
  }, [cartStore]);
}
```

**해결책:** 크로스 도메인 통신에는 통합 훅이나 이벤트를 사용하세요.

```typescript
// ✅ 올바름 - 통합을 통한 느슨한 결합
function useUserCartIntegration() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  const loginWithCartReset = useCallback(async (loginData) => {
    await userAction('login', loginData);
    await cartAction('clearCart'); // 적절한 도메인 경계
  }, [userAction, cartAction]);
  
  return { loginWithCartReset };
}
```

### ❌ 순환 의존성

**문제:** 서로를 의존하는 도메인으로 순환 import 발생.

```typescript
// ❌ 잘못됨 - 순환 의존성
// user.store.ts
import { useCartAction } from './cart.store'; // User가 Cart import

// cart.store.ts  
import { useUserAction } from './user.store'; // Cart가 User import
// 순환 의존성!
```

**해결책:** 별도의 통합 모듈을 생성하세요.

```typescript
// ✅ 올바름 - 통합 모듈
// integration/userCartIntegration.ts
import { useUserAction } from '../stores/user.store';
import { useCartAction } from '../stores/cart.store';

export function useUserCartIntegration() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  // 통합 로직
  return { /* 통합 메소드 */ };
}
```

## 디버깅 문제

### ❌ 불분명한 에러 메시지

**문제:** 핸들러가 조용히 실패하거나 도움이 되지 않는 오류 발생.

```typescript
// ❌ 잘못됨 - 불분명한 오류 처리
const handler = useCallback(async (payload, controller) => {
  try {
    await riskyOperation();
  } catch (error) {
    controller.abort(); // 무엇이 실패했는지 컨텍스트 없음
  }
}, []);
```

**해결책:** 상세한 오류 컨텍스트를 제공하세요.

```typescript
// ✅ 올바름 - 상세한 오류 처리
const handler = useCallback(async (payload, controller) => {
  try {
    await riskyOperation();
  } catch (error) {
    controller.abort(`프로필 업데이트 실패: ${error.message}`, {
      operation: 'updateProfile',
      payload,
      timestamp: Date.now(),
      error: error.stack
    });
  }
}, []);
```

### ❌ 핸들러 ID 없음

**문제:** 어떤 핸들러가 문제를 일으키는지 디버깅하기 어려움.

```typescript
// ❌ 잘못됨 - 핸들러 식별 없음
register('updateProfile', handler, {
  priority: 100,
  blocking: true
  // ID 없음 - 디버깅 어려움
});
```

**해결책:** 디버깅을 위해 설명적인 ID를 사용하세요.

```typescript
// ✅ 올바름 - 명확한 핸들러 식별
register('updateProfile', handler, {
  priority: 100,
  blocking: true,
  id: 'profile-validation-handler' // 명확한 식별
});
```

---

## 문제 해결 체크리스트

뭔가 작동하지 않을 때, 다음 일반적인 문제들을 확인하세요:

### 핸들러 문제 ✓
- [ ] 핸들러가 unregister 함수를 반환하고 있나요?
- [ ] 비동기 핸들러가 `blocking: true`를 사용하고 있나요?
- [ ] 핸들러가 지연 평가(`registry.getStore()`)를 사용하고 있나요?
- [ ] 핸들러가 `useCallback`으로 래핑되어 있나요?

### 스토어 문제 ✓
- [ ] 컴포넌트가 반응성을 위해 `useStoreValue()`를 사용하고 있나요?
- [ ] 스토어 업데이트가 직접 변경 대신 `setValue()`를 사용하고 있나요?
- [ ] 초기값이 적절히 정의되어 있나요(null이 아님)?

### Provider 문제 ✓
- [ ] 스토어 provider가 액션 provider를 감싸고 있나요?
- [ ] 핸들러 설정 컴포넌트가 포함되어 있나요?
- [ ] Provider가 올바른 순서로 되어 있나요?

### 타입 문제 ✓
- [ ] 도메인별 훅을 사용하고 있나요?
- [ ] 인터페이스가 `any` 타입 없이 적절히 정의되어 있나요?
- [ ] 액션 페이로드가 인터페이스 정의와 일치하나요?

### 성능 문제 ✓
- [ ] 컴포넌트가 필요한 스토어만 구독하고 있나요?
- [ ] 핸들러가 `useCallback`으로 안정화되어 있나요?
- [ ] 불필요한 재렌더링을 피하고 있나요?

---

## 요약

Context-Action 문제의 대부분은 다음에서 비롯됩니다:

1. **메모리 관리**: 핸들러 정리하지 않기
2. **비동기 조율**: `blocking: true` 누락  
3. **반응성**: 반응형 구독 사용하지 않기
4. **타입 안전성**: 도메인별 대신 제네릭 훅 사용
5. **Provider 설정**: 잘못된 provider 순서나 핸들러 누락

이 가이드의 패턴을 따르면 이러한 일반적인 함정을 피하고 더 견고한 애플리케이션을 구축할 수 있습니다.

---

::: tip 예방
이러한 문제들을 조기에 발견하기 위해 ESLint 규칙과 코드 리뷰 체크리스트를 설정하세요. 팀의 코드베이스에서 올바른 패턴을 강제하는 커스텀 훅을 만드는 것도 고려해보세요.
:::