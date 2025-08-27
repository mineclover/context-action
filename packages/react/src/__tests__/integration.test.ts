/**
 * Integration tests combining all three major systems:
 * - Testing Utilities (MockStore, async helpers)
 * - DevTools Integration (monitoring, logging)
 * - Error Handling (ErrorBoundary, error recovery)
 */

import { setupDevTools, connectStore, withDevToolsAction, resetDevToolsState } from '../devtools/setup';
import { globalDevTools } from '../devtools/devtools-manager';
import { createMockStore } from '../testing/mock-store';
import { waitForStoreUpdate, BatchAsyncManager, createBatchAsyncManager } from '../testing/async-helpers';
import { ContextActionErrorBoundary, createErrorHandler, ErrorCategory } from '../utils/error-boundary';
import { Store } from '../stores/core/Store';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import React from 'react';

// Mock React for testing
jest.mock('react', () => ({
  useEffect: jest.fn((effect, deps) => {
    const cleanup = effect();
    return cleanup;
  }),
  createElement: jest.fn((type, props) => ({ type, props })),
  Component: class MockComponent {
    constructor(props: any) {
      Object.assign(this, props);
    }
  }
}));

// Global setup
beforeEach(() => {
  jest.clearAllMocks();
  globalDevTools.dispose();
  resetDevToolsState();
});

