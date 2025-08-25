# 컨텍스트 분할 패턴

애플리케이션이 복잡해지고 컨텍스트 프로바이더가 관리하기 어려워질 때 대규모 컨텍스트를 분할하고 관리하는 전략.

## 컨텍스트를 분할해야 하는 시점

### 컨텍스트 분할이 필요한 신호

1. **프로바이더 계층 깊이** - 5-7개 이상의 중첩된 프로바이더
2. **스토어 복잡성** - 단일 컨텍스트에서 10개 이상의 다른 스토어 타입 관리
3. **액션 과부하** - 하나의 컨텍스트에 15개 이상의 다른 액션 타입
4. **팀 경계** - 다른 팀들이 같은 컨텍스트에서 작업
5. **성능 이슈** - 큰 컨텍스트 범위로 인한 불필요한 리렌더링
6. **유지보수 오버헤드** - 관련 코드를 찾고 관리하기 어려움

### 컨텍스트 성장 예시

```typescript
// ❌ 문제가 있는 예시: 지나치게 큰 단일 컨텍스트
interface MassiveAppStores {
  // 사용자 관련
  userProfile: UserProfile;
  userPreferences: UserPreferences;
  userNotifications: Notification[];
  
  // 제품 관련  
  productCatalog: Product[];
  productCategories: Category[];
  productFilters: ProductFilters;
  productCart: CartItem[];
  
  // 주문 관련
  orderHistory: Order[];
  orderTracking: TrackingInfo[];
  orderPayments: Payment[];
  
  // 관리자 관련
  adminUsers: AdminUser[];
  adminSettings: AdminSettings;
  adminAnalytics: AnalyticsData;
  
  // UI 관련
  modals: ModalState;
  notifications: UINotification[];
  loading: LoadingState;
  errors: ErrorState;
}

interface MassiveAppActions {
  // 20개 이상의 액션 타입이 섞여 있음
  updateUserProfile: { userId: string; data: Partial<UserProfile> };
  addToCart: { productId: string; quantity: number };
  processOrder: { orderData: OrderData };
  showModal: { modalType: string; data: any };
  // ... 더 많은 액션들
}
```

## 분할 전략

### 전략 1: 도메인 기반 분할

비즈니스 도메인이나 논리적 경계를 기반으로 컨텍스트를 분할합니다.

**필수 조건**: 이 패턴은 [다중 컨텍스트 설정 가이드](../setup/multi-context-setup.md)의 타입 정의와 설정 패턴을 사용합니다.

```typescript
// ✅ 좋은 예시: 비즈니스 도메인별로 분할
// 다중 컨텍스트 설정의 도메인 타입 정의 사용
import {
  UserStores, UserActions, UserPerformanceRefs,
  ProductStores, ProductActions, ProductPerformanceRefs,
  UIStores, UIActions
} from '../setup/multi-context-setup';

// 설정 명세를 사용하여 도메인 컨텍스트 생성
export const UserDomainContexts = {
  model: createDeclarativeStorePattern<UserStores>('User', {
    profile: { 
      initialValue: { id: '', name: '', email: '', role: 'guest' as const },
      strategy: 'shallow' as const
    },
    session: {
      initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
      strategy: 'shallow' as const
    },
    preferences: {
      initialValue: { theme: 'light' as const, language: 'en', notifications: true },
      strategy: 'shallow' as const
    }
  }),
  viewModel: createActionContext<UserActions>('User'),
  performance: createRefContext<UserPerformanceRefs>('UserPerformance')
};

export const ProductDomainContexts = {
  model: createDeclarativeStorePattern<ProductStores>('Product', {
    catalog: [] as Product[],
    categories: [] as Category[],
    filters: { initialValue: {}, strategy: 'shallow' as const },
    cart: { 
      initialValue: { items: [], total: 0 },
      strategy: 'shallow' as const
    },
    wishlist: [] as Product[]
  }),
  viewModel: createActionContext<ProductActions>('Product'),
  performance: createRefContext<ProductPerformanceRefs>('ProductPerformance')
};

export const UIDomainContexts = {
  model: createDeclarativeStorePattern<UIStores>('UI', {
    modal: { isOpen: false, type: undefined, data: undefined },
    sidebar: { isOpen: false, activePanel: undefined },
    loading: { 
      initialValue: { global: false, operations: {} },
      strategy: 'shallow' as const
    },
    notifications: {
      initialValue: { items: [], maxVisible: 5 },
      strategy: 'shallow' as const
    },
    navigation: {
      initialValue: { currentRoute: '/', breadcrumbs: [] },
      strategy: 'shallow' as const
    }
  }),
  viewModel: createActionContext<UIActions>('UI')
};
```

