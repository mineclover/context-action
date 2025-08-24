import {
  createDeclarativeStorePattern,
  createStore,
  useMultiStoreSelector,
  useStoreValue,
} from '@context-action/react';
import { useCallback, useEffect } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
  Input,
  Section,
  Label,
} from '../../components/ui';

// Demo stores for useStoreSelector patterns
const userStore = createStore('user', { 
  id: '1', 
  name: 'John Doe', 
  email: 'john@example.com',
  role: 'admin',
  score: 85,
  membership: 'premium'
});

const settingsStore = createStore('settings', {
  theme: 'dark',
  language: 'en',
  notifications: true
});

const cartStore = createStore('cart', {
  items: [
    { id: '1', name: 'Laptop', price: 999, quantity: 1 },
    { id: '2', name: 'Mouse', price: 29, quantity: 2 }
  ],
  subtotal: 1057
});

const discountStore = createStore('discount', {
  active: { code: 'SAVE10', amount: 100 }
});

const shippingStore = createStore('shipping', {
  method: 'express',
  cost: 15
});

// Create store pattern for page-level state
const {
  Provider: PageStoreProvider,
  useStore: usePageStore,
} = createDeclarativeStorePattern('UseStoreSelectorPatterns', {
  showAdvanced: { initialValue: false }
});

