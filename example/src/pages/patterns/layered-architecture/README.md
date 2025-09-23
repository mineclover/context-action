# 6-Layer Context Architecture Implementation

완성된 **6-Layer Context Architecture**는 순수 함수 비즈니스 로직과 핸들러 주입 패턴을 통해 사이드 이펙트를 해결하는 혁신적인 아키텍처 패턴입니다.

## 🎯 핵심 개념

### 기존 4-Layer vs 6-Layer 차이점

| 특징 | 4-Layer | 6-Layer |
|------|---------|---------|
| **비즈니스 로직** | 핸들러에 포함 | 순수 함수로 분리 |
| **사이드 이펙트** | 핸들러와 혼재 | 핸들러 주입으로 해결 |
| **테스트 용이성** | 중간 수준 | 매우 높음 |
| **최신 값 문제** | Context 의존 | Handler Injection으로 해결 |
| **레이어 구조** | contexts, handlers, actions, hooks | contexts, business, handlers, actions, hooks, views |

### Handler Injection Pattern (핵심 혁신)

```typescript
// 🔑 핵심 패턴: 핸들러가 컨텍스트에서 최신 값을 주입받아 순수 함수에 전달
const createUserHandler = useCallback(async (payload) => {
  // 1️⃣ Handler Injection: 최신 값을 store에서 가져옴
  const currentUsers = usersStore.getValue();

  // 2️⃣ Pure Business Logic: 순수 함수 실행
  const result = BusinessLogic.createUserEntity(payload, currentUsers);

  // 3️⃣ Side Effects: 핸들러에서 store 업데이트
  if (result.success && result.user) {
    usersStore.setValue([...currentUsers, result.user]);
    await apiClient.saveUser(result.user);
  }

  return result;
}, [usersStore, apiClient]);

// 4️⃣ Hook 내에서 액션 핸들러 등록
useUserManagementActionHandler('createUser', createUserHandler);
```

## 🏗️ 6-Layer Architecture Structure

```
📁 6-layer-architecture/
├── 📁 contexts/           # 🗄️ Context Definitions & Types
│   └── UserManagementContexts.ts    # 타입 정의와 컨텍스트 생성
├── 📁 business/           # 🧠 Pure Business Logic Functions
│   └── userBusinessLogic.ts         # 순수 비즈니스 로직 함수들
├── 📁 handlers/           # ⚙️ Handler Logic with Injection
│   └── UserManagementHandlers.tsx   # 핸들러 주입 패턴 구현
├── 📁 actions/            # 🚀 Action Dispatch & Callbacks
│   └── useUserManagementActions.ts  # 액션 디스패치 함수들
├── 📁 hooks/              # 🔗 Store Subscriptions
│   └── useUserManagementData.ts     # 스토어 구독 및 계산된 값
├── 📁 views/              # 🖼️ Pure UI Components
│   ├── UserListView.tsx             # 사용자 목록 UI
│   ├── UserFormView.tsx             # 사용자 폼 UI
│   └── UserStatsView.tsx            # 통계 UI
└── 📄 UserManagementExample.tsx     # 🎯 Integration Point
```

## 🔄 Complete Data Flow (6단계)

### 1. User Interaction → View Layer
```typescript
// views/UserFormView.tsx
<button onClick={() => onSubmit(formData)}>Create User</button>
```

### 2. Action Dispatch → Action Layer
```typescript
// actions/useUserManagementActions.ts
const createUser = useCallback(async (data) => {
  const result = await dispatch('createUser', data);
  return result;
}, [dispatch]);
```

### 3. Handler Injection → Handler Layer
```typescript
// handlers/UserManagementHandlers.tsx
useUserManagementActionHandler('createUser', async (payload) => {
  // 🔑 최신 값 주입
  const currentUsers = usersStore.getValue();

  // 순수 함수 호출
  const result = BusinessLogic.createUserEntity(payload, currentUsers);
  // ...
});
```

### 4. Pure Business Logic → Business Layer
```typescript
// business/userBusinessLogic.ts
export function createUserEntity(data, existingUsers) {
  // 완전히 순수한 함수 - 사이드 이펙트 없음
  const validation = validateUserData(data);
  if (!validation.isValid) {
    return { success: false, message: validation.errors.join(', ') };
  }

  const newUser = { id: generateUserId(existingUsers), ...data };
  return { success: true, user: newUser };
}
```

### 5. Side Effects → Handler Layer
```typescript
// handlers/UserManagementHandlers.tsx
if (result.success && result.user) {
  // Store 업데이트
  usersStore.setValue([...currentUsers, result.user]);

  // API 호출
  await apiClient.saveUser(result.user);

  // 콜백 실행
  onUserCreated?.(result.user);
}
```

### 6. Reactive Update → Hook Layer → View Layer
```typescript
// hooks/useUserManagementData.ts
const users = useStoreValue(usersStore);
const userStatistics = useMemo(() => {
  return BusinessLogic.calculateUserStatistics(users);
}, [users]);

// views/UserStatsView.tsx - 자동으로 업데이트됨
<StatCard title="Total Users" value={totalUsers} />
```

