# User Guide

Welcome to the Context-Action framework user guide! This comprehensive documentation will help you master the framework's patterns and architecture.

## 🚀 Getting Started

### Essential Guides
- **[Getting Started](./getting-started.md)** - Quick start guide and installation
- **[Pipeline System](./pipeline/)** - Understanding the action processing system
- **[Hook Lifecycle](../concept/action-pipeline-guide.md)** - React hooks reference and internal behavior
- **[Best Practices](./best-practices.md)** - Recommended patterns and conventions
- **[React Aria Integration](./react-aria-integration.md)** - Keep accessible component state local and connect domain decisions to Context-Action
- **[Troubleshooting](./troubleshooting.md)** - Common issues and memory management

## 🎯 Pattern Collection

### Core Framework Patterns
- **[Code Patterns](./code-patterns.md)** - Overview and migration guide to patterns directory
- **[Pattern Collection](./patterns/setup/index.md)** - Comprehensive pattern documentation

The **[Pattern Collection](./patterns/setup/index.md)** contains all the detailed implementation patterns:

| Pattern | Use Case | Best For |
|---------|----------|----------|
| **[Action Only](./patterns/action/)** | Action dispatching with memory management | Event systems, command patterns |
| **[Store Only](./patterns/store/basic-usage.md)** | State management without actions | Pure state management, data layers |
| **[RefContext](./patterns/ref/basic-usage.md)** | Direct DOM manipulation | High-performance UI, animations |
| **[Setup Patterns](./patterns/setup/)** | Foundation patterns | All implementations |
| **[Architecture](../context-layered/context-layered-guide.md)** | System design | Complex applications |
| **[Performance](./patterns/store/path-based-subscription.md)** | Optimization techniques | High-performance apps |
| **[Async Patterns](./patterns/async/)** | Safe async operations | Element waiting, timeouts |

## 📖 Learning Path

### For New Users
1. Start with **[Getting Started](./getting-started.md)** for setup
2. Read **[MVVM Architecture](../concept/architecture-guide.md)** to understand the framework
3. Try **[Store Only Pattern](./patterns/store/basic-usage.md)** for simple state management
4. Explore **[Pattern Collection](./patterns/setup/index.md)** as your needs grow

### For Advanced Users
1. Study **[Pipeline System](./pipeline/)** for complex business logic
2. Learn **[Domain Architecture](../context-layered/context-layered-guide.md)** for multi-team projects
3. Master **[Async Patterns](./patterns/async/)** for performance-critical code
4. Review **[Best Practices](./best-practices.md)** for production-ready implementations

## 🔗 Related Documentation

- **[Core Concepts](/en/concept/architecture-guide)** - Fundamental framework concepts
- **[API Reference](/en/api/README)** - Complete API documentation
- **[Examples](/en/examples/basic-setup)** - Working code examples
- **[LLM Resources](/en/llms/)** - AI integration guides

## 📝 Quick Navigation

Looking for something specific?

- **State Management** → [Store Patterns](./patterns/store/basic-usage.md)
- **Business Logic** → [Action Patterns](./patterns/action/) (includes memory management)
- **Performance** → [Performance Patterns](./patterns/store/path-based-subscription.md) or [RefContext](./patterns/ref/basic-usage.md)
- **Complex Apps** → [Architecture Patterns](../context-layered/context-layered-guide.md)
- **Foundation** → [Setup Patterns](./patterns/setup/)
- **Async Operations** → [Async Patterns](./patterns/async/)
- **Troubleshooting** → [Best Practices](./best-practices.md) or [Troubleshooting](./troubleshooting.md)

---

*Context-Action separates typed command pipelines from reactive stores and refs so you can start simple and adopt stricter architectural boundaries only as complexity grows.*
