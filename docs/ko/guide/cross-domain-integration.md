# 크로스 도메인 통합

크로스 도메인 통합은 Context-Action 프레임워크에서 서로 다른 도메인 간의 안전하고 효율적인 상호작용을 구현하는 고급 패턴입니다. 이 가이드는 도메인 경계를 넘나드는 복잡한 비즈니스 로직을 구현하는 방법을 다룹니다.

## 크로스 도메인 기본 개념

### 도메인 경계와 통합 필요성

```typescript
// 독립적인 도메인들
interface UserDomain {
  profile: UserProfile;
  session: UserSession;
  preferences: UserPreferences;
}

interface CartDomain {
  items: CartItem[];
  totals: CartTotals;
  discounts: CartDiscount[];
}

interface OrderDomain {
  orders: Order[];
  history: OrderHistory[];
  tracking: OrderTracking;
}

// 크로스 도메인이 필요한 시나리오
// 1. 결제 프로세스: User + Cart + Order
// 2. 사용자 추천: User + Product + Cart
// 3. 알림 시스템: 모든 도메인의 이벤트
```

### 통합 접근 방식

Context-Action에서는 세 가지 주요 크로스 도메인 패턴을 제공합니다:

1. **직접 접근**: 여러 도메인의 훅을 직접 사용
2. **통합 훅**: 크로스 도메인 비즈니스 로직을 캡슐화
3. **이벤트 기반**: 도메인 간 이벤트 발행/구독

## 직접 접근 패턴

### 기본 크로스 도메인 접근

```typescript
function CheckoutComponent() {
  // 여러 도메인의 상태 구독
  const profile = useStoreValue(useUserStore('profile'));
  const cartItems = useStoreValue(useCartStore('items'));
  const cartTotals = useStoreValue(useCartStore('totals'));
  
  // 여러 도메인의 액션 접근
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  
  const handleCheckout = useCallback(async () => {
    // 크로스 도메인 비즈니스 로직
    try {
      // 1. 사용자 인증 확인
      if (!profile.id) {
        await userAction('requireLogin', {});
        return;
      }
      
      // 2. 장바구니 검증
      if (cartItems.length === 0) {
        throw new Error('장바구니가 비어있습니다');
      }
      
      // 3. 주문 생성
      const order = await orderAction('createOrder', {
        userId: profile.id,
        items: cartItems,
        totals: cartTotals
      });
      
      // 4. 결제 처리
      const payment = await orderAction('processPayment', {
        orderId: order.id,
        amount: cartTotals.finalAmount,
        userId: profile.id
      });
      
      // 5. 장바구니 정리
      if (payment.success) {
        await cartAction('clearCart', {});
      }
      
    } catch (error) {
      console.error('결제 처리 실패:', error);
    }
  }, [profile, cartItems, cartTotals, userAction, cartAction, orderAction]);
  
  return (
    <button onClick={handleCheckout} disabled={!profile.id || cartItems.length === 0}>
      결제하기
    </button>
  );
}
```

### 제한적 크로스 도메인 접근

```typescript
// 필요한 경우에만 제한적으로 크로스 도메인 접근
function UserCartSummary() {
  const profile = useStoreValue(useUserStore('profile'));
  
  // 로그인된 사용자만 장바구니 정보 접근
  const cartItems = useStoreValue(
    useCartStore('items'),
    profile.id ? undefined : () => [] // 비로그인시 빈 배열
  );
  
  if (!profile.id) {
    return <div>로그인 후 장바구니를 확인하세요</div>;
  }
  
  return (
    <div>
      <h3>{profile.name}님의 장바구니</h3>
      <p>상품 {cartItems.length}개</p>
    </div>
  );
}
```

## 통합 훅 패턴

### 1. 복합 비즈니스 로직 훅

