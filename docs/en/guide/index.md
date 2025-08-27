# User Guide

Welcome to the Context-Action framework user guide! This comprehensive documentation will help you master the framework's patterns and architecture.

## 🚀 Getting Started

### Essential Guides
- **[Getting Started](./getting-started.md)** - Quick start guide and installation
- **[Pipeline System](./pipeline/)** - Understanding the action processing system
- **[Hook Lifecycle](./lifecycle/)** - React hooks reference and internal behavior
- **[Best Practices](./best-practices.md)** - Recommended patterns and conventions
- **[Troubleshooting](./troubleshooting.md)** - Common issues and memory management

## 🎯 Pattern Collection

### Core Framework Patterns
- **[Code Patterns](./code-patterns.md)** - Overview and migration guide to patterns directory
- **[Pattern Collection](./patterns/)** - Comprehensive pattern documentation

The **[Pattern Collection](./patterns/)** contains all the detailed implementation patterns:

| Pattern | Use Case | Best For |
|---------|----------|----------|
| **[Action Only](./patterns/action/)** | Action dispatching with memory management | Event systems, command patterns |
| **[Store Only](./patterns/store/)** | State management without actions | Pure state management, data layers |
| **[RefContext](./patterns/ref/)** | Direct DOM manipulation | High-performance UI, animations |
| **[Setup Patterns](./patterns/setup/)** | Foundation patterns | All implementations |
| **[Architecture](./patterns/architecture/)** | System design | Complex applications |
| **[Performance](./patterns/performance/)** | Optimization techniques | High-performance apps |
| **[Async Patterns](./patterns/async/)** | Safe async operations | Element waiting, timeouts |

## 📖 Learning Path

### For New Users
1. Start with **[Getting Started](./getting-started.md)** for setup
2. Read **[MVVM Architecture](./patterns/architecture/mvvm.md)** to understand the framework
3. Try **[Store Only Pattern](./patterns/store/)** for simple state management
4. Explore **[Pattern Collection](./patterns/)** as your needs grow

### For Advanced Users
1. Study **[Pipeline System](./pipeline/)** for complex business logic
2. Learn **[Domain Architecture](./patterns/architecture/domain-context.md)** for multi-team projects
3. Master **[Async Patterns](./patterns/async/)** for performance-critical code
4. Review **[Best Practices](./best-practices.md)** for production-ready implementations

## 🔗 Related Documentation

- **[Core Concepts](/en/concept/)** - Fundamental framework concepts
- **[API Reference](/en/api/)** - Complete API documentation
- **[Examples](/en/examples/)** - Working code examples
- **[LLM Resources](/en/llms/)** - AI integration guides

## 📝 Quick Navigation

Looking for something specific?

- **State Management** → [Store Patterns](./patterns/store/)
- **Business Logic** → [Action Patterns](./patterns/action/) (includes memory management)
- **Performance** → [Performance Patterns](./patterns/performance/) or [RefContext](./patterns/ref/)
- **Complex Apps** → [Architecture Patterns](./patterns/architecture/)
- **Foundation** → [Setup Patterns](./patterns/setup/)
- **Async Operations** → [Async Patterns](./patterns/async/)
- **Troubleshooting** → [Best Practices](./best-practices.md) or [Troubleshooting](./troubleshooting.md)

---

*The Context-Action framework provides a revolutionary approach to state management with perfect separation of concerns. Start with the patterns that match your current needs and expand as your application grows.*