### 전략 2: 레이어 기반 분할

아키텍처 레이어나 기술적 관심사를 기반으로 컨텍스트를 분할합니다.

**필수 조건**: 이 패턴은 [다중 컨텍스트 설정 가이드](../setup/multi-context-setup.md)의 설정 패턴을 사용합니다.

```typescript
// 다중 컨텍스트 설정 명세를 사용한 레이어 기반 컨텍스트 분할
import {
  BusinessStores, BusinessActions,
  ValidationStores, ValidationActions,
  DesignStores, DesignActions
} from '../setup/multi-context-setup';

// 데이터 레이어 컨텍스트 (비즈니스 도메인 설정 사용)
export const DataLayerContexts = {
  model: createDeclarativeStorePattern<BusinessStores>('Data', {
    orders: [] as Order[],
    inventory: [] as InventoryItem[],
    customers: [] as Customer[],
    analytics: {
      initialValue: { revenue: 0, orders: 0, customers: 0 },
      strategy: 'shallow' as const
    }
  }),
  viewModel: createActionContext<BusinessActions>('Data')
};

// 유효성 검사 레이어 컨텍스트 (유효성 검사 도메인 설정 사용)
export const ValidationLayerContexts = {
  model: createDeclarativeStorePattern<ValidationStores>('Validation', {
    validationRules: [] as ValidationRule[],
    validationResults: [] as ValidationResult[],
    formErrors: {} as Record<string, string[]>,
    fieldStatuses: {} as Record<string, 'valid' | 'invalid' | 'pending'>
  }),
  viewModel: createActionContext<ValidationActions>('Validation')
};

// 디자인 레이어 컨텍스트 (디자인 도메인 설정 사용)
export const DesignLayerContexts = {
  model: createDeclarativeStorePattern<DesignStores>('Design', {
    theme: {
      initialValue: defaultTheme,
      strategy: 'deep' as const
    },
    breakpoint: 'desktop' as const,
    colorScheme: 'light' as const,
    animations: {
      initialValue: { enabled: true, duration: 300 },
      strategy: 'shallow' as const
    },
    layouts: {} as Record<string, LayoutConfig>
  }),
  viewModel: createActionContext<DesignActions>('Design')
};
```

### 전략 3: 기능 기반 분할

애플리케이션 기능이나 모듈을 기반으로 컨텍스트를 분할합니다.

### 전략 4: 리소스 기반 분할 (RefContext 패턴)

지연 평가와 라이프사이클 관리가 필요한 외부 리소스와 싱글톤 객체를 기반으로 컨텍스트를 분할합니다.

```typescript
// 데이터베이스 리소스 컨텍스트
export interface DatabaseRefs {
  connection: DatabaseConnection;
  queryBuilder: QueryBuilder;
  migrationManager: MigrationManager;
}

export const {
  Provider: DatabaseRefProvider,
  useRefHandler: useDatabaseRef
} = createRefContext<DatabaseRefs>('Database');

// 외부 서비스 컨텍스트  
export interface ServiceRefs {
  analytics: AnalyticsSDK;
  logger: LoggerService;
  eventTracker: EventTracker;
  notificationService: NotificationAPI;
}

export const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef
} = createRefContext<ServiceRefs>('Services');

// 써드파티 라이브러리 컨텍스트
export interface LibraryRefs {
  chartEngine: ChartEngineInstance;
  mapService: MapSDK;
  videoPlayer: VideoPlayerAPI;
  audioContext: AudioContext;
}

export const {
  Provider: LibraryRefProvider,
  useRefHandler: useLibraryRef
} = createRefContext<LibraryRefs>('Libraries');

// 지연 평가를 통한 리소스 초기화
function useResourceInitialization() {
  const connection = useDatabaseRef('connection');
  const analytics = useServiceRef('analytics');
  const chartEngine = useLibraryRef('chartEngine');
  
  useEffect(() => {
    // 데이터베이스 연결의 지연 초기화
    if (!connection.target) {
      const dbConnection = new DatabaseConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      connection.setRef({ current: dbConnection });
    }
    
    // 애널리틱스 서비스의 지연 초기화
    if (!analytics.target) {
      AnalyticsSDK.initialize({
        apiKey: process.env.ANALYTICS_KEY
      }).then(sdk => {
        analytics.setRef({ current: sdk });
      });
    }
    
    // 조건부 차트 엔진 로딩
    if (!chartEngine.target && shouldLoadCharts()) {
      import('expensive-chart-library').then(ChartEngine => {
        const engine = new ChartEngine.default();
        chartEngine.setRef({ current: engine });
      });
    }
    
    // 언마운트 시 정리
    return () => {
      connection.target?.close();
      analytics.target?.dispose();
      chartEngine.target?.destroy();
    };
  }, [connection, analytics, chartEngine]);
}
```

