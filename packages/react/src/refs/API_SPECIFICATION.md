# API Specification - Universal Reference Management

Context-Action 참조 관리 시스템의 완전한 API 명세서입니다.

## 📋 타입 정의

### 기본 타입

```typescript
/**
 * 참조 가능한 모든 객체의 기본 인터페이스
 */
interface RefTarget {
  readonly [key: string]: any;
}

/**
 * 참조 객체의 현재 상태
 */
interface RefState<T extends RefTarget = RefTarget> {
  target: T | null;           // 참조 객체 (null이면 아직 마운트되지 않음)
  isReady: boolean;           // 객체가 준비되어 사용 가능한지 여부
  isMounted: boolean;         // 마운트된 상태인지 여부
  mountPromise: Promise<T> | null; // 마운트 대기를 위한 Promise
  mountedAt?: number;         // 마운트된 시간 (타임스탬프)
  objectType: 'dom' | 'three' | 'custom'; // 객체 타입
  error?: Error | null;       // 에러 상태
  metadata?: Record<string, any>; // 추가 메타데이터
}

/**
 * 참조 초기화 설정
 */
interface RefInitConfig<T extends RefTarget = RefTarget> {
  name: string;                    // 참조 이름
  objectType: 'dom' | 'three' | 'custom'; // 객체 타입
  initialMetadata?: Record<string, any>;   // 초기 메타데이터
  mountTimeout?: number;           // 마운트 타임아웃 (ms)
  autoCleanup?: boolean;          // 자동 cleanup 여부
  validator?: (target: any) => target is T; // 타입 검증 함수
  cleanup?: (target: T) => void | Promise<void>; // 커스텀 cleanup 함수
}
```

### 작업 관련 타입

```typescript
/**
 * 참조 작업 함수 타입
 */
type RefOperation<T extends RefTarget, R = any> = (
  target: T,
  options?: RefOperationOptions
) => R | Promise<R>;

/**
 * 참조 작업 옵션
 */
interface RefOperationOptions {
  timeout?: number;        // 작업 타임아웃 (ms)
  retries?: number;        // 재시도 횟수
  signal?: AbortSignal;    // 취소 신호
  priority?: number;       // 작업 우선순위
  operationId?: string;    // 작업 식별자
  metadata?: Record<string, any>; // 추가 메타데이터
}

/**
 * 참조 작업의 결과
 */
interface RefOperationResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  duration?: number;
  timestamp: number;
}
```

## 🏗️ 주요 클래스

### RefStore<T>

참조 객체를 관리하는 핵심 Store 클래스입니다.

```typescript
class RefStore<T extends RefTarget> extends Store<RefState<T>> {
  constructor(config: RefInitConfig<T>)
  
  // 핵심 메서드
  setRef(target: T | null): void                    // ref 설정 (React ref callback)
  waitForMount(): Promise<T>                        // 마운트 대기
  isReady(): boolean                               // 준비 상태 확인
  
  // 안전한 작업 실행
  withTarget<R>(
    operation: RefOperation<T, R>,
    options?: RefOperationOptions
  ): Promise<RefOperationResult<R>>
  
  // 이벤트 시스템
  addEventListener(listener: RefEventListener<T>): () => void
  
  // 리소스 정리
  cleanup(): Promise<void>
}
```

### OperationQueue

동시성 제어를 위한 작업 큐 관리자입니다.

```typescript
class OperationQueue {
  // 작업 큐에 추가
  enqueue<T extends RefTarget, R>(
    refName: string,
    target: T,
    operation: RefOperation<T, R>,
    options?: RefOperationOptions
  ): Promise<RefOperationResult<R>>
  
  // 작업 취소 및 관리
  cancelOperations(refName: string): void
  shutdown(): void
  
  // 상태 조회
  getStats(refName?: string): QueueStats | Record<string, QueueStats>
  getPendingOperationCount(refName: string): number
  isProcessing(refName: string): boolean
}
```

## 🎨 패턴별 API

### 1. 선언적 패턴 (권장)

#### createDeclarativeRefPattern

가장 강력하고 유연한 패턴으로, Context-Action의 선언적 스타일을 그대로 적용합니다.

