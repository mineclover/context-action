# Memory Management Patterns

Advanced memory management strategies and best practices for the Context-Action framework.

## 🧠 Memory Safety Architecture

### Handler Limit System (v0.4.1+)

**NEW**: Configurable memory protection against excessive handler registration:

```typescript
// Memory-safe configuration
const registry = new ActionRegister<MyActions>({
  name: 'MemorySafeApp',
  registry: {
    maxHandlersPerAction: 1000  // Default: prevents memory issues
  }
});

// Different limits for different app sizes
const configs = {
  // Small applications
  small: { maxHandlersPerAction: 500 },
  
  // Standard applications (default)
  standard: { maxHandlersPerAction: 1000 },
  
  // Enterprise applications
  enterprise: { maxHandlersPerAction: 5000 },
  
  // Trusted environments only
  unlimited: { maxHandlersPerAction: Infinity }
};
```

**Protection Benefits**:
- **DoS Prevention**: Blocks malicious excessive handler registration
- **Memory Bounds**: Predictable memory usage patterns
- **Performance**: Prevents linear performance degradation
- **Early Warning**: Developer-friendly warnings before limits

### Resource Cleanup System

**NEW**: Comprehensive cleanup with `destroy()` method:

```typescript
// Complete resource cleanup
function createTemporaryRegistry() {
  const registry = new ActionRegister<TempActions>({
    name: 'TempRegistry'
  });
  
  // Use registry for temporary operations...
  
  return {
    registry,
    cleanup: () => {
      // 🆕 Comprehensive cleanup
      registry.destroy(); // Cleans up:
                         // - All handlers and pipelines
                         // - ActionGuards and timers  
                         // - Operation queues
                         // - Execution statistics
                         // - Event listeners
    }
  };
}

// React component cleanup
function MyComponent() {
  const registry = useActionRegister();
  
  useEffect(() => {
    // Component-specific setup...
    
    return () => {
      // Clean up when component unmounts
      registry.destroy();
    };
  }, [registry]);
}
```

## 🔄 Event Object Prevention

### Automatic Detection System

**Enhanced**: Complete event object detection and prevention:

```typescript
// ❌ BLOCKED: Automatic event object detection
function handleClick(event: MouseEvent) {
  userStore.setValue({
    lastEvent: event  // Blocked with error message
  });
  // Error: [Context-Action] Event object detected in Store.setValue - this may cause memory leaks
}

// ✅ SAFE: Extract only needed data
function handleClickSafe(event: MouseEvent) {
  userStore.setValue({
    clickData: {
      x: event.clientX,
      y: event.clientY,
      target: event.target?.tagName,
      timestamp: Date.now()
    }
  });
}
```

### Custom Object Detection

```typescript
// Advanced event object prevention
function isEventLikeObject(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    (obj.preventDefault || obj.stopPropagation || obj.nativeEvent)
  );
}

// Safe data extraction utility
function extractSafeEventData(event: Event) {
  if (event instanceof MouseEvent) {
    return {
      type: 'mouse',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: event.timeStamp
    };
  }
  
  if (event instanceof KeyboardEvent) {
    return {
      type: 'keyboard',
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      timestamp: event.timeStamp
    };
  }
  
  // Generic event data
  return {
    type: event.type,
    timestamp: event.timeStamp
  };
}
```

## 🔍 EventBus Memory Optimization

### Smart Object Handling

**Enhanced**: Automatic memory-heavy object optimization:

```typescript
// ✅ AUTOMATIC: EventBus optimizes memory-heavy objects
const eventBus = createEventBus();

// Large DOM element
const domElement = document.querySelector('#large-container');
eventBus.emit('domUpdate', domElement);
// Stored as: { __eventBusDataType: 'DOMElement', tagName: 'DIV', id: 'large-container', className: '...' }

// React component
const reactComponent = <ComplexComponent />;
eventBus.emit('componentEvent', reactComponent);  
// Stored as: { __eventBusDataType: 'ReactElement', type: 'ComplexComponent', props: {...} }

// Custom large object
const largeData = { /* massive object */ };
eventBus.emit('dataUpdate', largeData);
// Automatically optimized based on size and complexity
```