## 🎯 핵심 혁신 포인트

### 1. Pure Business Logic Separation
```typescript
// ✅ GOOD: 완전히 순수한 함수
export function createUserEntity(data, existingUsers) {
  // 입력만으로 출력 결정, 사이드 이펙트 없음
  const validation = validateUserData(data);
  // ...
  return { success: true, user: newUser };
}

// ❌ BAD: 사이드 이펙트가 포함된 함수
function createUser(data) {
  // store 접근, API 호출 등 사이드 이펙트
  const result = validateAndCreate(data);
  userStore.setValue(result);
  apiClient.save(result);
}
```

### 2. Handler Injection for Latest Values
```typescript
// 🔑 문제 해결: 최신 값에 접근하는 방법
const handler = useCallback(async (payload) => {
  // Handler Injection으로 최신 값 획득
  const latestValue = store.getValue();

  // 순수 함수에 최신 값과 payload 모두 전달
  const result = pureBusinessLogic(payload, latestValue);

  // 사이드 이펙트는 핸들러에서 처리
  if (result.success) {
    store.setValue(result.newValue);
  }
}, [store]);
```

### 3. Context-driven Dependency Injection
```typescript
// Integration Point에서 의존성 주입
<UserManagementHandlers
  moduleId="user-management-demo"
  usersStore={stores.usersStore}
  validationStore={stores.validationStore}
  operationStatusStore={stores.operationStatusStore}
  apiClient={mockApiClient}
  logger={mockLogger}
  onUserCreated={(user) => console.log('🎉 User created:', user)}
>
  <UserManagementUI />
</UserManagementHandlers>
```

## 🧪 Testing Benefits

### Business Logic Tests (매우 쉬움)
```typescript
describe('createUserEntity', () => {
  it('should create user with valid data', () => {
    const result = createUserEntity(
      { name: 'John', email: 'john@test.com', role: 'user' },
      []
    );

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('John');
  });
});
```

### Handler Tests (의존성 주입으로 격리)
```typescript
describe('createUserHandler', () => {
  it('should call business logic and update stores', async () => {
    const mockStore = createMockStore([]);
    const mockApi = { saveUser: jest.fn() };

    // Handler를 의존성과 함께 테스트
    const handler = createUserHandler({ store: mockStore, api: mockApi });
    await handler({ name: 'John', email: 'john@test.com' });

    expect(mockStore.setValue).toHaveBeenCalled();
    expect(mockApi.saveUser).toHaveBeenCalled();
  });
});
```

## ✨ 실제 동작 확인

브라우저에서 `/patterns/6-layer-architecture`에 접속하여 다음을 확인할 수 있습니다:

1. **Real-time Statistics**: 사용자 생성 시 즉시 통계 업데이트
2. **Role Distribution**: 역할별 분포 차트 자동 갱신
3. **Business Logic Logs**: 콘솔에서 각 단계별 로그 확인
4. **API Simulation**: Mock API 호출 시뮬레이션
5. **Error Handling**: 검증 실패 시 적절한 에러 표시

## 🚀 사용 방법

### 기본 사용법
```typescript
import SixLayerArchitecturePage from './6-layer-architecture/6LayerArchitecturePage';

// 단순히 컴포넌트 렌더링
<SixLayerArchitecturePage />
```

### 개별 레이어 활용
```typescript
import {
  useUserManagementActions,
  useUserManagementData,
  UserListView
} from './6-layer-architecture';

function CustomImplementation() {
  const { createUser } = useUserManagementActions();
  const { users, isLoading } = useUserManagementData();

  return (
    <UserListView
      users={users}
      isLoading={isLoading}
      onEditUser={(user) => console.log('Edit:', user)}
      onDeleteUser={(id) => console.log('Delete:', id)}
    />
  );
}
```

## 📈 성능과 확장성

### 성능 최적화
- **Memoized Computations**: 계산된 값들이 메모이제이션됨
- **Selective Updates**: 정확한 변경 감지로 불필요한 렌더링 방지
- **Pure Function Caching**: 순수 함수 결과를 안전하게 캐싱 가능

### 확장성
- **레이어별 독립 개발**: 각 레이어를 병렬로 개발 가능
- **비즈니스 로직 재사용**: 순수 함수는 다른 컨텍스트에서 재사용
- **테스트 격리**: 각 레이어를 독립적으로 테스트

## 🎯 언제 사용할까?

### ✅ 적합한 경우
- 복잡한 비즈니스 로직이 있는 애플리케이션
- 높은 테스트 커버리지가 필요한 프로젝트
- 여러 팀이 협업하는 대규모 개발
- 비즈니스 로직이 자주 변경되는 환경

### ⚠️ 과도할 수 있는 경우
- 단순한 CRUD 애플리케이션
- 프로토타이핑 단계
- 비즈니스 로직이 거의 없는 UI 위주 앱

이 6-Layer Context Architecture는 Context-Action 프레임워크의 가능성을 보여주는 혁신적인 패턴으로, 순수 함수 비즈니스 로직과 핸들러 주입을 통해 기존 아키텍처의 한계를 극복합니다.