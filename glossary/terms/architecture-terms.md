# Architecture Terms

MVVM architecture and design patterns used throughout the Context-Action framework.

## MVVM Pattern

**Definition**: Model-View-ViewModel architectural pattern adapted for React applications with centralized state management and action-based business logic.


**Usage Context**:
- Application architecture design
- Separation of concerns implementation
- Scalable application structure
- Clean code organization

**Key Characteristics**:
- **View**: React components handling presentation
- **ViewModel**: Action handlers containing business logic
- **Model**: Stores managing application state
- Unidirectional data flow via actions
- Type-safe communication between layers


**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Unidirectional Data Flow](#unidirectional-data-flow)

---

## View Layer

**Definition**: The presentation layer consisting of React components responsible for rendering UI and capturing user interactions.


**Usage Context**:
- User interface rendering
- User interaction handling
- Store subscription for reactive updates
- Action dispatch for business logic

**Responsibilities**:
- ✅ **DO**: Handle presentation and user interaction
- ✅ **DO**: Subscribe to relevant stores
- ✅ **DO**: Dispatch actions with payloads
- ❌ **DON'T**: Contain business logic
- ❌ **DON'T**: Directly manipulate store state
- ❌ **DON'T**: Make API calls or side effects


**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Model Layer](#model-layer), [Store Hooks](./api-terms.md#store-hooks), [Action Dispatcher](./api-terms.md#action-dispatcher)

---

## ViewModel Layer

**Definition**: The business logic layer implemented through action handlers that process user actions and coordinate between View and Model layers.


**Usage Context**:
- Business logic implementation
- State transformation and validation
- Cross-store coordination
- Side effect management

**Responsibilities**:
- ✅ **DO**: Implement business logic and validation
- ✅ **DO**: Coordinate multiple stores
- ✅ **DO**: Handle async operations and side effects
- ✅ **DO**: Provide error handling and rollback
- ❌ **DON'T**: Directly manipulate DOM
- ❌ **DON'T**: Handle presentation logic
- ❌ **DON'T**: Maintain local state


**Related Terms**: [View Layer](#view-layer), [Model Layer](#model-layer), [Action Handler](./core-concepts.md#action-handler), [Business Logic](#business-logic)

---

## Model Layer

**Definition**: The data management layer consisting of stores that handle application state, persistence, and change notifications.


**Usage Context**:
- Application state management
- Data persistence and retrieval
- Change notification to subscribers
- Computed value derivation

**Responsibilities**:
- ✅ **DO**: Manage application state
- ✅ **DO**: Provide controlled access to data
- ✅ **DO**: Notify subscribers of changes
- ✅ **DO**: Integrate with persistence layers
- ❌ **DON'T**: Contain business logic
- ❌ **DON'T**: Handle UI concerns
- ❌ **DON'T**: Make direct API calls


**Related Terms**: [View Layer](#view-layer), [ViewModel Layer](#viewmodel-layer), [Store Registry](./core-concepts.md#store-registry), [Computed Store](./api-terms.md#computed-store)

---

## Lazy Evaluation

**Definition**: A design pattern where store values are retrieved at execution time rather than at registration time, ensuring handlers always receive fresh state.


**Usage Context**:
- Action handler implementation
- State consistency guarantee
- Avoiding stale closure issues
- Dynamic state access

**Key Benefits**:
- Eliminates stale closure problems
- Guarantees fresh state values
- Supports dynamic store content
- Enables flexible handler composition


**Related Terms**: [Action Handler](./core-concepts.md#action-handler), [Store Integration Pattern](./core-concepts.md#store-integration-pattern), [Fresh State Access](#fresh-state-access)

---

## Decoupled Architecture

**Definition**: An architectural approach where components, actions, and stores are loosely coupled, communicating through well-defined interfaces rather than direct dependencies.


**Usage Context**:
- System design and organization
- Module independence
- Testing and maintenance
- Scalability planning

**Key Principles**:
- Actions don't know about components
- Stores don't know about actions  
- Components only know action names and payloads
- Communication through standardized interfaces

**Benefits**:
- Independent testing of each layer
- Easy refactoring and maintenance
- Reusable business logic
- Clear separation of concerns


**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Separation of Concerns](#separation-of-concerns), [Loose Coupling](#loose-coupling)

---

## Unidirectional Data Flow

**Definition**: A data flow pattern where information moves in a single direction: from user interactions through actions to state updates and back to UI rendering.


**Usage Context**:
- Data flow design
- State management predictability
- Debugging and traceability
- Performance optimization

**Flow Sequence**:
1. **User Interaction** → Component captures event
2. **Action Dispatch** → Component dispatches action with payload
3. **Handler Execution** → ViewModel processes business logic
4. **State Update** → Model layer updates stores
5. **Component Re-render** → View layer reflects changes


**Related Terms**: [MVVM Pattern](#mvvm-pattern), [Action Pipeline System](./core-concepts.md#action-pipeline-system), [Predictable State Updates](#predictable-state-updates)

---

## Type Safety

**Definition**: Compile-time type checking that ensures type correctness across all layers of the architecture, from action payloads to store values.


**Usage Context**:
- Development-time error prevention
- API contract enforcement
- Refactoring safety
- Developer experience enhancement

**Key Features**:
- Strongly typed action payloads
- Type-safe store access
- Compile-time interface validation
- Generic type propagation


**Related Terms**: [Action Payload Map](./core-concepts.md#action-payload-map), [Action Handler](./core-concepts.md#action-handler), [Compile-time Validation](#compile-time-validation)

---

## Business Logic

**Definition**: The core application rules, processes, and workflows that define how data is processed and business requirements are implemented.


**Usage Context**:
- Action handler implementation
- Validation and processing rules
- Workflow orchestration
- Domain-specific operations

**Characteristics**:
- Centralized in ViewModel layer (action handlers)
- Independent of UI presentation
- Testable in isolation
- Reusable across different interfaces


**Related Terms**: [ViewModel Layer](#viewmodel-layer), [Action Handler](./core-concepts.md#action-handler), [Domain Rules](#domain-rules)