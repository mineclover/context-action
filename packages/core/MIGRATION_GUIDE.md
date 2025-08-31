# Migration Guide: Context-Action Core v0.4.0 → v0.4.1

## 📋 개요

이 가이드는 Context-Action core 패키지를 v0.4.1로 업그레이드할 때 필요한 정보를 제공합니다. 대부분의 변경사항은 **하위 호환성을 유지**하므로 기존 코드는 대부분 수정 없이 작동합니다.

## 🔄 업그레이드 방법

```bash
# npm 사용 시
npm update @context-action/core

# pnpm 사용 시  
pnpm update @context-action/core

# yarn 사용 시
yarn upgrade @context-action/core
```

---

## ✅ 완전 호환 - 변경 불필요

### 기본 API 사용
모든 핵심 API는 그대로 작동합니다:

```typescript
// ✅ 기존 코드 - 수정 불필요
const actionRegister = new ActionRegister<MyActions>();

// ✅ 핸들러 등록 - 그대로 사용
const unregister = actionRegister.register('myAction', handler);

// ✅ 액션 디스패치 - 그대로 사용  
await actionRegister.dispatch('myAction', payload);

// ✅ 핸들러 해제 - 그대로 사용
unregister();
```

---

## ⚠️ 제거된 기능 - 업데이트 필요

### 1. ExecutionStats API 제거

#### 제거된 메서드
```typescript
// ❌ 제거됨 - 사용 불가
actionRegister.clearExecutionStats();
actionRegister.clearActionExecutionStats('myAction');
```

#### 마이그레이션
```typescript
// Before (v0.4.0)
actionRegister.clearExecutionStats();

// After (v0.4.1) - 단순히 제거
// 통계는 더 이상 자동으로 수집되지 않으므로 정리할 필요 없음
```

### 2. getActionStats의 executionStats 속성

```typescript
// Before (v0.4.0)  
const stats = actionRegister.getActionStats('myAction');
console.log(stats.executionStats?.totalExecutions); // 숫자 반환

// After (v0.4.1)
const stats = actionRegister.getActionStats('myAction'); 
console.log(stats.executionStats); // undefined
```

---

## 🆕 새로운 기능 활용

### 메모리 관리 설정

```typescript
// 핸들러 수 제한 설정 (선택사항)
const actionRegister = new ActionRegister({
  registry: {
    maxHandlersPerAction: 500        // 기본값: 1000
    // maxHandlersPerAction: 10000   // 높은 한도 (엔터프라이즈)
    // maxHandlersPerAction: Infinity // 제한 해제 (신뢰할 수 있는 환경에서만)
  }
});

// 📝 한도 설정 가이드:
// • 소규모 앱: 100-500
// • 일반 앱: 1000 (기본값) 
// • 대규모 앱: 5000-10000
// • 제한 해제: Infinity (메모리 위험 있음)
```

---

**업그레이드 완료를 축하합니다!** 🎉

---

This guide helps you migrate from Context-Action Core v0.3.x to v0.4.0 and take advantage of the new features while maintaining backward compatibility.

## 🔄 Backward Compatibility

**Good news!** Version 0.4.0 maintains **100% backward compatibility**. Your existing code will continue to work without any changes. All new features are **opt-in** with sensible defaults.

## 📈 Performance Improvements (Automatic)

The following performance improvements are **automatically applied** to all existing code:

### Environment Variable Caching
- **60% faster** debug mode detection
- No code changes needed - automatically activated

### Handler ID Generation Optimization
- Improved handler ID generation using per-action counters
- No code changes needed - automatically activated

### Smart Array Filtering
- Only copies arrays when filtering is actually needed
- No code changes needed - automatically activated

### Memory Management
- **NEW**: ActionGuard auto-cleanup (60s idle timeout)
- **NEW**: Comprehensive `destroy()` method for cleanup
- Optional - call `registry.destroy()` when done with registry

```typescript
// Optional: Clean up when registry is no longer needed
const registry = new ActionRegister<MyActions>({ name: 'MyApp' });

// Use the registry...

// Clean up all resources when done
registry.destroy(); // Cleans up pipelines, guards, queues, stats
```

## 🎯 New Features (Opt-in)

### 1. Advanced Filtering System

Filter handlers by priority, ID, or custom logic:

```typescript
// Before (v0.3.x) - no filtering available
await actions.dispatch('processData', data);

// After (v0.4.0) - with filtering options
await actions.dispatch('processData', data, {
  filter: {
    // Filter by priority range
    priority: { min: 10, max: 50 },
    
    // Filter by specific handler IDs
    handlerIds: ['validation', 'logging'],
    excludeHandlerIds: ['analytics'],
    
    // Custom filtering logic
    custom: (config) => config.blocking === true
  }
});
```

