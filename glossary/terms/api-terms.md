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

**Definition**: Store 인스턴스들을 관리하고 React context 시스템을 통해 자식 컴포넌트들에게 제공하는 React context provider입니다.

**Usage Context**:
- 애플리케이션 루트 설정 및 초기화
- Store 의존성 주입 및 관리
- React context 패턴 구현의 핵심
- Store 생명주기 관리 및 제어
- Provider 패턴과 HOC 패턴 지원

**Key Features**:
- 중앙화된 Store 관리 (StoreRegistry 기반)
- Context 기반 의존성 주입 시스템
- Store 인스턴스 생명주기 제어 (useRef 기반 싱글톤)
- React 컴포넌트 트리와의 완전한 통합
- 선택적 registry prop으로 커스텀 StoreRegistry 지원

**Implementation**: StoreProvider 컴포넌트로 구현되며, StoreContext를 통해 StoreRegistry 인스턴스를 하위 컴포넌트에 제공하고 useStoreContext 훅으로 접근합니다.

**Related Terms**: [ActionProvider](#actionprovider), [Store Registry](./core-concepts.md#store-registry), [Store Hooks](#store-hooks), [Context Store Pattern](./architecture-terms.md#context-store-pattern)

---

## ActionProvider

**Definition**: React 컴포넌트 트리 내에서 액션 등록 및 디스패치 기능을 관리하는 React context provider입니다.

**Usage Context**:
- 액션 핸들러 등록 컨텍스트 제공
- 액션 디스패치 접근성 보장
- 컴포넌트 생명주기와의 통합
- 핸들러 정리 관리 및 자동 정리
- MVVM 패턴의 ViewModel 레이어 구현

**Key Features**:
- 액션 디스패치 컨텍스트 제공 (ActionContext)
- 핸들러 등록 생명주기 관리
- 언마운트 시 자동 정리 (useRef 기반)
- Store provider와의 통합 지원
- ActionRegisterConfig를 통한 설정 가능
- 타입 안전한 액션 디스패치 시스템

**Implementation**: ActionProvider 컴포넌트로 구현되며, ActionContext를 통해 ActionRegister 인스턴스와 dispatch 함수를 제공하고 useActionContext 훅으로 접근합니다.

**Related Terms**: [StoreProvider](#storeprovider), [Action Dispatcher](#action-dispatcher), [useActionDispatch](#useactiondispatch), [ActionRegister](./core-concepts.md#actionregister)

---

## Store Hooks

**Definition**: Store 값에 대한 반응형 접근을 제공하고 컴포넌트가 Store 변경 사항을 구독할 수 있게 하는 React hooks입니다.

**Usage Context**:
- 컴포넌트-Store 통합 및 데이터 바인딩
- 반응형 UI 업데이트 및 상태 동기화
- Store 값 구독 및 선택적 리렌더링
- 성능 최적화 및 메모리 관리
- MVVM 패턴의 View 레이어 구현

**Available Hooks**:
- `useStoreValue`: Store 값 구독 및 선택적 셀렉터 지원
- `useStoreActions`: Store 액션 메서드 (setValue, update) 제공
- `useRegistryStore`: Registry를 통한 Store 접근 및 생성
- `useRegistry`: StoreRegistry 인스턴스 접근
- `useLocalStore`: 로컬 Store 생성 및 관리

**Key Features**:
- 자동 구독 관리 및 언마운트 시 정리
- 선택적 리렌더링 (useStoreSelector 기반)
- 타입 안전한 Store 접근 및 셀렉터 지원
- useSyncExternalStore 기반 최적화된 구독

**Implementation**: useStoreSelector를 기반으로 구현되며, IStore 인터페이스와 통합되어 타입 안전성과 성능 최적화를 보장합니다.

**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Computed Store](#computed-store), [Selective Subscription](#selective-subscription), [StoreProvider](#storeprovider)

---

## Cross-Store Coordination

**Definition**: 단일 액션 핸들러 내에서 여러 Store 간의 액션을 조정하는 패턴으로, 여러 데이터 도메인에 걸친 복잡한 비즈니스 로직을 가능하게 합니다.

**Usage Context**:
- 복잡한 비즈니스 연산 및 워크플로우 구현
- 다중 도메인 데이터 업데이트 및 동기화
- 트랜잭션과 유사한 동작 구현
- 데이터 일관성 유지 및 무결성 보장
- 도메인 간 의존성 관리

**Key Patterns**:
- 처리 전 여러 Store에서 데이터 읽기 (getValue 패턴)
- Store 간 제약 조건 유효성 검증
- 여러 Store를 원자적으로 업데이트
- 실패 시 롤백 및 상태 복구
- Store registry를 통한 통합 접근

**Implementation Strategies**:
- **Sequential Updates**: 의존성 순서에 따른 순차 업데이트
- **Batch Operations**: 모든 업데이트를 그룹화하여 처리
- **Compensation Patterns**: 실패 시 이전 상태로 복구
- **Event Coordination**: Store 변경 간 이벤트 기반 조정

**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Action Handler](./core-concepts.md#action-handler), [Atomic Updates](#atomic-updates), [Store Registry](./core-concepts.md#store-registry)

---

## Async Operations

**Definition**: 액션 핸들러 내에서 외부 API 호출, 데이터베이스 작업 및 기타 비차단 작업을 처리하는 비동기 연산으로, 적절한 오류 처리와 상태 관리를 유지합니다.

**Usage Context**:
- 외부 API 통합 및 데이터 페칭
- 데이터베이스 연산 및 트랜잭션
- 파일 시스템 작업 및 I/O 처리
- 시간 지연 작업 및 타이머
- 비동기 비즈니스 로직 처리

**Key Features**:
- 적절한 오류 처리 및 롤백 메커니즘
- 로딩 상태 관리 및 진행 상황 추적
- 타임아웃 및 취소 지원
- Promise<void> 반환 타입 지원
- Pipeline Controller를 통한 흐름 제어

**Implementation**: ActionHandler의 Promise<void> 반환 타입과 blocking 설정을 통해 비동기 완료 대기를 제어할 수 있습니다.

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Handler Configuration](./core-concepts.md#handler-configuration), [Pipeline Controller](./core-concepts.md#pipeline-controller)

---

## Action Dispatcher

**Definition**: 적절한 페이로드 유효성 검증과 타입 검사를 통해 액션을 디스패치할 수 있게 하는 타입 안전한 함수 인터페이스입니다.

**Usage Context**:
- 컴포넌트 액션 디스패치 및 이벤트 처리
- 타입 안전한 액션 호출 및 실행
- 비즈니스 로직 트리거 및 워크플로우 시작
- 사용자 상호작용 처리 및 UI 이벤트
- MVVM 패턴의 View에서 ViewModel로의 호출

**Key Features**:
- 페이로드 유무에 따른 오버로드 지원
- 컴파일 타임 타입 검사 및 유효성 검증
- 비동기 연산 지원 (Promise 반환)
- 오류 전파 및 예외 처리
- ActionPayloadMap 기반 타입 안전성

**Implementation**: ActionDispatcher<T> 타입으로 정의되며, ActionRegister의 dispatch 메서드를 래핑하여 타입 안전성을 보장합니다.

**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Type Safety](./architecture-terms.md#type-safety), [useActionDispatch](#useactiondispatch), [ActionRegister](./core-concepts.md#actionregister)

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

---

## Logger Factory

**Definition**: Factory function for creating appropriately configured logger instances with automatic environment detection and optimal logger selection.

**Usage Context**:
- Logger instance creation
- Environment-based configuration
- Development and production optimization
- Cross-platform logging setup

**Key Features**:
- Environment variable detection
- Automatic log level configuration
- Smart logger selection (Console vs NoOp)
- Cross-platform compatibility

**Related Terms**: [Logger System](./core-concepts.md#logger-system), [Environment Configuration](#environment-configuration)

---

## Smart Logger Creation

**Definition**: Intelligent logger creation process that automatically detects appropriate configuration from environment variables and application context.

**Usage Context**:
- Automatic logger configuration
- Environment-aware logging
- Development vs production setup
- Framework initialization

**Key Features**:
- NODE_ENV detection
- Environment variable parsing
- Fallback configuration
- Performance optimization

**Related Terms**: [Logger Factory](#logger-factory), [Environment Configuration](#environment-configuration)

---

## Atom Context Config

**Definition**: Configuration options for Jotai atom context creation with logging support and behavior customization.

**Usage Context**:
- Atom context customization
- Logger configuration for atoms
- Development debugging
- Performance tuning

**Key Features**:
- Custom logger implementation
- Log level configuration
- Atom behavior customization
- TypeScript type safety

**Related Terms**: [Jotai Integration](#jotai-integration), [Logger System](./core-concepts.md#logger-system)

---

## Atom Provider

**Definition**: React Context Provider component for Jotai atoms that provides atom instance and logger to child components within the context tree.

**Usage Context**:
- Atom context sharing
- Component tree isolation
- Atom lifecycle management
- Context-based dependency injection

**Key Features**:
- Isolated atom instances per provider
- Automatic cleanup
- Logger integration
- TypeScript support

**Related Terms**: [Jotai Integration](#jotai-integration), [Context Integration](#context-integration)

---

## useAtomState

**Definition**: Primary hook for full Jotai atom state management, returning both current value and setter function for state updates.

**Usage Context**:
- Full atom state control
- Component state management
- User input handling
- State updates with validation

**Key Features**:
- Read and write access
- TypeScript type safety
- Logger integration
- Performance optimization

**Related Terms**: [Jotai Integration](#jotai-integration), [useAtomReadOnly](#useatomreadonly)

---

## useAtomReadOnly

**Definition**: Performance-optimized hook for read-only access to Jotai atom value, ideal for display components that don't need to update state.

**Usage Context**:
- Display components
- Read-only data access
- Performance optimization
- Component isolation

**Key Features**:
- Read-only access
- No re-render on setter changes
- Performance optimized
- TypeScript support

**Related Terms**: [useAtomState](#useatomstate), [useAtomSelect](#useatomselect)

---

## useAtomSelect

**Definition**: Performance optimization hook that creates derived atoms for selective subscriptions, minimizing re-renders by subscribing only to specific parts of the atom state.

**Usage Context**:
- Selective subscriptions
- Performance optimization
- Derived state management
- Component re-render minimization

**Key Features**:
- Derived atom creation
- Selective subscriptions
- Memoization
- TypeScript support

**Related Terms**: [Selective Subscription](#selective-subscription), [useAtomState](#useatomstate)

---

## useAtomSetter

**Definition**: Write-only hook for Jotai atoms that returns only the setter function, avoiding unnecessary re-renders for components that update state but don't need to subscribe to value changes.

**Usage Context**:
- Write-only operations
- Action buttons
- Form submissions
- Performance optimization

**Key Features**:
- Write-only access
- No value subscriptions
- Performance optimized
- TypeScript support

**Related Terms**: [useAtomState](#useatomstate), [Performance Optimization](#performance-optimization)

---

## ActionRegister Configuration

**Definition**: Configuration options for ActionRegister instances, including logging setup, debugging options, and default execution behavior.

**Usage Context**:
- ActionRegister initialization
- Framework configuration
- Development debugging
- Production optimization

**Key Features**:
- Logger configuration
- Debug mode settings
- Execution mode defaults
- Environment integration

**Related Terms**: [ActionRegister](./core-concepts.md#actionregister), [Logger System](./core-concepts.md#logger-system)

---

## Cleanup Function

**Definition**: Function type for unregistering action handlers from the pipeline, returned by the register method to provide cleanup capability.

**Usage Context**:
- Handler cleanup
- Memory management
- Component unmounting
- Lifecycle management

**Key Features**:
- Automatic cleanup
- Memory leak prevention
- TypeScript support
- Simple invocation

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [ActionRegister](./core-concepts.md#actionregister)

---

## Action Metrics

**Definition**: Performance metrics interface for action execution performance and status, used for monitoring, debugging, and performance optimization.

**Usage Context**:
- Performance monitoring
- Debugging assistance
- Metrics collection
- Optimization analysis

**Key Features**:
- Execution time tracking
- Success/failure status
- Handler count information
- Timestamp recording

**Related Terms**: [Performance Monitoring](#performance-monitoring), [ActionRegister](./core-concepts.md#actionregister)

---

## Performance Monitoring

**Definition**: Comprehensive system for tracking and analyzing performance metrics across the Context-Action framework components.

**Usage Context**:
- Performance analysis
- Bottleneck identification
- Optimization guidance
- Production monitoring

**Key Features**:
- Action execution metrics
- Store operation timing
- Handler performance tracking
- Memory usage monitoring

**Related Terms**: [Action Metrics](#action-metrics), [Performance Optimization](#performance-optimization)

---

## Action Events

**Definition**: Event types emitted by ActionRegister instances that enable reactive programming and monitoring of action lifecycle events.

**Usage Context**:
- Action monitoring
- Debugging assistance
- Analytics collection
- Custom tooling

**Key Features**:
- Lifecycle event emission
- Type-safe event handling
- Async event support
- Custom event data

**Related Terms**: [Event Driven Architecture](#event-driven-architecture), [ActionRegister](./core-concepts.md#actionregister)

---

## Event Driven Architecture

**Definition**: Architectural pattern that enables reactive programming and monitoring through event emission and handling across framework components.

**Usage Context**:
- Component decoupling
- Reactive programming
- System monitoring
- Custom integrations

**Key Features**:
- Loose coupling
- Event propagation
- Async event handling
- Type safety

**Related Terms**: [Action Events](#action-events), [Event Handler](#event-handler)

---

## Event Handler

**Definition**: Function type for handling events emitted by ActionRegister and other framework components.

**Usage Context**:
- Event processing
- Custom monitoring
- Debugging tools
- Analytics integration

**Key Features**:
- Type-safe event data
- Async support
- Error handling
- Performance optimization

**Related Terms**: [Event Driven Architecture](#event-driven-architecture), [Event Emitter](#event-emitter)

---

## Event Emitter

**Definition**: Basic event emitter interface for ActionRegister event system, providing methods for subscribing, emitting, and unsubscribing from events.

**Usage Context**:
- Event system implementation
- Custom event handling
- Framework integration
- Monitoring tools

**Key Features**:
- Subscribe/unsubscribe methods
- Type-safe event emission
- Cleanup functions
- Performance optimized

**Related Terms**: [Event Handler](#event-handler), [Event Driven Architecture](#event-driven-architecture)

---

## Observer Pattern

**Definition**: Design pattern implementation for reactive state management where Store instances notify subscribed components of state changes.

**Usage Context**:
- Reactive UI updates
- State change notifications
- Component subscriptions
- Data binding

**Key Features**:
- Automatic notifications
- Subscription management
- Memory leak prevention
- Performance optimization

**Related Terms**: [Store Integration Pattern](#store-integration-pattern), [Reactive Updates](#reactive-updates)

---

## Store Snapshot

**Definition**: Immutable snapshot interface for Store state representation, used for optimization and debugging, compatible with React's useSyncExternalStore pattern.

**Usage Context**:
- React integration
- State debugging
- Performance optimization
- Time travel debugging

**Key Features**:
- Immutable state representation
- Timestamp tracking
- React compatibility
- Memory efficient

**Related Terms**: [Immutable State](#immutable-state), [Store Integration Pattern](#store-integration-pattern)

---

## Immutable State

**Definition**: State management principle ensuring that state objects cannot be modified after creation, instead requiring new objects for updates.

**Usage Context**:
- Predictable updates
- React optimization
- Debugging assistance
- State consistency

**Key Features**:
- Immutable objects
- Predictable updates
- Performance optimization
- Debug assistance

**Related Terms**: [Store Snapshot](#store-snapshot), [Observer Pattern](#observer-pattern)

---

## Store Interface

**Definition**: Core interface defining the contract for Store instances, including subscription methods, value access, and React integration compatibility.

**Usage Context**:
- Store implementation
- Type definitions
- Framework contracts
- Custom store creation

**Key Features**:
- Subscription methods
- Value access patterns
- React compatibility
- TypeScript support

**Related Terms**: [useSyncExternalStore Compatible](#usesyncexternalstore-compatible), [Observer Pattern](#observer-pattern)

---

## useSyncExternalStore Compatible

**Definition**: Compatibility with React's useSyncExternalStore hook, ensuring proper integration with React's concurrent features and state management.

**Usage Context**:
- React integration
- Concurrent features
- State synchronization
- Performance optimization

**Key Features**:
- React compatibility
- Concurrent support
- State synchronization
- Performance benefits

**Related Terms**: [Store Interface](#store-interface), [React Integration](#react-integration)

---

## Registry Pattern

**Definition**: Design pattern for centralized management of Store instances with dynamic access and lifecycle management capabilities.

**Usage Context**:
- Store management
- Dynamic access
- Lifecycle control
- Dependency injection

**Key Features**:
- Centralized management
- Dynamic registration
- Lifecycle hooks
- Type safety

**Related Terms**: [Store Registry](./core-concepts.md#store-registry), [Store Integration Pattern](#store-integration-pattern)

---

## Environment Configuration

**Definition**: System for configuring framework behavior through environment variables with cross-platform support and intelligent defaults.

**Usage Context**:
- Development setup
- Production configuration
- Cross-platform deployment
- Automatic configuration

**Key Features**:
- Environment variable support
- Cross-platform compatibility
- Intelligent defaults
- Runtime configuration

**Related Terms**: [Logger Factory](#logger-factory), [Smart Logger Creation](#smart-logger-creation)