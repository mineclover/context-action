# 오류 처리

Context-Action 프레임워크에서의 오류 처리는 안정적이고 복원력 있는 애플리케이션을 구축하는 핵심 요소입니다. 이 가이드는 체계적인 오류 처리 전략과 복구 메커니즘을 다룹니다.

## 오류 처리 아키텍처

### 계층별 오류 처리

```typescript
// 오류 계층 구조
interface ErrorHandlingLayers {
  // 1. Handler Layer - 비즈니스 로직 오류
  handlerErrors: {
    validationErrors: ValidationError[];
    businessLogicErrors: BusinessLogicError[];
    externalServiceErrors: ExternalServiceError[];
  };
  
  // 2. Store Layer - 데이터 일관성 오류
  storeErrors: {
    stateValidationErrors: StateValidationError[];
    concurrencyErrors: ConcurrencyError[];
  };
  
  // 3. View Layer - UI 렌더링 오류
  viewErrors: {
    renderingErrors: RenderingError[];
    userInteractionErrors: UserInteractionError[];
  };
  
  // 4. System Layer - 시스템 수준 오류
  systemErrors: {
    networkErrors: NetworkError[];
    memoryErrors: MemoryError[];
    configurationErrors: ConfigurationError[];
  };
}
```

### 오류 타입 정의

```typescript
// 기본 오류 인터페이스
interface BaseError {
  code: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  context?: Record<string, any>;
  stackTrace?: string;
}

// 도메인 특화 오류 타입들
export class ValidationError extends Error implements BaseError {
  code = 'VALIDATION_ERROR';
  severity: 'medium' = 'medium';
  recoverable = true;
  timestamp = Date.now();
  
  constructor(
    message: string,
    public field: string,
    public value: any,
    public rule: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessLogicError extends Error implements BaseError {
  code: string;
  severity: 'high' = 'high';
  recoverable: boolean;
  timestamp = Date.now();
  
  constructor(
    code: string,
    message: string,
    recoverable = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessLogicError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

export class ExternalServiceError extends Error implements BaseError {
  code = 'EXTERNAL_SERVICE_ERROR';
  severity: 'high' = 'high';
  recoverable = true;
  timestamp = Date.now();
  
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    public retryable = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ExternalServiceError';
    this.recoverable = retryable;
  }
}

export class SystemError extends Error implements BaseError {
  code: string;
  severity: 'critical' = 'critical';
  recoverable = false;
  timestamp = Date.now();
  
  constructor(
    code: string,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
  }
}
```

## 핸들러 오류 처리

### 1. 구조화된 오류 처리 패턴