```typescript
// 결제 프로세스를 위한 통합 훅
export function useCheckoutProcess() {
  // 다중 도메인 접근
  const profile = useStoreValue(useUserStore('profile'));
  const session = useStoreValue(useUserStore('session'));
  const cartItems = useStoreValue(useCartStore('items'));
  const cartTotals = useStoreValue(useCartStore('totals'));
  
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 결제 가능 여부 계산
  const canCheckout = useMemo(() => {
    return (
      session.isLoggedIn &&
      profile.id &&
      cartItems.length > 0 &&
      cartTotals.finalAmount > 0
    );
  }, [session.isLoggedIn, profile.id, cartItems.length, cartTotals.finalAmount]);
  
  // 결제 프로세스 실행
  const processCheckout = useCallback(async (paymentMethod: PaymentMethod) => {
    if (!canCheckout) {
      setError('결제 조건을 만족하지 않습니다');
      return { success: false };
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. 주문 생성
      const orderResult = await orderAction('createOrder', {
        userId: profile.id,
        items: cartItems,
        totals: cartTotals,
        timestamp: Date.now()
      });
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || '주문 생성 실패');
      }
      
      // 2. 결제 처리
      const paymentResult = await orderAction('processPayment', {
        orderId: orderResult.order.id,
        amount: cartTotals.finalAmount,
        paymentMethod,
        userId: profile.id
      });
      
      if (!paymentResult.success) {
        // 주문 취소
        await orderAction('cancelOrder', { orderId: orderResult.order.id });
        throw new Error(paymentResult.error || '결제 처리 실패');
      }
      
      // 3. 장바구니 정리
      await cartAction('clearCart', {});
      
      // 4. 사용자 통계 업데이트
      await userAction('updatePurchaseStats', {
        orderId: orderResult.order.id,
        amount: cartTotals.finalAmount
      });
      
      return {
        success: true,
        order: orderResult.order,
        payment: paymentResult.payment
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '결제 처리 중 오류 발생';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, [canCheckout, profile.id, cartItems, cartTotals, userAction, cartAction, orderAction]);
  
  // 빠른 재주문
  const reorder = useCallback(async (orderId: string) => {
    try {
      // 1. 기존 주문 정보 조회
      const orderResult = await orderAction('getOrder', { orderId });
      if (!orderResult.success) {
        throw new Error('주문 정보를 찾을 수 없습니다');
      }
      
      // 2. 장바구니에 상품 추가
      for (const item of orderResult.order.items) {
        await cartAction('addItem', {
          productId: item.productId,
          quantity: item.quantity
        });
      }
      
      return { success: true };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '재주문 처리 실패';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [cartAction, orderAction]);
  
  return {
    // 상태
    canCheckout,
    isProcessing,
    error,
    
    // 데이터
    profile,
    cartItems,
    cartTotals,
    
    // 액션
    processCheckout,
    reorder,
    clearError: () => setError(null)
  };
}

// 사용법
function CheckoutPage() {
  const {
    canCheckout,
    isProcessing,
    error,
    cartItems,
    cartTotals,
    processCheckout,
    clearError
  } = useCheckoutProcess();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  
  const handleCheckout = useCallback(async () => {
    const result = await processCheckout(selectedPaymentMethod);
    if (result.success) {
      // 성공 페이지로 이동
      navigate(`/order-success/${result.order.id}`);
    }
  }, [processCheckout, selectedPaymentMethod]);
  
  return (
    <div>
      <h2>결제</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}
      
      <div className="cart-summary">
        <h3>주문 요약</h3>
        {cartItems.map(item => (
          <div key={item.id}>
            {item.name} × {item.quantity} = {item.total}
          </div>
        ))}
        <div className="total">총액: {cartTotals.finalAmount}</div>
      </div>
      
      <PaymentMethodSelector 
        value={selectedPaymentMethod}
        onChange={setSelectedPaymentMethod}
      />
      
      <button 
        onClick={handleCheckout}
        disabled={!canCheckout || isProcessing}
      >
        {isProcessing ? '처리 중...' : '결제하기'}
      </button>
    </div>
  );
}
```

### 2. 데이터 집계 훅

