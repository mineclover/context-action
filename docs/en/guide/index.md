# Context-Action Guide

Welcome to the Context-Action comprehensive guide! This documentation will help you understand and implement the Context-Action framework effectively.

## 📚 Table of Contents

### Getting Started
- [**Getting Started**](./getting-started.md) - Quick start guide and installation
- [**First Action**](../examples/first-action.md) - Your first action implementation

### Core Architecture
- [**🏗️ Architecture Overview**](./architecture.md) - **NEW** Comprehensive architecture guide with implementation patterns
- [**📊 Architecture Diagrams**](./architecture-diagrams.md) - **NEW** Visual diagrams of system architecture and data flows
- [**🎯 MVVM Architecture**](./mvvm-architecture.md) - Deep dive into the MVVM pattern implementation
- [**🔄 Data Flow Patterns**](./data-flow-patterns.md) - Advanced data flow techniques

### Action System
- [**⚡ Action Pipeline**](./action-pipeline.md) - Understanding the action execution system
- [**⚙️ Handler Configuration**](./handler-configuration.md) - Configuring action handlers and middleware

### Store Integration
- [**📦 Store Integration**](./store-integration.md) - Advanced store integration patterns
- [Store Sync Patterns](../examples/services/todo-app.md) - Practical store synchronization examples

### Best Practices & Advanced Topics
- [**✅ Best Practices**](./best-practices.md) - Development best practices and guidelines
- [**🚀 Advanced Patterns**](./advanced.md) - Advanced usage patterns and techniques

## 🎯 Quick Navigation

### By Experience Level

#### 🆕 Beginner
Start here if you're new to Context-Action:
1. [Getting Started](./getting-started.md)
2. [First Action](../examples/first-action.md)
3. [Architecture Overview](./architecture.md)
4. [MVVM Architecture](./mvvm-architecture.md)

#### 🏃‍♂️ Intermediate  
You understand the basics and want to learn more:
1. [Architecture Diagrams](./architecture-diagrams.md)
2. [Store Integration](./store-integration.md)
3. [Action Pipeline](./action-pipeline.md)
4. [Data Flow Patterns](./data-flow-patterns.md)

#### 🧙‍♂️ Advanced
You're ready for complex patterns and optimizations:
1. [Advanced Patterns](./advanced.md)
2. [Handler Configuration](./handler-configuration.md)
3. [Best Practices](./best-practices.md)
4. [Performance Optimization](./best-practices.md#performance-considerations)

### By Use Case

#### 🎨 Building UI Components
- [MVVM Architecture - View Layer](./mvvm-architecture.md#1-🎨-view-layer-react-components)
- [Component Integration Patterns](./mvvm-architecture.md#component-integration-patterns)
- [React Integration Examples](../examples/react/)

#### ⚡ Managing Business Logic
- [Action Pipeline System](./architecture.md#1-action-pipeline-system)
- [Action Handler Best Practices](./mvvm-architecture.md#action-handler-responsibilities)
- [Cross-Store Coordination](./architecture.md#1-cross-store-coordination)

#### 📦 State Management
- [Store Integration Patterns](./store-integration.md)
- [Multi-Store Operations](./architecture.md#1-cross-store-coordination)
- [Computed Values in Actions](./architecture.md#2-computed-values-in-actions)

#### 🧪 Testing & Quality
- [Testing Strategies](./best-practices.md#testing-strategies)
- [Error Handling Patterns](./architecture.md#3-async-operations-with-state-updates)
- [Performance Considerations](./mvvm-architecture.md#performance-considerations)

## 🔗 External Resources

### API Documentation
- [Core API Reference](../api/core/) - Core package API documentation
- [React API Reference](../api/react/) - React integration API
- [TypeScript Types](../api/core/types.md) - Type definitions and interfaces

### Examples & Tutorials
- [Basic Setup](../examples/basic-setup.md) - Basic project setup
- [React Examples](../examples/react/) - React-specific examples
- [Service Examples](../examples/services/) - Real-world service implementations

### Related Packages
- [@context-action/core](../packages/core.md) - Core action pipeline system
- [@context-action/react](../packages/react.md) - React integration hooks and providers
- [@context-action/jotai](../packages/jotai.md) - Jotai state management integration

## 🤝 Contributing

Found an issue or want to improve the documentation? 
- [Report Issues](https://github.com/context-action/context-action/issues)
- [Contribute to Docs](https://github.com/context-action/context-action/tree/main/docs)

## 📖 Reading Guide

### Recommended Reading Order

1. **Foundation** (Required for all users)
   - [Getting Started](./getting-started.md)
   - [Architecture Overview](./architecture.md)

2. **Architecture Understanding** (Essential)
   - [MVVM Architecture](./mvvm-architecture.md)
   - [Architecture Diagrams](./architecture-diagrams.md)

3. **Implementation Details** (For active development)
   - [Store Integration](./store-integration.md)
   - [Action Pipeline](./action-pipeline.md)

4. **Mastery** (For optimization and advanced usage)
   - [Best Practices](./best-practices.md)
   - [Advanced Patterns](./advanced.md)

### Quick Reference Cards

#### Essential Hooks
```typescript
// Action dispatching
const dispatch = useActionDispatch<MyActions>();

// Store value subscription  
const value = useStoreValue(myStore);

// Store registry access
const registry = useStoreRegistry();
```

#### Action Handler Pattern
```typescript
actionRegister.register('actionName', async (payload, controller) => {
  // 1. Get current state
  const state = someStore.getValue();
  
  // 2. Business logic
  const result = processBusinessLogic(payload, state);
  
  // 3. Update stores
  someStore.setValue(result);
}, { priority: 10, blocking: true });
```

#### Component Pattern
```typescript
function MyComponent() {
  const dispatch = useActionDispatch();
  const data = useStoreValue(dataStore);
  
  const handleAction = () => {
    dispatch('actionName', payload);
  };
  
  return <div onClick={handleAction}>{data.value}</div>;
}
```

---

Happy coding with Context-Action! 🚀