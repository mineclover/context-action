import {
  createDeclarativeStorePattern,
  useStoreValue,
  useComputedStore,
} from '@context-action/react';
import type React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Section,
  Label,
  Input,
} from '../../components/ui';

interface DataItem {
  id: string;
  name: string;
  category: string;
  value: number;
  timestamp: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  orders: Array<{ id: string; total: number }>;
  createdAt: string;
}

// Demo stores for performance patterns
const {
  Provider: PerformanceStoreProvider,
  useStore: usePerformanceStore,
  useStoreManager: usePerformanceStoreManager,
} = createDeclarativeStorePattern('Performance', {
  user: { 
    initialValue: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      orders: [
        { id: '1', total: 99.99 },
        { id: '2', total: 149.50 },
        { id: '3', total: 75.25 }
      ],
      createdAt: '2020-01-01T00:00:00Z'
    } as UserProfile
  },
  settings: { 
    initialValue: { 
      theme: 'light', 
      notifications: true, 
      dashboard: { showStats: true, layout: 'grid' }
    } 
  },
  data: {
    initialValue: Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      name: `Item ${i + 1}`,
      category: ['electronics', 'clothing', 'books', 'home'][i % 4],
      value: Math.floor(Math.random() * 1000),
      timestamp: Date.now() - Math.random() * 86400000
    })) as DataItem[]
  },
  filters: {
    initialValue: { searchTerm: '', category: 'all', sortField: 'name', sortDirection: 'asc' }
  },
  search: {
    initialValue: { query: '', results: [] as string[], isLoading: false }
  }
});