```typescript
// 인증 기능
export interface AuthStores {
  session: SessionData;
  tokens: TokenData;
  permissions: Permission[];
}

export interface AuthActions {
  login: { credentials: LoginCredentials };
  logout: void;
  refreshToken: void;
  checkPermission: { permission: string };
}

// 쇼핑 기능  
export interface ShoppingStores {
  cart: CartState;
  wishlist: WishlistState;
  checkout: CheckoutState;
}

export interface ShoppingActions {
  addToCart: { productId: string; quantity: number };
  addToWishlist: { productId: string };
  proceedToCheckout: { cartItems: CartItem[] };
}

// 애널리틱스 기능
export interface AnalyticsStores {
  events: AnalyticsEvent[];
  metrics: MetricsData;
  reports: ReportData[];
}

export interface AnalyticsActions {
  trackEvent: { event: string; properties: Record<string, any> };
  generateReport: { reportType: string; dateRange: DateRange };
  exportData: { format: 'csv' | 'json'; data: any[] };
}
```

## 마이그레이션 패턴

### 점진적 마이그레이션 전략

```typescript
// 1단계: 기존 컨텍스트를 유지하면서 새로운 분할 컨텍스트 생성
// 하위 호환성을 위해 기존 MassiveAppContext 유지
const {
  Provider: LegacyAppProvider,
  useStore: useLegacyAppStore,
  useStoreManager: useLegacyAppStoreManager
} = createDeclarativeStorePattern<MassiveAppStores>('LegacyApp', {
  // ... 기존 구성
});

// 2단계: 새로운 도메인별 컨텍스트 생성
const {
  Provider: UserModelProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern<UserStores>('User', {
  profile: { initialValue: defaultUserProfile },
  preferences: { initialValue: defaultPreferences },
  notifications: { initialValue: [] }
});

// 3단계: 마이그레이션을 위한 브리지 훅 생성
export function useMigratedUserData() {
  const legacyManager = useLegacyAppStoreManager();
  const newManager = useUserStoreManager();
  
  useEffect(() => {
    // 레거시에서 새로운 컨텍스트로 데이터 동기화
    const legacyProfile = legacyManager.getStore('userProfile').getValue();
    const newProfileStore = newManager.getStore('profile');
    
    if (legacyProfile && !newProfileStore.getValue().id) {
      newProfileStore.setValue(legacyProfile);
    }
  }, [legacyManager, newManager]);
  
  // 새로운 컨텍스트 훅 반환
  return {
    useStore: useUserStore,
    useStoreManager: useUserStoreManager
  };
}

// 4단계: 컴포넌트를 점진적으로 업데이트
function UserProfile() {
  // 기존 방식 (마이그레이션 중에도 작동)
  // const legacyProfileStore = useLegacyAppStore('userProfile');
  
  // 새로운 방식 (이것으로 마이그레이션)
  const { useStore } = useMigratedUserData();
  const profileStore = useStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

### 컨텍스트 조합 패턴

#### 수동 프로바이더 조합 (장황함)

```typescript
// ❌ 문제가 있는 예시: 너무 많은 중첩된 프로바이더 - 읽기 어렵고 유지보수하기 어려움
function App() {
  return (
    {/* 핵심 인프라 컨텍스트 */}
    <DataModelProvider>
      <DataActionProvider>
        
        {/* 비즈니스 도메인 컨텍스트 */}
        <UserModelProvider>
          <UserActionProvider>
            
            <ProductModelProvider>
              <ProductActionProvider>
                
                <OrderModelProvider>
                  <OrderActionProvider>
                    
                    {/* UI 레이어 컨텍스트 */}
                    <UIModelProvider>
                      <UIActionProvider>
                        
                        {/* 기능별 컨텍스트 */}
                        <AuthModelProvider>
                          <AuthActionProvider>
                            
                            <ShoppingModelProvider>
                              <ShoppingActionProvider>
                                
                                <AppContent />
                                
                              </ShoppingActionProvider>
                            </ShoppingModelProvider>
                          </AuthActionProvider>
                        </AuthModelProvider>
                      </UIActionProvider>
                    </UIModelProvider>
                  </OrderActionProvider>
                </OrderModelProvider>
              </ProductActionProvider>
            </ProductModelProvider>
          </UserActionProvider>
        </UserModelProvider>
      </DataActionProvider>
    </DataModelProvider>
  );
}
```

#### 프로바이더 조합 유틸리티 (권장)

Context-Action 프레임워크는 `composeProviders` 유틸리티를 제공하여 프로바이더 중첩 지옥을 제거합니다. 여러 프로바이더를 수동으로 중첩하는 대신, 단일 JSX 호환 컴포넌트로 조합할 수 있습니다.

자세한 구현 예제와 고급 패턴은 [`composeProviders` 문서](../../../packages/react/src/stores/utils/provider-composition.ts)를 참조하세요.

#### 고급 프로바이더 조합 패턴

`composeProviders` 유틸리티는 다음을 포함한 고급 조합 패턴을 지원합니다:

- **도메인 그룹화된 조합**: 비즈니스 도메인 또는 기술 계층별로 프로바이더 그룹화
- **조건부 조합**: 기능 플래그나 구성에 기반한 프로바이더 포함  
- **환경별 조합**: 개발/프로덕션용 다른 프로바이더 세트
- **중첩된 조합**: 여러 조합된 프로바이더를 함께 조합

이러한 고급 패턴의 완전한 예제는 [`composeProviders` 소스 코드](../../../packages/react/src/stores/utils/provider-composition.ts)를 참조하세요.

#### 프로바이더 트리 시각화 유틸리티

```typescript
// 프로바이더 조합을 시각화하는 개발 유틸리티
function createProviderTree(providerNames: string[]) {
  console.log('Provider Tree:');
  providerNames.forEach((name, index) => {
    const indent = '  '.repeat(index);
    console.log(`${indent}├─ ${name}Provider`);
  });
  console.log(`${'  '.repeat(providerNames.length)}└─ AppContent`);
}

