# ActionRegister API

`ActionRegister` 클래스는 Context-Action의 액션 파이프라인 시스템의 핵심으로, 우선순위 기반 핸들러 실행을 통한 중앙 집중식 액션 처리를 제공합니다.

## 임포트

```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
```

## 생성자

### `new ActionRegister<T>(config?)`

새로운 ActionRegister 인스턴스를 생성합니다.

**타입 매개변수:**
- `T extends ActionPayloadMap` - 액션 타입 정의

**매개변수:**
- `config?` - 선택적 설정 객체

```typescript
interface ActionRegisterConfig {
  name?: string;                    // 디버깅을 위한 인스턴스 이름
  registry?: {
    debug?: boolean;               // 디버그 로깅 활성화
    defaultExecutionMode?: 'sequential' | 'parallel' | 'race';
    maxHandlers?: number;          // 액션당 최대 핸들러 수
    autoCleanup?: boolean;         // 언마운트 시 자동 정리
  };
}
```

**예제:**
```typescript
interface MyActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any };
}

const actionRegister = new ActionRegister<MyActions>({
  name: 'MyAppActions',
  registry: {
    debug: false,
    defaultExecutionMode: 'sequential',
    maxHandlers: 10
  }
});
```

## 등록 메서드

### `register(action, handler, config?)`

선택적 설정으로 액션 핸들러를 등록합니다.

**매개변수:**
- `action: keyof T` - 액션 이름
- `handler: ActionHandler<T[action]>` - 핸들러 함수
- `config?: HandlerConfig` - 핸들러 설정

**반환값:** `() => void` - 등록 해제 함수

```typescript
interface HandlerConfig {
  id?: string;                     // 고유 핸들러 식별자
  priority?: number;               // 실행 우선순위 (기본값: 1000)
  once?: boolean;                  // 한 번만 실행 (기본값: false)
  blocking?: boolean;              // 완료까지 차단 (기본값: true)
  condition?: (payload) => boolean; // 조건부 실행
  metadata?: Record<string, any>;  // 커스텀 메타데이터
}

type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => any | Promise<any>;
```

**예제:**
```typescript
// 기본 등록
const unregister = actionRegister.register('authenticate', async (payload) => {
  return await authService.login(payload.username, payload.password);
});

// 설정과 함께 등록
actionRegister.register('authenticate', validateInput, {
  id: 'input-validator',
  priority: 100,
  once: false,
  condition: (payload) => payload.username.length > 0
});

// 핸들러 등록 해제
unregister();
```

### `hasHandlers(action)`

액션에 등록된 핸들러가 있는지 확인합니다.

**매개변수:**
- `action: keyof T` - 액션 이름

**반환값:** `boolean`

```typescript
const hasAuthHandlers = actionRegister.hasHandlers('authenticate');
// 반환값: 핸들러가 있으면 true, 없으면 false
```

### `getHandlerCount(action)`

액션에 등록된 핸들러의 수를 가져옵니다.

**매개변수:**
- `action: keyof T` - 액션 이름  

**반환값:** `number`

```typescript
const handlerCount = actionRegister.getHandlerCount('authenticate');
// 반환값: 등록된 핸들러 수
```

### `getRegisteredActions()`

등록된 모든 액션 이름의 목록을 가져옵니다.

**반환값:** `Array<keyof T>`

```typescript
const actions = actionRegister.getRegisteredActions();
// 반환값: ['authenticate', 'processData', ...]
```

### `clearAll()`

모든 액션의 등록된 핸들러를 모두 제거합니다.

**반환값:** `void`

```typescript
actionRegister.clearAll();
```

## 디스패치 메서드

### `dispatch(action, payload?, options?)`

선택적 페이로드와 옵션으로 액션을 디스패치합니다.

**매개변수:**
- `action: keyof T` - 액션 이름
- `payload?: T[action]` - 액션 페이로드
- `options?: DispatchOptions` - 디스패치 옵션

