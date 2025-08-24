/**
 * Modular Architecture Demo Page
 * Demonstrates the new domain-driven architecture with MVVM patterns
 */

import React, { useCallback, useEffect } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../components/LogMonitor/';
import {
  DomainLayout,
  Section,
  DemoCard,
  CodeExample,
  PatternBadge
} from '../domains/shared/components';
import { useStoreValue } from '@context-action/react';

// Import domain contexts and components
import { StoreContexts } from '../domains/store/contexts';
import { ActionContexts } from '../domains/action/contexts';
import { 
  StorePatternDemo, 
  StoreValueDisplay,
  StorePerformanceMonitor
} from '../domains/store/components';
import { 
  TimeoutProtectionDemo, 
  CircuitBreakerDemo,
  AsyncPerformanceMonitorDemo
} from '../domains/async/components';
import { AsyncRefProvider, useAsyncRegisterRef, useAsyncGetRefTarget, waitForAsyncRefs } from '../domains/async/patterns';

// Import domain handlers and services
import { 
  useDemoUserActionHandlers, 
  useDemoShoppingActionHandlers,
  useDemoPerformanceActionHandlers
} from '../domains/action/handlers';
import { useStorePerformanceTracking } from '../domains/store/hooks';
import { LoggerService } from '../domains/shared/services';

// MVVM Architecture Demonstration Components

// Model Layer (Store Domain)
const ModelLayerDemo = React.memo(() => {
  const userStore = StoreContexts.DemoUser.useStore('profile');
  const settingsStore = StoreContexts.DemoUser.useStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);

  const actions = React.useMemo(() => [
    {
      label: 'Update Name',
      action: () => userStore.update((prev: any) => ({ ...prev, name: 'Updated User' })),
      variant: 'primary' as const
    },
    {
      label: 'Toggle Theme',
      action: () => settingsStore.update((prev: any) => ({ 
        ...prev, 
        theme: prev.theme === 'light' ? 'dark' : 'light' 
      })),
      variant: 'secondary' as const
    },
    {
      label: 'Reset Profile',
      action: () => userStore.reset(),
      variant: 'outline' as const
    }
  ], [userStore, settingsStore]);

  return (
    <Section title="Model Layer (Data Management)">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <PatternBadge type="store" difficulty="beginner" className="mb-2" />
          <p className="text-gray-700 mb-4">
            The Model layer manages application state using the Context-Action Store Pattern.
            It provides reactive data subscriptions and consistent state management.
          </p>
        </div>

        <StorePatternDemo
          title="User Profile Store (Model)"
          description="Centralized user data management with reactive subscriptions"
          store={userStore}
          storeName="UserProfile"
          actions={actions}
          showPerformanceMonitor={true}
          codeExample={`// Model Layer - Store Definition
const { useStore } = createDeclarativeStorePattern('DemoUser', {
  profile: { 
    initialValue: { 
      id: 'demo-user-1', 
      name: 'Demo User', 
      email: 'demo@example.com'
    } 
  }
});

// Reactive data access
const userStore = useStore('profile');
const user = useStoreValue(userStore);`}
        />
      </div>
    </Section>
  );
});

// ViewModel Layer (Action Domain)  
const ViewModelLayerDemo = React.memo(() => {
  const logger = useActionLoggerWithToast();
  const dispatchUserActions = ActionContexts.DemoUser.useActionDispatch();
  const dispatchShoppingActions = ActionContexts.DemoShopping.useActionDispatch();
  
  // Register business logic handlers (ViewModel layer)
  const userHandlers = useDemoUserActionHandlers();
  const shoppingHandlers = useDemoShoppingActionHandlers();
  
  ActionContexts.DemoUser.useActionHandler('updateProfile', userHandlers.updateProfile);
  ActionContexts.DemoUser.useActionHandler('updatePreferences', userHandlers.updatePreferences);
  ActionContexts.DemoShopping.useActionHandler('addToCart', shoppingHandlers.addToCart);
  ActionContexts.DemoShopping.useActionHandler('processPayment', shoppingHandlers.processPayment);

  const handleUpdateProfile = useCallback(async () => {
    logger.info('📊 ViewModel: Dispatching profile update action');
    try {
      await dispatchUserActions('updateProfile', { 
        field: 'name', 
        value: `Updated at ${new Date().toLocaleTimeString()}` 
      });
      logger.success('✅ ViewModel: Profile update completed');
    } catch (error) {
      logger.error('❌ ViewModel: Profile update failed', error);
    }
  }, [dispatchUserActions, logger]);

  const handleAddToCart = useCallback(async () => {
    logger.info('🛒 ViewModel: Processing add to cart business logic');
    try {
      await dispatchShoppingActions('addToCart', { 
        productId: `demo-product-${Date.now()}`,
        quantity: 1
      });
      logger.success('✅ ViewModel: Add to cart completed');
    } catch (error) {
      logger.error('❌ ViewModel: Add to cart failed', error);
    }
  }, [dispatchShoppingActions, logger]);

  const handlePayment = useCallback(async () => {
    logger.info('💳 ViewModel: Processing payment with retry logic');
    try {
      await dispatchShoppingActions('processPayment', {
        paymentMethod: 'credit',
        amount: 99.99
      });
      logger.success('✅ ViewModel: Payment processed successfully');
    } catch (error) {
      logger.error('❌ ViewModel: Payment processing failed', error);
    }
  }, [dispatchShoppingActions, logger]);

  return (
    <Section title="ViewModel Layer (Business Logic)">
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <PatternBadge type="action" difficulty="intermediate" className="mb-2" />
          <p className="text-gray-700 mb-4">
            The ViewModel layer handles business logic through the Action Pipeline system.
            It processes user interactions, validates data, and coordinates with the Model layer.
          </p>
        </div>

        <DemoCard title="Action Pipeline (ViewModel)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Update Profile
              </button>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Add to Cart
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Process Payment
              </button>
            </div>

            <CodeExample>
{`// ViewModel Layer - Business Logic Handlers
const userHandlers = useDemoUserActionHandlers();

// Register handler for business logic processing
useActionHandler('updateProfile', userHandlers.updateProfile);

// Dispatch action from View layer
const dispatch = useActionDispatch();
await dispatch('updateProfile', { field: 'name', value: 'New Name' });`}
            </CodeExample>
          </div>
        </DemoCard>
      </div>
    </Section>
  );
});

