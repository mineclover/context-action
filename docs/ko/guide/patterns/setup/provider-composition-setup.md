# 프로바이더 구성 설정

Context-Action 프레임워크에서 다중 컨텍스트 관리를 위한 고급 프로바이더 구성 유틸리티 및 패턴입니다.

## 임포트
```typescript
import { composeProviders } from '@context-action/react';
```

## 개요

`composeProviders` 유틸리티는 다중 Provider 컴포넌트를 하나의 깔끔한 컴포넌트로 구성하여 "Provider 지옥"을 해결합니다. 이는 다중 컨텍스트(Store, Action, RefContext)를 사용하는 애플리케이션에 필수적입니다.

### Before vs After
```typescript
// ❌ Provider 지옥 - 읽기 어렵고 유지보수하기 힘듦
function App() {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <ProductStoreProvider>
          <ProductActionProvider>
            <UIStoreProvider>
              <UIActionProvider>
                <CanvasRefProvider>
                  <ServiceRefProvider>
                    <AppContent />
                  </ServiceRefProvider>
                </CanvasRefProvider>
              </UIActionProvider>
            </UIStoreProvider>
          </ProductActionProvider>
        </ProductStoreProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}

// ✅ 깔끔한 구성 - 유지보수 가능하고 읽기 쉬움
const AllProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider,
  ProductStoreProvider,
  ProductActionProvider,
  UIStoreProvider,
  UIActionProvider,
  CanvasRefProvider,
  ServiceRefProvider
]);

function App() {
  return (
    <AllProviders>
      <AppContent />
    </AllProviders>
  );
}
```

## 기본 구성 패턴

### 간단한 프로바이더 구성
```typescript
// 단일 도메인을 위한 기본 구성
const UserProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider
]);

function UserFeature() {
  return (
    <UserProviders>
      <UserComponents />
    </UserProviders>
  );
}
```

### 다중 도메인 구성
```typescript
// 다중 도메인의 프로바이더 구성
const ApplicationProviders = composeProviders([
  // 스토어 레이어
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider,
  UIStoreProvider,
  
  // 액션 레이어
  UserActionProvider,
  ProductActionProvider,
  OrderActionProvider,
  UIActionProvider,
  
  // 성능 레이어
  CanvasRefProvider,
  MediaRefProvider,
  ServiceRefProvider
]);

function Application() {
  return (
    <ApplicationProviders>
      <ApplicationContent />
    </ApplicationProviders>
  );
}
```

### MVVM 레이어 구성
```typescript
// MVVM 아키텍처 레이어별로 프로바이더 조직
const ModelProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider
]);

const ViewModelProviders = composeProviders([
  UserActionProvider,
  ProductActionProvider,
  OrderActionProvider
]);

const PerformanceProviders = composeProviders([
  CanvasRefProvider,
  MediaRefProvider,
  WorkerRefProvider
]);

// 레이어들을 함께 구성
const MVVMProviders = composeProviders([
  ModelProviders,
  ViewModelProviders,
  PerformanceProviders
]);

function MVVMApplication() {
  return (
    <MVVMProviders>
      <MVVMContent />
    </MVVMProviders>
  );
}
```

## 고급 구성 패턴