// 개발 환경에서 사용
if (process.env.NODE_ENV === 'development') {
  createProviderTree([
    'Data', 'User', 'Product', 'Order', 
    'UI', 'Auth', 'Shopping', 'Analytics'
  ]);
}
```

### 선택적 프로바이더 패턴

```typescript
// 실제로 필요한 컨텍스트만 포함
interface AppConfig {
  features: {
    auth: boolean;
    shopping: boolean;
    analytics: boolean;
    admin: boolean;
  };
  domains: {
    user: boolean;
    product: boolean;
    order: boolean;
  };
}

function ConfigurableApp({ config }: { config: AppConfig }) {
  let app = <AppCore />;
  
  // 필요한 도메인 컨텍스트만 래핑
  if (config.domains.user) {
    app = (
      <UserModelProvider>
        <UserActionProvider>
          {app}
        </UserActionProvider>
      </UserModelProvider>
    );
  }
  
  if (config.domains.product) {
    app = (
      <ProductModelProvider>
        <ProductActionProvider>
          {app}
        </ProductActionProvider>
      </ProductModelProvider>
    );
  }
  
  // 필요한 기능 컨텍스트만 래핑
  if (config.features.auth) {
    app = (
      <AuthModelProvider>
        <AuthActionProvider>
          {app}
        </AuthActionProvider>
      </AuthModelProvider>
    );
  }
  
  if (config.features.shopping) {
    app = (
      <ShoppingModelProvider>
        <ShoppingActionProvider>
          {app}
        </ShoppingActionProvider>
      </ShoppingModelProvider>
    );
  }
  
  return app;
}

// 다른 구성으로 사용
function ProductionApp() {
  return (
    <ConfigurableApp 
      config={{
        features: { auth: true, shopping: true, analytics: true, admin: false },
        domains: { user: true, product: true, order: true }
      }}
    />
  );
}

function DevelopmentApp() {
  return (
    <ConfigurableApp 
      config={{
        features: { auth: true, shopping: true, analytics: false, admin: true },
        domains: { user: true, product: true, order: false }
      }}
    />
  );
}
```

## 교차 컨텍스트 통신

### 이벤트 기반 통신

```typescript
// 교차 컨텍스트 메시징을 위한 통신 버스 생성
export interface CrossContextEvents {
  userLoggedIn: { userId: string; timestamp: number };
  orderCompleted: { orderId: string; userId: string };
  productAddedToCart: { productId: string; userId: string };
  paymentProcessed: { paymentId: string; orderId: string };
}