```typescript
// Overload 1: 참조만 정의
function createDeclarativeRefPattern<R extends RefDefinitions>(
  contextName: string,
  refs: R
): DeclarativeRefContextReturn<R>

// Overload 2: 참조와 액션 통합
function createDeclarativeRefPattern<R extends RefDefinitions, A extends RefActionPayloadMap>(
  contextName: string,
  definitions: { refs: R; actions?: A }
): DeclarativeRefContextReturn<R, A>

// Overload 3: 통합 정의 객체
function createDeclarativeRefPattern<R extends RefDefinitions, A extends RefActionPayloadMap>(
  definitions: { contextName: string; refs: R; actions?: A }
): DeclarativeRefContextReturn<R, A>
```

#### 반환 객체 API

```typescript
interface DeclarativeRefContextReturn<R extends RefDefinitions, A extends RefActionPayloadMap> {
  // 핵심 컴포넌트
  Provider: React.FC<{ children: ReactNode }>
  
  // 개별 참조 관리
  useRef: <K extends keyof R>(refName: K, options?: {
    errorRecovery?: ErrorRecoveryStrategy<InferRefTypes<R>[K]>
    validateOnSet?: boolean
  }) => {
    store: RefStore<InferRefTypes<R>[K]>
    setRef: (target: InferRefTypes<R>[K] | null) => void
    ref: React.RefCallback<InferRefTypes<R>[K]>        // React ref callback
    target: InferRefTypes<R>[K] | null
    isReady: boolean
    waitForMount: () => Promise<InferRefTypes<R>[K]>
    withTarget: <Result>(
      operation: RefOperation<InferRefTypes<R>[K], Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>
    error: Error | null
    hasError: boolean
    metadata: Record<string, any>
  }
  
  // 상태 전용 접근
  useRefState: <K extends keyof R>(refName: K) => {
    target: InferRefTypes<R>[K] | null
    isReady: boolean
    isMounted: boolean
    error: Error | null
    metadata: Record<string, any>
  }
  
  // 값만 가져오기
  useRefValue: <K extends keyof R>(refName: K) => InferRefTypes<R>[K] | null
  
  // 여러 참조 동시 관리
  useRefs: <Keys extends (keyof R)[]>(...refNames: Keys) => {
    [I in keyof Keys]: {
      target: InferRefTypes<R>[Keys[I]] | null
      isReady: boolean
      ref: React.RefCallback<InferRefTypes<R>[Keys[I]]>
      setRef: (target: InferRefTypes<R>[Keys[I]] | null) => void
      withTarget: <Result>(
        operation: RefOperation<InferRefTypes<R>[Keys[I]], Result>,
        options?: RefOperationOptions
      ) => Promise<RefOperationResult<Result>>
    }
  }
  
  // 전체 참조 관리
  useRefManager: () => {
    getAllRefs: () => Partial<InferRefTypes<R>>
    getRefState: <K extends keyof R>(refName: K) => {
      target: InferRefTypes<R>[K] | null
      isReady: boolean
      isMounted: boolean
    }
    waitForRefs: <Keys extends (keyof R)[]>(...refNames: Keys) => Promise<{
      [K in Keys[number]]: K extends keyof R ? InferRefTypes<R>[K] : never
    }>
    withRefs: <Keys extends (keyof R)[], Result>(
      refNames: Keys,
      operation: (refs: {...}) => Result | Promise<Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>
  }
  
  // 액션 시스템 (선택적)
  useAction?: <K extends keyof A>(
    action: K,
    payload?: A[K],
    options?: RefOperationOptions
  ) => Promise<void>
  
  useActionHandler?: <K extends keyof A>(
    action: K,
    handler: ActionHandler<A[K]>,
    config?: any
  ) => void
}
```

### 2. 기존 패턴 (하위 호환성)

#### createRefContext

기본적인 참조 관리 패턴입니다.

```typescript
function createRefContext<T extends RefDefinitions, A extends RefActionPayloadMap>(
  contextName: string,
  refDefinitions: T
): RefContextReturn<T, A>
```

## 🛠️ 헬퍼 함수

### 참조 정의 헬퍼

