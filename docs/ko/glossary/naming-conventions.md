# 네이밍 컨벤션

Context-Action 프레임워크 전반에 걸쳐 일관된 용어 사용을 위한 코딩 표준 및 네이밍 규칙입니다.

> **구현 현황**: 0개 용어 구현 완료 ⚠️  
> **상태**: 가이드라인 및 규칙 - 실제 코드 구현보다는 문서화 목적

## 개요

이러한 컨벤션은 모든 프레임워크 컴포넌트에서 일관성을 보장하여 코드를 더 읽기 쉽고, 유지보수 가능하며, 전문적으로 만듭니다. 모든 네이밍은 코드 구현과 문서 간의 정렬을 유지하기 위해 이러한 패턴을 따라야 합니다.

## 일반 원칙

1. **설명적인 이름**: 이름은 목적과 기능을 명확히 나타내야 함
2. **일관성**: 유사한 개념에 대해 동일한 네이밍 패턴 사용
3. **약어 금지**: 널리 이해되는 경우가 아니면 약어 사용 피하기
4. **맥락적 명확성**: 해당 범위 내에서 이름이 모호하지 않아야 함
5. **프레임워크 정렬**: 코드베이스의 기존 패턴 따르기

---

## 클래스 네이밍

**컨벤션**: 설명적인 명사를 사용한 PascalCase

**패턴**: `[설명자][핵심]Class`

**예제**:
```typescript
// ✅ 올바름 - 명확하고 설명적이며 패턴을 따름
class ActionRegister<T extends ActionPayloadMap> { }
class StoreRegistry { }
class PipelineController<T> { }
class EventEmitter<T> { }

// ✅ 올바름 - 컴포넌트 클래스
class StoreProvider extends React.Component { }
class ActionProvider extends React.Component { }

// ❌ 잘못됨 - 약어, 불명확한 목적
class ActReg { }
class StoreReg { }
class PC { }
class EE { }
```

**프레임워크별 패턴**:
- **핵심 클래스**: `ActionRegister`, `StoreRegistry`, `PipelineController`
- **React 컴포넌트**: `StoreProvider`, `ActionProvider` 
- **유틸리티 클래스**: `EventEmitter`, `SimpleEventEmitter`
- **에러 클래스**: `ActionError`, `PipelineError`, `StoreError`

