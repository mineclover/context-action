# API Terms

Technical implementation and API concepts for the Context-Action framework.

## ActionRegister

**Definition**: The core class that manages action pipelines, handler registration, and provides type-safe action dispatch functionality.


**Usage Context**:
- Central action management system
- Business logic orchestration
- Type-safe action dispatch
- Handler lifecycle management

**Key Features**:
- Generic type support for action payload maps
- Priority-based handler execution
- Event emission for monitoring
- Configurable logging and debugging
- Pipeline flow control


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Payload Map](./core-concepts.md#action-payload-map)

---

## StoreProvider

**Definition**: A React context provider that manages store instances and provides them to child components through the React context system.


**Usage Context**:
- Application root setup
- Store dependency injection
- React context pattern implementation
- Store lifecycle management

**Key Features**:
- Centralized store management
- Context-based dependency injection
- Store instance lifecycle control
- Integration with React component tree


**Related Terms**: [ActionProvider](#actionprovider), [Store Registry](./core-concepts.md#store-registry), [Store Hooks](#store-hooks)

---

## ActionProvider

**Definition**: A React context provider that manages action registration and dispatch functionality within the React component tree.


**Usage Context**:
- Action handler registration context
- Action dispatch accessibility
- Component lifecycle integration
- Handler cleanup management

**Key Features**:
- Action dispatch context provision
- Handler registration lifecycle
- Automatic cleanup on unmount
- Integration with store providers


**Related Terms**: [StoreProvider](#storeprovider), [Action Dispatcher](#action-dispatcher), [useActionDispatch](#useactiondispatch)

---

## Store Hooks

**Definition**: React hooks that provide reactive access to store values and enable components to subscribe to store changes.


**Usage Context**:
- Component-store integration
- Reactive UI updates
- Store value subscription
- Performance optimization

**Available Hooks**:
- `useStoreValue`: Subscribe to store value with optional selector
- `useStore`: Full store access with value and setter
- `useComputedStore`: Subscribe to computed/derived values
- `usePersistedStore`: Store with persistence integration
- `useDynamicStore`: Dynamic store creation and management


**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Computed Store](#computed-store), [Selective Subscription](#selective-subscription)

---

## Cross-Store Coordination

**Definition**: A pattern for coordinating actions across multiple stores within a single action handler, enabling complex business logic that spans multiple data domains.


**Usage Context**:
- Complex business operations
- Multi-domain data updates
- Transaction-like behavior
- Data consistency maintenance

**Key Patterns**:
- Read from multiple stores before processing
- Validate constraints across stores
- Update multiple stores atomically
- Rollback on failures


**Related Terms**: [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Action Handler](./core-concepts.md#action-handler), [Atomic Updates](#atomic-updates)

---

## Async Operations

**Definition**: Asynchronous operations within action handlers that handle external API calls, database operations, and other non-blocking tasks while maintaining proper error handling and state management.


**Usage Context**:
- External API integration
- Database operations
- File system operations
- Time-delayed operations

**Key Features**:
- Proper error handling and rollback
- Loading state management
- Timeout and cancellation support
- Progress tracking capabilities


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Error Handling](#error-handling), [Loading States](#loading-states)

---

## Action Dispatcher

**Definition**: A type-safe function interface that enables dispatching actions with proper payload validation and type checking.


**Usage Context**:
- Component action dispatch
- Type-safe action invocation
- Business logic triggering
- User interaction handling

**Key Features**:
- Overloaded for actions with and without payloads
- Compile-time type checking
- Async operation support
- Error propagation


**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Type Safety](./architecture-terms.md#type-safety), [useActionDispatch](#useactiondispatch)

---

## Priority-based Execution

**Definition**: A handler execution strategy where action handlers are executed in order of their assigned priority values, with higher priorities running first.


**Usage Context**:
- Handler execution order control
- Dependency management between handlers
- Critical operation prioritization
- Validation and preprocessing

**Key Features**:
- Numeric priority values (higher = first)
- Automatic sorting on registration
- Support for negative priorities
- Consistent execution order


**Related Terms**: [Handler Configuration](./core-concepts.md#handler-configuration), [Action Handler](./core-concepts.md#action-handler), [Pipeline Execution](#pipeline-execution)

---

## Computed Store

**Definition**: A reactive store that derives its value from one or more source stores, automatically updating when dependencies change.


**Usage Context**:
- Derived state calculation
- Performance optimization
- Complex data transformations
- Reactive computations

**Key Features**:
- Automatic dependency tracking
- Lazy computation
- Memoization for performance
- Multiple source store support


**Related Terms**: [Store Hooks](#store-hooks), [Reactive Updates](#reactive-updates), [Performance Optimization](#performance-optimization)

---

## Pipeline Context

**Definition**: Internal execution context that maintains state during action pipeline processing, including current payload, handler queue, and execution status.


**Usage Context**:
- Internal pipeline execution
- Handler coordination
- Execution state tracking
- Error handling and recovery

**Key Properties**:
- `action`: The action name being executed
- `payload`: Current payload (may be modified during execution)
- `handlers`: Array of registered handlers for the action
- `aborted`: Whether pipeline execution was aborted
- `abortReason`: Reason for abortion if applicable
- `currentIndex`: Current handler being executed


**Related Terms**: [Pipeline Controller](./core-concepts.md#pipeline-controller), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Handler Execution](#handler-execution)