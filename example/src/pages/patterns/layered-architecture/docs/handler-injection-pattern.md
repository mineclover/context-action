# Handler Injection Pattern: 최신 값 주입을 통한 순수 비즈니스 로직

## 🎯 핵심 문제 정의

기존 React 애플리케이션에서 비즈니스 로직이 최신 상태에 접근할 때 발생하는 문제들:

```typescript
// ❌ 문제 1: 비즈니스 로직이 React Hook에 의존
function useCreateUser() {
  const [users, setUsers] = useState([]);

  const createUser = useCallback((newUser) => {
    // 비즈니스 로직이 React state에 직접 의존
    const existingEmails = users.map(u => u.email);
    if (existingEmails.includes(newUser.email)) {
      throw new Error('Email already exists');
    }

    setUsers(prev => [...prev, newUser]);
  }, [users]); // 의존성 배열 문제
}

// ❌ 문제 2: 최신 값 접근 어려움
const businessLogic = {
  validateUser: (userData) => {
    // 여기서 현재 사용자 목록에 어떻게 접근하지?
    // 전역 상태? Props 전달? Context 직접 접근?
  }
};

// ❌ 문제 3: 테스트 어려움
// 비즈니스 로직이 React ecosystem에 묶여있어 단위 테스트 복잡
```

## 🔄 Handler Injection Pattern 해결책

### 핵심 아이디어

**"핸들러가 컨텍스트 경계에서 최신 값을 주입받아 순수 비즈니스 로직에 전달"**

```typescript
// ✅ 해결책: 3단계 분리
// 1️⃣ 순수 비즈니스 로직 (사이드 이펙트 없음)
// 2️⃣ 핸들러 (최신 값 주입 + 사이드 이펙트)
// 3️⃣ 컨텍스트 등록 (useActionHandler로 등록)
```

## 📝 단계별 구현 방법

### 1단계: 순수 비즈니스 로직 함수 작성

```typescript
// business/userBusinessLogic.ts
/**
 * 완전히 순수한 함수 - 입력만으로 출력 결정
 * 사이드 이펙트 없음, React 의존성 없음
 */
export function createUserEntity(
  userData: { name: string; email: string; role: string },
  existingUsers: User[]  // 🔑 최신 사용자 목록을 매개변수로 받음
): UserOperationResult {
  // 1. 이메일 중복 검사
  const emailExists = existingUsers.some(user => user.email === userData.email);
  if (emailExists) {
    return {
      success: false,
      message: 'User with this email already exists',
    };
  }

  // 2. 데이터 검증
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return {
      success: false,
      message: `Validation failed: ${validation.errors.join(', ')}`,
    };
  }

  // 3. 새 사용자 엔티티 생성
  const newUser: User = {
    id: generateUserId(existingUsers),
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    role: userData.role,
    createdAt: new Date(),
  };

  return {
    success: true,
    message: 'User created successfully',
    user: newUser,
  };
}

export function updateUserEntity(
  userId: string,
  updates: Partial<User>,
  existingUsers: User[]  // 🔑 최신 사용자 목록
): UserOperationResult {
  const userIndex = existingUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }

  const currentUser = existingUsers[userIndex];

  // 이메일 업데이트 시 중복 검사
  if (updates.email && updates.email !== currentUser.email) {
    const emailExists = existingUsers.some(
      user => user.id !== userId && user.email === updates.email
    );
    if (emailExists) {
      return { success: false, message: 'Email already exists' };
    }
  }

  const updatedUser = { ...currentUser, ...updates };
  return { success: true, user: updatedUser };
}
```

### 2단계: Handler Injection Pattern 구현

