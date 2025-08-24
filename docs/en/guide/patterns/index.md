# Patterns

This section contains comprehensive code patterns and implementation guides for the Context-Action framework.

## Core Framework Patterns

### Action Patterns
- **[Action Patterns](./action/)** - Pure action dispatching without state management
  - [Basic Usage](./action/basic-usage.md) - Fundamental Action Only pattern implementation
  - [Register Delegation](./action/register-delegation.md) - Advanced pattern for modular handler organization

### Store Patterns  
- **[Store Patterns](./store/)** - Type-safe state management (Recommended)
  - [Basic Usage](./store/basic-usage.md) - Fundamental Store Only pattern with type inference
  - [HOC Pattern](./store/hoc-pattern.md) - Higher-Order Component pattern for automatic Provider wrapping
  - [Advanced Config](./store/advanced-config.md) - Performance optimization and custom comparison strategies

### Ref Patterns
- **[Ref Patterns](./ref/)** - Direct DOM manipulation with zero re-renders
  - [Basic Usage](./ref/basic-usage.md) - Fundamental RefContext pattern with type-safe ref management
  - [Multi-Context](./ref/multi-context.md) - Multiple RefContext composition for complex applications
  - [Performance](./ref/performance.md) - Hardware acceleration and performance optimization

### Architecture Patterns
- **[Architecture Patterns](./architecture/)** - System architecture and design patterns
  - [MVVM Pattern](./architecture/mvvm.md) - Model-View-ViewModel architecture with perfect layer separation
  - [Domain Context Pattern](./architecture/domain-context.md) - Document-centric domain separation for multi-domain apps
  - [Composition Strategies](./architecture/composition.md) - Advanced pattern composition for complex applications
  - [Context Splitting Patterns](./architecture/context-splitting.md) - Managing and splitting large contexts for scalability

### Async Patterns
- **[Async Patterns](./async/)** - Asynchronous operation patterns and control flow
  - [Real-time State Access](./async/real-time-state-access.md) - Avoiding closure traps with store.getValue()
  - [Wait-Then-Execute](./async/wait-then-execute.md) - Safe DOM operations after element availability
  - [Conditional Await](./async/conditional-await.md) - Smart waiting based on conditions
  - [Timeout Protection](./async/timeout-protection.md) - Preventing infinite waits with fallback strategies

### Performance Patterns
- **[Performance Patterns](./performance/)** - Performance optimization techniques and strategies
  - [Optimization Techniques](./performance/optimization-techniques.md) - Store optimization, memoization, and RefContext performance

### Debug Patterns
- **[Debug Patterns](./debug/)** - Production debugging and troubleshooting patterns
  - [Production Debugging](./debug/production-debugging.md) - Critical issues, state monitoring, error recovery, and stress testing

## Quick Start Guide

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |
| **🔧 Ref Context** | Direct DOM manipulation with zero re-renders | `createRefContext` | High-performance UI, animations, real-time interactions |

**Note**: For complex applications, compose patterns together for maximum flexibility and separation of concerns.

## Usage Guidelines

Each pattern includes:
- ✅ **Best practices** with working examples
- ❌ **Common pitfalls** to avoid
- 🎯 **Use cases** for when to apply the pattern
- ⚡ **Performance considerations** and optimization tips

## Architecture Decision Guide

### Single Domain Applications
1. **Simple Apps**: Start with **Store Only Pattern**
2. **Interactive Apps**: Add **Action Only Pattern** for business logic
3. **High-Performance Apps**: Add **RefContext Pattern** for animations
4. **Complex Apps**: Use **MVVM Architecture** for perfect layer separation

### Multi-Domain Applications
1. **Team Boundaries**: Use **Domain Context Architecture** for business separation
2. **Combined Approach**: Apply **MVVM Architecture** within each business domain
3. **Enterprise Scale**: Combine all patterns with proper domain isolation

## Pattern Integration

These patterns can be combined for complex scenarios:
- **Action Only** + **Store Only** for complete business logic separation
- **RefContext** + **Store Only** for high-performance state-driven animations
- **All Three Patterns** + **Domain Architecture** for enterprise applications
- **MVVM Architecture** for perfect architectural layer separation