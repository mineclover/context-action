# useStoreValue 패턴

선택적 업데이트, 조건부 구독, 비교 전략을 통한 스토어 변경 구독을 위한 핵심 `useStoreValue` 패턴.

## 사전 요구사항

이 가이드는 [기본 스토어 설정](../setup/basic-store-setup.md) 가이드의 스토어 컨텍스트를 사용합니다.

### 필수 스토어 설정

```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

// 사용자 도메인 스토어
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  }
});

// 제품 도메인 스토어
const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = createDeclarativeStorePattern('Product', {
  catalog: [] as Product[],
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const
  },
  filters: {
    initialValue: { category: '', priceRange: null, searchTerm: '' },
    strategy: 'shallow' as const
  }
});
```

## 가져오기
```typescript
import { useStoreValue } from '@context-action/react';
```

## 기본 스토어 구독

```tsx
function UserProfile() {
  // 컨텍스트에서 스토어 인스턴스 가져오기
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 전체 스토어 값에 간단한 구독
  const profile = useStoreValue(profileStore);
  
  // 특정 필드만 구독
  const userName = useStoreValue(profileStore, user => user.name);
  const userTheme = useStoreValue(preferencesStore, prefs => prefs.theme);
  
  return (
    <div>
      <h1>{userName}</h1>
      <p>이메일: {profile.email}</p>
      <p>테마: {userTheme}</p>
    </div>
  );
}
```

## 선택적 구독

### 필드 선택

```tsx
function UserBasicInfo() {
  const profileStore = useUserStore('profile');
  
  // 이름이 변경될 때만 재렌더링, 이메일/id/role 변경 무시
  const userName = useStoreValue(profileStore, user => user.name);
  
  // 여러 필드 선택
  const userBasicInfo = useStoreValue(profileStore, user => ({
    name: user.name,
    email: user.email
  }));
  
  return (
    <div>
      <h2>{userName}</h2>
      <p>{userBasicInfo.email}</p>
    </div>
  );
}
```

### 깊은 속성 접근

```tsx
function ProductFilters() {
  const filtersStore = useProductStore('filters');
  const cartStore = useProductStore('cart');
  
  // 제품 스토어에서 중첩 속성 접근
  const currentCategory = useStoreValue(filtersStore, filters => filters.category);
  const priceRange = useStoreValue(filtersStore, filters => filters.priceRange);
  const cartTotal = useStoreValue(cartStore, cart => cart.total);
  const itemCount = useStoreValue(cartStore, cart => cart.items.length);
  
  return (
    <div>
      <p>카테고리: {currentCategory}</p>
      <p>가격 범위: {priceRange ? `$${priceRange.min} - $${priceRange.max}` : '전체'}</p>
      <p>카트: {itemCount}개 항목, 합계: ${cartTotal}</p>
    </div>
  );
}
```

## 조건부 구독

### 동적 구독 제어

```tsx
function ConditionalSubscriptions() {
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(true);
  
  // 활성화된 경우에만 구독
  const lastActivity = useStoreValue(
    subscribeToUpdates ? sessionStore : null,
    session => session?.lastActivity
  );
  
  // 사용자 기본 설정에 기반한 구독 토글  
  const notificationsEnabled = useStoreValue(preferencesStore, prefs => prefs.notifications);
  const sessionData = useStoreValue(
    notificationsEnabled ? sessionStore : null,
    session => session?.permissions
  );
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={subscribeToUpdates}
          onChange={e => setSubscribeToUpdates(e.target.checked)}
        />
        업데이트 구독
      </label>
      {lastActivity && <p>마지막 활동: {new Date(lastActivity).toLocaleString()}</p>}
      {sessionData && <p>권한: {sessionData.length}</p>}
    </div>
  );
}
```

### 권한 기반 구독

```tsx
function useProtectedStoreValue<T>(store: any, selector: any, requiredRole: string) {
  const profileStore = useUserStore('profile');
  const userRole = useStoreValue(profileStore, user => user.role);
  const hasPermission = userRole === requiredRole || userRole === 'admin';
  
  return useStoreValue(
    hasPermission ? store : null,
    selector
  );
}

function AdminPanel() {
  const cartStore = useProductStore('cart');
  
  // 관리자와 관리자 권한을 가진 사용자만 민감한 카트 데이터를 볼 수 있음
  const cartDiscounts = useProtectedStoreValue(
    cartStore,
    cart => cart.discounts,
    'admin'
  );
  
  return (
    <div>
      {cartDiscounts ? (
        <div>
          <h3>관리자: 카트 할인</h3>
          <pre>{JSON.stringify(cartDiscounts, null, 2)}</pre>
        </div>
      ) : (
        <p>접근 거부</p>
      )}
    </div>
  );
}
```

