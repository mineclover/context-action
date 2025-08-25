# 컨텍스트 싱글톤 처리

Context-Action 프레임워크에서 지연 평가와 적절한 라이프사이클 제어를 위한 RefContext를 사용한 컨텍스트 싱글톤 관리 패턴입니다.

## 선행 요건

**[RefContext 설정](../setup/ref-context-setup.md)** 참조:
- 가져오기 문과 기본 설정
- 타입 정의 (ServiceRefs, ManagerRefs 등)
- 프로바이더 구성 패턴
- 초기화 패턴

## 가져오기
```typescript
import { createRefContext } from '@context-action/react';
```

## 정의

**컨텍스트 싱글톤**: 특정 React 컨텍스트 경계 내에서 단일 인스턴스로 존재하는 객체로, 지연 평가와 적절한 라이프사이클 제어를 위해 RefContext를 통해 관리됩니다.

## 핵심 개념

### 컨텍스트 싱글톤 vs 코드 싱글톤

**컨텍스트 싱글톤**
- **범위**: React 컨텍스트 경계 (프로바이더 → 프로바이더)
- **라이프사이클**: 컨텍스트 마운트/언마운트에 연결  
- **구성**: 컨텍스트 인스턴스별로 다를 수 있음
- **목적**: 컨텍스트별, 사용자별, 또는 환경별 인스턴스

**코드 싱글톤** 
- **범위**: 전체 애플리케이션의 모듈/글로벌 범위
- **라이프사이클**: 애플리케이션 수명 (정적)
- **구성**: 모듈 로드 시 고정
- **목적**: 진정한 글로벌, 상태 없는 유틸리티

### 지연 평가

**정의**: 객체 생성과 초기화를 컨텍스트 생성 시가 아닌 첫 액세스까지 연기합니다.

**메커니즘**: RefContext는 `setRef()` 호출을 통해 명시적으로 채워질 때까지 비어 있는 참조 홀더를 제공합니다.

**이점**:
- **성능**: 비용이 많이 드는 객체를 필요할 때만 생성
- **리소스 효율성**: 사용하지 않는 싱글톤은 리소스를 소비하지 않음
- **조건부 로직**: 런타임 조건에 따라 다른 싱글톤을 생성할 수 있음

### 경량 Ref 래퍼

**정의**: RefContext는 외부 객체를 React의 라이프사이클에 결합하지 않고 보유하는 최소 컨테이너 역할을 합니다.

**특성**:
- **React 결합 없음**: 외부 객체는 독립적으로 유지
- **참조 관리**: 객체 액세스를 위한 `target` 속성 제공
- **타입 안전성**: 참조된 객체에 대한 완전한 TypeScript 지원
- **라이프사이클 독립성**: 객체는 React 컴포넌트 라이프사이클을 넘어 존재할 수 있음

## 아키텍처 원칙

### 범위 격리

**원칙**: 각 컨텍스트 경계는 자체 싱글톤 인스턴스를 유지하여 전역 상태 간섭을 방지합니다.

**구현**: 여러 프로바이더 인스턴스가 별도의 싱글톤 범위를 생성:
- 프로바이더 A → 싱글톤 인스턴스 A  
- 프로바이더 B → 싱글톤 인스턴스 B
- 컨텍스트 간 공유 상태 없음

### 컨텍스트 기반 라이프사이클

**원칙**: 싱글톤 라이프사이클은 컴포넌트 라이프사이클이 아닌 컨텍스트 마운트/언마운트에 연결됩니다.

**라이프사이클 이벤트**:
- **컨텍스트 마운트**: 싱글톤 생성 기회
- **컨텍스트 활성**: 싱글톤 액세스 및 사용
- **컨텍스트 언마운트**: 싱글톤 정리 및 폐기

### 구성 유연성

**원칙**: 각 컨텍스트는 컨텍스트별 요구사항에 따라 싱글톤을 다르게 구성할 수 있습니다.

**구성 소스**:
- 사용자별 설정
- 환경 변수  
- 기능 플래그
- A/B 테스트 변형
- 멀티 테넌트 구성

## 결정 프레임워크

