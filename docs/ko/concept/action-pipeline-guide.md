# Context-Action 액션 파이프라인 시스템 가이드

Context-Action 프레임워크의 핵심인 액션 파이프라인 시스템에 대한 포괄적인 가이드입니다.

## 개요

액션 파이프라인 시스템은 Context-Action의 ViewModel 레이어의 핵심으로, 우선순위 기반 핸들러 실행과 정교한 파이프라인 제어를 통한 중앙집중식 액션 처리를 제공합니다.

## 핵심 구성 요소

### ActionRegister

`ActionRegister` 클래스는 액션 파이프라인 시스템의 핵심입니다:

```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface MyActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any; options?: Record<string, any> };
  uploadFile: { filename: string; content: string };
}

const actionRegister = new ActionRegister<MyActions>({
  name: 'MyAppActions',
  actions: {
    authenticate: { queue: 'serial', timeout: 5000 },
  },
  registry: {
    debug: false,
    autoCleanup: true,
    defaultExecutionMode: 'sequential',
    maxJumps: 10,
    errorHandler: (error, context) => {
      console.error('처리되지 않은 액션 오류:', error.message, context);
    },
  },
});
```

### 2단계 디스패치 엔진과 컴파일된 파이프라인 캐시

`ActionRegister`는 첫 디스패치 시 액션별 `CompiledActionPipeline`(`guards`, `nonGuards`, `results`, `observers`, `hasOnce`, `debounceMs`/`throttleMs`)을 지연 컴파일해 캐싱하며, 핸들러 등록·교체·제거·초기화(`register*`, `unregister`, `clearAction`, `clearAll`) 시점에만 캐시를 무효화합니다.

```text
dispatch() / dispatchWithResult() / actions.* Proxy
   │
   ├─ 기본 순차 dispatch() Fast Path 진입 조건 충족 시:
   │    trace 리스너 없음 · options 없음 · 큐 비활성 · 스키마 검증 없음 ·
   │    guard/observer/debounce/throttle/once 없음 · mode='sequential'
   │    └─► Fast Sequential Path (dispatchFastSequential → continueFastSequentialAsync)
   │          • PipelineContext / outcome / AbortController 할당 생략
   │          • 첫 Promise 반환 시 동기 루프 → 비동기 루프로 무중단 전이
   │          • 중단/종료 시 취소 처리, condition Error 정규화,
   │            원본 payload errorHandler 전달, .then getter 예외 방어 모두 Slow Path와 동일 보장
   │
   └─► Full Orchestration Path (_dispatchWithResult):
        Admission (스키마 검증 + ActionGuard) ─► OperationQueue ─► Guard Preflight ─►
        재시도 루프 (executeWithRetry) ─► 실행 모드 (sequential/parallel/race) ─►
        결과 집계 (processResults) ─► Terminal Observers ─► Trace 정산
```

### 역할(Role) 기반 등록 API와 컨트롤러 표면

프로덕션 파이프라인에서는 역할별 등록 메서드를 사용해 검증, 부수효과, 결과 생성, 후행 관찰을 명확히 분리하는 것을 권장합니다:

| 역할(Role) | 등록 메서드 | 실행 단계 | 컨트롤러 노출 멤버 (`createRoleController`) | 결과 참여 |
|---|---|---|---|---|
| `guard` | `registerGuard` | Preflight (`sequential`, `fatal` 고정) | `signal`, `getPayload`, `modifyPayload`, `abort` | 불가 |
| `command` | `registerCommand` | 본 파이프라인 (Phase 2 `void` 부수효과) | `signal`, `getPayload`, `abort` | 불가 |
| `result` | `registerResult` | 본 파이프라인 (`TResultMap` 결과 반환) | `signal`, `getPayload`, `abort`, `return`, `setResult`, `getResults`, `mergeResult` | 참여 |
| `legacy` | `register` | 본 파이프라인 (1.x 호환 범용) | 위 전부 + `modifyPayload`, `jumpToPriority` | 참여 |
| `observer` | `registerObserver` | Settlement (최종 불변 스냅샷 수신) | 컨트롤러 없음 (`ActionObserverEvent` 전달) | 불가 |

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  isActionTimeoutError,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';

interface OrderActions extends ActionPayloadMap {
  submitOrder: { orderId: string; valid: boolean };
  audit: { orderId: string };
}

