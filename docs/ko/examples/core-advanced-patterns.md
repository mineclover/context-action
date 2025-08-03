# Core 고급 패턴

이 문서는 Core Advanced 예제 페이지에서 시연되는 고급 ActionRegister 패턴을 설명합니다.

## 개요

Core Advanced 페이지는 다음과 같은 정교한 ActionRegister 기능들을 보여줍니다:

- **우선순위 기반 파이프라인 제어**: 높은 숫자가 먼저 실행됨
- **액션 인터셉터 패턴**: 보안 및 검증 인터셉터
- **파이프라인 플로우 제어**: 조건부 실행, 체이닝, 중단 메커니즘
- **에러 처리**: 우아한 실패 및 복구 패턴

## 우선순위 시스템

ActionRegister는 `b.config.priority - a.config.priority`를 사용하여 핸들러를 정렬하므로 **높은 숫자가 먼저 실행**됩니다.

```typescript
// 실행 순서: 우선순위 10 → 우선순위 5 → 우선순위 1
actionRegister.register('action', handler1, { priority: 10 }); // 1번째 실행
actionRegister.register('action', handler2, { priority: 5 });  // 2번째 실행
actionRegister.register('action', handler3, { priority: 1 });  // 3번째 실행
```

## 인터셉터 패턴 구현

### 보안 인터셉터

보안 목적의 액션 인터셉션에 대한 실제 예제:

```typescript
interface SecurityActions {
  interceptorTest: { data: string };
}

function SecurityInterceptorDemo() {
  const [enableInterceptor, setEnableInterceptor] = useState(true);
  const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
  const interceptorEnabledRef = useRef(enableInterceptor);
  
  // 상태와 ref 동기화 유지
  useEffect(() => {
    interceptorEnabledRef.current = enableInterceptor;
  }, [enableInterceptor]);

  useEffect(() => {
    // 높은 우선순위 인터셉터 (먼저 실행됨)
    const unsubscribeInterceptor = actionRegister.register(
      'interceptorTest',
      ({ data }, controller) => {
        const isInterceptorEnabled = interceptorEnabledRef.current;
        
        if (isInterceptorEnabled) {
          // 보안 검사 실패 - 액션 차단
          setInterceptedActions(prev => [...prev, 
            `🛡️ 인터셉트됨: ${data} at ${new Date().toLocaleTimeString()}`
          ]);
          
          // 전체 파이프라인 중단
          controller.abort('보안 인터셉터에 의해 액션이 가로채어지고 차단됨');
          return; // 중요: 비즈니스 로직 실행 방지
        }
        
        // 보안 검사 통과 - 비즈니스 로직으로 계속
        console.log('✅ 인터셉터 비활성화 - 액션 진행');
        controller.next();
      },
      { priority: 10 } // 높은 우선순위로 첫 번째 실행 보장
    );

    // 낮은 우선순위 비즈니스 로직 (인터셉터가 허용한 경우에만 실행)
    const unsubscribeBusinessLogic = actionRegister.register(
      'interceptorTest',
      ({ data }, controller) => {
        console.log('🎯 비즈니스 로직 실행:', data);
        
        // 실제 비즈니스 작업 수행
        setCount(prev => prev + 5);
        
        controller.next();
      },
      { priority: 1 } // 낮은 우선순위로 인터셉터 이후 실행 보장
    );

    return () => {
      unsubscribeInterceptor();
      unsubscribeBusinessLogic();
    };
  }, []);
}
```

### 주요 구현 세부사항

1. **상태 추적용 useRef**: 스테일 클로저 문제를 방지하기 위해 필수
2. **우선순위 순서**: 인터셉터 (10) → 비즈니스 로직 (1)  
3. **파이프라인 제어**: `controller.abort()`가 후속 모든 핸들러 중단
4. **상태 관리**: 인터셉트된 액션들을 별도로 추적

## 파이프라인 플로우 제어 패턴

### 검증 및 처리 체인