### 코드 싱글톤을 사용해야 하는 경우:
- 객체가 상태 없고 불변
- 구성이 런타임에 절대 변경되지 않음
- 컨텍스트별 동작이 필요하지 않음
- 정리나 폐기가 필요하지 않음
- 진정한 글로벌 애플리케이션 유틸리티

### 컨텍스트 싱글톤을 사용해야 하는 경우:
- 사용자별 또는 테넌트별 인스턴스가 필요
- 환경 종속 구성이 필요
- 테스트에 격리된 인스턴스가 필요
- 라이프사이클이 특정 컨텍스트에 연결
- 컨텍스트 언마운트 시 리소스 정리가 필요

## 구현 패턴

### 서비스 싱글톤 패턴

**설정**: 외부 서비스 관리를 위해 RefContext 설정의 ServiceRefs를 사용합니다.

```typescript
// 서비스 싱글톤 관리
interface ServiceRefs {
  apiClient: any; // REST API 클라이언트 인스턴스
  websocketManager: WebSocket;
  cacheService: Cache;
  analyticsTracker: any; // 분석 서비스 인스턴스
}

const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef
} = createRefContext<ServiceRefs>('Services');

function useServiceSingletons() {
  const apiClient = useServiceRef('apiClient');
  const websocket = useServiceRef('websocketManager');
  const cache = useServiceRef('cacheService');
  const analytics = useServiceRef('analyticsTracker');
  
  // 지연 초기화 패턴
  const initializeServices = useCallback(() => {
    if (!apiClient.target) {
      apiClient.setRef(new APIClient({
        baseURL: process.env.REACT_APP_API_URL,
        timeout: 10000,
        retries: 3
      }));
    }
    
    if (!websocket.target && shouldEnableRealtime) {
      const ws = new WebSocket(process.env.REACT_APP_WS_URL!);
      ws.onopen = () => console.log('웹소켓이 연결되었습니다');
      ws.onclose = () => console.log('웹소켓이 끊어졌습니다');
      websocket.setRef(ws);
    }
    
    if (!cache.target) {
      caches.open('app-cache-v1').then(cache => {
        cache.setRef(cache);
      });
    }
  }, [apiClient, websocket, cache]);
  
  return { initializeServices };
}
```

### 매니저 싱글톤 패턴

**설정**: 무거운 계산 객체를 위해 ManagerRefs를 사용합니다.

```typescript
// 무거운 계산을 위한 매니저 싱글톤
interface ManagerRefs {
  dataProcessor: any; // 무거운 데이터 처리 엔진
  reportGenerator: any; // 보고서 생성 서비스
  fileManager: any; // 파일 작업 매니저
  notificationManager: any; // 알림 서비스
}

const {
  Provider: ManagerRefProvider,
  useRefHandler: useManagerRef
} = createRefContext<ManagerRefs>('Managers');

function useManagerSingletons() {
  const dataProcessor = useManagerRef('dataProcessor');
  const reportGenerator = useManagerRef('reportGenerator');
  const fileManager = useManagerRef('fileManager');
  const notifications = useManagerRef('notificationManager');
  
  // 구성을 통한 온디맨드 초기화
  const initializeManagers = useCallback((userConfig: any) => {
    if (!dataProcessor.target) {
      // 필요할 때만 무거운 초기화
      import('../services/DataProcessor').then(({ DataProcessor }) => {
        const processor = new DataProcessor({
          workerCount: navigator.hardwareConcurrency || 4,
          memoryLimit: userConfig.memoryLimit,
          useWebAssembly: userConfig.enableWASM
        });
        dataProcessor.setRef(processor);
      });
    }
    
    if (!reportGenerator.target) {
      import('../services/ReportGenerator').then(({ ReportGenerator }) => {
        const generator = new ReportGenerator({
          templates: userConfig.reportTemplates,
          outputFormats: ['pdf', 'excel', 'csv'],
          maxConcurrentJobs: 3
        });
        reportGenerator.setRef(generator);
      });
    }
  }, [dataProcessor, reportGenerator, userConfig]);
  
  return { initializeManagers };
}
```

### 컨텍스트별 싱글톤 패턴

