# 핸들러 ID 전략

핸들러 ID는 Context-Action 프레임워크에서 핸들러를 식별하고 관리하는 핵심 메커니즘입니다. 효과적인 ID 전략은 디버깅, 모니터링, 그리고 핸들러 관리를 크게 개선합니다.

## 핸들러 ID 기본 개념

### 자동 생성 vs 명시적 ID

```typescript
// 자동 생성 ID (기본값)
register('updateProfile', handler, {
  priority: 100,
  blocking: true
  // id 없음 - 프레임워크가 자동 생성
});

// 명시적 ID (권장)
register('updateProfile', handler, {
  priority: 100,
  blocking: true,
  id: 'profile-updater' // 명시적 ID 지정
});
```

### ID 생성 규칙

프레임워크는 다음 순서로 ID를 결정합니다:

1. **명시적 ID**: 사용자가 제공한 `id` 값
2. **자동 생성**: `{액션명}-{핸들러번호}` 형식

```typescript
// 명시적 ID 예시
register('login', loginHandler, { 
  id: 'user-authentication-handler' 
});

// 자동 생성 ID 예시 (login-1, login-2, ...)
register('login', validationHandler);
register('login', mainHandler);
```

## ID 명명 규칙

### 1. 일관된 명명 컨벤션

```typescript
// ✅ 권장: 도메인-기능-역할 패턴
register('updateProfile', handler, { 
  id: 'user-profile-updater' 
});

register('validateProfile', handler, { 
  id: 'user-profile-validator' 
});

register('logProfileUpdate', handler, { 
  id: 'user-profile-logger' 
});

// ✅ 권장: 카테고리별 그룹화
register('login', authHandler, { 
  id: 'auth-login-main' 
});

register('login', auditHandler, { 
  id: 'audit-login-tracker' 
});

register('login', metricsHandler, { 
  id: 'metrics-login-counter' 
});
```

### 2. 계층적 명명 구조

```typescript
// 계층적 구조로 핸들러 조직화
const HandlerIds = {
  User: {
    Auth: {
      LOGIN_MAIN: 'user-auth-login-main',
      LOGIN_VALIDATOR: 'user-auth-login-validator',
      LOGOUT_MAIN: 'user-auth-logout-main'
    },
    Profile: {
      UPDATE_MAIN: 'user-profile-update-main',
      UPDATE_VALIDATOR: 'user-profile-update-validator',
      DELETE_MAIN: 'user-profile-delete-main'
    }
  },
  Cart: {
    Items: {
      ADD_MAIN: 'cart-items-add-main',
      REMOVE_MAIN: 'cart-items-remove-main',
      UPDATE_QUANTITY: 'cart-items-update-quantity'
    }
  }
} as const;

// 사용법
register('login', loginHandler, { 
  id: HandlerIds.User.Auth.LOGIN_MAIN,
  priority: 100 
});

register('updateProfile', updateHandler, { 
  id: HandlerIds.User.Profile.UPDATE_MAIN,
  priority: 100 
});
```

### 3. 환경별 ID 전략

```typescript
// 환경별 ID 접두사
const getHandlerId = (baseId: string, environment?: string) => {
  const env = environment || process.env.NODE_ENV || 'development';
  return `${env}-${baseId}`;
};

// 개발 환경: dev-user-profile-updater
// 프로덕션: prod-user-profile-updater
register('updateProfile', handler, {
  id: getHandlerId('user-profile-updater'),
  priority: 100
});
```

## 고급 ID 패턴

### 1. 동적 ID 생성

```typescript
// 사용자별 동적 핸들러
function createUserSpecificHandler(userId: string) {
  const handlerId = `user-${userId}-profile-updater`;
  
  return {
    id: handlerId,
    handler: async (payload, controller) => {
      // 특정 사용자를 위한 로직
      console.log(`Processing for user ${userId}`);
      // ...
    }
  };
}

// 등록
function useUserSpecificHandlers(userId: string) {
  const register = useUserActionRegister();
  
  useEffect(() => {
    if (!register || !userId) return;
    
    const { id, handler } = createUserSpecificHandler(userId);
    const unregister = register('updateProfile', handler, {
      id,
      priority: 100,
      tags: ['user-specific', userId]
    });
    
    return unregister;
  }, [register, userId]);
}
```

