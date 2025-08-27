# Performance Patterns

Performance optimization patterns and techniques for Context-Action framework applications.

## 🚀 Performance Optimization

### Core Optimization Techniques
- **[Optimization Techniques](./optimization-techniques.md)** - Comprehensive performance optimization guide
  - Store optimization strategies
  - Action handler optimization and memory management
  - Memoization patterns
  - RefContext performance techniques

## 🎯 Quick Reference

### Performance Strategies

| Area | Technique | Best Practice |
|------|-----------|---------------|
| **Store** | Comparison Strategy | Choose based on data characteristics |
| **Actions** | Handler Memoization + Memory Limits | Use useCallback with stable deps, configure maxHandlersPerAction |
| **RefContext** | Direct DOM | Zero re-renders with hardware acceleration |
| **Components** | Memoization | Memoize expensive computations |

### Comparison Strategy Guide

```tsx
// Primitives: reference (default)
counter: 0

// Object properties: shallow
userProfile: { initialValue: {...}, strategy: 'shallow' }

// Deep nested: deep
complexData: { initialValue: {...}, strategy: 'deep' }

// Large datasets: reference
largeArray: { initialValue: [...], strategy: 'reference' }

// Custom logic: custom comparator
versionData: { 
  comparisonOptions: { 
    strategy: 'custom',
    customComparator: (old, new) => old.version === new.version 
  }
}
```

### Performance Anti-patterns

❌ **Avoid these patterns:**
- Full object subscriptions when only partial data needed
- State-driven updates for high-frequency events
- Missing useCallback for handlers
- Unnecessary deep comparison strategies
- Not cleaning up animations and event listeners
- Excessive handler registration without proper limits
- Ignoring memory management in action patterns

## 📚 Related Documentation

- [RefContext Performance](../ref/performance.md)
- [Hardware Acceleration](../ref/hardware-acceleration.md)
- [Memory Optimization](../ref/memory-optimization.md)
- [Action Memory Management](../action/register-patterns.md#memory-management-and-handler-limits)