// View Layer (React Components)
const ViewLayerDemo = React.memo(() => {
  const userStore = StoreContexts.DemoUser.useStore('profile');
  const settingsStore = StoreContexts.DemoUser.useStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  return (
    <Section title="View Layer (UI Components)">
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <PatternBadge type="integration" difficulty="beginner" className="mb-2" />
          <p className="text-gray-700 mb-4">
            The View layer renders UI components using reactive data from the Model layer.
            It dispatches user interactions to the ViewModel layer for processing.
          </p>
        </div>

        <DemoCard title="Reactive UI Components (View)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'dark' 
                  ? 'bg-gray-800 text-white border-gray-600' 
                  : 'bg-white text-gray-900 border-gray-200'
              }`}>
                <h4 className="font-semibold mb-2">User Profile View</h4>
                <div className="text-sm space-y-1">
                  <div>Name: <span className="font-medium">{user.name}</span></div>
                  <div>Email: <span className="font-medium">{user.email}</span></div>
                  <div>ID: <span className="font-mono text-xs">{user.id}</span></div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'dark' 
                  ? 'bg-gray-800 text-white border-gray-600' 
                  : 'bg-white text-gray-900 border-gray-200'
              }`}>
                <h4 className="font-semibold mb-2">Settings View</h4>
                <div className="text-sm space-y-1">
                  <div>Theme: <span className="font-medium">{settings.theme}</span></div>
                  <div>Notifications: <span className="font-medium">{settings.notifications ? 'ON' : 'OFF'}</span></div>
                  <div>Auto Save: <span className="font-medium">{settings.autoSave ? 'Enabled' : 'Disabled'}</span></div>
                </div>
              </div>
            </div>

            <CodeExample>
{`// View Layer - Reactive UI Components
function UserProfileView() {
  const userStore = useStore('profile');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h4>User Profile View</h4>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
    </div>
  );
}`}
            </CodeExample>
          </div>
        </DemoCard>
      </div>
    </Section>
  );
});

// Cross-Domain Integration Demo
const CrossDomainIntegrationDemo = React.memo(() => {
  return (
    <Section title="Cross-Domain Integration">
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <PatternBadge type="integration" difficulty="advanced" className="mb-2" />
          <p className="text-gray-700 mb-4">
            The modular architecture allows different domains (Store, Action, Async) to work together
            while maintaining clear separation of concerns.
          </p>
        </div>

        {/* Async Domain Components */}
        <TimeoutProtectionDemo />
        <CircuitBreakerDemo />
        <AsyncPerformanceMonitorDemo />
        
        <CodeExample>
{`// Cross-Domain Integration Example
function IntegratedComponent() {
  // Store Domain - Data management
  const userStore = useStore('profile');
  const user = useStoreValue(userStore);
  
  // Action Domain - Business logic
  const dispatch = useActionDispatch();
  
  // Async Domain - Async operations
  const { execute } = useAsyncOperation(async () => {
    return await apiService.updateUser(user.id);
  });
  
  const handleUpdate = async () => {
    // ViewModel processes the action
    await dispatch('updateProfile', { field: 'name', value: 'New Name' });
    
    // Async domain handles the API call
    await execute();
  };
  
  return <button onClick={handleUpdate}>Update Profile</button>;
}`}
        </CodeExample>
      </div>
    </Section>
  );
});

