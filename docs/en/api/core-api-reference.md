# @context-action/core API Reference

Complete reference for the core TypeScript action pipeline package.

## 📋 Package Overview

**@context-action/core** is a pure TypeScript action pipeline system with zero dependencies, designed for framework-agnostic action processing and business logic management.

### Key Features
- ✅ Pure TypeScript (no React dependency)
- ✅ Zero external dependencies  
- ✅ Type-safe action dispatching
- ✅ Priority-based handler execution
- ✅ Advanced error handling
- ✅ Multiple execution modes

## 📚 Classes

### ActionRegister
**File**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md)  
**Purpose**: Core action pipeline management and execution

**Key Capabilities**:
- Action handler registration and management
- Priority-based execution ordering
- Multiple execution modes (sequential, parallel, race)
- Pipeline control and abort support
- Result aggregation and error handling

**Usage Context**:
- Central action processing hub
- Business logic coordination
- Cross-module communication
- Event handling systems

### ReactActionError
**File**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md)  
**Purpose**: Action-specific error handling and context preservation

**Key Capabilities**:
- Action-aware error information
- Stack trace preservation
- Context data attachment
- React-specific error patterns

**Usage Context**:
- Action handler error handling
- Pipeline error recovery
- Development debugging
- Error reporting systems

## 🔌 Interfaces

### Core Action Interfaces

#### ActionPayloadMap
**File**: [`ActionPayloadMap.md`](./core/src/interfaces/ActionPayloadMap.md)  
**Purpose**: Type-safe action payload definitions

**Usage Context**:
- Action type definitions
- Payload type validation
- TypeScript strict mode compliance
- Interface extension patterns

#### ActionDispatcher
**File**: [`ActionDispatcher.md`](./core/src/interfaces/ActionDispatcher.md)  
**Purpose**: Action dispatching interface contract

**Usage Context**:
- Dispatcher implementation
- Action invocation patterns
- Type-safe dispatch operations
- Framework integration

### Pipeline Control Interfaces

#### PipelineController
**File**: [`PipelineController.md`](./core/src/interfaces/PipelineController.md)  
**Purpose**: Action execution control and pipeline management

**Key Features**:
- Execution abort capabilities
- Pipeline state management  
- Error handling control
- Result collection

**Usage Context**:
- Handler implementation
- Pipeline control patterns
- Error handling strategies
- Execution flow management

#### HandlerConfig
**File**: [`HandlerConfig.md`](./core/src/interfaces/HandlerConfig.md)  
**Purpose**: Handler registration configuration

**Key Features**:
- Priority assignment
- Execution options
- Handler metadata
- Registration parameters

**Usage Context**:
- Handler registration
- Priority management
- Execution customization
- Handler organization

### Configuration Interfaces

#### ActionRegisterConfig
**File**: [`ActionRegisterConfig.md`](./core/src/interfaces/ActionRegisterConfig.md)  
**Purpose**: ActionRegister configuration options

**Usage Context**:
- ActionRegister initialization
- Pipeline behavior customization
- Performance tuning
- Debug mode settings

#### DispatchOptions
**File**: [`DispatchOptions.md`](./core/src/interfaces/DispatchOptions.md)  
**Purpose**: Action dispatch configuration

**Usage Context**:
- Dynamic dispatch behavior
- Per-action configuration
- Execution mode overrides
- Result handling options

### Result Interfaces

#### ExecutionResult
**File**: [`ExecutionResult.md`](./core/src/interfaces/ExecutionResult.md)  
**Purpose**: Action execution result structure

**Key Features**:
- Success/failure status
- Result data collection
- Error information
- Execution metadata

**Usage Context**:
- Result processing
- Error handling
- Pipeline monitoring
- Success verification

## 🏷️ Type Aliases

### ActionHandler
**File**: [`ActionHandler.md`](./core/src/type-aliases/ActionHandler.md)  
**Purpose**: Action handler function type definition

**Usage Context**:
- Handler implementation
- Type-safe handler creation
- Handler registration
- Business logic functions

### ExecutionMode
**File**: [`ExecutionMode.md`](./core/src/type-aliases/ExecutionMode.md)  
**Purpose**: Action execution mode types

**Available Modes**:
- `sequential` - Sequential handler execution
- `parallel` - Parallel handler execution  
- `race` - Race-based execution

**Usage Context**:
- Execution strategy selection
- Performance optimization
- Handler coordination
- Pipeline configuration

### UnregisterFunction
**File**: [`UnregisterFunction.md`](./core/src/type-aliases/UnregisterFunction.md)  
**Purpose**: Handler cleanup function type

**Usage Context**:
- Handler cleanup
- Memory management
- Registration lifecycle
- Resource disposal

## ⚙️ Functions

### Execution Functions

#### executeSequential
**File**: [`executeSequential.md`](./core/src/functions/executeSequential.md)  
**Purpose**: Sequential handler execution with priority ordering

**Usage Context**:
- Ordered execution requirements
- Dependency-aware processing
- Step-by-step workflows
- Default execution mode

