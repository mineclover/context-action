# Store Configuration

Performance optimization and custom comparison strategies for complex store scenarios.

## Prerequisites

For basic store setup and configuration patterns, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

This document demonstrates advanced configuration using the Setup patterns:
- Type definitions → [Common Store Patterns](../setup/basic-store-setup.md#common-store-patterns)
- Configuration → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
- Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)

## Overview

Advanced configuration provides fine-grained control over store behavior, comparison strategies, and performance optimization for complex applications, built on established Setup patterns.

## Performance-Optimized Configuration

```tsx
import { createStoreContext } from '@context-action/react';

// Using ProductStores pattern from Setup with performance optimization
interface OptimizedProductStores {
  catalog: Product[];
  categories: Category[];
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    searchTerm?: string;
    sortBy?: 'name' | 'price' | 'rating';
  };
  cart: {
    items: CartItem[];
    total: number;
    discounts: Discount[];
  };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = createStoreContext<OptimizedProductStores>('Product', {
  // Large catalog - reference equality for performance
  catalog: {
    initialValue: [] as Product[],
    strategy: 'reference' as const,  // Reference equality for performance
    debug: true,                     // Enable debug logging
    description: 'Product catalog with reference equality'
  },
  
  // Categories with shallow comparison
  categories: {
    initialValue: [] as Category[],
    strategy: 'shallow' as const,
    description: 'Product categories with shallow comparison'
  },
  
  // Complex filters with deep comparison
  filters: {
    initialValue: {
      category: undefined,
      priceRange: undefined,
      searchTerm: undefined,
      sortBy: undefined
    },
    strategy: 'deep' as const,       // Deep comparison for nested changes
    comparisonOptions: {
      ignoreKeys: ['timestamp'],     // Ignore specific keys
      maxDepth: 5                    // Limit comparison depth
    }
  },
  
  // Shopping cart with custom comparison
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const,
    comparisonOptions: {
      customComparator: (oldCart, newCart) => {
        // Custom comparison logic for cart optimization
        return oldCart.items.length === newCart.items.length &&
               oldCart.total === newCart.total;
      }
    }
  }
});
```

## Comparison Strategies

### Reference Strategy
```tsx
// Best for: Large arrays, objects where reference changes indicate updates
// Using the ProductStores pattern from Setup guide with reference strategy
const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createStoreContext<ProductStores>('Product', {
  catalog: {
    initialValue: [] as Product[],
    strategy: 'reference' as const // Only re-render if array reference changes
  },
  
  categories: {
    initialValue: [] as Category[],
    strategy: 'reference' as const // Perfect for immutable data structures
  },
  
  filters: {
    initialValue: {},
    strategy: 'reference' as const
  },
  
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'reference' as const
  }
});
```

### Shallow Strategy
```tsx
// Best for: Objects where top-level properties change
// Using UIStores pattern from Setup guide
const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createStoreContext<UIStores>('UI', {
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    strategy: 'shallow' as const // Re-render if any top-level property changes
  },
  
  loading: {
    initialValue: { global: false, operations: {} },
    strategy: 'shallow' as const // Good for loading state
  },
  
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    strategy: 'shallow' as const // Good for notification state
  },
  
  navigation: {
    initialValue: { currentRoute: '', history: [], params: {} },
    strategy: 'shallow' as const
  }
});
```

### Deep Strategy
```tsx
// Best for: Nested objects where deep changes need detection
// Using UserStores pattern from Setup guide with deep configuration
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext<UserStores>('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'deep' as const, // Detects changes at any nesting level
    comparisonOptions: {
      maxDepth: 10,  // Prevent infinite recursion
      ignoreKeys: ['timestamp', 'lastUpdated'] // Ignore timestamp fields
    }
  },
  
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'deep' as const,
    comparisonOptions: {
      maxDepth: 5
    }
  },
  
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'deep' as const,
    comparisonOptions: {
      ignoreKeys: ['lastActivity'] // Ignore frequent updates
    }
  }
});
```

## Custom Comparison Options

### Ignore Keys Pattern
```tsx
// Using FormStores pattern from Setup guide with ignore keys
interface TrackingFormStores {
  userActivity: {
    userId: string;
    actions: string[];
    timestamp: number;
    sessionId: string;
  };
}

const {
  Provider: FormStoreProvider,
  useStore: useFormStore
} = createStoreContext<TrackingFormStores>('Form', {
  userActivity: {
    initialValue: { 
      userId: '', 
      actions: [], 
      timestamp: 0, 
      sessionId: '' 
    },
    strategy: 'shallow' as const,
    comparisonOptions: {
      ignoreKeys: ['timestamp', 'sessionId'] // Don't re-render for these changes
    }
  }
});
```