## 📊 Memory Monitoring

### Development Monitoring

```typescript
// Monitor memory usage in development
function memoryMonitor() {
  if (process.env.NODE_ENV === 'development' && performance.memory) {
    const memory = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
    
    console.log('Memory usage (MB):', memory);
    
    // Warning thresholds
    if (memory.used / memory.limit > 0.8) {
      console.warn('High memory usage detected');
    }
    
    return memory;
  }
  
  return null;
}

// Monitor periodically
let memoryInterval: NodeJS.Timeout;

export const startMemoryMonitoring = () => {
  memoryInterval = setInterval(() => {
    const memory = memoryMonitor();
    if (memory && memory.used > 100) { // 100MB threshold
      console.warn('Memory usage above 100MB:', memory);
    }
  }, 10000); // Check every 10 seconds
};

export const stopMemoryMonitoring = () => {
  if (memoryInterval) {
    clearInterval(memoryInterval);
  }
};
```

### Registry Memory Tracking

```typescript
// Track registry memory usage
function trackRegistryMemory(registry: ActionRegister) {
  const info = registry.getRegistryInfo();
  const memoryEstimate = {
    handlers: info.totalHandlers * 1024, // ~1KB per handler estimate
    actions: info.totalActions * 512,    // ~512B per action estimate
    total: (info.totalHandlers * 1024) + (info.totalActions * 512)
  };
  
  console.log('Registry memory estimate:', {
    totalHandlers: info.totalHandlers,
    totalActions: info.totalActions,
    estimatedMemory: `${Math.round(memoryEstimate.total / 1024)}KB`
  });
  
  return memoryEstimate;
}
```

## 🧹 Cleanup Strategies

### Component Lifecycle Cleanup

```typescript
// Complete component cleanup pattern
function UserManagement() {
  const registry = useActionRegister();
  const userStore = useUserStore('profile');
  
  // Register handlers
  useActionHandler('updateUser', userUpdateHandler, {
    id: 'user-updater',
    replaceExisting: true  // Prevents accumulation during HMR
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up specific resources
      registry.clearAction('updateUser');
      
      // Optional: Full registry cleanup if this is the owner
      if (registry.getRegistryInfo().totalHandlers === 0) {
        registry.destroy();
      }
    };
  }, [registry]);
  
  return <div>User Management Component</div>;
}
```

### Timer and Promise Cleanup

```typescript
// Comprehensive timer management
function useTimerCleanup() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  const addTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
    return timer;
  };
  
  const clearTimer = (timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timersRef.current.delete(timer);
  };
  
  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  };
  
  // Auto-cleanup on unmount
  useEffect(() => {
    return clearAllTimers;
  }, []);
  
  return { addTimer, clearTimer, clearAllTimers };
}

// Usage in action handlers
function ComponentWithTimers() {
  const { addTimer, clearAllTimers } = useTimerCleanup();
  
  useActionHandler('delayedAction', async (payload) => {
    const timer = addTimer(setTimeout(() => {
      console.log('Delayed execution');
    }, 1000));
    
    // Timer is automatically cleaned up on component unmount
  });
  
  return <div>Component with managed timers</div>;
}
```

## 🚨 Memory Leak Prevention

### Common Memory Leak Patterns

```typescript
// ❌ MEMORY LEAK: Storing large objects
const badStore = createStore({
  initialValue: {
    domElement: document.body,     // Large DOM reference
    eventHistory: [],              // Growing array
    userSessions: new Map()        // Growing Map
  }
});

// ✅ MEMORY SAFE: Store only essential data
const goodStore = createStore({
  initialValue: {
    elementInfo: { id: 'body', tagName: 'BODY' },  // Essential data only
    recentEvents: [],                               // With size limit
    sessionCount: 0                                 // Aggregate data
  }
});

// Size-limited collections
const createBoundedStore = (maxSize: number) => {
  return createStore({
    initialValue: { items: [] },
    // Custom update with size limiting
    comparisonOptions: { 
      strategy: 'custom',
      compare: (a, b) => {
        // Limit array size during updates
        if (Array.isArray(b.items) && b.items.length > maxSize) {
          b.items = b.items.slice(-maxSize); // Keep only recent items
        }
        return JSON.stringify(a) === JSON.stringify(b);
      }
    }
  });
};
```

