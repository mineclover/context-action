/**
 * @fileoverview CoreIntegrationPage - ARCHITECTURE.md 패턴을 따른 완전한 리팩토링
 * Action-Store 통합 데모: MVVM 패턴 구현
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Store, 
  StoreProvider, 
  useStoreRegistry, 
  useStoreValue,
  ActionProvider,
  useActionDispatch,
  useActionRegister,
  ActionPayloadMap,
} from '@context-action/react';
import { useActionGuard, ACTION_PATTERNS, GUARD_PRESETS } from '../../hooks';

// ============================================
// Type Definitions (Following ARCHITECTURE.md)
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  updatedAt?: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  couponCode?: string;
}

interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface Inventory {
  [productId: string]: number;
}

interface UIState {
  loading: boolean;
  error?: string;
}

interface Activity {
  type: string;
  timestamp: number;
  userId?: string;
  data?: any;
}

// Action payload definitions (Strong typing per ARCHITECTURE.md)
interface AppActions extends ActionPayloadMap {
  // User actions
  updateUser: Partial<User>;
  loginUser: { email: string; password: string };
  logoutUser: void;
  
  // Cart actions
  addToCart: { productId: string; name: string; price: number; quantity: number };
  removeFromCart: { productId: string };
  updateQuantity: { productId: string; quantity: number };
  applyCoupon: { code: string };
  
  // Order actions
  calculateTotals: void;
  checkout: { paymentMethod: string };
  
  // Inventory actions
  checkInventory: { productId: string };
  
  // Activity tracking
  logActivity: { type: string; data?: any };
}

// ============================================
// Store Setup Hook (Following ARCHITECTURE.md)
// ============================================

function useStoreSetup() {
  const registry = useStoreRegistry();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    // 이미 초기화되었거나 store가 이미 존재하면 건너뛰기
    if (initialized || registry.getStore('user')) {
      console.log('🏪 Stores already initialized, skipping...');
      return;
    }

    console.log('🏪 Starting store initialization...');
    
    // Initialize all stores
    registry.register('user', new Store<User | null>('user', {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    }));
    
    registry.register('cart', new Store<Cart>('cart', {
      items: [],
      couponCode: undefined
    }));
    
    registry.register('totals', new Store<Totals>('totals', {
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0
    }));
    
    registry.register('inventory', new Store<Inventory>('inventory', {
      'p1': 5,
      'p2': 10,
      'p3': 3
    }));
    
    registry.register('ui', new Store<UIState>('ui', {
      loading: false, // ✅ 로딩 상태를 false로 변경
      error: undefined
    }));

    registry.register('activities', new Store<Activity[]>('activities', []));
    
    if (isMounted) {
      setInitialized(true);
      console.log('✅ Store initialization completed!');
    }
    
    return () => {
      isMounted = false;
      // StrictMode에서 클린업하지 않도록 조건부 클린업
      if (process.env.NODE_ENV !== 'development') {
        setInitialized(false);
        console.log('🧹 Cleaning up stores...');
        registry.unregister('user');
        registry.unregister('cart');
        registry.unregister('totals');
        registry.unregister('inventory');
        registry.unregister('ui');
        registry.unregister('activities');
      }
    };
  }, []); // 의존성 배열에서 registry 제거하여 중복 실행 방지
}

// ============================================
// Action Handlers (Following ARCHITECTURE.md Patterns)
// ============================================

function useActionHandlers() {
  const actionRegister = useActionRegister<AppActions>();
  const registry = useStoreRegistry();
  const [actionsRegistered, setActionsRegistered] = useState(false);
  const registeredRef = useRef(false);
  
  // ActionGuard 설정 - 쇼핑 관련 액션들에 최적화된 가드 적용
  const guard = useActionGuard<AppActions>({
    ...ACTION_PATTERNS.shopping,
    debug: true // 개발 환경에서 디버깅 로그 출력
  });
  
  useEffect(() => {
    // 이미 등록되었거나 actions가 등록되어 있으면 건너뛰기
    if (actionsRegistered || registeredRef.current) {
      console.log('🎯 Actions already registered, skipping...');
      return;
    }
    
    // 등록 시작 시 바로 플래그 설정하여 중복 방지
    registeredRef.current = true;

    // ✅ Store 등록이 완료될 때까지 대기
    const checkStores = () => {
      const userStore = registry.getStore('user') as Store<User | null>;
      const cartStore = registry.getStore('cart') as Store<Cart>;
      const totalsStore = registry.getStore('totals') as Store<Totals>;
      const inventoryStore = registry.getStore('inventory') as Store<Inventory>;
      const uiStore = registry.getStore('ui') as Store<UIState>;
      const activitiesStore = registry.getStore('activities') as Store<Activity[]>;
      
      if (!userStore || !cartStore || !totalsStore || !inventoryStore || !uiStore || !activitiesStore) {
        console.warn('Stores not ready yet, retrying...', {
          userStore: !!userStore,
          cartStore: !!cartStore,
          totalsStore: !!totalsStore,
          inventoryStore: !!inventoryStore,
          uiStore: !!uiStore,
          activitiesStore: !!activitiesStore
        });
        // 다시 시도
        setTimeout(checkStores, 50);
        return null;
      }
      
      return { userStore, cartStore, totalsStore, inventoryStore, uiStore, activitiesStore };
    };
    
    const initializeActions = async () => {
      const stores = checkStores();
      if (!stores) return;
      
      const { userStore, cartStore, totalsStore, inventoryStore, uiStore, activitiesStore } = stores;
      
      console.log('✅ All stores ready, registering actions...', {
        userStore: userStore.name,
        cartStore: cartStore.name,
        totalsStore: totalsStore.name,
        inventoryStore: inventoryStore.name,
        uiStore: uiStore.name,
        activitiesStore: activitiesStore.name
      });

    // ============================================
    // User Actions (ARCHITECTURE.md Pattern)
    // ============================================
    
    const unregisterUpdateUser = actionRegister.register(
      'updateUser',
      async (payload, controller) => {
        const currentUser = userStore.getValue();
        
        if (!currentUser) {
          controller.abort('No user logged in');
          return;
        }
        
        // Validate email if provided (Business logic in action)
        if (payload.email && !payload.email.includes('@')) {
          uiStore.update(ui => ({ ...ui, error: 'Invalid email format' }));
          controller.abort('Invalid email');
          return;
        }
        
        // Update user store with timestamp
        userStore.setValue({
          ...currentUser,
          ...payload,
          updatedAt: Date.now()
        });
        
        // Log activity (Cross-store coordination)
        activitiesStore.update(activities => [...activities, {
          type: 'user_updated',
          timestamp: Date.now(),
          userId: currentUser.id,
          data: payload
        }]);
        
        // Clear any errors
        uiStore.update(ui => ({ ...ui, error: undefined }));
      },
      { priority: 10, blocking: true }
    );
    
    // ============================================
    // Cart Actions (Complex Business Logic)
    // ============================================
    
    const unregisterAddToCart = actionRegister.register(
      'addToCart',
      async (payload, controller) => {
        // ✅ ActionGuard를 사용한 중복 실행 방지
        if (!guard.canExecute('addToCart', payload)) {
          console.log('🛑 addToCart execution prevented by ActionGuard');
          controller.abort('Duplicate operation prevented by guard');
          return;
        }
        
        try {
          // Get current state from multiple stores (Lazy evaluation)
          const inventory = inventoryStore.getValue();
          const user = userStore.getValue();
          const availableQty = inventory[payload.productId] || 0;
          
          // Business rule: Check inventory
          if (availableQty < payload.quantity) {
            uiStore.update(ui => ({ 
              ...ui, 
              error: `Only ${availableQty} items available` 
            }));
            controller.abort('Insufficient inventory');
            return;
          }
          
          // Business rule: User must be logged in
          if (!user) {
            uiStore.update(ui => ({ 
              ...ui, 
              error: 'Please login to add items to cart' 
            }));
            controller.abort('User not logged in');
            return;
          }
          
          // Update cart (Complex state logic)
          cartStore.update(cart => {
            const existingItem = cart.items.find(
              item => item.productId === payload.productId
            );
            
            if (existingItem) {
              return {
                ...cart,
                items: cart.items.map(item =>
                  item.productId === payload.productId
                    ? { ...item, quantity: item.quantity + payload.quantity }
                    : item
                )
              };
            } else {
              return {
                ...cart,
                items: [...cart.items, payload]
              };
            }
          });
          
          // Update inventory (Atomic state updates)
          inventoryStore.update(inv => ({
            ...inv,
            [payload.productId]: inv[payload.productId] - payload.quantity
          }));
          
          // Log activity
          activitiesStore.update(activities => [...activities, {
            type: 'item_added_to_cart',
            timestamp: Date.now(),
            userId: user.id,
            data: payload
          }]);
          
          // Trigger totals recalculation (Action chaining)
          await actionRegister.dispatch('calculateTotals');
          
          // ✅ ActionGuard에 실행 완료 기록
          guard.markExecuted('addToCart', payload);
        } catch (error) {
          // 에러 발생 시에도 가드 상태 초기화 (선택사항)
          console.error('addToCart error:', error);
          throw error;
        }
      },
      { priority: 15, blocking: true }
    );
    
    const unregisterRemoveFromCart = actionRegister.register(
      'removeFromCart',
      async (payload, controller) => {
        const cart = cartStore.getValue();
        const user = userStore.getValue();
        const itemToRemove = cart.items.find(
          item => item.productId === payload.productId
        );
        
        if (!itemToRemove) {
          controller.abort('Item not in cart');
          return;
        }
        
        // Update cart
        cartStore.update(cart => ({
          ...cart,
          items: cart.items.filter(item => item.productId !== payload.productId)
        }));
        
        // Return inventory
        inventoryStore.update(inv => ({
          ...inv,
          [payload.productId]: (inv[payload.productId] || 0) + itemToRemove.quantity
        }));
        
        // Log activity
        if (user) {
          activitiesStore.update(activities => [...activities, {
            type: 'item_removed_from_cart',
            timestamp: Date.now(),
            userId: user.id,
            data: { ...payload, quantity: itemToRemove.quantity }
          }]);
        }
        
        // Recalculate totals
        await actionRegister.dispatch('calculateTotals');
      },
      { priority: 15, blocking: true }
    );
    
    // ============================================
    // Calculation Actions (Computed Values Pattern)
    // ============================================
    
    const unregisterCalculateTotals = actionRegister.register(
      'calculateTotals',
      async (payload, controller) => {
        const cart = cartStore.getValue();
        const user = userStore.getValue();
        
        // Calculate subtotal
        const subtotal = cart.items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        );
        
        // Calculate discount (Business rules with multiple store values)
        let discount = 0;
        if (cart.couponCode) {
          // Simple coupon logic
          if (cart.couponCode === 'SAVE10') {
            discount = subtotal * 0.1;
          } else if (cart.couponCode === 'SAVE20') {
            discount = subtotal * 0.2;
          }
        }
        
        // Admin users get additional 5% discount (Cross-store business logic)
        if (user?.role === 'admin') {
          discount += subtotal * 0.05;
        }
        
        // Calculate tax (8%)
        const taxableAmount = subtotal - discount;
        const tax = taxableAmount * 0.08;
        
        // Update totals store (Atomic update)
        totalsStore.setValue({
          subtotal,
          discount,
          tax,
          total: taxableAmount + tax
        });
      },
      { priority: 5 }
    );
    
    const unregisterApplyCoupon = actionRegister.register(
      'applyCoupon',
      async (payload, controller) => {
        // ✅ ActionGuard를 사용한 중복 실행 방지
        if (!guard.canExecute('applyCoupon', payload)) {
          console.log('🛑 applyCoupon execution prevented by ActionGuard');
          controller.abort('Duplicate operation prevented by guard');
          return;
        }
        
        try {
          // Validate coupon (Business rules)
          const validCoupons = ['SAVE10', 'SAVE20', 'ADMIN'];
          
          if (!validCoupons.includes(payload.code)) {
            uiStore.update(ui => ({ 
              ...ui, 
              error: 'Invalid coupon code' 
            }));
            controller.abort('Invalid coupon');
            return;
          }
          
          // Check if ADMIN coupon is used by non-admin (Authorization logic)
          const user = userStore.getValue();
          if (payload.code === 'ADMIN' && user?.role !== 'admin') {
            uiStore.update(ui => ({ 
              ...ui, 
              error: 'This coupon is for admin users only' 
            }));
            controller.abort('Unauthorized coupon');
            return;
          }
          
          // Apply coupon
          cartStore.update(cart => ({
            ...cart,
            couponCode: payload.code
          }));
          
          // Log activity
          if (user) {
            activitiesStore.update(activities => [...activities, {
              type: 'coupon_applied',
              timestamp: Date.now(),
              userId: user.id,
              data: payload
            }]);
          }
          
          // Clear errors
          uiStore.update(ui => ({ ...ui, error: undefined }));
          
          // Recalculate totals
          await actionRegister.dispatch('calculateTotals');
          
          // ✅ ActionGuard에 실행 완료 기록
          guard.markExecuted('applyCoupon', payload);
        } catch (error) {
          // 에러 발생 시에도 가드 상태 처리
          console.error('applyCoupon error:', error);
          throw error;
        }
      },
      { priority: 10, blocking: true }
    );
    
    // ============================================
    // Async Operations with State Updates (ARCHITECTURE.md Pattern)
    // ============================================
    
    const unregisterCheckout = actionRegister.register(
      'checkout',
      async (payload, controller) => {
        // Set loading state
        uiStore.setValue({ loading: true, error: undefined });
        
        try {
          const cart = cartStore.getValue();
          const totals = totalsStore.getValue();
          const user = userStore.getValue();
          
          if (!user) {
            throw new Error('User not logged in');
          }
          
          if (cart.items.length === 0) {
            throw new Error('Cart is empty');
          }
          
          // Simulate API call (Async operation)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate random failure (20% chance)
          if (Math.random() < 0.2) {
            throw new Error('Payment failed. Please try again.');
          }
          
          // Success - update multiple stores atomically
          cartStore.setValue({ items: [], couponCode: undefined });
          totalsStore.setValue({ subtotal: 0, discount: 0, tax: 0, total: 0 });
          
          // Log successful checkout
          activitiesStore.update(activities => [...activities, {
            type: 'checkout_completed',
            timestamp: Date.now(),
            userId: user.id,
            data: { paymentMethod: payload.paymentMethod, total: totals.total }
          }]);
          
          uiStore.setValue({ 
            loading: false, 
            error: undefined 
          });
          
          // In real app, would redirect to success page
          alert('Order placed successfully!');
          
        } catch (error: any) {
          uiStore.setValue({ 
            loading: false, 
            error: error.message 
          });
          controller.abort(error.message);
        }
      },
      { priority: 20, blocking: true }
    );

    // Activity logging action
    const unregisterLogActivity = actionRegister.register(
      'logActivity',
      async (payload, controller) => {
        const user = userStore.getValue();
        
        activitiesStore.update(activities => [...activities, {
          type: payload.type,
          timestamp: Date.now(),
          userId: user?.id,
          data: payload.data
        }]);
      },
      { priority: 1 }
    );
    
      // Action 등록 완료
      setActionsRegistered(true);
      console.log('🎉 Action registration completed!');
      
      // ✅ 초기 totals 계산 실행 (데모 데이터가 있는 경우)
      setTimeout(() => {
        actionRegister.dispatch('calculateTotals').catch(console.error);
      }, 100);
      
      // Cleanup function
      return () => {
        // StrictMode에서 클린업하지 않도록 조건부 클린업
        if (process.env.NODE_ENV !== 'development') {
          console.log('🧹 Cleaning up actions...');
          registeredRef.current = false;
          setActionsRegistered(false);
          unregisterUpdateUser();
          unregisterAddToCart();
          unregisterRemoveFromCart();
          unregisterCalculateTotals();
          unregisterApplyCoupon();
          unregisterCheckout();
          unregisterLogActivity();
        }
      };
    };
    
    // 초기화 시작
    let cleanupPromise: Promise<(() => void) | void> | null = null;
    
    const startInitialization = async () => {
      cleanupPromise = initializeActions();
    };
    
    startInitialization();
    
    // Cleanup function for useEffect
    return () => {
      if (cleanupPromise) {
        cleanupPromise.then(cleanup => {
          if (cleanup && typeof cleanup === 'function') {
            cleanup();
          }
        });
      }
    };
  }, []); // 의존성 배열을 빈 배열로 변경하여 중복 실행 방지
}

// ============================================
// React Components (View Layer - ARCHITECTURE.md)
// ============================================

function UserProfile() {
  const dispatch = useActionDispatch<AppActions>();
  const registry = useStoreRegistry();
  const userStore = useMemo(() => {
    try {
      return registry.getStore('user') as Store<User | null>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  const user = useStoreValue(userStore);
  
  if (!userStore) return <div style={{ padding: '15px', textAlign: 'center' }}>⏳ Loading user store...</div>;
  if (!user) return <div style={{ padding: '15px', textAlign: 'center' }}>👤 Please login</div>;
  
  // Component usage following ARCHITECTURE.md pattern
  const updateName = (name: string) => {
    dispatch('updateUser', { id: user.id, name });
  };
  
  return (
    <div className="user-profile" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>User Profile</h3>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: <span style={{ fontWeight: 'bold', color: user.role === 'admin' ? '#dc3545' : '#007bff' }}>{user.role}</span></p>
      {user.updatedAt && <p>Last Updated: {new Date(user.updatedAt).toLocaleString()}</p>}
      <button 
        className="btn btn-primary"
        onClick={() => updateName('John Updated')}
      >
        Update Name
      </button>
    </div>
  );
}

function ShoppingCart() {
  const dispatch = useActionDispatch<AppActions>();
  const registry = useStoreRegistry();
  const [couponInput, setCouponInput] = useState('');
  
  // Memoize stores to prevent re-creation on every render
  const cartStore = useMemo(() => {
    try {
      return registry.getStore('cart') as Store<Cart>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  const totalsStore = useMemo(() => {
    try {
      return registry.getStore('totals') as Store<Totals>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  const uiStore = useMemo(() => {
    try {
      return registry.getStore('ui') as Store<UIState>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  
  const cart = useStoreValue(cartStore) || { items: [], couponCode: undefined };
  const totals = useStoreValue(totalsStore) || { subtotal: 0, discount: 0, tax: 0, total: 0 };
  const ui = useStoreValue(uiStore) || { loading: false, error: undefined };
  
  // ✅ 개선된 로딩 상태 처리
  if (!cartStore || !totalsStore || !uiStore) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>⏳ Initializing stores...</div>
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
          Cart: {cartStore ? '✅' : '❌'}, Totals: {totalsStore ? '✅' : '❌'}, UI: {uiStore ? '✅' : '❌'}
        </div>
      </div>
    );
  }
  
  // UI 로딩 상태 확인
  if (ui?.loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔄 Loading application...</div>
      </div>
    );
  }
  
  return (
    <div className="shopping-cart" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Shopping Cart</h3>
      
      {ui?.error && (
        <div className="alert alert-danger" style={{ marginBottom: '15px' }}>
          {ui.error}
        </div>
      )}
      
      {cart.items.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <>
          <div className="cart-items" style={{ marginBottom: '15px' }}>
            {cart.items.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <span>{item.name} - ${item.price} x {item.quantity}</span>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => dispatch('removeFromCart', { productId: item.productId })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="totals" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
            <p>Subtotal: ${totals.subtotal.toFixed(2)}</p>
            {totals.discount > 0 && <p style={{ color: '#28a745' }}>Discount: -${totals.discount.toFixed(2)}</p>}
            <p>Tax: ${totals.tax.toFixed(2)}</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Total: ${totals.total.toFixed(2)}</p>
          </div>
          
          <div className="coupon" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Coupon code (try SAVE10, SAVE20, or ADMIN)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && couponInput) {
                    dispatch('applyCoupon', { code: couponInput });
                    setCouponInput('');
                  }
                }}
              />
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  if (couponInput) {
                    dispatch('applyCoupon', { code: couponInput });
                    setCouponInput('');
                  }
                }}
              >
                Apply
              </button>
            </div>
            {cart.couponCode && <p style={{ marginTop: '5px', color: '#28a745' }}>Applied: {cart.couponCode}</p>}
          </div>
          
          <button 
            className="btn btn-success btn-lg w-100"
            onClick={() => dispatch('checkout', { paymentMethod: 'card' })}
            disabled={ui?.loading}
          >
            {ui?.loading ? 'Processing...' : 'Checkout'}
          </button>
        </>
      )}
    </div>
  );
}

function ProductList() {
  const dispatch = useActionDispatch<AppActions>();
  const registry = useStoreRegistry();
  const inventoryStore = useMemo(() => {
    try {
      return registry.getStore('inventory') as Store<Inventory>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  const inventory = useStoreValue(inventoryStore) || {};
  
  // ✅ UI 컴포넌트에서도 ActionGuard 상태 확인 가능
  const guard = useActionGuard<AppActions>({
    ...ACTION_PATTERNS.shopping,
    debug: false // UI에서는 로그 줄임
  });
  
  if (!inventoryStore) return <div style={{ padding: '15px', textAlign: 'center' }}>⏳ Loading inventory...</div>;
  
  const products = [
    { id: 'p1', name: 'Laptop', price: 999 },
    { id: 'p2', name: 'Mouse', price: 29 },
    { id: 'p3', name: 'Keyboard', price: 79 }
  ];
  
  return (
    <div className="product-list" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Products</h3>
      <div className="products">
        {products.map(product => (
          <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
            <div>
              <strong>{product.name}</strong> - ${product.price}
              <span style={{ marginLeft: '10px', color: (inventory?.[product.id] || 0) > 0 ? '#28a745' : '#dc3545' }}>
                (Stock: {inventory?.[product.id] || 0})
              </span>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => {
                const payload = {
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: 1
                };
                
                // ✅ ActionGuard와 함께 실행
                if (guard.canExecute('addToCart', payload)) {
                  dispatch('addToCart', payload);
                  // 실행 기록은 액션 핸들러에서 처리됨
                } else {
                  // UI에서 사용자에게 피드백 제공
                  const state = guard.getGuardState('addToCart', payload);
                  console.log('🛡️ Action blocked:', state);
                }
              }}
              disabled={(inventory?.[product.id] || 0) === 0}
              style={{
                opacity: guard.canExecute('addToCart', { 
                  productId: product.id, 
                  name: product.name, 
                  price: product.price, 
                  quantity: 1 
                }) ? 1 : 0.7
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLog() {
  const registry = useStoreRegistry();
  const activitiesStore = useMemo(() => {
    try {
      return registry.getStore('activities') as Store<Activity[]>;
    } catch (error) {
      return null;
    }
  }, [registry]);
  const activities = useStoreValue(activitiesStore) || [];
  
  if (!activitiesStore) return <div style={{ padding: '15px', textAlign: 'center' }}>⏳ Loading activities...</div>;
  
  return (
    <div className="activity-log" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Activity Log</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {activities.length === 0 ? (
          <p>No activities yet</p>
        ) : (
          activities.slice(-10).reverse().map((activity, index) => (
            <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', fontSize: '0.9em' }}>
              <strong>{activity.type}</strong> - {new Date(activity.timestamp).toLocaleTimeString()}
              {activity.data && (
                <div style={{ marginTop: '4px', color: '#666' }}>
                  {JSON.stringify(activity.data, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Demo Component (ARCHITECTURE.md Structure)
// ============================================

function IntegrationDemo() {
  const registry = useStoreRegistry();
  const [isReady, setIsReady] = useState(false);
  
  // Setup stores
  useStoreSetup();
  
  // Register action handlers
  useActionHandlers();
  
  // 모든 store가 준비되었는지 확인
  useEffect(() => {
    const checkStoresReady = () => {
      const stores = ['user', 'cart', 'totals', 'inventory', 'ui', 'activities'];
      const allReady = stores.every(storeName => {
        const store = registry.getStore(storeName);
        return !!store;
      });
      
      if (allReady && !isReady) {
        console.log('🎉 All stores ready for rendering!');
        setIsReady(true);
      }
    };
    
    checkStoresReady();
    
    // 주기적으로 확인 (필요한 경우)
    const interval = setInterval(checkStoresReady, 100);
    
    return () => clearInterval(interval);
  }, [registry, isReady]);
  
  if (!isReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Action-Store Integration Demo (ARCHITECTURE.md Pattern)</h2>
        <p>🔄 Initializing stores and actions...</p>
        <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
          Please wait while we set up the demo environment.
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="demo-header" style={{ marginBottom: '30px' }}>
        <h2>Action-Store Integration Demo (ARCHITECTURE.md Pattern)</h2>
        <p className="text-gray-600">
          This demo follows the ARCHITECTURE.md patterns with proper MVVM separation:
          Actions handle business logic, Stores manage state, Components render UI.
        </p>
      </div>
      
      <div className="demo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <UserProfile />
          <ProductList />
        </div>
        
        <div>
          <ShoppingCart />
          <ActivityLog />
        </div>
      </div>
      
      <div className="demo-info" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>ARCHITECTURE.md Patterns Demonstrated:</h4>
        <ul>
          <li><strong>Lazy Evaluation:</strong> Store getters called at execution time for fresh values</li>
          <li><strong>Decoupled Architecture:</strong> Actions don't know about components, stores don't know about actions</li>
          <li><strong>Cross-Store Coordination:</strong> Actions coordinate between user, cart, inventory, and activity stores</li>
          <li><strong>Type Safety:</strong> Full TypeScript support with ActionPayloadMap</li>
          <li><strong>Business Logic in Actions:</strong> Validation, authorization, and complex calculations in action handlers</li>
          <li><strong>Async Operations:</strong> Loading states and error handling in checkout process</li>
          <li><strong>Activity Logging:</strong> Cross-cutting concerns handled through actions</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Page Component (ARCHITECTURE.md Setup)
// ============================================

export function CoreIntegrationPage() {
  return (
    <StoreProvider>
      <ActionProvider>
        <IntegrationDemo />
      </ActionProvider>
    </StoreProvider>
  );
}