**설정**: 컨텍스트 경계별로 다른 싱글톤 구성입니다.

```typescript
// 사용자별 싱글톤 구성
interface UserSingletons {
  userDataService: any;
  userPreferences: any;
  userNotifications: any;
}

function UserContextProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const {
    Provider: UserRefProvider,
    useRefHandler: useUserRef
  } = createRefContext<UserSingletons>('UserContext');
  
  return (
    <UserRefProvider>
      <UserSingletonInitializer userId={userId} />
      {children}
    </UserRefProvider>
  );
}

function UserSingletonInitializer({ userId }: { userId: string }) {
  const userDataService = useUserRef('userDataService');
  const userPreferences = useUserRef('userPreferences');
  const userNotifications = useUserRef('userNotifications');
  
  useEffect(() => {
    // 컨텍스트별 초기화
    if (!userDataService.target) {
      userDataService.setRef(new UserDataService({
        userId,
        cachePolicy: 'user-specific',
        syncInterval: 30000
      }));
    }
    
    if (!userPreferences.target) {
      userPreferences.setRef(new UserPreferencesManager({
        userId,
        autoSave: true,
        localBackup: true
      }));
    }
    
    if (!userNotifications.target) {
      userNotifications.setRef(new NotificationManager({
        userId,
        channels: ['push', 'email', 'sms'],
        preferences: userPreferences.target?.getNotificationSettings()
      }));
    }
    
    // 사용자 컨텍스트 변경 시 정리
    return () => {
      userDataService.target?.cleanup();
      userPreferences.target?.save();
      userNotifications.target?.disconnect();
    };
  }, [userId, userDataService, userPreferences, userNotifications]);
  
  return null;
}
```

### 라이프사이클 관리 패턴  

**언마운트 시 정리**: 적절한 싱글톤 폐기를 통한 리소스 관리를 위한 필수 패턴입니다.

```typescript
// 종합적인 정리 패턴
function useSingletonCleanup() {
  const services = useServiceRef();
  const managers = useManagerRef();
  
  useEffect(() => {
    return () => {
      // 서비스 정리
      services.apiClient?.target?.disconnect();
      services.websocketManager?.target?.close();
      services.cacheService?.target?.clear();
      services.analyticsTracker?.target?.flush();
      
      // 매니저 정리
      managers.dataProcessor?.target?.terminate();
      managers.reportGenerator?.target?.cancelAllJobs();
      managers.fileManager?.target?.cleanup();
      managers.notificationManager?.target?.unsubscribeAll();
    };
  }, [services, managers]);
}
```

**지연 폐기**: 스마트 리소스 관리를 통해 필요할 때까지 정리를 연기합니다.

```typescript
// 리소스 모니터링을 통한 스마트 정리
function useSmartSingletonDisposal() {
  const [resourceUsage, setResourceUsage] = useState(0);
  const services = useServiceRef();
  
  useEffect(() => {
    const monitor = setInterval(() => {
      // 리소스 사용량 모니터링
      const usage = performance.memory?.usedJSHeapSize || 0;
      setResourceUsage(usage);
      
      // 리소스가 높을 때 지연 폐기
      if (usage > MEMORY_THRESHOLD) {
        // 중요하지 않은 싱글톤 폐기
        services.cacheService?.target?.cleanup();
        services.analyticsTracker?.target?.pause();
      }
    }, 5000);
    
    return () => clearInterval(monitor);
  }, [services]);
}
```

## 개념적 경계

### 컨텍스트 싱글톤이 무엇인가:
- **범위 객체**: 특정 컨텍스트 경계 내에서 존재
- **외부 리소스**: 데이터베이스 연결, API 클라이언트, 서드파티 SDK
- **상태가 있는 서비스**: 내부 상태를 유지하는 객체
- **컨텍스트 구성 가능**: 컨텍스트별로 다르게 구성될 수 있음

### 컨텍스트 싱글톤이 무엇이 아닌가:
- **React 상태**: 반응적 UI 상태 관리를 위한 것이 아님
- **글로벌 객체**: 애플리케이션 전체 싱글톤을 위한 것이 아님
- **컴포넌트 데이터**: 컴포넌트 로컬 데이터를 위한 것이 아님
- **상태 대체**: 스토어 패턴의 대체물이 아님

