# 액션 레지스트리 API

액션 등록, 실행, 파이프라인 제어를 관리하는 액션 레지스트리 시스템의 완전한 API 레퍼런스입니다.

## 개요

액션 레지스트리는 액션 핸들러를 관리하고, 액션 파이프라인을 실행하며, 고급 제어 플로우를 제공하는 핵심 시스템입니다. Action Only 패턴의 기반이며 모든 액션 디스패치 로직을 처리합니다.

## 핵심 레지스트리 메서드

### `actionRegistry.register(actionName, handler, options?)`

지정된 옵션으로 액션 핸들러를 등록합니다.

**매개변수:**
- `actionName`: 처리할 액션의 이름
- `handler`: 핸들러 함수
- `options`: 핸들러 설정 옵션

**반환값:** 등록 해제 함수

```typescript
// 저수준 등록 (일반적으로 useActionHandler를 통해 수행)
const unregister = actionRegistry.register('updateUser', 
  async (payload, controller) => {
    // 핸들러 로직
    return { success: true };
  },
  { priority: 100, id: 'user-updater' }
);

// 정리
unregister();
```

### `actionRegistry.unregister(actionName, handlerId)`

액션의 특정 핸들러를 등록 해제합니다.

**매개변수:**
- `actionName`: 액션의 이름
- `handlerId`: 제거할 핸들러의 ID

**반환값:** `boolean` - 성공 상태

```typescript
const success = actionRegistry.unregister('updateUser', 'user-updater');
console.log('핸들러 제거됨:', success);
```

### `actionRegistry.dispatch(actionName, payload)`

등록된 모든 핸들러에 액션을 디스패치합니다.

**매개변수:**
- `actionName`: 디스패치할 액션의 이름
- `payload`: 액션 페이로드 데이터

**반환값:** `Promise<ActionResult[]>`

```typescript
// 직접 디스패치 (일반적으로 useActionDispatch를 통해 수행)
const results = await actionRegistry.dispatch('updateUser', {
  id: '123',
  name: '홍길동'
});
```

## 핸들러 관리

### `actionRegistry.getHandlers(actionName)`

특정 액션에 등록된 모든 핸들러를 가져옵니다.

**매개변수:**
- `actionName`: 액션의 이름

**반환값:** 핸들러 정보 배열

```typescript
function HandlerInspector() {
  const dispatch = useActionDispatch();
  
  const inspectHandlers = () => {
    const handlers = actionRegistry.getHandlers('updateUser');
    console.log('등록된 핸들러:', handlers.map(h => ({
      id: h.id,
      priority: h.priority
    })));
  };
  
  return <button onClick={inspectHandlers}>핸들러 검사</button>;
}
```

### `actionRegistry.getActionNames()`

등록된 모든 액션 이름을 가져옵니다.

**반환값:** `string[]`

```typescript
function ActionList() {
  const actionNames = actionRegistry.getActionNames();
  
  return (
    <div>
      <h3>사용 가능한 액션:</h3>
      <ul>
        {actionNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### `actionRegistry.hasAction(actionName)`

액션에 등록된 핸들러가 있는지 확인합니다.

**매개변수:**
- `actionName`: 확인할 액션의 이름

**반환값:** `boolean`

```typescript
function ActionChecker() {
  const checkAction = (actionName: string) => {
    const hasHandlers = actionRegistry.hasAction(actionName);
    console.log(`액션 ${actionName}은 핸들러가 ${hasHandlers ? '있습니다' : '없습니다'}`);
  };
  
  return (
    <div>
      <button onClick={() => checkAction('updateUser')}>
        updateUser 확인
      </button>
    </div>
  );
}
```

## 파이프라인 실행

### `actionRegistry.executePipeline(actionName, payload, options?)`

고급 옵션으로 완전한 액션 파이프라인을 실행합니다.

**매개변수:**
- `actionName`: 액션의 이름
- `payload`: 액션 페이로드
- `options`: 실행 옵션

**옵션:**
```typescript
interface ExecutionOptions {
  timeout?: number;           // 파이프라인 타임아웃 (ms)
  abortOnError?: boolean;     // 첫 번째 에러에서 중지
  collectResults?: boolean;   // 모든 핸들러 결과 수집
  metadata?: any;            // 추가 실행 메타데이터
}
```

**반환값:** `Promise<PipelineResult>`

```typescript
// 고급 파이프라인 실행
const result = await actionRegistry.executePipeline('complexAction', payload, {
  timeout: 5000,
  abortOnError: false,
  collectResults: true,
  metadata: { source: 'admin-panel' }
});

