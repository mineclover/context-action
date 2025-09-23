# Handler Injection Pattern 실제 시연 요약

## 🎯 시연 시나리오

**상황**: 중복 이메일로 사용자 생성 시도를 통한 Handler Injection Pattern 검증

### 기존 상태
```typescript
// Store에 저장된 기존 사용자
const existingUser = {
  id: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  role: "admin",
  createdAt: new Date()
};
```

### 새로운 시도
```typescript
// 중복 이메일로 새 사용자 생성 시도
const newUserAttempt = {
  name: "Jane Smith",
  email: "john.doe@example.com", // 🔥 중복 이메일!
  role: "user"
};
```

## 🔄 Handler Injection 실행 과정

### 1단계: Action Dispatch
```typescript
// actions/useUserManagementActions.ts
const createUser = useCallback(async (data) => {
  const result = await dispatch('createUser', data);
  return result;
}, [dispatch]);

// 콘솔 출력: "React dispatch called for 'createUser'"
```

### 2단계: Handler Injection (핵심!)
```typescript
// handlers/UserManagementHandlers.tsx
const createUserHandler = useCallback(async (payload) => {
  logger?.info('Creating user', { payload });

  // 🔑 핵심: 최신 값 주입
  const currentUsers = usersStore.getValue();
  console.log('현재 사용자 수:', currentUsers.length); // 1

  // 🔑 핵심: 순수 비즈니스 로직 호출
  const result = BusinessLogic.createUserEntity(payload, currentUsers);
}, [usersStore]);

// 콘솔 출력: "📝 LOG: Creating user"
```

### 3단계: Pure Business Logic 실행
```typescript
// business/userBusinessLogic.ts
export function createUserEntity(userData, existingUsers) {
  // 🎯 최신 사용자 목록으로 중복 검사
  const emailExists = existingUsers.some(user => user.email === userData.email);

  if (emailExists) {
    return {
      success: false,
      message: 'User with this email already exists'
    };
  }

  // 사용자 생성 로직...
}

// 실행 결과: { success: false, message: "User with this email already exists" }
```

### 4단계: Side Effects (실패 시)
```typescript
// handlers/UserManagementHandlers.tsx
if (result.success && result.user) {
  // 성공 시 실행되지 않음
  usersStore.setValue([...currentUsers, result.user]);
  await apiClient.saveUser(result.user);
} else {
  // 🔑 실패 상태 업데이트 (사이드 이펙트)
  operationStatusStore.setValue({
    isLoading: false,
    lastOperation: 'create',
    result: result // { success: false, message: "..." }
  });
}
```

### 5단계: Reactive UI Update
```typescript
// hooks/useUserManagementData.ts
const operationStatus = useStoreValue(operationStatusStore);

// views에서 자동 업데이트
// "create operation: Failed"
// "User with this email already exists"
```

## 🎯 패턴의 핵심 증명 포인트

### ✅ 1. 최신 값 접근 보장
```typescript
// ❌ 기존 방식: closure 문제
const [users, setUsers] = useState([]);
const handler = useCallback((payload) => {
  // users가 오래된 값일 수 있음
  const duplicate = users.find(u => u.email === payload.email);
}, [users]); // 의존성 배열 문제

// ✅ Handler Injection: 항상 최신값
const handler = useCallback((payload) => {
  // 매번 최신 값을 store에서 가져옴
  const latestUsers = usersStore.getValue();
  const result = createUserEntity(payload, latestUsers);
}, [usersStore]); // store 참조만 의존
```

### ✅ 2. 순수 함수 비즈니스 로직
```typescript
// 완전히 테스트 가능한 순수 함수
export function createUserEntity(userData, existingUsers) {
  // 입력만으로 출력 결정
  // React 의존성 없음
  // 사이드 이펙트 없음

  const emailExists = existingUsers.some(user => user.email === userData.email);
  return emailExists
    ? { success: false, message: 'Email already exists' }
    : { success: true, user: createNewUser(userData) };
}

// 단위 테스트 예시
test('should detect duplicate email', () => {
  const existingUsers = [{ email: 'john@test.com' }];
  const result = createUserEntity(
    { email: 'john@test.com' },
    existingUsers
  );
  expect(result.success).toBe(false);
});
```

### ✅ 3. 사이드 이펙트 격리
```typescript
// 사이드 이펙트는 핸들러에서만 발생
const handler = useCallback(async (payload) => {
  // 1️⃣ 최신 값 주입 (순수)
  const currentState = store.getValue();

  // 2️⃣ 비즈니스 로직 (순수)
  const result = pureBusinessLogic(payload, currentState);

  // 3️⃣ 사이드 이펙트 (격리)
  if (result.success) {
    store.setValue(result.newState);     // Store 업데이트
    await api.save(result.data);         // API 호출
    analytics.track('user.created');     // 분석 추적
    onSuccess?.(result);                 // 콜백 실행
  }
}, [store, api, analytics, onSuccess]);
```

## 🚀 실제 시연 결과

### 콘솔 로그 분석
```bash
# 실제 브라우저 콘솔 출력
✅ React dispatch called for 'createUser': {hasPayload: true, timestamp: ...}
✅ 📝 LOG: Creating user {payload: {name: "Jane Smith", email: "john.doe@example.com", role: "user"}}
✅ Handler Injection: 최신 사용자 1명 확인
✅ Business Logic: 이메일 중복 감지
✅ Store Update: operationStatus 실패 상태로 업데이트
✅ UI Update: "create operation: Failed" 표시
```

### UI 상태 변화
```typescript
// 이전 상태
operationStatus = {
  isLoading: false,
  lastOperation: 'create',
  result: { success: true, message: 'User created successfully' }
}

// Handler Injection 후 상태
operationStatus = {
  isLoading: false,
  lastOperation: 'create',
  result: { success: false, message: 'User with this email already exists' }
}

// UI 반영
// "create operation: Failed"
// "User with this email already exists"
```

### 데이터 무결성 확인
```typescript
// 사용자 수 변화 없음 (중복 방지 성공)
userStatistics = {
  totalUsers: 1,        // 변화 없음
  roleDistribution: {   // 변화 없음
    admin: 1,
    user: 0,
    guest: 0
  }
}
```

## 💡 패턴의 실용적 가치

### 1. 개발 생산성
- **디버깅 용이**: 각 단계별 명확한 로그와 상태 추적
- **테스트 간편**: 순수 함수는 격리된 단위 테스트 가능
- **재사용성**: 비즈니스 로직은 다른 컨텍스트에서도 사용 가능

### 2. 코드 품질
- **타입 안전성**: TypeScript로 전체 플로우 타입 보장
- **예측 가능성**: 순수 함수로 인한 예측 가능한 동작
- **유지보수성**: 관심사 분리로 인한 쉬운 수정

### 3. 확장성
- **새로운 비즈니스 로직**: 순수 함수로 쉽게 추가
- **다양한 사이드 이펙트**: 핸들러에서 유연하게 처리
- **복잡한 상태 관리**: 여러 store의 최신 값을 조합 가능

## 🎯 결론

Handler Injection Pattern은 다음 3가지 핵심 문제를 동시에 해결합니다:

1. **❌ 최신 값 접근 문제** → ✅ `store.getValue()`로 해결
2. **❌ 비즈니스 로직 테스트 어려움** → ✅ 순수 함수로 해결
3. **❌ 사이드 이펙트 관리 복잡성** → ✅ 핸들러 격리로 해결

이는 Context-Action 프레임워크에서 **5-layer 아키텍처의 핵심 혁신**이며, 실제 동작하는 시연을 통해 그 효과를 확인했습니다.