## 다른 패턴과의 관계

### vs 스토어 패턴
- **스토어**: 구독을 통한 반응적 상태 관리
- **컨텍스트 싱글톤**: 반응성 없는 외부 객체 관리

### vs React 컨텍스트
- **React 컨텍스트**: 컴포넌트 간 직접 값 공유  
- **RefContext**: 외부 객체를 위한 참조 관리

### vs 의존성 주입
- **DI**: 생성자 주입을 통해 의존성 제공
- **컨텍스트 싱글톤**: 훅을 통해 컨텍스트 범위 의존성 제공

## 핵심 결론

### 핵심 이해
1. **컨텍스트 싱글톤**은 전역이 아닌 컨텍스트 경계당 한 번 존재
2. **지연 평가**는 첫 액세스까지 객체 생성을 연기  
3. **경량 래퍼**는 React 결합 없이 참조 관리를 제공
4. **범위 격리**는 다른 컨텍스트 간 간섭을 방지

### 설계 결정
- 상태 없고 글로벌 유틸리티를 위해서는 **코드 싱글톤** 선택
- 구성 가능하고 컨텍스트별 객체를 위해서는 **컨텍스트 싱글톤** 선택
- 반응적 상태가 아닌 외부 객체 관리를 위해 **RefContext** 사용
- 리소스 누수를 방지하기 위해 적절한 **정리 패턴** 구현

### 아키텍처 이점  
- **테스트 가능성**: 컨텍스트별 격리된 인스턴스로 더 나은 테스트 가능
- **유연성**: 컨텍스트별 다른 구성이 멀티 테넌시 지원  
- **성능**: 지연 평가가 불필요한 리소스 소비를 줄임
- **유지보수성**: 싱글톤 타입과 책임 간의 명확한 분리

## 멀티 컨텍스트 싱글톤 관리

### 컨텍스트 간 싱글톤 공유

```typescript
// 공유 싱글톤 풀 패턴
interface SharedSingletons {
  globalCache: Cache;
  systemLogger: any;
  configManager: any;
}

interface DomainSingletons {
  domainService: any;
  domainProcessor: any;
}

// 글로벌 공유 싱글톤
const {
  Provider: SharedRefProvider,
  useRefHandler: useSharedRef
} = createRefContext<SharedSingletons>('Shared');

// 도메인별 싱글톤
const {
  Provider: DomainRefProvider,
  useRefHandler: useDomainRef
} = createRefContext<DomainSingletons>('Domain');

function MultiContextApp() {
  return (
    <SharedRefProvider>
      <DomainRefProvider>
        <DomainAComponents />
      </DomainRefProvider>
      <DomainRefProvider>
        <DomainBComponents />
      </DomainRefProvider>
    </SharedRefProvider>
  );
}
```

### 환경별 싱글톤

```typescript
// 환경 기반 싱글톤 구성
function createEnvironmentSingletons(environment: 'development' | 'staging' | 'production') {
  const config = {
    development: {
      apiUrl: 'http://localhost:3001',
      enableMocking: true,
      logLevel: 'debug'
    },
    staging: {
      apiUrl: 'https://staging-api.example.com',
      enableMocking: false,
      logLevel: 'info'
    },
    production: {
      apiUrl: 'https://api.example.com',
      enableMocking: false,
      logLevel: 'error'
    }
  }[environment];
  
  return createRefContext<ServiceRefs>(`Services-${environment}`);
}

const EnvironmentServices = createEnvironmentSingletons(process.env.NODE_ENV);
```

## 관련 패턴

- **[RefContext 설정](../setup/ref-context-setup.md)** - 완전한 설정 패턴 및 타입 정의
- **[컨텍스트 분할](../architecture/context-splitting.md)** - 분할된 컨텍스트 간 싱글톤 객체 관리
- **[RefContext 기본 사용법](./basic-usage.md)** - 기본 RefContext 패턴
- **[메모리 최적화](./memory-optimization.md)** - 싱글톤 라이프사이클 및 메모리 관리