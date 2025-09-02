# @context-action/react API Reference

Complete reference for the React integration package with MVVM architecture support.

## 📋 Package Overview

**@context-action/react** provides React integration for the Context-Action framework, enabling MVVM architecture with three main patterns: Action-Only, Store-Only, and RefContext patterns.

### Key Features
- ✅ Complete React integration with Context API
- ✅ Type-safe store management with reactive subscriptions
- ✅ Action context with pipeline integration
- ✅ Direct DOM manipulation with RefContext
- ✅ MVVM architecture support
- ✅ HOC patterns and custom hooks

### Dependencies
- React (peer dependency)
- @context-action/core

## 📚 Classes

### Store
**File**: [`Store.md`](./react/src/classes/Store.md)  
**Purpose**: Reactive store implementation with subscription management

**Key Capabilities**:
- Reactive value storage and updates
- Subscription management and notifications
- Validation and error handling
- Performance optimization strategies
- Snapshot and rollback support

**Usage Context**:
- Individual store instances
- State management core
- Reactive data containers
- Component data binding

### StoreManager  
**File**: [`StoreManager.md`](./react/src/classes/StoreManager.md)  
**Purpose**: Store registry and lifecycle management

**Key Capabilities**:
- Store registration and retrieval
- Store lifecycle management
- Registry isolation support
- Store cleanup and reset
- Store information aggregation

**Usage Context**:
- Store context implementation
- Store registry management
- Multi-store coordination
- Store lifecycle control

### StoreErrorBoundary
**File**: [`StoreErrorBoundary.md`](./react/src/classes/StoreErrorBoundary.md)  
**Purpose**: React error boundary for store-related errors

**Key Capabilities**:
- Store error isolation
- Error recovery strategies
- Error reporting and logging
- Component tree protection

**Usage Context**:
- Store error handling
- Error boundary implementation
- Store safety patterns
- Development debugging

## 🔌 Interfaces

### Action Context Interfaces

#### ActionContextConfig
**File**: [`ActionContextConfig.md`](./react/src/interfaces/ActionContextConfig.md)  
**Purpose**: Configuration for action context creation

**Usage Context**:
- Action context customization
- Pipeline configuration
- Action registration options
- Context behavior settings

#### ActionContextType
**File**: [`ActionContextType.md`](./react/src/interfaces/ActionContextType.md)  
**Purpose**: Action context type definition and structure

**Usage Context**:
- Context type validation
- Type-safe context usage
- Action context contracts
- Interface definition patterns

#### ActionContextReturn
**File**: [`ActionContextReturn.md`](./react/src/interfaces/ActionContextReturn.md)  
**Purpose**: Return type for action context creation

**Key Features**:
- Provider component
- Action dispatch hooks
- Action handler hooks  
- Context management utilities

**Usage Context**:
- Action context creation
- Hook type definitions
- Provider pattern implementation
- Context API structure

### Ref Context Interfaces

#### RefContextReturn
**File**: [`RefContextReturn.md`](./react/src/interfaces/RefContextReturn.md)  
**Purpose**: Return type for ref context creation

**Key Features**:
- Provider component
- Ref handler hooks
- Ref operation utilities
- Context management tools

**Usage Context**:
- Ref context creation
- Direct DOM manipulation
- Performance optimization
- Zero-rerender patterns

#### CreateRefContextOptions
**File**: [`CreateRefContextOptions.md`](./react/src/interfaces/CreateRefContextOptions.md)  
**Purpose**: Configuration options for ref context creation

**Usage Context**:
- Ref context customization
- Performance tuning options
- Debugging configuration
- Context behavior control

#### RefTarget
**File**: [`RefTarget.md`](./react/src/interfaces/RefTarget.md)  
**Purpose**: Ref target interface for DOM element management

**Key Features**:
- Target element access
- Mount status tracking
- Type-safe element operations
- Lifecycle management

**Usage Context**:
- Direct DOM manipulation
- Element lifecycle tracking
- Type-safe ref operations
- Performance-critical UI

#### RefOperationResult
**File**: [`RefOperationResult.md`](./react/src/interfaces/RefOperationResult.md)  
**Purpose**: Result structure for ref operations

**Usage Context**:
- Operation result handling
- Error tracking in ref operations
- Success/failure status
- Operation metadata