### 2. Handler Replacement (React HMR Support)

Perfect for React Hot Module Replacement:

```typescript
// Before (v0.3.x) - handlers would accumulate during HMR
actions.register('myAction', handler, { id: 'my-handler' });

// After (v0.4.0) - replace existing handlers
actions.register('myAction', handler, { 
  id: 'my-handler',
  replaceExisting: true  // 🆕 Replace handler with same ID
});
```

### 3. Enhanced Dispatch Options

New execution control options:

```typescript
// Before (v0.3.x)
await actions.dispatch('myAction', payload, {
  debounce: 300,
  executionMode: 'parallel'
});

// After (v0.4.0) - new options available
await actions.dispatch('myAction', payload, {
  // Existing options still work
  debounce: 300,
  executionMode: 'parallel',
  
  // 🆕 New options
  immediate: true,        // Bypass queue
  queuePriority: 5,      // Queue priority
  timeout: 5000,         // Execution timeout
  
  // 🆕 Retry on error
  retryOnError: {
    maxAttempts: 3,
    delay: 1000
  }
});
```

### 4. Result Collection Strategies

Enhanced result handling:

```typescript
// Before (v0.3.x) - basic result collection
const result = await actions.dispatchWithResult('myAction', payload);

// After (v0.4.0) - advanced result strategies
const result = await actions.dispatchWithResult('myAction', payload, {
  result: {
    collect: true,
    strategy: 'merge',      // 'first' | 'last' | 'all' | 'merge' | 'custom'
    maxResults: 10,         // Performance optimization
    includeErrors: true,    // Include error information
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
});

// Access detailed execution information
console.log('Results:', result.results);
console.log('Execution time:', result.execution.duration);
console.log('Handlers executed:', result.execution.handlersExecuted);
console.log('Success rate:', result.success);
```

### 5. Enhanced Configuration Options

New ActionRegister configuration:

```typescript
// Before (v0.3.x)
const registry = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: {
    debug: true
  }
});

// After (v0.4.0) - new configuration options
const registry = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: {
    debug: true,
    autoCleanup: true,
    defaultExecutionMode: 'sequential',
    
    // 🆕 New options
    useConcurrencyQueue: true,   // Thread-safe operations
    errorHandler: (error, context) => {
      console.error('Unhandled action error:', error);
      // Custom error handling logic
    }
  }
});
```

### 6. Statistics and Monitoring

Statistics are always available - no configuration needed:

```typescript
// 🆕 Registry information (always available)
const info = actions.getRegistryInfo();
console.log(`Total actions: ${info.totalActions}`);
console.log(`Total handlers: ${info.totalHandlers}`);

// 🆕 Action-specific statistics (always available)
const stats = actions.getActionStats('updateUser');
if (stats) {
  console.log(`Handler count: ${stats.handlerCount}`);
  console.log(`Success rate: ${stats.executionStats?.successRate}%`);
  console.log(`Average duration: ${stats.executionStats?.averageDuration}ms`);
}

// 🆕 Clear statistics when needed
actions.clearExecutionStats();
```

## ⚛️ React Integration Improvements

### React Helper Utilities

New React integration helpers for better development experience:

```typescript
// 🆕 React helper imports
import { 
  useActionHandler, 
  ReactDevUtils 
} from '@context-action/core';

// 🆕 Enhanced useActionHandler with HMR support
function MyComponent() {
  const registry = useActionRegister();
  
  // Auto-cleanup on unmount, HMR support
  const handlerConfig = useActionHandler(
    registry,
    'userAction', 
    async (payload) => {
      // Handler logic
    },
    { 
      priority: 10,
      replaceExisting: true  // HMR support
    },
    [] // dependencies
  );
  
  // 🆕 Direct registry dispatch with error handling
  const handleDispatch = useCallback(async (action, payload) => {
    try {
      await registry.dispatch(action, payload);
    } catch (error) {
      console.error(`Failed to dispatch ${action}:`, error);
    }
  }, [registry]);
  
  return (
    <button onClick={() => handleDispatch('userAction', { id: '123' })}>
      Update User
    </button>
  );
}

// 🆕 Development utilities
ReactDevUtils.enableDebugMode();
const stats = ReactDevUtils.getStats(registry);
```

## 🚀 Performance Migration Strategy

### Recommended Migration Steps

1. **Update Dependencies** (No breaking changes)
   ```bash
   npm install @context-action/core@^0.4.0
   # or
   pnpm install @context-action/core@^0.4.0
   ```

