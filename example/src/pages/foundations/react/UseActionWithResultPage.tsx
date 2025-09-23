/**
 * Integration Point - UseActionWithResultPage (5-Layer Architecture)
 *
 * This demonstrates the complete 5-layer architecture implementation
 * with useActionWithResult integration:
 * 1. Sets up all Context Providers
 * 2. Injects dependencies into Handlers via props (DI Pattern)
 * 3. Coordinates between different layers
 * 4. Showcases useActionWithResult with structured layers
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  CartActionProvider,
  CartStoreProvider,
  type CartItem,
} from './useActionWithResult/contexts/CartContexts';
import { CartHandlers } from './useActionWithResult/handlers/CartHandlers';
import { useCartActions, useCartActionCallbacks } from './useActionWithResult/actions/useCartActions';
import { useCartData, useCartFormData, useCartStatistics } from './useActionWithResult/hooks/useCartData';
import {
  CartListView,
  AddItemForm,
  ValidationView,
  CalculationView,
  OrderStatusView,
  CheckoutForm,
  CartStatisticsView,
} from './useActionWithResult/views/CartView';
import { addItemToCart, removeItemFromCart, updateItemQuantity } from './useActionWithResult/business/cartBusinessLogic';

// 🎯 Mock external dependencies for demonstration
const mockApiClient = {
  saveOrder: async (orderData: any) => {
    console.log('🌐 API: Saving order', orderData);
    await new Promise(resolve => setTimeout(resolve, 800));
  },
  updateInventory: async (items: CartItem[]) => {
    console.log('🌐 API: Updating inventory', items);
    await new Promise(resolve => setTimeout(resolve, 600));
  },
  applyDiscountCode: async (code: string) => {
    console.log('🌐 API: Validating discount code', code);
    await new Promise(resolve => setTimeout(resolve, 400));
    return { valid: ['SAVE10', 'SAVE20', 'WELCOME'].includes(code.toUpperCase()), rate: 0.1 };
  },
};

const mockLogger = {
  info: (message: string, data?: any) => {
    console.log(`📝 [Cart] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`❌ [Cart] ${message}`, error);
  },
};

/**
 * Main UseActionWithResult Example Component
 *
 * Demonstrates the complete 5-layer architecture with useActionWithResult integration
 */
export default function UseActionWithResultPage() {
  return (
    <CartActionProvider>
      <CartStoreProvider>
        <UseActionWithResultWithHandlers />
      </CartStoreProvider>
    </CartActionProvider>
  );
}

/**
 * Component with Handler Registration
 *
 * This component demonstrates the key pattern:
 * - Gets store references from context
 * - Injects them into handlers via props (Handler Injection Pattern)
 * - Handlers register themselves using useActionHandler within context boundaries
 */
function UseActionWithResultWithHandlers() {
  // 🎯 Get store references for dependency injection
  const { stores } = useCartData();

  return (
    <CartHandlers
      moduleId="use-action-with-result-demo"
      cartStore={stores.cartStore}
      validationStore={stores.validationStore}
      calculationStore={stores.calculationStore}
      orderStore={stores.orderStore}
      apiClient={mockApiClient}
      logger={mockLogger}
      onCartValidated={(result) => console.log('🎉 Cart validated:', result)}
      onOrderProcessed={(result) => console.log('📦 Order processed:', result)}
      onCalculationCompleted={(result) => console.log('💰 Calculation completed:', result)}
      onCartCleared={() => console.log('🗑️ Cart cleared')}
    >
      <UseActionWithResultUI />
    </CartHandlers>
  );
}

/**
 * Main UI Component
 *
 * Demonstrates how the layers work together:
 * - Uses hooks for data access (Hook Layer)
 * - Uses actions for behavior (Action Layer)
 * - Uses pure view components (View Layer)
 * - Business logic is handled in handlers (Handler Layer)
 * - Pure business functions are in business layer (Business Layer)
 */