// Basic Multi-Store Selection Demo
function BasicMultiStoreDemo() {
  const logger = useActionLoggerWithToast();
  
  // Memoized selector to avoid unnecessary recalculations
  const combinedDataSelector = useCallback(
    ([user, settings, cart]: [
      ReturnType<typeof userStore.getValue>,
      ReturnType<typeof settingsStore.getValue>,
      ReturnType<typeof cartStore.getValue>
    ]) => {
      return {
        user: { name: user.name, email: user.email },
        settings: settings.theme,
        cart: cart.items.length
      };
    },
    []
  );
  
  // Select from multiple stores - selector must be pure (no side effects)
  const combinedData = useMultiStoreSelector(
    [userStore, settingsStore, cartStore],
    combinedDataSelector
  );

  // Log selector results safely outside of selector
  useEffect(() => {
    logger.logSystem('🔍 User selector result');
    logger.logSystem('🔍 Settings selector result');
    logger.logSystem('🔍 Cart selector result');
  }, [logger, combinedData]);

  const updateUserName = () => {
    userStore.setValue(prev => ({
      ...prev,
      name: `${prev.name} Updated`
    }));
  };

  const updateTheme = () => {
    settingsStore.update(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const addCartItem = () => {
    cartStore.update(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(),
        name: 'New Item',
        price: Math.floor(Math.random() * 100) + 10,
        quantity: 1
      }]
    }));
  };

  return (
    <DemoCard title="Basic Multi-Store Selection">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">User Info</Label>
            <div className="text-sm">
              <div>Name: {combinedData.user.name}</div>
              <div>Email: {combinedData.user.email}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Settings</Label>
            <div className="text-sm">
              <div>Theme: {combinedData.settings}</div>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Label className="font-semibold">Cart</Label>
            <div className="text-sm">
              <div>Items: {combinedData.cart}</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={updateUserName} variant="primary" size="sm">
            Update User Name
          </Button>
          <Button onClick={updateTheme} variant="secondary" size="sm">
            Toggle Theme
          </Button>
          <Button onClick={addCartItem} variant="outline" size="sm">
            Add Cart Item
          </Button>
        </div>

        <CodeExample>
{`const combinedData = useMultiStoreSelector(
  [userStore, settingsStore, cartStore],
  ([user, settings, cart]) => ({
    user: { name: user.name, email: user.email },
    settings: settings.theme,
    cart: cart.items.length
  })
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Dashboard Data Aggregation Demo
function DashboardAggregationDemo() {
  const logger = useActionLoggerWithToast();
  
  // Memoized selector for dashboard data aggregation
  const dashboardSelector = useCallback(
    ([user, cart, settings]: [
      ReturnType<typeof userStore.getValue>,
      ReturnType<typeof cartStore.getValue>,
      ReturnType<typeof settingsStore.getValue>
    ]) => {
      return {
        user: {
          name: user.name,
          role: user.role,
          isPremium: user.membership === 'premium',
          score: user.score
        },
        cart: {
          totalItems: cart.items.length,
          totalValue: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          isEmpty: cart.items.length === 0
        },
        settings: {
          isDarkMode: settings.theme === 'dark',
          language: settings.language,
          hasNotifications: settings.notifications
        }
      };
    },
    []
  );
  
  const dashboardData = useMultiStoreSelector(
    [userStore, cartStore, settingsStore],
    dashboardSelector
  );

  // Log dashboard data changes safely outside of selector
  useEffect(() => {
    logger.logSystem('🔍 Dashboard user selector');
    logger.logSystem('🔍 Dashboard cart selector');
    logger.logSystem('🔍 Dashboard settings selector');
  }, [logger, dashboardData]);

  return (
    <DemoCard title="Dashboard Data Aggregation">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* User Stats */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">User Profile</h3>
            <div className="space-y-1 text-sm">
              <div>👋 Welcome, {dashboardData.user.name}</div>
              <div>🎭 Role: {dashboardData.user.role}</div>
              <div>⭐ Score: {dashboardData.user.score}</div>
              <div>
                {dashboardData.user.isPremium ? '💎 Premium Member' : '🆓 Free Member'}
              </div>
            </div>
          </div>

          {/* Cart Stats */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Shopping Cart</h3>
            <div className="space-y-1 text-sm">
              <div>📦 Items: {dashboardData.cart.totalItems}</div>
              <div>💰 Value: ${dashboardData.cart.totalValue}</div>
              <div>
                {dashboardData.cart.isEmpty ? '🛒 Cart is empty' : '🛍️ Ready to checkout'}
              </div>
            </div>
          </div>

          {/* Settings Stats */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Preferences</h3>
            <div className="space-y-1 text-sm">
              <div>{dashboardData.settings.isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
              <div>🌍 Language: {dashboardData.settings.language}</div>
              <div>
                {dashboardData.settings.hasNotifications ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
              </div>
            </div>
          </div>
        </div>

        <CodeExample>
{`const dashboardData = useMultiStoreSelector(
  [userStore, cartStore, settingsStore],
  ([user, cart, settings]) => ({
    user: {
      name: user.name,
      role: user.role,
      isPremium: user.membership === 'premium',
      score: user.score
    },
    cart: {
      totalItems: cart.items.length,
      totalValue: cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0),
      isEmpty: cart.items.length === 0
    },
    settings: {
      isDarkMode: settings.theme === 'dark',
      language: settings.language,
      hasNotifications: settings.notifications
    }
  })
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Shopping Cart Summary Demo
function CartSummaryDemo() {
  const logger = useActionLoggerWithToast();
  
  // Memoized selector for cart summary calculation
  const cartSummarySelector = useCallback(
    ([cart, user, discount, shipping]: [
      ReturnType<typeof cartStore.getValue>,
      ReturnType<typeof userStore.getValue>,
      ReturnType<typeof discountStore.getValue>,
      ReturnType<typeof shippingStore.getValue>
    ]) => {
      return {
        cart: {
          items: cart.items,
          subtotal: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        },
        user: {
          isPremium: user.membership === 'premium'
        },
        discount: {
          code: discount.active?.code,
          amount: discount.active?.amount || 0
        },
        shipping: {
          method: shipping.method,
          cost: shipping.cost
        }
      };
    },
    []
  );
  
  const cartSummary = useMultiStoreSelector(
    [cartStore, userStore, discountStore, shippingStore],
    cartSummarySelector
  );

  // Log cart summary changes safely outside of selector
  useEffect(() => {
    logger.logSystem('🔍 Cart summary selector');
  }, [logger, cartSummary.cart.subtotal]);

  const total = cartSummary.cart.subtotal - 
                cartSummary.discount.amount + 
                cartSummary.shipping.cost;

  const updateShipping = () => {
    shippingStore.update(prev => ({
      ...prev,
      method: prev.method === 'express' ? 'standard' : 'express',
      cost: prev.method === 'express' ? 5 : 15
    }));
  };

  const toggleDiscount = () => {
    discountStore.update(prev => ({
      ...prev,
      active: prev.active?.code ? null : { code: 'SAVE10', amount: 100 }
    }));
  };

  return (
    <DemoCard title="Shopping Cart Summary">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal ({cartSummary.cart.items.length} items)</span>
              <span>${cartSummary.cart.subtotal}</span>
            </div>
            
            {cartSummary.discount.code && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({cartSummary.discount.code})</span>
                <span>-${cartSummary.discount.amount}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Shipping ({cartSummary.shipping.method})</span>
              <span>${cartSummary.shipping.cost}</span>
            </div>
            
            {cartSummary.user.isPremium && (
              <div className="text-purple-600 text-xs">
                💎 Premium member benefits applied
              </div>
            )}
            
            <hr className="my-2" />
            
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={updateShipping} variant="secondary" size="sm">
            Change Shipping ({cartSummary.shipping.method})
          </Button>
          <Button onClick={toggleDiscount} variant="outline" size="sm">
            {cartSummary.discount.code ? 'Remove' : 'Apply'} Discount
          </Button>
        </div>

        <CodeExample>
{`const cartSummary = useMultiStoreSelector(
  [cartStore, userStore, discountStore, shippingStore],
  ([cart, user, discount, shipping]) => ({
    cart: {
      items: cart.items,
      subtotal: cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0)
    },
    user: { isPremium: user.membership === 'premium' },
    discount: {
      code: discount.active?.code,
      amount: discount.active?.amount || 0
    },
    shipping: {
      method: shipping.method,
      cost: shipping.cost
    }
  })
);

const total = cartSummary.cart.subtotal - 
              cartSummary.discount.amount + 
              cartSummary.shipping.cost;`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Memoized Selectors Demo
function MemoizedSelectorsDemo() {
  const logger = useActionLoggerWithToast();
  
  const memoizedSelectors = useMultiStoreSelector(
    [userStore, settingsStore],
    useCallback(([user, settings]) => ({
      user: user.name,
      settings: settings.theme,
      computed: `${user.name} prefers ${settings.theme} theme`
    }), [])
  );

  return (
    <DemoCard title="Memoized Selectors">
      <div className="space-y-4">
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="text-sm space-y-1">
            <div>User: {memoizedSelectors.user}</div>
            <div>Theme: {memoizedSelectors.settings}</div>
            <div>Computed: {memoizedSelectors.computed}</div>
          </div>
        </div>

        <CodeExample>
{`const memoizedSelector = useCallback(([user, settings]) => ({
  user: user.name,
  settings: settings.theme,
  computed: \`\${user.name} prefers \${settings.theme} theme\`
}), []);

const data = useMultiStoreSelector(
  [userStore, settingsStore],
  memoizedSelector
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function UseStoreSelectorPatternsPage() {
  return (
    <PageWithLogMonitor>
      <PageStoreProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              useStoreSelector Patterns
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Multiple store selection patterns with useMultiStoreSelector for combining and 
              transforming data from multiple stores.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Basic Multi-Store Selection">
              <BasicMultiStoreDemo />
            </Section>

            <Section title="Real-World Examples">
              <div className="space-y-6">
                <DashboardAggregationDemo />
                <CartSummaryDemo />
              </div>
            </Section>

            <Section title="Performance Optimization">
              <MemoizedSelectorsDemo />
            </Section>

            <Section title="Key Takeaways">
              <DemoCard title="Best Practices">
                <div className="space-y-4">
                  <div className="prose">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Combine related data:</strong> Use useStoreSelector to merge data from multiple stores efficiently</li>
                      <li><strong>Transform at selection:</strong> Shape data into the format your components need</li>
                      <li><strong>Memoize complex selectors:</strong> Use useCallback for expensive transformations</li>
                      <li><strong>Selective re-rendering:</strong> Only select the data that affects your component</li>
                      <li><strong>Type safety:</strong> Leverage TypeScript for type-safe multi-store selections</li>
                    </ul>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </PageStoreProvider>
    </PageWithLogMonitor>
  );
}

export default UseStoreSelectorPatternsPage;