```typescript
// handlers/UserManagementHandlers.tsx
export function UserManagementHandlers({
  moduleId,
  children,
  // 🔑 Props를 통한 의존성 주입
  usersStore,
  validationStore,
  operationStatusStore,
  apiClient,
  logger,
}: UserManagementHandlerProps) {

  // 🎯 Create User Handler with Injection
  const createUserHandler = useCallback(async (payload: {
    name: string;
    email: string;
    role: User['role'];
  }) => {
    logger?.info('Creating user', { payload });

    // 로딩 상태 시작
    operationStatusStore.setValue({
      isLoading: true,
      lastOperation: 'create',
      result: null,
    });

    try {
      // 🔑 핵심: Handler Injection - 최신 값을 store에서 가져옴
      const currentUsers = usersStore.getValue();

      // 🔑 핵심: 순수 비즈니스 로직 호출 (최신 값을 매개변수로 전달)
      const result = BusinessLogic.createUserEntity(payload, currentUsers);

      if (result.success && result.user) {
        // 🔑 사이드 이펙트: Store 업데이트
        const newUsers = [...currentUsers, result.user];
        usersStore.setValue(newUsers);

        // 🔑 사이드 이펙트: API 호출
        if (apiClient) {
          await apiClient.saveUser(result.user);
        }

        logger?.info('User created successfully', { user: result.user });
      }

      // 작업 완료 상태 업데이트
      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'create',
        result,
      });

      return result;
    } catch (error) {
      logger?.error('Failed to create user', error);

      operationStatusStore.setValue({
        isLoading: false,
        lastOperation: 'create',
        result: { success: false, message: 'Unexpected error occurred' },
      });

      throw error;
    }
  }, [
    usersStore,           // Store 의존성
    operationStatusStore, // Store 의존성
    apiClient,           // 서비스 의존성
    logger,              // 로깅 의존성
  ]);

  // 🎯 Update User Handler with Injection
  const updateUserHandler = useCallback(async (payload: {
    id: string;
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>;
  }) => {
    try {
      // 🔑 핵심: 최신 사용자 목록 주입
      const currentUsers = usersStore.getValue();

      // 🔑 핵심: 순수 비즈니스 로직 호출
      const result = BusinessLogic.updateUserEntity(
        payload.id,
        payload.updates,
        currentUsers
      );

      if (result.success && result.user) {
        // 🔑 사이드 이펙트: Store 업데이트
        const updatedUsers = currentUsers.map(user =>
          user.id === payload.id ? result.user! : user
        );
        usersStore.setValue(updatedUsers);

        // 🔑 사이드 이펙트: API 호출
        if (apiClient) {
          await apiClient.updateUser(payload.id, payload.updates);
        }
      }

      return result;
    } catch (error) {
      logger?.error('Failed to update user', error);
      throw error;
    }
  }, [usersStore, apiClient, logger]);

  // 🔑 핵심: useActionHandler로 컨텍스트 경계에서 핸들러 등록
  useUserManagementActionHandler('createUser', createUserHandler);
  useUserManagementActionHandler('updateUser', updateUserHandler);

  return <>{children}</>;
}
```

### 3단계: 컨텍스트 경계에서 의존성 주입

```typescript
// UserManagementExample.tsx - Integration Point
function UserManagementWithHandlers() {
  // 🎯 Store references 획득
  const { stores } = useUserManagementData();

  return (
    <UserManagementHandlers
      moduleId="user-management-demo"
      // 🔑 Store 의존성 주입
      usersStore={stores.usersStore}
      validationStore={stores.validationStore}
      operationStatusStore={stores.operationStatusStore}
      // 🔑 Service 의존성 주입
      apiClient={mockApiClient}
      logger={mockLogger}
      // 🔑 Callback 의존성 주입
      onUserCreated={(user) => console.log('🎉 User created:', user)}
      onUserUpdated={(user) => console.log('✏️ User updated:', user)}
      onUserDeleted={(user) => console.log('🗑️ User deleted:', user)}
    >
      <UserManagementUI />
    </UserManagementHandlers>
  );
}
```

## 🎯 패턴의 핵심 장점

### 1. 순수 함수의 테스트 용이성

```typescript
// ✅ 매우 쉬운 단위 테스트
describe('createUserEntity', () => {
  it('should reject duplicate email', () => {
    const existingUsers = [
      { id: 'user-1', email: 'john@test.com', name: 'John' }
    ];

    const result = createUserEntity(
      { name: 'Jane', email: 'john@test.com', role: 'user' },
      existingUsers  // 테스트 데이터 직접 전달
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('already exists');
  });

  it('should create user with unique email', () => {
    const existingUsers = [
      { id: 'user-1', email: 'john@test.com', name: 'John' }
    ];

    const result = createUserEntity(
      { name: 'Jane', email: 'jane@test.com', role: 'user' },
      existingUsers
    );

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('jane@test.com');
  });
});
```

### 2. 최신 값 접근 문제 해결

```typescript
// ❌ 기존 방식: 최신 값 접근 어려움
const oldHandler = useCallback((payload) => {
  // users 상태가 closure에 갇혀서 오래된 값일 수 있음
  const isDuplicate = users.some(u => u.email === payload.email);
}, [users]); // 의존성 배열 문제

// ✅ Handler Injection: 항상 최신 값 보장
const newHandler = useCallback((payload) => {
  // 매번 최신 값을 store에서 가져옴
  const latestUsers = usersStore.getValue();

  // 순수 함수에 최신 값 전달
  const result = createUserEntity(payload, latestUsers);
}, [usersStore]); // store 참조만 의존
```

### 3. 사이드 이펙트 격리

```typescript
// ✅ 명확한 관심사 분리
const handler = useCallback(async (payload) => {
  // 1️⃣ 최신 값 주입
  const currentState = store.getValue();

  // 2️⃣ 순수 비즈니스 로직 (테스트 가능)
  const result = pureBusinessLogic(payload, currentState);

  // 3️⃣ 사이드 이펙트 (핸들러에서만)
  if (result.success) {
    store.setValue(result.newState);    // Store 업데이트
    await api.save(result.data);        // API 호출
    analytics.track('user.created');    // 분석 추적
    onSuccess?.(result);                // 콜백 실행
  }
}, [store, api, analytics, onSuccess]);
```

## 🚀 실제 동작 시연

### 시나리오: 중복 이메일로 사용자 생성 시도