```typescript
// 여러 도메인의 데이터를 집계하는 훅
export function useUserDashboardData() {
  // 다중 도메인 데이터 구독
  const profile = useStoreValue(useUserStore('profile'));
  const preferences = useStoreValue(useUserStore('preferences'));
  const cartItems = useStoreValue(useCartStore('items'));
  const recentOrders = useStoreValue(useOrderStore('recentOrders'));
  const notifications = useStoreValue(useNotificationStore('unread'));
  
  // 대시보드 요약 데이터 계산
  const dashboardSummary = useMemo(() => {
    const cartValue = cartItems.reduce((sum, item) => sum + item.total, 0);
    const totalOrders = recentOrders.length;
    const unreadCount = notifications.length;
    
    const recentOrdersValue = recentOrders
      .slice(0, 5)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    return {
      user: {
        name: profile.name,
        email: profile.email,
        memberSince: profile.createdAt,
        theme: preferences.theme
      },
      cart: {
        itemCount: cartItems.length,
        totalValue: cartValue,
        hasItems: cartItems.length > 0
      },
      orders: {
        totalCount: totalOrders,
        recentValue: recentOrdersValue,
        lastOrderDate: recentOrders[0]?.createdAt
      },
      notifications: {
        unreadCount,
        hasUnread: unreadCount > 0
      },
      summary: {
        completionRate: calculateProfileCompletion(profile),
        activityScore: calculateActivityScore(recentOrders, cartItems),
        loyaltyTier: calculateLoyaltyTier(recentOrders)
      }
    };
  }, [profile, preferences, cartItems, recentOrders, notifications]);
  
  return dashboardSummary;
}

// 보조 계산 함수들
function calculateProfileCompletion(profile: UserProfile): number {
  const fields = ['name', 'email', 'avatar', 'phone', 'address'];
  const completed = fields.filter(field => profile[field]).length;
  return Math.round((completed / fields.length) * 100);
}

function calculateActivityScore(orders: Order[], cartItems: CartItem[]): number {
  const orderScore = orders.length * 10;
  const cartScore = cartItems.length * 2;
  return Math.min(orderScore + cartScore, 100);
}

function calculateLoyaltyTier(orders: Order[]): 'bronze' | 'silver' | 'gold' | 'platinum' {
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  if (totalSpent >= 1000000) return 'platinum';
  if (totalSpent >= 500000) return 'gold';
  if (totalSpent >= 200000) return 'silver';
  return 'bronze';
}

// 사용법
function UserDashboard() {
  const dashboardData = useUserDashboardData();
  
  return (
    <div className={`dashboard theme-${dashboardData.user.theme}`}>
      <header>
        <h1>안녕하세요, {dashboardData.user.name}님!</h1>
        <div className="loyalty-badge">
          {dashboardData.summary.loyaltyTier.toUpperCase()} 회원
        </div>
      </header>
      
      <div className="dashboard-grid">
        <div className="profile-card">
          <h3>프로필 완성도</h3>
          <div className="progress-bar">
            <div 
              className="progress"
              style={{ width: `${dashboardData.summary.completionRate}%` }}
            />
          </div>
          <span>{dashboardData.summary.completionRate}% 완료</span>
        </div>
        
        <div className="cart-card">
          <h3>장바구니</h3>
          <p>{dashboardData.cart.itemCount}개 상품</p>
          <p>총 {dashboardData.cart.totalValue.toLocaleString()}원</p>
        </div>
        
        <div className="orders-card">
          <h3>주문 내역</h3>
          <p>총 {dashboardData.orders.totalCount}회 주문</p>
          <p>최근 주문: {dashboardData.orders.recentValue.toLocaleString()}원</p>
        </div>
        
        <div className="notifications-card">
          <h3>알림</h3>
          <p>
            {dashboardData.notifications.hasUnread 
              ? `${dashboardData.notifications.unreadCount}개의 새 알림`
              : '새 알림 없음'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
```

## 이벤트 기반 통합

### 1. 도메인 이벤트 시스템