interface OrderResults extends ActionResultMap<OrderActions> {
  submitOrder: { receiptId: string };
}

const register = new ActionRegister<OrderActions, OrderResults>({
  name: 'OrderPipeline',
  actions: {
    submitOrder: { queue: 'serial', timeout: 5000 },
    audit: { queue: 'immediate' },
  },
  registry: {
    errorHandler: (error, context) => {
      console.error('디스패치 오류:', error.message, context);
    },
  },
});

const stopTrace = register.subscribeDispatchTrace(event => {
  console.info(event.dispatchId, event.phase, event.status);
});

// 1. 사전 검증 Guard (항상 순차/fatal)
register.registerGuard('submitOrder', payload => {
  if (!payload.valid) throw new Error('유효하지 않은 주문 페이로드');
}, { id: 'guard-valid' });

// 2. Phase 2 void Command (결과 경합에 참여하지 않는 부수효과)
register.registerCommand('submitOrder', payload => {
  console.info('감사 의도 기록:', payload.orderId);
}, { id: 'command-audit', priority: 20 });

// 3. 타입 지정 Result 핸들러
register.registerResult('submitOrder', async payload => {
  await Promise.resolve();
  return { receiptId: `rcpt-${payload.orderId}` };
}, { id: 'result-receipt', scheduling: 'await-before-next', errorPolicy: 'fatal' });

// 4. 사후 Observer (불변 스냅샷 수신)
register.registerObserver('submitOrder', event => {
  console.info('정산 결과:', event.outcome, event.result);
}, { when: 'always' });

async function submit() {
  try {
    const execution = await register.dispatchWithResult('submitOrder', {
      orderId: 'ORD-1',
      valid: true,
    });
    console.info(execution.outcome, execution.result);
  } catch (error) {
    if (isActionTimeoutError(error)) {
      console.warn('타임아웃(ms):', error.timeout);
    }
  } finally {
    stopTrace();
    await register.destroyAsync();
  }
}

void submit;
```

### 핸들러 등록

우선순위 기반 실행으로 핸들러를 등록합니다:

```typescript
// 높은 우선순위 핸들러가 먼저 실행 (priority 100 > 50 > 10)
actionRegister.register('authenticate', validateCredentials, { priority: 100 });
actionRegister.register('authenticate', checkRateLimit, { priority: 90 });
actionRegister.register('authenticate', performAuth, { priority: 80 });
actionRegister.register('authenticate', logAudit, { priority: 70 });
```

### 파이프라인 컨트롤러

각 핸들러는 고급 파이프라인 관리를 위한 `PipelineController`를 받습니다:

```typescript
actionRegister.register('authenticate', async (payload, controller) => {
  // 1. 입력 검증
  if (!payload.username) {
    controller.abort('사용자명이 필요합니다');
    return;
  }
  
  // 2. 후속 핸들러를 위한 페이로드 수정
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    validated: true
  }));
  
  // 3. 중간 결과 설정
  controller.setResult({ step: '검증', success: true });
  
  // 4. 최종 결과 반환
  return { validated: true, user: payload.username };
});
```

## 우선순위 기반 실행

### 실행 순서

핸들러는 **내림차순 우선순위 순서**로 실행됩니다 (가장 높은 것부터):

```typescript
const executionOrder: string[] = [];

actionRegister.register('processData', () => {
  executionOrder.push('낮음');    // Priority: 10
}, { priority: 10 });

actionRegister.register('processData', () => {
  executionOrder.push('높음');   // Priority: 100  
}, { priority: 100 });

actionRegister.register('processData', () => {
  executionOrder.push('중간'); // Priority: 50
}, { priority: 50 });

