# Context-Layered Architecture Guide

A comprehensive architecture pattern for Context-Action framework applications, combining traditional layered architecture principles with React Context patterns and props-based dependency injection.

## 🎯 Architecture Overview

**Context-Layered Architecture** is a specialized architectural pattern designed for React applications using the Context-Action framework. It provides clear separation of concerns while leveraging React Context for state management and dependency injection.

### Core Principles

1. **Layer Separation**: Clear boundaries between different concerns
2. **Context Integration**: Built around React Context lifecycle  
3. **Props-based DI**: Dependency injection through component props
4. **Handler Isolation**: Business logic isolated in dedicated handlers
5. **Type Safety**: Full TypeScript support across all layers

## 🏗️ Architecture Layers

### 6-Layer Structure

```
├── contexts/     # 🗄️ Context Definitions
├── business/     # 🏢 Pure Domain Logic
├── handlers/     # ⚙️ Handler Logic (Props-based)  
├── actions/      # 🚀 Dispatch + Callbacks
├── hooks/        # 🔗 Store Subscriptions
├── views/        # 🖼️ Pure UI Components  
└── MainPage.tsx  # 🎯 Integration Point
```

### Layer Responsibilities

| Layer | Purpose | Key Features |
|-------|---------|--------------|
| **Contexts** | Type definitions & context creation | ActionPayloadMap, Store interfaces, Context providers |
| **Business** | Pure domain rules and state transitions | Validation, calculation, event definitions |
| **Handlers** | Business logic with props-based DI | Handler Registry registration, dependency injection |
| **Actions** | Action dispatching & callbacks | `dispatch` calls, payload mapping, callback creation |
| **Hooks** | Store value subscriptions | `useStoreValue`, computed values, data transformation |
| **Views** | Pure UI components | Event handling, rendering, user interactions |
| **MainPage** | Registry mounting & composition | Props injection, context setup, component orchestration |

## 🔄 Data Flow

### 1. User Interaction → Action
```typescript
// views/CheckoutView.tsx
const { validate } = useCheckoutActions();
<button onClick={() => validate(formData)}>Validate</button>
```

### 2. Action → Handler (via Context)
```typescript
// actions/useCheckoutActions.ts  
validate: (data) => dispatch('validate', data)
```

### 3. Handler → Store Update
```typescript
// handlers/useCheckoutHandlers.ts (mounted by CheckoutHandlerRegistry)
useActionHandler('validate', async (data) => {
  const result = await apiClient.validate(data);
  checkoutStore.setValue(result);
});
```

### 4. Store → View Update (Reactive)
```typescript
// hooks/useCheckoutData.ts
const checkout = useStoreValue(checkoutStore);
```

## 🎯 Key Benefits

### Clear Separation of Concerns
Each layer has a single, well-defined responsibility:
- **Contexts**: Data structure definition
- **Business**: Pure domain rules and state transitions
- **Handlers**: Business logic execution  
- **Actions**: User action coordination
- **Hooks**: Data access abstraction
- **Views**: UI presentation
- **MainPage**: System composition

### Props-based Dependency Injection
```typescript
// Flexible, testable dependency injection
useCheckoutValidateHandler({ 
  moduleId: 'main',
  apiClient,
  validator,
  customPriority: 150
});
```

### React Context Integration
- Handler registration within Context boundaries
- Every handler is registered by the domain Handler Registry, including one-handler features
- Automatic lifecycle management
- Type-safe context usage

### Scalable Architecture
- Easy to add new features following established patterns
- Clear guidelines for each layer
- Maintainable codebase structure

## 📚 Documentation Structure

```
docs/en/context-layered/
├── architecture/
│   ├── folder-structure.md      # 6-Layer structure guide
│   ├── responsibility-separation.md  # Layer responsibilities
│   └── handler-registry.md      # Handler ID/Priority management
├── patterns/
│   ├── props-based-handlers.md  # Props-based handler patterns
│   ├── context-integration.md   # React Context integration
│   └── dependency-injection.md  # DI patterns and best practices
├── examples/
│   ├── basic-implementation.md  # Simple example walkthrough
│   ├── complex-scenarios.md     # Advanced use cases
│   └── migration-guide.md       # Migration from other patterns
└── context-layered-guide.md     # This overview document
```

## 🚀 Getting Started

### 1. Set up the folder structure
Follow the [folder structure guide](./architecture/folder-structure.md) to organize your project.

### 2. Define contexts
Create your action and store contexts with proper TypeScript interfaces.

### 3. Implement handlers
Build business logic using props-based dependency injection patterns.

### 4. Connect actions and hooks  
Set up action dispatching and store subscriptions.

### 5. Build views
Create pure UI components that use actions and hooks.

### 6. Compose in main page
Mount the Handler Registry with props and compose `Action Provider → Store Provider → Ref Provider (when used) → Handler Registry → View`.

## 🔗 Related Documentation

- [Folder Structure Guide](./architecture/folder-structure.md) - Detailed 6-layer structure
- [Props-based Handler Patterns](./patterns/props-based-handlers.md) - Handler implementation guides
- [Handler Registry](./architecture/handler-registry.md) - ID and priority management
- [Migration Guide](./migration-guide.md) - Migrate from traditional MVVM to Context-Layered
- [Traditional MVVM Documentation](../guide/architecture/mvvm.md) - Legacy MVVM patterns (for reference)

## 🎯 When to Use Context-Layered Architecture

### ✅ Ideal for:
- Medium to large React applications
- Projects requiring clear separation of concerns
- Applications with complex business logic
- Teams needing consistent architectural patterns
- Projects using Context-Action framework

### ⚠️ Consider alternatives for:
- Simple applications with minimal business logic
- Prototypes or proof-of-concept projects  
- Applications not using React Context extensively

This architecture provides a solid foundation for scalable, maintainable React applications with clear boundaries and excellent developer experience.
