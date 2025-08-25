# useComputedStore 패턴

파생 상태, 성능 최적화, 반응형 계산을 위한 `useComputedStore`를 사용한 계산된 값 패턴.

## 가져오기
```typescript
import { useComputedStore, useStoreValue } from '@context-action/react';
import { useUserStore, useProductStore, useUIStore } from '../setup/stores'; // 설정 가이드에서
```

## 사전 요구사항

스토어 정의, 컨텍스트 생성, 프로바이더 설정을 포함한 완전한 설정 지침은 **[기본 스토어 설정](../setup/basic-store-setup.md)** 을 참조하세요.

이 문서는 스토어 설정을 사용한 계산 스토어 패턴을 보여줍니다:
- 스토어 타입 정의 → [타입 정의](../setup/basic-store-setup.md#type-definitions)  
- 컨텍스트 생성 → [스토어 컨텍스트 생성](../setup/basic-store-setup.md#store-context-creation)
- 프로바이더 설정 → [프로바이더 설정](../setup/basic-store-setup.md#provider-configuration)

## 기본 계산된 값

### 간단한 파생 상태

```tsx
import { useComputedStore } from '@context-action/react';
import { useUserStore } from '../setup/stores';

function UserDisplayName() {
  const profileStore = useUserStore('profile');
  
  // 프로필 스토어에서 계산된 전체 이름
  const fullName = useComputedStore(
    [profileStore],
    ([profile]) => `${profile.name} (${profile.role})`
  );
  
  return <div>{fullName}님, 환영합니다</div>;
}
```

### 다중 스토어 계산

```tsx
import { useProductStore, useUserStore } from '../setup/stores';

function CartCalculator() {
  const cartStore = useProductStore('cart');
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const cartSummary = useComputedStore(
    [cartStore, profileStore, preferencesStore],
    ([cart, profile, preferences]) => {
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // 사용자 역할 할인 적용
      const roleDiscount = profile.role === 'admin' ? 0.2 : 0;
      const discountAmount = subtotal * roleDiscount;
      
      // 통화 기본 설정 적용
      const currency = preferences.language === 'ko' ? '₩' : '$';
      const total = subtotal - discountAmount;
      
      return {
        subtotal: `${currency}${subtotal.toFixed(2)}`,
        discount: `${currency}${discountAmount.toFixed(2)}`,
        total: `${currency}${total.toFixed(2)}`,
        itemCount: cart.items.length
      };
    }
  );
  
  return (
    <div>
      <div>소계: {cartSummary.subtotal}</div>
      <div>할인: -{cartSummary.discount}</div>
      <div>합계: {cartSummary.total}</div>
      <div>항목: {cartSummary.itemCount}</div>
    </div>
  );
}
```

## 고급 계산 패턴

### 조건부 계산

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function UserStatusIndicator() {
  const sessionStore = useUserStore('session');
  const profileStore = useUserStore('profile');
  const navigationStore = useUIStore('navigation');
  
  const userStatus = useComputedStore(
    [sessionStore, profileStore, navigationStore],
    ([session, profile, navigation]) => {
      if (!session.isAuthenticated) return 'guest';
      
      const lastActivity = Date.now() - session.lastActivity;
      const isOnline = lastActivity < 300000; // 5분
      
      if (profile.role === 'admin') {
        return isOnline ? 'admin-online' : 'admin-away';
      }
      
      // 사용자가 적극적으로 탐색 중인지 확인
      const isActiveUser = navigation.history.length > 1 && isOnline;
      
      return isActiveUser ? 'active' : isOnline ? 'online' : 'away';
    }
  );
  
  const statusColor = {
    'guest': 'gray',
    'admin-online': 'red',
    'admin-away': 'orange',  
    'active': 'green',
    'online': 'blue',
    'away': 'yellow'
  }[userStatus] || 'gray';
  
  return <div className={`status-indicator ${statusColor}`}>{userStatus}</div>;
}
```

### 복잡한 객체 변환

```tsx
import { useUserStore, useProductStore, useUIStore } from '../setup/stores';

function DashboardStats() {
  const sessionStore = useUserStore('session');
  const catalogStore = useProductStore('catalog');
  const cartStore = useProductStore('cart');
  const filtersStore = useProductStore('filters');
  const loadingStore = useUIStore('loading');
  
  const dashboardData = useComputedStore(
    [sessionStore, catalogStore, cartStore, filtersStore, loadingStore],
    ([session, catalog, cart, filters, loading]) => {
      const userPermissions = session.permissions || [];
      const canViewStats = userPermissions.includes('view_dashboard');
      
      if (!canViewStats) {
        return { error: '접근 거부', stats: null };
      }
      
      // 현재 필터에 따른 제품 필터링
      const filteredProducts = catalog.filter(product => {
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesPrice = !filters.priceRange || 
          (product.price >= filters.priceRange.min && product.price <= filters.priceRange.max);
        const matchesSearch = !filters.searchTerm || 
          product.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        return matchesCategory && matchesPrice && matchesSearch;
      });
      
      return {
        products: {
          total: catalog.length,
          filtered: filteredProducts.length,
          inCart: cart.items.length,
          categories: [...new Set(catalog.map(p => p.category))].length
        },
        cart: {
          items: cart.items.length,
          total: cart.total,
          discounts: cart.discounts.length,
          avgItemPrice: cart.items.length > 0 ? cart.total / cart.items.length : 0
        },
        filters: {
          activeFilters: Object.values(filters).filter(f => f != null).length,
          searchActive: Boolean(filters.searchTerm),
          categorySelected: Boolean(filters.category)
        },
        system: {
          isLoading: loading.global,
          activeOperations: Object.keys(loading.operations).filter(
            op => loading.operations[op]
          ).length
        }
      };
    }
  );
  
  if (dashboardData.error) {
    return <div className="error">{dashboardData.error}</div>;
  }
  
  const stats = dashboardData;
  
  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>제품</h3>
        <div>전체: {stats.products.total}</div>
        <div>필터된 것: {stats.products.filtered}</div>
        <div>카트에 있는 것: {stats.products.inCart}</div>
        <div>카테고리: {stats.products.categories}</div>
      </div>
      
      <div className="stat-card">
        <h3>카트</h3>
        <div>항목: {stats.cart.items}</div>
        <div>합계: ${stats.cart.total.toFixed(2)}</div>
        <div>평균 가격: ${stats.cart.avgItemPrice.toFixed(2)}</div>
        <div>할인: {stats.cart.discounts}</div>
      </div>
      
      <div className="stat-card">
        <h3>시스템</h3>
        <div>로딩 중: {stats.system.isLoading ? '예' : '아니오'}</div>
        <div>작업: {stats.system.activeOperations}</div>
        <div>필터: {stats.filters.activeFilters}</div>
      </div>
    </div>
  );
}
```

## 성능 최적화

### 커스텀 키로 캐싱

```tsx
import { useProductStore, useUserStore } from '../setup/stores';

function OptimizedProductSearch() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const preferencesStore = useUserStore('preferences');
  
  // 캐싱이 있는 비용이 많이 드는 검색 계산
  const searchResults = useComputedStore(
    [catalogStore, filtersStore, preferencesStore],
    ([catalog, filters, preferences]) => {
      // 검색 알고리즘의 무거운 처리
      return performAdvancedSearch(catalog, filters, preferences.language);
    },
    {
      comparison: 'deep',
      cacheKey: 'product-search',
      debug: process.env.NODE_ENV === 'development'
    }
  );
  
  return (
    <div>
      {searchResults.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

function performAdvancedSearch(catalog, filters, language) {
  // 비용이 많이 드는 계산 시뮬레이션
  console.log('검색 결과 계산 중...');
  return catalog
    .filter(product => {
      // 복잡한 필터링 로직
      return filters.searchTerm ? 
        product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) : 
        true;
    })
    .sort((a, b) => {
      // 언어 기본 설정에 기반한 복잡한 정렬
      return language === 'ko' ? 
        a.name.localeCompare(b.name, 'ko') : 
        a.name.localeCompare(b.name);
    });
}
```

### 메모이제이션된 의존성

```tsx
import { useMemo } from 'react';
import { useUserStore } from '../setup/stores';

function OptimizedUserProcessor() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  // 더 나은 성능을 위한 메모이제이션된 계산 함수
  const computationFn = useMemo(() => 
    ([profile, session, preferences]) => {
      // 비용이 많이 드는 사용자 데이터 처리
      return processComplexUserData(profile, session, preferences);
    }, []
  );
  
  const processedUserData = useComputedStore(
    [profileStore, sessionStore, preferencesStore],
    computationFn,
    {
      comparison: 'shallow'
    }
  );
  
  return (
    <div>
      <div>처리된 이름: {processedUserData.displayName}</div>
      <div>사용자 레벨: {processedUserData.level}</div>
      <div>권한: {processedUserData.permissions.join(', ')}</div>
    </div>
  );
}

function processComplexUserData(profile, session, preferences) {
  console.log('사용자 데이터 처리 중...');
  return {
    displayName: `${profile.name} (${profile.role})`,
    level: session.permissions.length > 5 ? 'advanced' : 'basic',
    permissions: session.permissions,
    theme: preferences.theme,
    language: preferences.language
  };
}
```

### 선택적 업데이트

```tsx
import { useUserStore, useUIStore } from '../setup/stores';

function SelectiveUserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const navigationStore = useUIStore('navigation');
  
  // 특정 필드가 변경될 때만 재계산
  const userDisplayData = useComputedStore(
    [profileStore, sessionStore, navigationStore],
    ([profile, session, navigation]) => ({
      // 핵심 표시 데이터 - 이것들이 변경될 때만 재계산
      displayName: `${profile.name} (${profile.role})`,
      isAuthenticated: session.isAuthenticated,
      currentPage: navigation.currentRoute,
      // 성능을 위해 session.lastActivity 변경 무시
      // 성능을 위해 navigation.history 변경 무시
    }),
    {
      // 자주 변경되는 필드를 무시하는 커스텀 비교
      comparison: (prev, next) => {
        const [prevProfile, prevSession, prevNav] = prev;
        const [nextProfile, nextSession, nextNav] = next;
        
        // 특정 필드만 고려
        return (
          prevProfile.name === nextProfile.name &&
          prevProfile.role === nextProfile.role &&
          prevSession.isAuthenticated === nextSession.isAuthenticated &&
          prevNav.currentRoute === nextNav.currentRoute
        );
      }
    }
  );
  
  return (
    <div className="user-profile">
      <h2>{userDisplayData.displayName}</h2>
      <div>상태: {userDisplayData.isAuthenticated ? '로그인됨' : '게스트'}</div>
      <div>페이지: {userDisplayData.currentPage}</div>
    </div>
  );
}
```

## 계산 스토어 인스턴스

### 재사용 가능한 계산 스토어 생성

```tsx
import { useComputedStoreInstance, useStoreValue } from '@context-action/react';
import { useUserStore, useUIStore } from '../setup/stores';

function UserBadgeProvider({ children }) {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 사용자 배지를 위한 계산 스토어 인스턴스 생성
  const userBadgeStore = useComputedStoreInstance(
    [profileStore, preferencesStore],
    ([profile, preferences]) => {
      if (preferences.theme === 'minimal') return null;
      
      const scoreFromRole = profile.role === 'admin' ? 100 : profile.role === 'user' ? 50 : 25;
      
      return {
        displayName: profile.name,
        roleLevel: profile.role,
        badgeIcon: scoreFromRole >= 80 ? '🏆' : scoreFromRole >= 50 ? '🥉' : '📖',
        canShowBadge: preferences.notifications // 알림을 배지 표시 여부로 사용
      };
    },
    { name: 'userBadge' }
  );
  
  return children;
}

// 다른 컴포넌트에서 계산 스토어 사용
function BadgeDisplay() {
  const userBadgeStore = useComputedStoreInstance.getStore('userBadge');
  const badge = useStoreValue(userBadgeStore);
  
  if (!badge?.canShowBadge) return null;
  
  return (
    <div className="user-badge">
      <span>{badge.badgeIcon}</span>
      <span>{badge.displayName}</span>
      <small>({badge.roleLevel})</small>
    </div>
  );
}
```

### 연쇄 계산

```tsx
import { useUserStore, useProductStore, useUIStore } from '../setup/stores';

function ChainedComputationExample() {
  const sessionStore = useUserStore('session');
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const loadingStore = useUIStore('loading');
  
  // 첫 번째 레벨: 사용자 권한과 필터에 기반한 제품 필터링
  const filteredProductsStore = useComputedStoreInstance(
    [sessionStore, catalogStore, filtersStore],
    ([session, catalog, filters]) => {
      const canViewAllProducts = session.permissions.includes('view_all_products');
      const baseProducts = canViewAllProducts ? catalog : catalog.filter(p => p.isPublic);
      
      return baseProducts.filter(product => {
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesPrice = !filters.priceRange || 
          (product.price >= filters.priceRange.min && product.price <= filters.priceRange.max);
        const matchesSearch = !filters.searchTerm || 
          product.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        return matchesCategory && matchesPrice && matchesSearch;
      });
    },
    { name: 'filteredProducts' }
  );
  
  // 두 번째 레벨: 인사이트를 위한 필터된 제품 분석
  const productAnalysisStore = useComputedStoreInstance(
    [filteredProductsStore, loadingStore],
    ([filteredProducts, loading]) => {
      if (loading.global) {
        return { isAnalyzing: true, insights: null };
      }
      
      const categories = [...new Set(filteredProducts.map(p => p.category))];
      const avgPrice = filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length;
      const priceRanges = {
        budget: filteredProducts.filter(p => p.price < avgPrice * 0.7).length,
        mid: filteredProducts.filter(p => p.price >= avgPrice * 0.7 && p.price <= avgPrice * 1.3).length,
        premium: filteredProducts.filter(p => p.price > avgPrice * 1.3).length
      };
      
      return {
        isAnalyzing: false,
        insights: {
          totalProducts: filteredProducts.length,
          categoriesCount: categories.length,
          averagePrice: avgPrice,
          priceDistribution: priceRanges,
          recommendations: avgPrice > 100 ? ['예산 옵션 고려'] : ['프리미엄 제품 사용 가능']
        }
      };
    },
    { name: 'productAnalysis' }
  );
  
  return { filteredProductsStore, productAnalysisStore };
}

// 연쇄 계산 사용
function ProductInsightsDashboard() {
  const { productAnalysisStore } = ChainedComputationExample();
  const analysis = useStoreValue(productAnalysisStore);
  
  if (analysis.isAnalyzing) {
    return <div>제품 분석 중...</div>;
  }
  
  const { insights } = analysis;
  
  return (
    <div className="product-insights">
      <h3>제품 분석</h3>
      <div>총 제품: {insights.totalProducts}</div>
      <div>카테고리: {insights.categoriesCount}</div>
      <div>평균 가격: ${insights.averagePrice.toFixed(2)}</div>
      <div>가격 분포:</div>
      <ul>
        <li>예산: {insights.priceDistribution.budget}</li>
        <li>중간 가격대: {insights.priceDistribution.mid}</li>
        <li>프리미엄: {insights.priceDistribution.premium}</li>
      </ul>
      <div>추천: {insights.recommendations.join(', ')}</div>
    </div>
  );
}
```

## 비동기 계산 패턴

### 기본 비동기 계산

```tsx
import { useAsyncComputedStore } from '@context-action/react';
import { useUserStore, useUIStore } from '../setup/stores';

function AsyncUserProfileLoader() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const loadingStore = useUIStore('loading');
  
  const userProfileData = useAsyncComputedStore(
    [profileStore, sessionStore],
    async ([profile, session]) => {
      if (!profile.id || !session.isAuthenticated) return null;
      
      const response = await fetch(`/api/users/${profile.id}/detailed`);
      if (!response.ok) {
        throw new Error(`사용자 데이터 로딩 실패: ${response.statusText}`);
      }
      
      const detailedData = await response.json();
      
      return {
        ...profile,
        ...detailedData,
        fullProfile: true,
        loadedAt: new Date().toISOString()
      };
    },
    {
      initialValue: null,
      name: 'userProfileData'
    }
  );
  
  return userProfileData;
}

