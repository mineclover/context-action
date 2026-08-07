# 디스패치 접근 패턴

Context-Action 프레임워크에서 액션 디스패치 기능에 접근하는 두 가지 주요 방법: 등록 기반 접근과 훅 기반 접근입니다.

## Import
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## 필수 조건

타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

이 문서는 설정 가이드의 `AppActions` 패턴을 사용합니다:
- 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
- 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)  
- 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)

예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다:
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  refreshData: void;
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppDispatch,
  useActionHandler: useAppHandler,
  useActionDispatchWithResult: useAppDispatchWithResult,
  useActionRegister: useAppRegister
} = createActionContext<AppActions>('App');
```

## 훅 기반 디스패치 (권장)

React 애플리케이션에서 컴포넌트 내 디스패치 기능에 액세스하기 위해 `createActionContext`의 React 훅을 사용하세요. 이것이 React 애플리케이션에서 권장되는 방법입니다.

### 기본 훅 사용법

```typescript
function UserComponent() {
  const dispatch = useAppDispatch()
  
  const handleUpdate = () => {
    dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' })
  }
  
  return <button onClick={handleUpdate}>사용자 업데이트</button>
}
```

### 결과 수집이 있는 훅

```typescript
function UserProfile() {
  const { dispatch } = useAppDispatchWithResult()
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' })
      if (result.success) {
        console.log('사용자가 성공적으로 저장되었습니다')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={handleSave} disabled={loading}>
      {loading ? '저장 중...' : '사용자 저장'}
    </button>
  )
}
```

### 완전한 컴포넌트 구현

```typescript
function UserManagement() {
  const dispatch = useAppDispatch()
  
  const updateProfile = (data: { name: string; email: string }) => {
    // 완전히 타입 안전한 디스패치
    dispatch('updateUser', { id: '123', ...data })
  }
  
  const deleteAccount = () => {
    dispatch('deleteUser', { id: '123' })
  }
  
  const refreshData = () => {
    dispatch('refreshData')  // void 액션에는 페이로드 불필요
  }
  
  return (
    <div>
      <button onClick={() => updateProfile({ name: 'John', email: 'john@example.com' })}>
        프로필 업데이트
      </button>
      <button onClick={deleteAccount}>계정 삭제</button>
      <button onClick={refreshData}>새로 고침</button>
    </div>
  )
}
```

## 등록 기반 디스패치

React 애플리케이션 내에서 고급 사용 사례를 위해 React 컨텍스트를 통해 ActionRegister 인스턴스에 액세스합니다.

### 등록 접근을 사용한 고급 디스패치

```typescript
function AdvancedDispatchComponent() {
  const register = useAppRegister()  // createActionContext에서
  
  const handleAdvancedDispatch = async () => {
    if (!register) return
    
    // 자세한 결과 정보와 함께 디스패치
    const result = await register.dispatchWithResult('updateUser', {
      id: '123', 
      name: 'John', 
      email: 'john@example.com'
    })

    if (result.success) {
      console.log('실행 세부사항:', {
        duration: result.execution.duration,
        handlersExecuted: result.execution.handlersExecuted,
        results: result.results
      })
    } else {
      console.error('액션 실패:', result.error)
    }
  }
  
  return <button onClick={handleAdvancedDispatch}>고급 디스패치</button>
}
```

## 등록 접근을 사용한 React 통합

필요할 때 React 컴포넌트 내에서 기본 등록 인스턴스에 액세스합니다.

### 컨텍스트 생성 useActionRegister 훅 사용

```typescript
function AdvancedComponent() {
  const register = useAppRegister()  // createActionContext에서
  
  const handleComplexOperation = async () => {
    if (!register) return
    
    // 고급 작업을 위한 직접 등록 접근
    const result = await register.dispatchWithResult('updateUser', {
      id: '123', 
      name: 'John', 
      email: 'john@example.com'
    }, {
      executionMode: 'parallel',
      filter: {
        handlerIds: ['critical-handler'],
        excludeHandlerIds: ['analytics-handler']
      }
    })
    
    console.log('고급 결과:', result)
  }
  
  return <button onClick={handleComplexOperation}>복잡한 작업</button>
}
```

### 등록 정보 접근

```typescript
function DebugPanel() {
  const register = useAppRegister()  // createActionContext에서
  
  const showRegistryInfo = () => {
    if (!register) return
    
    const info = register.getRegistryInfo()
    console.log('레지스트리 정보:', {
      name: info.name,
      totalActions: info.totalActions,
      totalHandlers: info.totalHandlers,
      registeredActions: info.registeredActions
    })
  }
  
  return <button onClick={showRegistryInfo}>레지스트리 정보 표시</button>
}
```

## 비교: 훅 vs 등록

### 훅 기반 디스패치 (권장)

**장점:**
- 자동 컨텍스트 관리를 갖춘 React에 최적화
- 보일러플레이트가 적은 더 깔끔한 컴포넌트 코드
- 자동 프로바이더 의존성 주입
- 우수한 TypeScript 통합으로 타입 안전
- React 패턴과 규칙을 따름

**단점:**
- React 전용, React 컴포넌트 외부에서 사용 불가
- 고급 디스패치 옵션에 대한 제어 제한
- React 컨텍스트 설정 필요

**사용 사례:**
- 표준 React 컴포넌트 상호작용
- 폼 제출 및 사용자 이벤트
- 컴포넌트 레벨 비즈니스 로직
- 대부분의 React 애플리케이션 시나리오

### 등록 기반 디스패치

**장점:**
- 프레임워크에 구애받지 않음, 모든 JavaScript 환경에서 작동
- 디스패치 옵션과 구성에 대한 완전한 제어
- 모든 ActionRegister 기능에 직접 접근
- 고급 디버깅 및 모니터링 기능
- 유틸리티 함수 및 서비스에 적합

**단점:**
- 더 장황한 설정 및 사용법
- 수동 의존성 관리
- 명시적인 등록 인스턴스 전달 필요
- 더 복잡한 에러 처리

**사용 사례:**
- React 컴포넌트 내에서 고급 디스패치 구성
- 테스트 및 디버깅 시나리오  
- 등록 메타데이터가 필요한 복잡한 비즈니스 로직
- React 컨텍스트 내에서 서비스 레이어 구현

## 모범 사례

### 훅을 사용할 때

```typescript
// ✅ 표준 컴포넌트 상호작용
function UserForm() {
  const dispatch = useAppDispatch()
  
  const handleSubmit = (formData) => {
    dispatch('updateUser', formData)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### 등록을 사용할 때

```typescript
// ✅ React 컨텍스트 내에서 서비스 레이어
function UserManagement() {
  const register = useAppRegister()
  
  const batchUpdateUsers = async (users: User[]) => {
    if (!register) return []
    
    const results = await Promise.all(
      users.map(user => 
        register.dispatchWithResult('updateUser', user, {
          executionMode: 'parallel',
          timeout: 10000
        })
      )
    )
    
    return results.filter(r => r.success)
  }
  
  return <button onClick={() => batchUpdateUsers(selectedUsers)}>일괄 업데이트</button>
}
```

### 하이브리드 접근법

```typescript
// ✅ 컴포넌트는 훅 디스패치와 복잡한 작업용 등록을 모두 사용
function UserManagement() {
  const dispatch = useAppDispatch()  // createActionContext에서
  const register = useAppRegister()  // createActionContext에서
  
  const handleBatchUpdate = async () => {
    if (!register) return
    
    // 복잡한 일괄 작업에 등록 사용
    const results = await Promise.all(
      selectedUsers.map(user => 
        register.dispatchWithResult('updateUser', user, {
          executionMode: 'parallel',
          timeout: 10000
        })
      )
    )
    
    // 간단한 알림 액션에 훅 디스패치 사용
    dispatch('refreshData')
  }
  
  return <button onClick={handleBatchUpdate}>일괄 업데이트</button>
}
```

## 에러 처리 패턴

### 훅 에러 처리

```typescript
function SafeComponent() {
  const dispatch = useAppDispatch()  // createActionContext에서
  
  const handleAction = async () => {
    try {
      await dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' })
    } catch (error) {
      // 디스패치 에러 처리 - AppActions에 존재하는 액션 사용
      console.error('액션 실패:', error.message)
    }
  }
  
  return <button onClick={handleAction}>안전한 액션</button>
}
```

### 등록 에러 처리

```typescript
function ComponentWithRegisterErrorHandling() {
  const register = useAppRegister()  // createActionContext에서
  
  const handleWithRegister = async () => {
    if (!register) return
    
    try {
      const result = await register.dispatchWithResult('updateUser', {
        id: '123', 
        name: 'John', 
        email: 'john@example.com'
      })
      
      if (!result.success) {
        console.error('액션 실패:', result.error)
        // 특정 실패 시나리오 처리
        return { success: false, error: result.error }
      }
      
      return { success: true, data: result.results }
    } catch (error) {
      console.error('예상치 못한 에러:', error)
      throw error
    }
  }
  
  return <button onClick={handleWithRegister}>등록으로 처리</button>
}
```

## 실제 예제

- [Todo 리스트 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - 훅 기반 디스패치 패턴
- [채팅 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - 훅과 등록 혼합 사용
- [사용자 프로필 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - 고급 디스패치 패턴

## 관련 패턴

- [디스패치 패턴](./dispatch-patterns.md) - 기본 디스패칭 기법
- [등록 패턴](./register-patterns.md) - 핸들러 등록 패턴
- [액션 기본 사용법](./basic-usage.md) - 기본 액션 개념
- [타입 시스템](./type-system.md) - TypeScript 통합
