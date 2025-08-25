# 다중 컨텍스트 설정

대규모 애플리케이션을 위한 다중 컨텍스트를 결합한 복잡한 아키텍처 설정 패턴입니다.

## 임포트
```typescript
import { 
  createActionContext, 
  createDeclarativeStorePattern, 
  createRefContext,
  composeProviders
} from '@context-action/react';
```

## MVVM 아키텍처 설정

### 완전한 타입 정의
```typescript
// 도메인: 사용자 관리
export interface UserStores {
  profile: { 
    id: string; 
    name: string; 
    email: string; 
    role: 'admin' | 'user' | 'guest' 
  };
  session: { 
    isAuthenticated: boolean; 
    permissions: string[]; 
    lastActivity: number 
  };
  preferences: { 
    theme: 'light' | 'dark'; 
    language: string; 
    notifications: boolean 
  };
}

export interface UserActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; email?: string };
  changePassword: { currentPassword: string; newPassword: string };
  updatePreferences: { preferences: Partial<UserStores['preferences']> };
}

export interface UserPerformanceRefs {
  profileForm: HTMLFormElement;
  avatarImage: HTMLImageElement;
  passwordField: HTMLInputElement;
  themeToggle: HTMLButtonElement;
}

// 도메인: 제품 관리
export interface ProductStores {
  catalog: Product[];
  categories: Category[];
  filters: ProductFilters;
  cart: { items: CartItem[]; total: number };
  wishlist: Product[];
}

export interface ProductActions {
  loadProducts: { categoryId?: string; page?: number };
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  addToWishlist: { productId: string };
  updateFilters: { filters: Partial<ProductFilters> };
  clearCart: void;
}

export interface ProductPerformanceRefs {
  productGrid: HTMLDivElement;
  filterPanel: HTMLDivElement;
  cartDrawer: HTMLDivElement;
  searchInput: HTMLInputElement;
}

// 도메인: UI 상태 관리
export interface UIStores {
  modal: { isOpen: boolean; type?: string; data?: any };
  sidebar: { isOpen: boolean; activePanel?: string };
  loading: { global: boolean; operations: Record<string, boolean> };
  notifications: { items: UINotification[]; maxVisible: number };
  navigation: { currentRoute: string; breadcrumbs: Breadcrumb[] };
}

export interface UIActions {
  showModal: { type: string; data?: any };
  hideModal: { type?: string };
  toggleSidebar: { panel?: string };
  setLoading: { operation: string; loading: boolean };
  showNotification: { message: string; type: 'success' | 'error' | 'info' };
  navigate: { route: string; replace?: boolean };
}
```

### MVVM 컨텍스트 생성
```typescript
// 사용자 도메인 - 모델 레이어 (Store Only Pattern)
export const UserModelContext = createDeclarativeStorePattern('User', {
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
});

// 사용자 도메인 - 뷰모델 레이어 (Action Only Pattern)
export const UserViewModelContext = createActionContext<UserActions>('User');

// 사용자 도메인 - 성능 레이어 (RefContext Pattern)
export const UserPerformanceContext = createRefContext<UserPerformanceRefs>('UserPerformance');

// 제품 도메인 - 완전한 설정
export const ProductModelContext = createDeclarativeStorePattern('Product', {
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: { initialValue: {}, strategy: 'shallow' as const },
  cart: { 
    initialValue: { items: [], total: 0 },
    strategy: 'shallow' as const
  },
  wishlist: [] as Product[]
});

export const ProductViewModelContext = createActionContext<ProductActions>('Product');
export const ProductPerformanceContext = createRefContext<ProductPerformanceRefs>('ProductPerformance');

// UI 도메인 - 완전한 설정
export const UIModelContext = createDeclarativeStorePattern('UI', {
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
});

export const UIViewModelContext = createActionContext<UIActions>('UI');
```

### 모든 프로바이더와 훅 추출
```typescript
// 사용자 도메인
export const {
  Provider: UserModelProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = UserModelContext;

export const {
  Provider: UserViewModelProvider,
  useActionDispatch: useUserActionDispatch,
  useActionHandler: useUserActionHandler
} = UserViewModelContext;

export const {
  Provider: UserPerformanceProvider,
  useRefHandler: useUserPerformanceRef
} = UserPerformanceContext;

// 제품 도메인
export const {
  Provider: ProductModelProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = ProductModelContext;

export const {
  Provider: ProductViewModelProvider,
  useActionDispatch: useProductActionDispatch,
  useActionHandler: useProductActionHandler
} = ProductViewModelContext;

export const {
  Provider: ProductPerformanceProvider,
  useRefHandler: useProductPerformanceRef
} = ProductPerformanceContext;

// UI 도메인
export const {
  Provider: UIModelProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = UIModelContext;

export const {
  Provider: UIViewModelProvider,
  useActionDispatch: useUIActionDispatch,
  useActionHandler: useUIActionHandler
} = UIViewModelContext;
```