## 비교 전략

### 참조 비교 (기본)

```tsx
function ReferenceComparison() {
  const profileStore = useUserStore('profile');
  
  // 빠른 참조 비교 - 참조가 변경된 경우에만 업데이트
  const profile = useStoreValue(profileStore, undefined, {
    comparison: 'reference'
  });
  
  return <div>사용자: {profile.name}</div>;
}
```

### 얕은 비교

```tsx
function ShallowComparison() {
  const preferencesStore = useUserStore('preferences');
  
  // 최상위 속성이 변경된 경우에만 재렌더링
  const preferences = useStoreValue(preferencesStore, undefined, { 
    comparison: 'shallow' 
  });
  
  return (
    <div>
      <p>테마: {preferences.theme}</p>
      <p>언어: {preferences.language}</p>
      <p>알림: {preferences.notifications ? '켜짐' : '꺼짐'}</p>
    </div>
  );
}
```

### 깊은 비교

```tsx
function DeepComparison() {
  const cartStore = useProductStore('cart');
  
  // 가장 철저하지만 비용이 많이 듦 - 드물게 사용
  const cart = useStoreValue(cartStore, undefined, {
    comparison: 'deep'
  });
  
  return (
    <div>
      <p>항목: {cart.items.length}</p>
      <p>합계: ${cart.total}</p>
    </div>
  );
}
```

### 커스텀 비교

```tsx
function CustomComparison() {
  const profileStore = useUserStore('profile');
  
  const userData = useStoreValue(profileStore, user => user, {
    customComparator: (prev, next) => {
      // 이름이나 이메일이 변경된 경우에만 업데이트, 다른 필드 무시
      return prev.name === next.name && prev.email === next.email;
    }
  });
  
  return (
    <div>
      <h2>{userData.name}</h2>
      <p>{userData.email}</p>
    </div>
  );
}
```

## 변환 패턴

### 데이터 포맷팅

```tsx
function FormattedUserDisplay() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const formattedUser = useStoreValue(profileStore, user => ({
    displayName: user.name || '알 수 없는 사용자',
    initials: user.name ? user.name.split(' ').map(n => n[0]).join('') : '??',
    roleDisplay: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    status: user.id ? '활성' : '비활성'
  }));
  
  const lastActivity = useStoreValue(sessionStore, session => 
    session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : '없음'
  );
  
  return (
    <div>
      <h2>{formattedUser.displayName} ({formattedUser.initials})</h2>
      <p>역할: {formattedUser.roleDisplay}</p>
      <p>상태: {formattedUser.status}</p>
      <p>마지막 활동: {lastActivity}</p>
    </div>
  );
}
```

### 계산된 속성

```tsx
function UserStats() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const userStats = useStoreValue(profileStore, user => {
    const hasPermissions = user.role === 'admin' || user.role === 'user';
    
    return {
      ...user,
      hasFullAccess: hasPermissions,
      isGuestUser: user.role === 'guest',
      canModifyData: user.role === 'admin'
    };
  });
  
  const sessionStats = useStoreValue(sessionStore, session => ({
    isAuthenticated: session.isAuthenticated,
    permissionCount: session.permissions.length,
    hasRecentActivity: Date.now() - session.lastActivity < 30 * 60 * 1000 // 30분
  }));
  
  return (
    <div>
      <h3>사용자 통계</h3>
      <p>전체 접근: {userStats.hasFullAccess ? '예' : '아니오'}</p>
      <p>수정 가능: {userStats.canModifyData ? '예' : '아니오'}</p>
      <p>권한: {sessionStats.permissionCount}</p>
      <p>최근 활동: {sessionStats.hasRecentActivity ? '예' : '아니오'}</p>
    </div>
  );
}
```

### 배열 필터링 및 매핑