### 조건부 프로바이더 구성
```typescript
// 기능 플래그에 따른 동적 프로바이더 구성
interface AppConfig {
  features: {
    userManagement: boolean;
    productCatalog: boolean;
    orderProcessing: boolean;
    analytics: boolean;
    payments: boolean;
  };
  performance: {
    enableCanvas: boolean;
    enableWorkers: boolean;
    enableWASM: boolean;
  };
}

function createAppProviders(config: AppConfig) {
  const providers: any[] = [];
  
  // 항상 UI 프로바이더 포함
  providers.push(UIStoreProvider, UIActionProvider);
  
  // 조건부 기능 프로바이더
  if (config.features.userManagement) {
    providers.push(UserStoreProvider, UserActionProvider);
  }
  
  if (config.features.productCatalog) {
    providers.push(ProductStoreProvider, ProductActionProvider);
  }
  
  if (config.features.orderProcessing) {
    providers.push(OrderStoreProvider, OrderActionProvider);
  }
  
  if (config.features.analytics) {
    providers.push(AnalyticsStoreProvider, AnalyticsActionProvider);
  }
  
  if (config.features.payments) {
    providers.push(PaymentStoreProvider, PaymentActionProvider);
  }
  
  // 조건부 성능 프로바이더
  if (config.performance.enableCanvas) {
    providers.push(CanvasRefProvider);
  }
  
  if (config.performance.enableWorkers) {
    providers.push(WorkerRefProvider);
  }
  
  if (config.performance.enableWASM) {
    providers.push(WASMRefProvider);
  }
  
  return composeProviders(providers);
}

function ConfigurableApp({ config }: { config: AppConfig }) {
  const AppProviders = createAppProviders(config);
  
  return (
    <AppProviders>
      <ConfigurableContent />
    </AppProviders>
  );
}

// 다른 구성으로 사용
const developmentConfig: AppConfig = {
  features: {
    userManagement: true,
    productCatalog: true,
    orderProcessing: true,
    analytics: false, // 개발 환경에서 비활성화
    payments: false   // 개발 환경에서 비활성화
  },
  performance: {
    enableCanvas: true,
    enableWorkers: true,
    enableWASM: false // 무거움, 개발 환경에서 비활성화
  }
};

const productionConfig: AppConfig = {
  features: {
    userManagement: true,
    productCatalog: true,
    orderProcessing: true,
    analytics: true,
    payments: true
  },
  performance: {
    enableCanvas: true,
    enableWorkers: true,
    enableWASM: true
  }
};
```

### 환경별 구성
```typescript
// 환경 기반 프로바이더 선택
function createEnvironmentProviders() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isTesting = process.env.NODE_ENV === 'test';
  
  const providers = [
    // 핵심 프로바이더 (항상 포함)
    UIStoreProvider,
    UIActionProvider,
    UserStoreProvider,
    UserActionProvider
  ];
  
  if (isDevelopment) {
    providers.push(
      DebugStoreProvider,
      DebugActionProvider,
      DevToolsRefProvider,
      MockServiceRefProvider
    );
  }
  
  if (isProduction) {
    providers.push(
      AnalyticsStoreProvider,
      AnalyticsActionProvider,
      ErrorTrackingRefProvider,
      PerformanceMonitoringRefProvider
    );
  }
  
  if (isTesting) {
    providers.push(
      TestStoreProvider,
      TestActionProvider,
      MockRefProvider
    );
  }
  
  return composeProviders(providers);
}

function EnvironmentApp() {
  const EnvironmentProviders = createEnvironmentProviders();
  
  return (
    <EnvironmentProviders>
      <EnvironmentContent />
    </EnvironmentProviders>
  );
}
```

### 중첩 도메인 구성
```typescript
// 복잡한 애플리케이션을 위한 계층적 프로바이더 구성
function createNestedProviders() {
  // 인프라스트럭처 레이어 - 핵심 시스템 프로바이더
  const InfrastructureProviders = composeProviders([
    DatabaseStoreProvider,
    CacheStoreProvider,
    LoggerStoreProvider,
    ConfigurationStoreProvider
  ]);
  
  // 비즈니스 로직 레이어 - 도메인별 프로바이더
  const BusinessProviders = composeProviders([
    UserStoreProvider,
    UserActionProvider,
    ProductStoreProvider,
    ProductActionProvider,
    OrderStoreProvider,
    OrderActionProvider
  ]);
  
  // 프레젠테이션 레이어 - UI 및 상호작용 프로바이더
  const PresentationProviders = composeProviders([
    UIStoreProvider,
    UIActionProvider,
    ThemeStoreProvider,
    ThemeActionProvider,
    NavigationStoreProvider,
    NavigationActionProvider
  ]);
  
  // 성능 레이어 - 최적화 프로바이더
  const PerformanceProviders = composeProviders([
    CanvasRefProvider,
    MediaRefProvider,
    WorkerRefProvider,
    WASMRefProvider
  ]);
  
  // 외부 통합 레이어 - 서드파티 서비스
  const IntegrationProviders = composeProviders([
    AnalyticsRefProvider,
    PaymentRefProvider,
    MapsRefProvider,
    NotificationRefProvider
  ]);
  
  return {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  };
}

function LayeredApp() {
  const {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  } = createNestedProviders();
  
  return (
    <InfrastructureProviders>
      <BusinessProviders>
        <PresentationProviders>
          <PerformanceProviders>
            <IntegrationProviders>
              <LayeredContent />
            </IntegrationProviders>
          </PerformanceProviders>
        </PresentationProviders>
      </BusinessProviders>
    </InfrastructureProviders>
  );
}

// 대안: 전체 스택을 위한 단일 구성 프로바이더
function createFullStackProviders() {
  const {
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  } = createNestedProviders();
  
  return composeProviders([
    InfrastructureProviders,
    BusinessProviders,
    PresentationProviders,
    PerformanceProviders,
    IntegrationProviders
  ]);
}

function FullStackApp() {
  const FullStackProviders = createFullStackProviders();
  
  return (
    <FullStackProviders>
      <FullStackContent />
    </FullStackProviders>
  );
}
```