// Main Demo Component
const ModularArchitectureDemoContent = React.memo(() => {
  const logger = LoggerService.getInstance();
  
  useEffect(() => {
    logger.log('info', 'Modular Architecture Demo initialized', {
      domains: ['Store', 'Action', 'Async', 'Shared']
    }, 'ModularArchitectureDemo');
  }, [logger]);

  return (
    <StoreContexts.DemoUser.Provider>
      <ActionContexts.DemoUser.Provider>
        <ActionContexts.DemoShopping.Provider>
          <ActionContexts.DemoPerformance.Provider>
            <AsyncRefProvider>
              <DomainLayout
                title="Modular Architecture Demo"
                description="Demonstrates the Context-Action framework's domain-driven architecture with MVVM patterns, featuring Store, Action, and Async domains working together with clear separation of concerns."
              >
                <div className="space-y-8">
                  {/* Architecture Overview */}
                  <Section title="Architecture Overview">
                    <DemoCard title="MVVM Pattern with Domain Separation">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="text-2xl mb-2">🏪</div>
                            <h4 className="font-semibold text-blue-800">Model</h4>
                            <p className="text-sm text-blue-600">Store Domain</p>
                            <p className="text-xs text-gray-600 mt-1">State Management</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl mb-2">⚙️</div>
                            <h4 className="font-semibold text-green-800">ViewModel</h4>
                            <p className="text-sm text-green-600">Action Domain</p>
                            <p className="text-xs text-gray-600 mt-1">Business Logic</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <div className="text-2xl mb-2">🎨</div>
                            <h4 className="font-semibold text-purple-800">View</h4>
                            <p className="text-sm text-purple-600">React Components</p>
                            <p className="text-xs text-gray-600 mt-1">UI Rendering</p>
                          </div>
                        </div>
                        
                        <CodeExample>
{`// Modular Architecture Structure
src/domains/
├── shared/           # Cross-domain utilities and types
├── store/           # Model layer - State management
│   ├── contexts/    # Store contexts and providers
│   ├── hooks/       # Store-specific hooks
│   └── components/  # Store-related UI components
├── action/          # ViewModel layer - Business logic
│   ├── contexts/    # Action contexts
│   ├── handlers/    # Business logic handlers
│   └── components/  # Action-related UI
└── async/           # Async layer - Coordination & timing
    ├── patterns/    # Async pattern implementations
    └── components/  # Async-related UI`}
                        </CodeExample>
                      </div>
                    </DemoCard>
                  </Section>

                  {/* Layer Demonstrations */}
                  <ModelLayerDemo />
                  <ViewModelLayerDemo />
                  <ViewLayerDemo />
                  <CrossDomainIntegrationDemo />

                  {/* Benefits Summary */}
                  <Section title="Architecture Benefits">
                    <DemoCard title="Modular Architecture Advantages">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-green-800 mb-3">✅ Benefits</h5>
                          <ul className="space-y-2 text-sm">
                            <li><strong>Separation of Concerns:</strong> Each domain handles specific responsibilities</li>
                            <li><strong>Reusability:</strong> Shared components and utilities across domains</li>
                            <li><strong>Maintainability:</strong> Clear boundaries make code easier to modify</li>
                            <li><strong>Testability:</strong> Isolated domains can be tested independently</li>
                            <li><strong>Scalability:</strong> New domains can be added without affecting existing code</li>
                            <li><strong>Type Safety:</strong> Full TypeScript support with domain-specific types</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-blue-800 mb-3">🏗️ Domain Responsibilities</h5>
                          <ul className="space-y-2 text-sm">
                            <li><strong>Shared Domain:</strong> Common utilities, types, and components</li>
                            <li><strong>Store Domain:</strong> State management and reactive data</li>
                            <li><strong>Action Domain:</strong> Business logic and command processing</li>
                            <li><strong>Async Domain:</strong> Timing, coordination, and async operations</li>
                            <li><strong>Integration:</strong> Cross-domain communication patterns</li>
                          </ul>
                        </div>
                      </div>
                    </DemoCard>
                  </Section>
                </div>
              </DomainLayout>
            </AsyncRefProvider>
          </ActionContexts.DemoPerformance.Provider>
        </ActionContexts.DemoShopping.Provider>
      </ActionContexts.DemoUser.Provider>
    </StoreContexts.DemoUser.Provider>
  );
});

// Page with monitoring
const ModularArchitectureDemoPage = React.memo(() => {
  return (
    <PageWithLogMonitor>
      <ModularArchitectureDemoContent />
    </PageWithLogMonitor>
  );
});

export default ModularArchitectureDemoPage;