```tsx
function ProductCatalogSummary() {
  const catalogStore = useProductStore('catalog');
  const cartStore = useProductStore('cart');
  
  const availableProducts = useStoreValue(catalogStore, products => 
    products.filter(product => product.inStock)
  );
  
  const productNames = useStoreValue(catalogStore, products =>
    products.map(product => product.name)
  );
  
  const cartItemsByCategory = useStoreValue(cartStore, cart =>
    cart.items.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, any[]>)
  );
  
  return (
    <div>
      <h3>카탈로그 요약</h3>
      <p>사용 가능한 제품: {availableProducts.length}</p>
      <p>총 제품: {productNames.length}</p>
      <div>
        <h4>카테고리별 카트:</h4>
        {Object.entries(cartItemsByCategory).map(([category, items]) => (
          <p key={category}>{category}: {items.length}개 항목</p>
        ))}
      </div>
    </div>
  );
}
```

## 성능 최적화

### 디바운싱된 업데이트

```tsx
import { useState } from 'react';

function DebouncedSearch() {
  const filtersStore = useProductStore('filters');
  
  // 빠른 검색어 변경을 디바운싱
  const debouncedSearchTerm = useStoreValue(filtersStore, filters => filters.searchTerm, {
    debounce: 300  // 마지막 변경 후 300ms 대기
  });
  
  // 입력 값을 위한 즉시 접근 (디바운싱 없음)
  const currentSearchTerm = useStoreValue(filtersStore, filters => filters.searchTerm);
  
  return (
    <div>
      <input 
        value={currentSearchTerm}
        onChange={e => filtersStore.update(prev => ({ ...prev, searchTerm: e.target.value }))}
        placeholder="제품 검색..."
      />
      <p>검색 중: "{debouncedSearchTerm}"</p>
    </div>
  );
}
```

### 메모이제이션된 셀렉터

