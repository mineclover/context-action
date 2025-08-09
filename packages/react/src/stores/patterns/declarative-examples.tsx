/**
 * Declarative Store Pattern Examples
 * 
 * Action Registry 패턴과 일치하는 선언적 Store 관리 예시들입니다.
 * 
 * @module store/declarative-examples
 * @since 2.0.0
 */

import React from 'react';
import { createDeclarativeStores, type StoreSchema } from './declarative-store-registry';
import { useStoreValue } from '../hooks/useStoreValue';

/**
 * Example 1: User Management Stores
 * 
 * 사용자 관리를 위한 타입 안전한 Store 스키마 정의
 */
interface UserStores {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: 'ko' | 'en';
    notifications: boolean;
  };
  session: {
    isLoggedIn: boolean;
    token?: string;
    lastActivity: number;
  };
}

const userStoreSchema: StoreSchema<UserStores> = {
  profile: {
    initialValue: { id: '', name: '', email: '' },
    description: 'User profile information',
    tags: ['user', 'profile'],
    strategy: 'shallow'
  },
  preferences: {
    initialValue: { theme: 'light', language: 'ko', notifications: true },
    description: 'User preferences and settings',
    tags: ['user', 'settings'],
    strategy: 'shallow'
  },
  session: {
    initialValue: { isLoggedIn: false, lastActivity: Date.now() },
    description: 'User session state',
    tags: ['user', 'session'],
    strategy: 'reference'
  }
};

// 선언적 Store 패턴 생성 - Action Registry와 동일한 패턴
export const UserStores = createDeclarativeStores('User', userStoreSchema);

/**
 * User Profile Component
 * 타입 안전한 Store 접근 예시
 */
export const UserProfile: React.FC = () => {
  // 완전한 타입 추론: Store<{id: string, name: string, email: string, avatar?: string}>
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);

  // 완전한 타입 추론: Store<{theme: 'light'|'dark', language: 'ko'|'en', notifications: boolean}>
  const preferencesStore = UserStores.useStore('preferences');
  const preferences = useStoreValue(preferencesStore);

  return (
    <div className={`profile theme-${preferences.theme}`}>
      <h1>Welcome, {profile.name}!</h1>
      <p>Email: {profile.email}</p>
      <p>Language: {preferences.language}</p>
      <p>Notifications: {preferences.notifications ? 'On' : 'Off'}</p>
    </div>
  );
};

/**
 * Example 2: E-commerce Stores
 * 
 * 전자상거래 애플리케이션을 위한 복합 Store 스키마
 */
interface ShoppingStores {
  products: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
  }>;
  cart: {
    items: Array<{ productId: string; quantity: number; price: number }>;
    total: number;
    shipping: number;
  };
  checkout: {
    step: 'cart' | 'shipping' | 'payment' | 'complete';
    shippingAddress?: {
      street: string;
      city: string;
      zipCode: string;
    };
    paymentMethod?: 'card' | 'paypal' | 'bank';
  };
}

const shoppingStoreSchema: StoreSchema<ShoppingStores> = {
  products: {
    initialValue: [],
    description: 'Product catalog',
    tags: ['shopping', 'products'],
    strategy: 'deep'
  },
  cart: {
    initialValue: { items: [], total: 0, shipping: 0 },
    description: 'Shopping cart state',
    tags: ['shopping', 'cart'],
    strategy: 'shallow'
  },
  checkout: {
    initialValue: { step: 'cart' },
    description: 'Checkout process state',
    tags: ['shopping', 'checkout'],
    strategy: 'shallow'
  }
};

export const ShoppingStores = createDeclarativeStores('Shopping', shoppingStoreSchema);

/**
 * Shopping Cart Component with HOC Pattern
 */
const ShoppingCartComponent: React.FC = () => {
  // 타입 안전한 접근
  const cartStore = ShoppingStores.useStore('cart');
  const checkoutStore = ShoppingStores.useStore('checkout');
  
  const cart = useStoreValue(cartStore);
  const checkout = useStoreValue(checkoutStore);

  const handleNextStep = () => {
    const nextSteps: Record<typeof checkout.step, typeof checkout.step> = {
      cart: 'shipping',
      shipping: 'payment',
      payment: 'complete',
      complete: 'cart'
    };
    
    checkoutStore.setValue({ ...checkout, step: nextSteps[checkout.step] });
  };

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      <div>Items: {cart.items.length}</div>
      <div>Total: ${cart.total}</div>
      <div>Step: {checkout.step}</div>
      <button onClick={handleNextStep}>
        Next Step
      </button>
    </div>
  );
};

// HOC를 사용한 자동 Provider 래핑
export const ShoppingCart = ShoppingStores.withProvider('main-cart')(ShoppingCartComponent);

/**
 * Example 3: Dashboard Analytics Stores
 * 
 * 대시보드 분석을 위한 성능 최적화된 Store 스키마
 */