export const {
  Provider: EventBusProvider,
  useActionDispatch: useEventBus,
  useActionHandler: useEventHandler
} = createActionContext<CrossContextEvents>('EventBus');

// 사용자 컨텍스트에서 - 이벤트 발생
export function useUserActions() {
  const eventBus = useEventBus();
  const userManager = useUserStoreManager();
  
  const loginHandler = useCallback(async (payload, controller) => {
    try {
      const user = await authAPI.login(payload.credentials);
      
      // 사용자 컨텍스트 업데이트
      const profileStore = userManager.getStore('profile');
      profileStore.setValue(user);
      
      // 교차 컨텍스트 이벤트 발생
      eventBus('userLoggedIn', { 
        userId: user.id, 
        timestamp: Date.now() 
      });
      
    } catch (error) {
      controller.abort('Login failed', error);
    }
  }, [userManager, eventBus]);
  
  useUserActionHandler('login', loginHandler);
}

// 쇼핑 컨텍스트에서 - 이벤트 수신
export function useShoppingEventHandlers() {
  const shoppingManager = useShoppingStoreManager();
  
  const userLoggedInHandler = useCallback(async (payload, controller) => {
    // 새 사용자를 위한 장바구니 재설정
    const cartStore = shoppingManager.getStore('cart');
    const savedCart = await loadUserCart(payload.userId);
    cartStore.setValue(savedCart);
  }, [shoppingManager]);
  
  useEventHandler('userLoggedIn', userLoggedInHandler);
}

// 애널리틱스 컨텍스트에서 - 이벤트 추적
export function useAnalyticsEventHandlers() {
  const analyticsManager = useAnalyticsStoreManager();
  
  const trackUserLogin = useCallback(async (payload, controller) => {
    const eventsStore = analyticsManager.getStore('events');
    eventsStore.update(events => [...events, {
      type: 'user_login',
      userId: payload.userId,
      timestamp: payload.timestamp
    }]);
  }, [analyticsManager]);
  
  const trackOrderCompletion = useCallback(async (payload, controller) => {
    const eventsStore = analyticsManager.getStore('events');
    eventsStore.update(events => [...events, {
      type: 'order_completed',
      orderId: payload.orderId,
      userId: payload.userId,
      timestamp: Date.now()
    }]);
  }, [analyticsManager]);
  
  useEventHandler('userLoggedIn', trackUserLogin);
  useEventHandler('orderCompleted', trackOrderCompletion);
}
```

### 직접 컨텍스트 브리지 패턴

```typescript
// 컨텍스트 간의 명시적 브리지 생성
export function useUserOrderBridge() {
  const userManager = useUserStoreManager();
  const orderManager = useOrderStoreManager();
  const eventBus = useEventBus();
  
  // 사용자 액션을 주문 컨텍스트로 연결
  const createOrderHandler = useCallback(async (payload, controller) => {
    const userStore = userManager.getStore('profile');
    const currentUser = userStore.getValue();
    
    if (!currentUser.id) {
      controller.abort('User not logged in');
      return;
    }
    
    // 사용자 컨텍스트와 함께 주문 생성
    const order = await orderAPI.create({
      ...payload.orderData,
      userId: currentUser.id,
      userEmail: currentUser.email
    });
    
    // 주문 컨텍스트 업데이트
    const historyStore = orderManager.getStore('history');
    historyStore.update(orders => [...orders, order]);
    
    // 다른 컨텍스트를 위한 이벤트 발생
    eventBus('orderCompleted', {
      orderId: order.id,
      userId: currentUser.id
    });
    
    return order;
  }, [userManager, orderManager, eventBus]);
  
  useOrderActionHandler('createOrder', createOrderHandler);
}
```

## 성능 고려사항

### 컨텍스트별 최적화

```typescript
// 각 컨텍스트를 독립적으로 최적화
export function useOptimizedUserContext() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 스토어별로 다른 최적화 전략 사용
  const profile = useStoreValue(profileStore, undefined, {
    comparison: 'shallow',  // 프로필 객체는 자주 변경됨
    debounce: 100          // 빠른 프로필 업데이트 디바운스
  });
  
  const preferences = useStoreValue(preferencesStore, undefined, {
    comparison: 'deep',     // 설정은 중첩되어 있고 거의 변경되지 않음
    debounce: 500          // 설정에 대해 더 높은 디바운스
  });
  
  return { profile, preferences };
}