### Circular Reference Prevention

```typescript
// ✅ SAFE: Improved circular reference detection (v0.4.1)
const userStore = createStore({
  initialValue: { profile: null }
});

// Framework automatically handles circular references
const userProfile = {
  id: '123',
  name: 'John',
  settings: {}
};

// This won't cause circular reference issues
userProfile.settings.owner = userProfile; // Circular reference
userStore.setValue({ profile: userProfile }); // Safely handled
```

## 📈 Performance Optimization

### Memory-Efficient Patterns

```typescript
// Object pooling for frequent updates
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  
  constructor(createFn: () => T, initialSize = 10) {
    this.createFn = createFn;
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }
  
  get(): T {
    return this.pool.pop() || this.createFn();
  }
  
  release(obj: T): void {
    // Reset object state
    Object.keys(obj).forEach(key => {
      delete (obj as any)[key];
    });
    this.pool.push(obj);
  }
}

// Usage with frequent updates
const updateDataPool = new ObjectPool(() => ({}));

useActionHandler('frequentUpdate', async (payload) => {
  const updateObj = updateDataPool.get();
  
  try {
    // Populate update object
    Object.assign(updateObj, payload);
    
    // Use for store update
    const updated = await produceWithImmer(currentState, (draft) => {
      Object.assign(draft, updateObj);
    });
    
    store.setValue(updated);
  } finally {
    // Return to pool
    updateDataPool.release(updateObj);
  }
});
```

## 🛡️ Production Memory Management

### Monitoring and Alerts

```typescript
// Production memory monitoring
const setupProductionMemoryMonitoring = (registry: ActionRegister) => {
  // Check registry size periodically  
  setInterval(() => {
    const info = registry.getRegistryInfo();
    const memoryEstimate = info.totalHandlers * 1024; // Rough estimate
    
    if (memoryEstimate > 10 * 1024 * 1024) { // 10MB threshold
      console.warn('Registry memory usage high:', {
        handlers: info.totalHandlers,
        actions: info.totalActions,
        estimatedMemory: `${Math.round(memoryEstimate / 1024 / 1024)}MB`
      });
      
      // Optional: Trigger cleanup
      if (info.totalHandlers > 5000) {
        console.error('Critical handler count - consider cleanup');
      }
    }
  }, 60000); // Check every minute
};
```

### Emergency Cleanup Protocols

```typescript
// Emergency memory cleanup
const emergencyCleanup = (registry: ActionRegister) => {
  console.warn('Executing emergency memory cleanup');
  
  // Get current state
  const info = registry.getRegistryInfo();
  console.log('Before cleanup:', info);
  
  // Clear non-essential handlers
  const actions = registry.getRegisteredActions();
  actions.forEach(action => {
    const stats = registry.getActionStats(action);
    if (stats && stats.handlerCount > 100) {
      console.warn(`Action '${action}' has ${stats.handlerCount} handlers - clearing`);
      registry.clearAction(action);
    }
  });
  
  // Force cleanup
  registry.destroy();
  
  console.log('Emergency cleanup completed');
};

// Trigger cleanup on memory pressure
if (performance.memory?.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.9) {
  emergencyCleanup(registry);
}
```

## 📊 Memory Metrics and Monitoring

### Development Memory Dashboard

```typescript
// Memory dashboard component for development
function MemoryDashboard({ registry }: { registry: ActionRegister }) {
  const [memoryStats, setMemoryStats] = useState(null);
  
  useEffect(() => {
    const updateStats = () => {
      const registryInfo = registry.getRegistryInfo();
      const browserMemory = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null;
      
      setMemoryStats({
        registry: {
          actions: registryInfo.totalActions,
          handlers: registryInfo.totalHandlers,
          estimatedSize: `${Math.round(registryInfo.totalHandlers * 1024 / 1024)}MB`
        },
        browser: browserMemory
      });
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, [registry]);
  
  if (!memoryStats) return null;
  
  return (
    <div className="memory-dashboard">
      <h3>Memory Usage</h3>
      
      <div>
        <h4>Registry</h4>
        <p>Actions: {memoryStats.registry.actions}</p>
        <p>Handlers: {memoryStats.registry.handlers}</p>
        <p>Estimated Size: {memoryStats.registry.estimatedSize}</p>
      </div>
      
      {memoryStats.browser && (
        <div>
          <h4>Browser Memory (MB)</h4>
          <p>Used: {memoryStats.browser.used}</p>
          <p>Total: {memoryStats.browser.total}</p>
          <p>Limit: {memoryStats.browser.limit}</p>
          <p>Usage: {Math.round(memoryStats.browser.used / memoryStats.browser.limit * 100)}%</p>
        </div>
      )}
    </div>
  );
}
```

