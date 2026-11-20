# Code Patterns

**📁 For comprehensive patterns and implementation guides, visit: [Pattern Collection](./patterns/setup/index.md)**

This section has been reorganized into the dedicated [patterns directory](./patterns/setup/index.md) with clear categorization:

## 🎯 Core Framework Patterns
- **[Action Only Pattern](../examples/action-only.md)** - Pure action dispatching
- **[Store Only Pattern](../examples/store-only.md)** - Type-safe state management  
- **[RefContext Pattern](./patterns/ref/basic-usage.md)** - Zero re-render DOM manipulation

## 🏗️ Architecture Patterns
- **[Pattern Composition](../examples/pattern-composition.md)** - Combining patterns for complex apps
- **[MVVM Architecture](../concept/architecture-guide.md)** - Single domain architectural layers
- **[Domain Context Architecture](../context-layered/context-layered-guide.md)** - Multi-domain business separation

## ⚡ Advanced Patterns
- **[Async Patterns](./patterns/async/index.md)** - Real-time state, element waiting, timeout protection

> **Migration Note**: All individual pattern files have been consolidated and organized. Please use the [patterns directory](./patterns/setup/index.md) for the most up-to-date documentation.

## Quick Reference

### Essential Rules

#### ✅ Do
- Use `useCallback` for handlers with useWaitForRefs
- Access real-time state with `store.getValue()`
- Handle errors with try-catch
- Test both mounted/unmounted scenarios

#### ❌ Don't
- Use direct DOM queries (`document.getElementById`)
- Rely on component scope values in handlers
- Ignore error handling
- Skip timeout protection for critical paths