```typescript
// 도메인 이벤트 타입 정의
interface DomainEvents {
  // 사용자 도메인 이벤트
  'user.login': { userId: string; timestamp: number };
  'user.logout': { userId: string; timestamp: number };
  'user.profile.updated': { userId: string; changes: Partial<UserProfile> };
  
  // 장바구니 도메인 이벤트
  'cart.item.added': { userId: string; productId: string; quantity: number };
  'cart.item.removed': { userId: string; productId: string };
  'cart.cleared': { userId: string; timestamp: number };
  
  // 주문 도메인 이벤트
  'order.created': { orderId: string; userId: string; amount: number };
  'order.paid': { orderId: string; paymentId: string };
  'order.shipped': { orderId: string; trackingNumber: string };
}

// 이벤트 발행/구독 시스템
class DomainEventBus {
  private listeners = new Map<keyof DomainEvents, Function[]>();
  
  subscribe<T extends keyof DomainEvents>(
    event: T, 
    handler: (payload: DomainEvents[T]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(handler);
    
    // 구독 해제 함수 반환
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  publish<T extends keyof DomainEvents>(event: T, payload: DomainEvents[T]) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

// 전역 이벤트 버스
export const domainEventBus = new DomainEventBus();

// 이벤트 기반 핸들러
function useEventBasedIntegration() {
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  const notificationAction = useNotificationAction();
  
  useEffect(() => {
    // 사용자 로그인 시 장바구니 동기화
    const unsubscribeLogin = domainEventBus.subscribe('user.login', async ({ userId }) => {
      await cartAction('syncFromServer', { userId });
    });
    
    // 장바구니 아이템 추가 시 추천 시스템 업데이트
    const unsubscribeCartAdd = domainEventBus.subscribe('cart.item.added', async ({ userId, productId }) => {
      // 추천 시스템에 사용자 행동 기록
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'cart-add', productId })
      });
    });
    
    // 주문 생성 시 알림 발송
    const unsubscribeOrderCreated = domainEventBus.subscribe('order.created', async ({ orderId, userId }) => {
      await notificationAction('sendOrderConfirmation', { orderId, userId });
    });
    
    // 주문 배송 시 알림 발송
    const unsubscribeOrderShipped = domainEventBus.subscribe('order.shipped', async ({ orderId, trackingNumber }) => {
      await notificationAction('sendShippingNotification', { orderId, trackingNumber });
    });
    
    return () => {
      unsubscribeLogin();
      unsubscribeCartAdd();
      unsubscribeOrderCreated();
      unsubscribeOrderShipped();
    };
  }, [cartAction, orderAction, notificationAction]);
}
```

### 2. 이벤트 발행 핸들러

```typescript
// 이벤트를 발행하는 핸들러 패턴
function useUserHandlersWithEvents() {
  const register = useUserActionRegister();
  const registry = useUserStores();
  
  const loginHandler = useCallback(async (payload, controller) => {
    const sessionStore = registry.getStore('session');
    const profileStore = registry.getStore('profile');
    
    try {
      // 로그인 로직
      const loginResult = await performLogin(payload);
      
      sessionStore.setValue({
        isLoggedIn: true,
        token: loginResult.token,
        expiresAt: Date.now() + (loginResult.expiresIn * 1000)
      });
      
      profileStore.setValue(loginResult.user);
      
      // 로그인 이벤트 발행
      domainEventBus.publish('user.login', {
        userId: loginResult.user.id,
        timestamp: Date.now()
      });
      
      return { success: true, user: loginResult.user };
      
    } catch (error) {
      controller.abort('로그인 실패', error);
      return { success: false, error: 'LOGIN_FAILED' };
    }
  }, [registry]);
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    try {
      const updatedProfile = { ...currentProfile, ...payload.data };
      profileStore.setValue(updatedProfile);
      
      // 프로필 업데이트 이벤트 발행
      domainEventBus.publish('user.profile.updated', {
        userId: currentProfile.id,
        changes: payload.data
      });
      
      return { success: true, profile: updatedProfile };
      
    } catch (error) {
      controller.abort('프로필 업데이트 실패', error);
      return { success: false, error: 'UPDATE_FAILED' };
    }
  }, [registry]);
  
  // 핸들러 등록
  useEffect(() => {
    if (!register) return;
    
    const unregisterLogin = register('login', loginHandler, {
      id: 'user-login-with-events',
      priority: 100
    });
    
    const unregisterUpdate = register('updateProfile', updateProfileHandler, {
      id: 'user-profile-update-with-events',
      priority: 100
    });
    
    return () => {
      unregisterLogin();
      unregisterUpdate();
    };
  }, [register, loginHandler, updateProfileHandler]);
}
```

