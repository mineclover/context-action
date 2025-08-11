# 프로바이더 구성

프로바이더 구성은 Context-Action 프레임워크에서 도메인 경계를 정의하고 애플리케이션 아키텍처를 구성하는 핵심 패턴입니다. 이 가이드는 효과적인 프로바이더 조합 전략을 다룹니다.

## 기본 프로바이더 구조

### 단일 도메인 프로바이더

```typescript
// providers/UserProvider.tsx
import React from 'react';
import { UserStoreProvider, UserActionProvider } from '@/stores/user';
import { useUserHandlers } from '@/hooks/handlers/useUserHandlers';

// 핸들러 설정 컴포넌트
function UserHandlersSetup() {
  useUserHandlers(); // 모든 사용자 핸들러 등록
  return null;
}

// 통합 사용자 프로바이더
export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <UserHandlersSetup />
        {children}
      </UserActionProvider>
    </UserStoreProvider>
  );
}

// 사용법
function UserSection() {
  return (
    <UserProvider>
      <UserProfile />
      <UserSettings />
    </UserProvider>
  );
}
```

### 다중 도메인 프로바이더

```typescript
// providers/AppProvider.tsx
import React from 'react';
import { UserProvider } from './UserProvider';
import { CartProvider } from './CartProvider';
import { OrderProvider } from './OrderProvider';
import { NotificationProvider } from './NotificationProvider';

// 계층적 프로바이더 구성
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>          {/* 최상위: 사용자 컨텍스트 */}
      <NotificationProvider> {/* 알림 시스템 */}
        <CartProvider>       {/* 장바구니 도메인 */}
          <OrderProvider>    {/* 주문 도메인 */}
            {children}
          </OrderProvider>
        </CartProvider>
      </NotificationProvider>
    </UserProvider>
  );
}
```

## 프로바이더 구성 패턴

### 1. 계층적 구성

```typescript
// 의존성 순서에 따른 계층 구성
function HierarchicalProviders({ children }: { children: React.ReactNode }) {
  return (
    // Level 1: 기반 서비스 (인증, 설정)
    <AuthProvider>
      <ConfigProvider>
        
        {/* Level 2: 핵심 비즈니스 도메인 */}
        <UserProvider>
          <ProductProvider>
            
            {/* Level 3: 상위 비즈니스 로직 */}
            <CartProvider>
              <OrderProvider>
                
                {/* Level 4: UI/UX 도메인 */}
                <NotificationProvider>
                  <ThemeProvider>
                    {children}
                  </ThemeProvider>
                </NotificationProvider>
                
              </OrderProvider>
            </CartProvider>
            
          </ProductProvider>
        </UserProvider>
        
      </ConfigProvider>
    </AuthProvider>
  );
}
```

### 2. 병렬 구성

```typescript
// 독립적인 도메인들의 병렬 구성
function ParallelProviders({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* 각 도메인이 독립적으로 작동 */}
      <UserProvider>
        <UserSection />
      </UserProvider>
      
      <CartProvider>
        <ShoppingSection />
      </CartProvider>
      
      <OrderProvider>
        <OrderHistorySection />
      </OrderProvider>
      
      {/* 공통 영역은 여러 프로바이더로 래핑 */}
      <UserProvider>
        <CartProvider>
          <CheckoutSection />
        </CartProvider>
      </UserProvider>
    </div>
  );
}
```

### 3. 조건부 구성

```typescript
// 사용자 역할에 따른 조건부 프로바이더
interface ConditionalProvidersProps {
  children: React.ReactNode;
  userRole: 'guest' | 'user' | 'admin';
}

export function ConditionalProviders({ children, userRole }: ConditionalProvidersProps) {
  // 기본 프로바이더 (모든 역할)
  let providers = (
    <UserProvider>
      <ProductProvider>
        {children}
      </ProductProvider>
    </UserProvider>
  );
  
  // 로그인 사용자 전용
  if (userRole !== 'guest') {
    providers = (
      <UserProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              {children}
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </UserProvider>
    );
  }
  
  // 관리자 전용
  if (userRole === 'admin') {
    providers = (
      <UserProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <AdminProvider>
                <AnalyticsProvider>
                  {children}
                </AnalyticsProvider>
              </AdminProvider>
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </UserProvider>
    );
  }
  
  return providers;
}
```

### 4. 동적 구성