```typescript
interface ProcessingActions {
  processData: { data: any; skipValidation?: boolean };
}

function ValidationChainDemo() {
  useEffect(() => {
    // 1단계: 입력 검증 (최고 우선순위)
    actionRegister.register('processData', ({ data, skipValidation }, controller) => {
      if (!skipValidation && !isValidData(data)) {
        console.log('❌ 검증 실패');
        controller.abort('데이터 검증 실패');
        return;
      }
      
      console.log('✅ 검증 통과');
      controller.next();
    }, { priority: 10 });

    // 2단계: 데이터 변환 (중간 우선순위) 
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('🔄 데이터 변환 중...');
      
      // 후속 핸들러를 위한 페이로드 수정
      controller.modifyPayload((payload) => ({
        ...payload,
        data: transformData(payload.data),
        processedAt: new Date().toISOString()
      }));
      
      controller.next();
    }, { priority: 5 });

    // 3단계: 영속성 (최저 우선순위)
    actionRegister.register('processData', ({ data }, controller) => {
      console.log('💾 처리된 데이터 저장');
      
      // 데이터베이스/스토어에 저장
      saveProcessedData(data);
      
      controller.next();
    }, { priority: 1 });

  }, []);
}
```

### 체인 액션

```typescript
interface ChainActions {
  chainedAction: { step: number; data: string };
}

function ChainedActionDemo() {
  useEffect(() => {
    actionRegister.register('chainedAction', ({ step, data }, controller) => {
      console.log(`📋 단계 ${step}: ${data}`);
      
      // UI 상태 업데이트
      setChainStep(step);
      
      // 지연과 함께 다음 단계 자동 트리거
      if (step < 3) {
        setTimeout(() => {
          actionRegister.dispatch('chainedAction', { 
            step: step + 1, 
            data: `체인 단계 ${step + 1}` 
          });
        }, 1000);
      } else {
        console.log('🎉 체인 완료 - 모든 단계 완료');
      }
      
      controller.next();
    });
  }, []);
}
```

## 에러 처리 패턴

### 우아한 에러 복구

```typescript
interface ErrorActions {
  riskyOperation: { data: any };
  divide: number;
}

function ErrorHandlingDemo() {
  useEffect(() => {
    // 포괄적인 에러 처리가 있는 위험한 작업
    actionRegister.register('riskyOperation', async ({ data }, controller) => {
      try {
        const result = await performRiskyOperation(data);
        console.log('✅ 작업 성공:', result);
        controller.next();
      } catch (error) {
        console.error('❌ 작업 실패:', error);
        
        // 모니터링을 위한 에러 로깅
        errorLogger.capture(error, { context: 'riskyOperation', data });
        
        // 상세한 이유와 함께 파이프라인 중단
        controller.abort(`작업 실패: ${error.message}`);
      }
    });

    // 0으로 나누기 검사가 있는 나눗셈
    actionRegister.register('divide', (divisor, controller) => {
      if (divisor === 0) {
        console.error('❌ 0으로 나눌 수 없습니다');
        controller.abort('0으로 나누기는 허용되지 않습니다');
        return;
      }
      
      const result = Math.floor(currentValue / divisor);
      setCount(result);
      console.log(`✅ 나눗셈 결과: ${result}`);
      
      controller.next();
    });

  }, []);
}
```

## 조건부 실행 패턴

### 환경 기반 핸들러

```typescript
interface ConditionalActions {
  debugAction: { message: string };
  analyticsAction: { event: string; data: any };
}

function ConditionalExecutionDemo() {
  useEffect(() => {
    // 개발 전용 디버깅
    actionRegister.register('debugAction', 
      ({ message }, controller) => {
        console.log('🔍 디버그:', message);
        debugLogger.log(message);
        controller.next();
      }, 
      { 
        priority: 10,
        condition: () => process.env.NODE_ENV === 'development'
      }
    );

    // 프로덕션 분석
    actionRegister.register('analyticsAction', 
      ({ event, data }, controller) => {
        analytics.track(event, data);
        controller.next();
      }, 
      { 
        priority: 5,
        condition: () => process.env.NODE_ENV === 'production'
      }
    );

  }, []);
}
```

## 실제 사용 사례