## 고급 통합 패턴

### 1. 조건부 크로스 도메인 접근

```typescript
// 조건에 따른 선택적 도메인 접근
export function useConditionalCrossDomain(features: {
  cart?: boolean;
  orders?: boolean;
  notifications?: boolean;
}) {
  const profile = useStoreValue(useUserStore('profile'));
  
  // 조건부 훅 사용
  const cartItems = features.cart 
    ? useStoreValue(useCartStore('items'))
    : [];
    
  const recentOrders = features.orders
    ? useStoreValue(useOrderStore('recent'))
    : [];
    
  const notifications = features.notifications
    ? useStoreValue(useNotificationStore('unread'))
    : [];
  
  // 사용 가능한 기능에 따른 데이터 집계
  const summary = useMemo(() => {
    const baseData = { profile };
    
    if (features.cart && cartItems.length > 0) {
      baseData.cartSummary = {
        itemCount: cartItems.length,
        totalValue: cartItems.reduce((sum, item) => sum + item.total, 0)
      };
    }
    
    if (features.orders && recentOrders.length > 0) {
      baseData.ordersSummary = {
        count: recentOrders.length,
        lastOrder: recentOrders[0]
      };
    }
    
    if (features.notifications && notifications.length > 0) {
      baseData.notificationsSummary = {
        unreadCount: notifications.length
      };
    }
    
    return baseData;
  }, [profile, cartItems, recentOrders, notifications, features]);
  
  return summary;
}
```

### 2. 트랜잭션 패턴

```typescript
// 여러 도메인에 걸친 트랜잭션 처리
export function useTransactionalOperation() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  const paymentAction = usePaymentAction();
  
  const executeTransactionalCheckout = useCallback(async (checkoutData: CheckoutData) => {
    const rollbackActions: Array<() => Promise<void>> = [];
    
    try {
      // 1. 재고 예약
      const reservationResult = await orderAction('reserveInventory', {
        items: checkoutData.items
      });
      
      if (!reservationResult.success) {
        throw new Error('재고 부족');
      }
      
      rollbackActions.push(() => 
        orderAction('releaseInventoryReservation', { 
          reservationId: reservationResult.reservationId 
        })
      );
      
      // 2. 주문 생성
      const orderResult = await orderAction('createOrder', {
        userId: checkoutData.userId,
        items: checkoutData.items,
        reservationId: reservationResult.reservationId
      });
      
      if (!orderResult.success) {
        throw new Error('주문 생성 실패');
      }
      
      rollbackActions.push(() => 
        orderAction('cancelOrder', { 
          orderId: orderResult.order.id 
        })
      );
      
      // 3. 결제 처리
      const paymentResult = await paymentAction('processPayment', {
        orderId: orderResult.order.id,
        amount: checkoutData.amount,
        paymentMethod: checkoutData.paymentMethod
      });
      
      if (!paymentResult.success) {
        throw new Error('결제 처리 실패');
      }
      
      // 4. 장바구니 정리
      await cartAction('clearCart', {});
      
      // 5. 사용자 통계 업데이트
      await userAction('updatePurchaseHistory', {
        orderId: orderResult.order.id,
        amount: checkoutData.amount
      });
      
      return {
        success: true,
        order: orderResult.order,
        payment: paymentResult.payment
      };
      
    } catch (error) {
      // 롤백 실행 (역순)
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try {
          await rollbackActions[i]();
        } catch (rollbackError) {
          console.error('롤백 실행 중 오류:', rollbackError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '트랜잭션 실패'
      };
    }
  }, [userAction, cartAction, orderAction, paymentAction]);
  
  return { executeTransactionalCheckout };
}
```

