/**
 * Comprehensive Error Handling Demo
 * 
 * 실제 애플리케이션 시나리오에서 종합적인 에러 처리 시스템을 보여주는 예제:
 * - E-commerce 쇼핑몰 시나리오
 * - 다중 에러 타입 및 복구 전략
 * - DevTools와 완전 통합된 모니터링
 * - 사용자 친화적 에러 UX
 */

import React, { useCallback, useEffect } from 'react';
import {
  createStoreContext,
  createActionContext,
  useStoreValue,
  ContextActionErrorBoundary,
  createErrorHandler,
  ErrorCategory,
  setupDevTools
} from '@context-action/react';

// DevTools 초기화
if (process.env.NODE_ENV === 'development') {
  setupDevTools({
    enabled: true,
    enablePerformanceMonitoring: true,
    autoConnectStores: true
  });
}

// 타입 정의
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

interface AppError {
  id: string;
  type: 'network' | 'validation' | 'permission' | 'business' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  context: string;
  recoverable: boolean;
  userMessage: string;
}

// Store 스키마
interface ECommerceStores {
  user: User;
  products: Product[];
  cart: {
    items: CartItem[];
    total: number;
    isLoading: boolean;
  };
  ui: {
    isLoading: boolean;
    loadingMessage: string;
    showMobileMenu: boolean;
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: Date;
      duration?: number;
    }>;
  };
  errors: {
    active: AppError[];
    history: AppError[];
    suppressedTypes: string[];
  };
}

// Store Context
const {
  Provider: StoreProvider,
  useStore
} = createStoreContext('ECommerceDemo', {
  user: {
    id: '',
    name: '',
    email: '',
    isLoggedIn: false
  },
  products: [],
  cart: {
    items: [],
    total: 0,
    isLoading: false
  },
  ui: {
    isLoading: false,
    loadingMessage: '',
    showMobileMenu: false,
    notifications: []
  },
  errors: {
    active: [],
    history: [],
    suppressedTypes: []
  }
} as ECommerceStores);

// Actions 인터페이스
interface ECommerceActions {
  // User Actions
  login: { email: string; password: string };
  logout: void;
  
  // Product Actions
  loadProducts: { category?: string; search?: string };
  
  // Cart Actions
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  updateCartQuantity: { productId: string; quantity: number };
  checkout: { paymentMethod: string; shippingAddress: string };
  
  // Error Management Actions
  dismissError: { errorId: string };
  retryLastAction: { errorId: string };
  suppressErrorType: { errorType: string };
  
  // UI Actions
  showNotification: { type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number };
  clearNotifications: void;
}

// Action Context
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionHandler
} = createActionContext<ECommerceActions>('ECommerceActions');