### 1. API 요청 파이프라인

```typescript
// 요청 → 인증 → 속도 제한 → 실행 → 로깅
actionRegister.register('apiRequest', authHandler, { priority: 100 });
actionRegister.register('apiRequest', rateLimitHandler, { priority: 90 });
actionRegister.register('apiRequest', requestHandler, { priority: 50 });
actionRegister.register('apiRequest', loggingHandler, { priority: 10 });
```

### 2. 사용자 액션 감사

```typescript
// 액션 → 권한 검사 → 감사 로그 → 비즈니스 로직 → 알림
actionRegister.register('userAction', permissionHandler, { priority: 100 });
actionRegister.register('userAction', auditHandler, { priority: 90 });
actionRegister.register('userAction', businessHandler, { priority: 50 });
actionRegister.register('userAction', notificationHandler, { priority: 10 });
```

### 3. 데이터 처리 파이프라인

```typescript
// 데이터 → 검증 → 변환 → 저장 → 캐시 업데이트
actionRegister.register('processData', validationHandler, { priority: 100 });
actionRegister.register('processData', transformHandler, { priority: 90 });
actionRegister.register('processData', storageHandler, { priority: 50 });
actionRegister.register('processData', cacheHandler, { priority: 10 });
```

## 모범 사례

### 1. 우선순위 설계

- **100+ 범위**: 보안, 인증, 인가
- **90-99 범위**: 검증, 속도 제한, 전처리  
- **50-89 범위**: 핵심 비즈니스 로직
- **10-49 범위**: 로깅, 캐싱, 알림
- **1-9 범위**: 정리, 분석, 비필수 작업

### 2. 에러 처리

- 항상 의미 있는 중단 이유 제공
- 디버깅을 위한 충분한 컨텍스트로 에러 로깅
- 비필수 작업에 대한 폴백 메커니즘 고려
- 비동기 작업에 try-catch 사용

### 3. 상태 관리

- 인터셉터의 상태 추적에 `useRef` 사용
- 인터셉터 상태를 React 상태와 동기화 유지
- 핸들러에서 직접 상태 변경 피하기
- 불변 업데이트 선호

### 4. 성능 고려사항

- 액션당 핸들러 수 최소화
- 환경별 로직에 조건부 실행 사용
- 고빈도 액션에 디바운싱 고려
- 개발 환경에서 파이프라인 실행 프로파일링

## 테스팅 전략

### 인터셉터 단위 테스트

```typescript
describe('보안 인터셉터', () => {
  it('권한 없는 액션을 차단해야 함', async () => {
    const actionRegister = new ActionRegister();
    const interceptedActions = [];
    
    // 인터셉터 설정
    actionRegister.register('sensitiveOperation', 
      ({ userId }, controller) => {
        if (!hasPermission(userId)) {
          interceptedActions.push('차단됨');
          controller.abort('권한 없음');
          return;
        }
        controller.next();
      }, 
      { priority: 10 }
    );
    
    // 권한 없는 접근 테스트
    await actionRegister.dispatch('sensitiveOperation', { userId: 'unauthorized' });
    
    expect(interceptedActions).toContain('차단됨');
  });
});
```

### 파이프라인 통합 테스트

```typescript
describe('데이터 처리 파이프라인', () => {
  it('완전한 파이프라인을 통해 데이터를 처리해야 함', async () => {
    const results = [];
    
    // 파이프라인 설정
    actionRegister.register('process', validationHandler(results), { priority: 10 });
    actionRegister.register('process', transformHandler(results), { priority: 5 });
    actionRegister.register('process', storageHandler(results), { priority: 1 });
    
    // 파이프라인 실행
    await actionRegister.dispatch('process', { data: 'test' });
    
    expect(results).toEqual(['검증됨', '변환됨', '저장됨']);
  });
});
```

이 종합 가이드는 ActionRegister의 우선순위 기반 파이프라인 시스템이 복잡한 엔터프라이즈 애플리케이션에 적합한 정교한 액션 오케스트레이션 패턴을 어떻게 가능하게 하는지 보여줍니다.