2. **Enable Handler Replacement** (For React apps with HMR)
   ```typescript
   // Add replaceExisting to existing handler registrations
   actions.register('myAction', handler, { 
     id: 'my-handler',
     replaceExisting: true  // 🆕 Add this for HMR support
   });
   ```

3. **Add Cleanup** (Recommended)
   ```typescript
   // Add cleanup when registry is no longer needed
   useEffect(() => {
     return () => {
       registry.destroy(); // 🆕 Clean up resources
     };
   }, []);
   ```

4. **Upgrade Filtering** (When needed)
   ```typescript
   // Replace custom filtering logic with built-in filtering
   await actions.dispatch('myAction', payload, {
     filter: {
       priority: { min: 10 },           // 🆕 Built-in priority filtering
       custom: (config) => config.blocking === true  // 🆕 Custom logic
     }
   });
   ```

### Performance Tips for v0.4.0

1. **Use handler IDs** for better debugging and filtering
2. **Enable replaceExisting** for React components to prevent duplicates
3. **Use immediate: false** (default) to benefit from queue optimizations  
4. **Call destroy()** when registry is no longer needed
5. **Use priority filtering** instead of excludeHandlerIds for better performance
6. **Cache ActionRegister instances** - don't create new ones frequently

## 🔧 Common Migration Patterns

### Pattern 1: Basic Handler Registration

```typescript
// Before (v0.3.x) - still works in v0.4.0
actions.register('myAction', handler);

// After (v0.4.0) - enhanced with new options
actions.register('myAction', handler, { 
  id: 'my-handler',
  replaceExisting: true,  // Great for React HMR
  priority: 10
});
```

### Pattern 2: Result Collection

```typescript
// Before (v0.3.x)
const result = await actions.dispatchWithResult('myAction', payload);

// After (v0.4.0) - with result strategies
const result = await actions.dispatchWithResult('myAction', payload, {
  result: {
    strategy: 'all',
    collect: true,
    maxResults: 5
  }
});
```

### Pattern 3: Error Handling

```typescript
// Before (v0.3.x) - basic error handling in handlers
actions.register('myAction', async (payload, controller) => {
  try {
    const result = await someAsyncOperation(payload);
    return result;
  } catch (error) {
    // Error handling in handler
    throw error;
  }
});

// After (v0.4.0) - enhanced with retry and global error handling
const registry = new ActionRegister<MyActions>({
  registry: {
    errorHandler: (error, context) => {
      console.error(`Error in ${context.action}:`, error);
      // Global error handling
    }
  }
});

await actions.dispatch('myAction', payload, {
  retryOnError: {
    maxAttempts: 3,
    delay: 1000
  }
});
```

## 🧪 Testing Your Migration

### Verification Checklist

- [ ] **Compatibility**: Existing code works without changes
- [ ] **Performance**: Notice improved performance (debug mode detection)
- [ ] **New Features**: New features work as expected when opted in
- [ ] **React HMR**: Handler replacement works in React development
- [ ] **Statistics**: Statistics are always available
- [ ] **Cleanup**: Memory cleanup works when calling `destroy()`

### Testing New Features

```typescript
// Test filtering
const result = await actions.dispatchWithResult('testAction', payload, {
  filter: { priority: { min: 10 } },
  result: { collect: true }
});
console.log('Filtered results:', result.results);

// Test statistics (always available)
actions.getRegistryInfo();
const stats = actions.getActionStats('testAction');
console.log('Action stats:', stats);

// Test cleanup
registry.destroy();
```

## 💡 Best Practices for v0.4.0

1. **Gradual Migration**: Migrate incrementally - add new features as needed
2. **Handler IDs**: Always use meaningful handler IDs for better debugging
3. **Resource Cleanup**: Call `destroy()` when registries are no longer needed
4. **Statistics**: Statistics are always available when needed
5. **Error Handling**: Use global error handlers for consistent error handling
6. **Performance**: Use filtering to optimize handler execution

## 📚 Additional Resources

- [Complete README](./README.md) - All v0.4.0 features with examples
- [API Documentation](../docs/en/api/core/src) - Updated type definitions
- [Change Log](./CHANGELOG.md) - Detailed list of all changes
- [Filter Demo](./filter-demo.ts) - Working examples of filtering features

## 🤝 Need Help?

If you encounter any issues during migration:

1. Check this migration guide for common patterns
2. Review the [API documentation](../docs/en/api/core/src) for updated interfaces
3. Look at the [examples](./README.md#examples) in the README
4. Open an issue on [GitHub](https://github.com/mineclover/context-action/issues)

**Remember**: All existing code continues to work unchanged. New features are opt-in and can be adopted gradually based on your needs.