**반환값:** `Promise<any>` - 마지막으로 실행된 핸들러의 결과

```typescript
interface DispatchOptions {
  executionMode?: 'sequential' | 'parallel' | 'race';
  timeout?: number;              // 밀리초 단위 타임아웃
  signal?: AbortSignal;          // 중단 신호
}
```

**예제:**
```typescript
// 기본 디스패치
await actionRegister.dispatch('authenticate', {
  username: 'john',
  password: 'secret123'
});

// 옵션과 함께 디스패치
await actionRegister.dispatch('processData', { data: 'test' }, {
  executionMode: 'parallel',
  timeout: 5000
});
```

### `dispatchWithResult(action, payload?, options?)`

액션을 디스패치하고 상세한 실행 결과를 가져옵니다.

**매개변수:**
- `action: keyof T` - 액션 이름
- `payload?: T[action]` - 액션 페이로드  
- `options?: DispatchResultOptions` - 결과 수집을 포함한 디스패치 옵션

**반환값:** `Promise<DispatchResult>` - 상세 실행 결과

```typescript
interface DispatchResultOptions extends DispatchOptions {
  result?: {
    collect?: boolean;           // 모든 핸들러에서 결과 수집
  };
}

interface DispatchResult {
  success: boolean;              // 전체 실행 성공 여부
  aborted: boolean;              // 파이프라인이 중단되었는지
  terminated: boolean;           // 파이프라인이 조기 종료되었는지
  result?: any;                  // 최종 결과
  results?: any[];              // 수집된 모든 결과
  abortReason?: string;          // 중단된 경우 중단 이유
  execution: {
    handlersExecuted: number;    // 실행된 핸들러 수
    startTime: number;           // 시작 타임스탬프
    endTime: number;             // 종료 타임스탬프
    duration: number;            // 실행 지속 시간 (ms)
  };
}
```

**예제:**
```typescript
const result = await actionRegister.dispatchWithResult('authenticate', {
  username: 'john',
  password: 'secret123'
}, {
  result: { collect: true }
});

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: 'validation', valid: true },
//     { step: 'authentication', user: { id: 1, username: 'john' } },
//     { step: 'audit', logged: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## 실행 모드 메서드

### `setActionExecutionMode(action, mode)`

특정 액션의 실행 모드를 설정합니다.

**매개변수:**
- `action: keyof T` - 액션 이름
- `mode: 'sequential' | 'parallel' | 'race'` - 실행 모드

**반환값:** `void`

```typescript
actionRegister.setActionExecutionMode('processData', 'parallel');
```

### `getActionExecutionMode(action)`

특정 액션의 실행 모드를 가져옵니다.

**매개변수:**
- `action: keyof T` - 액션 이름

**반환값:** `'sequential' | 'parallel' | 'race'`

```typescript
const mode = actionRegister.getActionExecutionMode('processData');
// 반환값: 'parallel'
```

### `removeActionExecutionMode(action)`

실행 모드 오버라이드를 제거하여 기본값으로 되돌립니다.

**매개변수:**
- `action: keyof T` - 액션 이름

**반환값:** `void`

```typescript
actionRegister.removeActionExecutionMode('processData');
// 기본 실행 모드로 되돌림
```

## 통계 메서드

### `getActionStats(action)`

특정 액션의 상세 통계를 가져옵니다.

**매개변수:**
- `action: keyof T` - 액션 이름

**반환값:** `ActionStats | null`

```typescript
interface ActionStats {
  action: keyof T;
  handlerCount: number;
  handlersByPriority: Array<{
    priority: number;
    handlers: Array<{
      id?: string;
      metadata?: Record<string, any>;
    }>;
  }>;
}
```

**예제:**
```typescript
const stats = actionRegister.getActionStats('authenticate');
// 반환값: { action: 'authenticate', handlerCount: 3, handlersByPriority: [...] }
```

## 파이프라인 컨트롤러

고급 파이프라인 제어를 위해 각 핸들러에 `PipelineController`가 제공됩니다:

### `controller.abort(reason?)`

선택적 이유와 함께 파이프라인 실행을 중단합니다.

**매개변수:**
- `reason?: string` - 중단 이유

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('사용자명이 필요합니다');
    return;
  }
});
```

