# 액션 컨텍스트 API

액션 컨텍스트는 Action Only 패턴을 위한 React 통합을 제공하여, React 컴포넌트 내에서 타입 안전한 액션 디스패치와 핸들러 등록을 가능하게 합니다.

## 임포트

```typescript
import { createActionContext, type ActionPayloadMap } from '@context-action/react';
```

## createActionContext

### `createActionContext<T>(name)`

Provider, 훅, 디스패치 기능을 갖춘 완전한 액션 컨텍스트를 생성합니다.

**타입 매개변수:**
- `T extends ActionPayloadMap` - 액션 타입 정의

**매개변수:**
- `name: string` - 디버깅 및 식별을 위한 컨텍스트 이름

**반환값:** `ActionContextResult<T>`

```typescript
interface ActionContextResult<T extends ActionPayloadMap> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useActionDispatch: () => (action: keyof T, payload: T[keyof T]) => Promise<any>;
  useActionHandler: (
    action: keyof T, 
    handler: ActionHandler<T[keyof T]>, 
    config?: HandlerConfig
  ) => void;
}
```

**예제:**
```typescript
interface AppActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  logout: void;
  trackEvent: { event: string; data: any };
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('AppActions');
```

## Provider 컴포넌트

### `<Provider>`

ActionRegister 인스턴스를 관리하고 자식 컴포넌트에 액션 기능을 제공하는 컨텍스트 프로바이더입니다.

**Props:**
- `children: React.ReactNode` - 자식 컴포넌트

```typescript
function App() {
  return (
    <AppActionProvider>
      <LoginComponent />
      <DashboardComponent />
    </AppActionProvider>
  );
}
```

**기능:**
- 자동 ActionRegister 인스턴스 생성
- 모든 자식 컴포넌트에 컨텍스트 제공
- 언마운트 시 정리

## 훅

### `useActionDispatch()`

액션을 트리거하기 위한 디스패치 함수를 반환합니다.

**반환값:** `DispatchFunction<T>`

```typescript
type DispatchFunction<T> = <K extends keyof T>(
  action: K,
  payload: T[K]
) => Promise<any>;
```

**예제:**
```typescript
function LoginComponent() {
  const dispatch = useAppAction();
  
  const handleLogin = async () => {
    try {
      const result = await dispatch('authenticate', {
        username: 'john',
        password: 'secret123'
      });
      console.log('로그인 결과:', result);
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };
  
  return <button onClick={handleLogin}>로그인</button>;
}
```

### `useActionHandler(action, handler, config?)`

자동 정리 기능과 함께 React 컴포넌트 내에서 액션 핸들러를 등록합니다.

**매개변수:**
- `action: keyof T` - 처리할 액션 이름
- `handler: ActionHandler<T[action]>` - 핸들러 함수
- `config?: HandlerConfig` - 선택적 핸들러 설정

**반환값:** `void`

```typescript
interface HandlerConfig {
  id?: string;                     // 고유 핸들러 식별자
  priority?: number;               // 실행 우선순위 (기본값: 1000)
  once?: boolean;                  // 한 번만 실행 (기본값: false)
  blocking?: boolean;              // 완료까지 차단 (기본값: true)
  condition?: (payload) => boolean; // 조건부 실행
  metadata?: Record<string, any>;  // 커스텀 메타데이터
}
```

**예제:**
```typescript
function AuthHandler() {
  const dispatch = useAppAction();
  
  // 인증 핸들러 등록
  useAppActionHandler('authenticate', useCallback(async (payload, controller) => {
    try {
      // 자격 증명 검증
      if (!payload.username || !payload.password) {
        controller.abort('자격 증명이 누락되었습니다');
        return;
      }
      
      // 인증 수행
      const user = await authService.login(payload.username, payload.password);
      
      // 성공적인 로그인 추적
      dispatch('trackEvent', { 
        event: 'user_login', 
        data: { userId: user.id, timestamp: Date.now() } 
      });
      
      return { success: true, user };
      
    } catch (error) {
      controller.abort(`인증 실패: ${(error as Error).message}`);
    }
  }, [dispatch]), { 
    priority: 100, 
    id: 'auth-handler' 
  });
  
  return null; // 핸들러 전용 컴포넌트
}
```

### 핸들러 등록 베스트 프랙티스

#### 성능을 위한 useCallback 사용
```typescript
useAppActionHandler('processData', useCallback(async (payload, controller) => {
  // 핸들러 로직
}, [dependency1, dependency2]), { priority: 80 });
```

#### 조건부 등록
```typescript
function ConditionalHandler({ shouldHandle }: { shouldHandle: boolean }) {
  useAppActionHandler('processData', useCallback(async (payload) => {
    // 핸들러 로직
  }, []), { 
    priority: 50,
    condition: () => shouldHandle 
  });
  
  return null;
}
```

#### 일회성 핸들러
```typescript
useAppActionHandler('initializeApp', useCallback(async (payload) => {
  // 한 번만 실행되어야 하는 초기화 로직
  await initializeServices();
  await loadConfiguration();
}, []), { 
  once: true, 
  priority: 100 
});
```