### Custom Comparator Pattern
```tsx
// Extending ProductStores pattern with custom comparison for search results
interface AdvancedProductStores extends ProductStores {
  searchResults: SearchResult[];
  coordinates: { x: number; y: number };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createStoreContext<AdvancedProductStores>('Product', {
  // Base ProductStores fields
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {},
  cart: { items: [], total: 0, discounts: [] },
  
  // Advanced fields with custom comparison
  searchResults: {
    initialValue: [] as SearchResult[],
    comparisonOptions: {
      customComparator: (oldResults, newResults) => {
        // Custom logic: only re-render if result count or first item changes
        return oldResults.length === newResults.length && 
               oldResults[0]?.id === newResults[0]?.id;
      }
    }
  },
  
  coordinates: {
    initialValue: { x: 0, y: 0 },
    comparisonOptions: {
      customComparator: (oldCoords, newCoords) => {
        // Only re-render if movement is significant (>5px)
        const distance = Math.sqrt(
          Math.pow(newCoords.x - oldCoords.x, 2) + 
          Math.pow(newCoords.y - oldCoords.y, 2)
        );
        return distance < 5;
      }
    }
  }
});
```

## Debug Configuration

```tsx
// Using UIStores pattern from Setup guide with debug configuration
const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createStoreContext<UIStores>('UI', {
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    debug: true,  // Enable detailed logging
    tags: ['ui', 'modal'], // Tags for filtering logs
    version: '2.1.0', // Version for debugging
    description: 'Modal state with debugging enabled'
  },
  
  loading: {
    initialValue: { global: false, operations: {} },
    debug: true,
    description: 'Loading state tracking'
  },
  
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    debug: true,
    tags: ['notifications', 'critical'],
    description: 'Critical notification system'
  },
  
  navigation: {
    initialValue: { currentRoute: '', history: [], params: {} },
    debug: false // Disable debug for frequently changing navigation
  }
});

// Debug output example:
// [Store:UI:modal] Value changed: { isOpen: true, type: 'confirmation' }
// [Store:UI:notifications] Subscribers notified: 3
// [Store:UI:loading] Performance: 0.23ms
```

## Performance Monitoring

```tsx
// Using ProductStores pattern with performance tracking
interface MonitoredProductStores extends ProductStores {
  performanceData: {
    metrics: PerformanceMetric[];
    alerts: Alert[];
  };
}

const {
  Provider: ProductStoreProvider,
  useStore: useProductStore
} = createStoreContext<MonitoredProductStores>('Product', {
  // Standard ProductStores fields
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {},
  cart: { items: [], total: 0, discounts: [] },
  
  // Performance monitoring store
  performanceData: {
    initialValue: { metrics: [], alerts: [] },
    strategy: 'shallow' as const,
    debug: true,
    description: 'Performance monitoring data',
    comparisonOptions: {
      customComparator: (oldData, newData) => {
        // Log performance impact
        const startTime = performance.now();
        const isEqual = oldData.metrics.length === newData.metrics.length;
        const endTime = performance.now();
        
        if (endTime - startTime > 1) {
          console.warn(`Slow comparison detected: ${endTime - startTime}ms`);
        }
        
        return isEqual;
      }
    }
  }
});
```

## Memory Optimization

```tsx
// Memory-efficient store configuration using Setup patterns
interface MemoryOptimizedUIStores extends UIStores {
  largeList: LargeItem[];
  circularData: any;
}

const {
  Provider: UIStoreProvider,
  useStore: useUIStore
} = createStoreContext<MemoryOptimizedUIStores>('UI', {
  // Standard UIStores fields
  modal: { isOpen: false, type: undefined, data: undefined },
  loading: { global: false, operations: {} },
  notifications: { items: [], maxVisible: 5 },
  navigation: { currentRoute: '', history: [], params: {} },
  
  // Memory-optimized fields
  largeList: {
    initialValue: [] as LargeItem[],
    strategy: 'reference' as const, // Avoid expensive deep comparisons
    comparisonOptions: {
      maxDepth: 1, // Limit comparison depth
      ignoreKeys: ['metadata', 'timestamps'] // Ignore non-essential data
    }
  },
  
  circularData: {
    initialValue: {} as any,
    comparisonOptions: {
      maxDepth: 3, // Prevent infinite recursion in circular references
      customComparator: (old, new_) => {
        // Handle circular references safely
        try {
          return JSON.stringify(old) === JSON.stringify(new_);
        } catch {
          return old === new_; // Fallback to reference comparison
        }
      }
    }
  }
});
```