await actionRegister.dispatch('processData', { data: 'test' });
// executionOrder: ['높음', '중간', '낮음']
```

### 핸들러 설정

```typescript
actionRegister.register('uploadFile', handler, {
  id: 'file-processor',           // 고유 식별자
  priority: 50,                   // 실행 우선순위 (높을수록 먼저)
  once: false,                    // 등록당 최대 1회 실행
  scheduling: 'await-before-next',// 'await-before-next' | 'start-and-continue'
  errorPolicy: 'collect',         // 'collect' (기본값, 비차단 수집) | 'fatal' (즉시 중단)
  blocking: true,                 // 1.x 호환 단축 옵션 (true -> await-before-next + fatal)
  debounce: 300,                  // 디바운스 지연 (ms)
  throttle: 1000,                 // 스로틀 간격 (ms)
  replaceExisting: true,          // 동일 ID 핸들러 교체 (기본값: true)
  cleanup: () => {},              // 등록 해제 또는 destroyAsync 완료 시 정리 콜백
  condition: (payload) => payload.filename.endsWith('.pdf'), // 조건부 실행
  metadata: {                     // 실행 결과에 복사되는 진단 메타데이터
    description: 'PDF 파일 처리기',
    version: '1.0.0'
  }
});
```

## 파이프라인 제어 메서드

### controller.abort()

선택적 이유와 함께 파이프라인 실행 중단:

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!isValidUser(payload.username)) {
    controller.abort('유효하지 않은 사용자 자격 증명');
    return;
  }
  // 후속 핸들러는 실행되지 않음
});
```

### controller.modifyPayload()

후속 핸들러를 위한 페이로드 변환:

```typescript
actionRegister.register('processData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    processed: true,
    timestamp: Date.now(),
    version: '2.0'
  }));
}, { priority: 100 });

actionRegister.register('processData', (payload) => {
  // payload에 이제 processed, timestamp, version이 포함됨
  console.log(payload.processed); // true
}, { priority: 50 });
```

### controller.setResult() 및 getResults()

핸들러 간 중간 결과 관리:

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // 중간 결과 설정
  controller.setResult({ step: '검증', fileSize: 1024 });
  
  return { step: '업로드', fileId: 'file-123' };
}, { priority: 100 });

actionRegister.register('uploadFile', (payload, controller) => {
  // 이전 결과 접근
  const previousResults = controller.getResults();
  console.log(previousResults); 
  // [{ step: '검증', fileSize: 1024 }, { step: '업로드', fileId: 'file-123' }]
}, { priority: 50 });
```

## 실행 모드

### 순차 모드 (기본값)

핸들러가 차례대로 실행:

```typescript
actionRegister.setActionExecutionMode('processData', 'sequential');

// 핸들러 1 완료 → 핸들러 2 시작 → 핸들러 3 시작
```

### 병렬 모드

모든 핸들러가 동시에 실행:

```typescript
actionRegister.setActionExecutionMode('processData', 'parallel');

// 핸들러 1, 2, 3이 모두 동시에 시작
```

### 경쟁 모드

첫 번째 완료 핸들러가 승리:

```typescript
actionRegister.setActionExecutionMode('processData', 'race');

// 처음 반환하는 핸들러가 나머지를 중단
```

## 결과 수집

### 기본 디스패치

```typescript
const result = await actionRegister.dispatch('authenticate', {
  username: 'john',
  password: 'secret123'
});
```

### 결과 수집을 통한 디스패치

```typescript
const result = await actionRegister.dispatchWithResult('uploadFile', 
  { filename: 'document.pdf', content: 'pdf 내용' },
  { result: { collect: true } }
);

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: '검증', success: true },
//     { step: '업로드', fileId: 'file-123' },
//     { step: '알림', sent: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## 에러 처리

기본 정책(`errorPolicy: 'collect'`, 생략 시 기본값)에서는 개별 핸들러가 예외를 던져도 오류를 수집하고 후속 핸들러가 계속 실행됩니다(`outcome: 'completed_with_errors'`). 치명적 실패로 즉시 중단하려면 `errorPolicy: 'fatal'`(또는 호환 단축 옵션 `blocking: true`)을 지정하세요. 이 경우 `registry.errorHandler`가 **원본 디스패치 `payload`**와 함께 호출되며 `dispatch()`는 reject되고 `dispatchWithResult()`는 `outcome: 'failed'`를 반환합니다. (`registerGuard`는 항상 `fatal`로 동작합니다.)

```typescript
actionRegister.register('processData', () => {
  throw new Error('핸들러 1 실패 (collect)');
}, { priority: 100 }); // errorPolicy 기본값: 'collect'

actionRegister.register('processData', () => {
  return { success: true, step: '복구' };
}, { priority: 50 });

const result = await actionRegister.dispatchWithResult('processData',
  { data: 'test' },
  { result: { collect: true } }
);

// result.success: true, result.outcome: 'completed_with_errors'
// result.results: [{ success: true, step: '복구' }]
// result.errors / result.failedResults에서 핸들러 1 오류 확인 가능
```