### 2. 버전 관리 ID

```typescript
// 핸들러 버전 관리
const HandlerVersions = {
  PROFILE_UPDATER_V1: 'user-profile-updater-v1',
  PROFILE_UPDATER_V2: 'user-profile-updater-v2',
  PROFILE_UPDATER_CURRENT: 'user-profile-updater-v2' // 현재 버전
} as const;

// 버전별 핸들러 등록
register('updateProfile', legacyHandler, {
  id: HandlerVersions.PROFILE_UPDATER_V1,
  priority: 90,
  deprecated: true
});

register('updateProfile', newHandler, {
  id: HandlerVersions.PROFILE_UPDATER_V2,
  priority: 100,
  version: '2.0.0'
});

// 기능 플래그와 결합
const useVersionedHandler = (useV2: boolean) => {
  const handlerId = useV2 
    ? HandlerVersions.PROFILE_UPDATER_V2 
    : HandlerVersions.PROFILE_UPDATER_V1;
    
  register('updateProfile', 
    useV2 ? newHandler : legacyHandler, 
    { id: handlerId, priority: 100 }
  );
};
```

### 3. 조건부 핸들러 ID

```typescript
// 조건에 따른 다른 핸들러
function useConditionalHandlers(userRole: 'admin' | 'user' | 'guest') {
  const register = useUserActionRegister();
  
  useEffect(() => {
    if (!register) return;
    
    const unregisterFunctions: Array<() => void> = [];
    
    // 기본 핸들러 (모든 역할)
    unregisterFunctions.push(
      register('updateProfile', baseHandler, {
        id: `profile-updater-${userRole}`,
        priority: 100
      })
    );
    
    // 관리자 전용 핸들러
    if (userRole === 'admin') {
      unregisterFunctions.push(
        register('updateProfile', adminAuditHandler, {
          id: 'profile-updater-admin-audit',
          priority: 150
        })
      );
    }
    
    // 일반 사용자 전용 핸들러
    if (userRole === 'user') {
      unregisterFunctions.push(
        register('updateProfile', userValidationHandler, {
          id: 'profile-updater-user-validation',
          priority: 110
        })
      );
    }
    
    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [register, userRole]);
}
```

## 핸들러 발견과 관리

### 1. 핸들러 레지스트리 조회

```typescript
// 등록된 핸들러 정보 조회
function useHandlerInspector() {
  const registry = useUserActionRegister();
  
  const getHandlerInfo = useCallback((actionName: string) => {
    if (!registry) return [];
    
    // 특정 액션의 모든 핸들러 정보 조회
    return registry.getHandlers(actionName).map(handler => ({
      id: handler.id,
      priority: handler.priority,
      blocking: handler.blocking,
      tags: handler.tags,
      category: handler.category
    }));
  }, [registry]);
  
  const getAllHandlers = useCallback(() => {
    if (!registry) return {};
    
    // 모든 등록된 핸들러 정보
    return registry.getAllHandlers();
  }, [registry]);
  
  return { getHandlerInfo, getAllHandlers };
}

// 사용법
function HandlerDebugPanel() {
  const { getHandlerInfo, getAllHandlers } = useHandlerInspector();
  const [selectedAction, setSelectedAction] = useState('updateProfile');
  
  const handlers = getHandlerInfo(selectedAction);
  const allHandlers = getAllHandlers();
  
  return (
    <div>
      <h3>핸들러 검사기</h3>
      
      <select 
        value={selectedAction} 
        onChange={(e) => setSelectedAction(e.target.value)}
      >
        {Object.keys(allHandlers).map(action => (
          <option key={action} value={action}>{action}</option>
        ))}
      </select>
      
      <div>
        <h4>{selectedAction} 핸들러들:</h4>
        {handlers.map(handler => (
          <div key={handler.id}>
            <strong>{handler.id}</strong> 
            (우선순위: {handler.priority}, 
             블로킹: {handler.blocking ? 'Yes' : 'No'})
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. 핸들러 태깅 시스템

```typescript
// 태그 기반 핸들러 분류
const HandlerTags = {
  BUSINESS_LOGIC: 'business-logic',
  VALIDATION: 'validation',
  AUDIT: 'audit',
  METRICS: 'metrics',
  CACHE: 'cache',
  NOTIFICATION: 'notification'
} as const;