```typescript
// 포괄적인 핸들러 오류 처리
function useRobustUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  const loginHandler = useCallback(async (
    payload: { email: string; password: string },
    controller: ActionController
  ) => {
    const operation = 'user-login';
    const context = { email: payload.email, timestamp: Date.now() };
    
    try {
      // 1단계: 입력 검증
      await validateLoginInput(payload);
      
      // 2단계: 비즈니스 규칙 검증
      await validateBusinessRules(payload);
      
      // 3단계: 외부 서비스 호출
      const authResult = await performAuthentication(payload);
      
      // 4단계: 상태 업데이트
      await updateUserState(authResult);
      
      return { 
        success: true, 
        user: authResult.user,
        timestamp: Date.now()
      };
      
    } catch (error) {
      return handleLoginError(error, controller, context);
    }
  }, [registry]);
  
  // 오류 처리 전용 함수
  const handleLoginError = (
    error: unknown,
    controller: ActionController,
    context: Record<string, any>
  ) => {
    // 오류 타입별 처리
    if (error instanceof ValidationError) {
      controller.abort(`입력 검증 실패: ${error.message}`, {
        type: 'validation',
        field: error.field,
        value: error.value,
        rule: error.rule,
        ...context
      });
      
      return {
        success: false,
        error: 'VALIDATION_FAILED',
        details: {
          field: error.field,
          message: error.message,
          rule: error.rule
        }
      };
    }
    
    if (error instanceof BusinessLogicError) {
      controller.abort(`비즈니스 로직 오류: ${error.message}`, {
        type: 'business-logic',
        code: error.code,
        recoverable: error.recoverable,
        ...context
      });
      
      return {
        success: false,
        error: error.code,
        recoverable: error.recoverable,
        message: error.message
      };
    }
    
    if (error instanceof ExternalServiceError) {
      controller.abort(`외부 서비스 오류: ${error.message}`, {
        type: 'external-service',
        service: error.service,
        statusCode: error.statusCode,
        retryable: error.retryable,
        ...context
      });
      
      return {
        success: false,
        error: 'EXTERNAL_SERVICE_ERROR',
        service: error.service,
        retryable: error.retryable,
        statusCode: error.statusCode
      };
    }
    
    // 예상치 못한 오류
    const systemError = new SystemError(
      'UNEXPECTED_LOGIN_ERROR',
      error instanceof Error ? error.message : '알 수 없는 로그인 오류',
      { originalError: error, ...context }
    );
    
    controller.abort(systemError.message, {
      type: 'system',
      code: systemError.code,
      severity: systemError.severity,
      ...context
    });
    
    // 시스템 오류 리포팅
    reportSystemError(systemError);
    
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      severity: 'critical'
    };
  };
  
  // 핸들러 등록
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('login', loginHandler, {
      id: 'robust-login-handler',
      priority: 100,
      blocking: true,
      onError: (error, context) => {
        // 핸들러 수준 오류 처리
        console.error('핸들러 실행 중 오류:', error, context);
        
        // 심각한 오류는 즉시 보고
        if (error.severity === 'critical') {
          reportCriticalError(error, context);
        }
      }
    });
    
    return unregister;
  }, [register, loginHandler]);
}
```

### 2. 재시도 메커니즘

```typescript
// 지수 백오프를 사용한 재시도 시스템
class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = (error) => error instanceof ExternalServiceError && error.retryable
    } = options;
    
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // 재시도 조건 확인
        if (!retryCondition(error) || attempt === maxAttempts) {
          throw error;
        }
        
        // 지수 백오프 계산
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        
        console.warn(`작업 실패 (시도 ${attempt}/${maxAttempts}), ${delay}ms 후 재시도:`, error);
        
        // 지연 후 재시도
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// 재시도가 적용된 핸들러
function useRetryableHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    try {
      const result = await RetryManager.withRetry(
        async () => {
          // 프로필 업데이트 API 호출
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.data)
          });
          
          if (!response.ok) {
            if (response.status >= 500) {
              throw new ExternalServiceError(
                '서버 오류',
                'user-api',
                response.status,
                true // 재시도 가능
              );
            } else if (response.status === 429) {
              throw new ExternalServiceError(
                '요청 한도 초과',
                'user-api',
                response.status,
                true // 재시도 가능
              );
            } else {
              throw new ExternalServiceError(
                '클라이언트 오류',
                'user-api',
                response.status,
                false // 재시도 불가능
              );
            }
          }
          
          return await response.json();
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          retryCondition: (error) => 
            error instanceof ExternalServiceError && 
            error.retryable &&
            [429, 500, 502, 503, 504].includes(error.statusCode || 0)
        }
      );
      
      // 성공 시 상태 업데이트
      const profileStore = registry.getStore('profile');
      profileStore.setValue(result.profile);
      
      return { success: true, profile: result.profile };
      
    } catch (error) {
      controller.abort('프로필 업데이트 실패', { error, retryExhausted: true });
      
      if (error instanceof ExternalServiceError) {
        return {
          success: false,
          error: 'EXTERNAL_SERVICE_ERROR',
          retryable: error.retryable,
          service: error.service
        };
      }
      
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '프로필 업데이트 중 오류가 발생했습니다.'
      };
    }
  }, [registry]);
  
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('updateProfile', updateProfileHandler, {
      id: 'retryable-profile-updater',
      priority: 100,
      blocking: true
    });
    
    return unregister;
  }, [register, updateProfileHandler]);
}
```