```tsx
import { useCallback } from 'react';

function OptimizedUserDisplay() {
  const profileStore = useUserStore('profile');
  const cartStore = useProductStore('cart');
  
  // 안정된 셀렉터로 불필요한 재렌더링 방지
  const userName = useStoreValue(profileStore, useCallback(
    user => user.name,
    [] // 의존성 없음
  ));
  
  // 안정된 참조를 가진 복잡한 셀렉터
  const cartSummary = useStoreValue(cartStore, useCallback(
    cart => ({
      total: cart.items.length,
      totalPrice: cart.total,
      hasItems: cart.items.length > 0,
      averageItemPrice: cart.items.length > 0 
        ? cart.total / cart.items.length
        : 0
    }),
    []
  ));
  
  return (
    <div>
      <h2>{userName}님, 환영합니다</h2>
      <div>
        <p>카트 항목: {cartSummary.total}</p>
        <p>총 가격: ${cartSummary.totalPrice}</p>
        <p>평균 가격: ${cartSummary.averageItemPrice.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

## 오류 처리

### 안전한 속성 접근

```tsx
function SafeUserDisplay() {
  const profileStore = useUserStore('profile');
  
  const safeUserData = useStoreValue(profileStore, user => {
    try {
      return {
        name: user?.name || '알 수 없는 사용자',
        email: user?.email || '이메일이 제공되지 않음',
        role: user?.role || 'guest',
        hasValidData: Boolean(user?.id)
      };
    } catch (error) {
      console.error('사용자 데이터 접근 오류:', error);
      return { 
        name: '오류', 
        email: '로딩 오류', 
        role: 'guest',
        hasValidData: false 
      };
    }
  });
  
  return (
    <div>
      <h2>{safeUserData.name}</h2>
      <p>이메일: {safeUserData.email}</p>
      <p>역할: {safeUserData.role}</p>
      {!safeUserData.hasValidData && <p>⚠️ 사용자 데이터가 완전히 로드되지 않았습니다</p>}
    </div>
  );
}
```

### 폴백 값

```tsx
function UserDisplayWithFallbacks() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const userDisplayName = useStoreValue(
    profileStore, 
    user => user?.name || user?.email || '게스트 사용자'
  );
  
  const userSettings = useStoreValue(preferencesStore, preferences => ({
    theme: preferences?.theme || 'light',
    language: preferences?.language || 'en',
    notifications: preferences?.notifications ?? true
  }));
  
  return (
    <div>
      <h2>{userDisplayName}</h2>
      <p>테마: {userSettings.theme}</p>
      <p>언어: {userSettings.language}</p>
      <p>알림: {userSettings.notifications ? '켜짐' : '꺼짐'}</p>
    </div>
  );
}
```

### null 스토어 처리

```tsx
function ConditionalStoreAccess() {
  const [shouldLoadCart, setShouldLoadCart] = useState(false);
  const cartStore = useProductStore('cart');
  
  const conditionalCartData = useStoreValue(
    shouldLoadCart ? cartStore : null,
    cart => cart ? {
      itemCount: cart.items.length,
      total: cart.total,
      hasDiscounts: cart.discounts.length > 0
    } : null
  );
  
  return (
    <div>
      <label>
        <input 
          type="checkbox"
          checked={shouldLoadCart}
          onChange={e => setShouldLoadCart(e.target.checked)}
        />
        카트 데이터 로드
      </label>
      
      {conditionalCartData ? (
        <div>
          <p>항목: {conditionalCartData.itemCount}</p>
          <p>합계: ${conditionalCartData.total}</p>
          <p>할인 있음: {conditionalCartData.hasDiscounts ? '예' : '아니오'}</p>
        </div>
      ) : (
        <p>카트 데이터가 로드되지 않았습니다</p>
      )}
    </div>
  );
}
```

## 실제 예제

### 사용자 프로필 표시

```tsx
function UserProfile() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  const preferencesStore = useUserStore('preferences');
  
  const userInfo = useStoreValue(profileStore, user => ({
    name: user.name || '익명 사용자',
    email: user.email,
    role: user.role,
    hasProfile: Boolean(user.id)
  }));
  
  const sessionInfo = useStoreValue(sessionStore, session => ({
    isOnline: Date.now() - session.lastActivity < 5 * 60 * 1000, // 5분
    isAuthenticated: session.isAuthenticated,
    lastActivity: new Date(session.lastActivity).toLocaleDateString()
  }));
  
  const theme = useStoreValue(preferencesStore, prefs => prefs.theme);
  
  return (
    <div className={`user-profile theme-${theme}`}>
      <div className="avatar-placeholder">
        {userInfo.name.charAt(0).toUpperCase()}
      </div>
      <h2>{userInfo.name}</h2>
      <p>{userInfo.email}</p>
      <div className={`status ${sessionInfo.isOnline ? 'online' : 'offline'}`}>
        {sessionInfo.isOnline ? '온라인' : '오프라인'}
      </div>
      <p>역할: {userInfo.role}</p>
      <small>마지막 활동: {sessionInfo.lastActivity}</small>
    </div>
  );
}
```

### 쇼핑 카트 배지

```tsx
function CartBadge() {
  const cartStore = useProductStore('cart');
  
  const cartInfo = useStoreValue(cartStore, cart => ({
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    hasItems: cart.items.length > 0,
    total: cart.total,
    discountCount: cart.discounts.length
  }));
  
  if (!cartInfo.hasItems) {
    return (
      <div className="cart-badge empty">
        <span className="cart-icon">🛒</span>
      </div>
    );
  }
  
  return (
    <div className="cart-badge">
      <span className="cart-icon">🛒</span>
      <span className="badge">{cartInfo.itemCount}</span>
      <span className="total">${cartInfo.total.toFixed(2)}</span>
      {cartInfo.discountCount > 0 && (
        <span className="discount">-{cartInfo.discountCount}</span>
      )}
    </div>
  );
}
```

### 제품 검색 결과

```tsx
function ProductSearchResults() {
  const catalogStore = useProductStore('catalog');
  const filtersStore = useProductStore('filters');
  
  const searchState = useStoreValue(filtersStore, filters => ({
    query: filters.searchTerm,
    category: filters.category,
    priceRange: filters.priceRange
  }));
  
  const searchResults = useStoreValue(catalogStore, products => 
    products.filter(product => {
      const matchesSearch = !searchState.query || 
        product.name.toLowerCase().includes(searchState.query.toLowerCase());
      const matchesCategory = !searchState.category || 
        product.category === searchState.category;
      const matchesPrice = !searchState.priceRange || 
        (product.price >= searchState.priceRange.min && product.price <= searchState.priceRange.max);
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
  );
  
  // 더 나은 성능을 위해 검색 쿼리 업데이트를 디바운싱
  const debouncedQuery = useStoreValue(filtersStore, filters => filters.searchTerm, {
    debounce: 300
  });
  
  if (!searchState.query && !searchState.category && !searchState.priceRange) {
    return <div>제품을 찾기 위해 검색 조건을 입력하세요</div>;
  }
  
  return (
    <div>
      <h3>
        검색 결과
        {debouncedQuery && ` "${debouncedQuery}"`}
        ({searchResults.length}개 발견)
      </h3>
      
      {searchState.category && <p>카테고리: {searchState.category}</p>}
      {searchState.priceRange && (
        <p>가격: ${searchState.priceRange.min} - ${searchState.priceRange.max}</p>
      )}
      
      {searchResults.length === 0 ? (
        <p>검색 조건에 일치하는 제품을 찾을 수 없습니다</p>
      ) : (
        <div className="results">
          {searchResults.map(product => (
            <div key={product.id} className="product-item">
              <h4>{product.name}</h4>
              <p>${product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 모범 사례

### 1. 특정 셀렉터 사용

```tsx
function UserDisplay() {
  const profileStore = useUserStore('profile');
  
  // ✅ 좋음: 필요한 것만 선택
  const userName = useStoreValue(profileStore, user => user.name);
  
  // ❌ 피해야 함: 이름만 필요할 때 전체 스토어에 구독
  // const user = useStoreValue(profileStore);
  // return <div>{user.name}</div>;
  
  return <div>{userName}</div>;
}
```

### 2. 복잡한 셀렉터 메모이제이션

```tsx
function OptimizedCartSummary() {
  const cartStore = useProductStore('cart');
  
  // ✅ 좋음: 메모이제이션된 셀렉터
  const processedCart = useStoreValue(cartStore, useCallback(
    cart => ({
      total: cart.items.length,
      totalValue: cart.total,
      hasExpensiveItems: cart.items.some(item => item.price > 100),
      categoryBreakdown: cart.items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    }),
    []
  ));
  
  // ❌ 피해야 함: 매 렌더링마다 새로운 함수
  // const processedCart = useStoreValue(cartStore, cart => expensiveProcessing(cart));
  
  return (
    <div>
      <p>항목: {processedCart.total}</p>
      <p>값: ${processedCart.totalValue}</p>
      <p>비싼 항목 있음: {processedCart.hasExpensiveItems ? '예' : '아니오'}</p>
    </div>
  );
}
```

### 3. 경계 케이스 처리

```tsx
function SafeUserDisplay() {
  const profileStore = useUserStore('profile');
  
  // ✅ 좋음: 안전한 속성 접근
  const userName = useStoreValue(profileStore, user => user?.name || '게스트');
  
  // ❌ 피해야 함: 속성이 존재한다고 가정
  // const userName = useStoreValue(profileStore, user => user.name);
  
  return <div>{userName}님, 환영합니다</div>;
}
```

### 4. 적절한 비교 전략 선택

```tsx
function ComparisonExamples() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  const cartStore = useProductStore('cart');
  
  // 간단한 객체에는 - 참조 사용 (기본)
  const userId = useStoreValue(profileStore, user => user.id);
  
  // 얕은 변경이 있는 객체에는 - 얕은 사용
  const preferences = useStoreValue(preferencesStore, undefined, { comparison: 'shallow' });
  
  // 깊게 중첩된 객체에는 - 깊은 사용을 드물게
  const cartData = useStoreValue(cartStore, undefined, { comparison: 'deep' });
  
  return (
    <div>
      <p>사용자 ID: {userId}</p>
      <p>테마: {preferences.theme}</p>
      <p>카트 항목: {cartData.items.length}</p>
    </div>
  );
}
```

## 프로바이더 설정

이러한 패턴을 사용하려면 필요한 스토어 프로바이더로 컴포넌트를 래핑하세요:

```tsx
import { 
  UserStoreProvider,
  ProductStoreProvider 
} from '../stores';

function App() {
  return (
    <UserStoreProvider>
      <ProductStoreProvider>
        <UserProfile />
        <CartBadge />
        <ProductSearchResults />
      </ProductStoreProvider>
    </UserStoreProvider>
  );
}
```

## 관련 패턴

- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 스토어 컨텍스트 설정 패턴
- **[useStoreSelector 패턴](./useStoreSelector-patterns.md)** - 다중 스토어 선택 패턴
- **[useComputedStore 패턴](./useComputedStore-patterns.md)** - 계산된 값 패턴
- **[성능 패턴](./performance-patterns.md)** - 성능 최적화 기법
- **[useStoreManager API](./useStoreManager-api.md)** - 저레벨 스토어 관리