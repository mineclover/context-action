# Core Concepts

Fundamental framework concepts and systems that form the foundation of the Context-Action framework.

## Action Pipeline System

**Definition**: 타입 안전한 액션 디스패치와 우선순위 기반 핸들러 실행을 제공하는 중앙 집중식 오케스트레이션 시스템입니다.

**Usage Context**: 
- 핵심 프레임워크 기능 제공
- 비즈니스 로직 실행 관리
- 이벤트 기반 아키텍처 구현
- MVVM 패턴의 ViewModel 레이어 역할

**Key Characteristics**:
- 우선순위 기반 핸들러 실행 (높은 숫자가 먼저 실행)
- 제네릭 타입을 통한 완전한 타입 안전성 보장
- 파이프라인 흐름 제어 (abort, continue, modify)
- 동기/비동기 핸들러 모두 지원
- 실행 모드 선택 (sequential, parallel, race)
- 이벤트 방출을 통한 라이프사이클 모니터링

**Implementation**: ActionRegister 클래스로 구현되며, Map 기반 파이프라인 관리와 SimpleEventEmitter를 통한 이벤트 시스템을 제공합니다.

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Store Integration Pattern](#store-integration-pattern), [ActionRegister](#actionregister)

---

## Store Integration Pattern

**Definition**: 액션 핸들러가 스토어를 읽고 업데이트할 수 있게 하면서 컴포넌트 간 느슨한 결합을 유지하는 아키텍처 패턴입니다.

**Usage Context**:
- 액션 핸들러에서의 상태 관리
- 크로스 스토어 조정 및 동기화
- 단방향 데이터 플로우 구현
- MVVM 패턴의 Model 레이어 역할

**Key Characteristics**:
- 실행 시점의 지연 평가로 최신 상태 값 보장
- 컴포넌트와 스토어 간 직접 결합 없음
- 여러 스토어에 걸친 원자적 업데이트 지원
- Store 클래스 기반 구독/스냅샷 시스템
- 불변성 보장을 위한 performantSafeGet 사용

**Implementation**: Store 클래스로 구현되며, Set 기반 리스너 관리, 스냅샷 기반 변경 감지, 그리고 불변성 보장을 위한 깊은 복사를 제공합니다.

**Related Terms**: [Action Handler](#action-handler), [Cross-Store Coordination](./api-terms.md#cross-store-coordination), [Lazy Evaluation](./architecture-terms.md#lazy-evaluation), [Store Immutability](#store-immutability)

---

## Action Handler

**Definition**: 파이프라인 내에서 특정 액션을 처리하는 함수로, 비즈니스 로직과 스토어 상호작용을 담당합니다.

**Usage Context**:
- 비즈니스 로직 구현 및 실행
- 상태 변환 및 데이터 처리
- 사이드 이펙트 관리 및 제어
- 유효성 검증 및 오류 처리
- MVVM 패턴의 ViewModel 레이어 로직

**Key Characteristics**:
- 타입 안전한 페이로드와 Pipeline Controller를 매개변수로 받음
- 동기/비동기 실행 모두 지원 (void | Promise<void>)
- HandlerConfig를 통한 세밀한 실행 제어 (priority, blocking, condition)
- Store registry를 통한 모든 등록된 스토어 접근 가능
- 디바운싱/쓰로틀링 지원으로 성능 최적화

**Implementation**: ActionHandler 타입으로 정의되며, (payload: T, controller: PipelineController<T>) => void | Promise<void> 시그니처를 가집니다.

**Related Terms**: [Pipeline Controller](#pipeline-controller), [Action Pipeline System](#action-pipeline-system), [Handler Configuration](#handler-configuration), [ActionRegister](#actionregister)

---

## Pipeline Controller

**Definition**: 액션 핸들러에게 제공되는 파이프라인 실행 흐름 관리 및 페이로드 수정을 위한 인터페이스입니다.

**Usage Context**:
- 액션 핸들러 내에서의 흐름 제어
- 오류 발생 시 파이프라인 중단
- 후속 핸들러를 위한 페이로드 변형
- 핸들러 간 조정 및 데이터 전달
- 우선순위 기반 점프 제어

**Key Methods**:
- `next()`: 파이프라인의 다음 핸들러로 진행 (자동 호출됨)
- `abort(reason?)`: 선택적 이유와 함께 파이프라인 실행 중단
- `modifyPayload(modifier)`: 후속 핸들러에 전달될 페이로드 변형
- `getPayload()`: 현재 페이로드 조회
- `jumpToPriority(priority)`: 특정 우선순위 레벨로 점프

**Implementation**: PipelineController<T> 인터페이스로 정의되며, 제네릭 타입을 통해 처리 중인 페이로드 타입을 보장합니다.

**Related Terms**: [Action Handler](#action-handler), [Action Pipeline System](#action-pipeline-system), [Pipeline Context](./api-terms.md#pipeline-context), [Handler Configuration](#handler-configuration)

---

## Store Registry

**Definition**: 애플리케이션 컨텍스트 내에서 Store 인스턴스들을 관리하고 접근을 제공하는 중앙화된 레지스트리입니다.

**Usage Context**:
- Store 생명주기 관리 및 등록/해제
- 액션 핸들러를 위한 의존성 주입
- Store 검색 및 접근 제어
- Provider 패턴 구현의 핵심
- Context Store Pattern 지원

**Key Characteristics**:
- Map 기반 중앙화된 Store 관리
- 이름을 통한 타입 안전한 Store 접근
- React context 시스템과의 통합
- 지연 Store 초기화 지원
- WeakMap 기반 메타데이터 관리로 메모리 누수 방지
- 구독/스냅샷 시스템으로 React와의 동기화

**Implementation**: StoreRegistry 클래스로 구현되며, IStoreRegistry 인터페이스를 따라 Map 기반 저장소와 Set 기반 구독자 관리를 제공합니다.

**Related Terms**: [Store Provider](./api-terms.md#storeprovider), [Action Provider](./api-terms.md#actionprovider), [Store Integration Pattern](#store-integration-pattern), [Context Store Pattern](./architecture-terms.md#context-store-pattern)

---

## Action Payload Map

**Definition**: 액션 이름과 해당 페이로드 타입 간의 매핑을 정의하는 TypeScript 인터페이스입니다.

**Usage Context**:
- 타입 안전한 액션 디스패치 보장
- 액션 핸들러 등록 시 타입 검증
- 컴파일 타임 유효성 검증
- API 계약 정의 및 문서화
- ActionRegister 제네릭 타입 매개변수

**Key Characteristics**:
- 기본 ActionPayloadMap 인터페이스 확장 ([actionName: string]: unknown)
- 액션 이름을 페이로드 타입에 매핑
- void 페이로드로 매개변수 없는 액션 지원
- 컴파일 타임 타입 검사 활성화
- unknown 타입 기반으로 유연성과 안전성 균형

**Implementation**: `export interface ActionPayloadMap { [actionName: string]: unknown; }` 형태로 정의되며, 사용자는 이를 확장하여 구체적인 액션-페이로드 매핑을 정의합니다.

**Related Terms**: [Action Handler](#action-handler), [Action Dispatcher](./api-terms.md#action-dispatcher), [Type Safety](./architecture-terms.md#type-safety), [ActionRegister](#actionregister)

---

## Handler Configuration

**Definition**: 파이프라인 내에서 액션 핸들러의 동작을 제어하는 설정 옵션들입니다.

**Usage Context**:
- 핸들러 동작 커스터마이징 및 세부 조정
- 실행 순서 제어 및 우선순위 관리
- 조건부 실행 및 유효성 검증
- 성능 최적화 (디바운싱/쓰로틀링)
- 미들웨어 패턴 구현

**Configuration Options**:
- `priority`: 실행 순서 (높은 숫자가 먼저 실행, 기본값: 0)
- `id`: 핸들러 고유 식별자 (미제공 시 자동 생성)
- `blocking`: 비동기 완료 대기 여부 (기본값: false)
- `once`: 첫 실행 후 핸들러 제거 여부 (기본값: false)
- `condition`: 핸들러 실행 여부 결정 함수
- `debounce`: 디바운스 지연 시간 (밀리초)
- `throttle`: 쓰로틀 지연 시간 (밀리초)
- `validation`: 핸들러 실행 전 페이로드 유효성 검증 함수
- `middleware`: 미들웨어로 표시 여부

**Implementation**: HandlerConfig 인터페이스로 정의되며, 모든 옵션이 선택사항이고 HandlerRegistration에서 Required<HandlerConfig>로 변환됩니다.

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Priority-based Execution](./api-terms.md#priority-based-execution), [Action Guard](#action-guard)

---

## ActionRegister

**Definition**: 중앙화된 액션 등록 및 디스패치 시스템으로, 타입 안전한 액션 파이프라인 관리를 제공하는 핵심 클래스입니다.

**Usage Context**:
- 액션 핸들러 등록 및 관리
- 타입 안전한 액션 디스패치
- 파이프라인 실행 제어 및 모니터링
- 이벤트 기반 라이프사이클 추적
- MVVM 패턴의 ViewModel 레이어 구현

**Key Characteristics**:
- 제네릭 타입 지원으로 완전한 타입 안전성 보장 (ActionPayloadMap 확장)
- 우선순위 기반 핸들러 실행 (높은 숫자가 먼저 실행)
- 다중 실행 모드 지원 (sequential, parallel, race)
- 파이프라인 흐름 제어 (abort, continue, modify, jumpToPriority)
- SimpleEventEmitter를 통한 라이프사이클 이벤트 방출
- ActionGuard를 통한 디바운싱/쓰로틀링 성능 최적화
- Map 기반 파이프라인 관리로 효율적인 핸들러 저장

**Implementation**: `ActionRegister<T extends ActionPayloadMap>` 클래스로 구현되며, Map을 이용한 파이프라인 관리, SimpleEventEmitter를 통한 이벤트 시스템, ActionGuard를 통한 성능 최적화를 제공합니다.

**Related Terms**: [Action Pipeline System](#action-pipeline-system), [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Simple Event Emitter](#simple-event-emitter), [Action Guard](#action-guard)

---

## Simple Event Emitter

**Definition**: ActionRegister 이벤트를 위한 경량화된 이벤트 방출 시스템 구현체입니다.

**Usage Context**:
- ActionRegister 내부 이벤트 시스템 구현
- 액션 라이프사이클 이벤트 처리
- 핸들러 등록/해제 이벤트 관리
- 에러 핸들링 및 복구 메커니즘
- EventEmitter<T> 인터페이스 구현

**Key Characteristics**:
- Map을 이용한 효율적인 리스너 관리 (이벤트 타입별 분리)
- Set을 사용하여 중복 방지와 O(1) 삭제 보장
- 제네릭 타입 안전한 이벤트 핸들링 (`EventEmitter<T extends Record<string, any>>`)
- 자동 메모리 관리 및 정리 (빈 Set 자동 삭제)
- try-catch 기반 안전한 이벤트 핸들러 실행
- UnregisterFunction 반환으로 편리한 구독 해제

**Implementation**: ActionRegister 내부의 `SimpleEventEmitter<ActionRegisterEvents<T>>` 클래스로 구현되며, Map<keyof T, Set<EventHandler<any>>> 구조로 이벤트 타입별 리스너를 관리합니다.

**Related Terms**: [ActionRegister](#actionregister), [Event Handler](./api-terms.md#event-handler), [Action Register Events](./api-terms.md#action-register-events), [Action Pipeline System](#action-pipeline-system)

---

## Execution Modes

**Definition**: 액션 파이프라인에서 핸들러들의 실행 방식을 결정하는 전략 패턴입니다.

**Usage Context**:
- 파이프라인 실행 전략 선택 및 최적화
- 성능 최적화 및 동시성 제어
- 핸들러 간 의존성 관리
- 비즈니스 로직 요구사항에 맞는 실행 방식 선택
- ActionRegister의 글로벌 또는 액션별 실행 모드 설정

**Available Modes**:
- **Sequential**: 핸들러를 우선순위 순서대로 순차 실행 (기본값)
- **Parallel**: 모든 핸들러를 동시에 병렬 실행 (Promise.allSettled 사용)
- **Race**: 가장 먼저 완료되는 핸들러의 결과만 사용 (Promise.race 사용)

**Key Characteristics**:
- 조건부 실행 지원 (condition, validation)
- 블로킹/비블로킹 핸들러 지원
- 에러 처리 및 전파 메커니즘
- 우선순위 점프 기능 (Sequential 모드 전용)
- 액션별 개별 실행 모드 설정 가능 (setExecutionMode)
- execution-modes.js에서 구체적 구현 제공

**Implementation**: ExecutionMode 타입 ('sequential' | 'parallel' | 'race')으로 정의되며, executeSequential, executeParallel, executeRace 함수로 각각 구현됩니다.

**Related Terms**: [Action Pipeline System](#action-pipeline-system), [Handler Configuration](#handler-configuration), [Pipeline Controller](#pipeline-controller), [Sequential Execution](#sequential-execution)

---

## Action Guard

**Definition**: 액션 실행 타이밍을 관리하는 시스템으로, 디바운싱과 쓰로틀링 기능을 제공합니다.

**Usage Context**:
- 사용자 경험 최적화 및 반응성 향상
- 불필요한 API 호출 방지
- 성능 최적화 및 리소스 절약
- 중복 실행 방지 및 안정성 보장
- ActionRegister 내부 성능 최적화 도구

**Key Features**:
- **Debounce**: 연속된 호출을 지연시켜 마지막 호출만 실행
- **Throttle**: 지정된 시간 간격으로 실행 제한
- 액션별 독립적인 가드 상태 관리 (GuardState 인터페이스)
- 자동 타이머 정리 및 메모리 관리

**Key Characteristics**:
- Map을 이용한 액션별 가드 상태 추적 (`Map<string, GuardState>`)
- NodeJS.Timeout을 사용한 정확한 타이밍 제어
- Promise 기반 디바운스 구현으로 비동기 지원
- 메모리 누수 방지를 위한 자동 정리 (clearTimeout)
- HandlerConfig의 debounce/throttle 옵션과 연동

**Implementation**: ActionGuard 클래스로 구현되며, GuardState 인터페이스를 통한 상태 관리와 Logger를 통한 디버깅을 제공합니다.

**Related Terms**: [ActionRegister](#actionregister), [Handler Configuration](#handler-configuration), [Performance Optimization](#performance-optimization), [User Experience Optimization](#user-experience-optimization)

## Logger Interface

**Definition**: TypeScript 인터페이스로 정의된 로깅 시스템의 표준 계약입니다.

**Usage Context**:
- Context-Action 프레임워크 전반의 로깅 표준화
- ActionRegister, Store, ActionGuard 등에서 활용
- 개발/프로덕션 환경별 로깅 전략 통일
- 구조적 로깅 및 디버깅 지원

**Core Interface**:
- `trace()`, `debug()`, `info()`, `warn()`, `error()` 메서드
- `setLevel()`, `getLevel()` 레벨 관리 메서드
- 선택적 데이터 매개변수 지원 (message: string, data?: any)

**Key Features**:
- **구조적 로깅**: 메시지와 함께 객체 데이터 전달 가능
- **레벨 기반 필터링**: 설정된 레벨 이하만 출력
- **구현 독립성**: 다양한 로거 구현체 지원 (Console, File, Remote)
- **타입 안전성**: TypeScript 인터페이스로 정의된 강타입 계약

**Implementation**: @context-action/logger 패키지에서 Logger 인터페이스로 정의되며, ConsoleLogger와 NoopLogger 구현체를 제공합니다.

**Related Terms**: [Log Level](#log-level), [Logger Implementation](#logger-implementation), [Console Logger](#console-logger), [ActionRegister](#actionregister)

## Log Level

**Definition**: 로그 출력을 제어하기 위한 계층적 레벨 시스템입니다.

**Usage Context**:
- Context-Action 프레임워크의 로깅 레벨 제어
- 개발/프로덕션 환경별 로깅 상세도 조절
- 성능 최적화를 위한 로그 필터링
- 디버깅 및 모니터링 레벨 설정

**Level Hierarchy** (낮은 숫자 = 높은 상세도):
- `TRACE = 0`: 가장 상세한 실행 추적 및 함수 호출 로그
- `DEBUG = 1`: 개발자 디버깅 정보 및 상태 변화
- `INFO = 2`: 일반적인 정보성 메시지 및 비즈니스 로직
- `WARN = 3`: 경고 및 잠재적 문제 상황
- `ERROR = 4`: 오류 및 예외 상황 (프로덕션 기본값)
- `NONE = 5`: 모든 로깅 비활성화

**Environment Configuration**:
- `CONTEXT_ACTION_LOG_LEVEL`: 명시적 레벨 설정 (0-5)
- `CONTEXT_ACTION_DEBUG=true`: DEBUG 레벨 활성화
- `CONTEXT_ACTION_TRACE=true`: TRACE 레벨 활성화
- `NODE_ENV=development`: 자동으로 DEBUG 레벨
- Vite 환경: `VITE_` 접두사 지원

**Implementation**: @context-action/logger 패키지에서 LogLevel enum으로 정의되며, 환경변수 기반 자동 설정을 지원합니다.

**Related Terms**: [Logger Interface](#logger-interface), [Logger Implementation](#logger-implementation), [Console Logger](#console-logger)

## Logger Implementation

**Definition**: Logger 인터페이스의 구체적인 구현체들입니다.

**Usage Context**:
- Logger 인터페이스 계약 구현
- 환경별 로깅 전략 제공
- 성능 최적화를 위한 다양한 구현체 선택
- createLogger 팩토리 함수를 통한 생성

**Core Implementations**:
- **ConsoleLogger**: 브라우저/Node.js 콘솔 출력
- **NoopLogger**: 로깅 비활성화 (성능 최적화용)

**Key Features**:
- **레벨 필터링**: 설정된 레벨 이하만 출력
- **크로스 플랫폼**: 브라우저와 Node.js 환경 지원
- **포맷팅**: `[LEVEL] message` 형태로 구조화된 출력
- **팩토리 패턴**: createLogger 함수로 환경별 자동 선택

**Environment Support**:
- 환경변수 기반 자동 설정 및 레벨 결정
- Vite/브라우저 환경: `VITE_` 접두사 지원
- Node.js 환경: `process.env` 직접 접근
- 개발/프로덕션 환경 자동 감지

**Implementation**: @context-action/logger 패키지에서 제공되며, createLogger 팩토리 함수를 통해 환경에 맞는 구현체를 자동 선택합니다.

**Related Terms**: [Logger Interface](#logger-interface), [Console Logger](#console-logger), [Log Level](#log-level), [ActionRegister](#actionregister)

## Console Logger

**Definition**: 브라우저와 Node.js 콘솔에 직접 출력하는 로거 구현체입니다.

**Usage Context**:
- 기본 로깅 구현체로 가장 널리 사용
- 개발 환경에서의 실시간 디버깅
- 브라우저 개발자 도구와의 통합
- Context-Action 프레임워크의 표준 로거

**Output Methods**:
- `console.debug()`: TRACE, DEBUG 레벨
- `console.info()`: INFO 레벨
- `console.warn()`: WARN 레벨
- `console.error()`: ERROR 레벨

**Features**:
- **레벨별 색상**: 브라우저에서 자동 색상 구분 및 아이콘 표시
- **데이터 출력**: 객체와 배열을 접을 수 있는 형태로 표시
- **스택 트레이스**: ERROR 레벨에서 자동 스택 추적
- **포맷팅**: `[LEVEL] message` 형태의 일관된 출력 형식

**Performance**:
- 프로덕션에서는 ERROR 레벨만 사용 권장
- 개발 환경에서는 DEBUG/TRACE 레벨 활용
- 로그 레벨 필터링으로 성능 영향 최소화

**Implementation**: Logger 인터페이스를 구현하며, 환경변수 기반 로그 레벨 설정과 크로스 플랫폼 지원을 제공합니다.

**Related Terms**: [Logger Interface](#logger-interface), [Logger Implementation](#logger-implementation), [Log Level](#log-level), [ActionRegister](#actionregister)

## Execution Mode

**Definition**: 액션 파이프라인에서 핸들러들의 실행 방식을 제어하는 모드입니다.

**Usage Context**:
- ActionRegister의 파이프라인 실행 전략 설정
- 글로벌 기본값 또는 액션별 개별 설정
- 성능 최적화 및 동시성 제어
- 비즈니스 로직 요구사항에 맞는 실행 패턴 선택

**Available Modes**:
- **sequential**: 순차 실행 (우선순위 순서, 기본값)
- **parallel**: 병렬 실행 (모든 핸들러 동시)
- **race**: 경쟁 실행 (첫 번째 완료만 사용)

**Mode Selection**:
- 글로벌 기본값: `ActionRegister` 생성자 설정
- 액션별 개별 설정: `setExecutionMode()` 메서드
- 핸들러별 블로킹: `blocking: true` 옵션

**Use Cases**:
- **Sequential**: 데이터 변환 파이프라인, 검증 단계, 의존성 있는 작업
- **Parallel**: 독립적인 사이드 이펙트, 로깅/추적, 동시 처리
- **Race**: 캐시/API 경쟁 호출, 타임아웃 처리, 최초 응답 우선

**Implementation**: ExecutionMode 타입으로 정의되며, Execution Modes와 동일한 개념이지만 단일 값 설정에 초점을 맞춘 용어입니다.

**Related Terms**: [Execution Modes](#execution-modes), [Sequential Execution](#sequential-execution), [ActionRegister](#actionregister), [Handler Configuration](#handler-configuration)

## Sequential Execution

**Definition**: 액션 핸들러들을 우선순위 순서대로 하나씩 순차 실행하는 방식입니다.

**Usage Context**:
- ActionRegister의 기본 실행 모드
- 데이터 의존성이 있는 핸들러 체인 실행
- 검증 단계를 거치는 파이프라인 처리
- 순서가 중요한 비즈니스 로직 구현

**Execution Flow**:
1. 핸들러 우선순위별 정렬 (높은 숫자부터)
2. 조건부 실행: `condition`, `validation` 확인
3. 순차 실행: 이전 핸들러 완료 후 다음 실행
4. 블로킹 핸들러: `blocking: true`일 때 완료 대기

**Flow Control Features**:
- **Priority Jumping**: 실행 중 다른 우선순위로 점프 (`jumpToPriority`)
- **Early Abort**: `controller.abort()` 호출 시 즉시 중단
- **Error Handling**: 블로킹 핸들러 오류 시 전체 중단
- **Payload Modification**: 핸들러 간 페이로드 변형 전달

**Key Benefits**:
- 예측 가능한 실행 순서 보장
- 핸들러 간 데이터 의존성 지원
- 세밀한 플로우 제어 및 조건부 실행
- 디버깅 및 추적 용이성

**Implementation**: executeSequential 함수로 구현되며, 우선순위 정렬, 조건 검증, 순차 실행, 에러 처리를 담당합니다.

**Related Terms**: [Execution Mode](#execution-mode), [Execution Modes](#execution-modes), [Pipeline Controller](#pipeline-controller), [Handler Configuration](#handler-configuration)

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