console.log('파이프라인 결과:', result);
```

### `actionRegistry.createPipelineController(actionName, payload)`

수동 파이프라인 관리를 위한 파이프라인 컨트롤러를 생성합니다.

**매개변수:**
- `actionName`: 액션의 이름
- `payload`: 초기 페이로드

**반환값:** `PipelineController` 인스턴스

```typescript
// 수동 파이프라인 제어
const controller = actionRegistry.createPipelineController('updateUser', {
  id: '123',
  name: '홍길동'
});

// 실행 전 페이로드 수정
controller.modifyPayload(current => ({
  ...current,
  timestamp: Date.now()
}));

// 커스텀 컨트롤러로 실행
const results = await actionRegistry.executeWithController(controller);
```

## 레지스트리 통계

### `actionRegistry.getStatistics()`

레지스트리 통계 및 성능 메트릭을 가져옵니다.

**반환값:** 레지스트리 통계 객체

```typescript
function RegistryStats() {
  const getStats = () => {
    const stats = actionRegistry.getStatistics();
    console.log('레지스트리 통계:', {
      totalActions: stats.totalActions,
      totalHandlers: stats.totalHandlers,
      executionCount: stats.executionCount,
      averageExecutionTime: stats.averageExecutionTime,
      errorRate: stats.errorRate
    });
  };
  
  return <button onClick={getStats}>레지스트리 통계 보기</button>;
}
```

### `actionRegistry.getPerformanceMetrics(actionName?)`

액션의 성능 메트릭을 가져옵니다.

**매개변수:**
- `actionName?`: 선택적 특정 액션 이름

**반환값:** 성능 메트릭

```typescript
function PerformanceMonitor() {
  const showMetrics = () => {
    const allMetrics = actionRegistry.getPerformanceMetrics();
    const userMetrics = actionRegistry.getPerformanceMetrics('updateUser');
    
    console.log('모든 액션 메트릭:', allMetrics);
    console.log('updateUser 메트릭:', userMetrics);
  };
  
  return <button onClick={showMetrics}>성능 보기</button>;
}
```

## 고급 핸들러 옵션

### 핸들러 설정

```typescript
interface AdvancedHandlerOptions {
  priority: number;           // 실행 우선순위 (0-1000)
  id: string;                // 고유 핸들러 식별자
  once: boolean;             // 한 번만 실행
  condition?: (payload: any) => boolean;  // 조건부 실행
  timeout?: number;          // 핸들러 타임아웃
  retries?: number;          // 실패 시 재시도 횟수
  retryDelay?: number;       // 재시도 간 지연시간
  metadata?: any;            // 핸들러 메타데이터
}
```

### 조건부 핸들러

```typescript
function ConditionalHandlers() {
  // 관리자 사용자에게만 실행되는 핸들러
  useActionHandler('adminAction', async (payload) => {
    await performAdminOperation(payload);
    return { success: true };
  }, {
    priority: 100,
    id: 'admin-handler',
    condition: (payload) => payload.userRole === 'admin'
  });
  
  // 재시도 로직이 있는 핸들러
  useActionHandler('unreliableAction', async (payload) => {
    return await unreliableService.call(payload);
  }, {
    priority: 90,
    id: 'unreliable-handler',
    retries: 3,
    retryDelay: 1000
  });
  
  return null;
}
```

## 레지스트리 이벤트

### `actionRegistry.onHandlerError(callback)`

핸들러 에러에 대한 콜백을 등록합니다.

**매개변수:**
- `callback`: 에러 처리 콜백

**반환값:** 등록 해제 함수

```typescript
function GlobalErrorHandler() {
  useEffect(() => {
    const unsubscribe = actionRegistry.onHandlerError((error, context) => {
      console.error('핸들러 에러:', error);
      console.error('컨텍스트:', context);
      
      // 에러 리포팅 서비스로 전송
      errorReporter.captureException(error, {
        extra: context,
        tags: { source: 'action-handler' }
      });
    });
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

### `actionRegistry.onActionExecuted(callback)`

완료된 액션 실행에 대한 콜백을 등록합니다.

**매개변수:**
- `callback`: 실행 완료 콜백

**반환값:** 등록 해제 함수

```typescript
function ActionAuditor() {
  useEffect(() => {
    const unsubscribe = actionRegistry.onActionExecuted((actionName, result) => {
      // 감사 로그
      auditLogger.log({
        action: actionName,
        timestamp: Date.now(),
        success: result.success,
        duration: result.duration,
        handlerCount: result.handlerResults.length
      });
    });
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

## 레지스트리 설정

### 전역 설정

```typescript
// 레지스트리 동작 설정
actionRegistry.configure({
  defaultTimeout: 10000,        // 기본 핸들러 타임아웃
  maxConcurrentActions: 10,     // 최대 동시 액션 실행 수
  enableMetrics: true,          // 성능 메트릭 수집
  enableLogging: true,          // 디버그 로깅 활성화
  errorReporting: true          // 에러 리포팅 활성화
});
```

### 개발 도구

```typescript
function RegistryDevTools() {
  const enableDebugMode = () => {
    actionRegistry.setDebugMode(true);
    console.log('액션 레지스트리 디버그 모드 활성화');
  };
  
  const clearMetrics = () => {
    actionRegistry.clearMetrics();
    console.log('성능 메트릭 초기화');
  };
  
  const dumpRegistry = () => {
    const dump = actionRegistry.dumpState();
    console.log('레지스트리 상태 덤프:', dump);
  };
  
  return (
    <div className="dev-tools">
      <h3>레지스트리 개발 도구</h3>
      <button onClick={enableDebugMode}>디버그 활성화</button>
      <button onClick={clearMetrics}>메트릭 초기화</button>
      <button onClick={dumpRegistry}>상태 덤프</button>
    </div>
  );
}
```

## 테스트 지원

### 레지스트리 모킹

```typescript
// 액션 레지스트리를 위한 테스트 유틸리티
export class MockActionRegistry {
  private handlers = new Map();
  private results = new Map();
  
  register(actionName: string, handler: Function, options?: any) {
    if (!this.handlers.has(actionName)) {
      this.handlers.set(actionName, []);
    }
    this.handlers.get(actionName).push({ handler, options });
    
    return () => this.unregister(actionName, options?.id);
  }
  
  async dispatch(actionName: string, payload: any) {
    const handlers = this.handlers.get(actionName) || [];
    const results = [];
    
    for (const { handler } of handlers) {
      try {
        const result = await handler(payload, createMockController());
        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    this.results.set(actionName, results);
    return results;
  }
  
  getLastResults(actionName: string) {
    return this.results.get(actionName) || [];
  }
}
```

### 핸들러 테스트

```typescript
// 개별 핸들러 테스트
describe('사용자 액션 핸들러', () => {
  let mockRegistry: MockActionRegistry;
  
  beforeEach(() => {
    mockRegistry = new MockActionRegistry();
  });
  
  test('updateUser 핸들러가 페이로드를 올바르게 처리함', async () => {
    const handler = (payload: any, controller: any) => {
      if (!payload.id) {
        controller.abort('ID 필요');
        return;
      }
      return { success: true, userId: payload.id };
    };
    
    mockRegistry.register('updateUser', handler);
    
    const results = await mockRegistry.dispatch('updateUser', {
      id: '123',
      name: '홍길동'
    });
    
    expect(results[0]).toEqual({ success: true, userId: '123' });
  });
});
```

## 베스트 프랙티스

### 1. 핸들러 등록
- 디버깅을 위해 의미 있는 핸들러 ID 사용
- 실행 순서를 위한 적절한 우선순위 설정
- 재등록을 방지하기 위해 항상 `useCallback` 사용

### 2. 에러 관리
- 모니터링을 위한 전역 에러 핸들러 구현
- 중앙화된 에러 처리를 위한 레지스트리 이벤트 사용
- 적절한 에러 리포팅 및 메트릭 설정

### 3. 성능 모니터링
- 레지스트리 성능 메트릭 모니터링
- 핸들러에 적절한 타임아웃 설정
- 성능 데이터를 사용하여 핸들러 우선순위 최적화

### 4. 테스트
- 단위 테스트를 위한 레지스트리 모킹
- 핸들러를 독립적으로 테스트
- 에러 처리 및 엣지 케이스 검증

### 5. 개발
- 개발 중 디버그 모드 사용
- 프로덕션에서 레지스트리 상태 모니터링
- 적절한 로깅 및 메트릭 구현

## 관련 자료

- **[Action Only 메서드](./action-only.md)** - 액션 디스패치 및 핸들러 등록
- **[파이프라인 컨트롤러 API](./pipeline-controller.md)** - 파이프라인 제어 메서드
- **[Action Only 예제](../examples/action-only.md)** - 완전한 사용 예제