### `controller.modifyPayload(modifier)`

후속 핸들러를 위해 페이로드를 수정합니다.

**매개변수:**
- `modifier: (current) => T[action]` - 페이로드 수정 함수

```typescript
actionRegister.register('processData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    processed: true
  }));
});
```

### `controller.getPayload()`

현재 페이로드(수정사항 포함)를 가져옵니다.

**반환값:** `T[action]` - 현재 페이로드

```typescript
actionRegister.register('processData', (payload, controller) => {
  const currentPayload = controller.getPayload();
  console.log(currentPayload); // 모든 수정사항 포함
});
```

### `controller.setResult(result)`

후속 핸들러가 액세스할 수 있는 중간 결과를 설정합니다.

**매개변수:**
- `result: any` - 결과 값

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  controller.setResult({ step: 'validation', success: true });
  return { step: 'upload', fileId: 'file-123' };
});
```

### `controller.getResults()`

이전 핸들러들의 모든 결과를 가져옵니다.

**반환값:** `any[]` - 이전 결과 배열

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  const previousResults = controller.getResults();
  // 모든 이전 핸들러의 결과에 액세스
});
```

### `controller.return(value)`

반환값과 함께 파이프라인 실행을 조기 종료합니다.

**매개변수:**
- `value: any` - 반환값

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (isAlreadyAuthenticated()) {
    controller.return({ alreadyAuthenticated: true });
    return; // 후속 핸들러는 실행되지 않음
  }
});
```

## 에러 처리

ActionRegister는 우아한 에러 처리를 제공합니다:

- **핸들러 에러**: 개별 핸들러 실패가 파이프라인을 중지하지 않음
- **파이프라인 계속**: 나머지 핸들러는 계속 실행됨
- **에러 수집**: 에러는 로그되지만 결과에 나타나지 않음
- **성공 상태**: 최소 하나의 핸들러가 성공하면 파이프라인 성공

```typescript
actionRegister.register('processData', () => {
  throw new Error('이 핸들러는 실패합니다');
}, { priority: 100 });

actionRegister.register('processData', () => {
  return { success: true }; // 이 핸들러는 성공
}, { priority: 50 });

const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });
// result.success: true (한 핸들러가 실패했음에도 파이프라인 성공)
```

## TypeScript 통합

ActionRegister는 완전한 TypeScript 지원을 제공합니다:

```typescript
interface AppActions extends ActionPayloadMap {
  // void 액션 (페이로드 없음)
  logout: void;
  
  // 객체 페이로드
  updateUser: { id: string; name: string; email: string };
  
  // 원시 페이로드
  setTheme: 'light' | 'dark';
  
  // 선택적 속성
  trackEvent: { event: string; data?: any };
}

const register = new ActionRegister<AppActions>();

// 타입 검사 강제
register.dispatch('updateUser', {
  id: '123',
  name: 'John',
  email: 'john@example.com'
}); // ✅ 유효

register.dispatch('updateUser', {
  id: '123'
  // name과 email 누락
}); // ❌ TypeScript 에러

register.dispatch('setTheme', 'blue'); // ❌ TypeScript 에러 - 잘못된 테마
```

## 예제

ActionRegister 사용 패턴의 완전한 작동 예제는 [예제 섹션](../../examples/action-only.md)을 참조하세요.

## 관련 자료

- **[파이프라인 컨트롤러 API](./pipeline-controller.md)** - 파이프라인 제어 메서드
- **[액션 컨텍스트](../react/action-context.md)** - React 통합
- **[액션 파이프라인 가이드](../../guide/action-pipeline.md)** - 상세 사용 가이드