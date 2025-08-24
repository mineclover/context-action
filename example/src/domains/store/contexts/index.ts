/**
 * Store domain contexts
 * Centralized store context definitions for the Store domain
 */

import { createDeclarativeStorePattern } from '@context-action/react';

// Demo User Store Pattern - for user-related demonstrations
export const {
  Provider: DemoUserStoreProvider,
  useStore: useDemoUserStore,
  useStoreManager: useDemoUserStoreManager,
  withProvider: withDemoUserStoreProvider,
} = createDeclarativeStorePattern('DemoUser', {
  profile: { 
    initialValue: { 
      id: 'demo-user-1', 
      name: 'Demo User', 
      email: 'demo@example.com',
      avatar: '/avatars/demo.jpg',
      role: 'user',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    } 
  },
  settings: { 
    initialValue: { 
      theme: 'light', 
      notifications: true,
      autoSave: true,
      debugMode: false
    } 
  },
  activity: {
    initialValue: {
      lastLogin: Date.now(),
      sessionCount: 0,
      totalTime: 0,
      actions: [] as string[]
    }
  }
});

// Demo Shopping Store Pattern - for e-commerce demonstrations
export const {
  Provider: DemoShoppingStoreProvider,
  useStore: useDemoShoppingStore,
  useStoreManager: useDemoShoppingStoreManager,
  withProvider: withDemoShoppingStoreProvider,
} = createDeclarativeStorePattern('DemoShopping', {
  cart: { 
    initialValue: {
      items: [
        { id: '1', name: 'Laptop Pro', price: 1299, quantity: 1, category: 'electronics' },
        { id: '2', name: 'Wireless Mouse', price: 79, quantity: 2, category: 'accessories' }
      ],
      total: 1457,
      shipping: 0,
      discount: 0,
      couponCode: '',
      tax: 0
    }
  },
  inventory: {
    initialValue: {
      categories: ['electronics', 'accessories', 'software', 'books'],
      products: [
        { id: '1', name: 'Laptop Pro', price: 1299, stock: 50, category: 'electronics' },
        { id: '2', name: 'Wireless Mouse', price: 79, stock: 200, category: 'accessories' },
        { id: '3', name: 'Design Software', price: 299, stock: 0, category: 'software' },
        { id: '4', name: 'JavaScript Guide', price: 39, stock: 100, category: 'books' }
      ],
      lowStockThreshold: 10
    }
  },
  checkout: {
    initialValue: {
      step: 'cart' as 'cart' | 'shipping' | 'payment' | 'review' | 'complete',
      shippingAddress: null,
      paymentMethod: null,
      isProcessing: false,
      errors: [] as string[]
    }
  }
});

// Demo Performance Store Pattern - for performance testing and monitoring
export const {
  Provider: DemoPerformanceStoreProvider,
  useStore: useDemoPerformanceStore,
  useStoreManager: useDemoPerformanceStoreManager,
  withProvider: withDemoPerformanceStoreProvider,
} = createDeclarativeStorePattern('DemoPerformance', {
  metrics: {
    initialValue: {
      renders: 0,
      updates: 0,
      subscriptions: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0,
      peakMemoryUsage: 0
    }
  },
  benchmark: {
    initialValue: {
      isRunning: false,
      currentTest: '',
      results: [] as Array<{
        test: string;
        duration: number;
        iterations: number;
        timestamp: number;
      }>,
      configuration: {
        iterations: 1000,
        warmupIterations: 100,
        cooldownDelay: 500
      }
    }
  },
  monitoring: {
    initialValue: {
      enabled: true,
      logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
      autoCollect: true,
      sampleRate: 1.0,
      bufferSize: 1000
    }
  }
});

// Demo Configuration Store Pattern - for settings and configuration management
export const {
  Provider: DemoConfigStoreProvider,
  useStore: useDemoConfigStore,
  useStoreManager: useDemoConfigStoreManager,
  withProvider: withDemoConfigStoreProvider,
} = createDeclarativeStorePattern('DemoConfig', {
  application: {
    initialValue: {
      name: 'Context-Action Demo',
      environment: 'development' as 'development' | 'staging' | 'production',
      buildTime: Date.now(),
      features: {
        analytics: true,
        debugMode: true,
        experimentalFeatures: false
      }
    }
  },
  ui: {
    initialValue: {
      theme: 'light' as 'light' | 'dark' | 'auto',
      language: 'en' as 'en' | 'ko' | 'ja' | 'zh',
      density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
      animations: true,
      sidebar: {
        collapsed: false,
        width: 280,
        position: 'left' as 'left' | 'right'
      }
    }
  },
  development: {
    initialValue: {
      showPerformanceMetrics: true,
      showDebugInfo: true,
      enableHotReload: true,
      logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
      mockData: true
    }
  }
});

// Export all store contexts for easy access
export const StoreContexts = {
  DemoUser: {
    Provider: DemoUserStoreProvider,
    useStore: useDemoUserStore,
    useStoreManager: useDemoUserStoreManager,
    withProvider: withDemoUserStoreProvider,
  },
  DemoShopping: {
    Provider: DemoShoppingStoreProvider,
    useStore: useDemoShoppingStore,
    useStoreManager: useDemoShoppingStoreManager,
    withProvider: withDemoShoppingStoreProvider,
  },
  DemoPerformance: {
    Provider: DemoPerformanceStoreProvider,
    useStore: useDemoPerformanceStore,
    useStoreManager: useDemoPerformanceStoreManager,
    withProvider: withDemoPerformanceStoreProvider,
  },
  DemoConfig: {
    Provider: DemoConfigStoreProvider,
    useStore: useDemoConfigStore,
    useStoreManager: useDemoConfigStoreManager,
    withProvider: withDemoConfigStoreProvider,
  }
};