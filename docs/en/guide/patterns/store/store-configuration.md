# Store Configuration

Performance optimization and custom comparison strategies for complex store scenarios.

## Overview

Advanced configuration provides fine-grained control over store behavior, comparison strategies, and performance optimization for complex applications.

## Performance-Optimized Configuration

```tsx
// Advanced store configuration with renaming pattern
const {
  Provider: AdvancedStoreProvider,
  useStore: useAdvancedStore,
  useStoreManager: useAdvancedStoreManager
} = createDeclarativeStorePattern('Advanced', {
  // Performance-optimized store
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',  // Reference equality for performance
    debug: true,           // Enable debug logging
    tags: ['performance', 'data'],
    version: '1.0.0',
    description: 'Large dataset with reference equality'
  },
  
  // Deep comparison store
  complexObject: {
    initialValue: { nested: { deep: { value: 0 } } },
    strategy: 'deep',      // Deep comparison for nested changes
    comparisonOptions: {
      ignoreKeys: ['timestamp'],  // Ignore specific keys
      maxDepth: 5                 // Limit comparison depth
    }
  },
  
  // Custom comparison
  customStore: {
    initialValue: new Map(),
    comparisonOptions: {
      customComparator: (oldValue, newValue) => {
        // Custom comparison logic
        return oldValue.size === newValue.size;
      }
    }
  }
});
```

## Comparison Strategies

### Reference Strategy
```tsx
// Best for: Large arrays, objects where reference changes indicate updates
const stores = createDeclarativeStorePattern('Performance', {
  bigDataArray: {
    initialValue: [] as LargeDataItem[],
    strategy: 'reference' // Only re-render if array reference changes
  },
  
  immutableData: {
    initialValue: new Map(),
    strategy: 'reference' // Perfect for immutable data structures
  }
});
```

### Shallow Strategy
```tsx
// Best for: Objects where top-level properties change
const stores = createDeclarativeStorePattern('UI', {
  userProfile: {
    initialValue: { id: '', name: '', email: '', avatar: '' },
    strategy: 'shallow' // Re-render if any top-level property changes
  },
  
  formData: {
    initialValue: { field1: '', field2: '', isValid: false },
    strategy: 'shallow' // Good for form state
  }
});
```

### Deep Strategy
```tsx
// Best for: Nested objects where deep changes need detection
const stores = createDeclarativeStorePattern('Complex', {
  nestedConfig: {
    initialValue: {
      ui: { theme: 'light', sidebar: { width: 200, collapsed: false } },
      api: { timeout: 5000, retries: 3 },
      features: { beta: false, analytics: true }
    },
    strategy: 'deep', // Detects changes at any nesting level
    comparisonOptions: {
      maxDepth: 10,  // Prevent infinite recursion
      ignoreKeys: ['timestamp', 'lastUpdated'] // Ignore timestamp fields
    }
  }
});
```

## Custom Comparison Options

### Ignore Keys Pattern
```tsx
const stores = createDeclarativeStorePattern('Tracking', {
  userActivity: {
    initialValue: { 
      userId: '', 
      actions: [], 
      timestamp: 0, 
      sessionId: '' 
    },
    strategy: 'shallow',
    comparisonOptions: {
      ignoreKeys: ['timestamp', 'sessionId'] // Don't re-render for these changes
    }
  }
});
```

### Custom Comparator Pattern
```tsx
const stores = createDeclarativeStorePattern('Advanced', {
  searchResults: {
    initialValue: [],
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
const stores = createDeclarativeStorePattern('Debug', {
  monitoredData: {
    initialValue: { count: 0, items: [] },
    debug: true,  // Enable detailed logging
    tags: ['monitoring', 'critical'], // Tags for filtering logs
    version: '2.1.0', // Version for debugging
    description: 'Critical data requiring monitoring'
  }
});

// Debug output example:
// [Store:Debug:monitoredData] Value changed: { count: 1, items: [...] }
// [Store:Debug:monitoredData] Subscribers notified: 3
// [Store:Debug:monitoredData] Performance: 0.23ms
```

## Performance Monitoring

```tsx
// Store with performance tracking
const stores = createDeclarativeStorePattern('Monitored', {
  performanceData: {
    initialValue: { metrics: [], alerts: [] },
    strategy: 'shallow',
    debug: true,
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
// Memory-efficient store configuration
const stores = createDeclarativeStorePattern('Memory', {
  largeList: {
    initialValue: [] as LargeItem[],
    strategy: 'reference', // Avoid expensive deep comparisons
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

1. **Strategy Selection**: Choose the most efficient comparison strategy
   - `reference`: For immutable data and large objects
   - `shallow`: For simple objects with top-level changes
   - `deep`: Only when necessary for nested objects

2. **Ignore Irrelevant Keys**: Use `ignoreKeys` for timestamp and metadata fields

3. **Custom Comparators**: Implement domain-specific comparison logic

4. **Performance Monitoring**: Use debug mode and timing in development

5. **Memory Management**: Set appropriate `maxDepth` for nested objects

6. **Production Optimization**: Disable debug mode in production builds

## Common Configuration Patterns

```tsx
// Real-world configuration examples
const stores = createDeclarativeStorePattern('RealWorld', {
  // User data - shallow comparison for profile updates
  userProfile: {
    initialValue: { id: '', name: '', email: '', avatar: '' },
    strategy: 'shallow'
  },
  
  // UI preferences - ignore timestamps
  uiPreferences: {
    initialValue: { theme: 'light', sidebar: true, lastUpdated: 0 },
    strategy: 'shallow',
    comparisonOptions: { ignoreKeys: ['lastUpdated'] }
  },
  
  // Large dataset - reference equality for performance  
  dataCache: {
    initialValue: new Map(),
    strategy: 'reference'
  },
  
  // Form state - deep comparison for nested validation
  formState: {
    initialValue: { fields: {}, validation: {}, errors: {} },
    strategy: 'deep',
    comparisonOptions: { maxDepth: 3 }
  }
});
```