// 태그와 함께 핸들러 등록
register('updateProfile', validationHandler, {
  id: 'profile-validation',
  priority: 200,
  tags: [HandlerTags.VALIDATION, 'user-input'],
  category: 'validation'
});

register('updateProfile', businessHandler, {
  id: 'profile-business',
  priority: 100,
  tags: [HandlerTags.BUSINESS_LOGIC, 'core'],
  category: 'business'
});

register('updateProfile', auditHandler, {
  id: 'profile-audit',
  priority: 50,
  tags: [HandlerTags.AUDIT, 'security'],
  category: 'audit',
  blocking: false
});

// 태그 기반 쿼리
function useHandlersByTag(tag: string) {
  const registry = useUserActionRegister();
  
  return useCallback(() => {
    if (!registry) return [];
    
    return registry.getHandlersByTag(tag);
  }, [registry, tag]);
}
```

### 3. 핸들러 메트릭스

```typescript
// 핸들러 성능 추적
interface HandlerMetrics {
  id: string;
  executionCount: number;
  averageExecutionTime: number;
  errorCount: number;
  lastExecutionTime: number;
}

class HandlerMetricsCollector {
  private metrics = new Map<string, HandlerMetrics>();
  
  recordExecution(handlerId: string, executionTime: number, hasError = false) {
    const existing = this.metrics.get(handlerId) || {
      id: handlerId,
      executionCount: 0,
      averageExecutionTime: 0,
      errorCount: 0,
      lastExecutionTime: 0
    };
    
    existing.executionCount += 1;
    existing.averageExecutionTime = (
      (existing.averageExecutionTime * (existing.executionCount - 1)) + executionTime
    ) / existing.executionCount;
    
    if (hasError) {
      existing.errorCount += 1;
    }
    
    existing.lastExecutionTime = Date.now();
    this.metrics.set(handlerId, existing);
  }
  
  getMetrics(handlerId: string): HandlerMetrics | undefined {
    return this.metrics.get(handlerId);
  }
  
  getAllMetrics(): HandlerMetrics[] {
    return Array.from(this.metrics.values());
  }
}

// 메트릭스 수집 핸들러
const metricsCollector = new HandlerMetricsCollector();

const createMetricsWrapper = (handlerId: string, originalHandler: Function) => {
  return async (payload: any, controller: any) => {
    const startTime = performance.now();
    let hasError = false;
    
    try {
      const result = await originalHandler(payload, controller);
      return result;
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      const executionTime = performance.now() - startTime;
      metricsCollector.recordExecution(handlerId, executionTime, hasError);
    }
  };
};
```

## 디버깅과 모니터링

### 1. 핸들러 실행 추적

```typescript
// 핸들러 실행 로깅
const createLoggingWrapper = (handlerId: string, originalHandler: Function) => {
  return async (payload: any, controller: any) => {
    console.group(`🔧 Handler: ${handlerId}`);
    console.log('Payload:', payload);
    console.time(`Handler ${handlerId}`);
    
    try {
      const result = await originalHandler(payload, controller);
      console.log('Result:', result);
      console.log('✅ Handler completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Handler failed:', error);
      throw error;
    } finally {
      console.timeEnd(`Handler ${handlerId}`);
      console.groupEnd();
    }
  };
};