```typescript
// 런타임에 프로바이더 동적 구성
interface DynamicProvidersProps {
  children: React.ReactNode;
  enabledFeatures: string[];
}

export function DynamicProviders({ children, enabledFeatures }: DynamicProvidersProps) {
  const [providers, setProviders] = useState<React.ComponentType<any>[]>([]);
  
  useEffect(() => {
    const providersList = [UserProvider]; // 기본 프로바이더
    
    // 기능별 프로바이더 추가
    if (enabledFeatures.includes('cart')) {
      providersList.push(CartProvider);
    }
    
    if (enabledFeatures.includes('notifications')) {
      providersList.push(NotificationProvider);
    }
    
    if (enabledFeatures.includes('analytics')) {
      providersList.push(AnalyticsProvider);
    }
    
    setProviders(providersList);
  }, [enabledFeatures]);
  
  // 프로바이더들을 중첩으로 구성
  const renderProviders = (providers: React.ComponentType<any>[], index = 0): React.ReactNode => {
    if (index >= providers.length) {
      return children;
    }
    
    const Provider = providers[index];
    return (
      <Provider>
        {renderProviders(providers, index + 1)}
      </Provider>
    );
  };
  
  return <>{renderProviders(providers)}</>;
}
```

## 고급 구성 패턴

### 1. 팩토리 패턴

```typescript
// 프로바이더 팩토리
interface ProviderConfig {
  user: boolean;
  cart: boolean;
  orders: boolean;
  admin?: boolean;
  analytics?: boolean;
}

export function createProviderStack(config: ProviderConfig) {
  return function ProviderStack({ children }: { children: React.ReactNode }) {
    let stack = children;
    
    // 역순으로 프로바이더 적용 (가장 안쪽부터)
    if (config.analytics) {
      stack = <AnalyticsProvider>{stack}</AnalyticsProvider>;
    }
    
    if (config.admin) {
      stack = <AdminProvider>{stack}</AdminProvider>;
    }
    
    if (config.orders) {
      stack = <OrderProvider>{stack}</OrderProvider>;
    }
    
    if (config.cart) {
      stack = <CartProvider>{stack}</CartProvider>;
    }
    
    if (config.user) {
      stack = <UserProvider>{stack}</UserProvider>;
    }
    
    return <>{stack}</>;
  };
}

// 사용법
const UserAppProviders = createProviderStack({
  user: true,
  cart: true,
  orders: false,
  admin: false
});

const AdminAppProviders = createProviderStack({
  user: true,
  cart: true,
  orders: true,
  admin: true,
  analytics: true
});

function UserApp() {
  return (
    <UserAppProviders>
      <UserDashboard />
    </UserAppProviders>
  );
}
```

### 2. 컨텍스트 전달 패턴

```typescript
// 상위 컨텍스트에서 하위 컨텍스트로 데이터 전달
interface CartProviderProps {
  children: React.ReactNode;
  userId?: string; // 상위에서 전달받은 사용자 ID
}

export function EnhancedCartProvider({ children, userId }: CartProviderProps) {
  return (
    <CartStoreProvider>
      <CartActionProvider>
        <CartHandlersSetup userId={userId} />
        {children}
      </CartActionProvider>
    </CartStoreProvider>
  );
}

function CartHandlersSetup({ userId }: { userId?: string }) {
  useCartHandlers(userId); // 사용자 ID를 핸들러에 전달
  return null;
}

// 통합 사용법
function IntegratedProviders({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string>();
  
  return (
    <UserProvider>
      {/* 사용자 ID 획득을 위한 컴포넌트 */}
      <UserIdCapture onUserIdChange={setCurrentUserId} />
      
      {/* 사용자 ID를 장바구니 프로바이더에 전달 */}
      <EnhancedCartProvider userId={currentUserId}>
        {children}
      </EnhancedCartProvider>
    </UserProvider>
  );
}
```

### 3. 지연 로딩 프로바이더

```typescript
// 코드 분할을 활용한 지연 로딩
const LazyCartProvider = React.lazy(() => import('./CartProvider'));
const LazyOrderProvider = React.lazy(() => import('./OrderProvider'));
const LazyAdminProvider = React.lazy(() => import('./AdminProvider'));

interface LazyProvidersProps {
  children: React.ReactNode;
  features: {
    cart?: boolean;
    orders?: boolean;
    admin?: boolean;
  };
}

export function LazyProviders({ children, features }: LazyProvidersProps) {
  return (
    <UserProvider>
      <Suspense fallback={<div>기본 기능 로딩 중...</div>}>
        {features.cart ? (
          <LazyCartProvider>
            <Suspense fallback={<div>주문 기능 로딩 중...</div>}>
              {features.orders ? (
                <LazyOrderProvider>
                  <Suspense fallback={<div>관리자 기능 로딩 중...</div>}>
                    {features.admin ? (
                      <LazyAdminProvider>
                        {children}
                      </LazyAdminProvider>
                    ) : children}
                  </Suspense>
                </LazyOrderProvider>
              ) : children}
            </Suspense>
          </LazyCartProvider>
        ) : children}
      </Suspense>
    </UserProvider>
  );
}
```

