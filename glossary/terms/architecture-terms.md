# Architecture Terms

MVVM architecture and design patterns used throughout the Context-Action framework.

## MVVM Pattern

**Definition**: React 애플리케이션을 위해 적응된 Model-View-ViewModel 아키텍처 패턴으로, 중앙화된 상태 관리와 액션 기반 비즈니스 로직을 특징으로 합니다.

**Usage Context**:
- 애플리케이션 아키텍처 설계 및 구조화
- 관심사의 분리 구현 (Separation of Concerns)
- 확장 가능한 애플리케이션 구조 설계
- 깔끔한 코드 조직 및 유지보수성 향상
- Context-Action 프레임워크의 핵심 아키텍처

**Key Characteristics**:
- **View**: React 컴포넌트를 통한 프레젠테이션 처리 (Store Hooks 사용)
- **ViewModel**: 비즈니스 로직을 담당하는 Action Handler 시스템
- **Model**: 애플리케이션 상태를 관리하는 Store 시스템
- 액션을 통한 단방향 데이터 플로우 구현
- 계층 간 타입 안전한 통신 보장
- ActionRegister를 통한 ViewModel 조정

**Implementation**: Context-Action 프레임워크에서 View는 React 컴포넌트와 Store Hooks, ViewModel은 ActionRegister와 Action Handler, Model은 Store와 StoreRegistry로 구현됩니다.