#### RefOperationOptions
**File**: [`RefOperationOptions.md`](./react/src/interfaces/RefOperationOptions.md)  
**Purpose**: Configuration options for ref operations

**Usage Context**:
- Operation customization
- Timeout configuration
- Error handling options
- Operation behavior control

### Store Interfaces

#### StoreErrorBoundaryProps
**File**: [`StoreErrorBoundaryProps.md`](./react/src/interfaces/StoreErrorBoundaryProps.md)  
**Purpose**: Props interface for StoreErrorBoundary component

**Usage Context**:
- Error boundary configuration
- Error handling customization
- Fallback UI specification
- Error recovery options

#### Snapshot
**File**: [`Snapshot.md`](./react/src/interfaces/Snapshot.md)  
**Purpose**: Store snapshot interface for state capture

**Key Features**:
- State point-in-time capture
- Rollback capabilities
- State comparison utilities
- Debug information

**Usage Context**:
- State debugging
- Undo/redo functionality
- State history tracking
- Development tools

#### IStore
**File**: [`IStore.md`](./react/src/interfaces/IStore.md)  
**Purpose**: Store interface definition and contract

**Usage Context**:
- Store implementation contracts
- Type-safe store operations
- Store interface compliance
- Custom store implementations

#### StoreConfig
**File**: [`StoreConfig.md`](./react/src/interfaces/StoreConfig.md)  
**Purpose**: Store configuration options

**Key Features**:
- Initial value specification
- Validation configuration
- Update strategies
- Performance options

**Usage Context**:
- Store initialization
- Store behavior customization
- Validation setup
- Performance tuning

## 🏷️ Type Aliases

### InitialStores
**File**: [`InitialStores.md`](./react/src/type-aliases/InitialStores.md)  
**Purpose**: Type definition for initial store configurations

**Usage Context**:
- Store context creation
- Type inference patterns
- Store definition structures
- Configuration type safety

## ⚙️ Functions

### Context Creation Functions

#### createActionContext
**File**: [`createActionContext.md`](./react/src/functions/createActionContext.md)  
**Purpose**: Create action-only context for pure action dispatching

**Key Features**:
- Type-safe action dispatching
- Action handler registration
- Action pipeline integration
- Context provider creation

**Usage Context**:
- Action-Only pattern implementation
- Business logic separation
- Event system creation
- Command pattern implementation

**Pattern Type**: **Primary Pattern** - Action-Only

#### createStoreContext
**File**: [`createStoreContext.md`](./react/src/functions/createStoreContext.md)  
**Purpose**: Create store-only context for state management

**Key Features**:
- Type-safe store management
- Reactive subscriptions
- Store lifecycle management
- HOC pattern support

**Usage Context**:
- Store-Only pattern implementation
- State management layers
- Data persistence
- Reactive data flow

**Pattern Type**: **Primary Pattern** - Store-Only

#### createRefContext
**File**: [`createRefContext.md`](./react/src/functions/createRefContext.md)  
**Purpose**: Create ref context for direct DOM manipulation

**Key Features**:
- Zero React rerenders
- Direct DOM access
- Type-safe ref management
- Performance optimization

**Usage Context**:
- High-performance UI
- Animation systems
- Direct DOM manipulation
- Real-time interactions

**Pattern Type**: **Primary Pattern** - RefContext

### Store Functions

#### createStore
**File**: [`createStore.md`](./react/src/functions/createStore.md)  
**Purpose**: Create individual store instances

**Usage Context**:
- Manual store creation
- Custom store implementations
- Store composition patterns
- Advanced store configurations

#### useStoreValue
**File**: [`useStoreValue.md`](./react/src/functions/useStoreValue.md)  
**Purpose**: Subscribe to store values with automatic rerenders

**Key Features**:
- Reactive subscriptions
- Automatic component updates
- Type-safe value access
- Performance optimization

**Usage Context**:
- Store value subscription
- Component data binding
- Reactive UI updates
- State consumption patterns

#### useStoreSelector
**File**: [`useStoreSelector.md`](./react/src/functions/useStoreSelector.md)  
**Purpose**: Select specific parts of store values with memoization

**Key Features**:
- Selective subscription
- Memoized selectors
- Performance optimization
- Derived state patterns

**Usage Context**:
- Performance optimization
- Selective updates
- Derived state computation
- Complex state selection

## 📖 Usage Patterns by Category