### 마이크로 프론트엔드 구성
```typescript
// 마이크로 프론트엔드 아키텍처를 위한 프로바이더 구성
interface MicroFrontendConfig {
  apps: {
    dashboard: boolean;
    userManagement: boolean;
    productCatalog: boolean;
    orderManagement: boolean;
    analytics: boolean;
  };
  shared: {
    authentication: boolean;
    notifications: boolean;
    theming: boolean;
  };
}

function createMicroFrontendProviders(config: MicroFrontendConfig) {
  const providers = [];
  
  // 공유 프로바이더 (항상 포함)
  if (config.shared.authentication) {
    providers.push(AuthStoreProvider, AuthActionProvider);
  }
  
  if (config.shared.notifications) {
    providers.push(NotificationStoreProvider, NotificationActionProvider);
  }
  
  if (config.shared.theming) {
    providers.push(ThemeStoreProvider, ThemeActionProvider);
  }
  
  // 앱별 프로바이더
  if (config.apps.dashboard) {
    providers.push(DashboardStoreProvider, DashboardActionProvider);
  }
  
  if (config.apps.userManagement) {
    providers.push(UserStoreProvider, UserActionProvider);
  }
  
  if (config.apps.productCatalog) {
    providers.push(ProductStoreProvider, ProductActionProvider);
  }
  
  if (config.apps.orderManagement) {
    providers.push(OrderStoreProvider, OrderActionProvider);
  }
  
  if (config.apps.analytics) {
    providers.push(AnalyticsStoreProvider, AnalyticsActionProvider);
  }
  
  return composeProviders(providers);
}

// 다른 마이크로 프론트엔드 구성
const dashboardConfig: MicroFrontendConfig = {
  apps: {
    dashboard: true,
    userManagement: false,
    productCatalog: false,
    orderManagement: false,
    analytics: true
  },
  shared: {
    authentication: true,
    notifications: true,
    theming: true
  }
};

const userMgmtConfig: MicroFrontendConfig = {
  apps: {
    dashboard: false,
    userManagement: true,
    productCatalog: false,
    orderManagement: false,
    analytics: false
  },
  shared: {
    authentication: true,
    notifications: true,
    theming: true
  }
};

function MicroFrontendApp({ config }: { config: MicroFrontendConfig }) {
  const MicroFrontendProviders = createMicroFrontendProviders(config);
  
  return (
    <MicroFrontendProviders>
      <MicroFrontendContent />
    </MicroFrontendProviders>
  );
}
```

## 필터링을 통한 프로바이더 구성

