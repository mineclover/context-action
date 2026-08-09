# 등록 패턴

Context-Action 프레임워크를 위한 핸들러 등록 패턴과 고급 구성 옵션입니다.

## 필수 조건

이 패턴 가이드는 기본적인 액션 컨텍스트 설정이 있다고 가정합니다. 없다면 먼저 [기본 액션 설정](../setup/basic-action-setup.md)을 참조하세요.

## Import
```typescript
import { 
  ActionRegister,
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig
} from '@context-action/core';
import { 
  createActionContext,
  useActionHandler,
  useActionRegister
} from '@context-action/react';
import { useEffect, useRef, useState, useCallback } from 'react';
```

## 설정 패턴

### 기본 액션 컨텍스트 설정
```typescript
// 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  validateData: { data: any };
  saveData: { data: any };
  resetState: void;
}

// 액션 컨텍스트 생성
const {
  Provider: AppActionProvider,
  useActionDispatch: useAppDispatch,
  useActionHandler: useAppHandler,
  useActionRegister: useAppRegister
} = createActionContext<AppActions>('App');

// 프로바이더 설정
function App() {
  return (
    <AppActionProvider>
      <AppContent />
    </AppActionProvider>
  );
}
```

### v1 역할별 등록

새 코드에서는 역할별 API로 등록합니다. 등록 지점에서 admission 경계, 타입이 지정된
결과 생성, 종료 후 부수 효과를 명확히 볼 수 있습니다. `register()`는 기존 pipeline과의
호환성을 위해 유지됩니다.

```typescript
import { ActionRegister, type ActionPayloadMap, type ActionResultMap } from '@context-action/core';

interface SaveActions extends ActionPayloadMap {
  save: { documentId: string; canSave: boolean };
}

interface SaveResults extends ActionResultMap<SaveActions> {
  save: { documentId: string; savedAt: string };
}

const register = new ActionRegister<SaveActions, SaveResults>({ name: 'Save' });

register.registerGuard('save', (payload, controller) => {
  if (!payload.canSave) controller.abort('저장 권한이 없습니다.');
}, { id: 'save-permission', priority: 100 });

register.registerResult('save', async (payload) => {
  await documentService.save(payload.documentId);
  return { documentId: payload.documentId, savedAt: new Date().toISOString() };
}, {
  id: 'save-document',
  priority: 50,
  scheduling: 'await-before-next',
  errorPolicy: 'fatal',
});

register.registerObserver('save', ({ outcome, result }) => {
  auditLog.write({ action: 'save', outcome, result });
}, { id: 'save-audit', when: 'always', scheduling: 'start-and-continue' });
```

### 액션 등록 접근
```typescript
// 핸들러 등록이 있는 컴포넌트
function HandlerSetup() {
  const register = useAppRegister();
  
  // useActionHandler 훅을 사용한 핸들러 등록 (권장)
  useAppHandler('updateUser', async (payload, controller) => {
    const user = await userService.update(payload.id, payload);
    controller.setResult(user);
  });
  
  // 또는 등록 인스턴스로 직접 등록
  useEffect(() => {
    const unregister = register.register('deleteUser', async (payload, controller) => {
      await userService.delete(payload.id);
      controller.setResult({ deleted: true });
    });
    
    return unregister; // 언마운트 시 정리
  }, [register]);
  
  return <div>핸들러 등록됨</div>;
}
```

## 기본 핸들러 등록

타입 안전성과 구성 옵션을 갖춘 액션 핸들러를 등록합니다.

### 간단한 핸들러 등록
```typescript
// useActionHandler 훅 사용 (권장)
function UserComponent() {
  // useActionHandler로 직접 핸들러 등록
  useAppHandler('updateUser', async (payload, controller) => {
    const user = await userService.update(payload.id, payload);
    controller.setResult(user);
  });
  
  return <div>사용자 관리 컴포넌트</div>;
}
```

### 구성이 있는 핸들러
```typescript
// 구성 옵션을 위한 직접 등록 접근
function ConfiguredHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 우선순위와 진단 메타데이터가 있는 핸들러
    const unregister = register.register('updateUser', async (payload, controller) => {
      const user = await userService.update(payload.id, payload);
      controller.setResult(user);
    }, {
      priority: 100,
      metadata: { labels: ['user', 'crud'] }
    });
    
    return unregister;
  }, [register]);
  
  return <div>구성된 핸들러 등록됨</div>;
}
```

## 핸들러 구성 옵션

### 우선순위와 실행 순서