// 비동기 계산 스토어 사용
function UserProfileDisplay() {
  const { value: user, loading, error, reload } = AsyncUserProfileLoader();
  
  if (loading) return <div className="loading">사용자 프로필 로딩 중...</div>;
  if (error) return (
    <div className="error">
      오류: {error.message}
      <button onClick={reload} className="retry-btn">재시도</button>
    </div>
  );
  if (!user) return <div>사용자 프로필을 사용할 수 없습니다</div>;
  
  return (
    <div className="user-profile-detailed">
      <h2>{user.name}님, 환영합니다!</h2>
      <div>역할: {user.role}</div>
      <div>이메일: {user.email}</div>
      {user.fullProfile && (
        <div className="detailed-info">
          <div>마지막 로그인: {user.lastLogin}</div>
          <div>프로필 로드됨: {user.loadedAt}</div>
          <div>설정: {JSON.stringify(user.additionalSettings)}</div>
        </div>
      )}
    </div>
  );
}
```

### 복잡한 비동기 의존성

```tsx
import { useProductStore, useUserStore, useUIStore } from '../setup/stores';

function AsyncSearchResults() {
  const filtersStore = useProductStore('filters');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  const loadingStore = useUIStore('loading');
  
  const searchResults = useAsyncComputedStore(
    [filtersStore, sessionStore, preferencesStore],
    async ([filters, session, preferences]) => {
      if (!filters.searchTerm?.trim()) return [];
      
      // 사용자 컨텍스트에 기반한 검색 매개변수 구축
      const params = new URLSearchParams({
        q: filters.searchTerm,
        category: filters.category || '',
        minPrice: filters.priceRange?.min?.toString() || '0',
        maxPrice: filters.priceRange?.max?.toString() || '10000',
        sortBy: filters.sortBy || 'relevance',
        language: preferences.language,
        userId: session.isAuthenticated ? session.userId : 'anonymous'
      });
      
      // 사용자 권한 기반 매개변수 추가
      if (session.permissions.includes('view_premium_products')) {
        params.append('includePremium', 'true');
      }
      
      const response = await fetch(`/api/products/search?${params}`);
      if (!response.ok) {
        throw new Error(`검색 실패: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 기본 설정에 기반한 클라이언트 사이드 후처리 적용
      const processedResults = data.results.map(product => ({
        ...product,
        displayPrice: preferences.language === 'ko' ? 
          `₩${product.price.toLocaleString('ko-KR')}` : 
          `$${product.price.toFixed(2)}`,
        isAccessible: session.permissions.includes('view_all_products') || product.isPublic
      }));
      
      return {
        results: processedResults,
        total: data.total,
        searchQuery: filters.searchTerm,
        searchedAt: new Date().toISOString(),
        userContext: {
          language: preferences.language,
          isAuthenticated: session.isAuthenticated,
          hasPermissions: session.permissions.length > 0
        }
      };
    },
    {
      initialValue: { results: [], total: 0, searchQuery: '', searchedAt: null, userContext: null },
      debounce: 300, // 검색 요청 디바운싱
      name: 'searchResults'
    }
  );
  
  return searchResults;
}

// 복잡한 비동기 검색 사용
function ProductSearchResults() {
  const { value: searchData, loading, error, reload } = AsyncSearchResults();
  const filtersStore = useProductStore('filters');
  const currentFilters = useStoreValue(filtersStore);
  
  if (loading) {
    return <div className="search-loading">"{currentFilters.searchTerm}" 검색 중...</div>;
  }
  
  if (error) {
    return (
      <div className="search-error">
        검색 오류: {error.message}
        <button onClick={reload}>다시 시도</button>
      </div>
    );
  }
  
  const { results, total, searchQuery, searchedAt, userContext } = searchData;
  
  if (results.length === 0 && searchQuery) {
    return <div className="no-results">"{searchQuery}"에 대한 결과를 찾을 수 없습니다</div>;
  }
  
  return (
    <div className="search-results">
      <div className="search-meta">
        <div>"{searchQuery}"에 대해 {total}개 결과를 찾았습니다</div>
        <div className="search-context">
          언어: {userContext?.language}, 
          사용자: {userContext?.isAuthenticated ? '인증됨' : '게스트'}
        </div>
        <small>검색 시간: {searchedAt}</small>
      </div>
      
      <div className="results-list">
        {results.map(product => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <div className="price">{product.displayPrice}</div>
            <div className="category">{product.category}</div>
            {!product.isAccessible && <span className="restricted">프리미엄</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 실제 예제

### 전자상거래 카트 계산기

```tsx
import { useComputedStore } from '@context-action/react';
import { useProductStore, useUserStore } from '../setup/stores';

function useAdvancedCartCalculator() {
  const cartStore = useProductStore('cart');
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const cartCalculation = useComputedStore(
    [cartStore, profileStore, sessionStore, preferencesStore],
    ([cart, profile, session, preferences]) => {
      if (!cart.items || cart.items.length === 0) {
        return {
          subtotal: 0,
          discounts: [],
          totalDiscount: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          savings: 0,
          currency: preferences.language === 'ko' ? '₩' : '$',
          breakdown: {
            items: [],
            summary: '빈 카트'
          }
        };
      }
      
      // 소계 계산
      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // 역할 기반 할인 적용
      const discounts = [];
      let totalDiscount = 0;
      
      // 관리자 할인
      if (profile.role === 'admin') {
        const adminDiscount = subtotal * 0.15; // 15% 관리자 할인
        discounts.push({ type: 'admin', amount: adminDiscount, description: '관리자 할인 (15%)' });
        totalDiscount += adminDiscount;
      }
      
      // 세션 기반 할인 (로열티 포인트)
      if (session.permissions.includes('loyalty_member') && subtotal > 100) {
        const loyaltyDiscount = Math.min(subtotal * 0.05, 50); // 최대 $50까지 5%
        discounts.push({ type: 'loyalty', amount: loyaltyDiscount, description: '로열티 멤버 (5%)' });
        totalDiscount += loyaltyDiscount;
      }
      
      // 카트 레벨 할인 적용
      cart.discounts.forEach(discount => {
        const discountAmount = discount.type === 'percentage'
          ? subtotal * (discount.value / 100)
          : discount.value;
        discounts.push({ 
          type: 'promo', 
          amount: discountAmount, 
          description: `프로모: ${discount.code}` 
        });
        totalDiscount += discountAmount;
      });
      
      const afterDiscount = Math.max(0, subtotal - totalDiscount);
      
      // 사용자 역할과 카트 값에 기반한 배송비 계산
      const isEligibleForFreeShipping = 
        profile.role === 'admin' || 
        (session.permissions.includes('premium_member') && afterDiscount > 75) ||
        afterDiscount > 150;
      
      const shippingCost = isEligibleForFreeShipping ? 0 : 15;
      
      // 세금 계산 (단순화)
      const taxRate = preferences.language === 'ko' ? 0.1 : 0.08; // 한국 10%, 미국 8%
      const taxAmount = (afterDiscount + shippingCost) * taxRate;
      
      const total = afterDiscount + shippingCost + taxAmount;
      
      // 통화 포맷팅
      const currency = preferences.language === 'ko' ? '₩' : '$';
      const formatMoney = (amount) => 
        preferences.language === 'ko' 
          ? `${currency}${Math.round(amount).toLocaleString('ko-KR')}`
          : `${currency}${amount.toFixed(2)}`;
      
      return {
        subtotal: formatMoney(subtotal),
        discounts,
        totalDiscount: formatMoney(totalDiscount),
        shipping: formatMoney(shippingCost),
        tax: formatMoney(taxAmount),
        total: formatMoney(total),
        savings: formatMoney(totalDiscount + (shippingCost > 0 ? 0 : 15)),
        currency,
        breakdown: {
          items: cart.items.map(item => ({
            ...item,
            totalPrice: formatMoney(item.price * item.quantity)
          })),
          summary: `${cart.items.length}개 항목, ${discounts.length}개 할인 적용됨`
        },
        eligibleForFreeShipping: isEligibleForFreeShipping,
        userBenefits: {
          roleDiscount: profile.role === 'admin' ? '15% 관리자 할인' : null,
          loyaltyDiscount: session.permissions.includes('loyalty_member') ? '로열티 멤버 혜택' : null,
          freeShipping: isEligibleForFreeShipping ? '무료 배송 적용' : null
        }
      };
    }
  );
  
  return cartCalculation;
}

// 사용 컴포넌트
function CartSummary() {
  const cartData = useAdvancedCartCalculator();
  
  return (
    <div className="cart-summary">
      <h3>카트 요약</h3>
      
      <div className="cart-line">
        <span>소계:</span>
        <span>{cartData.subtotal}</span>
      </div>
      
      {cartData.discounts.map((discount, index) => (
        <div key={index} className="cart-line discount">
          <span>{discount.description}:</span>
          <span>-{cartData.currency}{discount.amount.toFixed(2)}</span>
        </div>
      ))}
      
      <div className="cart-line">
        <span>배송:</span>
        <span>{cartData.shipping}</span>
        {cartData.eligibleForFreeShipping && <small>(무료!)</small>}
      </div>
      
      <div className="cart-line">
        <span>세금:</span>
        <span>{cartData.tax}</span>
      </div>
      
      <div className="cart-line total">
        <strong>
          <span>합계:</span>
          <span>{cartData.total}</span>
        </strong>
      </div>
      
      {cartData.userBenefits && (
        <div className="user-benefits">
          <h4>당신의 혜택:</h4>
          {cartData.userBenefits.roleDiscount && <div>✓ {cartData.userBenefits.roleDiscount}</div>}
          {cartData.userBenefits.loyaltyDiscount && <div>✓ {cartData.userBenefits.loyaltyDiscount}</div>}
          {cartData.userBenefits.freeShipping && <div>✓ {cartData.userBenefits.freeShipping}</div>}
        </div>
      )}
      
      <div className="cart-breakdown">
        <small>{cartData.breakdown.summary}</small>
        <div>총 절약액: {cartData.savings}</div>
      </div>
    </div>
  );
}
```

## 오류 처리

### 안전한 계산

```tsx
import { useUserStore, useProductStore } from '../setup/stores';

function useSafeProductProcessing() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  const sessionStore = useUserStore('session');
  
  const safeProcessedProducts = useComputedStore(
    [catalogStore, filtersStore, sessionStore],
    ([catalog, filters, session]) => {
      try {
        // 잠재적으로 위험한 계산
        const processedProducts = catalog.map(product => {
          if (!product || typeof product.price !== 'number') {
            throw new Error(`유효하지 않은 제품 데이터: ${product?.id}`);
          }
          
          return {
            ...product,
            formattedPrice: product.price.toFixed(2),
            canAccess: session.permissions.includes('view_all_products') || product.isPublic,
            matchesFilter: filters.category ? product.category === filters.category : true
          };
        });
        
        return {
          success: true,
          data: processedProducts,
          error: null,
          processedCount: processedProducts.length
        };
      } catch (error) {
        console.error('제품 처리 오류:', error);
        
        return {
          success: false,
          data: [],
          error: error.message,
          fallbackData: catalog.filter(p => p && typeof p.price === 'number')
        };
      }
    }
  );
  
  return safeProcessedProducts;
}

// 오류 처리가 있는 사용법
function SafeProductList() {
  const processing = useSafeProductProcessing();
  
  if (!processing.success) {
    return (
      <div className="error-container">
        <div className="error-message">
          처리 오류: {processing.error}
        </div>
        {processing.fallbackData?.length > 0 && (
          <div className="fallback-notice">
            {processing.fallbackData.length}개의 기본 제품을 표시합니다
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div>{processing.processedCount}개 제품이 성공적으로 처리되었습니다</div>
      {processing.data.map(product => (
        <div key={product.id}>
          {product.name} - ${product.formattedPrice}
          {!product.canAccess && <span> (제한됨)</span>}
        </div>
      ))}
    </div>
  );
}
```

## 모범 사례

### 1. 계산을 순수하게 유지

```tsx
// ✅ 좋음: 순수 계산
const userStatus = useComputedStore(
  [userStore, activityStore],
  ([user, activity]) => {
    const timeSinceActive = Date.now() - activity.lastSeen;
    return timeSinceActive < 5000 ? 'online' : 'offline';
  }
);

// ❌ 피해야 함: 계산에서 부작용
const userStatus = useComputedStore(
  [userStore],
  ([user]) => {
    updateAnalytics(user); // 부작용!
    return user.status;
  }
);
```

### 2. 적절한 비교 전략 사용

```tsx
// 원시 값에 대해
const simpleComputation = useComputedStore([store], compute, {
  comparison: 'reference' // 기본값, 가장 빠름
});

// 얕은 변경이 있는 객체에 대해
const objectComputation = useComputedStore([store], compute, {
  comparison: 'shallow'
});

// 복잡한 중첩 객체에 대해
const deepComputation = useComputedStore([store], compute, {
  comparison: 'deep' // 가장 철저하지만 느림
});
```

### 3. 비용이 많이 드는 계산 최적화

```tsx
// 비용이 많이 드는 작업에 캐싱 사용
const expensiveResult = useComputedStore(
  [largeDataStore],
  ([data]) => heavyProcessing(data),
  {
    cacheKey: 'heavy-processing',
    comparison: 'shallow'
  }
);
```

## 관련 패턴

- [useStoreValue 패턴](./useStoreValue-patterns.md) - 기본 스토어 구독 패턴
- [useStoreSelector 패턴](./useStoreSelector-patterns.md) - 다중 스토어 선택
- [성능 패턴](./performance-patterns.md) - 성능 최적화 기법