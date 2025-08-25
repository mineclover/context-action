# Performance Optimization Techniques

Comprehensive performance optimization patterns and techniques for the Context-Action framework.

## Prerequisites

For setup patterns used in these optimizations, see:
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store performance configurations
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Action optimization patterns
- **[RefContext Setup](../setup/ref-context-setup.md)** - DOM performance optimization
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Provider optimization

## 📋 Table of Contents

1. [Store Optimization](#store-optimization)
2. [Action Optimization](#action-optimization)
3. [Memoization Patterns](#memoization-patterns)
4. [RefContext Performance](#refcontext-performance)

---

## Store Optimization

### 🔄 Comparison Strategy Selection

Choose the right comparison strategy based on your data characteristics:

```tsx
// ✅ Using performance-optimized patterns from setup guide
// Reference: setup/basic-store-setup.md#type-inference-configurations
const {
  Provider: PerformanceStoreProvider,
  useStore: usePerformanceStore
} = createDeclarativeStorePattern('Performance', {
  // Primitive values: reference (default)
  counter: 0,
  isLoading: false,
  
  // Objects with property changes: shallow  
  userProfile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  
  // Deeply nested objects with frequent changes: deep
  complexForm: {
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep' as const
  },
  
  // Large arrays or performance-critical cases: reference
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference' as const,
    description: 'Use reference equality for performance'
  },
  
  // Advanced comparison options
  advancedData: {
    initialValue: { id: '', data: {}, lastUpdated: new Date() },
    comparisonOptions: {
      strategy: 'shallow',
      ignoreKeys: ['lastUpdated'], // Ignore specific keys
      maxDepth: 2,                 // Limit depth for performance
      enableCircularCheck: true    // Prevent circular references
    }
  },
  
  // Custom comparison logic
  versionedData: {
    initialValue: { version: 1, content: {} },
    comparisonOptions: {
      strategy: 'custom',
      customComparator: (oldVal, newVal) => {
        // Version-based comparison
        return oldVal.version === newVal.version;
      }
    }
  }
});
```

### 📊 Store Subscription Optimization

```tsx
// ✅ Recommended: Subscribe to specific values
const userName = useStoreValue(profileStore)?.name;

// ❌ Avoid: Unnecessary full object subscriptions when only partial data needed
const fullProfile = useStoreValue(profileStore);
const userName = fullProfile.name; // Re-renders on any profile change
```

---

## Action Optimization

### ⚡ Handler Memoization

```tsx
// ✅ Recommended: Memoized handlers with stable dependencies
function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Handler memoization (careful with dependency array)
  const updateHandler = useCallback(async (payload) => {
    // Always get fresh state from store
    const currentProfile = profileStore.getValue();
    profileStore.setValue({ ...currentProfile, ...payload.data });
  }, [profileStore]); // Only store reference in deps
  
  useUserActionHandler('updateProfile', updateHandler);
  
  // Computed value memoization
  const displayName = useMemo(() => {
    return profile.firstName + ' ' + profile.lastName;
  }, [profile.firstName, profile.lastName]);
  
  return <div>{displayName}</div>;
}
```

### 🎯 Debounce/Throttle Configuration

```tsx
// ✅ Recommended: Appropriate debounce/throttle usage
useUserActionHandler('searchUsers', searchHandler, {
  debounce: 300,  // Search uses debounce
  id: 'search-handler'
});

useUserActionHandler('trackScroll', scrollHandler, {
  throttle: 100,  // Scroll uses throttle  
  id: 'scroll-handler'
});

useUserActionHandler('saveForm', saveHandler, {
  blocking: true,  // Critical actions are blocking
  once: false,
  id: 'save-handler'
});
```

---

## Memoization Patterns

### 🔄 Component Memoization

```tsx
// ✅ Recommended: Memoize expensive computations
function ExpensiveComponent({ data }: { data: ComplexData }) {
  // Expensive calculation - memoized
  const processedData = useMemo(() => {
    return data.items
      .filter(item => item.isActive)
      .map(item => ({
        ...item,
        computed: expensiveCalculation(item)
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [data.items]); // Only recalculate when items change
  
  // Expensive rendering - memoized component
  return (
    <div>
      {processedData.map(item => (
        <MemoizedItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
}

// Memoized sub-component
const MemoizedItemComponent = memo(({ item }: { item: ProcessedItem }) => {
  return <div>{item.name}: {item.computed}</div>;
});
```

### ⚡ Callback Memoization

```tsx
// ✅ Recommended: Stable callbacks prevent child re-renders
function ParentComponent() {
  const [filter, setFilter] = useState('');
  const items = useStoreValue(itemsStore);
  
  // Memoized filter function
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);
  
  // Memoized item handler
  const handleItemClick = useCallback((itemId: string) => {
    // Handle item click
    dispatch('selectItem', { itemId });
  }, [dispatch]);
  
  return (
    <div>
      <FilterComponent onChange={handleFilterChange} />
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}
```

---

## RefContext Performance

### ⚡ Zero Re-render DOM Manipulation

```tsx
// ✅ Recommended: Direct DOM manipulation for performance
function HighPerformanceMouseTracker() {
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  
  // Zero React re-renders - all DOM updates are direct
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Hardware accelerated transforms (GPU acceleration)
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // Use will-change for complex animations
    if (!cursor.target.style.willChange) {
      cursor.target.style.willChange = 'transform';
    }
  }, [cursor, container]);
  
  // Cleanup will-change on unmount for memory optimization
  useEffect(() => {
    return () => {
      if (cursor.target) {
        cursor.target.style.willChange = '';
      }
    };
  }, [cursor]);
  
  return (
    <div ref={container.setRef} onMouseMove={handleMouseMove}>
      <div 
        ref={cursor.setRef}
        style={{ transform: 'translate3d(0, 0, 0)' }} // Initial GPU layer
      />
    </div>
  );
}

// ❌ Avoid: State-driven updates causing re-renders
function SlowMouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // This causes re-renders on every mouse move
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div style={{ left: position.x, top: position.y }} />
    </div>
  );
}
```

### 🎨 Animation Performance

```tsx
// ✅ Recommended: requestAnimationFrame for smooth animations
function SmoothAnimationComponent() {
  const target = useAnimationRef('target');
  const animationRef = useRef<number>();
  
  const startAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      if (target.target) {
        // Smooth animation with hardware acceleration
        const progress = (timestamp % 2000) / 2000;
        const x = progress * 200;
        target.target.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [target]);
  
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => stopAnimation(); // Cleanup on unmount
  }, [stopAnimation]);
  
  return (
    <div>
      <div ref={target.setRef} style={{ transform: 'translate3d(0, 0, 0)' }} />
      <button onClick={startAnimation}>Start</button>
      <button onClick={stopAnimation}>Stop</button>
    </div>
  );
}
```

---

## 📊 Performance Measurement

### 🔍 Performance Monitoring

```tsx
// ✅ Performance monitoring utilities
const usePerformanceMonitor = (operationName: string) => {
  const measure = useCallback((fn: () => void | Promise<void>) => {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`${operationName}: ${end - start}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`${operationName}: ${end - start}ms`);
      return result;
    }
  }, [operationName]);
  
  return { measure };
};

// Usage
function MonitoredComponent() {
  const { measure } = usePerformanceMonitor('DataProcessing');
  
  const processData = useCallback(async (data: unknown[]) => {
    return measure(() => {
      // Expensive data processing
      return data.map(item => processItem(item));
    });
  }, [measure]);
}
```

---

## 📚 Related Patterns

- [RefContext Performance](../ref/performance.md) - Detailed RefContext optimization
- [Hardware Acceleration](../ref/hardware-acceleration.md) - GPU acceleration techniques
- [Memory Optimization](../ref/memory-optimization.md) - Memory management patterns

---

## 💡 Performance Tips

1. **Choose appropriate store comparison strategies** based on data patterns
2. **Use memoization strategically** - not everywhere
3. **Leverage RefContext for performance-critical operations**
4. **Monitor performance with measurement utilities**
5. **Use hardware acceleration for animations**
6. **Clean up resources properly to prevent memory leaks**