## 도메인 컨텍스트 아키텍처 설정

### 비즈니스 도메인 설정
```typescript
// 비즈니스 컨텍스트 (핵심 도메인)
export interface BusinessStores {
  orders: Order[];
  inventory: InventoryItem[];
  customers: Customer[];
  analytics: AnalyticsData;
}

export interface BusinessActions {
  processOrder: { customerId: string; items: OrderItem[] };
  updateInventory: { itemId: string; quantity: number };
  validateCustomer: { customerId: string };
  generateReport: { type: string; dateRange: DateRange };
}

export const BusinessModelContext = createDeclarativeStorePattern('Business', {
  orders: [] as Order[],
  inventory: [] as InventoryItem[],
  customers: [] as Customer[],
  analytics: {
    initialValue: { revenue: 0, orders: 0, customers: 0 },
    strategy: 'shallow' as const
  }
});

export const BusinessViewModelContext = createActionContext<BusinessActions>('Business');
```

### 검증 도메인 설정
```typescript
// 검증 컨텍스트 (횡단 관심사)
export interface ValidationStores {
  validationRules: ValidationRule[];
  validationResults: ValidationResult[];
  formErrors: Record<string, string[]>;
  fieldStatuses: Record<string, 'valid' | 'invalid' | 'pending'>;
}

export interface ValidationActions {
  validateField: { 
    fieldName: string; 
    value: any; 
    rules: ValidationRule[] 
  };
  validateForm: { 
    formId: string; 
    data: Record<string, any>; 
    schema: ValidationSchema 
  };
  clearValidationErrors: { formId?: string; fieldName?: string };
  setFieldStatus: { fieldName: string; status: 'valid' | 'invalid' | 'pending' };
}

export const ValidationModelContext = createDeclarativeStorePattern('Validation', {
  validationRules: [] as ValidationRule[],
  validationResults: [] as ValidationResult[],
  formErrors: {} as Record<string, string[]>,
  fieldStatuses: {} as Record<string, 'valid' | 'invalid' | 'pending'>
});

export const ValidationViewModelContext = createActionContext<ValidationActions>('Validation');
```

### 디자인 시스템 컨텍스트 설정
```typescript
// 디자인 컨텍스트 (테마 및 시각적 상태)
export interface DesignStores {
  theme: ThemeConfig;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  colorScheme: 'light' | 'dark' | 'auto';
  animations: { enabled: boolean; duration: number };
  layouts: Record<string, LayoutConfig>;
}

export interface DesignActions {
  setTheme: { theme: Partial<ThemeConfig> };
  changeColorScheme: { scheme: 'light' | 'dark' | 'auto' };
  updateBreakpoint: { breakpoint: 'mobile' | 'tablet' | 'desktop' };
  toggleAnimations: { enabled?: boolean };
  setLayout: { layoutId: string; config: LayoutConfig };
}

export const DesignModelContext = createDeclarativeStorePattern('Design', {
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
});

export const DesignViewModelContext = createActionContext<DesignActions>('Design');
```

## 프로바이더 구성 패턴

### 레이어 기반 구성 (MVVM)
```typescript
// MVVM 레이어 기반 프로바이더 구성
const MVVMProviders = composeProviders([
  // 모델 레이어 (상태 관리)
  UserModelProvider,
  ProductModelProvider,
  UIModelProvider,
  
  // 뷰모델 레이어 (비즈니스 로직)
  UserViewModelProvider,
  ProductViewModelProvider,
  UIViewModelProvider,
  
  // 성능 레이어 (DOM 작업)
  UserPerformanceProvider,
  ProductPerformanceProvider
]);

function MVVMApp() {
  return (
    <MVVMProviders>
      <ApplicationComponents />
    </MVVMProviders>
  );
}
```