## 모범 사례

### 1. 도메인 경계 원칙

```typescript
// ✅ 좋음: 명확한 목적의 크로스 도메인 접근
function useOrderSummaryWithUserInfo() {
  // 주문 요약을 위해 필요한 사용자 정보만 접근
  const userName = useStoreValue(useUserStore('profile'), profile => profile.name);
  const orders = useStoreValue(useOrderStore('recent'));
  
  return {
    userName,
    orders,
    summary: `${userName}님의 최근 주문 ${orders.length}건`
  };
}

// ❌ 피하기: 불필요한 크로스 도메인 의존성
function useUserProfileWithCartAndOrders() {
  // 프로필 컴포넌트에서 장바구니와 주문 정보까지 접근하는 것은 과도함
  const profile = useStoreValue(useUserStore('profile'));
  const cartItems = useStoreValue(useCartStore('items')); // 불필요
  const orders = useStoreValue(useOrderStore('all')); // 불필요
  
  return { profile, cartItems, orders }; // 너무 많은 책임
}
```

### 2. 성능 고려사항

```typescript
// ✅ 좋음: 조건부 구독으로 성능 최적화
function useOptimizedCrossDomain({ includeCart, includeOrders }: {
  includeCart?: boolean;
  includeOrders?: boolean;
}) {
  const profile = useStoreValue(useUserStore('profile'));
  
  // 필요한 경우에만 구독
  const cartData = includeCart 
    ? useStoreValue(useCartStore('items'))
    : null;
    
  const orderData = includeOrders 
    ? useStoreValue(useOrderStore('recent'))
    : null;
  
  return {
    profile,
    ...(cartData && { cart: cartData }),
    ...(orderData && { orders: orderData })
  };
}

// ❌ 피하기: 항상 모든 도메인 구독
function useInefficientCrossDomain() {
  // 사용하지 않아도 모든 데이터를 구독하는 것은 비효율적
  const profile = useStoreValue(useUserStore('profile'));
  const cartItems = useStoreValue(useCartStore('items'));
  const orders = useStoreValue(useOrderStore('all'));
  const notifications = useStoreValue(useNotificationStore('all'));
  
  return { profile }; // 다른 데이터는 사용하지 않음
}
```

### 3. 오류 처리 전략

```typescript
// 크로스 도메인 오류 처리
export function useSafeCrossDomainOperation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const safeCrossOperation = useCallback(async (operation: () => Promise<any>) => {
    try {
      setErrors({});
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      // 도메인별 오류 분류
      if (errorMessage.includes('사용자')) {
        setErrors(prev => ({ ...prev, user: errorMessage }));
      } else if (errorMessage.includes('장바구니')) {
        setErrors(prev => ({ ...prev, cart: errorMessage }));
      } else if (errorMessage.includes('주문')) {
        setErrors(prev => ({ ...prev, order: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
      
      throw error;
    }
  }, []);
  
  return { errors, safeCrossOperation, clearErrors: () => setErrors({}) };
}
```

---

## 요약

크로스 도메인 통합은 다음 원칙을 따라야 합니다:

- **최소한의 결합** - 필요한 경우에만 도메인 간 접근
- **명확한 목적** - 비즈니스 요구사항에 기반한 통합
- **성능 최적화** - 조건부 구독과 지연 로딩 활용
- **안전한 실행** - 트랜잭션과 롤백 메커니즘
- **유지보수성** - 통합 로직의 캡슐화와 테스트 가능성

올바른 크로스 도메인 패턴을 사용하면 복잡한 비즈니스 요구사항을 깔끔하게 구현할 수 있습니다.

---

::: tip 다음 단계
- [MVVM 아키텍처](./mvvm-architecture) - MVVM 패턴과 크로스 도메인 통합
- [성능 최적화](./performance) - 크로스 도메인 성능 최적화
- [모범 사례](./best-practices) - 실제 프로덕션 환경 권장사항
:::