// 개발 환경에서 자동 래핑
const registerWithLogging = (action: string, handler: Function, config: any) => {
  const wrappedHandler = process.env.NODE_ENV === 'development'
    ? createLoggingWrapper(config.id || 'anonymous', handler)
    : handler;
    
  return register(action, wrappedHandler, config);
};
```

### 2. 핸들러 상태 모니터링

```typescript
// 핸들러 상태 대시보드
function HandlerMonitorDashboard() {
  const [metrics, setMetrics] = useState<HandlerMetrics[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(metricsCollector.getAllMetrics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
      <h3>핸들러 모니터링 대시보드</h3>
      <table>
        <thead>
          <tr>
            <th>핸들러 ID</th>
            <th>실행 횟수</th>
            <th>평균 실행 시간</th>
            <th>오류 횟수</th>
            <th>마지막 실행</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric.id}>
              <td>{metric.id}</td>
              <td>{metric.executionCount}</td>
              <td>{metric.averageExecutionTime.toFixed(2)}ms</td>
              <td style={{ color: metric.errorCount > 0 ? 'red' : 'green' }}>
                {metric.errorCount}
              </td>
              <td>
                {new Date(metric.lastExecutionTime).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 모범 사례

### 1. ID 설계 원칙

```typescript
// ✅ 좋음: 설명적이고 일관된 ID
const HANDLER_IDS = {
  // 도메인-기능-역할 패턴
  USER_PROFILE_VALIDATOR: 'user-profile-validator',
  USER_PROFILE_UPDATER: 'user-profile-updater',
  USER_PROFILE_AUDITOR: 'user-profile-auditor',
  
  // 명확한 책임 표시
  CART_ITEM_ADDER: 'cart-item-adder',
  CART_TOTAL_CALCULATOR: 'cart-total-calculator',
  CART_PERSISTENCE_SYNC: 'cart-persistence-sync'
} as const;

// ❌ 피하기: 모호하거나 일관성 없는 ID
const BAD_IDS = {
  HANDLER1: 'handler1',           // 의미 없음
  UserStuff: 'UserStuff',         // 카멜케이스 + 모호함
  'update-thing': 'update-thing', // 너무 일반적
  'user_profile_UPDATER': 'user_profile_UPDATER' // 일관성 없는 케이스
};
```

### 2. 조직화 패턴

```typescript
// 도메인별 ID 조직화
export const UserHandlerIds = {
  Authentication: {
    LOGIN_MAIN: 'user-auth-login-main',
    LOGIN_VALIDATOR: 'user-auth-login-validator',
    LOGOUT_MAIN: 'user-auth-logout-main',
    TOKEN_REFRESH: 'user-auth-token-refresh'
  },
  Profile: {
    UPDATE_MAIN: 'user-profile-update-main',
    UPDATE_VALIDATOR: 'user-profile-update-validator',
    DELETE_MAIN: 'user-profile-delete-main',
    AVATAR_UPLOAD: 'user-profile-avatar-upload'
  }
} as const;

export const CartHandlerIds = {
  Items: {
    ADD_MAIN: 'cart-items-add-main',
    REMOVE_MAIN: 'cart-items-remove-main',
    UPDATE_QUANTITY: 'cart-items-update-quantity'
  },
  Calculation: {
    TOTAL_CALCULATOR: 'cart-calc-total',
    TAX_CALCULATOR: 'cart-calc-tax',
    DISCOUNT_APPLIER: 'cart-calc-discount'
  }
} as const;
```

### 3. 문서화 패턴

```typescript
/**
 * 사용자 프로필 업데이트 핸들러
 * 
 * @id user-profile-updater-main
 * @priority 100
 * @blocking true
 * @category business-logic
 * @tags ["user", "profile", "business"]
 * 
 * @description 사용자 프로필 정보를 검증하고 업데이트합니다.
 * @dependencies user-profile-validator (우선순위 200)
 * @affects user-profile-auditor (우선순위 50)
 * 
 * @author TeamName
 * @version 1.2.0
 * @since 1.0.0
 */
register('updateProfile', updateProfileHandler, {
  id: UserHandlerIds.Profile.UPDATE_MAIN,
  priority: 100,
  blocking: true,
  category: 'business-logic',
  tags: ['user', 'profile', 'business'],
  version: '1.2.0'
});
```

---

## 요약

효과적인 핸들러 ID 전략은 다음을 제공합니다:

- **명확한 식별** - 의미있고 일관된 명명 규칙
- **조직화된 구조** - 계층적이고 논리적인 ID 체계
- **디버깅 지원** - 추적 가능하고 모니터링 가능한 핸들러
- **확장성** - 동적이고 조건부 핸들러 관리
- **유지보수성** - 문서화되고 버전 관리되는 핸들러

올바른 ID 전략을 따르면 복잡한 핸들러 시스템도 쉽게 관리하고 디버깅할 수 있습니다.

---

::: tip 다음 단계
- [크로스 도메인 통합](./cross-domain-integration) - 도메인 간 핸들러 통신
- [성능 최적화](./performance) - 핸들러 성능 최적화 기법
- [모범 사례](./best-practices) - 프로덕션 환경 권장사항
:::