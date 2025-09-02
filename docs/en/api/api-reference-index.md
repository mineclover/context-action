# API Reference Index

Complete reference guide for Context-Action framework TypeDoc generated documentation.

## 📋 Overview

This index organizes all TypeDoc generated API documentation by package and category for easy reference when writing interface-specific documentation.

## 📦 Package Structure

### @context-action/core
- **Purpose**: Pure TypeScript action pipeline (framework agnostic)
- **Dependencies**: Zero dependencies
- **Documentation**: [Core Package API](./core/src/README.md)

### @context-action/react
- **Purpose**: React integration with MVVM architecture
- **Dependencies**: React, @context-action/core
- **Documentation**: [React Package API](./react/src/README.md)

## 🎯 @context-action/core API Reference

### 📚 Classes (2)
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - Core action pipeline management
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - Action-specific error handling

### 🔌 Interfaces (7)
- [`ActionPayloadMap`](./core/src/interfaces/ActionPayloadMap.md) - Type-safe action payload definitions
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - Action execution control interface
- [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - Handler registration configuration
- [`ActionRegisterConfig`](./core/src/interfaces/ActionRegisterConfig.md) - ActionRegister configuration options
- [`DispatchOptions`](./core/src/interfaces/DispatchOptions.md) - Action dispatch configuration
- [`ExecutionResult`](./core/src/interfaces/ExecutionResult.md) - Action execution result structure
- [`ActionDispatcher`](./core/src/interfaces/ActionDispatcher.md) - Action dispatching interface

### 🏷️ Type Aliases (3)
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - Action handler function type
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - Action execution mode types
- [`UnregisterFunction`](./core/src/type-aliases/UnregisterFunction.md) - Handler cleanup function type

### ⚙️ Functions (7)
#### Execution Functions
- [`executeSequential`](./core/src/functions/executeSequential.md) - Sequential handler execution
- [`executeParallel`](./core/src/functions/executeParallel.md) - Parallel handler execution  
- [`executeRace`](./core/src/functions/executeRace.md) - Race-based handler execution

#### Factory Functions
- [`createActionHandler`](./core/src/functions/createActionHandler.md) - Create action handler
- [`createReactHandlerConfig`](./core/src/functions/createReactHandlerConfig.md) - Create React handler config
- [`createReactDispatcher`](./core/src/functions/createReactDispatcher.md) - Create React dispatcher

#### Utility Functions
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - Error type checking

### 🛠️ Variables (1)
- [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - Development utilities

## ⚛️ @context-action/react API Reference

### 📚 Classes (3)
- [`Store`](./react/src/classes/Store.md) - Reactive store implementation
- [`StoreManager`](./react/src/classes/StoreManager.md) - Store registry management
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - React error boundary for stores

### 🔌 Interfaces (12)
#### Action Context Interfaces
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - Action context configuration
- [`ActionContextType`](./react/src/interfaces/ActionContextType.md) - Action context type definition
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - Action context return type

#### Ref Context Interfaces
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - Ref context return type
- [`CreateRefContextOptions`](./react/src/interfaces/CreateRefContextOptions.md) - Ref context creation options
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref target interface
- [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - Ref operation result
- [`RefOperationOptions`](./react/src/interfaces/RefOperationOptions.md) - Ref operation options

#### Store Interfaces
- [`StoreErrorBoundaryProps`](./react/src/interfaces/StoreErrorBoundaryProps.md) - Error boundary props
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - Store snapshot interface
- [`IStore`](./react/src/interfaces/IStore.md) - Store interface definition
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - Store configuration

### 🏷️ Type Aliases (1)
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - Initial store definitions type

### ⚙️ Functions (6)
#### Context Creation Functions
- [`createActionContext`](./react/src/functions/createActionContext.md) - Create action-only context
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - Create store-only context
- [`createRefContext`](./react/src/functions/createRefContext.md) - Create ref context

#### Store Functions
- [`createStore`](./react/src/functions/createStore.md) - Create individual store
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - Subscribe to store values
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - Select store values with selector

## 📖 Documentation Categories by Use Case

### 🎯 Action Pipeline (Core Package Focus)
**Core Concepts**:
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - Main pipeline management
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - Handler function types
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - Execution control

**Execution Modes**:
- [`executeSequential`](./core/src/functions/executeSequential.md) - Sequential execution
- [`executeParallel`](./core/src/functions/executeParallel.md) - Parallel execution
- [`executeRace`](./core/src/functions/executeRace.md) - Race execution
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - Mode types

### 🏪 Store System (React Package Focus)
**Store Core**:
- [`Store`](./react/src/classes/Store.md) - Individual store implementation
- [`StoreManager`](./react/src/classes/StoreManager.md) - Store registry
- [`createStore`](./react/src/functions/createStore.md) - Store creation

**Store Context Pattern**:
- [`createStoreContext`](./react/src/functions/createStoreContext.md) - Context creation
- [`InitialStores`](./react/src/type-aliases/InitialStores.md) - Store definitions
- [`StoreConfig`](./react/src/interfaces/StoreConfig.md) - Store configuration

**Store Hooks**:
- [`useStoreValue`](./react/src/functions/useStoreValue.md) - Value subscription
- [`useStoreSelector`](./react/src/functions/useStoreSelector.md) - Selective subscription

### 🎯 Action Context (React Package Focus)
**Context Creation**:
- [`createActionContext`](./react/src/functions/createActionContext.md) - Action context creation
- [`ActionContextConfig`](./react/src/interfaces/ActionContextConfig.md) - Configuration
- [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) - Return types

### 🔧 Ref Context (React Package Focus)
**Direct DOM Manipulation**:
- [`createRefContext`](./react/src/functions/createRefContext.md) - Ref context creation
- [`RefContextReturn`](./react/src/interfaces/RefContextReturn.md) - Return types
- [`RefTarget`](./react/src/interfaces/RefTarget.md) - Ref target interface
- [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) - Operation results

### 🛡️ Error Handling
**Error Types**:
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - Action errors
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - Type checking
- [`StoreErrorBoundary`](./react/src/classes/StoreErrorBoundary.md) - React error boundary

### 🛠️ Development & Utilities
**Development Tools**:
- [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - Development utilities
- [`Snapshot`](./react/src/interfaces/Snapshot.md) - Store snapshots

## 📝 Interface-Specific Documentation Guide

When creating interface-specific documentation, use this structure:

### 1. Core Pipeline Documentation
- Reference [`ActionRegister`](./core/src/classes/ActionRegister.md) for main API
- Use [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) for configuration examples
- Reference execution functions for advanced patterns

### 2. Store Pattern Documentation
- Start with [`createStoreContext`](./react/src/functions/createStoreContext.md) for basic patterns
- Reference [`Store`](./react/src/classes/Store.md) for advanced store operations
- Use [`useStoreValue`](./react/src/functions/useStoreValue.md) for subscription patterns

### 3. Action Pattern Documentation
- Begin with [`createActionContext`](./react/src/functions/createActionContext.md)
- Reference [`ActionContextReturn`](./react/src/interfaces/ActionContextReturn.md) for available hooks
- Use [`PipelineController`](./core/src/interfaces/PipelineController.md) for control patterns

### 4. RefContext Documentation
- Start with [`createRefContext`](./react/src/functions/createRefContext.md)
- Reference [`RefTarget`](./react/src/interfaces/RefTarget.md) for ref management
- Use [`RefOperationResult`](./react/src/interfaces/RefOperationResult.md) for operation patterns

## 🔗 Cross-References

### Pattern Relationships
- **Action → Core**: Action contexts use core ActionRegister
- **Store → Error**: Stores integrate with StoreErrorBoundary
- **All → TypeSafety**: All patterns use ActionPayloadMap for type safety

### Documentation Priorities
1. **High Priority**: Main pattern functions (`createActionContext`, `createStoreContext`, `createRefContext`)
2. **Medium Priority**: Core classes (`ActionRegister`, `Store`, `StoreManager`) 
3. **Low Priority**: Utility functions and development tools

---

*This index is automatically maintained and reflects the current TypeDoc generated documentation structure.*