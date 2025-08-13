/**
 * Declarative Store Pattern Examples
 * 
 * 선언적 Store Pattern v2의 관리 예시들입니다.
 * 
 * @module store/declarative-examples
 * @since 2.0.0
 */

import React from 'react';
import { createDeclarativeStorePattern, type StoreConfig } from './declarative-store-pattern-v2';
import { useStoreValue } from '../hooks/useStoreValue';

/**
 * Example 1: User Management Stores
 * 
 * 사용자 관리를 위한 타입 안전한 Store 패턴 정의
 */

// 선언적 Store 패턴 생성 - 자동 타입 추론
export const UserStores = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '' },
    description: 'User profile information',
    strategy: 'shallow'
  },
  preferences: {
    initialValue: { theme: 'light' as 'light' | 'dark', language: 'ko' as 'ko' | 'en', notifications: true },
    description: 'User preferences and settings',
    strategy: 'shallow'
  },
  session: {
    initialValue: { isLoggedIn: false, lastActivity: Date.now() },
    description: 'User session state',
    strategy: 'reference'
  }
});

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
 * 전자상거래 애플리케이션을 위한 복합 Store 패턴
 */

export const ShoppingStores = createDeclarativeStorePattern('Shopping', {
  products: {
    initialValue: [] as Array<{
      id: string;
      name: string;
      price: number;
      category: string;
      inStock: boolean;
    }>,
    description: 'Product catalog',
    strategy: 'deep'
  },
  cart: {
    initialValue: {
      items: [] as Array<{ productId: string; quantity: number; price: number }>,
      total: 0,
      shipping: 0
    },
    description: 'Shopping cart state',
    strategy: 'shallow'
  },
  checkout: {
    initialValue: {
      step: 'cart' as 'cart' | 'shipping' | 'payment' | 'complete'
    },
    description: 'Checkout process state',
    strategy: 'shallow'
  }
});

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
export const ShoppingCart = ShoppingStores.withProvider(ShoppingCartComponent, { displayName: 'ShoppingCartWithProviders' });

// 독립적인 인스턴스는 registryId로 구분
// 예: <ShoppingStores.Provider registryId="cart-1"> 형태로 사용

/**
 * Example 3: Dashboard Analytics Stores
 * 
 * 대시보드 분석을 위한 성능 최적화된 Store 패턴
 */

export const DashboardStores = createDeclarativeStorePattern('Dashboard', {
  metrics: {
    initialValue: { views: 0, users: 0, revenue: 0, conversions: 0 },
    description: 'Analytics metrics',
    strategy: 'reference' // 성능 최적화
  },
  filters: {
    initialValue: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
        end: new Date()
      },
      category: undefined as string | undefined,
      region: undefined as string | undefined
    },
    description: 'Dashboard filter settings',
    strategy: 'shallow'
  },
  charts: {
    initialValue: { 
      loading: false, 
      data: [] as Array<{ date: string; value: number }>,
      error: undefined as string | undefined
    },
    description: 'Chart data and loading state',
    strategy: 'shallow'
  }
});

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

  // Note: useRegistryInfo and useRegistryActions are not available in the new pattern
  // Store initialization is handled automatically

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

      {/* Debug info simplified in new pattern */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h3>Store Pattern Info</h3>
          <p>Pattern: Declarative Store Pattern v2</p>
          <p>Auto-initialization: Enabled</p>
        </div>
      )}
    </div>
  );
};

// 고급 패턴 - 수동 Provider 조합
const DashboardWithProviders: React.FC = () => {
  return (
    <DashboardStores.Provider>
      <div className="dashboard-wrapper">
        <AnalyticsDashboardComponent />
      </div>
    </DashboardStores.Provider>
  );
};

export const AnalyticsDashboard = DashboardWithProviders;

// 간단한 HOC 패턴도 여전히 지원
export const SimpleAnalyticsDashboard = DashboardStores.withProvider(AnalyticsDashboardComponent, { displayName: 'AnalyticsDashboardSimple' });

/**
 * Example 4: Type-Safe Store Access Pattern
 * 
 * 컴파일타입 타입 체크 예시 - 새로운 패턴
 */
export const TypeSafetyExample: React.FC = () => {
  // 새로운 패턴에서는 더 간단한 접근
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);

  return (
    <div>
      <h2>Type Safety Demonstration - New Pattern</h2>
      
      {/* ✅ 타입 안전한 접근 */}
      <div>
        Available stores: profile, preferences, session
      </div>
      
      {/* ✅ 자동 타입 추론 */}
      <div>
        Profile data: {JSON.stringify(profile, null, 2)}
      </div>
      
      {/* ❌ 컴파일 에러: 'invalid' 스토어는 정의되지 않음 */}
      {/* const invalidStore = UserStores.useStore('invalid'); */}
      
      <div>
        Pattern: Declarative Store Pattern v2 with automatic type inference
      </div>
    </div>
  );
};