## 프로바이더 최적화

### 1. 메모화된 프로바이더

```typescript
// 불필요한 리렌더링 방지
const MemoizedUserProvider = React.memo<{
  children: React.ReactNode;
  config?: UserProviderConfig;
}>(({ children, config }) => {
  return (
    <UserStoreProvider config={config}>
      <UserActionProvider>
        <UserHandlersSetup />
        {children}
      </UserActionProvider>
    </UserStoreProvider>
  );
});

// 설정이 변경될 때만 리렌더링
function OptimizedApp() {
  const [userConfig] = useState({ debug: false, logLevel: 'warn' });
  
  return (
    <MemoizedUserProvider config={userConfig}>
      <AppContent />
    </MemoizedUserProvider>
  );
}
```

### 2. 조건부 렌더링 최적화

```typescript
// 조건부 프로바이더 최적화
function ConditionalOptimizedProviders({ 
  children, 
  userRole 
}: { 
  children: React.ReactNode; 
  userRole: string;
}) {
  // 역할별 프로바이더 구성 메모화
  const ProviderComponent = useMemo(() => {
    switch (userRole) {
      case 'admin':
        return ({ children }) => (
          <UserProvider>
            <CartProvider>
              <OrderProvider>
                <AdminProvider>
                  {children}
                </AdminProvider>
              </OrderProvider>
            </CartProvider>
          </UserProvider>
        );
      
      case 'user':
        return ({ children }) => (
          <UserProvider>
            <CartProvider>
              <OrderProvider>
                {children}
              </OrderProvider>
            </CartProvider>
          </UserProvider>
        );
      
      default:
        return ({ children }) => (
          <UserProvider>
            {children}
          </UserProvider>
        );
    }
  }, [userRole]);
  
  return <ProviderComponent>{children}</ProviderComponent>;
}
```

### 3. 프로바이더 분할

```typescript
// 기능별 프로바이더 분할
function CoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

function BusinessProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <OrderProvider>
        <PaymentProvider>
          {children}
        </PaymentProvider>
      </OrderProvider>
    </CartProvider>
  );
}

function UIProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// 조합된 애플리케이션
function App() {
  return (
    <CoreProviders>
      <BusinessProviders>
        <UIProviders>
          <Router>
            <Routes />
          </Router>
        </UIProviders>
      </BusinessProviders>
    </CoreProviders>
  );
}
```

## 프로바이더 테스팅

### 1. 테스트 프로바이더

```typescript
// 테스트용 프로바이더 래퍼
export function TestProviders({ 
  children,
  initialStores = {}
}: {
  children: React.ReactNode;
  initialStores?: Record<string, any>;
}) {
  return (
    <UserProvider>
      <CartProvider>
        <TestStoreInitializer initialStores={initialStores}>
          {children}
        </TestStoreInitializer>
      </CartProvider>
    </UserProvider>
  );
}

// 테스트 유틸리티
export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    initialStores?: Record<string, any>;
    providerProps?: any;
  } = {}
) => {
  const { initialStores, providerProps } = options;
  
  const Wrapper = ({ children }) => (
    <TestProviders initialStores={initialStores} {...providerProps}>
      {children}
    </TestProviders>
  );
  
  return render(ui, { wrapper: Wrapper });
};

// 사용법
describe('UserProfile', () => {
  it('초기 사용자 데이터로 렌더링', () => {
    const initialStores = {
      'user.profile': { name: 'Test User', email: 'test@example.com' }
    };
    
    renderWithProviders(<UserProfile />, { initialStores });
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

### 2. 프로바이더 격리 테스트

```typescript
// 특정 도메인만 테스트
function renderWithUserProvider(ui: React.ReactElement) {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>
  );
}

function renderWithCartProvider(ui: React.ReactElement) {
  return render(
    <CartProvider>
      {ui}
    </CartProvider>
  );
}