describe('Integration: Testing Utilities + DevTools + Error Handling', () => {
  describe('MockStore with DevTools Integration', () => {
    test('MockStore automatically connects to DevTools when auto-connect is enabled', () => {
      // Setup DevTools with auto-connect
      setupDevTools({
        enabled: true,
        autoConnectStores: true
      });

      // Create MockStore
      const mockStore = createMockStore({
        initialValue: { count: 0, status: 'idle' },
        enableLogging: true,
        storeId: 'test-counter-store'
      });

      // MockStore should be auto-connected to DevTools
      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['test-counter-store']).toBeDefined();
      expect(snapshot.stores['test-counter-store'].value).toEqual({ count: 0, status: 'idle' });

      // Operations should be logged in DevTools
      mockStore.setValue({ count: 1, status: 'active' });

      const updatedSnapshot = globalDevTools.getStateSnapshot();
      expect(updatedSnapshot.stores['test-counter-store'].value).toEqual({ count: 1, status: 'active' });

      // Check MockStore stats
      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(1);

      // DevTools should have logged actions
      const actions = updatedSnapshot.actions;
      expect(actions.length).toBeGreaterThan(0);

      mockStore.dispose?.();
    });

    test('MockStore with DevTools action wrapping', async () => {
      setupDevTools({ enabled: true });
      
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: true,
        storeId: 'action-store'
      });

      // Connect store manually for more control
      const unsubscribe = connectStore(mockStore, 'action-store');

      // Wrap action with DevTools monitoring
      const incrementAction = withDevToolsAction('increment', (amount: number) => {
        const currentValue = mockStore.getValue();
        mockStore.setValue(currentValue + amount);
        return currentValue + amount;
      });

      // Execute wrapped action
      const result = incrementAction(5);

      expect(result).toBe(5);
      expect(mockStore.getValue()).toBe(5);

      // Check DevTools logged the action
      const snapshot = globalDevTools.getStateSnapshot();
      const dispatchAction = snapshot.actions.find(a => a.type === '@context-action/ACTION_DISPATCH');
      const completeAction = snapshot.actions.find(a => a.type === '@context-action/ACTION_COMPLETE');

      expect(dispatchAction?.payload.actionName).toBe('increment');
      expect(completeAction?.payload.result).toBe(5);

      // Check MockStore stats
      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(1);

      unsubscribe();
      mockStore.dispose?.();
    });
  });

  describe('Error Handling with DevTools and Testing', () => {
    test('ErrorBoundary integrates with DevTools error logging', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      setupDevTools({ enabled: true });

      const errorBoundary = new ContextActionErrorBoundary({
        fallbackComponent: () => ({ type: 'div', props: { children: 'Error occurred' } }),
        onError: (error, errorInfo) => {
          // Errors should be logged to DevTools
          globalDevTools.logError(error.message, {
            componentStack: errorInfo.componentStack,
            category: 'component-error'
          });
        }
      });

      const testError = new Error('Test component error');

      // Simulate error boundary catching an error
      const result = errorBoundary.componentDidCatch(testError, {
        componentStack: 'TestComponent > App'
      });

      // Check DevTools received error log
      const snapshot = globalDevTools.getStateSnapshot();
      const errorActions = snapshot.actions.filter(a => a.type === '@context-action/ERROR');
      expect(errorActions.length).toBeGreaterThan(0);
      expect(errorActions[0].payload.message).toBe('Test component error');

      consoleSpy.mockRestore();
    });

    test('MockStore error handling with DevTools integration', async () => {
      setupDevTools({ enabled: true });

      const mockStore = createMockStore({
        initialValue: { data: null, error: null },
        enableLogging: true,
        storeId: 'error-test-store'
      });

      connectStore(mockStore, 'error-test-store');

      // Create error handler
      const errorHandler = createErrorHandler({
        onError: (error, context) => {
          // Update store with error
          mockStore.update(state => ({
            ...state,
            error: error.message
          }));

          // Log to DevTools
          globalDevTools.logError(error.message, {
            context: context?.context || 'unknown',
            category: context?.category || ErrorCategory.UNKNOWN
          });
        }
      });

      // Simulate error
      const testError = new Error('Async operation failed');
      await errorHandler.handleError(testError, {
        context: 'async-operation',
        category: ErrorCategory.ASYNC
      });

      // Check store was updated with error
      const storeValue = mockStore.getValue();
      expect(storeValue.error).toBe('Async operation failed');

      // Check DevTools logged the error
      const snapshot = globalDevTools.getStateSnapshot();
      const errorActions = snapshot.actions.filter(a => a.type === '@context-action/ERROR');
      expect(errorActions.length).toBeGreaterThan(0);

      // Check MockStore stats
      const stats = mockStore.getStats();
      expect(stats.updateCalls).toBe(1);

      mockStore.dispose?.();
    });
  });

  describe('Async Testing with DevTools and Error Recovery', () => {
    test('BatchAsyncManager with DevTools monitoring and error recovery', async () => {
      setupDevTools({ enabled: true });

      const userStore = createMockStore({
        initialValue: { id: null, name: '', status: 'idle' },
        enableLogging: true,
        storeId: 'user-store'
      });

      const logStore = createMockStore({
        initialValue: { logs: [] as string[] },
        enableLogging: true,
        storeId: 'log-store'
      });

      connectStore(userStore, 'user-store');
      connectStore(logStore, 'log-store');

      const manager = createBatchAsyncManager();

      // Create error handler for recovery
      const errorHandler = createErrorHandler({
        onError: (error, context) => {
          logStore.update(state => ({
            logs: [...state.logs, `Error: ${error.message}`]
          }));
        }
      });

      // Add successful operation
      manager.addStoreUpdate(
        userStore,
        (value) => value.status === 'loaded',
        'user-load-success'
      );

      // Add failing operation with recovery
      const failingPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          const error = new Error('Network timeout');
          errorHandler.handleError(error, {
            context: 'user-fetch',
            category: ErrorCategory.NETWORK
          });
          reject(error);
        }, 50);
      });

      manager.add(failingPromise, 'failing-operation', 200);

      // Start successful operation
      setTimeout(() => {
        userStore.setValue({ id: 1, name: 'John', status: 'loaded' });
      }, 25);

      // Wait for success, expect failure
      const results = await Promise.allSettled([
        manager.waitAny(), // Should resolve with user store update
      ]);

      expect(results[0].status).toBe('fulfilled');
      
      // Check error was logged
      const logValue = logStore.getValue();
      expect(logValue.logs).toContain('Error: Network timeout');

      // Check DevTools captured both success and error
      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['user-store'].value.status).toBe('loaded');
      expect(snapshot.stores['log-store'].value.logs.length).toBeGreaterThan(0);

      // Check error was logged to DevTools
      const errorActions = snapshot.actions.filter(a => a.type === '@context-action/ERROR');
      expect(errorActions.length).toBeGreaterThan(0);

      userStore.dispose?.();
      logStore.dispose?.();
    });

    test('Complex integration: Store operations, DevTools, error recovery, and async testing', async () => {
      // Setup comprehensive environment
      setupDevTools({
        enabled: true,
        enablePerformanceMonitoring: true,
        maxActions: 100
      });

      // Create application stores
      const appStore = createMockStore({
        initialValue: { 
          user: { id: null, name: '' },
          ui: { loading: false, error: null },
          data: { items: [] }
        },
        enableLogging: true,
        storeId: 'app-store'
      });

      connectStore(appStore, 'app-store');

      // Error handling setup
      const errorHandler = createErrorHandler({
        onError: (error, context) => {
          appStore.update(state => ({
            ...state,
            ui: { ...state.ui, error: error.message, loading: false }
          }));
        }
      });

      // Create DevTools-wrapped actions
      const loginAction = withDevToolsAction('user-login', async (userData: { id: number; name: string }) => {
        // Set loading state
        appStore.update(state => ({
          ...state,
          ui: { ...state.ui, loading: true, error: null }
        }));

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 50));

        // Update user data
        appStore.update(state => ({
          ...state,
          user: userData,
          ui: { ...state.ui, loading: false }
        }));

        return userData;
      });

      const loadDataAction = withDevToolsAction('load-data', async () => {
        // Simulate potential failure
        if (Math.random() > 0.7) {
          throw new Error('Data load failed');
        }

        const data = { items: [{ id: 1, name: 'Item 1' }] };
        appStore.update(state => ({
          ...state,
          data
        }));

        return data;
      });

      // Test successful flow
      const loginResult = await loginAction({ id: 1, name: 'John Doe' });
      expect(loginResult.name).toBe('John Doe');

      // Wait for store update
      await waitForStoreUpdate(
        appStore,
        (state) => state.user.id === 1,
        1000
      );

      // Test error recovery
      try {
        await loadDataAction();
      } catch (error) {
        await errorHandler.handleError(error as Error, {
          context: 'data-loading',
          category: ErrorCategory.ASYNC
        });
      }

      // Verify final state
      const finalState = appStore.getValue();
      expect(finalState.user.name).toBe('John Doe');
      expect(finalState.ui.loading).toBe(false);

      // Check DevTools captured everything
      const snapshot = globalDevTools.getStateSnapshot();
      
      // Should have login and data load actions
      const dispatchActions = snapshot.actions.filter(a => a.type === '@context-action/ACTION_DISPATCH');
      expect(dispatchActions.length).toBeGreaterThanOrEqual(1);
      expect(dispatchActions.some(a => a.payload.actionName === 'user-login')).toBe(true);

      // Check performance monitoring
      const performanceReport = globalDevTools.getPerformanceReport();
      expect(performanceReport.totalActions).toBeGreaterThan(0);

      // Check MockStore statistics
      const stats = appStore.getStats();
      expect(stats.updateCalls).toBeGreaterThan(0);
      expect(stats.totalOperations).toBeGreaterThan(0);

      appStore.dispose?.();
    });
  });

  describe('Registry Integration with DevTools and Error Handling', () => {
    test('StoreRegistry with DevTools and error boundary integration', () => {
      setupDevTools({ enabled: true });

      const registry = new StoreRegistry('integration-test-registry');
      
      // Create stores with error-prone operations
      const store1 = new Store('store1', { value: 0, valid: true });
      const store2 = createMockStore({
        initialValue: { data: 'initial' },
        enableLogging: true,
        storeId: 'store2'
      });

      registry.register('store1', store1);
      registry.register('store2', store2);

      // Connect entire registry to DevTools
      const unsubscribe = connectStore(store1, 'registry-store1');
      const unsubscribe2 = connectStore(store2, 'registry-store2');

      // Error boundary for registry operations
      const errorBoundary = new ContextActionErrorBoundary({
        fallbackComponent: () => ({ type: 'div', props: { children: 'Registry error' } }),
        onError: (error, errorInfo) => {
          globalDevTools.logError(error.message, {
            context: 'registry-operation',
            componentStack: errorInfo.componentStack
          });
        }
      });

      // Simulate registry operations
      store1.setValue({ value: 10, valid: true });
      store2.setValue({ data: 'updated' });

      // Check DevTools state
      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['registry-store1']).toBeDefined();
      expect(snapshot.stores['registry-store2']).toBeDefined();
      expect(snapshot.stores['registry-store1'].value).toEqual({ value: 10, valid: true });
      expect(snapshot.stores['registry-store2'].value).toEqual({ data: 'updated' });

      // Check MockStore stats
      const stats = store2.getStats();
      expect(stats.setValueCalls).toBe(1);

      // Cleanup
      unsubscribe();
      unsubscribe2();
      store1.dispose?.();
      store2.dispose?.();
    });
  });
});