// 선택적 컨텍스트 로딩
export function useContextLoader(requiredContexts: string[]) {
  const [loadedContexts, setLoadedContexts] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const loadContexts = async () => {
      for (const contextName of requiredContexts) {
        if (!loadedContexts.has(contextName)) {
          // 컨텍스트 데이터 지연 로딩
          await loadContextData(contextName);
          setLoadedContexts(prev => new Set([...prev, contextName]));
        }
      }
    };
    
    loadContexts();
  }, [requiredContexts, loadedContexts]);
  
  return loadedContexts;
}
```

## 컨텍스트 분할 모범 사례

### ✅ 해야 할 것들

1. **설정 명세 따르기**
   - 일관성을 위해 [다중 컨텍스트 설정 가이드](../setup/multi-context-setup.md)의 타입 정의 사용
   - 도메인 및 레이어 분리를 위한 확립된 패턴 따르기
   - 90% 이상의 패턴 준수를 위한 설정 명세 재사용

2. **도메인 경계 계획하기**
   - 명확한 비즈니스 또는 기술적 경계 식별
   - 팀 소유권과 책임 고려  
   - 미래의 성장과 변화 계획

3. **프로바이더 조합**
   - [다중 컨텍스트 설정 가이드](../setup/multi-context-setup.md)의 패턴 사용
   - JSX 호환 컴포넌트로 재사용 가능한 프로바이더 조합 생성  
   - 유지보수성을 위해 도메인이나 기능별로 프로바이더 그룹화
   - 기능 플래그와 환경 차이를 위한 조건부 조합 사용

4. **점진적 마이그레이션**
   - 컨텍스트를 점진적으로 분할
   - 전환 중 하위 호환성 유지
   - 각 마이그레이션 단계에서 철저히 테스트

5. **명확한 통신 패턴**
   - 교차 컨텍스트 통신을 위한 명시적 이벤트 시스템 사용
   - 컨텍스트 관계와 의존성 문서화
   - 관련 컨텍스트 간의 명확한 브리지 생성

6. **컨텍스트별 최적화**
   - 각 컨텍스트에 적절한 비교 전략 사용
   - 컨텍스트별 성능 최적화 구현
   - 컨텍스트별 성능 메트릭 모니터링

### ❌ 하지 말아야 할 것들

1. **과도한 분할**
   - 너무 많은 작은 컨텍스트 생성하지 말기
   - 긴밀하게 결합된 컨텍스트 분할 피하기
   - 복잡성이 정당화되기 전 성급한 분할 하지 말기

2. **긴밀한 결합**
   - 분할된 컨텍스트 간의 직접적인 의존성 생성하지 말기
   - 컨텍스트 간에 스토어 인스턴스 공유 피하기
   - 통신 패턴 우회하지 말기

3. **일관성 없는 패턴**
   - 다른 분할 전략을 일관성 없이 섞지 말기
   - 컨텍스트 간에 다른 명명 규칙 피하기
   - 비대칭적인 통신 패턴 생성하지 말기

## 마이그레이션 체크리스트

- [ ] 분할 기준 식별 (도메인, 레이어, 기능)
- [ ] 새로운 컨텍스트 구조와 경계 계획
- [ ] 새로운 컨텍스트 정의와 프로바이더 생성  
- [ ] 교차 컨텍스트 통신 패턴 설정
- [ ] 마이그레이션 브리지 훅 생성
- [ ] 컴포넌트를 점진적으로 업데이트
- [ ] 컨텍스트 격리와 통신 테스트
- [ ] 컨텍스트별 성능 최적화
- [ ] 새로운 아키텍처와 패턴 문서화
- [ ] 레거시 컨텍스트 코드 제거

## 필수 조건과 관련 패턴

### 필수 조건
- **[다중 컨텍스트 설정 가이드](../setup/multi-context-setup.md)** - 이 가이드에서 사용되는 완전한 타입 정의와 설정 패턴
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 기본 액션 컨텍스트 패턴
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 기본 스토어 컨텍스트 패턴

### 관련 아키텍처 패턴
- **[도메인 컨텍스트 아키텍처](./domain-context.md)** - 비즈니스 도메인 분리 전략
- **[MVVM 아키텍처](./mvvm.md)** - 레이어 기반 컨텍스트 구성
- **[패턴 조합](./composition.md)** - 여러 컨텍스트 효과적으로 결합하기
- **[withProvider HOC 패턴](../store/withProvider-pattern.md)** - 프로바이더 조합 유틸리티와 HOC 패턴
- **[성능 패턴](../store/performance-patterns.md)** - 컨텍스트별 성능 최적화