# Code Patterns

**📁 For comprehensive patterns and implementation guides, visit: [Pattern Collection](./patterns/)**

This section has been reorganized into the dedicated [patterns directory](./patterns/) with clear categorization:

## 🎯 Core Framework Patterns
- **[Action Only Pattern](./patterns/action-only-pattern.md)** - Pure action dispatching
- **[Store Only Pattern](./patterns/store-only-pattern.md)** - Type-safe state management  
- **[RefContext Pattern](./patterns/ref-context-pattern.md)** - Zero re-render DOM manipulation

## 🏗️ Architecture Patterns
- **[Pattern Composition](./patterns/pattern-composition.md)** - Combining patterns for complex apps
- **[MVVM Architecture](./patterns/mvvm-architecture.md)** - Single domain architectural layers
- **[Domain Context Architecture](./patterns/domain-context-architecture.md)** - Multi-domain business separation

## ⚡ Advanced Patterns
- **[Async Patterns](./patterns/async-patterns.md)** - Real-time state, element waiting, timeout protection

> **Migration Note**: All individual pattern files have been consolidated and organized. Please use the [patterns directory](./patterns/) for the most up-to-date documentation.

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