```typescript
// DOM 참조 정의
function domRef<T extends Element>(config?: {
  name?: string
  tagName?: string
  validator?: TypeValidator<T>
  mountTimeout?: number
  autoCleanup?: boolean
  initialMetadata?: Record<string, any>
}): RefInitConfig<T>

// Three.js 참조 정의
function threeRef<T extends ThreeRefTarget>(config?: {
  name?: string
  expectedType?: string
  autoAddToScene?: boolean
  autoDispose?: boolean
  autoCleanupResources?: boolean
  mountTimeout?: number
  cleanup?: (target: T) => void | Promise<void>
}): RefInitConfig<T>

// 커스텀 참조 정의
function customRef<T extends RefTarget>(config: {
  name: string
  cleanup?: (target: T) => void | Promise<void>
  validator?: (target: any) => target is T
  mountTimeout?: number
  autoCleanup?: boolean
  initialMetadata?: Record<string, any>
}): RefInitConfig<T>
```

### 타입 검증 헬퍼

```typescript
// 내장 DOM 검증기
const DOMValidators = {
  HTMLElement: {
    validate: (target: unknown): target is HTMLElement
    expectedType: 'HTMLElement'
  },
  HTMLCanvasElement: {
    validate: (target: unknown): target is HTMLCanvasElement
    expectedType: 'HTMLCanvasElement'
  },
  HTMLInputElement: {
    validate: (target: unknown): target is HTMLInputElement
    expectedType: 'HTMLInputElement'
  },
  HTMLDivElement: {
    validate: (target: unknown): target is HTMLDivElement
    expectedType: 'HTMLDivElement'
  }
} as const
```

## 🔧 에러 처리

### RefError 클래스

```typescript
enum RefErrorCode {
  REF_NOT_FOUND = 'REF_NOT_FOUND',
  MOUNT_TIMEOUT = 'MOUNT_TIMEOUT',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  INVALID_TARGET = 'INVALID_TARGET',
  OPERATION_FAILED = 'OPERATION_FAILED',
  TYPE_VALIDATION_FAILED = 'TYPE_VALIDATION_FAILED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND'
}

class RefError extends Error {
  constructor(
    message: string,
    public code: RefErrorCode,
    public refName: string,
    public operation?: string,
    public cause?: Error
  )
  
  toJSON(): object
}
```

### 에러 복구 전략

```typescript
interface ErrorRecoveryStrategy<T extends RefTarget = RefTarget> {
  strategy: 'retry' | 'fallback' | 'fail'
  maxRetries?: number
  retryDelay?: number
  fallbackValue?: T | (() => T | Promise<T>)
  onError?: (error: RefError) => void
}
```

## 📊 이벤트 시스템

### RefEvent

```typescript
interface RefEvent<T extends RefTarget = RefTarget> {
  type: 'mount' | 'unmount' | 'error' | 'ready' | 'cleanup'
  refName: string
  target?: T
  error?: Error
  timestamp: number
  metadata?: Record<string, any>
}

type RefEventListener<T extends RefTarget = RefTarget> = (event: RefEvent<T>) => void
```

## 🎯 동시성 제어

### Queue Stats

```typescript
interface QueueStats {
  pending: number          // 대기 중인 작업 수
  processing: number       // 처리 중인 작업 수
  completed: number        // 완료된 작업 수
  failed: number          // 실패한 작업 수
  totalProcessingTime: number     // 총 처리 시간
  averageProcessingTime: number   // 평균 처리 시간
}
```

### 우선순위 시스템

작업 우선순위는 숫자로 지정하며, 높은 숫자가 먼저 실행됩니다:

- **10**: 긴급 (사용자 상호작용)
- **5**: 높음 (중요한 업데이트)
- **0**: 보통 (기본값)
- **-5**: 낮음 (백그라운드 작업)

## 🔗 Context-Action 통합

### Action Context Integration

