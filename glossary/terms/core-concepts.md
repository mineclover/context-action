# Core Concepts

Fundamental framework concepts and systems that form the foundation of the Context-Action framework.

## Action Pipeline System

**Definition**: The central orchestration system that processes dispatched actions through a series of registered handlers in priority order.

**Usage Context**: 
- Core framework functionality
- Business logic execution
- Event-driven architecture implementation

**Key Characteristics**:
- Priority-based handler execution (higher priority runs first)
- Type-safe action dispatch with payload validation
- Pipeline flow control (abort, continue, modify)
- Support for both synchronous and asynchronous handlers

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Store Integration Pattern](#store-integration-pattern)

---

## Store Integration Pattern

**Definition**: The architectural pattern that enables action handlers to read and update stores while maintaining loose coupling between components.

**Usage Context**:
- State management in action handlers
- Cross-store coordination
- Data flow implementation

**Key Characteristics**:
- Lazy evaluation of store values at execution time
- No direct component-to-store coupling
- Atomic-like updates across multiple stores
- Fresh state values guaranteed in handlers

**Related Terms**: [Action Handler](#action-handler), [Cross-Store Coordination](./api-terms.md#cross-store-coordination), [Lazy Evaluation](./architecture-terms.md#lazy-evaluation)

---

## Action Handler

**Definition**: A function that processes a specific action within the pipeline, containing business logic and store interactions.

**Usage Context**:
- Business logic implementation
- State transformation
- Side effect management
- Validation and error handling

**Key Characteristics**:
- Receives typed payload and pipeline controller
- Can be synchronous or asynchronous
- Configurable with priority, blocking, and condition options
- Has access to all registered stores via store registry

**Related Terms**: [Pipeline Controller](#pipeline-controller), [Action Pipeline System](#action-pipeline-system), [Handler Configuration](./api-terms.md#handler-configuration)

---

## Pipeline Controller

**Definition**: An interface provided to action handlers for managing pipeline execution flow and payload modification.

**Usage Context**:
- Flow control within action handlers
- Pipeline abortion on errors
- Payload modification for subsequent handlers
- Handler coordination

**Key Methods**:
- `next()`: Continue to the next handler (called automatically)
- `abort(reason?)`: Stop pipeline execution with optional reason
- `modifyPayload(modifier)`: Transform payload for subsequent handlers
- `getPayload()`: Retrieve current payload

**Related Terms**: [Action Handler](#action-handler), [Action Pipeline System](#action-pipeline-system), [Pipeline Context](./api-terms.md#pipeline-context)

---

## Store Registry

**Definition**: A centralized registry that manages store instances and provides access to stores within the application context.

**Usage Context**:
- Store lifecycle management
- Dependency injection for action handlers
- Store discovery and access
- Provider pattern implementation

**Key Characteristics**:
- Centralized store management
- Type-safe store access by key
- Integration with React context system
- Lazy store initialization support

**Related Terms**: [Store Provider](./api-terms.md#storeprovider), [Action Provider](./api-terms.md#actionprovider), [Store Integration Pattern](#store-integration-pattern)

---

## Action Payload Map

**Definition**: A TypeScript interface that defines the mapping between action names and their corresponding payload types.

**Usage Context**:
- Type safety for action dispatch
- Action handler registration
- Compile-time validation
- API contract definition

**Key Characteristics**:
- Extends base ActionPayloadMap interface
- Maps action names to payload types
- Supports void payloads for parameter-less actions
- Enables compile-time type checking

**Related Terms**: [Action Handler](#action-handler), [Action Dispatcher](./api-terms.md#action-dispatcher), [Type Safety](./architecture-terms.md#type-safety)

---

## Handler Configuration

**Definition**: Configuration options that control the behavior of action handlers within the pipeline.

**Usage Context**:
- Handler behavior customization
- Execution order control
- Conditional execution
- Performance optimization

**Configuration Options**:
- `priority`: Execution order (higher numbers run first)
- `id`: Unique identifier for the handler
- `blocking`: Whether to wait for async completion
- `once`: Remove handler after first execution
- `condition`: Function to determine if handler should run

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Priority-based Execution](./api-terms.md#priority-based-execution)

---

## ActionRegister

**Definition**: 중앙화된 액션 등록 및 디스패치 시스템으로, 타입 안전한 액션 파이프라인 관리를 제공하는 핵심 클래스.

**Usage Context**:
- 액션 핸들러 등록 및 관리
- 타입 안전한 액션 디스패치
- 파이프라인 실행 제어
- 이벤트 기반 모니터링

**Key Characteristics**:
- 제네릭 타입 지원으로 완전한 타입 안전성 보장
- 우선순위 기반 핸들러 실행 (높은 숫자가 먼저 실행)
- 동기/비동기 핸들러 모두 지원
- 파이프라인 흐름 제어 (abort, continue, modify)
- 설정 가능한 로깅 및 디버깅 기능
- 이벤트 방출을 통한 액션 라이프사이클 모니터링

**Related Terms**: [Action Pipeline System](#action-pipeline-system), [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller)

---

## Simple Event Emitter

**Definition**: ActionRegister 이벤트를 위한 경량화된 이벤트 방출 시스템 구현체.

**Usage Context**:
- 내부 이벤트 시스템 구현
- 액션 라이프사이클 이벤트 처리
- 핸들러 등록/해제 이벤트 관리
- 에러 핸들링 및 복구

**Key Characteristics**:
- Map을 이용한 효율적인 리스너 관리
- Set을 사용하여 중복 방지와 O(1) 삭제 보장
- 타입 안전한 이벤트 핸들링
- 자동 메모리 관리 및 정리

**Related Terms**: [ActionRegister](#actionregister), [Event Handler](./api-terms.md#event-handler), [Action Register Events](./api-terms.md#action-register-events)

---

## Execution Modes

**Definition**: 액션 파이프라인에서 핸들러들의 실행 방식을 결정하는 전략 패턴.

**Usage Context**:
- 파이프라인 실행 전략 선택
- 성능 최적화 및 동시성 제어
- 핸들러 간 의존성 관리
- 비즈니스 로직 요구사항에 맞는 실행 방식 선택

**Available Modes**:
- **Sequential**: 핸들러를 순차적으로 하나씩 실행 (기본값)
- **Parallel**: 모든 핸들러를 동시에 병렬 실행
- **Race**: 가장 먼저 완료되는 핸들러의 결과를 사용

**Key Characteristics**:
- 조건부 실행 지원 (condition, validation)
- 블로킹/비블로킹 핸들러 지원
- 에러 처리 및 전파 메커니즘
- 우선순위 점프 기능 (Sequential 모드)

**Related Terms**: [Action Pipeline System](#action-pipeline-system), [Handler Configuration](#handler-configuration), [Pipeline Controller](#pipeline-controller)

---

## Action Guard

**Definition**: 액션 실행 타이밍을 관리하는 시스템으로, 디바운싱과 쓰로틀링 기능을 제공.

**Usage Context**:
- 사용자 경험 최적화
- 불필요한 API 호출 방지
- 성능 최적화
- 중복 실행 방지

**Key Features**:
- **Debounce**: 연속된 호출을 지연시켜 마지막 호출만 실행
- **Throttle**: 지정된 시간 간격으로 실행 제한
- 액션별 독립적인 가드 상태 관리
- 자동 타이머 정리 및 메모리 관리

**Key Characteristics**:
- Map을 이용한 액션별 가드 상태 추적
- NodeJS.Timeout을 사용한 정확한 타이밍 제어
- Promise 기반 디바운스 구현
- 메모리 누수 방지를 위한 자동 정리

**Related Terms**: [ActionRegister](#actionregister), [Handler Configuration](#handler-configuration), [Performance Optimization](#performance-optimization)

## Logger Interface

TypeScript 인터페이스로 정의된 로깅 시스템의 표준 계약입니다.

**Core Interface**:
- `trace()`, `debug()`, `info()`, `warn()`, `error()` 메서드
- `setLevel()`, `getLevel()` 레벨 관리 메서드
- 선택적 데이터 매개변수 지원

**Key Features**:
- **구조적 로깅**: 메시지와 함께 객체 데이터 전달 가능
- **레벨 기반 필터링**: 설정된 레벨 이하만 출력
- **구현 독립성**: 다양한 로거 구현체 지원 (Console, File, Remote)

**Implementation Examples**:
- `ConsoleLogger`: 브라우저/Node.js 콘솔 출력
- `NoopLogger`: 로깅 비활성화용 더미 구현

**Related Terms**: [Log Level](#log-level), [Logger Implementation](#logger-implementation), [Console Logger](#console-logger)

## Log Level

로그 출력을 제어하기 위한 계층적 레벨 시스템입니다.

**Level Hierarchy** (낮은 숫자 = 높은 상세도):
- `TRACE = 0`: 가장 상세한 실행 추적
- `DEBUG = 1`: 개발자 디버깅 정보
- `INFO = 2`: 일반적인 정보성 메시지
- `WARN = 3`: 경고 및 잠재적 문제
- `ERROR = 4`: 오류 및 예외 상황
- `NONE = 5`: 모든 로깅 비활성화

**Environment Configuration**:
- `CONTEXT_ACTION_LOG_LEVEL`: 명시적 레벨 설정
- `CONTEXT_ACTION_DEBUG=true`: DEBUG 레벨 활성화
- `CONTEXT_ACTION_TRACE=true`: TRACE 레벨 활성화
- `NODE_ENV=development`: 자동으로 DEBUG 레벨

**Related Terms**: [Logger Interface](#logger-interface), [Logger Implementation](#logger-implementation)

## Logger Implementation

Logger 인터페이스의 구체적인 구현체들입니다.

**Core Implementations**:
- **ConsoleLogger**: 브라우저/Node.js 콘솔 출력
- **NoopLogger**: 로깅 비활성화 (성능 최적화)

**Key Features**:
- **레벨 필터링**: 설정된 레벨 이하만 출력
- **크로스 플랫폼**: 브라우저와 Node.js 환경 지원
- **포맷팅**: `[LEVEL] message` 형태로 구조화된 출력

**Environment Support**:
- 환경변수 기반 자동 설정
- Vite/브라우저 환경: `VITE_` 접두사 지원
- Node.js 환경: `process.env` 직접 접근

**Related Terms**: [Logger Interface](#logger-interface), [Console Logger](#console-logger), [Log Level](#log-level)

## Console Logger

브라우저와 Node.js 콘솔에 직접 출력하는 로거 구현체입니다.

**Output Methods**:
- `console.debug()`: TRACE, DEBUG 레벨
- `console.info()`: INFO 레벨
- `console.warn()`: WARN 레벨
- `console.error()`: ERROR 레벨

**Features**:
- **레벨별 색상**: 브라우저에서 자동 색상 구분
- **데이터 출력**: 객체와 배열을 접을 수 있는 형태로 표시
- **스택 트레이스**: ERROR 레벨에서 자동 스택 추적

**Performance**:
- 프로덕션에서는 ERROR 레벨만 사용 권장
- 개발 환경에서는 DEBUG/TRACE 레벨 활용

**Related Terms**: [Logger Interface](#logger-interface), [Logger Implementation](#logger-implementation), [Log Level](#log-level)

## Execution Mode

액션 파이프라인에서 핸들러들의 실행 방식을 제어하는 모드입니다.

**Available Modes**:
- **sequential**: 순차 실행 (우선순위 순서)
- **parallel**: 병렬 실행 (모든 핸들러 동시)
- **race**: 경쟁 실행 (첫 번째 완료만 사용)

**Mode Selection**:
- 글로벌 기본값: `ActionRegister` 설정
- 액션별 개별 설정: `setExecutionMode()` 메서드
- 핸들러별 블로킹: `blocking: true` 옵션

**Use Cases**:
- **Sequential**: 데이터 변환 파이프라인, 검증 단계
- **Parallel**: 독립적인 사이드 이펙트, 로깅/추적
- **Race**: 캐시/API 경쟁 호출, 타임아웃 처리

**Related Terms**: [Sequential Execution](#sequential-execution), [ActionRegister](#actionregister), [Handler Configuration](#handler-configuration)

## Sequential Execution

액션 핸들러들을 우선순위 순서대로 하나씩 순차 실행하는 방식입니다.

**Execution Flow**:
1. 핸들러 우선순위별 정렬 (높은 순서부터)
2. 조건부 실행: `condition`, `validation` 확인
3. 순차 실행: 이전 핸들러 완료 후 다음 실행
4. 블로킹 핸들러: `blocking: true`일 때 완료 대기

**Flow Control Features**:
- **Priority Jumping**: 실행 중 다른 우선순위로 점프
- **Early Abort**: `controller.abort()` 호출 시 즉시 중단
- **Error Handling**: 블로킹 핸들러 오류 시 전체 중단

**Key Benefits**:
- 예측 가능한 실행 순서
- 핸들러 간 데이터 의존성 지원
- 세밀한 플로우 제어

**Related Terms**: [Execution Mode](#execution-mode), [Pipeline Controller](#pipeline-controller), [Handler Configuration](#handler-configuration)

## Performance Optimization

시스템 성능을 향상시키기 위한 최적화 기법들입니다.

**Core Strategies**:
- **Action Guard**: 디바운스/스로틀링으로 불필요한 실행 방지
- **Store Memoization**: `useStoreActions` 메모이제이션
- **Selective Subscription**: 필요한 데이터만 구독하여 리렌더링 최소화

**Memory Management**:
- 자동 타이머 정리
- 약한 참조 사용
- 컴포넌트 언마운트 시 핸들러 해제

**Render Optimization**:
- `Object.is()` 참조 동등성 검사
- 스냅샷 기반 변경 감지
- 불필요한 리렌더링 방지

**Related Terms**: [Action Guard](#action-guard), [User Experience Optimization](#user-experience-optimization), Store Hooks

## User Experience Optimization

사용자 경험을 향상시키기 위한 최적화 기법들입니다.

**Interaction Patterns**:
- **Debouncing**: 검색 입력, 자동 저장 등에서 과도한 API 호출 방지
- **Throttling**: 스크롤, 리사이즈 이벤트에서 성능 최적화
- **Blocking**: 중복 제출 방지, 로딩 상태 관리

**Feedback Systems**:
- 즉각적인 UI 반응
- 로딩 상태 표시
- 오류 상태 처리

**Accessibility**:
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 적절한 포커스 관리

**Related Terms**: [Action Guard](#action-guard), [Performance Optimization](#performance-optimization), Business Logic

---

## Store Immutability

**Definition**: Store의 상태 불변성을 보장하는 시스템으로, 외부 수정으로부터 내부 상태를 보호하고 데이터 무결성을 유지합니다.

**Usage Context**:
- Store 값 읽기 시 안전한 복사본 제공
- 외부 코드의 의도치 않은 상태 변경 방지
- 액션 핸들러에서 최신 상태 접근 보장
- 메모리 효율성과 보안성의 균형

**Key Characteristics**:
- `performantSafeGet()` 함수를 통한 조건부 복사
- 글로벌 불변성 옵션으로 성능 조절 가능
- `enableCloning` 옵션으로 딥클론 활성화/비활성화
- 원시값과 참조값 모두 안전하게 처리

**Implementation Strategy**:
- 원시값: 직접 반환 (자연스러운 불변성)
- 참조값: `structuredClone()` 기반 딥클론
- 성능 고려: 필요 시에만 복사 수행
- 디버깅 지원: 복사 여부 로깅

**Related Terms**: [Store Integration Pattern](#store-integration-pattern), [Fresh State Access](./architecture-terms.md#fresh-state-access), [Unidirectional Data Flow](./architecture-terms.md#unidirectional-data-flow)