### 도메인 기반 구성
```typescript
// 도메인 주도 프로바이더 구성
const DomainProviders = composeProviders([
  // 핵심 비즈니스 도메인
  BusinessModelProvider,
  BusinessViewModelProvider,
  
  // 사용자 인터페이스 도메인
  UIModelProvider,
  UIViewModelProvider,
  
  // 검증 도메인
  ValidationModelProvider,
  ValidationViewModelProvider,
  
  // 디자인 시스템 도메인
  DesignModelProvider,
  DesignViewModelProvider
]);

function DomainApp() {
  return (
    <DomainProviders>
      <DomainComponents />
    </DomainProviders>
  );
}
```

### 조건부 다중 컨텍스트 설정
```typescript
// 기능 플래그가 포함된 엔터프라이즈 구성
interface EnterpriseConfig {
  features: {
    userManagement: boolean;
    productCatalog: boolean;
    analytics: boolean;
    validation: boolean;
    designSystem: boolean;
  };
  performance: {
    enableRefContext: boolean;
    enableCaching: boolean;
  };
}

function createEnterpriseProviders(config: EnterpriseConfig) {
  const providers = [];
  
  // 항상 UI 관리 포함
  providers.push(UIModelProvider, UIViewModelProvider);
  
  if (config.features.userManagement) {
    providers.push(UserModelProvider, UserViewModelProvider);
    if (config.performance.enableRefContext) {
      providers.push(UserPerformanceProvider);
    }
  }
  
  if (config.features.productCatalog) {
    providers.push(ProductModelProvider, ProductViewModelProvider);
    if (config.performance.enableRefContext) {
      providers.push(ProductPerformanceProvider);
    }
  }
  
  if (config.features.analytics) {
    providers.push(BusinessModelProvider, BusinessViewModelProvider);
  }
  
  if (config.features.validation) {
    providers.push(ValidationModelProvider, ValidationViewModelProvider);
  }
  
  if (config.features.designSystem) {
    providers.push(DesignModelProvider, DesignViewModelProvider);
  }
  
  return composeProviders(providers);
}

function EnterpriseApp({ config }: { config: EnterpriseConfig }) {
  const EnterpriseProviders = createEnterpriseProviders(config);
  
  return (
    <EnterpriseProviders>
      <EnterpriseComponents />
    </EnterpriseProviders>
  );
}
```

### 중첩 도메인 구성
```typescript
// 복잡한 중첩 도메인 구조
function createNestedDomainProviders() {
  // 핵심 인프라스트럭처 레이어
  const CoreProviders = composeProviders([
    UIModelProvider,
    UIViewModelProvider,
    ValidationModelProvider,
    ValidationViewModelProvider
  ]);
  
  // 비즈니스 로직 레이어
  const BusinessProviders = composeProviders([
    BusinessModelProvider,
    BusinessViewModelProvider,
    UserModelProvider,
    UserViewModelProvider
  ]);
  
  // 기능 레이어
  const FeatureProviders = composeProviders([
    ProductModelProvider,
    ProductViewModelProvider,
    DesignModelProvider,
    DesignViewModelProvider
  ]);
  
  // 성능 레이어
  const PerformanceProviders = composeProviders([
    UserPerformanceProvider,
    ProductPerformanceProvider
  ]);
  
  return { 
    CoreProviders, 
    BusinessProviders, 
    FeatureProviders, 
    PerformanceProviders 
  };
}

function LayeredApp() {
  const { 
    CoreProviders, 
    BusinessProviders, 
    FeatureProviders, 
    PerformanceProviders 
  } = createNestedDomainProviders();
  
  return (
    <CoreProviders>
      <BusinessProviders>
        <FeatureProviders>
          <PerformanceProviders>
            <LayeredComponents />
          </PerformanceProviders>
        </FeatureProviders>
      </BusinessProviders>
    </CoreProviders>
  );
}
```

## 컨텍스트 간 통신 설정

### 이벤트 버스 패턴
```typescript
// 컨텍스트 간 통신 이벤트
export interface CrossContextEvents {
  userLoggedIn: { userId: string; timestamp: number };
  userLoggedOut: { userId: string };
  orderCompleted: { orderId: string; userId: string; total: number };
  productAddedToCart: { productId: string; userId: string; quantity: number };
  themeChanged: { theme: string; userId?: string };
  validationCompleted: { formId: string; isValid: boolean; errors: string[] };
}

export const {
  Provider: EventBusProvider,
  useActionDispatch: useEventBus,
  useActionHandler: useEventHandler
} = createActionContext<CrossContextEvents>('EventBus');

// 다중 컨텍스트 설정에 추가
const MultiContextWithEvents = composeProviders([
  EventBusProvider,  // 통신 레이어
  ...otherProviders
]);
```