describe('Real-world Integration Scenarios', () => {
  test('E-commerce cart with DevTools, error handling, and testing utilities', async () => {
    // Comprehensive e-commerce cart integration test
    setupDevTools({
      enabled: true,
      enablePerformanceMonitoring: true
    });

    // Application stores
    const cartStore = createMockStore({
      initialValue: { items: [] as any[], total: 0 },
      enableLogging: true,
      storeId: 'cart-store'
    });

    const uiStore = createMockStore({
      initialValue: { loading: false, error: null, notifications: [] as string[] },
      enableLogging: true,
      storeId: 'ui-store'
    });

    connectStore(cartStore, 'cart');
    connectStore(uiStore, 'ui');

    // Error handling
    const errorHandler = createErrorHandler({
      onError: (error, context) => {
        uiStore.update(state => ({
          ...state,
          error: error.message,
          loading: false
        }));
      }
    });

    // DevTools-wrapped business actions
    const addToCart = withDevToolsAction('add-to-cart', async (item: { id: string; price: number; name: string }) => {
      uiStore.update(state => ({ ...state, loading: true, error: null }));

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 30));
        
        cartStore.update(cart => ({
          items: [...cart.items, item],
          total: cart.total + item.price
        }));

        uiStore.update(state => ({
          ...state,
          loading: false,
          notifications: [...state.notifications, `Added ${item.name} to cart`]
        }));

        return { success: true, item };
      } catch (error) {
        await errorHandler.handleError(error as Error, {
          context: 'add-to-cart',
          category: ErrorCategory.ASYNC
        });
        throw error;
      }
    });

    const checkout = withDevToolsAction('checkout', async () => {
      const cart = cartStore.getValue();
      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      uiStore.update(state => ({ ...state, loading: true }));

      try {
        // Simulate checkout process
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Clear cart on success
        cartStore.setValue({ items: [], total: 0 });
        
        uiStore.update(state => ({
          ...state,
          loading: false,
          notifications: [...state.notifications, 'Checkout successful!']
        }));

        return { orderId: 'order-123', total: cart.total };
      } catch (error) {
        await errorHandler.handleError(error as Error, {
          context: 'checkout',
          category: ErrorCategory.ASYNC
        });
        throw error;
      }
    });

    // Test the flow
    const manager = createBatchAsyncManager();

    // Add items to cart
    const item1 = await addToCart({ id: '1', price: 10, name: 'Widget' });
    const item2 = await addToCart({ id: '2', price: 20, name: 'Gadget' });

    // Wait for cart updates
    await waitForStoreUpdate(cartStore, (cart) => cart.items.length === 2);

    // Verify cart state
    const cartState = cartStore.getValue();
    expect(cartState.items).toHaveLength(2);
    expect(cartState.total).toBe(30);

    // Test checkout
    const checkoutResult = await checkout();
    expect(checkoutResult.orderId).toBe('order-123');
    expect(checkoutResult.total).toBe(30);

    // Wait for cart to be cleared
    await waitForStoreUpdate(cartStore, (cart) => cart.items.length === 0);

    // Verify final states
    expect(cartStore.getValue().items).toHaveLength(0);
    expect(cartStore.getValue().total).toBe(0);

    const uiState = uiStore.getValue();
    expect(uiState.notifications).toContain('Checkout successful!');
    expect(uiState.loading).toBe(false);

    // Check DevTools integration
    const snapshot = globalDevTools.getStateSnapshot();
    
    // Should have all actions logged
    const actionNames = snapshot.actions
      .filter(a => a.type === '@context-action/ACTION_DISPATCH')
      .map(a => a.payload.actionName);
    
    expect(actionNames).toContain('add-to-cart');
    expect(actionNames).toContain('checkout');

    // Check performance monitoring
    const perfReport = globalDevTools.getPerformanceReport();
    expect(perfReport.totalActions).toBeGreaterThan(0);
    expect(perfReport.averageActionTime).toBeGreaterThan(0);

    // Check MockStore statistics
    const cartStats = cartStore.getStats();
    expect(cartStats.updateCalls).toBeGreaterThan(0);
    expect(cartStats.setValueCalls).toBeGreaterThan(0);

    const uiStats = uiStore.getStats();
    expect(uiStats.updateCalls).toBeGreaterThan(0);

    // Cleanup
    cartStore.dispose?.();
    uiStore.dispose?.();
  });

  test('Error recovery flow with comprehensive integration', async () => {
    setupDevTools({ enabled: true });

    const appStore = createMockStore({
      initialValue: { 
        retryCount: 0, 
        lastError: null, 
        status: 'idle',
        data: null 
      },
      enableLogging: true,
      storeId: 'retry-store'
    });

    connectStore(appStore, 'app');

    const errorHandler = createErrorHandler({
      onError: async (error, context) => {
        appStore.update(state => ({
          ...state,
          lastError: error.message,
          status: 'error'
        }));

        // Auto-retry logic
        const currentState = appStore.getValue();
        if (currentState.retryCount < 3) {
          appStore.update(state => ({
            ...state,
            retryCount: state.retryCount + 1,
            status: 'retrying'
          }));
        }
      }
    });

    const unreliableAction = withDevToolsAction('unreliable-fetch', async (shouldFail = true) => {
      const state = appStore.getValue();
      
      if (shouldFail && state.retryCount < 2) {
        throw new Error(`Attempt ${state.retryCount + 1} failed`);
      }

      // Success case
      appStore.update(currentState => ({
        ...currentState,
        status: 'success',
        data: 'fetched-data',
        lastError: null
      }));

      return 'fetched-data';
    });

    // Test retry flow
    let attempt = 0;
    while (attempt < 3) {
      try {
        await unreliableAction(true);
        break;
      } catch (error) {
        await errorHandler.handleError(error as Error, {
          context: 'data-fetch',
          category: ErrorCategory.NETWORK
        });
        
        // Wait for retry state
        await waitForStoreUpdate(
          appStore,
          (state) => state.retryCount === attempt + 1,
          100
        );
        
        attempt++;
      }
    }

    // Final successful attempt
    await unreliableAction(false);

    // Verify final state
    const finalState = appStore.getValue();
    expect(finalState.status).toBe('success');
    expect(finalState.data).toBe('fetched-data');
    expect(finalState.retryCount).toBeGreaterThan(0);

    // Check DevTools logs
    const snapshot = globalDevTools.getStateSnapshot();
    const errorActions = snapshot.actions.filter(a => a.type === '@context-action/ERROR');
    expect(errorActions.length).toBeGreaterThan(0);

    const successActions = snapshot.actions.filter(
      a => a.type === '@context-action/ACTION_COMPLETE' && !a.payload.error
    );
    expect(successActions.length).toBeGreaterThan(0);

    appStore.dispose?.();
  });
});