## 🎯 Best Practices

### Memory-Conscious Development

1. **Handler Limits**: Use appropriate `maxHandlersPerAction` for your app size
2. **Regular Cleanup**: Call `destroy()` when registries are no longer needed
3. **Event Data**: Never store event objects - extract needed data only
4. **Size Monitoring**: Monitor handler counts and memory usage in development
5. **Cleanup Testing**: Test component unmount scenarios for memory leaks

### Production Memory Strategy

```typescript
// Production-ready memory configuration
const productionRegistry = new ActionRegister<AppActions>({
  name: 'ProductionApp',
  registry: {
    // Conservative memory limits
    maxHandlersPerAction: 1000,
    
    // Enable cleanup
    autoCleanup: true,
    
    // Error monitoring
    errorHandler: (error, context) => {
      // Log to monitoring service
      errorService.captureException(error, {
        action: context.action,
        handlerId: context.handlerId,
        component: 'ActionRegister'
      });
    }
  }
});

// Periodic health checks
setInterval(() => {
  const info = productionRegistry.getRegistryInfo();
  
  // Alert if handler count is growing unexpectedly
  if (info.totalHandlers > 2000) {
    console.error('Handler count exceeding expected limits:', info);
    
    // Optional: Trigger cleanup or restart
    if (info.totalHandlers > 5000) {
      console.error('Critical handler count - initiating cleanup');
      // Implement graceful restart or cleanup strategy
    }
  }
}, 300000); // Check every 5 minutes
```

### Memory Leak Testing

```typescript
// Test for memory leaks
describe('Memory Leak Prevention', () => {
  test('should not leak memory with many handler registrations', () => {
    const registry = new ActionRegister();
    const initialMemory = performance.memory?.usedJSHeapSize;
    
    // Register many handlers
    for (let i = 0; i < 1000; i++) {
      registry.register('testAction', () => {}, { id: `handler-${i}` });
    }
    
    // Clean up
    registry.destroy();
    
    // Force garbage collection if available (Node.js with --expose-gc)
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize;
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    }
  });
});
```

## 🔧 Memory Configuration Tuning

### Application Size Guidelines

```typescript
// Memory configuration based on application complexity
const getMemoryConfig = (appSize: 'small' | 'medium' | 'large' | 'enterprise') => {
  const configs = {
    small: {
      maxHandlersPerAction: 200,
      cleanupInterval: 30000,     // 30 seconds
      memoryThreshold: 50 * 1024 * 1024  // 50MB
    },
    
    medium: {
      maxHandlersPerAction: 1000,  // Default
      cleanupInterval: 60000,      // 1 minute
      memoryThreshold: 100 * 1024 * 1024  // 100MB
    },
    
    large: {
      maxHandlersPerAction: 3000,
      cleanupInterval: 120000,     // 2 minutes
      memoryThreshold: 200 * 1024 * 1024  // 200MB
    },
    
    enterprise: {
      maxHandlersPerAction: 10000,
      cleanupInterval: 300000,     // 5 minutes
      memoryThreshold: 500 * 1024 * 1024  // 500MB
    }
  };
  
  return configs[appSize];
};

// Apply configuration
const config = getMemoryConfig('medium');
const registry = new ActionRegister({
  registry: {
    maxHandlersPerAction: config.maxHandlersPerAction,
    autoCleanup: true
  }
});
```

The enhanced memory management system provides robust protection against memory leaks while maintaining optimal performance for applications of all sizes.