### 배열 기반 구성
```typescript
// 런타임 조건에 따른 프로바이더 필터링
function createFilteredProviders(userRole: 'admin' | 'user' | 'guest') {
  const baseProviders = [
    UIStoreProvider,
    UIActionProvider,
    PublicStoreProvider,
    PublicActionProvider
  ];
  
  const userProviders = [
    UserStoreProvider,
    UserActionProvider,
    UserPreferencesStoreProvider
  ];
  
  const adminProviders = [
    AdminStoreProvider,
    AdminActionProvider,
    AdminToolsRefProvider,
    AuditLogStoreProvider
  ];
  
  const providers = [...baseProviders];
  
  if (userRole === 'user' || userRole === 'admin') {
    providers.push(...userProviders);
  }
  
  if (userRole === 'admin') {
    providers.push(...adminProviders);
  }
  
  return composeProviders(providers);
}

function RoleBasedApp({ userRole }: { userRole: 'admin' | 'user' | 'guest' }) {
  const RoleProviders = createFilteredProviders(userRole);
  
  return (
    <RoleProviders>
      <RoleBasedContent />
    </RoleProviders>
  );
}
```

### 조건부 배열 필터링
```typescript
// 불린 조건이 포함된 고급 필터링
function createAdvancedProviders(conditions: {
  hasPermissions: boolean;
  isOnline: boolean;
  supportsWebGL: boolean;
  hasPremiumFeatures: boolean;
}) {
  const providers = [
    // 핵심 프로바이더
    UIStoreProvider,
    UIActionProvider,
    
    // 필터가 포함된 조건부 프로바이더
    conditions.hasPermissions && AuthStoreProvider,
    conditions.hasPermissions && AuthActionProvider,
    conditions.isOnline && SyncStoreProvider,
    conditions.isOnline && SyncActionProvider,
    conditions.supportsWebGL && CanvasRefProvider,
    conditions.supportsWebGL && WebGLRefProvider,
    conditions.hasPremiumFeatures && PremiumStoreProvider,
    conditions.hasPremiumFeatures && PremiumActionProvider,
  ].filter(Boolean) as React.ComponentType<{ children: React.ReactNode }>[];
  
  return composeProviders(providers);
}

function ConditionalApp() {
  const [conditions, setConditions] = useState({
    hasPermissions: false,
    isOnline: navigator.onLine,
    supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
    hasPremiumFeatures: false
  });
  
  useEffect(() => {
    // 런타임 상태에 따른 조건 업데이트
    checkUserPermissions().then(hasPermissions => {
      setConditions(prev => ({ ...prev, hasPermissions }));
    });
    
    checkPremiumStatus().then(hasPremiumFeatures => {
      setConditions(prev => ({ ...prev, hasPremiumFeatures }));
    });
  }, []);
  
  const ConditionalProviders = createAdvancedProviders(conditions);
  
  return (
    <ConditionalProviders>
      <ConditionalContent />
    </ConditionalProviders>
  );
}
```

## 성능 최적화

### 프로바이더 메모이제이션
```typescript
// 성능을 위한 프로바이더 구성 메모이제이션
function useOptimizedProviders(
  config: AppConfig,
  userRole: string,
  features: string[]
) {
  return useMemo(() => {
    const providers = [];
    
    // 구성에 따른 프로바이더 추가
    if (config.features.userManagement) {
      providers.push(UserStoreProvider, UserActionProvider);
    }
    
    // 사용자 역할에 따른 프로바이더 추가
    if (userRole === 'admin') {
      providers.push(AdminStoreProvider, AdminActionProvider);
    }
    
    // 활성화된 기능에 따른 프로바이더 추가
    features.forEach(feature => {
      switch (feature) {
        case 'analytics':
          providers.push(AnalyticsStoreProvider);
          break;
        case 'payments':
          providers.push(PaymentStoreProvider);
          break;
      }
    });
    
    return composeProviders(providers);
  }, [config, userRole, features]);
}

function OptimizedApp({ config, userRole, features }: {
  config: AppConfig;
  userRole: string;
  features: string[];
}) {
  const OptimizedProviders = useOptimizedProviders(config, userRole, features);
  
  return (
    <OptimizedProviders>
      <OptimizedContent />
    </OptimizedProviders>
  );
}
```