### 3. 회로 차단기 패턴

```typescript
// 회로 차단기 구현
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitor?: (state: string, error?: any) => void
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('회로 차단기가 열려있습니다 (Circuit Breaker Open)');
      } else {
        this.state = 'half-open';
        this.monitor?.('half-open');
      }
    }
    
    try {
      const result = await operation();
      
      // 성공 시 회로 재설정
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        this.monitor?.('closed');
      }
      
      return result;
      
    } catch (error) {
      this.failures += 1;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        this.monitor?.('open', error);
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
  
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.monitor?.('reset');
  }
}

// 회로 차단기가 적용된 핸들러
function useCircuitBreakerHandlers() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  // 외부 서비스별 회로 차단기
  const userApiCircuitBreaker = useMemo(
    () => new CircuitBreaker(3, 30000, (state, error) => {
      console.log(`사용자 API 회로 차단기 상태 변경: ${state}`, error);
      
      if (state === 'open') {
        // 회로가 열렸을 때 사용자에게 알림
        showNotification('사용자 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.');
      }
    }),
    []
  );
  
  const loadUserDataHandler = useCallback(async (payload, controller) => {
    try {
      const result = await userApiCircuitBreaker.execute(async () => {
        const response = await fetch(`/api/users/${payload.userId}`);
        
        if (!response.ok) {
          throw new ExternalServiceError(
            `사용자 데이터 로드 실패: ${response.status}`,
            'user-api',
            response.status
          );
        }
        
        return await response.json();
      });
      
      // 스토어 업데이트
      const profileStore = registry.getStore('profile');
      profileStore.setValue(result.profile);
      
      return { success: true, user: result };
      
    } catch (error) {
      if (error.message.includes('Circuit Breaker Open')) {
        controller.abort('서비스 일시 중단', {
          type: 'circuit-breaker',
          service: 'user-api',
          state: userApiCircuitBreaker.getState()
        });
        
        return {
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: '사용자 서비스가 일시적으로 중단되었습니다.',
          retryAfter: 30000
        };
      }
      
      throw error;
    }
  }, [registry, userApiCircuitBreaker]);
  
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('loadUserData', loadUserDataHandler, {
      id: 'circuit-breaker-user-loader',
      priority: 100,
      blocking: true
    });
    
    return unregister;
  }, [register, loadUserDataHandler]);
}
```

## React 컴포넌트 오류 처리

### 1. 오류 경계 구현

```typescript
// 도메인별 오류 경계
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class UserDomainErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // 오류 리포팅
    reportComponentError('UserDomain', error, errorInfo);
    
    // 심각도 분류
    const severity = this.classifyError(error);
    
    if (severity === 'critical') {
      // 시스템 관리자에게 즉시 알림
      alertSystemAdministrator(error, errorInfo);
    }
  }
  
  private classifyError(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ChunkLoadError') return 'medium';
    if (error.message.includes('Network Error')) return 'medium';
    if (error.message.includes('Out of memory')) return 'critical';
    if (error.stack?.includes('useState') || error.stack?.includes('useEffect')) return 'high';
    
    return 'medium';
  }
  
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
  
  private handleReload = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }
    
    return this.props.children;
  }
}

// 기본 오류 폴백 컴포넌트
function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  onReload
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onReload: () => void;
}) {
  return (
    <div className="error-fallback">
      <div className="error-content">
        <h2>오류가 발생했습니다</h2>
        <p>사용자 인터페이스에 문제가 발생했습니다.</p>
        
        <div className="error-details">
          <details>
            <summary>기술적 세부사항</summary>
            <pre>{error?.message}</pre>
            {process.env.NODE_ENV === 'development' && (
              <pre>{error?.stack}</pre>
            )}
          </details>
        </div>
        
        <div className="error-actions">
          <button onClick={onRetry} className="btn-retry">
            다시 시도
          </button>
          <button onClick={onReload} className="btn-reload">
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}

// 특화된 오류 폴백들
function NetworkErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="error-fallback network-error">
      <h3>네트워크 연결 오류</h3>
      <p>인터넷 연결을 확인해주세요.</p>
      <button onClick={onRetry}>재연결 시도</button>
    </div>
  );
}

function ValidationErrorFallback({ error, onRetry }: { 
  error: ValidationError;
  onRetry: () => void;
}) {
  return (
    <div className="error-fallback validation-error">
      <h3>입력 오류</h3>
      <p>{error.message}</p>
      <p>필드: {error.field}</p>
      <button onClick={onRetry}>수정하기</button>
    </div>
  );
}
```

