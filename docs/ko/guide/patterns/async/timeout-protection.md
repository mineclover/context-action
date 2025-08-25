# 타임아웃 보호 패턴

RefContext 작업에서 무한 대기를 방지하기 위한 타임아웃 메커니즘 보호 패턴입니다.

## 전제 조건

타임아웃 보호 패턴을 구현하기 전에 적절한 RefContext 설정이 있는지 확인하세요:

### Import
```typescript
import { createRefContext } from '@context-action/react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

### 필수 RefContext 설정
```typescript
// 타임아웃 보호를 위한 기본 요소 refs
interface UIRefs {
  criticalElement: HTMLElement;
  primaryElement: HTMLElement;
  secondaryElement: HTMLElement;
  modalDialog: HTMLDialogElement;
  loadingSpinner: HTMLElement;
}

const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef,
  useWaitForRefs: useWaitForRefs
} = createRefContext<UIRefs>('UI');
```

### 타임아웃 작업을 위한 액션 컨텍스트
```typescript
// 타임아웃으로 보호되는 작업을 위한 액션들
interface TimeoutActions extends ActionPayloadMap {
  criticalAction: { message: string; timeout?: number };
  retryableAction: { data: any; maxRetries?: number };
  progressiveAction: { elementKey: string; complexity: 'simple' | 'complex' | 'heavy' };
  adaptiveAction: { operation: string; timeout?: number };
}