### 지연 프로바이더 로딩
```typescript
// 초기 성능 향상을 위한 지연 프로바이더 로딩
const LazyAdminProviders = lazy(() => 
  import('./providers/AdminProviders').then(module => ({
    default: module.AdminProviders
  }))
);

const LazyPremiumProviders = lazy(() =>
  import('./providers/PremiumProviders').then(module => ({
    default: module.PremiumProviders
  }))
);

function LazyApp({ userRole, hasPremium }: {
  userRole: string;
  hasPremium: boolean;
}) {
  const CoreProviders = composeProviders([
    UIStoreProvider,
    UIActionProvider,
    UserStoreProvider,
    UserActionProvider
  ]);
  
  return (
    <CoreProviders>
      <Suspense fallback={<Loading />}>
        {userRole === 'admin' && (
          <LazyAdminProviders>
            <AdminContent />
          </LazyAdminProviders>
        )}
        
        {hasPremium && (
          <LazyPremiumProviders>
            <PremiumContent />
          </LazyPremiumProviders>
        )}
        
        <RegularContent />
      </Suspense>
    </CoreProviders>
  );
}
```

## 내보내기 패턴

### 구성된 프로바이더 내보내기
```typescript
// providers/ComposedProviders.ts
export const CoreProviders = composeProviders([
  UIStoreProvider,
  UIActionProvider
]);

export const BusinessProviders = composeProviders([
  UserStoreProvider,
  UserActionProvider,
  ProductStoreProvider,
  ProductActionProvider
]);

export const PerformanceProviders = composeProviders([
  CanvasRefProvider,
  MediaRefProvider,
  WorkerRefProvider
]);

export const AllProviders = composeProviders([
  CoreProviders,
  BusinessProviders,
  PerformanceProviders
]);

// 개별 프로바이더 팩토리
export { createAppProviders } from './factories/AppProviderFactory';
export { createMVVMProviders } from './factories/MVVMProviderFactory';
export { createMicroFrontendProviders } from './factories/MicroFrontendProviderFactory';
```

### 팩토리 패턴 내보내기
```typescript
// providers/factories/index.ts
export * from './AppProviderFactory';
export * from './MVVMProviderFactory';
export * from './MicroFrontendProviderFactory';
export * from './ConditionalProviderFactory';

// providers/index.ts - 메인 내보내기
export * from './ComposedProviders';
export * from './factories';
export { composeProviders } from '@context-action/react';
```

## 모범 사례

### 구성 조직
1. **논리적 그룹화**: 도메인, 레이어, 기능별로 프로바이더 그룹화
2. **프로바이더 순서**: 종속성에 따른 프로바이더 순서 (독립적 → 종속적)
3. **조건부 로직**: 유연성을 위해 기능 플래그와 런타임 조건 사용
4. **성능**: 불필요한 리렌더링을 방지하기 위해 구성된 프로바이더 메모이제이션

### 구성 관리
1. **타입 안전성**: 구성 객체에 TypeScript 인터페이스 사용
2. **환경 분리**: 다른 환경을 위한 구성 분리
3. **기능 플래그**: 점진적 롤아웃을 위한 기능 플래그 시스템 구현
4. **런타임 적응**: 런타임 조건에 따른 프로바이더 구성 적응

### 오류 처리
1. **프로바이더 검증**: 구성 전 프로바이더 검증
2. **우아한 성능 저하**: 누락된 프로바이더를 우아하게 처리
3. **오류 경계**: 구성된 프로바이더를 오류 경계로 감싸기
4. **로깅**: 디버깅을 위한 프로바이더 구성 로그

## 일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- **[컨텍스트 분할 패턴](../architecture/context-splitting.md)** - 프로바이더 구성 사용
- **[MVVM 아키텍처](../architecture/mvvm.md)** - 레이어 기반 구성 사용
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 도메인 구성 사용
- **[withProvider 패턴](../store/withProvider-pattern.md)** - 구성과 함께 HOC 사용

## 관련 설정 가이드

- **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 패턴
- **[기본 스토어 설정](./basic-store-setup.md)** - 스토어 컨텍스트 패턴
- **[RefContext 설정](./ref-context-setup.md)** - RefContext 패턴
- **[다중 컨텍스트 설정](./multi-context-setup.md)** - 복잡한 아키텍처 통합