```typescript
function PriorityHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 높은 우선순위 핸들러가 먼저 실행
    const unregisterValidation = register.register('validateUser', async (payload, controller) => {
      const isValid = await userService.validate(payload);
      if (!isValid) {
        controller.abort('검증 실패');
        return;
      }
      controller.setResult({ validated: true });
    }, {
      priority: 100,  // 높은 우선순위 - 첫 번째 실행
      metadata: { labels: ['validation'] }
    });
    
    const unregisterSave = register.register('saveUser', async (payload, controller) => {
      const user = await userService.save(payload);
      controller.setResult(user);
    }, {
      priority: 50,   // 낮은 우선순위 - 검증 후 실행
      metadata: { labels: ['persistence'] }
    });
    
    return () => {
      unregisterValidation();
      unregisterSave();
    };
  }, [register]);
  
  return <div>우선순위 핸들러 등록됨</div>;
}
```

### 성능 최적화

```typescript
function PerformanceHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 검색 입력 디바운스 (일시정지 대기)
    const unregisterSearch = register.register('searchUsers', async (payload, controller) => {
      const results = await userService.search(payload.query);
      controller.setResult(results);
    }, {
      debounce: 300,  // 마지막 호출 후 300ms 대기
      id: 'searchUsersHandler'
    });
    
    // 스크롤 이벤트 스로틀 (빈도 제한)
    const unregisterScroll = register.register('updateScrollPosition', async (payload, controller) => {
      // 스토어나 분석에서 스크롤 위치 업데이트
      scrollService.updatePosition(payload.position);
      controller.setResult({ updated: true });
    }, {
      throttle: 100,  // 디스패치 admission 기준 100ms당 최대 한 번
      id: 'updateScrollPositionHandler'
    });
    
    return () => {
      unregisterSearch();
      unregisterScroll();
    };
  }, [register]);
  
  return <div>성능 최적화된 핸들러 등록됨</div>;
}
```

### 조건부 핸들러

```typescript
function ConditionalHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 사용자 구독에 기반한 조건부 핸들러
    const unregisterPremium = register.register('premiumFeature', async (payload, controller) => {
      const result = await premiumService.executePremiumFeature(payload);
      controller.setResult(result);
    }, {
      priority: 100,
      id: 'premiumFeatureHandler'
    });
    
    // 환경별 핸들러
    const unregisterDebug = register.register('debugAction', async (payload, controller) => {
      console.log('디버그 액션:', payload);
      debugService.log(payload);
      controller.setResult({ debugged: true });
    }, {
      priority: 50,
      id: 'debugActionHandler'
    });
    
    const unregisterAnalytics = register.register('analyticsTrack', async (payload, controller) => {
      await analyticsService.track(payload.event, payload.data);
      controller.setResult({ tracked: true });
    }, {
      priority: 80,
      id: 'analyticsTrackHandler'
    });
    
    return () => {
      unregisterPremium();
      unregisterDebug();
      unregisterAnalytics();
    };
  }, [register]);
  
  return <div>조건부 핸들러 등록됨</div>;
}
```

### 일회성 핸들러

```typescript
function OneTimeHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 핸들러가 한 번 실행되면 자동 제거
    const unregister = register.register('initializeApp', async (payload, controller) => {
      await appService.initialize();
      controller.setResult({ initialized: true });
    }, {
      once: true,
      priority: 1000,
      id: 'initializeAppHandler'
    });
    
    // 일회성 핸들러에는 unregister 호출 불필요
    // 실행 후 자동 제거됨
    return unregister;
  }, [register]);
  
  return <div>일회성 핸들러 등록됨</div>;
}
```

## 고급 구성

### 종합 구성

```typescript
function FullConfigurationSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('fullConfigHandler', async (payload, controller) => {
      // 핵심 비즈니스 로직 구현
      const result = await businessService.processData(payload);
      controller.setResult(result);
    }, {
      priority: 100,          // 실행 우선순위
      id: 'fullConfigHandler', // 핸들러 고유 식별자
      blocking: true,         // 비동기 핸들러 완료 대기
      once: false,            // 여러 번 실행 가능
      debounce: 200,          // 호출 디바운스 (ms)
      throttle: 1000          // 디스패치 admission 스로틀 (ms)
    });
    
    return unregister;
  }, [register]);
  
  return <div>완전히 구성된 핸들러 등록됨</div>;
}
```

### 핸들러 의존성