### 2. 훅 기반 오류 처리

```typescript
// 전역 오류 상태 관리
interface GlobalErrorState {
  errors: Array<{
    id: string;
    error: BaseError;
    timestamp: number;
    acknowledged: boolean;
  }>;
  criticalErrors: BaseError[];
}

function useGlobalErrorHandler() {
  const [errorState, setErrorState] = useState<GlobalErrorState>({
    errors: [],
    criticalErrors: []
  });
  
  const addError = useCallback((error: BaseError) => {
    const errorEntry = {
      id: generateId(),
      error,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    setErrorState(prev => ({
      ...prev,
      errors: [errorEntry, ...prev.errors.slice(0, 49)], // 최대 50개 유지
      criticalErrors: error.severity === 'critical' 
        ? [error, ...prev.criticalErrors.slice(0, 9)] // 최대 10개 유지
        : prev.criticalErrors
    }));
    
    // 심각한 오류는 즉시 처리
    if (error.severity === 'critical') {
      handleCriticalError(error);
    }
    
    // 자동 만료 (5분)
    setTimeout(() => {
      removeError(errorEntry.id);
    }, 5 * 60 * 1000);
    
  }, []);
  
  const removeError = useCallback((id: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.id !== id)
    }));
  }, []);
  
  const acknowledgeError = useCallback((id: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.map(e => 
        e.id === id ? { ...e, acknowledged: true } : e
      )
    }));
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrorState({
      errors: [],
      criticalErrors: []
    });
  }, []);
  
  return {
    errorState,
    addError,
    removeError,
    acknowledgeError,
    clearAllErrors
  };
}

// 액션별 오류 처리 훅
function useActionErrorHandler(actionName: string) {
  const { addError } = useGlobalErrorHandler();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useUserAction();
  
  const executeAction = useCallback(async (payload: any) => {
    setIsLoading(true);
    setLocalError(null);
    
    try {
      const result = await dispatch(actionName, payload);
      
      if (!result.success) {
        const error = new BusinessLogicError(
          result.error || 'UNKNOWN_ERROR',
          result.message || '작업 실행 실패',
          result.recoverable !== false
        );
        
        addError(error);
        setLocalError(result.message || '작업 실행 실패');
      }
      
      return result;
      
    } catch (error) {
      const handledError = error instanceof Error 
        ? new SystemError('ACTION_EXECUTION_ERROR', error.message)
        : new SystemError('UNKNOWN_ACTION_ERROR', '알 수 없는 오류 발생');
      
      addError(handledError);
      setLocalError(handledError.message);
      
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  }, [actionName, dispatch, addError]);
  
  const clearLocalError = useCallback(() => {
    setLocalError(null);
  }, []);
  
  return {
    executeAction,
    localError,
    isLoading,
    clearLocalError
  };
}

// 사용법 예시
function UserProfileForm() {
  const { executeAction, localError, isLoading, clearLocalError } = useActionErrorHandler('updateProfile');
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await executeAction({ data: formData });
      // 성공 처리
      showSuccessMessage('프로필이 업데이트되었습니다.');
    } catch (error) {
      // 오류는 이미 useActionErrorHandler에서 처리됨
      console.error('프로필 업데이트 실패:', error);
    }
  }, [executeAction, formData]);
  
  return (
    <form onSubmit={handleSubmit}>
      {localError && (
        <div className="error-message">
          {localError}
          <button onClick={clearLocalError}>×</button>
        </div>
      )}
      
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="이름"
      />
      
      <input
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="이메일"
        type="email"
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}
```