## 실제 예제: 인증 플로우

```typescript
interface AuthActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
}

const authRegister = new ActionRegister<AuthActions>();

// 1. 입력 검증 (Priority: 100)
authRegister.register('authenticate', (payload, controller) => {
  if (!payload.username || !payload.password) {
    controller.abort('자격 증명 누락');
    return;
  }
  return { step: '검증', valid: true };
}, { priority: 100, id: 'validator' });

// 2. 속도 제한 (Priority: 90)
authRegister.register('authenticate', (payload) => {
  // 속도 제한 확인
  return { step: '속도제한', allowed: true };
}, { priority: 90, id: 'rate-limiter' });

// 3. 인증 (Priority: 80)
authRegister.register('authenticate', async (payload) => {
  const user = await authenticateUser(payload.username, payload.password);
  return { 
    step: '인증', 
    user: { id: user.id, username: user.username },
    token: generateJWT(user)
  };
}, { priority: 80, id: 'authenticator' });

// 4. 감사 로깅 (Priority: 70)
authRegister.register('authenticate', (payload) => {
  logAuthAttempt(payload.username, true);
  return { step: '감사', logged: true, timestamp: Date.now() };
}, { priority: 70, id: 'auditor' });

// 완전한 인증 파이프라인 실행
const result = await authRegister.dispatchWithResult('authenticate', {
  username: 'john',
  password: 'secret123'
}, { result: { collect: true } });

// 결과에 모든 단계 포함: 검증 → 속도제한 → 인증 → 감사
```

## React와의 통합

액션 파이프라인은 액션 컨텍스트 패턴을 통해 React와 원활하게 통합됩니다:

```typescript
const { Provider, useActionDispatch, useActionHandler } = createActionContext<AuthActions>('Auth');

function AuthComponent() {
  const dispatch = useActionDispatch();
  
  // 컴포넌트에서 핸들러 등록
  useActionHandler('authenticate', async (payload) => {
    // 인증 처리
  });
  
  const handleLogin = async () => {
    await dispatch('authenticate', { username: 'john', password: 'secret' });
  };
  
  return <button onClick={handleLogin}>로그인</button>;
}
```

## 핵심 정책 · 추적 · 종료 API

- **액션별 정책 (`ActionRegisterConfig.actions`)**: 액션별로 `queue?: 'serial' | 'immediate'`와 `timeout?: number` 기본값을 선언하고, 호출부 `DispatchOptions`로 덮어쓸 수 있습니다.
- **디스패치 수명주기 추적 (`subscribeDispatchTrace`)**: 모든 공개 `dispatch` / `dispatchWithResult`의 `started`와 `settled`(`completed` | `completed_with_errors` | `failed` | `cancelled` | `debounced` | `throttled`) 이벤트를 구독해 트랜잭션 브리지와 연동합니다.
- **우아한 종료 (`destroy` / `destroyAsync`)**: 호출 즉시 신규 등록과 디스패치를 `ActionRegisterDestroyedError`로 차단하고, 이미 시작된 디스패치와 핸들러가 모두 정산될 때까지 drain한 뒤 등록된 `cleanup` 콜백을 실행합니다(`destroyAsync({ deferCleanup: true })` 지원).

## 모범 사례

1. **역할 분리**: 검증은 `registerGuard`, 부수효과는 `registerCommand`, 타입 결과는 `registerResult`, 로깅·트랜잭션 정산은 `registerObserver`로 분리
2. **우선순위 및 정책 설계**: 논리적 실행 순서에 따라 우선순위를 부여하고 `scheduling`과 `errorPolicy`를 명시
3. **에러 및 타임아웃 처리**: 치명적 실패는 `errorPolicy: 'fatal'` + `registry.errorHandler`로, 타임아웃은 `isActionTimeoutError()`로 일관 처리
4. **레지스터 인스턴스 재사용**: `CompiledActionPipeline` 캐시와 `actions` Proxy 캐시를 유지해 Fast Path 이점을 극대화
5. **타입 안전성 및 종료 보장**: `ActionPayloadMap` / `ActionResultMap`을 정의하고 종료 시 `destroyAsync()`로 백그라운드 작업을 안전하게 drain