```typescript
interface RefActionPayloadMap extends ActionPayloadMap {
  // 기본 참조 액션
  mount: { refName: string; target: RefTarget }
  unmount: { refName: string }
  cleanup: { refName: string }
  reset: { refName: string }
  
  // 에러 처리
  handleError: { refName: string; error: Error }
  retry: { refName: string; maxRetries?: number }
}

interface RefActionContext<T extends RefDefinitions> {
  getRef: <K extends keyof T>(refName: K) => Promise<InferRefTypes<T>[K]>
  isRefReady: <K extends keyof T>(refName: K) => boolean
  getAllRefStates: () => Record<keyof T, RefState<any>>
  withRef: <K extends keyof T, R>(
    refName: K,
    operation: RefOperation<InferRefTypes<T>[K], R>,
    options?: RefOperationOptions
  ) => Promise<RefOperationResult<R>>
  withRefs: <R>(
    refNames: (keyof T)[],
    operation: (refs: Partial<InferRefTypes<T>>) => R | Promise<R>,
    options?: RefOperationOptions
  ) => Promise<RefOperationResult<R>>
}
```

## 📝 사용 패턴

### 기본 사용법

```typescript
// 1. 참조 정의
const refs = createDeclarativeRefPattern('MyComponent', {
  element: domRef<HTMLDivElement>(),
  canvas: domRef<HTMLCanvasElement>({ 
    mountTimeout: 5000,
    autoCleanup: true 
  })
});

// 2. 컴포넌트에서 사용
function MyComponent() {
  const element = refs.useRef('element');
  const canvasValue = refs.useRefValue('canvas');
  
  // 3. 안전한 작업 수행
  const handleClick = async () => {
    await element.withTarget((div) => {
      div.textContent = 'Clicked!';
    });
  };
  
  return (
    <refs.Provider>
      <div ref={element.ref} onClick={handleClick} />
      <canvas ref={refs.useRef('canvas').ref} />
    </refs.Provider>
  );
}
```

### 고급 사용법

```typescript
// 에러 복구와 함께
const element = refs.useRef('element', {
  errorRecovery: {
    strategy: 'retry',
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => console.error('Ref error:', error)
  },
  validateOnSet: true
});

// 여러 참조 동시 작업
const [div, canvas] = refs.useRefs('element', 'canvas');

// 참조 관리자 사용
const refManager = refs.useRefManager();
const allRefs = await refManager.waitForRefs('element', 'canvas');
```

## ⚡ 성능 최적화

### 메모이제이션

- 모든 hook은 적절한 의존성 배열로 메모이제이션됨
- `useMemo`, `useCallback` 최적화로 불필요한 리렌더링 방지
- 상태 구독은 `useSyncExternalStore` 사용

### 배치 처리

- 여러 작업을 한 번에 처리하는 배치 API 제공
- 우선순위 큐로 중요한 작업 우선 처리
- 동시성 제어로 성능과 안정성 균형

### 메모리 관리

- 자동 cleanup으로 메모리 누수 방지
- WeakMap 기반 참조 추적
- 이벤트 리스너 자동 정리

## 🧪 타입 안전성

### 완전한 타입 추론

```typescript
// 타입 어노테이션 없이도 완벽한 추론
const refs = createDeclarativeRefPattern('App', {
  input: domRef<HTMLInputElement>(),    // HTMLInputElement로 추론
  canvas: domRef<HTMLCanvasElement>(),  // HTMLCanvasElement로 추론
  scene: threeRef<THREE.Scene>()        // THREE.Scene으로 추론
});

const input = refs.useRef('input');     // input.target: HTMLInputElement | null
const canvas = refs.useRefValue('canvas'); // HTMLCanvasElement | null
```

### 런타임 검증

```typescript
// 타입 검증과 함께
const refs = createDeclarativeRefPattern('App', {
  canvas: domRef<HTMLCanvasElement>({
    validator: DOMValidators.HTMLCanvasElement,
    tagName: 'canvas'  // 추가 검증
  })
});
```

## 🔍 디버깅 및 모니터링

### 개발 모드 기능

- 상세한 마운트/언마운트 로깅
- 작업 큐 상태 실시간 모니터링
- 메모리 사용량 추적
- 성능 메트릭 수집

### 프로덕션 모드 최적화

- 로깅 최소화
- 메모리 사용량 최적화
- 에러만 필수 정보로 보고