## 모니터링과 리포팅

### 1. 오류 수집과 분석

```typescript
// 오류 수집기
class ErrorCollector {
  private static instance: ErrorCollector;
  private errors: BaseError[] = [];
  private reportingEndpoint = '/api/errors';
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new ErrorCollector();
    }
    return this.instance;
  }
  
  collect(error: BaseError, context?: Record<string, any>) {
    const enrichedError = {
      ...error,
      context: {
        ...error.context,
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        sessionId: getSessionId()
      }
    };
    
    this.errors.push(enrichedError);
    
    // 즉시 보고가 필요한 오류들
    if (error.severity === 'critical' || this.shouldReportImmediately(error)) {
      this.reportImmediately(enrichedError);
    }
    
    // 배치 보고 (최대 10개 또는 5분마다)
    if (this.errors.length >= 10) {
      this.flushErrors();
    }
  }
  
  private shouldReportImmediately(error: BaseError): boolean {
    return (
      error.code === 'AUTHENTICATION_FAILURE' ||
      error.code === 'SECURITY_VIOLATION' ||
      error.code === 'DATA_CORRUPTION' ||
      error.severity === 'high'
    );
  }
  
  private async reportImmediately(error: BaseError) {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: [error],
          immediate: true,
          priority: 'high'
        })
      });
    } catch (reportingError) {
      console.error('즉시 오류 보고 실패:', reportingError);
    }
  }
  
  private async flushErrors() {
    if (this.errors.length === 0) return;
    
    const errorsToReport = [...this.errors];
    this.errors = [];
    
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: errorsToReport,
          immediate: false,
          priority: 'normal'
        })
      });
    } catch (reportingError) {
      console.error('배치 오류 보고 실패:', reportingError);
      // 실패한 오류들을 다시 큐에 추가
      this.errors.unshift(...errorsToReport);
    }
  }
  
  // 주기적 플러시 설정
  startPeriodicFlush(interval = 5 * 60 * 1000) { // 5분
    setInterval(() => {
      this.flushErrors();
    }, interval);
  }
}

// 전역 오류 수집 설정
function setupGlobalErrorCollection() {
  const collector = ErrorCollector.getInstance();
  collector.startPeriodicFlush();
  
  // 처리되지 않은 Promise 거부
  window.addEventListener('unhandledrejection', (event) => {
    const error = new SystemError(
      'UNHANDLED_PROMISE_REJECTION',
      event.reason?.message || '처리되지 않은 Promise 거부',
      { reason: event.reason }
    );
    
    collector.collect(error);
  });
  
  // 전역 JavaScript 오류
  window.addEventListener('error', (event) => {
    const error = new SystemError(
      'GLOBAL_JAVASCRIPT_ERROR',
      event.message,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    );
    
    collector.collect(error);
  });
}
```

### 2. 성능 영향 모니터링