```typescript
function DependencyHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 다른 핸들러에 의존하는 핸들러
    const unregisterDependent = register.register('dependentHandler', async (payload, controller) => {
      // 이 핸들러는 validationHandler와 authHandler 후에 실행
      const processedData = await dataService.process(payload);
      controller.setResult(processedData);
    }, {
      priority: 50,
      id: 'dependentHandler',
      blocking: true
    });
    
    // 충돌 핸들러 (하나만 실행됨)
    const unregisterModern = register.register('modernHandler', async (payload, controller) => {
      const result = await modernService.process(payload);
      controller.setResult(result);
    }, {
      priority: 100,
      id: 'modernHandler',
      blocking: false
    });
    
    return () => {
      unregisterDependent();
      unregisterModern();
    };
  }, [register]);
  
  return <div>의존성 핸들러 등록됨</div>;
}
```

## 핸들러의 에러 처리

### 우아한 에러 복구

```typescript
function ErrorRecoveryHandlerSetup() {
  // 간단한 에러 복구를 위한 useActionHandler 훅 사용
  useAppHandler('resilientOperation', async (payload, controller) => {
    try {
      const result = await riskyOperation(payload);
      controller.setResult(result);
    } catch (error) {
      // 에러 로그하지만 파이프라인 중단하지 않음
      console.error('작업 실패:', error);
      controller.setResult({ error: error.message, fallback: true });
    }
  });
  
  return <div>복원력 있는 핸들러 등록됨</div>;
}
```

### 서킷 브레이커 패턴

```typescript
function CircuitBreakerHandlerSetup() {
  const register = useAppRegister();
  
  // 서킷 브레이커 상태 (실제 앱에서는 외부 상태 관리 사용)
  const circuitState = useRef({
    failureCount: 0,
    MAX_FAILURES: 3
  });
  
  useEffect(() => {
    const unregister = register.register('externalAPI', async (payload, controller) => {
      if (circuitState.current.failureCount >= circuitState.current.MAX_FAILURES) {
        controller.abort('서킷 브레이커 열림');
        return;
      }
      
      try {
        const result = await externalAPI.call(payload);
        circuitState.current.failureCount = 0;  // 성공 시 리셋
        controller.setResult(result);
      } catch (error) {
        circuitState.current.failureCount++;
        throw error;
      }
    }, {
      metadata: { labels: ['external', 'api'] }
    });
    
    return unregister;
  }, [register]);
  
  return <div>서킷 브레이커 핸들러 등록됨</div>;
}
```

### 검증 핸들러

```typescript
function ValidationHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('validateInput', async (payload, controller) => {
      const errors = [];
      
      if (!payload.email?.includes('@')) {
        errors.push('잘못된 이메일 형식');
      }
      
      if (!payload.name?.trim()) {
        errors.push('이름은 필수입니다');
      }
      
      if (errors.length > 0) {
        controller.abort('검증 실패', { errors });
        return;
      }
      
      // 후속 핸들러를 위해 페이로드 수정
      controller.modifyPayload(p => ({
        ...p,
        email: p.email.toLowerCase(),
        name: p.name.trim()
      }));
    }, {
      priority: 1000,  // 첫 번째 실행
      metadata: { labels: ['validation'] }
    });
    
    return unregister;
  }, [register]);
  
  return <div>검증 핸들러 등록됨</div>;
}
```

## 핸들러 라이프사이클 관리

### 동적 핸들러 등록

```typescript
function DynamicHandlerSetup() {
  const register = useAppRegister();
  const [userRole, setUserRole] = useState<string>('guest');
  
  // 조건에 기반한 동적 핸들러 등록
  const registerUserHandlers = useCallback((role: string) => {
    const unregisterFunctions: (() => void)[] = [];
    
    if (role === 'admin') {
      const unregister = register.register('adminAction', async (payload, controller) => {
        const result = await adminService.executeAction(payload);
        controller.setResult(result);
      }, {
        metadata: { labels: ['admin', 'privileged'] }
      });
      unregisterFunctions.push(unregister);
    }
    
    if (role === 'moderator') {
      const unregister = register.register('moderateContent', async (payload, controller) => {
        const result = await moderationService.moderate(payload);
        controller.setResult(result);
      }, {
        metadata: { labels: ['moderation'] }
      });
      unregisterFunctions.push(unregister);
    }
    
    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [register]);
  
  useEffect(() => {
    return registerUserHandlers(userRole);
  }, [userRole, registerUserHandlers]);
  
  return (
    <div>
      <div>역할에 대한 동적 핸들러: {userRole}</div>
      <button onClick={() => setUserRole('admin')}>관리자 설정</button>
      <button onClick={() => setUserRole('moderator')}>모더레이터 설정</button>
    </div>
  );
}
```