### 컨텍스트 브리지 설정
```typescript
// 컨텍스트 간 통합을 위한 브리지 유틸리티
export interface ContextBridge {
  user: {
    store: ReturnType<typeof useUserStoreManager>;
    actions: ReturnType<typeof useUserActionDispatch>;
  };
  product: {
    store: ReturnType<typeof useProductStoreManager>;
    actions: ReturnType<typeof useProductActionDispatch>;
  };
  ui: {
    store: ReturnType<typeof useUIStoreManager>;
    actions: ReturnType<typeof useUIActionDispatch>;
  };
  eventBus: ReturnType<typeof useEventBus>;
}

// 복잡한 컨텍스트 간 작업을 위한 브리지 훅
export function useContextBridge(): ContextBridge {
  return {
    user: {
      store: useUserStoreManager(),
      actions: useUserActionDispatch()
    },
    product: {
      store: useProductStoreManager(),
      actions: useProductActionDispatch()
    },
    ui: {
      store: useUIStoreManager(),
      actions: useUIActionDispatch()
    },
    eventBus: useEventBus()
  };
}
```

## 다중 컨텍스트를 위한 내보내기 패턴

### 도메인 번들 내보내기
```typescript
// contexts/UserDomain.ts
export * from './UserTypes';
export { 
  UserModelProvider, 
  UserViewModelProvider, 
  UserPerformanceProvider,
  useUserStore,
  useUserStoreManager,
  useUserActionDispatch,
  useUserActionHandler,
  useUserPerformanceRef
} from './UserContexts';

// contexts/ProductDomain.ts
export * from './ProductTypes';
export { 
  ProductModelProvider, 
  ProductViewModelProvider, 
  ProductPerformanceProvider,
  useProductStore,
  useProductStoreManager,
  useProductActionDispatch,
  useProductActionHandler,
  useProductPerformanceRef
} from './ProductContexts';

// contexts/index.ts - 메인 내보내기
export * from './UserDomain';
export * from './ProductDomain';
export * from './UIDomain';
export * from './ValidationDomain';
export * from './DesignDomain';
export { useContextBridge } from './ContextBridge';
```

### 프로바이더 구성 내보내기
```typescript
// providers/index.ts
export { 
  createMVVMProviders,
  createDomainProviders,
  createEnterpriseProviders,
  createNestedDomainProviders
} from './ProviderFactories';

export {
  MVVMProviders,
  DomainProviders,
  EnterpriseProviders
} from './ComposedProviders';
```

## 다중 컨텍스트 설정을 위한 모범 사례

### 아키텍처 계획
1. **도메인 경계**: 비즈니스 도메인 경계를 명확히 정의
2. **레이어 분리**: 모델, 뷰모델, 성능 레이어 분리
3. **통신 패턴**: 컨텍스트 간 통신을 일찍 계획
4. **성능 고려사항**: 프로바이더 트리 깊이와 리렌더링 영향 고려

### 프로바이더 조직
1. **논리적 그룹화**: 아키텍처 레이어 또는 비즈니스 도메인별로 프로바이더 그룹화
2. **구성 유틸리티**: 다중 프로바이더에는 항상 `composeProviders` 사용
3. **조건부 로딩**: 선택적 컨텍스트 프로바이더를 위해 기능 플래그 사용
4. **프로바이더 순서**: 종속성 요구사항에 따른 프로바이더 순서

### 타입 관리
1. **도메인 타입**: 도메인 타입을 별도 파일로 유지
2. **공유 타입**: 일반적인 인터페이스를 위한 공유 타입 라이브러리 생성
3. **내보내기 전략**: 깔끔한 임포트 문을 위해 배럴 내보내기 사용
4. **타입 안전성**: 엄격한 TypeScript 구성 유지

## 일반적인 아키텍처 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- **[MVVM 아키텍처](../architecture/mvvm.md)** - 완전한 MVVM 설정 사용
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 도메인 분리 사용
- **[컨텍스트 분할 패턴](../architecture/context-splitting.md)** - 프로바이더 구성 사용
- **[성능 패턴](../performance/optimization-techniques.md)** - RefContext 패턴 사용

## 관련 설정 가이드

- **[기본 액션 설정](./basic-action-setup.md)** - 단일 액션 컨텍스트 패턴
- **[기본 스토어 설정](./basic-store-setup.md)** - 단일 스토어 컨텍스트 패턴
- **[프로바이더 구성](../store/withProvider-pattern.md)** - 고급 구성 기법