#### executeParallel  
**File**: [`executeParallel.md`](./core/src/functions/executeParallel.md)  
**Purpose**: Parallel handler execution for performance

**Usage Context**:
- Independent handler execution
- Performance optimization
- Concurrent processing
- I/O intensive operations

#### executeRace
**File**: [`executeRace.md`](./core/src/functions/executeRace.md)  
**Purpose**: Race-based execution (first successful result)

**Usage Context**:
- Alternative strategy execution
- Fastest response scenarios
- Fallback pattern implementation
- Timeout handling

### Factory Functions

#### createActionHandler
**File**: [`createActionHandler.md`](./core/src/functions/createActionHandler.md)  
**Purpose**: Create type-safe action handlers

**Usage Context**:
- Handler creation utilities
- Type safety enforcement
- Handler factory patterns
- Business logic encapsulation

#### createReactHandlerConfig
**File**: [`createReactHandlerConfig.md`](./core/src/functions/createReactHandlerConfig.md)  
**Purpose**: Create React-specific handler configuration

**Usage Context**:
- React integration patterns
- Component-aware configuration
- React lifecycle integration
- Hook-based handler setup

#### createReactDispatcher
**File**: [`createReactDispatcher.md`](./core/src/functions/createReactDispatcher.md)  
**Purpose**: Create React-optimized dispatchers

**Usage Context**:
- React component integration
- Hook-based dispatching
- React context patterns
- Component communication

### Utility Functions

#### isReactActionError
**File**: [`isReactActionError.md`](./core/src/functions/isReactActionError.md)  
**Purpose**: Type guard for ReactActionError detection

**Usage Context**:
- Error type checking
- Error handling branching
- Type-safe error processing
- Debug information extraction

## 🛠️ Variables

### ReactDevUtils
**File**: [`ReactDevUtils.md`](./core/src/variables/ReactDevUtils.md)  
**Purpose**: Development utilities for React integration

**Usage Context**:
- Development debugging
- Performance monitoring
- React integration helpers
- Development-only features

## 📖 Usage Patterns by Category

### 1. Basic Action Pipeline Setup
**Primary APIs**:
- [`ActionRegister`](./core/src/classes/ActionRegister.md) - Pipeline creation
- [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - Handler definition
- [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - Handler registration

```typescript
// Example pattern reference
const register = new ActionRegister();
register.registerHandler('actionType', handler, { priority: 100 });
```

### 2. Advanced Execution Control
**Primary APIs**:
- [`PipelineController`](./core/src/interfaces/PipelineController.md) - Execution control
- [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - Mode selection
- [`DispatchOptions`](./core/src/interfaces/DispatchOptions.md) - Dynamic options

```typescript
// Reference pipeline control patterns
controller.abort('Custom cancellation reason');
dispatch('action', payload, { mode: 'parallel' });
```

### 3. Error Handling Patterns
**Primary APIs**:
- [`ReactActionError`](./core/src/classes/ReactActionError.md) - Error creation
- [`isReactActionError`](./core/src/functions/isReactActionError.md) - Type checking
- [`ExecutionResult`](./core/src/interfaces/ExecutionResult.md) - Result processing

```typescript
// Reference error handling patterns
if (isReactActionError(error)) {
  // Handle action-specific error
}
```

### 4. Type Safety Patterns
**Primary APIs**:
- [`ActionPayloadMap`](./core/src/interfaces/ActionPayloadMap.md) - Type definitions
- [`ActionDispatcher`](./core/src/interfaces/ActionDispatcher.md) - Dispatcher types
- All function and interface types for strict typing

## 🎯 Documentation Priority Guide

### High Priority (Core Usage)
1. [`ActionRegister`](./core/src/classes/ActionRegister.md) - Most important class
2. [`ActionHandler`](./core/src/type-aliases/ActionHandler.md) - Essential type
3. [`PipelineController`](./core/src/interfaces/PipelineController.md) - Control interface
4. [`HandlerConfig`](./core/src/interfaces/HandlerConfig.md) - Configuration

### Medium Priority (Advanced Features)
1. [`ExecutionMode`](./core/src/type-aliases/ExecutionMode.md) - Execution options
2. [`executeSequential`](./core/src/functions/executeSequential.md) - Default execution
3. [`executeParallel`](./core/src/functions/executeParallel.md) - Performance optimization
4. [`ReactActionError`](./core/src/classes/ReactActionError.md) - Error handling

### Low Priority (Utilities & Advanced)
1. [`ReactDevUtils`](./core/src/variables/ReactDevUtils.md) - Development only
2. [`executeRace`](./core/src/functions/executeRace.md) - Specialized execution
3. Factory functions - Advanced patterns
4. Utility functions - Edge cases

## 🔗 Related Documentation

- **React Integration**: [React API Reference](./react-api-reference.md)
- **Complete Index**: [API Reference Index](./api-reference-index.md)
- **Usage Examples**: [Core Examples](/en/examples/)
- **Architecture Guide**: [Architecture Overview](/en/concept/architecture-guide.md)

---

*This reference covers all TypeDoc generated documentation for @context-action/core package. Each linked file contains detailed API specifications, parameters, return types, and usage examples.*