### 핸들러 정리

```typescript
function HandlerCleanupSetup() {
  const register = useAppRegister();
  const unregisterFunctionsRef = useRef(new Set<() => void>());
  
  useEffect(() => {
    // 정리 추적을 위한 등록 해제 함수 저장
    const unregisterFunctions = unregisterFunctionsRef.current;
    
    // 정리 추적과 함께 등록
    const unregister = register.register('temporaryHandler', async (payload, controller) => {
      // 임시 핸들러 로직
      const result = await tempService.process(payload);
      controller.setResult(result);
    }, {
      metadata: { labels: ['temporary'] }
    });
    
    unregisterFunctions.add(unregister);
    
    // 정리 함수
    return () => {
      unregisterFunctions.forEach(fn => fn());
      unregisterFunctions.clear();
    };
  }, [register]);
  
  // 수동 정리 함수 (필요한 경우)
  const cleanupAllHandlers = useCallback(() => {
    unregisterFunctionsRef.current.forEach(fn => fn());
    unregisterFunctionsRef.current.clear();
  }, []);
  
  return (
    <div>
      <div>정리 추적이 있는 임시 핸들러</div>
      <button onClick={cleanupAllHandlers}>수동 정리</button>
    </div>
  );
}
```

### 대량 등록

```typescript
function BulkRegistrationSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // 핸들러 구성 정의
    const handlersConfig = {
      validateUser: { 
        handler: async (payload: any, controller: any) => {
          const isValid = await userService.validate(payload);
          controller.setResult({ isValid });
        }, 
        priority: 100 
      },
      saveUser: { 
        handler: async (payload: any, controller: any) => {
          const user = await userService.save(payload);
          controller.setResult(user);
        }, 
        priority: 50 
      },
      notifyUser: { 
        handler: async (payload: any, controller: any) => {
          await notificationService.send(payload);
          controller.setResult({ notified: true });
        }, 
        priority: 10 
      }
    };
    
    // 여러 핸들러를 한 번에 등록
    const unregisterFunctions = Object.entries(handlersConfig).map(([action, config]) => {
      return register.register(action as any, config.handler, {
        priority: config.priority,
      metadata: { labels: ['user', 'bulk-registered'] }
      });
    });
    
    // 등록된 모든 핸들러 정리
    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [register]);
  
  return <div>대량 핸들러 등록됨</div>;
}
```

## 메타데이터 및 모니터링

### 핸들러 지표

```typescript
function MetricsHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('monitoredHandler', async (payload, controller) => {
      const result = await businessService.processWithMetrics(payload);
      controller.setResult(result);
    }, {
      metadata: { labels: ['monitored'] }
    });
    
    return unregister;
  }, [register]);
  
  return <div>모니터링된 핸들러 등록됨</div>;
}
```

### 레지스트리 정보

```typescript
function RegistryInfoComponent() {
  const register = useAppRegister();
  const [registryInfo, setRegistryInfo] = useState<any>(null);
  
  const getRegistryStats = useCallback(() => {
    // 레지스트리 통계 가져오기
    const info = register.getRegistryInfo();
    setRegistryInfo(info);
    console.log('레지스트리 통계:', {
      totalActions: info.totalActions,
      totalHandlers: info.totalHandlers,
      registeredActions: info.registeredActions
    });
  }, [register]);
  
  useEffect(() => {
    getRegistryStats();
  }, [getRegistryStats]);
  
  return (
    <div>
      <h3>레지스트리 정보</h3>
      {registryInfo && (
        <div>
          <p>총 액션: {registryInfo.totalActions}</p>
          <p>총 핸들러: {registryInfo.totalHandlers}</p>
          <p>등록된 액션: {registryInfo.registeredActions?.join(', ')}</p>
        </div>
      )}
      <button onClick={getRegistryStats}>통계 새로 고침</button>
    </div>
  );
}
```

## 실제 예제

- [Todo 리스트 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - 복잡한 핸들러 등록
- [채팅 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - 실시간 핸들러 패턴
- [사용자 프로필 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - 사용자 관리 핸들러

## 관련 패턴

- [디스패치 패턴](./dispatch-patterns.md) - 기본 디스패칭 패턴
- [결과와 함께 디스패치](./dispatch-with-result.md) - 결과 수집 패턴
- [타입 시스템](./type-system.md) - TypeScript 통합
- [액션 기본 사용법](./basic-usage.md) - 기본 패턴