// 크로스 도메인 테스트
function renderWithMultipleProviders(ui: React.ReactElement) {
  return render(
    <UserProvider>
      <CartProvider>
        {ui}
      </CartProvider>
    </UserProvider>
  );
}
```

## 디버깅과 개발 도구

### 1. 개발 모드 로깅

```typescript
// 개발 환경에서 프로바이더 로깅
function DebuggableProvider({ children, name }: { 
  children: React.ReactNode; 
  name: string;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} Provider mounted`);
      return () => console.log(`${name} Provider unmounted`);
    }
  }, [name]);
  
  return <>{children}</>;
}

// 사용법
export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <DebuggableProvider name="User">
      <UserStoreProvider>
        <UserActionProvider>
          <UserHandlersSetup />
          {children}
        </UserActionProvider>
      </UserStoreProvider>
    </DebuggableProvider>
  );
}
```

### 2. 프로바이더 트리 시각화

```typescript
// 개발 도구용 프로바이더 트리 표시
function ProviderTreeDebugger() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px'
    }}>
      <h4>Provider Tree</h4>
      <div>└ App</div>
      <div>&nbsp;&nbsp;└ UserProvider</div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;└ CartProvider</div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ OrderProvider</div>
    </div>
  );
}
```

## 모범 사례

### 1. 의존성 순서

```typescript
// ✅ 좋음: 의존성 순서에 따른 구성
function ProperDependencyOrder({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>      {/* 기반 인증 */}
      <UserProvider>    {/* 사용자 정보 (인증 의존) */}
        <CartProvider>  {/* 장바구니 (사용자 의존) */}
          <OrderProvider> {/* 주문 (사용자 + 장바구니 의존) */}
            {children}
          </OrderProvider>
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  );
}

// ❌ 피하기: 잘못된 의존성 순서
function WrongDependencyOrder({ children }: { children: React.ReactNode }) {
  return (
    <OrderProvider>     {/* 주문이 최상위? */}
      <CartProvider>    {/* 장바구니가 사용자보다 위? */}
        <UserProvider>  {/* 사용자 정보가 마지막? */}
          <AuthProvider> {/* 인증이 가장 안쪽? */}
            {children}
          </AuthProvider>
        </UserProvider>
      </CartProvider>
    </OrderProvider>
  );
}
```

### 2. 적절한 경계 설정

```typescript
// ✅ 좋음: 명확한 도메인 경계
function App() {
  return (
    <div>
      {/* 사용자 관련 섹션 */}
      <UserProvider>
        <Header />
        <UserDashboard />
      </UserProvider>
      
      {/* 쇼핑 관련 섹션 */}
      <UserProvider>
        <CartProvider>
          <ShoppingArea />
          <Checkout />
        </CartProvider>
      </UserProvider>
      
      {/* 관리자 전용 섹션 */}
      <AdminProvider>
        <AdminPanel />
      </AdminProvider>
    </div>
  );
}
```

### 3. 성능 고려사항

```typescript
// ✅ 좋음: 필요한 곳에만 프로바이더 적용
function OptimizedLayout() {
  return (
    <div>
      <Header /> {/* 프로바이더 없음 - 정적 헤더 */}
      
      <main>
        <UserProvider>
          <UserContent /> {/* 사용자 데이터가 필요한 부분만 */}
        </UserProvider>
      </main>
      
      <Footer /> {/* 프로바이더 없음 - 정적 푸터 */}
    </div>
  );
}

// ❌ 피하기: 불필요한 전역 프로바이더
function InefficientLayout() {
  return (
    <UserProvider> {/* 모든 컴포넌트를 래핑 */}
      <Header />   {/* 사용자 데이터 불필요 */}
      <main>
        <UserContent />
      </main>
      <Footer />   {/* 사용자 데이터 불필요 */}
    </UserProvider>
  );
}
```

---

## 요약

효과적인 프로바이더 구성은 다음 원칙을 따릅니다:

- **명확한 도메인 경계** - 책임과 의존성에 따른 분리
- **적절한 계층 구조** - 의존성 순서에 따른 중첩
- **성능 최적화** - 필요한 곳에만 프로바이더 적용
- **유연한 구성** - 조건부 및 동적 프로바이더 지원
- **테스트 가능성** - 격리된 테스트를 위한 구조

올바른 프로바이더 구성을 통해 확장 가능하고 유지보수 가능한 애플리케이션 아키텍처를 구축할 수 있습니다.

---

::: tip 다음 단계
- [핸들러 ID 전략](./handler-id-strategies) - 핸들러 식별과 관리
- [크로스 도메인 통합](./cross-domain-integration) - 도메인 간 통신 패턴
- [성능 최적화](./performance) - 프로바이더 성능 최적화
:::