const {
  Provider: TimeoutActionProvider,
  useActionDispatch: useTimeoutDispatch,
  useActionHandler: useTimeoutHandler
} = createActionContext<TimeoutActions>('Timeout');
```

### Provider 설정
```typescript
function App() {
  return (
    <UIRefProvider>
      <TimeoutActionProvider>
        <AppContent />
      </TimeoutActionProvider>
    </UIRefProvider>
  );
}
```

## 기본 타임아웃 패턴

```typescript
const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn('Element not available, using fallback');
    return false;
  }
}, [waitForRefs]);
```

## 재시도를 포함한 고급 타임아웃

```typescript
const waitWithRetry = useCallback(async (
  elementKey: string, 
  maxRetries = 3, 
  timeout = 2000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout on attempt ${attempt}`)), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All attempts failed, using fallback');
        return false;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}, [waitForRefs]);
```

## 액션 핸들러에서 사용법

```typescript
// 타임아웃으로 보호되는 액션 핸들러를 가진 컴포넌트
function TimeoutComponent() {
  const waitForRefs = useWaitForRefs();
  const criticalElementRef = useUIRef('criticalElement');
  
  // waitForRefs를 사용하는 사용자 정의 타임아웃 래퍼
  const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Element not available, using fallback');
      return false;
    }
  }, [waitForRefs]);

  // 타임아웃 보호가 있는 액션 핸들러
  useTimeoutHandler('criticalAction', useCallback(async (payload) => {
    const success = await waitWithTimeout('criticalElement', payload.timeout || 3000);
    
    if (!success) {
      // 대체 전략
      console.warn('Using fallback for critical action');
      return { success: false, error: 'Element not available' };
    }
    
    // 정상 작업 진행
    const element = criticalElementRef.target;
    if (element) {
      element.textContent = payload.message;
    }
    
    return { success: true };
  }, [waitWithTimeout, criticalElementRef]));

  return (
    <div>
      <div ref={(el) => el && criticalElementRef.setRef(el)}>
        Critical Element
      </div>
    </div>
  );
}
```

## 오류 복구 패턴

```typescript
// 강건한 오류 복구를 가진 컴포넌트
function ErrorRecoveryComponent() {
  const waitForRefs = useWaitForRefs();
  const primaryElementRef = useUIRef('primaryElement');
  const secondaryElementRef = useUIRef('secondaryElement');

  const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Element not available, using fallback');
      return false;
    }
  }, [waitForRefs]);

  const performPrimaryOperation = useCallback(() => {
    const element = primaryElementRef.target;
    if (element) {
      element.style.backgroundColor = 'green';
      return { success: true, method: 'primary' };
    }
    return { success: false };
  }, [primaryElementRef]);

  const performSecondaryOperation = useCallback(() => {
    const element = secondaryElementRef.target;
    if (element) {
      element.style.backgroundColor = 'yellow';
      return { success: true, method: 'secondary' };
    }
    return { success: false };
  }, [secondaryElementRef]);

  const performFallbackOperation = useCallback(() => {
    console.log('Using fallback operation');
    return { success: true, method: 'fallback' };
  }, []);

  const robustOperation = useCallback(async () => {
    try {
      // 기본 요소 시도
      const primarySuccess = await waitWithTimeout('primaryElement', 2000);
      
      if (primarySuccess) {
        return performPrimaryOperation();
      }
      
      // 보조 요소로 대체
      const secondarySuccess = await waitWithTimeout('secondaryElement', 2000);
      
      if (secondarySuccess) {
        return performSecondaryOperation();
      }
      
      // 최종 대체
      return performFallbackOperation();
      
    } catch (error) {
      console.error('All operations failed:', error);
      return null;
    }
  }, [waitWithTimeout, performPrimaryOperation, performSecondaryOperation, performFallbackOperation]);

  return (
    <div>
      <div ref={(el) => el && primaryElementRef.setRef(el)}>
        Primary Element
      </div>
      <div ref={(el) => el && secondaryElementRef.setRef(el)}>
        Secondary Element
      </div>
      <button onClick={robustOperation}>
        Execute Robust Operation
      </button>
    </div>
  );
}
```

## 구성 가능한 타임아웃 전략

### 점진적 타임아웃 전략

```typescript
const progressiveTimeout = useCallback(async (elementKey: string) => {
  const timeouts = [1000, 3000, 5000]; // 점진적 타임아웃
  
  for (let i = 0; i < timeouts.length; i++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout ${i + 1}`)), timeouts[i])
        )
      ]);
      return true; // 성공
    } catch (error) {
      console.warn(`Progressive timeout ${i + 1} failed:`, error.message);
      
      if (i === timeouts.length - 1) {
        return false; // 최종 실패
      }
      
      // 다음 시도 전 짧은 중지
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return false;
}, [waitForRefs]);
```

### 적응형 타임아웃 전략

```typescript
const adaptiveTimeout = useCallback(async (elementKey: string, complexity: 'simple' | 'complex' | 'heavy') => {
  const timeoutMap = {
    simple: 2000,
    complex: 5000,
    heavy: 10000
  };
  
  const timeout = timeoutMap[complexity];
  
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Adaptive timeout for ${complexity} operation`)), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn(`Adaptive timeout failed for ${complexity} operation:`, error.message);
    return false;
  }
}, [waitForRefs]);
```

## 프로덕션 타임아웃 패턴

### 회로 차단기 패턴

```typescript
// 회로 차단기 구현을 가진 컴포넌트
function CircuitBreakerComponent() {
  const waitForRefs = useWaitForRefs();
  
  const createCircuitBreaker = useCallback((threshold = 3, resetTimeout = 30000) => {
    let failures = 0;
    let lastFailTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    
    return async (elementKey: string, timeout = 5000) => {
      const now = Date.now();
      
      // 충분한 시간이 지나면 회로 차단기 재설정
      if (state === 'open' && now - lastFailTime > resetTimeout) {
        state = 'half-open';
        failures = 0;
      }
      
      // 회로가 열려있으면 빠른 실패
      if (state === 'open') {
        throw new Error('Circuit breaker is open');
      }
      
      try {
        await Promise.race([
          waitForRefs(elementKey),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
          )
        ]);
        
        // 성공 - 회로 차단기 재설정
        failures = 0;
        state = 'closed';
        return true;
        
      } catch (error) {
        failures++;
        lastFailTime = now;
        
        if (failures >= threshold) {
          state = 'open';
          console.warn(`Circuit breaker opened after ${failures} failures`);
        }
        
        throw error;
      }
    };
  }, [waitForRefs]);

  const circuitBreakerWait = useMemo(() => createCircuitBreaker(3, 30000), [createCircuitBreaker]);

  const testCircuitBreaker = useCallback(async () => {
    try {
      const result = await circuitBreakerWait('criticalElement', 2000);
      console.log('Circuit breaker success:', result);
    } catch (error) {
      console.error('Circuit breaker failed:', error.message);
    }
  }, [circuitBreakerWait]);

  return (
    <div>
      <button onClick={testCircuitBreaker}>
        Test Circuit Breaker
      </button>
    </div>
  );
}
```

### 성능 모니터링을 포함한 타임아웃

```typescript
const monitoredTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  const startTime = performance.now();
  
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Performance timeout')), timeout)
      )
    ]);
    
    const duration = performance.now() - startTime;
    console.log(`Element ${elementKey} loaded in ${duration.toFixed(2)}ms`);
    
    // 느린 작업 로그
    if (duration > timeout * 0.8) {
      console.warn(`Slow element loading: ${elementKey} took ${duration.toFixed(2)}ms`);
    }
    
    return true;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Element ${elementKey} failed after ${duration.toFixed(2)}ms:`, error.message);
    return false;
  }
}, [waitForRefs]);
```

## 모범 사례

1. **합리적인 타임아웃 설정**: 예상 로딩 시간을 기반으로 설정
2. **대체 방안 구현**: 항상 백업 전략을 가지세요
3. **타임아웃 이벤트 로깅**: 디버깅과 모니터링을 위해
4. **점진적 전략 사용**: 짧은 타임아웃부터 시작하여 점진적으로 증가
5. **성능 모니터링**: 타임아웃 빈도와 지속 시간 추적
6. **우아한 처리**: 타임아웃으로 인해 애플리케이션이 크래시되지 않도록 하세요

## 일반적인 사용 사례

- **네트워크 의존 요소**: API를 통해 로드되는 요소들
- **복잡한 애니메이션**: 무거운 렌더링 작업
- **서드파티 위젯**: 가변 로딩 시간을 가진 외부 컴포넌트들
- **동적 콘텐츠**: 사용자 생성 또는 CMS 콘텐츠
- **Progressive Web Apps**: 서비스 워커에 의존하는 기능들