### 1. Action-Only Pattern
**Primary APIs**:
- [`createActionContext`](./react/src/functions/createActionContext.md) - Pattern creation
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - Available hooks
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - Configuration

**Usage Context**:
- Event systems
- Command patterns  
- Business logic separation
- Side effect management

**Key Benefits**:
- Lightweight (no store overhead)
- Type-safe action dispatching
- Pipeline integration
- Memory management

### 2. Store-Only Pattern 
**Primary APIs**:
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - Pattern creation
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - Value subscription
- [`StoreManager`](./react/src/classes/StoreManager.md) - Store management

**Usage Context**:
- Pure state management
- Data layers
- Simple state requirements
- Reactive data flow

**Key Benefits**:
- Excellent type inference
- Simplified API
- Direct value support
- HOC patterns

### 3. RefContext Pattern
**Primary APIs**:
- [`createRefContext`](./react/src/functions/createRefContext.md) - Pattern creation
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - Available hooks
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref management

**Usage Context**:
- High-performance UI
- Direct DOM manipulation
- Animation systems
- Real-time interactions

**Key Benefits**:
- Zero React rerenders
- Hardware-accelerated transforms
- Type-safe ref management
- Automatic cleanup

### 4. Store System Deep Dive
**Core Classes**:
- [`Store`](./react/src/classes/Store.md) - Individual store implementation
- [`StoreManager`](./react/src/classes/StoreManager.md) - Registry management
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - Error handling

**Configuration**:
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - Store configuration
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - Store definitions
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - State snapshots

**Hooks**:
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - Reactive subscription
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - Selective subscription

### 5. Error Handling Patterns
**Primary APIs**:
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - React error boundary
- [`StoreErrorBoundaryProps`](./react/src/interfaces/StoreErrorBoundaryProps.md) - Configuration
- Integration with core [`ReactActionError`](./core/src/classes/ReactActionError.md)

## 🎯 Pattern Integration Guide

### Pattern Composition
The three patterns can be combined for complex applications:

```typescript
// Pattern combination reference
<ActionProvider>      {/* ViewModel Layer */}
  <StoreProvider>     {/* Model Layer */}
    <RefProvider>     {/* Direct DOM Layer */}
      <Component />   {/* View Layer */}
    </RefProvider>
  </StoreProvider>
</ActionProvider>
```

### MVVM Architecture Integration
- **Model Layer**: Store-Only pattern with [`createStoreContext`](./react/src/functions/createStoreContext.md)
- **ViewModel Layer**: Action-Only pattern with [`createActionContext`](./react/src/functions/createActionContext.md)
- **View Layer**: React components with RefContext for performance-critical parts

### Cross-Pattern Communication
- **Action → Store**: Actions update stores via handler logic
- **Store → View**: Components subscribe via [`useStoreValue`](./react/src/functions/useStoreValue.md)
- **RefContext → All**: Direct DOM manipulation without affecting other patterns

## 🎯 Documentation Priority Guide

### High Priority (Core Patterns)
1. [`createStoreContext`](./react/src/functions/createStoreContext.md) - Most used pattern
2. [`createActionContext`](./react/src/functions/createActionContext.md) - Action pattern
3. [`useStoreValue`](./react/src/functions/useStoreValue.md) - Essential hook
4. [`Store`](./react/src/classes/Store.md) - Core store class

### Medium Priority (Advanced Features)
1. [`createRefContext`](./react/src/functions/createRefContext.md) - Performance pattern
2. [`StoreManager`](./react/src/classes/StoreManager.md) - Store management
3. [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - Performance hook
4. [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - Hook types

### Low Priority (Specialized Features)
1. [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - Error handling
2. [`Snapshot`](./react/src/interfaces/Snapshot.md) - Debug utilities
3. [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - Advanced ref operations
4. Configuration interfaces - Edge cases

## 🔗 Related Documentation

- **Core Package**: [Core API Reference](./core-api-reference.md)
- **Complete Index**: [API Reference Index](./api-reference-index.md)
- **Pattern Guides**: [Pattern Documentation](/en/concept/pattern-guide.md)
- **Architecture**: [MVVM Architecture](/en/concept/mvvm-core-architecture.md)
- **Examples**: [React Examples](/en/examples/)

---

*This reference covers all TypeDoc generated documentation for @context-action/react package. Each linked file contains detailed API specifications, parameters, return types, and usage examples.*