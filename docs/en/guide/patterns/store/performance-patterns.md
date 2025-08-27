# Store Performance Patterns

Comprehensive guide to optimizing store performance in Context-Action applications. This overview covers all major performance optimization categories.

## Performance Categories

### [Memoization Patterns](./memoization-patterns.md)
Optimization patterns using React's memoization hooks to prevent unnecessary re-renders and expensive computations:

- **Stable Selectors**: Using `useCallback` for consistent selector functions
- **Complex Selector Memoization**: Optimizing data transformations
- **Computed Store Dependencies**: Memoizing expensive computation functions

### [Batching Patterns](./batching-patterns.md)
Patterns for batching multiple store updates to prevent unnecessary re-renders:

- **Store Update Batching**: Using React's `unstable_batchedUpdates`
- **Store Batch API**: Leveraging built-in batch methods
- **Atomic Operations**: Grouping related updates together

### [Subscription Optimization](./subscription-optimization.md)
Optimize store subscriptions to reduce unnecessary re-renders:

- **Selective Subscriptions**: Subscribe only to needed data
- **Conditional Subscriptions**: Subscribe only when necessary
- **Debounced Subscriptions**: Handle fast-changing data efficiently

### [Comparison Strategies](./comparison-strategies.md)
Choose the right comparison strategy to balance performance and accuracy:

- **Reference Comparison**: Fastest for primitives and managed references
- **Shallow Comparison**: Balanced approach for objects
- **Deep Comparison**: Most accurate for nested structures
- **Custom Comparison**: Business logic specific comparisons
- **Circular Reference Safety**: Handle complex object structures

### [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md)
Defer expensive operations and access values only when needed:

- **Lazy State Access**: Get current state at execution time
- **Conditional Store Access**: Access stores only when conditions are met
- **Deferred Calculations**: Postpone expensive computations
- **Lazy Loading**: Load data on demand

### [Memory Management](./memory-management.md)
Prevent memory leaks and manage resources efficiently:

- **Event Object Prevention**: Avoid storing DOM events
- **Subscription Cleanup**: Proper cleanup of manual subscriptions
- **Cross-Platform Timeouts**: Handle timeouts safely across environments
- **Weak References**: Use WeakMap/WeakSet for large data

### [Debugging & Development](./debugging-development.md)
Development tools and debugging patterns:

- **Debug Mode**: Enable debugging for store value changes
- **Performance Monitoring**: Track store update metrics
- **State Inspection**: Debug multiple stores simultaneously
- **Development Utilities**: Custom debugging tools

### [Error Handling & Recovery](./error-handling-recovery.md)
Robust error handling and recovery patterns:

- **Centralized Error Handling**: Use framework's error system
- **EventBus Memory Safety**: Safe event handling patterns
- **Graceful Degradation**: Provide fallback strategies
- **Retry Mechanisms**: Handle transient failures

## Quick Reference

### Performance Priority Matrix

| Priority | Pattern Category | Impact | Complexity |
|----------|------------------|---------|------------|
| High | [Memory Management](./memory-management.md) | 🔴 Critical | ⚡ Low |
| High | [Memoization Patterns](./memoization-patterns.md) | 🟠 Major | ⚡⚡ Medium |
| Medium | [Subscription Optimization](./subscription-optimization.md) | 🟠 Major | ⚡⚡ Medium |
| Medium | [Batching Patterns](./batching-patterns.md) | 🟡 Moderate | ⚡ Low |
| Medium | [Comparison Strategies](./comparison-strategies.md) | 🟡 Moderate | ⚡⚡ Medium |
| Low | [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md) | 🟡 Moderate | ⚡⚡⚡ High |
| Development | [Debugging & Development](./debugging-development.md) | 🔵 Development | ⚡ Low |
| Foundation | [Error Handling & Recovery](./error-handling-recovery.md) | 🔴 Critical | ⚡⚡ Medium |

### Common Performance Issues

1. **Memory Leaks** → [Memory Management](./memory-management.md)
2. **Excessive Re-renders** → [Memoization Patterns](./memoization-patterns.md)
3. **Inefficient Subscriptions** → [Subscription Optimization](./subscription-optimization.md)
4. **Slow Comparisons** → [Comparison Strategies](./comparison-strategies.md)
5. **Unnecessary Work** → [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md)

## Implementation Strategy

### Phase 1: Foundation (Critical)
1. [Memory Management](./memory-management.md) - Prevent leaks
2. [Error Handling & Recovery](./error-handling-recovery.md) - Robust error handling

### Phase 2: Core Optimization (High Impact)
3. [Memoization Patterns](./memoization-patterns.md) - Reduce re-renders
4. [Subscription Optimization](./subscription-optimization.md) - Efficient subscriptions

### Phase 3: Fine-tuning (Medium Impact)
5. [Batching Patterns](./batching-patterns.md) - Batch updates
6. [Comparison Strategies](./comparison-strategies.md) - Optimize comparisons

### Phase 4: Advanced (Situational)
7. [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md) - Defer work
8. [Debugging & Development](./debugging-development.md) - Development tools

## Best Practices Summary

### ✅ Universal Do's
- Use `useCallback` for stable selectors
- Extract data from DOM events instead of storing event objects
- Use framework's centralized error handling system
- Choose appropriate comparison strategies
- Enable debug mode in development only

### ❌ Universal Avoid's
- Creating new functions in selectors on every render
- Storing DOM events or React synthetic events in stores
- Using direct console.error instead of centralized error handling
- Deep comparisons unless absolutely necessary
- Ignoring subscription cleanup

## Architecture Integration

### Immer and Comparison System

Context-Action uses a **dual-layer optimization system**:
- **Immer Layer**: Safe immutable updates with Copy-on-Write optimization
- **Comparison Layer**: Change detection and re-render optimization

**Why both are needed:**
- **Immer**: Prevents mutation bugs, ensures safe copies
- **Comparison**: Prevents unnecessary re-renders, optimizes performance

**Key insight**: Immer handles immutability, comparison handles change detection. They solve different problems and work together.

For detailed technical information, see:
- [Immutability & Comparison Integration](./immutability-comparison-integration.md) - Complete integration guide
- [Immutability Architecture](../architecture/immutability-architecture.md) - Technical deep-dive

### Performance Impact

| System | Performance Benefit | When Active |
|--------|-------------------|-------------|
| **Immer Copy-on-Write** | Avoid unnecessary object creation | Individual store updates |
| **Comparison Optimization** | Skip re-renders for identical values | Individual store setValue() calls |
| **Combined System** | Maximum efficiency | Each store operates independently |

## Related Patterns

- [Immutability & Comparison Integration](./immutability-comparison-integration.md) - **Start here for integration details**
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [useStoreSelector Patterns](./useStoreSelector-patterns.md) - Multiple store selection
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns
- [Store Configuration](./store-configuration.md) - Configure store behavior
- [Immutability Architecture](../architecture/immutability-architecture.md) - Technical architecture
- [Production Debugging](../debug/production-debugging.md) - Production debugging techniques