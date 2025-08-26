# 범용 객체 컨텍스트 관리 패턴

Context-Action 프레임워크를 기반으로 한 표준화된 객체 관리 솔루션입니다. 단일 엔드포인트를 통해 객체의 생명주기를 체계적으로 관리하며, Document-Artifact 중심의 설계 철학을 구현합니다.

## 🎯 핵심 개념

### 1. 단일 엔드포인트 패턴
모든 객체 조작이 하나의 일관된 인터페이스를 통해 이루어집니다:
```typescript
const manager = new ObjectContextManager<MyObject>(config);

// 모든 작업이 동일한 패턴
await manager.register(id, object, metadata);
await manager.update(id, changes);
await manager.unregister(id);
```

### 2. 컨텍스트 기반 격리
각 객체 타입마다 독립적인 컨텍스트를 가집니다:
```typescript
// 사용자 관리 컨텍스트
const userContext = createObjectContextHooks<User>({
  contextName: 'UserManagement'
});

// Element 관리 컨텍스트  
const elementContext = createObjectContextHooks<DOMElement>({
  contextName: 'ElementManagement'
});
```

### 3. Document-Artifact 중심 관리
객체의 생명주기와 메타데이터를 체계적으로 관리:
- **생명주기 상태**: created → active → inactive → archived → deleted
- **메타데이터 관리**: 객체별 사용자 정의 정보
- **컨텍스트 메타데이터**: 컨텍스트별 추가 정보

## 🏗️ 아키텍처

### 계층 구조
```
ObjectContextManager (Core)
├── ActionRegister (액션 관리)
├── Map<string, T> (객체 저장)
├── Map<string, ObjectMetadata<T>> (메타데이터)
└── Event System (이벤트 발생)

createObjectContextHooks (React Integration)
├── ObjectContextStore (상태 관리)
├── ObjectContextActions (액션 디스패치)
├── ObjectContextManager (코어 연결)
└── Provider Components (컨텍스트 제공)
```

### Facade 패턴 적용
```typescript
// 세분화된 접근
const store = useObjectContextStore();
const actions = useObjectContextActions();

// 통합 인터페이스 (기존 호환성 유지)
const manager = useObjectManager(); // store + actions 통합
```

## 📋 주요 기능

### 1. 객체 생명주기 관리
```typescript
// 등록
await manager.register('user_1', userObject, metadata);

// 상태 변경
await manager.activate('user_1');
await manager.deactivate('user_1'); 
await manager.archive('user_1');

// 삭제
await manager.unregister('user_1');
```

### 2. 쿼리 시스템
```typescript
const results = manager.queryObjects({
  type: 'user',
  lifecycleState: ['active', 'inactive'],
  metadata: { department: 'engineering' },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 10
});
```

### 3. 선택 및 포커스 관리
```typescript
// 선택 관리
await manager.select(['user_1', 'user_2'], 'add');
await manager.clearSelection();

// 포커스 관리
await manager.focus('user_1');
await manager.clearFocus();
```

### 4. 자동 정리
```typescript
const config: ObjectContextConfig = {
  autoCleanup: {
    enabled: true,
    intervalMs: 600000, // 10분마다
    olderThanMs: 1800000, // 30분 이상
    lifecycleStates: ['inactive', 'archived']
  }
};
```

### 5. 이벤트 시스템
```typescript
manager.addEventListener('registered', (event) => {
  console.log(`객체 등록됨: ${event.objectId}`);
});

// React Hook
useObjectContextEvents('lifecycle_changed', (event) => {
  console.log(`상태 변경: ${event.objectId} -> ${event.metadata?.lifecycleState}`);
});
```

## 🚀 사용법

### 1. 기본 설정

```typescript
import { ManagedObject, createObjectContextHooks } from './object-context-manager';

// 객체 타입 정의
interface User extends ManagedObject {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// 컨텍스트 생성
const {
  ObjectContextProvider,
  useObjectManager,
  useObjectContextStore,
  useObjectContextActions
} = createObjectContextHooks<User>({
  contextName: 'UserManagement',
  enableSelection: true,
  enableFocus: true
});
```

### 2. React 컴포넌트에서 사용

```typescript
function UserComponent() {
  const { register, queryObjects, selectedObjects } = useObjectManager();
  
  const handleCreateUser = async () => {
    const user: User = {
      id: 'user_1',
      type: 'user',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: new Date()
    };
    
    await register(user.id, user, { source: 'form' });
  };
  
  const users = queryObjects({ 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });
  
  return (
    <div>
      <button onClick={handleCreateUser}>사용자 생성</button>
      <div>선택된 사용자: {selectedObjects.length}</div>
      {/* 사용자 목록 렌더링 */}
    </div>
  );
}

// Provider로 감싸기
function App() {
  return (
    <ObjectContextProvider>
      <UserComponent />
    </ObjectContextProvider>
  );
}
```

### 3. 세분화된 사용 (성능 최적화)

```typescript
// 읽기 전용 컴포넌트 (불필요한 액션 구독 제거)
function UserList() {
  const { queryObjects, getStats } = useObjectContextStore();
  // ...
}

// 액션 전용 컴포넌트 (불필요한 상태 구독 제거)  
function UserActions() {
  const { register, update, unregister } = useObjectContextActions();
  // ...
}
```

## 📁 예제

### 1. 사용자 관리 시스템
- 사용자 등록/수정/삭제
- 역할 기반 필터링
- 선택된 사용자 일괄 작업
- 실시간 이벤트 로그

실행: `UserManagementExample.tsx` 참조

### 2. Element 관리 마이그레이션
- 기존 element-management 패턴을 새로운 시스템으로 마이그레이션
- DOM Element 자동 등록
- 포커스 및 선택 관리
- Element 생명주기 추적

실행: `ElementManagementMigration.tsx` 참조

## 🔧 설정 옵션

```typescript
interface ObjectContextConfig {
  contextName: string;                    // 컨텍스트 이름 (필수)
  
  autoCleanup?: {
    enabled: boolean;                     // 자동 정리 활성화
    intervalMs: number;                   // 정리 주기 (ms)
    olderThanMs: number;                  // 정리 대상 나이 (ms)
    lifecycleStates?: ObjectLifecycleState[]; // 정리 대상 상태
  };
  
  maxObjects?: number;                    // 최대 객체 수
  enableSelection?: boolean;              // 선택 기능 활성화
  enableFocus?: boolean;                  // 포커스 기능 활성화
  persistState?: boolean;                 // 상태 영속화 (미구현)
}
```

## 🎯 장점

1. **표준화된 인터페이스**: 모든 객체 관리가 동일한 패턴
2. **타입 안전성**: TypeScript 완전 지원
3. **성능 최적화**: 필요한 기능만 구독 가능
4. **확장성**: 새로운 객체 타입 쉽게 추가
5. **이벤트 기반**: 반응형 UI 구현 용이
6. **자동 관리**: 메모리 누수 방지, 자동 정리
7. **호환성**: 기존 코드와의 점진적 마이그레이션

## 🔄 마이그레이션 전략

1. **Phase 1**: 새로운 패턴으로 컨텍스트 생성
2. **Phase 2**: Facade Hook을 통해 기존 인터페이스 유지
3. **Phase 3**: 성능이 중요한 부분부터 세분화된 Hook 적용
4. **Phase 4**: 점진적 마이그레이션 완료

이 패턴을 통해 Context-Action 프레임워크의 핵심 철학인 **Document-Artifact 중심 설계**와 **관심사 분리**를 구현하면서, 개발자 경험을 향상시키고 코드의 일관성을 보장할 수 있습니다.