// 에러 처리 및 비즈니스 로직 컴포넌트
function ECommerceLogic({ children }: { children: React.ReactNode }) {
  const userStore = useStore('user');
  const productsStore = useStore('products');
  const cartStore = useStore('cart');
  const uiStore = useStore('ui');
  const errorsStore = useStore('errors');

  // 통합 에러 핸들러
  const errorHandler = createErrorHandler({
    onError: async (error, context) => {
      const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 에러 타입 분류
      let errorType: AppError['type'] = 'system';
      let severity: AppError['severity'] = 'medium';
      let userMessage = error.message;
      let recoverable = true;

      if (error.message.includes('네트워크') || error.message.includes('연결')) {
        errorType = 'network';
        severity = 'high';
        userMessage = '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('권한') || error.message.includes('인증')) {
        errorType = 'permission';
        severity = 'high';
        userMessage = '접근 권한이 없습니다. 로그인 후 다시 시도해주세요.';
      } else if (error.message.includes('재고') || error.message.includes('수량')) {
        errorType = 'business';
        severity = 'medium';
        userMessage = '요청하신 수량을 처리할 수 없습니다. 재고를 확인해주세요.';
      } else if (error.message.includes('검증') || error.message.includes('형식')) {
        errorType = 'validation';
        severity = 'low';
        userMessage = '입력하신 정보를 다시 확인해주세요.';
      }

      const appError: AppError = {
        id: errorId,
        type: errorType,
        severity,
        message: error.message,
        details: context,
        timestamp: new Date(),
        context: context?.context || 'unknown',
        recoverable,
        userMessage
      };

      // 억제된 에러 타입인지 확인
      const suppressedTypes = errorsStore.getValue().suppressedTypes;
      if (suppressedTypes.includes(errorType)) {
        return; // 무시
      }

      // 에러 저장
      errorsStore.update(state => ({
        ...state,
        active: [...state.active, appError].slice(-10), // 최대 10개 활성 에러
        history: [appError, ...state.history].slice(0, 100) // 최대 100개 히스토리
      }));

      // 사용자 알림 표시
      uiStore.update(state => ({
        ...state,
        notifications: [
          {
            id: errorId,
            type: 'error' as const,
            message: appError.userMessage,
            timestamp: new Date(),
            duration: severity === 'critical' ? 0 : 5000 // 중요한 에러는 수동 해제
          },
          ...state.notifications
        ]
      }));
    }
  });

  // 로그인 액션
  useActionHandler('login', useCallback(async (payload) => {
    const { email, password } = payload;
    
    uiStore.update(state => ({ 
      ...state, 
      isLoading: true, 
      loadingMessage: '로그인 중...' 
    }));

    try {
      // 입력 검증
      if (!email || !password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      if (!email.includes('@')) {
        throw new Error('올바른 이메일 형식을 입력해주세요.');
      }

      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 인증 실패 시뮬레이션
      if (password === 'wrong') {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 성공
      const userData: User = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        isLoggedIn: true
      };

      userStore.setValue(userData);

      uiStore.update(state => ({
        ...state,
        isLoading: false,
        loadingMessage: '',
        notifications: [
          {
            id: `login-success-${Date.now()}`,
            type: 'success' as const,
            message: `환영합니다, ${userData.name}님!`,
            timestamp: new Date(),
            duration: 3000
          },
          ...state.notifications
        ]
      }));

    } catch (error) {
      uiStore.update(state => ({ ...state, isLoading: false, loadingMessage: '' }));
      
      await errorHandler.handleError(error as Error, {
        context: 'user-login',
        category: ErrorCategory.VALIDATION
      });
    }
  }, [userStore, uiStore, errorHandler]));

  // 상품 로드 액션
  useActionHandler('loadProducts', useCallback(async (payload) => {
    const { category, search } = payload;

    uiStore.update(state => ({ 
      ...state, 
      isLoading: true, 
      loadingMessage: '상품 목록을 불러오는 중...' 
    }));

    try {
      // 네트워크 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 네트워크 에러 시뮬레이션
      if (Math.random() < 0.2) {
        throw new Error('네트워크 연결 오류: 상품 데이터를 불러올 수 없습니다.');
      }

      // 상품 데이터 생성
      const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
        id: `product-${i + 1}`,
        name: `상품 ${i + 1}`,
        price: (Math.floor(Math.random() * 100) + 10) * 1000,
        stock: Math.floor(Math.random() * 50),
        imageUrl: `https://picsum.photos/200/200?random=${i + 1}`
      }));

      // 검색 필터링
      let filteredProducts = mockProducts;
      if (search) {
        filteredProducts = mockProducts.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      productsStore.setValue(filteredProducts);

      uiStore.update(state => ({
        ...state,
        isLoading: false,
        loadingMessage: '',
        notifications: [
          {
            id: `products-loaded-${Date.now()}`,
            type: 'success' as const,
            message: `${filteredProducts.length}개의 상품을 불러왔습니다.`,
            timestamp: new Date(),
            duration: 2000
          },
          ...state.notifications
        ]
      }));

    } catch (error) {
      uiStore.update(state => ({ ...state, isLoading: false, loadingMessage: '' }));
      
      await errorHandler.handleError(error as Error, {
        context: 'load-products',
        category: ErrorCategory.NETWORK
      });
    }
  }, [productsStore, uiStore, errorHandler]));

  // 장바구니 추가 액션
  useActionHandler('addToCart', useCallback(async (payload) => {
    const { productId, quantity } = payload;

    try {
      const products = productsStore.getValue();
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        throw new Error('상품을 찾을 수 없습니다.');
      }

      if (product.stock < quantity) {
        throw new Error(`재고가 부족합니다. 현재 재고: ${product.stock}개`);
      }

      if (quantity <= 0) {
        throw new Error('수량은 1개 이상이어야 합니다.');
      }

      cartStore.update(state => {
        const existingItem = state.items.find(item => item.product.id === productId);
        let newItems;

        if (existingItem) {
          newItems = state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...state.items, { product, quantity }];
        }

        const newTotal = newItems.reduce((sum, item) => 
          sum + (item.product.price * item.quantity), 0
        );

        return {
          ...state,
          items: newItems,
          total: newTotal
        };
      });

      // 재고 업데이트
      productsStore.update(products => 
        products.map(p => 
          p.id === productId 
            ? { ...p, stock: p.stock - quantity }
            : p
        )
      );

      uiStore.update(state => ({
        ...state,
        notifications: [
          {
            id: `cart-add-${Date.now()}`,
            type: 'success' as const,
            message: `${product.name} ${quantity}개가 장바구니에 추가되었습니다.`,
            timestamp: new Date(),
            duration: 2000
          },
          ...state.notifications
        ]
      }));

    } catch (error) {
      await errorHandler.handleError(error as Error, {
        context: 'add-to-cart',
        category: ErrorCategory.BUSINESS
      });
    }
  }, [productsStore, cartStore, uiStore, errorHandler]));

  // 체크아웃 액션
  useActionHandler('checkout', useCallback(async (payload) => {
    const { paymentMethod, shippingAddress } = payload;

    const user = userStore.getValue();
    const cart = cartStore.getValue();

    try {
      if (!user.isLoggedIn) {
        throw new Error('로그인이 필요한 서비스입니다.');
      }

      if (cart.items.length === 0) {
        throw new Error('장바구니가 비어있습니다.');
      }

      if (!paymentMethod || !shippingAddress) {
        throw new Error('결제 정보와 배송 주소를 입력해주세요.');
      }

      cartStore.update(state => ({ ...state, isLoading: true }));

      // 결제 처리 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 결제 실패 시뮬레이션
      if (Math.random() < 0.3) {
        throw new Error('결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 성공 처리
      cartStore.setValue({ items: [], total: 0, isLoading: false });

      uiStore.update(state => ({
        ...state,
        notifications: [
          {
            id: `checkout-success-${Date.now()}`,
            type: 'success' as const,
            message: '주문이 성공적으로 완료되었습니다!',
            timestamp: new Date(),
            duration: 5000
          },
          ...state.notifications
        ]
      }));

    } catch (error) {
      cartStore.update(state => ({ ...state, isLoading: false }));
      
      await errorHandler.handleError(error as Error, {
        context: 'checkout',
        category: ErrorCategory.BUSINESS
      });
    }
  }, [userStore, cartStore, uiStore, errorHandler]));

  // 에러 해제 액션
  useActionHandler('dismissError', useCallback(async (payload) => {
    const { errorId } = payload;
    
    errorsStore.update(state => ({
      ...state,
      active: state.active.filter(error => error.id !== errorId)
    }));

    // 관련 알림도 제거
    uiStore.update(state => ({
      ...state,
      notifications: state.notifications.filter(notif => notif.id !== errorId)
    }));
  }, [errorsStore, uiStore]));

  // 알림 표시 액션
  useActionHandler('showNotification', useCallback(async (payload) => {
    const { type, message, duration = 3000 } = payload;
    
    const notification = {
      id: `notification-${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
      duration
    };

    uiStore.update(state => ({
      ...state,
      notifications: [notification, ...state.notifications.slice(0, 9)]
    }));

    // 자동 제거
    if (duration > 0) {
      setTimeout(() => {
        uiStore.update(state => ({
          ...state,
          notifications: state.notifications.filter(n => n.id !== notification.id)
        }));
      }, duration);
    }
  }, [uiStore]));

  // 초기 데이터 로드
  useEffect(() => {
    const dispatch = useActionDispatch();
    dispatch('loadProducts', {});
  }, []);

  return <>{children}</>;
}

// 사용자 인터페이스 컴포넌트들
function LoginForm() {
  const dispatch = useActionDispatch();
  const userStore = useStore('user');
  const uiStore = useStore('ui');
  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    dispatch('login', {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    });
  };

  if (user.isLoggedIn) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800">환영합니다, {user.name}님!</p>
        <button
          onClick={() => dispatch('logout')}
          className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">로그인</h3>
      <div className="space-y-3">
        <div>
          <input
            name="email"
            type="email"
            placeholder="이메일"
            className="w-full px-3 py-2 border border-gray-300 rounded"
            defaultValue="test@example.com"
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={ui.isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {ui.isLoading ? ui.loadingMessage : '로그인'}
        </button>
        <div className="text-sm text-gray-500">
          <p>테스트용: 올바른 비밀번호는 아무거나, "wrong"을 입력하면 에러 발생</p>
        </div>
      </div>
    </form>
  );
}

function ProductList() {
  const dispatch = useActionDispatch();
  const productsStore = useStore('products');
  const cartStore = useStore('cart');
  const products = useStoreValue(productsStore);
  const cart = useStoreValue(cartStore);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">상품 목록</h3>
        <button
          onClick={() => dispatch('loadProducts', {})}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          새로고침
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {products.map((product) => (
          <div key={product.id} className="p-3 border border-gray-200 rounded-lg">
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-gray-600">{product.price.toLocaleString()}원</p>
            <p className="text-xs text-gray-500">재고: {product.stock}개</p>
            <button
              onClick={() => dispatch('addToCart', { productId: product.id, quantity: 1 })}
              disabled={product.stock === 0}
              className="mt-2 w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? '품절' : '장바구니 추가'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingCart() {
  const dispatch = useActionDispatch();
  const cartStore = useStore('cart');
  const cart = useStoreValue(cartStore);

  const handleCheckout = () => {
    dispatch('checkout', {
      paymentMethod: 'credit-card',
      shippingAddress: '서울시 강남구'
    });
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">장바구니</h3>
      
      {cart.items.length === 0 ? (
        <p className="text-gray-500">장바구니가 비어있습니다.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {item.product.price.toLocaleString()}원 x {item.quantity}
                  </span>
                </div>
                <span className="font-medium">
                  {(item.product.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">총 금액</span>
              <span className="text-lg font-semibold text-blue-600">
                {cart.total.toLocaleString()}원
              </span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={cart.isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {cart.isLoading ? '결제 처리 중...' : '주문하기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ErrorDisplay() {
  const dispatch = useActionDispatch();
  const errorsStore = useStore('errors');
  const errors = useStoreValue(errorsStore);

  if (errors.active.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {errors.active.map((error) => {
        const colorClasses = {
          low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          medium: 'bg-orange-50 border-orange-200 text-orange-800',
          high: 'bg-red-50 border-red-200 text-red-800',
          critical: 'bg-red-100 border-red-300 text-red-900'
        };

        return (
          <div key={error.id} className={`p-3 border rounded-lg ${colorClasses[error.severity]}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium uppercase">{error.type}</span>
                  <span className="text-xs bg-white bg-opacity-60 px-1.5 py-0.5 rounded">
                    {error.severity}
                  </span>
                </div>
                <p className="text-sm">{error.userMessage}</p>
                <p className="text-xs opacity-75 mt-1">
                  {error.timestamp.toLocaleTimeString()} | {error.context}
                </p>
              </div>
              <button
                onClick={() => dispatch('dismissError', { errorId: error.id })}
                className="ml-3 text-lg hover:opacity-75"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotificationToast() {
  const uiStore = useStore('ui');
  const ui = useStoreValue(uiStore);

  if (ui.notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {ui.notifications.slice(0, 3).map((notification) => {
        const colorClasses = {
          success: 'bg-green-500 text-white',
          error: 'bg-red-500 text-white',
          warning: 'bg-yellow-500 text-white',
          info: 'bg-blue-500 text-white'
        };

        return (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-lg shadow-lg max-w-sm ${colorClasses[notification.type]}`}
          >
            <p className="text-sm">{notification.message}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ComprehensiveErrorDemo() {
  return (
    <ContextActionErrorBoundary
      fallbackComponent={({ error, resetError }) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">애플리케이션 오류</h2>
          <p className="text-red-700 mb-4">예상치 못한 오류가 발생했습니다.</p>
          <div className="bg-red-100 p-3 rounded mb-4">
            <code className="text-sm text-red-800">{error.message}</code>
          </div>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}
    >
      <StoreProvider>
        <ActionProvider>
          <ECommerceLogic>
            <div className="p-6 max-w-6xl mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  🛒 Comprehensive Error Demo
                </h1>
                <p className="text-lg text-gray-600">
                  E-commerce 쇼핑몰 시나리오로 실제 애플리케이션의 종합적인 에러 처리를 체험해보세요.
                  다양한 에러 상황과 복구 메커니즘을 실습할 수 있습니다.
                </p>
              </header>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <LoginForm />
                  <ProductList />
                </div>
                
                <div className="space-y-6">
                  <ShoppingCart />
                  <ErrorDisplay />
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  🎯 테스트 시나리오
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• <strong>로그인 실패:</strong> 비밀번호에 "wrong" 입력</p>
                  <p>• <strong>네트워크 에러:</strong> 상품 목록 새로고침 (20% 확률)</p>
                  <p>• <strong>재고 부족:</strong> 동일 상품을 재고보다 많이 담기</p>
                  <p>• <strong>결제 실패:</strong> 주문하기 버튼 (30% 확률)</p>
                  <p>• <strong>DevTools:</strong> Redux DevTools에서 실시간 에러 추적</p>
                </div>
              </div>

              <NotificationToast />
            </div>
          </ECommerceLogic>
        </ActionProvider>
      </StoreProvider>
    </ContextActionErrorBoundary>
  );
}