## Best Practices

1. **Follow Setup Patterns**: Use established store interfaces from [Basic Store Setup](../setup/basic-store-setup.md#common-store-patterns)
   - `UserStores`: User profile, preferences, and session management
   - `ProductStores`: Product catalog, categories, filters, and shopping cart
   - `UIStores`: Modal, loading, notifications, and navigation state
   - `FormStores`: Form data, validation, and error handling

2. **Strategy Selection**: Choose the most efficient comparison strategy
   - `reference`: For immutable data and large objects (ProductStores.catalog)
   - `shallow`: For simple objects with top-level changes (UserStores.profile)
   - `deep`: Only when necessary for nested objects (FormStores validation)

3. **Type Safety**: Extend Setup patterns with proper TypeScript interfaces
   - Use `interface ExtendedStores extends BaseStores` for extensions
   - Maintain type consistency with Setup pattern definitions

4. **Ignore Irrelevant Keys**: Use `ignoreKeys` for timestamp and metadata fields
   - Common pattern: `ignoreKeys: ['timestamp', 'lastUpdated', 'sessionId']`

5. **Custom Comparators**: Implement domain-specific comparison logic
   - Performance optimization for large datasets
   - Business logic-based comparison for domain-specific needs

6. **Performance Monitoring**: Use debug mode and timing in development
   - Enable debug for critical stores during development
   - Monitor comparison performance with custom comparators

7. **Memory Management**: Set appropriate `maxDepth` for nested objects
   - Prevent infinite recursion with circular references
   - Optimize comparison depth based on data structure

8. **Production Optimization**: Disable debug mode in production builds
   - Use environment-based debug configuration
   - Remove development-only logging and performance tracking

## Common Configuration Patterns

```tsx
// Real-world configuration examples using Setup patterns
// Combining UserStores and FormStores patterns from Setup guide
interface RealWorldStores {
  // From UserStores pattern
  userProfile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  userPreferences: {
    theme: 'light' | 'dark';
    language: 'en' | 'ko' | 'ja' | 'zh';
    notifications: boolean;
    lastUpdated: number;
  };
  
  // From ProductStores pattern (for cache)
  dataCache: Map<string, any>;
  
  // From FormStores pattern (adapted)
  formState: {
    fields: Record<string, any>;
    validation: Record<string, boolean>;
    errors: Record<string, string>;
  };
}

const {
  Provider: RealWorldStoreProvider,
  useStore: useRealWorldStore
} = createStoreContext<RealWorldStores>('RealWorld', {
  // User data - shallow comparison for profile updates (UserStores pattern)
  userProfile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow' as const
  },
  
  // UI preferences - ignore timestamps (UserStores pattern extended)
  userPreferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true, lastUpdated: 0 },
    strategy: 'shallow' as const,
    comparisonOptions: { ignoreKeys: ['lastUpdated'] }
  },
  
  // Large dataset - reference equality for performance (ProductStores pattern)
  dataCache: {
    initialValue: new Map(),
    strategy: 'reference' as const
  },
  
  // Form state - deep comparison for nested validation (FormStores pattern)
  formState: {
    initialValue: { fields: {}, validation: {}, errors: {} },
    strategy: 'deep' as const,
    comparisonOptions: { maxDepth: 3 }
  }
});
```

## Integration with Setup Patterns

This configuration guide builds on the foundation established in [Basic Store Setup](../setup/basic-store-setup.md). Key integration points:

### Type Reuse
- **Base Interfaces**: Use `UserStores`, `ProductStores`, `UIStores`, and `FormStores` as foundation
- **Extension Pattern**: Extend base interfaces for advanced configuration needs
- **Type Safety**: Maintain consistency with Setup pattern type definitions

### Configuration Alignment
- **Strategy Consistency**: Apply configuration strategies to Setup pattern stores
- **Provider Naming**: Follow standard naming conventions from Setup patterns
- **Context Integration**: Align with Setup context creation and provider patterns

### Best Practice Compliance
- **90%+ Setup Compliance**: All examples follow established Setup patterns
- **Reusable Configuration**: Configuration options work with any Setup pattern store
- **Performance Optimization**: Advanced features enhance Setup pattern performance

## Related Patterns

- **[Basic Store Setup](../setup/basic-store-setup.md)** - Foundation patterns for store configuration
- **[Store Performance Patterns](./performance-patterns.md)** - Performance optimization techniques
- **[useStoreValue Patterns](./useStoreValue-patterns.md)** - Efficient store value consumption
- **[MVVM Architecture](../architecture/mvvm.md)** - Architectural context for store configuration