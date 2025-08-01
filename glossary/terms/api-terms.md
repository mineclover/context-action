# API Terms

Technical implementation and API concepts for the Context-Action framework.

## ActionRegister

**Definition**: The core class that manages action pipelines, handler registration, and provides type-safe action dispatch functionality.


**Usage Context**:
- Central action management system
- Business logic orchestration
- Type-safe action dispatch
- Handler lifecycle management

**Key Features**:
- Generic type support for action payload maps
- Priority-based handler execution
- Event emission for monitoring
- Configurable logging and debugging
- Pipeline flow control


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Payload Map](./core-concepts.md#action-payload-map)

---

## StoreProvider

**Definition**: A React context provider that manages store instances and provides them to child components through the React context system.


**Usage Context**:
- Application root setup
- Store dependency injection
- React context pattern implementation
- Store lifecycle management

**Key Features**:
- Centralized store management
- Context-based dependency injection
- Store instance lifecycle control
- Integration with React component tree


**Related Terms**: [ActionProvider](#actionprovider), [Store Registry](./core-concepts.md#store-registry), [Store Hooks](#store-hooks)

---

## ActionProvider

**Definition**: A React context provider that manages action registration and dispatch functionality within the React component tree.


**Usage Context**:
- Action handler registration context
- Action dispatch accessibility
- Component lifecycle integration
- Handler cleanup management

**Key Features**:
- Action dispatch context provision
- Handler registration lifecycle
- Automatic cleanup on unmount
- Integration with store providers


**Related Terms**: [StoreProvider](#storeprovider), [Action Dispatcher](#action-dispatcher), [useActionDispatch](#useactiondispatch)

---

## Store Hooks

**Definition**: React hooks that provide reactive access to store values and enable components to subscribe to store changes.


**Usage Context**:
- Component-store integration
- Reactive UI updates
- Store value subscription
- Performance optimization

**Available Hooks**:
- `useStoreValue`: Subscribe to store value with optional selector
- `useStore`: Full store access with value and setter
- `useComputedStore`: Subscribe to computed/derived values
- `usePersistedStore`: Store with persistence integration
- `useDynamicStore`: Dynamic store creation and management


**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Computed Store](#computed-store), [Selective Subscription](#selective-subscription)

---

## Cross-Store Coordination

**Definition**: A pattern for coordinating actions across multiple stores within a single action handler, enabling complex business logic that spans multiple data domains.


**Usage Context**:
- Complex business operations
- Multi-domain data updates
- Transaction-like behavior
- Data consistency maintenance

**Key Patterns**:
- Read from multiple stores before processing
- Validate constraints across stores
- Update multiple stores atomically
- Rollback on failures


**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Action Handler](./core-concepts.md#action-handler), [Atomic Updates](#atomic-updates)

---

## Async Operations

**Definition**: Asynchronous operations within action handlers that handle external API calls, database operations, and other non-blocking tasks while maintaining proper error handling and state management.


**Usage Context**:
- External API integration
- Database operations
- File system operations
- Time-delayed operations

**Key Features**:
- Proper error handling and rollback
- Loading state management
- Timeout and cancellation support
- Progress tracking capabilities


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Error Handling](#error-handling), [Loading States](#loading-states)

---

## Action Dispatcher

**Definition**: A type-safe function interface that enables dispatching actions with proper payload validation and type checking.


**Usage Context**:
- Component action dispatch
- Type-safe action invocation
- Business logic triggering
- User interaction handling

**Key Features**:
- Overloaded for actions with and without payloads
- Compile-time type checking
- Async operation support
- Error propagation


**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Type Safety](./architecture-terms.md#type-safety), [useActionDispatch](#useactiondispatch)

---

## Priority-based Execution

**Definition**: A handler execution strategy where action handlers are executed in order of their assigned priority values, with higher priorities running first.


**Usage Context**:
- Handler execution order control
- Dependency management between handlers
- Critical operation prioritization
- Validation and preprocessing

**Key Features**:
- Numeric priority values (higher = first)
- Automatic sorting on registration
- Support for negative priorities
- Consistent execution order


**Related Terms**: [Handler Configuration](./core-concepts.md#handler-configuration), [Action Handler](./core-concepts.md#action-handler), [Pipeline Execution](#pipeline-execution)

---

## Computed Store

**Definition**: A reactive store that derives its value from one or more source stores, automatically updating when dependencies change.


**Usage Context**:
- Derived state calculation
- Performance optimization
- Complex data transformations
- Reactive computations

**Key Features**:
- Automatic dependency tracking
- Lazy computation
- Memoization for performance
- Multiple source store support


**Related Terms**: [Store Hooks](#store-hooks), [Reactive Updates](#reactive-updates), [Performance Optimization](#performance-optimization)

---

## Pipeline Context

**Definition**: Internal execution context that maintains state during action pipeline processing, including current payload, handler queue, and execution status.


**Usage Context**:
- Internal pipeline execution
- Handler coordination
- Execution state tracking
- Error handling and recovery

**Key Properties**:
- `action`: The action name being executed
- `payload`: Current payload (may be modified during execution)
- `handlers`: Array of registered handlers for the action
- `aborted`: Whether pipeline execution was aborted
- `abortReason`: Reason for abortion if applicable
- `currentIndex`: Current handler being executed


**Related Terms**: [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Handler Execution](#handler-execution)

---

## Selective Subscription

**Definition**: A pattern that allows components to subscribe to specific parts of store state, enabling optimized re-rendering by only updating when the selected values change.

**Usage Context**:
- Performance optimization in React components
- Minimizing unnecessary re-renders
- Fine-grained state subscription
- Efficient data access patterns

**Key Features**:
- Selector functions for specific data extraction
- Automatic dependency tracking
- Shallow comparison of selected values
- Multiple selector support for complex data needs

**Implementation Examples**:
- `useStoreValue(store, selector)` - Single value selection
- `useStoreValues(store, selectorMap)` - Multiple value selection
- Computed stores with selective dependencies

**Related Terms**: [Store Hooks](#store-hooks), [Performance Optimization](#performance-optimization), [Reactive Updates](#reactive-updates)

---

## useActionDispatch

**Definition**: 액션 디스패치 함수를 반환하는 React Hook으로, 컴포넌트에서 타입 안전한 액션 발생을 위해 사용.

**Usage Context**:
- React 컴포넌트 내에서 액션 발생
- 사용자 인터랙션 처리
- 비즈니스 로직 트리거
- 이벤트 핸들러 구현

**Key Features**:
- 타입 안전한 액션 디스패치
- ActionProvider 컨텍스트 내에서만 사용 가능
- 제네릭 타입 지원으로 완전한 타입 추론
- 오버로드된 함수 시그니처 (payload 있음/없음)

**Implementation Details**:
- ActionContext를 통해 dispatch 함수 접근
- 컴파일 타임 타입 검증
- 런타임 payload 검증 지원
- 비동기 액션 처리 지원

**Related Terms**: [ActionProvider](#actionprovider), [Action Dispatcher](#action-dispatcher), [Action Payload Map](./core-concepts.md#action-payload-map)

---

## useActionRegister

**Definition**: ActionRegister 인스턴스에 직접 접근할 수 있는 React Hook으로, 핸들러 등록 및 관리를 위해 사용.

**Usage Context**:
- 액션 핸들러 등록 및 해제
- 동적 핸들러 관리
- 파이프라인 모니터링
- 개발 도구 및 디버깅

**Key Features**:
- ActionRegister 인스턴스 직접 접근
- 핸들러 등록/해제 라이프사이클 관리
- 이벤트 리스너 등록 지원
- 메트릭 및 모니터링 기능 접근

**Best Practices**:
- useEffect 내에서 핸들러 등록
- 컴포넌트 언마운트 시 자동 정리
- 의존성 배열을 통한 재등록 제어
- Store Registry와 함께 사용하여 상태 접근

**Related Terms**: [ActionProvider](#actionprovider), [ActionRegister](./core-concepts.md#actionregister), [Action Handler](./core-concepts.md#action-handler)

---

## Store Integration Pattern

**Definition**: Store 클래스의 핵심 상태 관리 패턴으로, 중앙화된 상태와 구독 시스템을 제공.

**Usage Context**:
- 애플리케이션 상태 관리
- React 컴포넌트와 상태 동기화
- 액션 핸들러에서 상태 접근
- 불변성 보장 및 성능 최적화

**Core Components**:
- **State Storage (_value)**: 실제 데이터 저장소 (Single Source of Truth)
- **Subscription Management (listeners)**: React 컴포넌트들의 구독 추적 시스템
- **Snapshot Management (_snapshot)**: 불변성과 최적화를 위한 스냅샷 관리
- **Change Notification (_notifyListeners)**: 상태 변경 시 구독자들에게 알림

**Key Characteristics**:
- Set을 사용한 중복 방지와 O(1) 삭제 보장
- Object.is()를 통한 참조 동등성 검사로 불필요한 리렌더링 방지
- React의 useSyncExternalStore와 완벽 호환
- 자동 메모리 관리 및 구독 정리

**Related Terms**: [Store Registry](./core-concepts.md#store-registry), [Store Hooks](#store-hooks), [Reactive Updates](#reactive-updates)

---

## Store Factory Functions

**Definition**: Store 인스턴스 생성을 위한 팩토리 함수들로, 타입 안전하고 간편한 Store 생성을 제공.

**Usage Context**:
- Store 인스턴스 생성
- 레지스트리 자동 등록
- 개발 편의성 향상
- 타입 안전성 보장

**Available Functions**:
- **createStore<T>**: 기본 Store 인스턴스 생성
- **createManagedStore<T>**: 레지스트리 자동 등록 기능이 있는 Store 생성
- **createBasicStore**: 간단한 설정으로 Store 생성
- **createComputedStore**: 계산된 값을 위한 Store 생성

**Key Features**:
- 완전한 TypeScript 제네릭 지원
- 자동 타입 추론
- 설정 가능한 초기값
- 선택적 레지스트리 등록

**Related Terms**: [Store Integration Pattern](#store-integration-pattern), [Store Registry](./core-concepts.md#store-registry), [Managed Store](#managed-store)

---

## Managed Store

**Definition**: 자동 레지스트리 등록 기능을 갖춘 향상된 Store 클래스로, 라이프사이클 관리를 자동화.

**Usage Context**:
- 애플리케이션 레벨 상태 관리
- 자동 Store 등록 및 해제
- 메모리 누수 방지
- Store 라이프사이클 관리

**Key Features**:
- 기본 Store 기능 상속
- 자동 레지스트리 등록/해제
- 설정 가능한 자동 등록 옵션
- dispose() 메서드를 통한 안전한 정리

**Configuration Options**:
- `name`: Store 식별자
- `initialValue`: 초기값
- `registry`: 대상 StoreRegistry 인스턴스
- `autoRegister`: 자동 등록 여부 (기본값: true)

**Related Terms**: [Store Integration Pattern](#store-integration-pattern), [Store Registry](./core-concepts.md#store-registry), [Store Factory Functions](#store-factory-functions)

---

## Jotai Integration

**Definition**: Jotai 상태 관리 라이브러리와 Context-Action 프레임워크를 통합하는 유틸리티 시스템.

**Usage Context**:
- Jotai atom을 Context로 공유
- React 컴포넌트 트리에서 atom 접근
- 선택적 구독 및 파생 상태 관리
- Context-Action과 Jotai 하이브리드 사용

**Core Functions**:
- **createAtomContext<T>**: atom을 Context로 공유할 수 있는 헬퍼 함수
- **Provider**: React Context Provider 컴포넌트
- **useAtomState**: atom 값과 setter를 모두 반환하는 hook
- **useAtomReadOnly**: atom 값만 반환하는 읽기 전용 hook
- **useAtomSelect**: 파생 값을 선택하는 hook
- **useAtomSetter**: atom setter만 반환하는 hook

**Key Features**:
- 완전한 TypeScript 지원
- 자동 로거 통합
- 환경 변수 기반 로그 레벨 설정
- useMemo를 통한 파생 atom 최적화

**Related Terms**: [Store Integration Pattern](#store-integration-pattern), [Selective Subscription](#selective-subscription), [Context Integration](#context-integration)