```typescript
// 오류가 성능에 미치는 영향 추적
interface PerformanceImpact {
  errorType: string;
  performanceMetrics: {
    renderTime: number;
    handlerExecutionTime: number;
    memoryUsage: number;
    userInteractionDelay: number;
  };
  userExperienceMetrics: {
    taskCompletionRate: number;
    userSatisfactionScore: number;
    bounceRate: number;
  };
}

class ErrorPerformanceMonitor {
  private impacts: PerformanceImpact[] = [];
  
  recordErrorImpact(error: BaseError, metrics: Partial<PerformanceImpact>) {
    const impact: PerformanceImpact = {
      errorType: error.code,
      performanceMetrics: {
        renderTime: 0,
        handlerExecutionTime: 0,
        memoryUsage: 0,
        userInteractionDelay: 0,
        ...metrics.performanceMetrics
      },
      userExperienceMetrics: {
        taskCompletionRate: 1,
        userSatisfactionScore: 5,
        bounceRate: 0,
        ...metrics.userExperienceMetrics
      }
    };
    
    this.impacts.push(impact);
    
    // 성능 임계값 초과 시 알림
    this.checkPerformanceThresholds(impact);
  }
  
  private checkPerformanceThresholds(impact: PerformanceImpact) {
    const thresholds = {
      renderTime: 100, // ms
      handlerExecutionTime: 1000, // ms
      memoryUsage: 50, // MB
      userInteractionDelay: 200, // ms
      taskCompletionRate: 0.8, // 80%
      userSatisfactionScore: 3, // 1-5 scale
      bounceRate: 0.3 // 30%
    };
    
    const violations: string[] = [];
    
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = impact.performanceMetrics[metric] || impact.userExperienceMetrics[metric];
      
      if (
        (metric === 'taskCompletionRate' || metric === 'userSatisfactionScore') ? 
        value < threshold : 
        value > threshold
      ) {
        violations.push(`${metric}: ${value}`);
      }
    });
    
    if (violations.length > 0) {
      console.warn(`성능 임계값 초과 (오류: ${impact.errorType}):`, violations);
      
      // 심각한 성능 저하 시 알림
      if (violations.length >= 3) {
        reportPerformanceDegradation(impact, violations);
      }
    }
  }
  
  getErrorPerformanceReport() {
    const groupedByType = this.impacts.reduce((acc, impact) => {
      if (!acc[impact.errorType]) {
        acc[impact.errorType] = [];
      }
      acc[impact.errorType].push(impact);
      return acc;
    }, {} as Record<string, PerformanceImpact[]>);
    
    return Object.entries(groupedByType).map(([errorType, impacts]) => {
      const avgPerformance = this.calculateAverageMetrics(impacts.map(i => i.performanceMetrics));
      const avgUserExperience = this.calculateAverageMetrics(impacts.map(i => i.userExperienceMetrics));
      
      return {
        errorType,
        frequency: impacts.length,
        averagePerformanceImpact: avgPerformance,
        averageUserExperienceImpact: avgUserExperience,
        severity: this.calculateSeverity(avgPerformance, avgUserExperience)
      };
    });
  }
  
  private calculateAverageMetrics(metricsList: any[]) {
    const keys = Object.keys(metricsList[0] || {});
    const averages = {};
    
    keys.forEach(key => {
      const sum = metricsList.reduce((acc, metrics) => acc + (metrics[key] || 0), 0);
      averages[key] = sum / metricsList.length;
    });
    
    return averages;
  }
  
  private calculateSeverity(perfMetrics: any, uxMetrics: any): 'low' | 'medium' | 'high' {
    const perfScore = (perfMetrics.renderTime > 100 ? 1 : 0) +
                     (perfMetrics.handlerExecutionTime > 1000 ? 1 : 0) +
                     (perfMetrics.memoryUsage > 50 ? 1 : 0);
    
    const uxScore = (uxMetrics.taskCompletionRate < 0.8 ? 1 : 0) +
                   (uxMetrics.userSatisfactionScore < 3 ? 1 : 0) +
                   (uxMetrics.bounceRate > 0.3 ? 1 : 0);
    
    const totalScore = perfScore + uxScore;
    
    if (totalScore >= 4) return 'high';
    if (totalScore >= 2) return 'medium';
    return 'low';
  }
}
```

## 복구 전략

### 1. 자동 복구 메커니즘