// Memoization Strategies Demo
function MemoizationStrategiesDemo() {
  const logger = useActionLoggerWithToast();
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  const userStore = usePerformanceStore('user');
  const settingsStore = usePerformanceStore('settings');
  
  // ✅ Good: Stable selector prevents unnecessary re-renders
  const userName = useStoreValue(userStore, useCallback(
    user => user.name,
    [] // No dependencies needed for stable selector
  ));
  
  // ❌ Bad example (commented out to avoid performance issues)
  // const userName = useStoreValue(userStore, user => user.name);
  
  // Complex selector memoization
  const processedUserData = useStoreValue(
    userStore,
    useCallback(user => {
      logger.info('🧮 Processing user data (memoized selector)', { userId: user.id });
      return {
        displayName: `${user.name}`,
        email: user.email,
        orderCount: user.orders.length,
        totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
        memberSince: new Date(user.createdAt).getFullYear()
      };
    }, [])
  );
  
  // Memoized computed store
  const memoizedComputation = useComputedStore(
    [userStore, settingsStore],
    useMemo(() => ([user, settings]) => {
      logger.info('⚡ Expensive computation running', { user: user.name, theme: settings.theme });
      // Simulate expensive computation
      let result = 0;
      for (let i = 0; i < 10000; i++) {
        result += user.orders.length * (settings.notifications ? 2 : 1);
      }
      return {
        computedValue: result / 10000,
        computedAt: new Date().toLocaleTimeString(),
        factors: {
          orderCount: user.orders.length,
          notificationsEnabled: settings.notifications,
          theme: settings.theme
        }
      };
    }, []),
    {
      comparison: 'shallow'
    }
  );
  
  const updateUser = () => {
    userStore.update(prev => ({
      ...prev,
      name: prev.name === 'John Doe' ? 'Jane Smith' : 'John Doe'
    }));
  };
  
  const toggleNotifications = () => {
    settingsStore.update(prev => ({
      ...prev,
      notifications: !prev.notifications
    }));
  };
  
  return (
    <DemoCard title="Memoization Strategies">
      <div className="space-y-4">
        <div className="p-2 bg-yellow-50 border rounded-lg">
          <div className="text-sm font-medium">Component Renders: {renderCount}</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Memoized User Data</Label>
            <div className="text-sm space-y-1">
              <div>Name: {processedUserData.displayName}</div>
              <div>Orders: {processedUserData.orderCount}</div>
              <div>Total: ${processedUserData.totalSpent.toFixed(2)}</div>
              <div>Since: {processedUserData.memberSince}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Memoized Computation</Label>
            <div className="text-sm space-y-1">
              <div>Value: {memoizedComputation.computedValue.toFixed(2)}</div>
              <div>At: {memoizedComputation.computedAt}</div>
              <div>Orders: {memoizedComputation.factors.orderCount}</div>
              <div>Notify: {memoizedComputation.factors.notificationsEnabled ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={updateUser} variant="primary" size="sm">
            Toggle User Name
          </Button>
          <Button onClick={toggleNotifications} variant="secondary" size="sm">
            Toggle Notifications
          </Button>
        </div>

        <CodeExample>
{`// ✅ Good: Stable selector prevents unnecessary re-renders
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // No dependencies needed for stable selector
));

// Complex selector memoization
const processedUserData = useStoreValue(
  userStore,
  useCallback(user => ({
    displayName: \`\${user.firstName} \${user.lastName}\`,
    initials: \`\${user.firstName[0]}\${user.lastName[0]}\`,
    status: user.isActive ? 'online' : 'offline',
    joinedDate: new Date(user.createdAt).toLocaleDateString()
  }), [])
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Batched Updates Demo
function BatchedUpdatesDemo() {
  const logger = useActionLoggerWithToast();
  const manager = usePerformanceStoreManager();
  
  const userStore = usePerformanceStore('user');
  const settingsStore = usePerformanceStore('settings');
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  const handleBulkUpdate = useCallback(async () => {
    logger.info('🚀 Starting bulk update (batched)');
    
    // Batch multiple store updates to prevent unnecessary re-renders
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    
    // Updates will be batched automatically in React 18+
    userStore.update(user => ({ 
      ...user, 
      name: user.name + ' (Bulk Updated)',
      email: 'bulk@example.com'
    }));
    settingsStore.update(settings => ({ 
      ...settings, 
      theme: settings.theme === 'light' ? 'dark' : 'light',
      notifications: !settings.notifications
    }));
    
    logger.info('✅ Bulk update completed');
  }, [manager, logger]);
  
  const handleIndividualUpdates = useCallback(() => {
    logger.info('🐌 Starting individual updates (separate renders)');
    
    // These will trigger separate re-renders
    setTimeout(() => {
      userStore.update(user => ({ ...user, name: user.name + ' (Individual 1)' }));
      logger.info('1️⃣ First update');
    }, 100);
    
    setTimeout(() => {
      userStore.update(user => ({ ...user, email: 'individual@example.com' }));
      logger.info('2️⃣ Second update');
    }, 200);
    
    setTimeout(() => {
      settingsStore.update(settings => ({ ...settings, notifications: !settings.notifications }));
      logger.info('3️⃣ Third update');
    }, 300);
  }, [userStore, settingsStore, logger]);
  
  return (
    <DemoCard title="Batched Updates">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">User Store</Label>
            <div className="text-sm space-y-1">
              <div>Name: {user.name}</div>
              <div>Email: {user.email}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Settings Store</Label>
            <div className="text-sm space-y-1">
              <div>Theme: {settings.theme}</div>
              <div>Notifications: {settings.notifications ? 'ON' : 'OFF'}</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleBulkUpdate} variant="primary" size="sm">
            Batched Update (1 render)
          </Button>
          <Button onClick={handleIndividualUpdates} variant="secondary" size="sm">
            Individual Updates (3 renders)
          </Button>
        </div>

        <CodeExample>
{`const handleBulkUpdate = useCallback(async () => {
  // React 18+ automatically batches these updates
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  userStore.update(user => ({ ...user, ...updates.user }));
  settingsStore.update(settings => ({ ...settings, ...updates.settings }));
  
  // Both updates trigger a single re-render
}, [manager]);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Subscription Optimization Demo
function SubscriptionOptimizationDemo() {
  const logger = useActionLoggerWithToast();
  const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const dataStore = usePerformanceStore('data');
  const searchStore = usePerformanceStore('search');
  
  // Selective subscription - only subscribe to specific fields
  const dataCount = useStoreValue(dataStore, useCallback(
    data => {
      logger.info('📊 Selective subscription: data count updated', { count: data.length });
      return data.length;
    }, []
  ));
  
  // Conditional subscription - only subscribe when needed
  const liveData = useStoreValue(
    enableRealTimeUpdates ? dataStore : null,
    useCallback(data => {
      if (!data) return null;
      logger.info('🔴 Live data subscription active', { itemCount: data.length });
      return data.slice(0, 5); // Only first 5 items for live updates
    }, [])
  );
  
  // Debounced subscription for search
  const debouncedSearch = useStoreValue(
    searchStore,
    useCallback(search => {
      logger.info('🔍 Debounced search triggered', { query: search.query });
      return search.query;
    }, []),
    {
      debounce: 500 // Wait 500ms after last change
    }
  );
  
  // Comparison strategy optimization
  const shallowSettings = useStoreValue(usePerformanceStore('settings'), undefined, {
    comparison: 'shallow'
  });
  
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    searchStore.update(prev => ({ ...prev, query: term }));
  }, [searchStore]);
  
  const addDataItem = () => {
    dataStore.update(prev => [...prev, {
      id: Date.now().toString(),
      name: `New Item ${prev.length + 1}`,
      category: 'new',
      value: Math.floor(Math.random() * 100),
      timestamp: Date.now()
    }]);
  };
  
  return (
    <DemoCard title="Subscription Optimization">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Selective Subscription</Label>
            <div className="text-sm space-y-1">
              <div>Data Count: {dataCount}</div>
              <div>Strategy: Field selection</div>
            </div>
            <div className="mt-2">
              <Button onClick={addDataItem} variant="primary" size="xs">
                Add Item
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Conditional Subscription</Label>
            <div className="text-sm space-y-1">
              <div>Live Updates: {enableRealTimeUpdates ? 'ON' : 'OFF'}</div>
              <div>Live Items: {liveData?.length || 0}</div>
            </div>
            <div className="mt-2">
              <Button 
                onClick={() => setEnableRealTimeUpdates(!enableRealTimeUpdates)} 
                variant="secondary" 
                size="xs"
              >
                Toggle Live
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg">
            <Label className="font-semibold">Debounced Search</Label>
            <div className="text-sm space-y-1">
              <div>Query: "{debouncedSearch}"</div>
              <div>Delay: 500ms</div>
            </div>
            <div className="mt-2">
              <Input
                value={searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                placeholder="Search (debounced)"
                size="sm"
              />
            </div>
          </div>
        </div>

        <CodeExample>
{`// Selective subscriptions
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// Conditional subscription - only subscribe when needed
const liveData = useStoreValue(
  enableRealTimeUpdates ? dataStore : null,
  data => data?.liveMetrics
);

// Debounced subscription
const searchResults = useStoreValue(searchStore, search => search.query, {
  debounce: 500  // Wait 500ms after last change
});`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Performance Monitoring Demo
function PerformanceMonitoringDemo() {
  const logger = useActionLoggerWithToast();
  const [metrics, setMetrics] = useState({
    updateCount: 0,
    lastUpdate: null as number | null,
    averageInterval: 0
  });
  
  const userStore = usePerformanceStore('user');
  const user = useStoreValue(userStore);
  
  // Performance monitoring hook
  useEffect(() => {
    const startTime = Date.now();
    let updateCount = 0;
    
    const unsubscribe = userStore.subscribe((newValue, prevValue) => {
      const now = Date.now();
      updateCount++;
      
      setMetrics({
        updateCount,
        lastUpdate: now,
        averageInterval: updateCount > 1 ? (now - startTime) / updateCount : 0
      });
      
      // Log performance metrics
      logger.info('📊 Store update metrics', {
        updateCount,
        interval: updateCount > 1 ? now - (metrics.lastUpdate || startTime) : 0,
        averageInterval: updateCount > 1 ? (now - startTime) / updateCount : 0
      });
    });
    
    return unsubscribe;
  }, [userStore, logger]);
  
  // Debug mode example
  const debugUser = useStoreValue(userStore, undefined, {
    debug: process.env.NODE_ENV === 'development',
    debugName: 'UserProfile'
  });
  
  const triggerUpdate = () => {
    userStore.update(prev => ({
      ...prev,
      name: prev.name + '.',
      orders: [...prev.orders] // New array reference
    }));
  };
  
  const triggerSlowUpdate = () => {
    // Simulate slow update
    setTimeout(() => {
      userStore.update(prev => ({
        ...prev,
        email: `slow-${Date.now()}@example.com`
      }));
    }, 100);
  };
  
  return (
    <DemoCard title="Performance Monitoring">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <Label className="font-semibold">Update Metrics</Label>
            <div className="text-sm space-y-1">
              <div>Count: {metrics.updateCount}</div>
              <div>Last: {metrics.lastUpdate ? new Date(metrics.lastUpdate).toLocaleTimeString() : 'Never'}</div>
              <div>Avg Interval: {metrics.averageInterval.toFixed(0)}ms</div>
            </div>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg">
            <Label className="font-semibold">Debug Mode</Label>
            <div className="text-sm space-y-1">
              <div>Enabled: {process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}</div>
              <div>Name: UserProfile</div>
              <div>Check console for debug logs</div>
            </div>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Label className="font-semibold">Current State</Label>
            <div className="text-sm space-y-1">
              <div>Name: {user.name}</div>
              <div>Email: {user.email}</div>
              <div>Orders: {user.orders.length}</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={triggerUpdate} variant="primary" size="sm">
            Fast Update
          </Button>
          <Button onClick={triggerSlowUpdate} variant="secondary" size="sm">
            Slow Update (100ms delay)
          </Button>
        </div>

        <CodeExample>
{`// Performance monitoring hook
const useStorePerformanceMonitor = (store) => {
  const [metrics, setMetrics] = useState({
    updateCount: 0,
    lastUpdate: null,
    averageInterval: 0
  });
  
  useEffect(() => {
    const startTime = Date.now();
    let updateCount = 0;
    
    const unsubscribe = store.subscribe(() => {
      const now = Date.now();
      updateCount++;
      
      setMetrics({
        updateCount,
        lastUpdate: now,
        averageInterval: (now - startTime) / updateCount
      });
    });
    
    return unsubscribe;
  }, [store]);
  
  return metrics;
};

// Debug mode for stores
const debugUser = useStoreValue(userStore, undefined, {
  debug: true,
  debugName: 'UserProfile'
});`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// High-Performance Data Table Demo
function HighPerformanceDataTableDemo() {
  const logger = useActionLoggerWithToast();
  
  const dataStore = usePerformanceStore('data');
  const filtersStore = usePerformanceStore('filters');
  
  const filters = useStoreValue(filtersStore);
  
  // High-performance computed data table
  const processedData = useComputedStore(
    [dataStore, filtersStore],
    useCallback(([data, filters]) => {
      logger.info('🏎️ Processing table data', { 
        dataCount: data.length, 
        searchTerm: filters.searchTerm,
        category: filters.category 
      });
      
      let filtered = data;
      
      // Apply search filter
      if (filters.searchTerm) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }
      
      // Apply category filter
      if (filters.category !== 'all') {
        filtered = filtered.filter(item => item.category === filters.category);
      }
      
      // Apply sorting
      if (filters.sortField) {
        filtered.sort((a, b) => {
          const aValue = a[filters.sortField as keyof DataItem];
          const bValue = b[filters.sortField as keyof DataItem];
          const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return filters.sortDirection === 'desc' ? -result : result;
        });
      }
      
      return filtered;
    }, []),
    {
      comparison: 'shallow',
      cacheKey: 'table-data'
    }
  );
  
  const updateSearch = (searchTerm: string) => {
    filtersStore.update(prev => ({ ...prev, searchTerm }));
  };
  
  const updateCategory = (category: string) => {
    filtersStore.update(prev => ({ ...prev, category }));
  };
  
  const updateSort = (field: string) => {
    filtersStore.update(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  return (
    <DemoCard title="High-Performance Data Table">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            value={filters.searchTerm}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search items..."
            className="flex-1 min-w-0"
          />
          <select 
            value={filters.category} 
            onChange={(e) => updateCategory(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {processedData.length} items (computed and cached)
        </div>
        
        <div className="max-h-64 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => updateSort('name')}
                >
                  Name {filters.sortField === 'name' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => updateSort('category')}
                >
                  Category {filters.sortField === 'category' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => updateSort('value')}
                >
                  Value {filters.sortField === 'value' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.slice(0, 20).map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 capitalize">{item.category}</td>
                  <td className="p-2">${item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeExample>
{`// High-performance computed data table
const processedData = useComputedStore(
  [dataStore, filtersStore],
  ([data, filters]) => {
    let filtered = data;
    
    // Apply filters
    if (filters.searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (filters.sortField) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortField];
        const bValue = b[filters.sortField];
        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filters.sortDirection === 'desc' ? -result : result;
      });
    }
    
    return filtered;
  },
  {
    comparison: 'shallow',
    cacheKey: 'table-data'
  }
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function PerformancePatternsPage() {
  return (
    <PageWithLogMonitor>
      <PerformanceStoreProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Performance Patterns
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Performance optimization patterns for store hooks including memoization, batching, 
              subscription optimization, and debugging techniques.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Memoization Strategies">
              <MemoizationStrategiesDemo />
            </Section>

            <Section title="Batched Updates">
              <BatchedUpdatesDemo />
            </Section>

            <Section title="Subscription Optimization">
              <SubscriptionOptimizationDemo />
            </Section>
            
            <Section title="Performance Monitoring">
              <PerformanceMonitoringDemo />
            </Section>
            
            <Section title="High-Performance Data Table">
              <HighPerformanceDataTableDemo />
            </Section>

            <Section title="Performance Best Practices">
              <DemoCard title="Optimization Guidelines">
                <div className="space-y-4">
                  <div className="prose">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700">✅ Do</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Use <code>useCallback</code> for stable selectors</li>
                          <li>Batch multiple store updates together</li>
                          <li>Choose appropriate comparison strategies</li>
                          <li>Enable debug mode in development</li>
                          <li>Monitor performance in complex applications</li>
                          <li>Use lazy evaluation for expensive operations</li>
                          <li>Cleanup subscriptions properly</li>
                          <li>Use selective subscriptions when possible</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700">❌ Avoid</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Creating new functions in selectors on every render</li>
                          <li>Deep comparisons unless absolutely necessary</li>
                          <li>Subscribing to entire large objects</li>
                          <li>Ignoring subscription cleanup</li>
                          <li>Side effects in computed values</li>
                          <li>Excessive debugging in production</li>
                          <li>Unnecessary re-renders for unchanged data</li>
                          <li>Memory leaks from unhandled subscriptions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </PerformanceStoreProvider>
    </PageWithLogMonitor>
  );
}

export default PerformancePatternsPage;