```typescript
// 1️⃣ 초기 상태: 기존 사용자 1명
const initialUsers = [
  { id: 'user-1', email: 'john@test.com', name: 'John Doe' }
];

// 2️⃣ 사용자가 중복 이메일로 새 사용자 생성 시도
const newUserData = {
  name: 'Jane Doe',
  email: 'john@test.com',  // 🔥 중복 이메일!
  role: 'user'
};

// 3️⃣ Handler Injection 동작 과정
const createUserHandler = async (payload) => {
  console.log('📝 Handler: Creating user', payload);

  // 🔑 핵심: 최신 사용자 목록 주입
  const currentUsers = usersStore.getValue();
  console.log('📊 Current users:', currentUsers);

  // 🔑 핵심: 순수 비즈니스 로직 실행
  const result = BusinessLogic.createUserEntity(payload, currentUsers);
  console.log('🧠 Business logic result:', result);

  // 결과: { success: false, message: 'User with this email already exists' }

  if (!result.success) {
    // 🔑 사이드 이펙트: 에러 상태 업데이트
    operationStatusStore.setValue({
      isLoading: false,
      lastOperation: 'create',
      result: result
    });
    console.log('❌ User creation failed:', result.message);
  }

  return result;
};
```

### 실제 콘솔 출력 예시

```bash
# 브라우저 콘솔에서 실제로 보이는 로그
📝 LOG: Creating user {payload: {name: "Jane Doe", email: "john@test.com", role: "user"}}
📊 Handler: Injected current users count: 1
🧠 Business Logic: Checking email duplication...
❌ Business Logic: Email john@test.com already exists
📝 LOG: User creation failed Validation failed: User with this email already exists
```

## 🔍 패턴 비교 분석

### 기존 4-Layer vs 5-Layer Handler Injection

```typescript
// ❌ 기존 4-Layer 방식
const useUserManagement = () => {
  const [users, setUsers] = useState([]);

  const createUser = useCallback((userData) => {
    // 비즈니스 로직이 React state와 강결합
    const emailExists = users.some(u => u.email === userData.email);
    if (emailExists) {
      throw new Error('Email exists');
    }

    const newUser = { ...userData, id: generateId() };
    setUsers(prev => [...prev, newUser]); // 사이드 이펙트

    return newUser;
  }, [users]); // 의존성 배열 문제

  return { users, createUser };
};

// ✅ 5-Layer Handler Injection 방식
// 1️⃣ 순수 비즈니스 로직
const createUserEntity = (userData, existingUsers) => {
  const emailExists = existingUsers.some(u => u.email === userData.email);
  if (emailExists) {
    return { success: false, message: 'Email exists' };
  }

  return {
    success: true,
    user: { ...userData, id: generateId() }
  };
};

// 2️⃣ 핸들러 (최신 값 주입 + 사이드 이펙트)
const createUserHandler = useCallback(async (payload) => {
  const currentUsers = usersStore.getValue(); // 최신 값 주입
  const result = createUserEntity(payload, currentUsers); // 순수 함수

  if (result.success) {
    usersStore.setValue([...currentUsers, result.user]); // 사이드 이펙트
  }

  return result;
}, [usersStore]);

// 3️⃣ 컨텍스트 등록
useActionHandler('createUser', createUserHandler);
```

## 🎯 핵심 혜택 요약

| 측면 | 기존 방식 | Handler Injection |
|------|-----------|-------------------|
| **비즈니스 로직** | React에 종속 | 완전히 순수함수 |
| **최신 값 접근** | closure/deps 문제 | store.getValue()로 보장 |
| **테스트** | React 환경 필요 | 순수 함수 단위 테스트 |
| **재사용성** | Context 종속 | 어디서든 재사용 가능 |
| **사이드 이펙트** | 로직과 혼재 | 핸들러에서 명확히 분리 |
| **디버깅** | 복잡한 의존성 추적 | 명확한 데이터 플로우 |

## 💡 실제 적용 팁

### 1. 점진적 마이그레이션
```typescript
// 기존 코드를 점진적으로 Handler Injection 패턴으로 변환
// Step 1: 비즈니스 로직 함수 분리
// Step 2: 핸들러에서 최신 값 주입
// Step 3: 순수 함수 호출로 변경
```

### 2. 복잡한 상태 의존성 처리
```typescript
const complexHandler = useCallback(async (payload) => {
  // 여러 store에서 최신 값 주입
  const users = usersStore.getValue();
  const settings = settingsStore.getValue();
  const permissions = permissionsStore.getValue();

  // 모든 최신 값을 순수 함수에 전달
  const result = complexBusinessLogic(payload, {
    users,
    settings,
    permissions
  });

  // 결과에 따라 여러 store 업데이트
  if (result.success) {
    usersStore.setValue(result.newUsers);
    settingsStore.setValue(result.newSettings);
  }
}, [usersStore, settingsStore, permissionsStore]);
```

이 Handler Injection Pattern은 Context-Action 프레임워크에서 **순수 비즈니스 로직**과 **최신 값 접근** 문제를 동시에 해결하는 혁신적인 패턴입니다.