```typescript
// 자동 복구 관리자
class RecoveryManager {
  private recoveryStrategies = new Map<string, (error: BaseError) => Promise<boolean>>();
  
  registerRecoveryStrategy(errorCode: string, strategy: (error: BaseError) => Promise<boolean>) {
    this.recoveryStrategies.set(errorCode, strategy);
  }
  
  async attemptRecovery(error: BaseError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.code);
    
    if (!strategy) {
      console.warn(`복구 전략이 없습니다: ${error.code}`);
      return false;
    }
    
    try {
      console.log(`복구 시도 중: ${error.code}`);
      const recovered = await strategy(error);
      
      if (recovered) {
        console.log(`복구 성공: ${error.code}`);
        reportRecoverySuccess(error);
      } else {
        console.warn(`복구 실패: ${error.code}`);
        reportRecoveryFailure(error);
      }
      
      return recovered;
    } catch (recoveryError) {
      console.error(`복구 전략 실행 중 오류 발생:`, recoveryError);
      reportRecoveryError(error, recoveryError);
      return false;
    }
  }
}

// 복구 전략들
const recoveryManager = new RecoveryManager();

// 네트워크 오류 복구
recoveryManager.registerRecoveryStrategy('NETWORK_ERROR', async (error) => {
  // 연결 상태 확인
  if (!navigator.onLine) {
    return false; // 오프라인 상태에서는 복구 불가능
  }
  
  // 간단한 ping 테스트
  try {
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
});

// 인증 오류 복구
recoveryManager.registerRecoveryStrategy('AUTHENTICATION_ERROR', async (error) => {
  try {
    // 토큰 갱신 시도
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json();
      // 새 토큰으로 업데이트
      localStorage.setItem('accessToken', newTokens.accessToken);
      return true;
    }
  } catch (refreshError) {
    console.error('토큰 갱신 실패:', refreshError);
  }
  
  // 갱신 실패 시 로그인 페이지로 리다이렉트
  window.location.href = '/login';
  return false;
});

// 상태 불일치 복구
recoveryManager.registerRecoveryStrategy('STATE_INCONSISTENCY', async (error) => {
  try {
    // 서버에서 최신 상태 가져오기
    const response = await fetch('/api/user/current');
    const latestUserData = await response.json();
    
    // 로컬 상태 재설정
    const userStore = getUserStore();
    userStore.setValue(latestUserData);
    
    return true;
  } catch (syncError) {
    console.error('상태 동기화 실패:', syncError);
    return false;
  }
});

// 메모리 부족 복구
recoveryManager.registerRecoveryStrategy('OUT_OF_MEMORY', async (error) => {
  try {
    // 캐시 정리
    clearApplicationCaches();
    
    // 가비지 컬렉션 강제 실행 (가능한 경우)
    if (window.gc) {
      window.gc();
    }
    
    // 메모리 사용량 재확인
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      return usedMB < 100; // 100MB 미만으로 감소했는지 확인
    }
    
    return true;
  } catch (cleanupError) {
    console.error('메모리 정리 실패:', cleanupError);
    return false;
  }
});
```

### 2. 우아한 성능 저하

