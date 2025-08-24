import {
  createDeclarativeStorePattern,
  useStoreValue,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Input,
  Section,
  Label,
} from '../../components/ui';

// Create store pattern for manager API demo
const {
  Provider: PageStoreProvider,
  useStore: usePageStore,
  useStoreManager: usePageStoreManager,
} = createDeclarativeStorePattern('UseStoreManagerApi', {
  user: { 
    initialValue: { 
      name: 'John Doe', 
      email: 'john@example.com',
      profile: {
        bio: 'Software Engineer',
        avatar: '/avatar.jpg'
      }
    } 
  },
  settings: { 
    initialValue: { 
      theme: 'light', 
      notifications: true,
      language: 'en'
    } 
  },
  cart: { 
    initialValue: { 
      items: [
        { id: '1', name: 'Laptop', price: 999, quantity: 1 },
        { id: '2', name: 'Mouse', price: 29, quantity: 2 }
      ],
      total: 1057 
    } 
  }
});

// Basic Store Manager Usage Demo
function BasicStoreManagerDemo() {
  const logger = useActionLoggerWithToast();
  const manager = usePageStoreManager();
  
  // Display current values using useStoreValue for reactivity
  const userStore = usePageStore('user');
  const settingsStore = usePageStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);

  const updateUserWithManager = useCallback(() => {
    // Get store instance directly
    const userStore = manager.getStore('user');
    const currentUser = userStore.getValue();
    
    logger.info('📦 Current user from manager', currentUser);
    
    userStore.setValue({
      ...currentUser,
      name: `${currentUser.name} (Updated via Manager)`
    });
    
    logger.info('✅ User updated via StoreManager');
  }, [manager, logger]);

  const updateUserEmail = useCallback(() => {
    const userStore = manager.getStore('user');
    userStore.update(current => ({
      ...current,
      email: `updated-${Date.now()}@example.com`
    }));
    
    logger.info('✅ User email updated via functional update');
  }, [manager, logger]);

  const resetUser = useCallback(() => {
    const userStore = manager.getStore('user');
    userStore.reset();
    logger.info('🔄 User store reset to initial value');
  }, [manager, logger]);

  const getManagerInfo = useCallback(() => {
    const info = manager.getInfo();
    logger.info('📊 Manager info', info);
  }, [manager, logger]);

  return (
    <DemoCard title="Basic Store Manager Usage">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Current User</Label>
            <div className="text-sm space-y-1">
              <div>Name: {user.name}</div>
              <div>Email: {user.email}</div>
              <div>Bio: {user.profile.bio}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Current Settings</Label>
            <div className="text-sm space-y-1">
              <div>Theme: {settings.theme}</div>
              <div>Notifications: {settings.notifications ? 'ON' : 'OFF'}</div>
              <div>Language: {settings.language}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={updateUserWithManager} variant="primary" size="sm">
            Update User (setValue)
          </Button>
          <Button onClick={updateUserEmail} variant="secondary" size="sm">
            Update Email (functional)
          </Button>
          <Button onClick={resetUser} variant="outline" size="sm">
            Reset User
          </Button>
          <Button onClick={getManagerInfo} variant="ghost" size="sm">
            Get Manager Info
          </Button>
        </div>

        <CodeExample>
{`const manager = useAppStoreManager();

// Get store instance
const userStore = manager.getStore('user');

// Direct value update
const currentUser = userStore.getValue();
userStore.setValue({ ...currentUser, name: 'New Name' });

// Functional update
userStore.update(current => ({ ...current, email: 'new@example.com' }));

// Reset to initial value
userStore.reset();

// Manager utilities
const info = manager.getInfo();`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Bulk Operations Demo
function BulkOperationsDemo() {
  const logger = useActionLoggerWithToast();
  const manager = usePageStoreManager();
  
  const userStore = usePageStore('user');
  const settingsStore = usePageStore('settings');
  const cartStore = usePageStore('cart');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  const cart = useStoreValue(cartStore);

  const performBulkUpdate = () => {
    logger.info('🚀 Starting bulk update...');
    
    // Update multiple stores in sequence
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const cartStore = manager.getStore('cart');
    
    userStore.update(user => ({
      ...user,
      name: `${user.name} (Bulk Updated)`
    }));
    
    settingsStore.update(settings => ({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light'
    }));
    
    cartStore.update(cart => ({
      ...cart,
      items: [...cart.items, {
        id: Date.now().toString(),
        name: 'Bulk Added Item',
        price: 99,
        quantity: 1
      }]
    }));
    
    logger.info('✅ Bulk update completed');
  };

  const resetAllStores = () => {
    logger.info('🔄 Resetting all stores...');
    
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const cartStore = manager.getStore('cart');
    
    userStore.reset();
    settingsStore.reset();
    cartStore.reset();
    
    logger.info('✅ All stores reset');
  };

  return (
    <DemoCard title="Bulk Store Operations">
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">User Store</Label>
            <div className="text-sm">
              <div>Name: {user.name}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Settings Store</Label>
            <div className="text-sm">
              <div>Theme: {settings.theme}</div>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Label className="font-semibold">Cart Store</Label>
            <div className="text-sm">
              <div>Items: {cart.items.length}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={performBulkUpdate} variant="primary" size="sm">
            Bulk Update All Stores
          </Button>
          <Button onClick={resetAllStores} variant="outline" size="sm">
            Reset All Stores
          </Button>
        </div>

        <CodeExample>
{`const performBulkUpdate = () => {
  // Update multiple stores efficiently
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  const cartStore = manager.getStore('cart');
  
  userStore.update(user => ({ ...user, name: 'Updated' }));
  settingsStore.update(settings => ({ ...settings, theme: 'dark' }));
  cartStore.update(cart => ({ 
    ...cart, 
    items: [...cart.items, newItem] 
  }));
};`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Advanced Store Management Demo
function AdvancedStoreManagementDemo() {
  const logger = useActionLoggerWithToast();
  const manager = usePageStoreManager();
  const [newStoreName, setNewStoreName] = useState('');
  
  const createDynamicStore = () => {
    if (!newStoreName.trim()) return;
    
    try {
      // Add to initial stores configuration
      (manager.initialStores as any)[newStoreName] = {
        initialValue: `Dynamic store: ${newStoreName}`,
        strategy: 'reference',
        debug: true,
        description: `Dynamically created store: ${newStoreName}`
      };
      
      // Get the store (this will create it)
      const dynamicStore = manager.getStore(newStoreName);
      
      logger.info('🆕 Dynamic store created', { 
        name: newStoreName, 
        value: dynamicStore.getValue() 
      });
      
      setNewStoreName('');
    } catch (error) {
      logger.error('❌ Failed to create dynamic store', error);
    }
  };

  const listAllStores = () => {
    const info = manager.getInfo();
    logger.info('📋 All available stores', info);
    
    // Log each store's current value
    Object.keys(manager.initialStores).forEach(storeName => {
      try {
        const store = manager.getStore(storeName);
        logger.info(`📦 Store [${storeName}]`, store.getValue());
      } catch (error) {
        logger.warn(`⚠️ Could not access store [${storeName}]`, error);
      }
    });
  };

  const subscribeToStore = () => {
    const userStore = manager.getStore('user');
    
    const unsubscribe = userStore.subscribe((newValue, previousValue) => {
      logger.info('🔔 User store subscription triggered', {
        previous: previousValue?.name,
        current: newValue?.name
      });
    });
    
    logger.info('✅ Subscribed to user store changes');
    
    // Cleanup subscription after 10 seconds
    setTimeout(() => {
      unsubscribe();
      logger.info('🔌 Unsubscribed from user store');
    }, 10000);
  };

  return (
    <DemoCard title="Advanced Store Management">
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>Create Dynamic Store</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Enter store name"
                className="flex-1"
              />
              <Button onClick={createDynamicStore} variant="primary" size="sm">
                Create Store
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={listAllStores} variant="secondary" size="sm">
              List All Stores
            </Button>
            <Button onClick={subscribeToStore} variant="outline" size="sm">
              Subscribe to User Store (10s)
            </Button>
          </div>
        </div>

        <CodeExample>
{`// Manual subscription with cleanup
const userStore = manager.getStore('user');

const unsubscribe = userStore.subscribe((newValue, previousValue) => {
  console.log('Store changed:', { previous: previousValue, current: newValue });
});

// Remember to cleanup
return unsubscribe;

// Get manager information
const info = manager.getInfo();
// { name: 'App', storeCount: 3, availableStores: ['user', 'settings', 'cart'] }`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Performance Patterns Demo
function PerformancePatternsDemo() {
  const logger = useActionLoggerWithToast();
  const manager = usePageStoreManager();
  
  const performOptimizedOperations = useCallback(() => {
    logger.info('⚡ Starting optimized operations...');
    
    // Use manager for multiple operations efficiently
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    
    // Batch operations together
    const startTime = performance.now();
    
    userStore.setValue(prev => ({ ...prev, name: 'Optimized Update' }));
    settingsStore.update(settings => ({ ...settings, notifications: !settings.notifications }));
    
    const endTime = performance.now();
    
    logger.info('✅ Optimized operations completed', {
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });
  }, [manager]);

  const comparePerformance = () => {
    // Test direct store access vs manager access
    const iterations = 1000;
    
    // Test with manager
    const managerStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const userStore = manager.getStore('user');
      userStore.getValue();
    }
    const managerEnd = performance.now();
    const managerTime = managerEnd - managerStart;
    
    logger.info('🏁 Performance comparison', {
      managerAccess: `${managerTime.toFixed(2)}ms for ${iterations} operations`,
      averagePerOp: `${(managerTime / iterations).toFixed(4)}ms per operation`
    });
  };

  return (
    <DemoCard title="Performance Patterns">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={performOptimizedOperations} variant="primary" size="sm">
            Optimized Operations
          </Button>
          <Button onClick={comparePerformance} variant="secondary" size="sm">
            Performance Test
          </Button>
        </div>

        <CodeExample>
{`// Memoized manager operations
const updateMultipleStores = useCallback(() => {
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  // Efficient bulk updates
  userStore.setValue(newUser);
  settingsStore.update(settings => ({ ...settings, updated: true }));
}, [manager]);

// Prefer direct store access for multiple operations
const userStore = manager.getStore('user');
const settingsStore = manager.getStore('settings');

// Multiple operations are more efficient this way
userStore.setValue(newUser);
settingsStore.update(settings => ({ ...settings, lastUpdated: Date.now() }));`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function UseStoreManagerApiPage() {
  return (
    <PageWithLogMonitor>
      <PageStoreProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              useStoreManager API
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Low-level access to the internal StoreManager instance for advanced store 
              management scenarios in the Declarative Store Pattern.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Basic Store Manager Usage">
              <BasicStoreManagerDemo />
            </Section>

            <Section title="Bulk Operations">
              <BulkOperationsDemo />
            </Section>

            <Section title="Advanced Store Management">
              <AdvancedStoreManagementDemo />
            </Section>

            <Section title="Performance Patterns">
              <PerformancePatternsDemo />
            </Section>

            <Section title="When to Use Store Manager">
              <DemoCard title="Usage Guidelines">
                <div className="space-y-4">
                  <div className="prose">
                    <h4 className="font-semibold text-green-700">✅ Use Store Manager When:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                      <li><strong>Multiple Store Operations:</strong> Need to update multiple stores in a single function</li>
                      <li><strong>Advanced Store Logic:</strong> Complex state manipulation requiring direct store access</li>
                      <li><strong>Performance Optimization:</strong> Batch operations or avoiding multiple hook calls</li>
                      <li><strong>Action Handlers:</strong> Business logic that spans multiple stores</li>
                      <li><strong>Custom Store Utilities:</strong> Building reusable store manipulation functions</li>
                    </ul>
                    
                    <h4 className="font-semibold text-blue-700">🔄 Use Regular Hooks When:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Simple State Access:</strong> Just reading or updating a single store</li>
                      <li><strong>Component Rendering:</strong> Using useStoreValue for reactive UI updates</li>
                      <li><strong>Basic Operations:</strong> Simple setValue/getValue operations</li>
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

export default UseStoreManagerApiPage;