## TypeScript 통합

### 타입 안전성

액션 컨텍스트는 컴파일 타임 타입 검사와 함께 완전한 TypeScript 지원을 제공합니다:

```typescript
interface MyActions extends ActionPayloadMap {
  // void 액션
  logout: void;
  
  // 객체 페이로드
  updateUser: { id: string; name: string; email: string };
  
  // 유니온 타입 페이로드
  setTheme: 'light' | 'dark';
  
  // 선택적 속성
  trackEvent: { event: string; data?: any };
}

const { useActionDispatch } = createActionContext<MyActions>('MyApp');

function Component() {
  const dispatch = useActionDispatch();
  
  // ✅ 유효한 디스패치
  dispatch('logout');
  dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
  dispatch('setTheme', 'dark');
  dispatch('trackEvent', { event: 'click' });
  
  // ❌ TypeScript 에러
  dispatch('logout', {}); // logout은 void를 기대
  dispatch('updateUser', { id: '1' }); // name과 email 누락
  dispatch('setTheme', 'blue'); // 잘못된 테마 값
}
```

### 핸들러 타입 추론

```typescript
useAppActionHandler('updateUser', (payload, controller) => {
  // payload는 자동으로 { id: string; name: string; email: string } 타입으로 추론됨
  console.log(payload.id);    // ✅ string
  console.log(payload.name);  // ✅ string
  console.log(payload.email); // ✅ string
  console.log(payload.age);   // ❌ TypeScript 에러 - 속성이 존재하지 않음
});
```

## 에러 처리

### 핸들러 에러 복구

```typescript
function ErrorHandlingComponent() {
  useAppActionHandler('riskyOperation', useCallback(async (payload, controller) => {
    try {
      const result = await riskyApiCall(payload.data);
      return { success: true, result };
      
    } catch (error) {
      // 모니터링을 위한 에러 로그
      console.error('작업 실패:', error);
      
      // 다른 핸들러를 위한 에러 결과 설정
      controller.setResult({ 
        step: 'primary', 
        success: false, 
        error: (error as Error).message 
      });
      
      // 중단하지 않음 - 폴백 핸들러가 시도하도록 함
      return { success: false, primaryFailed: true };
    }
  }, []), { priority: 100, id: 'primary-handler' });
  
  // 폴백 핸들러
  useAppActionHandler('riskyOperation', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const primaryFailed = results.some(r => r.primaryFailed);
    
    if (primaryFailed) {
      // 대안 접근 방식 시도
      const fallbackResult = await alternativeApiCall(payload.data);
      return { success: true, result: fallbackResult, fallbackUsed: true };
    }
    
    // 주 작업이 성공, 폴백 건너뛰기
    return { success: true, fallbackSkipped: true };
  }, []), { priority: 50, id: 'fallback-handler' });
  
  return null;
}
```

### 디스패치 에러 처리

```typescript
function ComponentWithErrorHandling() {
  const dispatch = useAppAction();
  
  const handleAction = async () => {
    try {
      const result = await dispatch('authenticate', {
        username: 'john',
        password: 'secret'
      });
      
      if (result.success) {
        // 성공 처리
      }
    } catch (error) {
      // 파이프라인 중단 또는 기타 에러 처리
      console.error('액션 실패:', error);
    }
  };
  
  return <button onClick={handleAction}>인증</button>;
}
```

## 고급 사용 패턴

### 핸들러 협업

```typescript
function CoordinatedHandlers() {
  const dispatch = useAppAction();
  
  // 1단계: 준비
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    controller.modifyPayload(current => ({
      ...current,
      sessionId: getSessionId(),
      timestamp: Date.now()
    }));
    
    controller.setResult({ step: 'preparation', ready: true });
    return { prepared: true };
  }, []), { priority: 100, id: 'preparer' });
  
  // 2단계: 검증
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    const validation = await validateOrder(payload);
    
    if (!validation.isValid) {
      controller.abort(`검증 실패: ${validation.errors.join(', ')}`);
      return;
    }
    
    controller.setResult({ step: 'validation', valid: true });
    return validation;
  }, []), { priority: 90, id: 'validator' });
  
  // 3단계: 처리
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const validation = results.find(r => r.step === 'validation');
    
    if (validation?.valid) {
      const processResult = await processOrder(payload);
      
      // 후속 액션 트리거
      dispatch('trackEvent', { 
        event: 'order_processed', 
        data: { orderId: processResult.id } 
      });
      
      return processResult;
    }
  }, [dispatch]), { priority: 80, id: 'processor' });
  
  return null;
}
```

## 예제

완전한 작동 예제는 [Action Only 패턴 예제](../../examples/action-only.md)를 참조하세요.

## 관련 자료

- **[ActionRegister API](../core/action-register.md)** - 핵심 액션 파이프라인 시스템
- **[파이프라인 컨트롤러 API](../core/pipeline-controller.md)** - 파이프라인 제어 메서드
- **[스토어 패턴 API](./store-pattern.md)** - 상태 관리를 위한 Store Only 패턴
- **[액션 파이프라인 가이드](../../guide/action-pipeline.md)** - 사용 가이드 및 패턴