# 액션 파이프라인 시스템

**액션 파이프라인 시스템**은 Context-Action의 ViewModel 레이어의 핵심으로, 우선순위 기반 핸들러 실행과 정교한 파이프라인 제어를 통한 중앙집중식 액션 처리를 제공합니다.

## 핵심 개념

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
  registry: {
    debug: false,
    defaultExecutionMode: 'sequential'
  }
});
```

### 핸들러 등록

우선순위 기반 실행으로 핸들러를 등록:

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
  priority: 50,                   // 실행 우선순위
  once: false,                    // 여러 번 실행
  blocking: true,                 // 완료 대기
  condition: (payload) => payload.filename.endsWith('.pdf'), // 조건부 실행
  metadata: {                     // 사용자 정의 메타데이터
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

개별 핸들러가 실패해도 파이프라인은 계속 실행됩니다:

```typescript
actionRegister.register('processData', () => {
  throw new Error('핸들러 1 실패');
}, { priority: 100 });

actionRegister.register('processData', () => {
  return { success: true, step: '복구' };
}, { priority: 50 });

const result = await actionRegister.dispatchWithResult('processData', 
  { data: 'test' },
  { result: { collect: true } }
);

// result.success: true (파이프라인 성공)
// result.results: [{ success: true, step: '복구' }] (성공한 결과만)
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

## 다음 단계

- **[메인 패턴](./patterns)** - Action Only와 Store Only 패턴 알아보기
- **[API 참조](../api/core/action-register)** - 자세한 ActionRegister API 문서  
- **[예제](../examples/action-only)** - 실제 Action Only 패턴 보기