interface DashboardStores {
  metrics: {
    views: number;
    users: number;
    revenue: number;
    conversions: number;
  };
  filters: {
    dateRange: { start: Date; end: Date };
    category?: string;
    region?: string;
  };
  charts: {
    loading: boolean;
    data: Array<{ date: string; value: number }>;
    error?: string;
  };
}

const dashboardStoreSchema: StoreSchema<DashboardStores> = {
  metrics: {
    initialValue: { views: 0, users: 0, revenue: 0, conversions: 0 },
    description: 'Analytics metrics',
    tags: ['dashboard', 'metrics', 'analytics'],
    strategy: 'reference' // 성능 최적화
  },
  filters: {
    initialValue: () => ({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
        end: new Date()
      }
    }),
    description: 'Dashboard filter settings',
    tags: ['dashboard', 'filters'],
    strategy: 'shallow'
  },
  charts: {
    initialValue: { loading: false, data: [] },
    description: 'Chart data and loading state',
    tags: ['dashboard', 'charts'],
    strategy: 'shallow'
  }
};

export const DashboardStores = createDeclarativeStores('Dashboard', dashboardStoreSchema);

/**
 * Analytics Dashboard Component
 * ActionProvider와 함께 사용하는 예시
 */
const AnalyticsDashboardComponent: React.FC = () => {
  const metricsStore = DashboardStores.useStore('metrics');
  const filtersStore = DashboardStores.useStore('filters');
  const chartsStore = DashboardStores.useStore('charts');
  
  const metrics = useStoreValue(metricsStore);
  const filters = useStoreValue(filtersStore);
  const charts = useStoreValue(chartsStore);

  // Registry 정보 확인 (디버깅용)
  const registryInfo = DashboardStores.useRegistryInfo();
  const { initializeAll, isInitialized } = DashboardStores.useRegistryActions();

  React.useEffect(() => {
    // 모든 Store 미리 초기화 (성능 최적화)
    if (registryInfo.initializedStores < registryInfo.totalStores) {
      initializeAll();
    }
  }, [initializeAll, registryInfo]);

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>
      
      <div className="metrics-grid">
        <div>Views: {metrics.views}</div>
        <div>Users: {metrics.users}</div>
        <div>Revenue: ${metrics.revenue}</div>
        <div>Conversions: {metrics.conversions}%</div>
      </div>

      <div className="filters">
        <span>Date Range: {filters.dateRange.start.toDateString()} - {filters.dateRange.end.toDateString()}</span>
        {filters.category && <span>Category: {filters.category}</span>}
        {filters.region && <span>Region: {filters.region}</span>}
      </div>

      <div className="charts">
        {charts.loading ? (
          <div>Loading charts...</div>
        ) : charts.error ? (
          <div>Error: {charts.error}</div>
        ) : (
          <div>Chart data: {charts.data.length} points</div>
        )}
      </div>

      {/* Registry 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h3>Registry Info</h3>
          <p>Registry: {registryInfo.name}</p>
          <p>Initialized: {registryInfo.initializedStores}/{registryInfo.totalStores}</p>
          <p>Metrics initialized: {isInitialized('metrics') ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

// ActionProvider와 함께 사용하는 HOC 패턴
export const AnalyticsDashboard = DashboardStores.withCustomProvider(
  ({ children }) => (
    // ActionProvider나 다른 Provider와 함께 조합 가능
    <div className="dashboard-wrapper">
      {children}
    </div>
  ),
  'analytics-main'
)(AnalyticsDashboardComponent);

/**
 * Example 4: Type-Safe Store Access Pattern
 * 
 * 컴파일타임 타입 체크 예시
 */
export const TypeSafetyExample: React.FC = () => {
  const userStores = UserStores.useRegistry();
  const registryInfo = UserStores.useRegistryInfo();

  return (
    <div>
      <h2>Type Safety Demonstration</h2>
      
      {/* ✅ 타입 안전한 접근 */}
      <div>
        Available stores: {registryInfo.availableStores.join(', ')}
      </div>
      
      {/* ✅ 스키마 기반 접근 */}
      <div>
        Profile store schema: {JSON.stringify(userStores.getStoreSchema('profile'), null, 2)}
      </div>
      
      {/* ❌ 컴파일 에러: 'invalid' 스토어는 스키마에 정의되지 않음 */}
      {/* const invalidStore = UserStores.useStore('invalid'); */}
      
      {/* ✅ 런타임 에러 방지: 스키마에 없는 Store 접근 시 명확한 에러 메시지 */}
      <button onClick={() => {
        try {
          // @ts-ignore - 런타임 테스트용
          userStores.getStore('nonexistent');
        } catch (error) {
          console.error('Expected error:', error instanceof Error ? error.message : error);
        }
      }}>
        Test Runtime Error Handling
      </button>
    </div>
  );
};