```typescript
// 성능 저하 관리자
class GracefulDegradationManager {
  private currentMode: 'normal' | 'degraded' | 'minimal' = 'normal';
  private degradationTriggers: Array<{
    condition: () => boolean;
    mode: 'degraded' | 'minimal';
    description: string;
  }> = [];
  
  addDegradationTrigger(
    condition: () => boolean,
    mode: 'degraded' | 'minimal',
    description: string
  ) {
    this.degradationTriggers.push({ condition, mode, description });
  }
  
  checkDegradationConditions() {
    let targetMode: 'normal' | 'degraded' | 'minimal' = 'normal';
    let triggerDescription = '';
    
    for (const trigger of this.degradationTriggers) {
      if (trigger.condition()) {
        if (trigger.mode === 'minimal' || targetMode === 'normal') {
          targetMode = trigger.mode;
          triggerDescription = trigger.description;
        }
      }
    }
    
    if (targetMode !== this.currentMode) {
      this.switchMode(targetMode, triggerDescription);
    }
  }
  
  private switchMode(mode: 'normal' | 'degraded' | 'minimal', reason: string) {
    console.log(`성능 모드 변경: ${this.currentMode} → ${mode} (이유: ${reason})`);
    
    this.currentMode = mode;
    
    // 애플리케이션에 모드 변경 알림
    window.dispatchEvent(new CustomEvent('performance-mode-change', {
      detail: { mode, reason }
    }));
    
    // UI 알림
    if (mode !== 'normal') {
      showNotification(
        `성능 최적화를 위해 일부 기능이 제한됩니다. (이유: ${reason})`,
        'warning'
      );
    }
  }
  
  getCurrentMode() {
    return this.currentMode;
  }
  
  isNormalMode() {
    return this.currentMode === 'normal';
  }
  
  isDegradedMode() {
    return this.currentMode === 'degraded';
  }
  
  isMinimalMode() {
    return this.currentMode === 'minimal';
  }
}

// 성능 저하 조건들
const degradationManager = new GracefulDegradationManager();

// 메모리 부족
degradationManager.addDegradationTrigger(
  () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8;
    }
    return false;
  },
  'degraded',
  '메모리 부족'
);

// 네트워크 속도 저하
degradationManager.addDegradationTrigger(
  () => {
    const connection = (navigator as any).connection;
    return connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g'
    );
  },
  'minimal',
  '네트워크 속도 저하'
);

// 오류 발생률 높음
let errorCount = 0;
let lastErrorReset = Date.now();

degradationManager.addDegradationTrigger(
  () => {
    const now = Date.now();
    
    // 1분마다 오류 횟수 리셋
    if (now - lastErrorReset > 60000) {
      errorCount = 0;
      lastErrorReset = now;
    }
    
    // 분당 5개 이상의 오류
    return errorCount > 5;
  },
  'degraded',
  '높은 오류 발생률'
);

// 주기적 성능 모드 체크
setInterval(() => {
  degradationManager.checkDegradationConditions();
}, 10000); // 10초마다

// 성능 모드에 따른 컴포넌트 동작
function PerformanceAwareComponent() {
  const [performanceMode, setPerformanceMode] = useState(degradationManager.getCurrentMode());
  
  useEffect(() => {
    const handleModeChange = (event: CustomEvent) => {
      setPerformanceMode(event.detail.mode);
    };
    
    window.addEventListener('performance-mode-change', handleModeChange as EventListener);
    return () => window.removeEventListener('performance-mode-change', handleModeChange as EventListener);
  }, []);
  
  // 성능 모드에 따른 렌더링
  if (degradationManager.isMinimalMode()) {
    return <MinimalModeComponent />;
  }
  
  if (degradationManager.isDegradedMode()) {
    return <DegradedModeComponent />;
  }
  
  return <FullFeatureComponent />;
}
```

---

## 모범 사례 체크리스트

### ✅ 오류 분류와 처리
- [ ] 오류 타입별 적절한 처리 전략
- [ ] 심각도 분류와 우선순위 설정
- [ ] 복구 가능성에 따른 분류
- [ ] 사용자 친화적인 오류 메시지

### ✅ 핸들러 오류 처리
- [ ] 구조화된 오류 처리 패턴
- [ ] 재시도 메커니즘 구현
- [ ] 회로 차단기 패턴 적용
- [ ] 적절한 오류 로깅

### ✅ UI 오류 처리
- [ ] 오류 경계 구현
- [ ] 폴백 컴포넌트 제공
- [ ] 사용자 액션별 오류 처리
- [ ] 로딩과 오류 상태 관리

### ✅ 모니터링과 리포팅
- [ ] 오류 수집과 분석
- [ ] 성능 영향 추적
- [ ] 자동 알림 시스템
- [ ] 오류 트렌드 분석

### ✅ 복구와 성능 저하
- [ ] 자동 복구 전략
- [ ] 우아한 성능 저하
- [ ] 상태 동기화 메커니즘
- [ ] 사용자 경험 보호

---

## 요약

효과적인 오류 처리는 다음 원칙을 따릅니다:

- **예방 우선** - 오류 발생을 미리 방지
- **빠른 감지** - 오류를 즉시 인식하고 분류
- **자동 복구** - 가능한 경우 자동으로 복구 시도
- **사용자 경험 보호** - 오류가 사용자에게 미치는 영향 최소화
- **지속적인 개선** - 오류 패턴 분석으로 시스템 개선

체계적인 오류 처리를 통해 안정적이고 신뢰할 수 있는 애플리케이션을 구축할 수 있습니다.

---

::: tip 다음 단계
- [공통 함정](./common-pitfalls) - 오류 처리 시 흔히 하는 실수들
- [모범 사례](./best-practices) - 프로덕션 환경 오류 처리 권장사항
:::