**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Unidirectional Data Flow](#unidirectional-data-flow)

---

## View Layer

**Definition**: UI 렌더링과 사용자 상호작용 캡처를 담당하는 React 컴포넌트로 구성된 프레젠테이션 계층입니다.

**Usage Context**:
- 사용자 인터페이스 렌더링 및 표시
- 사용자 상호작용 처리 및 이벤트 캡처
- 반응형 업데이트를 위한 Store 구독
- 비즈니스 로직을 위한 액션 디스패치
- MVVM 패턴의 View 역할 구현

**Responsibilities**:
- ✅ **DO**: 프레젠테이션 및 사용자 상호작용 처리
- ✅ **DO**: 관련 Store 구독 (useStoreValue, useStoreActions)
- ✅ **DO**: 페이로드와 함께 액션 디스패치 (useActionDispatch)
- ✅ **DO**: 조건부 렌더링 및 UI 상태 관리
- ❌ **DON'T**: 비즈니스 로직 포함
- ❌ **DON'T**: Store 상태 직접 조작
- ❌ **DON'T**: API 호출이나 사이드 이펙트 수행

**Implementation**: React 컴포넌트에서 Store Hooks(useStoreValue)로 상태 구독, Action Dispatcher(useActionDispatch)로 액션 전송하여 구현됩니다.

**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Store Hooks](./api-terms.md#store-hooks), [Action Dispatcher](./api-terms.md#action-dispatcher)

---

## ViewModel Layer

**Definition**: 사용자 액션을 처리하고 View와 Model 계층 간을 조정하는 Action Handler를 통해 구현된 비즈니스 로직 계층입니다.

**Usage Context**:
- 비즈니스 로직 구현 및 실행
- 상태 변환 및 유효성 검증
- 크로스 스토어 조정 및 데이터 동기화
- 사이드 이펙트 관리 및 비동기 작업 처리
- MVVM 패턴의 ViewModel 역할 구현

**Responsibilities**:
- ✅ **DO**: 비즈니스 로직 및 유효성 검증 구현
- ✅ **DO**: 여러 Store 조정 및 데이터 일관성 유지
- ✅ **DO**: 비동기 연산 및 사이드 이펙트 처리
- ✅ **DO**: 오류 처리 및 롤백 메커니즘 제공
- ✅ **DO**: Store 간 의존성 관리 및 업데이트 순서 제어
- ❌ **DON'T**: DOM 직접 조작
- ❌ **DON'T**: 프레젠테이션 로직 처리
- ❌ **DON'T**: 로컬 상태 유지

**Implementation**: ActionRegister에 등록된 Action Handler 함수들로 구현되며, Pipeline Controller를 통해 흐름을 제어하고 Store registry로 데이터에 접근합니다.

**Related Terms**: [View Layer](#view-layer), [Model Layer](#model-layer), [Action Handler](./core-concepts.md#action-handler), [Business Logic](#business-logic), [ActionRegister](./core-concepts.md#actionregister)

---

## Model Layer

**Definition**: The data management layer consisting of stores that handle application state, persistence, and change notifications.


**Usage Context**:
- Application state management
- Data persistence and retrieval
- Change notification to subscribers
- Computed value derivation

**Responsibilities**:
- ✅ **DO**: Manage application state
- ✅ **DO**: Provide controlled access to data
- ✅ **DO**: Notify subscribers of changes
- ✅ **DO**: Integrate with persistence layers
- ❌ **DON'T**: Contain business logic
- ❌ **DON'T**: Handle UI concerns
- ❌ **DON'T**: Make direct API calls


**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Store Registry](./core-concepts.md#store-registry), [Computed Store](./api-terms.md#computed-store)

---

## Lazy Evaluation

**Definition**: A design pattern where store values are retrieved at execution time rather than at registration time, ensuring handlers always receive fresh state.


**Usage Context**:
- Action handler implementation
- State consistency guarantee
- Avoiding stale closure issues
- Dynamic state access

**Key Benefits**:
- Eliminates stale closure problems
- Guarantees fresh state values
- Supports dynamic store content
- Enables flexible handler composition


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Fresh State Access](#fresh-state-access)

---

## Decoupled Architecture

**Definition**: An architectural approach where components, actions, and stores are loosely coupled, communicating through well-defined interfaces rather than direct dependencies.


**Usage Context**:
- System design and organization
- Module independence
- Testing and maintenance
- Scalability planning

**Key Principles**:
- Actions don't know about components
- Stores don't know about actions  
- Components only know action names and payloads
- Communication through standardized interfaces

**Benefits**:
- Independent testing of each layer
- Easy refactoring and maintenance
- Reusable business logic
- Clear separation of concerns


**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Separation of Concerns](#separation-of-concerns), [Loose Coupling](#loose-coupling)

---

## Unidirectional Data Flow

**Definition**: A data flow pattern where information moves in a single direction: from user interactions through actions to state updates and back to UI rendering.


**Usage Context**:
- Data flow design
- State management predictability
- Debugging and traceability
- Performance optimization

**Flow Sequence**:
1. **User Interaction** → Component captures event
2. **Action Dispatch** → Component dispatches action with payload
3. **Handler Execution** → ViewModel processes business logic
4. **State Update** → Model layer updates stores
5. **Component Re-render** → View layer reflects changes


**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Predictable State Updates](#predictable-state-updates)

---

## Type Safety

**Definition**: Compile-time type checking that ensures type correctness across all layers of the architecture, from action payloads to store values.


**Usage Context**:
- Development-time error prevention
- API contract enforcement
- Refactoring safety
- Developer experience enhancement

**Key Features**:
- Strongly typed action payloads
- Type-safe store access
- Compile-time interface validation
- Generic type propagation


**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Action Handler](./core-concepts.md#action-handler), [Compile-time Validation](#compile-time-validation)

---

## Business Logic

**Definition**: The core application rules, processes, and workflows that define how data is processed and business requirements are implemented.


**Usage Context**:
- Action handler implementation
- Validation and processing rules
- Workflow orchestration
- Domain-specific operations

**Characteristics**:
- Centralized in ViewModel layer (action handlers)
- Independent of UI presentation
- Testable in isolation
- Reusable across different interfaces


**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Action Handler](./core-concepts.md#action-handler), [Domain Rules](#domain-rules)

---

## Deprecated HOC Patterns

**Definition**: Legacy Higher-Order Component patterns that have been deprecated in favor of modern React hook-based approaches for better type safety, bundle size optimization, and code maintainability.

**Usage Context**:
- Migration documentation and guides
- Legacy code references
- Framework evolution history
- Developer education on modern patterns

**Deprecated Patterns**:
- `withStore`: Individual store injection → Use `useLocalStore` + `useStoreValue`
- `withManagedStore`: Registry-managed store injection → Use `useRegistryStore` + `useStoreValue`
- `withRegistryStores`: Multiple store injection → Use individual `useRegistryStore` calls
- `withStoreData`: Store value mapping → Use `useStoreValue` with selectors

**Migration Benefits**:
- Improved TypeScript type inference and safety
- Reduced bundle size (7% improvement)
- Simpler component composition
- Better alignment with modern React patterns
- Enhanced debugging and testing capabilities

**Related Terms**: [Store Hooks](./api-terms.md#store-hooks), [Type Safety](#type-safety), [View Layer](#view-layer), [Store Registry](./core-concepts.md#store-registry)

---

## Store-Integration-Pattern

**Definition**: 액션 핸들러가 Store와 상호작용하는 3단계 패턴으로, 느슨한 결합과 일관된 상태 관리를 보장.

**Usage Context**:
- 액션 핸들러 내에서 상태 관리
- 비즈니스 로직과 상태 분리
- 다중 Store 조정
- 상태 일관성 보장

**Three-Step Pattern**:
1. **Read Current State**: `store.getValue()`로 현재 상태 읽기
2. **Execute Business Logic**: 페이로드와 현재 상태를 사용한 비즈니스 로직 실행
3. **Update Stores**: `store.setValue()` 또는 `store.update()`로 상태 업데이트

**Key Benefits**:
- 항상 최신 상태 값 보장 (stale closure 방지)
- 컴포넌트와 Store 간 직접 결합 없음
- 테스트 가능한 비즈니스 로직
- 예측 가능한 상태 업데이트

**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Store Registry](./core-concepts.md#store-registry), [Lazy Evaluation](#lazy-evaluation)

---

## Model Layer

**Definition**: MVVM 패턴의 데이터 계층으로, Store 시스템을 통해 애플리케이션 상태를 관리하는 계층.

**Usage Context**:
- 애플리케이션 상태 저장 및 관리
- 데이터 지속성 및 검색
- 변경 알림을 통한 반응형 업데이트
- 계산된 값 및 파생 상태 관리

**Core Responsibilities**:
- ✅ **DO**: 애플리케이션 상태 관리 및 저장
- ✅ **DO**: 데이터에 대한 제어된 접근 제공
- ✅ **DO**: 구독자에게 변경 알림 전송
- ✅ **DO**: 지속성 계층과 통합
- ❌ **DON'T**: 비즈니스 로직 포함
- ❌ **DON'T**: UI 관심사 처리
- ❌ **DON'T**: 직접적인 API 호출

**Implementation Components**:
- **Store Classes**: 개별 상태 도메인 관리
- **Store Registry**: 중앙화된 Store 관리
- **Reactive System**: 구독 및 알림 메커니즘
- **Computed Stores**: 파생 상태 계산

**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Store Registry](./core-concepts.md#store-registry), [Store Integration Pattern](#store-integration-pattern)

---

## Fresh State Access

**Definition**: 액션 핸들러가 항상 최신 상태 값을 보장받는 메커니즘으로, 클로저로 인한 stale 값 문제를 해결.

**Usage Context**:
- 액션 핸들러 구현 시 상태 접근
- 동시성 문제 방지
- 상태 일관성 보장
- 비동기 작업에서의 정확한 상태 참조

**Technical Implementation**:
- 등록 시점이 아닌 실행 시점에 상태 값 조회
- `store.getValue()` 메서드를 통한 lazy evaluation
- 클로저 캡처로 인한 stale 값 문제 방지
- 동적 상태 콘텐츠 지원

**Problem Solved**:
```typescript
// ❌ 문제: stale closure
const user = userStore.getValue(); // 등록 시점의 값
register('updateProfile', () => {
  // user는 항상 등록 시점의 값 (stale)
});

// ✅ 해결: fresh state access
register('updateProfile', () => {
  const user = userStore.getValue(); // 실행 시점의 최신 값
});
```

**Related Terms**: [Lazy Evaluation](#lazy-evaluation), [Store Integration Pattern](#store-integration-pattern), [Action Handler](./core-concepts.md#action-handler)

---

## Separation of Concerns

**Definition**: 각 시스템 계층이 명확하게 구분된 책임을 갖도록 하는 아키텍처 원칙.

**Usage Context**:
- 시스템 설계 및 구조 결정
- 코드 유지보수성 향상
- 테스트 가능성 증대
- 개발팀 협업 효율성

**Layer Responsibilities**:
- **View Layer**: UI 렌더링 및 사용자 인터랙션만 처리
- **ViewModel Layer**: 비즈니스 로직 및 상태 조정만 담당
- **Model Layer**: 데이터 저장 및 관리만 수행

**Benefits**:
- 각 계층의 독립적인 테스트 가능
- 쉬운 리팩토링 및 유지보수
- 재사용 가능한 비즈니스 로직
- 명확한 관심사 분리

**Anti-Patterns to Avoid**:
- 컴포넌트 내 비즈니스 로직
- Store에서 API 호출
- 액션 핸들러에서 DOM 조작

**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Decoupled Architecture](#decoupled-architecture), [Loose Coupling](#loose-coupling)

---

## Loose Coupling

**Definition**: 시스템 컴포넌트 간의 의존성을 최소화하여 독립성과 유연성을 극대화하는 설계 원칙.

**Usage Context**:
- 모듈 간 인터페이스 설계
- 의존성 주입 패턴 구현
- 테스트 가능한 코드 작성
- 시스템 확장성 계획

**Implementation Strategies**:
- 인터페이스를 통한 추상화
- 이벤트 기반 통신
- 의존성 주입
- 잘 정의된 API 경계

**Context-Action Framework Examples**:
- 액션은 컴포넌트를 알지 못함
- Store는 액션을 알지 못함
- 컴포넌트는 액션 이름과 페이로드만 알면 됨
- 표준화된 인터페이스를 통한 통신

**Benefits**:
- 높은 모듈 재사용성
- 쉬운 단위 테스트
- 독립적인 개발 가능
- 유연한 시스템 진화

**Related Terms**: [Decoupled Architecture](#decoupled-architecture), [Separation of Concerns](#separation-of-concerns), [Interface Abstraction](#interface-abstraction)

---

## Predictable State Updates

**Definition**: 상태 변경이 예측 가능하고 추적 가능한 방식으로 이루어지는 패턴.

**Usage Context**:
- 디버깅 및 문제 해결
- 상태 변경 추적
- 사용자 인터랙션 결과 예측
- 개발 도구 지원

**Key Characteristics**:
- 단방향 데이터 흐름
- 명시적인 액션을 통한 상태 변경
- 불변성 원칙 준수
- 상태 변경 이벤트 추적

**Implementation Features**:
- Action → Handler → State Update 흐름
- 타임스탬프를 포함한 스냅샷 시스템
- 상태 변경 로깅 및 모니터링
- Redux DevTools 스타일 디버깅 지원

**Benefits**:
- 버그 재현 및 수정 용이
- 상태 변경 히스토리 추적
- 성능 최적화 포인트 식별
- 개발자 경험 향상

**Related Terms**: [Unidirectional Data Flow](#unidirectional-data-flow), [MVVM Pattern](#mvvm-pattern), [State Management](#state-management)

---

## Compile-time Validation

**Definition**: TypeScript 컴파일 시점에 타입 안전성과 API 계약을 검증하는 시스템.

**Usage Context**:
- 개발 시간 오류 방지
- API 계약 강제
- 리팩토링 안전성 보장
- 개발자 경험 향상

**Validation Areas**:
- 액션 페이로드 타입 검증
- Store 값 타입 안전성
- 인터페이스 계약 검증
- 제네릭 타입 전파

**Technical Implementation**:
- 강력한 제네릭 타입 시스템
- 오버로드된 함수 시그니처
- 조건부 타입을 통한 타입 제약
- 브랜드 타입을 통한 구분

**Benefits**:
- 런타임 오류 사전 방지
- IDE 자동 완성 및 오류 표시
- 안전한 리팩토링 지원
- 문서화 효과

**Related Terms**: [Type Safety](#type-safety), [Action Payload Map](./core-concepts.md#action-payload-map), [Generic Programming](#generic-programming)

---

## Domain Rules

**Definition**: 비즈니스 도메인의 규칙과 제약 조건을 코드로 구현한 것으로, ViewModel 계층에서 관리.

**Usage Context**:
- 비즈니스 로직 구현
- 데이터 검증 및 제약 조건
- 워크플로우 오케스트레이션
- 도메인별 특수 요구사항

**Implementation Patterns**:
- 액션 핸들러 내 검증 로직
- 조건부 실행 및 분기 처리
- 다중 Store 조정을 통한 복잡한 비즈니스 규칙
- 에러 처리 및 롤백 메커니즘

**Examples**:
- 사용자 권한 검증
- 데이터 무결성 규칙
- 비즈니스 워크플로우 제어
- 외부 시스템과의 동기화 규칙

**Best Practices**:
- 단일 책임 원칙 적용
- 테스트 가능한 순수 함수로 구현
- 도메인 언어를 반영한 명명
- 에러 상황에 대한 명확한 처리

**Related Terms**: [Business Logic](#business-logic), [ViewModel Layer](#viewmodel-layer), [Action Handler](./core-concepts.md#action-handler)