function UseActionWithResultUI() {
  // 🎯 State management
  const [currentView, setCurrentView] = useState<'demo' | 'advanced'>('demo');
  const [workflowStep, setWorkflowStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<string>('');

  // 🎯 Hook Layer - Data subscriptions
  const {
    cart,
    validation,
    calculation,
    order,
    cartSummary,
    canCheckout,
    isOrderProcessing,
    stores,
  } = useCartData();

  const { formValidation } = useCartFormData();
  const { statistics } = useCartStatistics();

  // 🎯 Action Layer - Behavior with callbacks
  const {
    validateCartWithCallbacks,
    calculateTotalWithCallbacks,
    completeCheckoutWithCallbacks,
    clearCart,
  } = useCartActionCallbacks();

  // 🎯 Event Handlers for Cart Management
  const handleAddItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    stores.cartStore.update((currentCart) => addItemToCart(currentCart, newItem));
  }, [stores.cartStore]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    stores.cartStore.update((currentCart) => updateItemQuantity(currentCart, itemId, quantity));
  }, [stores.cartStore]);

  const handleRemoveItem = useCallback((itemId: string) => {
    stores.cartStore.update((currentCart) => removeItemFromCart(currentCart, itemId));
  }, [stores.cartStore]);

  // 🎯 useActionWithResult Demo Functions
  const handleValidateCart = useCallback(async () => {
    console.clear();
    console.log('🔍 Validating Cart (Individual Execution)');
    setIsProcessing(true);
    setResults('');

    try {
      const result = await validateCartWithCallbacks(cart, {
        onSuccess: () => console.log('✅ Validation succeeded'),
        onError: (error) => console.error('❌ Validation failed:', error),
      });

      setResults(JSON.stringify({
        success: result.success,
        validation: validation,
        timestamp: new Date().toISOString(),
      }, null, 2));

    } catch (error) {
      console.error('Validation error:', error);
      setResults(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, validateCartWithCallbacks, validation]);

  const handleCalculateTotal = useCallback(async (discountCode?: string) => {
    console.clear();
    console.log('💰 Calculating Total with useActionWithResult');
    setIsProcessing(true);

    try {
      const result = await calculateTotalWithCallbacks(cart, discountCode, {
        onSuccess: () => console.log('✅ Calculation succeeded'),
        onError: (error) => console.error('❌ Calculation failed:', error),
      });

      setResults(JSON.stringify({
        success: result.success,
        calculation: calculation,
        discountApplied: !!discountCode,
        timestamp: new Date().toISOString(),
      }, null, 2));

    } catch (error) {
      console.error('Calculation error:', error);
      setResults(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, calculateTotalWithCallbacks, calculation]);

  const handleCompleteWorkflow = useCallback(async (paymentMethod: string, discountCode?: string) => {
    console.clear();
    console.log('🚀 Complete Workflow with Progress Tracking');
    setIsProcessing(true);
    setWorkflowStep('Starting...');

    try {
      const result = await completeCheckoutWithCallbacks(cart, paymentMethod, discountCode, {
        onValidationStart: () => setWorkflowStep('🔍 Validating cart...'),
        onValidationComplete: () => setWorkflowStep('✅ Validation complete'),
        onCalculationStart: () => setWorkflowStep('💰 Calculating total...'),
        onCalculationComplete: () => setWorkflowStep('✅ Calculation complete'),
        onOrderStart: () => setWorkflowStep('📦 Processing order...'),
        onOrderComplete: () => setWorkflowStep('✅ Order complete'),
        onSuccess: () => {
          setWorkflowStep('🎉 Workflow completed successfully!');
          console.log('🎉 Complete workflow succeeded');
        },
        onError: (error, step) => {
          setWorkflowStep(`❌ Failed at ${step}: ${error}`);
          console.error(`❌ Workflow failed at ${step}:`, error);
        },
      });

      setResults(JSON.stringify({
        success: result.success,
        step: 'step' in result ? result.step : 'unknown',
        finalState: {
          validation,
          calculation,
          order,
        },
        timestamp: new Date().toISOString(),
      }, null, 2));

    } catch (error) {
      console.error('Workflow error:', error);
      setResults(`Error: ${error}`);
      setWorkflowStep(`❌ Workflow failed: ${error}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setWorkflowStep(''), 3000);
    }
  }, [cart, completeCheckoutWithCallbacks, validation, calculation, order]);

  const handleClearCart = useCallback(async () => {
    await clearCart();
    setResults('');
    setWorkflowStep('');
    console.log('🗑️ Cart cleared');
  }, [clearCart]);

  // 🎯 Sample data for testing
  const addSampleItems = useCallback(() => {
    const sampleItems = [
      { name: 'MacBook Pro', price: 2499, quantity: 1 },
      { name: 'iPhone 15', price: 999, quantity: 2 },
      { name: 'AirPods Pro', price: 249, quantity: 1 },
    ];

    // Use store.update() for safer state updates with current value
    stores.cartStore.update((currentCart) => {
      let updatedCart = currentCart;
      sampleItems.forEach(item => {
        updatedCart = addItemToCart(updatedCart, item);
      });
      return updatedCart;
    });
  }, [stores.cartStore]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">useActionWithResult Demo</h1>
            <p className="text-sm text-gray-600">
              5-Layer Architecture with Action Result Collection & Handler Injection Pattern
            </p>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('demo')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                ${currentView === 'demo'
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <span className="text-lg">🚀</span>
              Demo Mode
            </button>
            <button
              onClick={() => setCurrentView('advanced')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                ${currentView === 'advanced'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <span className="text-lg">⚙️</span>
              Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      {workflowStep && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="font-medium text-blue-800">{workflowStep}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - Cart Management & Statistics */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={addSampleItems}
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
              >
                Add Sample Items
              </button>
              <button
                onClick={handleClearCart}
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Cart Statistics */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <CartStatisticsView statistics={statistics} />
          </div>

          {/* Validation Status */}
          {validation && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <ValidationView validation={validation} />
            </div>
          )}
        </div>

        {/* Right Column - Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {currentView === 'demo' && (
            <>
              {/* Add Item Form */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 border-b">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>🛒</span>
                    Cart Management
                  </h3>
                </div>
                <div className="p-6">
                  <AddItemForm onAddItem={handleAddItem} disabled={isProcessing} />
                </div>
              </div>

              {/* Cart Items */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <span>📋</span>
                      Shopping Cart
                    </h3>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {cartSummary.itemCount} items
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <CartListView
                    items={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* useActionWithResult Demo Buttons */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-blue-100 p-4 border-b">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>🚀</span>
                    useActionWithResult Demos
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={handleValidateCart}
                      disabled={isProcessing || cart.length === 0}
                      className="flex flex-col items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl">🔍</span>
                      <div className="text-center">
                        <div className="font-medium text-blue-800">Validate Cart</div>
                        <div className="text-xs text-blue-600">Individual execution</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleCalculateTotal('SAVE10')}
                      disabled={isProcessing || cart.length === 0}
                      className="flex flex-col items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl">💰</span>
                      <div className="text-center">
                        <div className="font-medium text-green-800">Calculate Total</div>
                        <div className="text-xs text-green-600">With discount code</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleCompleteWorkflow('credit_card', 'SAVE10')}
                      disabled={isProcessing || cart.length === 0 || !canCheckout}
                      className="flex flex-col items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl">🎯</span>
                      <div className="text-center">
                        <div className="font-medium text-purple-800">Complete Workflow</div>
                        <div className="text-xs text-purple-600">Full checkout process</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentView === 'advanced' && (
            <>
              {/* Calculation Result */}
              {calculation && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <CalculationView calculation={calculation} />
                </div>
              )}

              {/* Order Status */}
              {order?.orderId && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <OrderStatusView order={order} />
                </div>
              )}

              {/* Checkout Form */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-4 border-b">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>💳</span>
                    Advanced Checkout
                  </h3>
                </div>
                <div className="p-6">
                  <CheckoutForm
                    onCheckout={(paymentMethod, discountCode) =>
                      handleCompleteWorkflow(paymentMethod, discountCode)
                    }
                    disabled={!canCheckout}
                    isProcessing={isOrderProcessing}
                  />
                </div>
              </div>
            </>
          )}

          {/* Results Panel */}
          {results && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <span>📊</span>
                  Action Results
                </h3>
              </div>
              <div className="p-6">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                  {results}
                </pre>
              </div>
            </div>
          )}

          {/* Feature Explanation */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>✨</span>
              5-Layer Architecture Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-indigo-800 mb-2">🎯 Action Result Collection</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Automatic handler result collection</li>
                  <li>• Execution time and success/failure tracking</li>
                  <li>• Rich metadata and error information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-800 mb-2">🏗️ Layer Separation</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Business logic in pure functions</li>
                  <li>• Handler injection with dependencies</li>
                  <li>• Pure UI components with event handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-800 mb-2">🔄 State Management</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Reactive store subscriptions</li>
                  <li>• Computed values and derived state</li>
                  <li>• Type-safe store integration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-800 mb-2">⚡ Enhanced Workflow</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Progress tracking with callbacks</li>
                  <li>• Error handling at each step</li>
                  <li>• Comprehensive result collection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}