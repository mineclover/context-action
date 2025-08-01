# Core Concepts

Fundamental framework concepts and systems that form the foundation of the Context-Action framework.

## Action Pipeline System

**Definition**: The central orchestration system that processes dispatched actions through a series of registered handlers in priority order.

**Usage Context**: 
- Core framework functionality
- Business logic execution
- Event-driven architecture implementation

**Key Characteristics**:
- Priority-based handler execution (higher priority runs first)
- Type-safe action dispatch with payload validation
- Pipeline flow control (abort, continue, modify)
- Support for both synchronous and asynchronous handlers

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Store Integration Pattern](#store-integration-pattern)

---

## Store Integration Pattern

**Definition**: The architectural pattern that enables action handlers to read and update stores while maintaining loose coupling between components.

**Usage Context**:
- State management in action handlers
- Cross-store coordination
- Data flow implementation

**Key Characteristics**:
- Lazy evaluation of store values at execution time
- No direct component-to-store coupling
- Atomic-like updates across multiple stores
- Fresh state values guaranteed in handlers

**Related Terms**: [Action Handler](#action-handler), [Cross-Store Coordination](./api-terms.md#cross-store-coordination), [Lazy Evaluation](./architecture-terms.md#lazy-evaluation)

---

## Action Handler

**Definition**: A function that processes a specific action within the pipeline, containing business logic and store interactions.

**Usage Context**:
- Business logic implementation
- State transformation
- Side effect management
- Validation and error handling

**Key Characteristics**:
- Receives typed payload and pipeline controller
- Can be synchronous or asynchronous
- Configurable with priority, blocking, and condition options
- Has access to all registered stores via store registry

**Related Terms**: [Pipeline Controller](#pipeline-controller), [Action Pipeline System](#action-pipeline-system), [Handler Configuration](./api-terms.md#handler-configuration)

---

## Pipeline Controller

**Definition**: An interface provided to action handlers for managing pipeline execution flow and payload modification.

**Usage Context**:
- Flow control within action handlers
- Pipeline abortion on errors
- Payload modification for subsequent handlers
- Handler coordination

**Key Methods**:
- `next()`: Continue to the next handler (called automatically)
- `abort(reason?)`: Stop pipeline execution with optional reason
- `modifyPayload(modifier)`: Transform payload for subsequent handlers
- `getPayload()`: Retrieve current payload

**Related Terms**: [Action Handler](#action-handler), [Action Pipeline System](#action-pipeline-system), [Pipeline Context](./api-terms.md#pipeline-context)

---

## Store Registry

**Definition**: A centralized registry that manages store instances and provides access to stores within the application context.

**Usage Context**:
- Store lifecycle management
- Dependency injection for action handlers
- Store discovery and access
- Provider pattern implementation

**Key Characteristics**:
- Centralized store management
- Type-safe store access by key
- Integration with React context system
- Lazy store initialization support

**Related Terms**: [Store Provider](./api-terms.md#storeprovider), [Action Provider](./api-terms.md#actionprovider), [Store Integration Pattern](#store-integration-pattern)

---

## Action Payload Map

**Definition**: A TypeScript interface that defines the mapping between action names and their corresponding payload types.

**Usage Context**:
- Type safety for action dispatch
- Action handler registration
- Compile-time validation
- API contract definition

**Key Characteristics**:
- Extends base ActionPayloadMap interface
- Maps action names to payload types
- Supports void payloads for parameter-less actions
- Enables compile-time type checking

**Related Terms**: [Action Handler](#action-handler), [Action Dispatcher](./api-terms.md#action-dispatcher), [Type Safety](./architecture-terms.md#type-safety)

---

## Handler Configuration

**Definition**: Configuration options that control the behavior of action handlers within the pipeline.

**Usage Context**:
- Handler behavior customization
- Execution order control
- Conditional execution
- Performance optimization

**Configuration Options**:
- `priority`: Execution order (higher numbers run first)
- `id`: Unique identifier for the handler
- `blocking`: Whether to wait for async completion
- `once`: Remove handler after first execution
- `condition`: Function to determine if handler should run

**Related Terms**: [Action Handler](#action-handler), [Pipeline Controller](#pipeline-controller), [Priority-based Execution](./api-terms.md#priority-based-execution)