**관련 용어**: [ActionRegister](./api-terms.md#actionregister), [StoreProvider](./api-terms.md#storeprovider)

---

## 인터페이스 네이밍

**컨벤션**: 설명적인 접미사를 가진 PascalCase

**일반적인 접미사**:
- `Map`: 타입 매핑 (예: `ActionPayloadMap`)
- `Config`: 구성 객체 (예: `ActionRegisterConfig`, `HandlerConfig`)
- `Context`: 실행 컨텍스트 (예: `PipelineContext`)
- `Events`: 이벤트 타입 정의 (예: `ActionRegisterEvents`)
- `Handler`: 함수 타입 정의 (예: `ActionHandler`, `EventHandler`)

**예제**:
```typescript
// ✅ 올바름 - 적절한 접미사와 명확한 목적
interface ActionPayloadMap {
  [actionName: string]: any;
}

interface HandlerConfig {
  priority?: number;
  blocking?: boolean;
}

interface PipelineController<T> {
  next(): void;
  abort(reason?: string): void;
}

interface ActionRegisterEvents<T> {
  'action:start': { action: keyof T; payload: any };
  'action:complete': { action: keyof T; metrics: ActionMetrics };
}

// ❌ 잘못됨 - 불명확한 목적, 일관성 없는 네이밍
interface ActionMap { }  // ActionPayloadMap이어야 함
interface Config { }     // HandlerConfig 또는 ActionRegisterConfig여야 함
interface Controller { } // PipelineController여야 함
```

**프레임워크별 패턴**:
- **타입 맵**: `ActionPayloadMap`, `StoreValueMap`
- **구성**: `ActionRegisterConfig`, `HandlerConfig`, `StoreConfig`
- **함수 타입**: `ActionHandler`, `EventHandler`, `UnregisterFunction`
- **데이터 구조**: `HandlerRegistration`, `ActionMetrics`, `PipelineContext`

**관련 용어**: [액션 페이로드 맵](./core-concepts.md#액션-페이로드-맵), [핸들러 구성](./core-concepts.md#핸들러-구성)

---

## 함수 네이밍

**컨벤션**: 액션은 동사 기반, getter는 명사 기반의 camelCase

**패턴**:
- **액션**: `동사` + `객체` (예: `updateUser`, `fetchData`)
- **Getter**: `get` + `객체` (예: `getValue`, `getConfig`)
- **Setter**: `set` + `객체` (예: `setValue`, `setConfig`)
- **검사기**: `is` + `상태` 또는 `has` + `객체` (예: `isValid`, `hasHandlers`)
- **생성기**: `create` + `객체` (예: `createStore`, `createLogger`)

**예제**:
```typescript
// ✅ 올바름 - 명확한 액션 기반 네이밍
function register<K extends keyof T>(action: K, handler: ActionHandler<T[K]>) { }
function dispatch<K extends keyof T>(action: K, payload?: T[K]) { }
function unregister(handlerId: string) { }

// ✅ 올바름 - 명확한 getter/setter 네이밍
function getValue(): T { }
function setValue(value: T): void { }
function getConfig(): ActionRegisterConfig { }
function getHandlerCount(action: string): number { }

// ✅ 올바름 - 명확한 검사기 네이밍
function hasHandlers(action: string): boolean { }
function isValid(payload: unknown): boolean { }
function canExecute(): boolean { }

// ✅ 올바름 - 명확한 생성기 네이밍
function createStore<T>(initialValue: T): Store<T> { }
function createLogger(level: LogLevel): Logger { }
function createComputedStore<T>(dependencies: Store[], compute: ComputeFunction<T>): ComputedStore<T> { }

// ❌ 잘못됨 - 불명확한 목적, 일관성 없는 패턴
function reg() { }         // register()여야 함
function exec() { }        // execute() 또는 dispatch()여야 함
function check() { }       // hasHandlers() 또는 isValid()여야 함
function make() { }        // create() + 구체적 객체여야 함
```

**훅 네이밍** (React 관련):
```typescript
// ✅ 올바름 - React 훅 컨벤션을 따름
function useStoreValue<T>(store: Store<T>): T { }
function useActionDispatch<T>(): ActionDispatcher<T> { }
function useStoreRegistry(): StoreRegistry { }
function useComputedStore<T>(dependencies: Store[], compute: ComputeFunction<T>): T { }

// ❌ 잘못됨 - 훅 컨벤션을 따르지 않음
function getStoreValue() { }  // useStoreValue()여야 함
function storeValue() { }     // useStoreValue()여야 함
function actionDispatch() { } // useActionDispatch()여야 함
```

**관련 용어**: [스토어 훅](./api-terms.md#스토어-훅), [액션 핸들러](./core-concepts.md#액션-핸들러)

---

## 상수 네이밍

**컨벤션**: 상수는 UPPER_SNAKE_CASE, 열거형은 SCREAMING_SNAKE_CASE

**예제**:
```typescript
// ✅ 올바름 - 구성 상수
const DEFAULT_PRIORITY = 0;
const MAX_HANDLERS_PER_ACTION = 100;
const DEFAULT_LOG_LEVEL = LogLevel.ERROR;
const ACTION_TIMEOUT_MS = 5000;

// ✅ 올바름 - 열거형 값
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}

enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted'
}

// ✅ 올바름 - 액션 이름에 대한 문자열 상수
const USER_ACTIONS = {
  UPDATE_USER: 'updateUser',
  DELETE_USER: 'deleteUser',
  FETCH_USER: 'fetchUser'
} as const;

// ❌ 잘못됨 - 일관성 없는 케이싱
const defaultPriority = 0;           // DEFAULT_PRIORITY여야 함
const MaxHandlers = 100;             // MAX_HANDLERS_PER_ACTION이어야 함
const actionTimeout = 5000;          // ACTION_TIMEOUT_MS여야 함
```

**프레임워크별 상수**:
```typescript
// 핵심 프레임워크 상수
const DEFAULT_ACTION_REGISTER_NAME = 'ActionRegister';
const DEFAULT_HANDLER_PRIORITY = 0;
const MAX_PIPELINE_DEPTH = 1000;
const HANDLER_EXECUTION_TIMEOUT_MS = 30000;

// 이벤트 이름 상수
const ACTION_EVENTS = {
  START: 'action:start',
  COMPLETE: 'action:complete',
  ABORT: 'action:abort',
  ERROR: 'action:error'
} as const;

const HANDLER_EVENTS = {
  REGISTER: 'handler:register',
  UNREGISTER: 'handler:unregister'
} as const;
```

**관련 용어**: [ActionRegister](./api-terms.md#actionregister), [핸들러 구성](./core-concepts.md#핸들러-구성)

---

## 파일 네이밍

**컨벤션**: 파일은 kebab-case, 메인 내보내기 파일은 PascalCase

**패턴**:
- **메인 클래스**: `ClassName.ts` (예: `ActionRegister.ts`, `StoreRegistry.ts`)
- **유틸리티 파일**: `descriptive-name.ts` (예: `store-sync.ts`, `event-emitter.ts`)
- **타입 정의**: `types.ts`, `interfaces.ts`
- **훅 파일**: `use-hook-name.ts` (예: `use-store-value.ts`, `use-action-dispatch.ts`)
- **테스트 파일**: `ClassName.test.ts` 또는 `utility-name.test.ts`

**예제**:
```
✅ 올바른 파일 구조:
packages/core/src/
├── ActionRegister.ts          # 메인 클래스 파일
├── types.ts                   # 타입 정의
├── logger.ts                  # 유틸리티 함수
├── index.ts                   # 패키지 내보내기

packages/react/src/store/
├── StoreRegistry.ts           # 메인 클래스 파일
├── store-sync.ts              # 유틸리티 함수
├── registry-sync.ts           # 유틸리티 함수
├── types.ts                   # 타입 정의
├── hooks/
│   ├── use-store-value.ts     # 훅 구현
│   ├── use-action-dispatch.ts # 훅 구현
│   └── index.ts               # 훅 내보내기

❌ 잘못된 파일 네이밍:
├── actionRegister.ts          # ActionRegister.ts여야 함
├── store_sync.ts              # store-sync.ts여야 함
├── useStoreValue.ts           # use-store-value.ts여야 함
├── Types.ts                   # types.ts여야 함
```

**디렉토리 구조 컨벤션**:
```
packages/
├── core/                      # 핵심 프레임워크 로직
│   ├── src/
│   │   ├── ActionRegister.ts  # 메인 액션 시스템
│   │   ├── types.ts           # 핵심 타입 정의
│   │   ├── logger.ts          # 로깅 유틸리티
│   │   └── index.ts           # 패키지 내보내기
│   └── dist/                  # 컴파일된 출력
├── react/                     # React 통합
│   ├── src/
│   │   ├── ActionProvider.tsx # React 프로바이더 컴포넌트
│   │   ├── StoreProvider.tsx  # React 프로바이더 컴포넌트
│   │   ├── store/             # 스토어 관련 유틸리티
│   │   │   ├── hooks/         # React 훅
│   │   │   ├── types.ts       # 스토어 타입 정의
│   │   │   └── index.ts       # 스토어 내보내기
│   │   └── index.ts           # 패키지 내보내기
└── jotai/                     # Jotai 통합
    ├── src/
    └── dist/
```

**관련 용어**: [프로젝트 구조](#프로젝트-구조), [모듈 조직](#모듈-조직)

---

## 변수 네이밍

**컨벤션**: 설명적인 이름을 가진 camelCase

**패턴**:
- **지역 변수**: `descriptiveName` (예: `currentUser`, `actionResult`)
- **함수 매개변수**: `parameterName` (예: `payload`, `controller`, `action`)
- **컴포넌트 Props**: `propName` (예: `userId`, `onSubmit`, `isLoading`)
- **상태 변수**: `stateName` (예: `isVisible`, `currentStep`, `userPreferences`)

**예제**:
```typescript
// ✅ 올바름 - 명확하고 설명적인 변수명
function processUserAction(payload: UserActionPayload, controller: PipelineController) {
  const currentUser = userStore.getValue();
  const userPreferences = preferencesStore.getValue();
  const validationResult = validateUserAction(payload, currentUser);
  
  if (!validationResult.isValid) {
    controller.abort(validationResult.errorMessage);
    return;
  }
  
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now()
  };
  
  userStore.setValue(updatedUser);
}

// ✅ 올바름 - 명확한 prop 이름을 가진 React 컴포넌트
interface UserProfileProps {
  userId: string;
  isEditable: boolean;
  onUserUpdate: (user: User) => void;
  showAvatar: boolean;
}

function UserProfile({ userId, isEditable, onUserUpdate, showAvatar }: UserProfileProps) {
  const currentUser = useStoreValue(userStore);
  const isLoading = useStoreValue(uiStore, ui => ui.loading);
  
  return <div>{/* 컴포넌트 구현 */}</div>;
}

// ❌ 잘못됨 - 불명확하고 약어 사용, 오해의 소지가 있는 이름
function processUserAction(p: UserActionPayload, c: PipelineController) {
  const u = userStore.getValue();           // currentUser여야 함
  const prefs = preferencesStore.getValue(); // userPreferences여야 함
  const result = validateUserAction(p, u);   // validationResult여야 함
  
  if (!result.ok) {                         // validationResult.isValid여야 함
    c.abort(result.msg);                    // validationResult.errorMessage여야 함
    return;
  }
}
```

**Boolean 변수**:
```typescript
// ✅ 올바름 - is/has/can/should 접두사를 가진 명확한 boolean 네이밍
const isLoading = true;
const isValid = validateInput(input);
const hasPermission = checkUserPermission(user);
const canExecute = hasPermission && isValid;
const shouldRetry = attemptCount < MAX_ATTEMPTS;

// ❌ 잘못됨 - 불명확한 boolean 목적
const loading = true;        // isLoading이어야 함
const valid = true;          // isValid여야 함
const permission = true;     // hasPermission이어야 함
const execute = true;        // canExecute여야 함
```

**관련 용어**: [타입 안전성](./architecture-terms.md#타입-안전성), [코드 명확성](#코드-명확성)

---

## 제네릭 타입 매개변수

**컨벤션**: 설명적인 의미를 가진 단일 대문자

**일반적인 패턴**:
- `T`: 제네릭 타입 매개변수
- `K`: 키 타입 (종종 `keyof T`)
- `V`: 값 타입
- `P`: 페이로드 타입
- `R`: 반환 타입
- `E`: 이벤트 타입
- `S`: 상태 타입

**예제**:
```typescript
// ✅ 올바름 - 명확한 제네릭 타입 사용
class ActionRegister<T extends ActionPayloadMap> { }
interface ActionHandler<P> {
  (payload: P, controller: PipelineController<P>): void | Promise<void>;
}
interface Store<V> {
  getValue(): V;
  setValue(value: V): void;
}
interface ComputedStore<T, D extends readonly Store<any>[]> {
  getValue(): T;
  subscribe(listener: (value: T) => void): UnregisterFunction;
}

// ✅ 올바름 - 명확한 목적을 가진 여러 타입 매개변수
function createComputedStore<
  T,                                    // 결과 타입
  D extends readonly Store<any>[]       // 의존성 배열 타입
>(
  dependencies: D,
  compute: (...values: StoreValues<D>) => T
): ComputedStore<T, D> { }

// ❌ 잘못됨 - 불명확한 제네릭 네이밍
class ActionRegister<ActionMap> { }     // T extends ActionPayloadMap이어야 함
interface Handler<Data> { }            // ActionHandler<P>여야 함
function create<A, B, C>() { }         // 설명적인 이름을 사용해야 함
```

**프레임워크별 제네릭 패턴**:
```typescript
// 액션 관련 제네릭
interface ActionPayloadMap {
  [K: string]: any;
}
type ActionDispatcher<T extends ActionPayloadMap> = {
  <K extends keyof T>(action: K, payload: T[K] extends void ? never : T[K]): Promise<void>;
  <K extends keyof T>(action: T[K] extends void ? K : never): Promise<void>;
};

// 스토어 관련 제네릭
interface Store<V> {
  getValue(): V;
  setValue(value: V): void;
  update(updater: (current: V) => V): void;
}

// 이벤트 관련 제네릭
interface EventEmitter<E extends Record<string, any>> {
  on<K extends keyof E>(event: K, handler: (data: E[K]) => void): UnregisterFunction;
  emit<K extends keyof E>(event: K, data: E[K]): void;
}
```

**관련 용어**: [타입 안전성](./architecture-terms.md#타입-안전성), [제네릭 프로그래밍](#제네릭-프로그래밍)

---

## 문서 네이밍

**컨벤션**: 파일명은 kebab-case, 제목은 Title Case

**파일 네이밍 패턴**:
- **가이드**: `topic-name.md` (예: `getting-started.md`, `mvvm-architecture.md`)
- **API 참조**: `component-name.md` (예: `action-register.md`, `store-hooks.md`)
- **예제**: `example-type.md` (예: `basic-setup.md`, `advanced-patterns.md`)

**제목 컨벤션**:
```markdown
# 메인 문서 제목 (H1 - 문서 제목)
## 주요 섹션 (H2 - 메인 섹션)
### 하위 섹션 (H3 - 상세 주제)
#### 구현 세부사항 (H4 - 구체적 세부사항)

✅ 올바른 제목 구조:
# Context-Action 프레임워크 용어집
## 핵심 개념
### 액션 파이프라인 시스템
#### 파이프라인 실행 플로우

❌ 잘못된 제목 구조:
# context-action 프레임워크 용어집    # Title Case여야 함
## 핵심 개념                       # Title Case여야 함
### 액션 파이프라인 시스템             # Title Case여야 함
```

**링크 참조 네이밍**:
```markdown
# ✅ 올바름 - 설명적인 링크 참조
[액션 파이프라인 시스템][action-pipeline-system]
[스토어 통합 패턴][store-integration-pattern]
[파이프라인 컨트롤러][pipeline-controller]

[action-pipeline-system]: ./core-concepts.md#액션-파이프라인-시스템
[store-integration-pattern]: ./core-concepts.md#스토어-통합-패턴
[pipeline-controller]: ./core-concepts.md#파이프라인-컨트롤러

# ❌ 잘못됨 - 불명확한 참조
[액션 파이프라인 시스템][aps]
[스토어 통합 패턴][sip]
[파이프라인 컨트롤러][pc]
```

**관련 용어**: [문서 구조](#문서-구조), [링크 관리](#링크-관리)

---

## 검증 규칙

### 자동화된 검사

1. **네이밍 일관성**: 코드가 정해진 패턴을 따르는지 확인
2. **링크 검증**: 모든 용어집 링크가 유효한지 확인
3. **타입 정렬**: TypeScript 타입이 문서와 일치하는지 확인
4. **교차 참조 무결성**: 관련 용어 링크 검증

### 수동 검토 체크리스트

- [ ] 모든 새 클래스가 PascalCase 컨벤션을 따름
- [ ] 모든 새 인터페이스가 적절한 접미사를 가짐
- [ ] 모든 새 함수가 설명적인 동사-명사 패턴을 사용
- [ ] 모든 새 상수가 UPPER_SNAKE_CASE를 사용
- [ ] 모든 새 파일이 kebab-case 컨벤션을 따름
- [ ] 모든 새 변수가 설명적인 camelCase를 사용
- [ ] 모든 새 제네릭이 명확한 단일 문자 네이밍을 사용
- [ ] 모든 새 문서가 정해진 패턴을 따름

### 품질 표준

1. **명확성**: 이름이 즉시 이해 가능해야 함
2. **일관성**: 유사한 개념이 유사한 네이밍 패턴을 사용해야 함
3. **간결성**: 명확성을 유지하면서 가능한 한 짧아야 함
4. **검색 가능성**: 이름을 찾고 grep으로 검색하기 쉬워야 함
5. **미래 지향적**: 프레임워크 발전을 수용할 수 있는 이름이어야 함

**관련 용어**: [코드 품질](#코드-품질), [프레임워크 일관성](#프레임워크-일관성)