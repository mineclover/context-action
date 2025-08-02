# System Architecture: MVVM and Store Integration

## Overview

The Context-Action framework implements a clean, [MVVM-inspired pattern][mvvm-pattern] optimized for modern web applications. It establishes a clear separation of concerns:

- **View Layer (Components)**: Renders UI and captures user interactions.
- **ViewModel Layer (Action Pipeline)**: Contains all business logic, processing actions and orchestrating data flow.
- **Model Layer (Stores)**: Manages application state and data persistence.

This architecture ensures a maintainable, testable, and scalable application with clear boundaries.

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "View Layer (React Components)"
        direction LR
        ComponentA[Component A]
        ComponentB[Component B]
        ComponentC[Component C]
    end
    
    subgraph "ViewModel Layer (Action Pipeline)"
        ActionPipeline[ActionRegister<T>]
    end
    
    subgraph "Model Layer (Stores)"
        direction LR
        StoreA[Store A]
        StoreB[Store B]
        StoreC[Store C]
    end

    ComponentA -- "dispatch('action', payload)" --> ActionPipeline
    ComponentB -- "dispatch('action', payload)" --> ActionPipeline
    ComponentC -- "dispatch('action', payload)" --> ActionPipeline

    ActionPipeline -- "Processes Handlers" --> ModelLayer
    
    subgraph ModelLayer
        ActionPipeline -- "getValue() / setValue()" --> StoreA
        ActionPipeline -- "getValue() / setValue()" --> StoreB
        ActionPipeline -- "getValue() / setValue()" --> StoreC
    end

    StoreA -.->|"subscribe via useStoreValue()"| ComponentA
    StoreB -.->|"subscribe via useStoreValue()"| ComponentB
    StoreC -.->|"subscribe via useStoreValue()"| ComponentC
```

---

## Core Systems

### 1. [Action Pipeline System][action-pipeline-system]

All [actions][action-handler] are registered to a central pipeline that processes dispatched events based on priority.

```typescript
// Define action types and payloads
interface AppActions extends [ActionPayloadMap][action-payload-map] {
  updateUser: { id: string; name: string };
  calculateTotal: { items: CartItem[] };
}

// Register a handler for the 'updateUser' action
[actionRegister][actionregister].register('updateUser', async (payload, [controller][pipeline-controller]) => {
  // Business logic for updating a user resides here
});
```

### 2. [Store Integration Pattern][store-integration-pattern]

[Action handlers][action-handler] are designed to interact with stores in a decoupled manner:
1.  Read the current state from one or more stores using `store.getValue()`.
2.  Execute [business logic][business-logic] using the action's payload and the current state.
3.  Update the stores with new state using `store.setValue()` or `store.update()`.

```typescript
// An action handler demonstrating store integration
actionRegister.register('updateUser', async (payload, controller) => {
  // 1. Read current state from multiple stores
  const currentUser = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // 2. Execute business logic
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastModified: Date.now(),
    theme: settings.theme // Example of cross-store logic
  };
  
  // 3. Update stores
  userStore.setValue(updatedUser);
  activityStore.update(activities => [...activities, {
    type: 'user_updated',
    timestamp: Date.now(),
    userId: payload.id
  }]);
});
```

---

## Data Flow

The data flow is unidirectional and predictable, making it easy to trace and debug.

### Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User Interaction
    participant Component as View Component
    participant Dispatch as useActionDispatch
    participant Pipeline as Action Pipeline
    participant Handler as Action Handler
    participant Store as Data Store
    
    User->>Component: Triggers event (e.g., click)
    Component->>Dispatch: dispatch('actionName', payload)
    Dispatch->>Pipeline: Executes action
    Pipeline->>Handler: Runs handler with payload
    
    Handler->>Store: getValue()
    Store-->>Handler: Returns current state
    
    Note over Handler: Executes business logic
    
    Handler->>Store: setValue(newState)
    Store-->>Component: Notifies subscribed components
    Component->>User: Re-renders with updated UI
```

### Execution Flow Steps:

1.  **Component Dispatch**: A component calls `dispatch('actionName', payload)` in response to a user interaction.
2.  **Pipeline Processing**: The action pipeline finds and executes the registered handlers for the action in priority order.
3.  **Store Access**: The handler reads the current state from stores using `getValue()`.
4.  **Business Logic**: The handler processes the payload along with the current state.
5.  **Store Updates**: The handler calls `setValue()` or `update()` to modify the state in the stores.
6.  **Component Re-render**: Components subscribed to the changed stores automatically re-render to reflect the new state.

---

## Key Design Principles

### 1. [Lazy Evaluation][lazy-evaluation]
Store getters (`getValue()`) are called at the moment of execution, not registration. This ensures that handlers always operate on the most recent state, eliminating stale closure issues.

### 2. [Decoupled Architecture][decoupled-architecture]
-   **Actions** are unaware of the components that trigger them.
-   **Stores** are unaware of the actions that modify them.
-   **Components** only need to know action names and payloads, not the underlying business logic.

### 3. [Type Safety][type-safety]
The framework is built with TypeScript from the ground up. Actions, payloads, and store values are all strongly typed, providing compile-time safety and improved developer experience.

```mermaid
graph TD
    subgraph "Type Definitions"
        ActionPayloadMap[ActionPayloadMap Interface]
        StoreTypes[Store Type Definitions]
    end
    
    subgraph "Implementation"
        ActionHandlers[Action Handlers<br/>Strongly Typed Payloads]
        StoreValues[Store Values<br/>Type-safe getValue/setValue]
        ComponentHooks[Component Hooks<br/>Type-safe useStoreValue]
    end
    
    ActionPayloadMap --> ActionHandlers
    StoreTypes --> StoreValues
    
    ActionHandlers <--> StoreValues
    StoreValues <--> ComponentHooks
    ComponentHooks --> ActionHandlers
```

### 4. Testability
Each layer of the architecture can be tested in isolation:
-   **Actions** can be tested with mock stores, independent of the UI.
-   **Stores** can be tested as standalone state containers.
-   **Components** can be tested with a mock `dispatch` function.

### 5. [Performance Optimization Patterns][performance-patterns]

The framework includes several built-in patterns for optimal performance:

#### Memory Management
- **Store Registry Pattern**: Automatic cleanup of unused stores
- **Lazy Store Creation**: Stores created only when needed
- **Reference Stability**: Stable function references to prevent unnecessary re-renders

#### Action Pipeline Optimization
- **Priority-based Execution**: High-priority handlers execute first
- **Selective Handler Execution**: Action guards prevent unnecessary processing
- **Debounce/Throttle Support**: Built-in rate limiting for frequent actions

```typescript
// Example: Performance-optimized action handler
actionRegister.register('expensiveCalculation', 
  async (payload, controller) => {
    // Use controller.abort() for early termination
    if (payload.skipCondition) {
      controller.abort('Skipped due to condition');
      return;
    }
    
    // Batch store updates for better performance
    const results = await heavyComputation(payload);
    
    // Single store update instead of multiple
    storeRegistry.updateMultiple({
      calculationResults: results,
      lastUpdated: Date.now(),
      status: 'completed'
    });
  }, 
  { 
    priority: 10,
    debounce: 300 // Prevent excessive calls
  }
);
```

---

## Real-World Implementation Examples

### Modern LogMonitor Architecture

The framework's LogMonitor system demonstrates advanced architectural patterns:

```mermaid
graph TB
    subgraph "LogMonitor Modular Architecture"
        Types[types.ts<br/>Type Definitions]
        Registry[store-registry.ts<br/>Store Management]
        Utils[utils.ts<br/>Pure Functions]
        Context[context.tsx<br/>React Integration]
        Hooks[hooks.tsx<br/>Business Logic]
        Component[LogMonitor.tsx<br/>UI Presentation]
    end
    
    subgraph "Dependency Injection"
        ToastSystem[Toast System<br/>Optional Dependency]
        Logger[Custom Logger<br/>Optional Dependency]
    end
    
    Types --> Registry
    Types --> Context
    Types --> Hooks
    Registry --> Context
    Utils --> Context
    Utils --> Component
    Context --> Hooks
    Hooks --> Component
    
    ToastSystem -.->|"Injected"| Hooks
    Logger -.->|"Injected"| Hooks
```

#### Key Architectural Improvements:
1. **Modular Design**: Each module has a single responsibility
2. **Dependency Injection**: External systems injected rather than tightly coupled
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Performance**: Memoized functions and stable references
5. **Testability**: Each module can be tested independently

---

## Advanced Patterns & Examples

### 1. [Cross-Store Coordination][cross-store-coordination]
A single action can orchestrate updates across multiple stores, ensuring data consistency.

```mermaid
graph LR
    subgraph "Checkout Action Handler"
        CheckoutAction[checkout Handler]
        CheckoutAction --> ValidateInventory{Validate Inventory}
        ValidateInventory -->|Valid| ProcessOrder[Process Order]
        ValidateInventory -->|Invalid| AbortAction[Abort Action]
        ProcessOrder --> UpdateStores[Update Multiple Stores]
    end
    
    subgraph "Store Operations"
        UpdateStores --> ClearCart[Clear Cart Store]
        UpdateStores --> CreateOrder[Create Order Store Entry]
        UpdateStores --> UpdateInventory[Update Inventory Store]
    end
    
    subgraph "Store Layer"
        CartStore[Cart Store]
        OrderStore[Order Store]
        InventoryStore[Inventory Store]
    end
    
    ClearCart -.-> CartStore
    CreateOrder -.-> OrderStore
    UpdateInventory -.-> InventoryStore
```

### 2. [Async Operations][async-operations] with State Updates
Handlers can easily manage loading states for asynchronous operations like API calls.

```typescript
actionRegister.register('fetchUserData', async (payload, controller) => {
  uiStore.update(ui => ({ ...ui, loading: true }));
  
  try {
    const user = await api.getUser(payload.userId);
    userStore.setValue(user);
  } catch (error) {
    errorStore.setValue({ message: 'Failed to fetch user', error });
    controller.abort('API error');
  } finally {
    uiStore.update(ui => ({ ...ui, loading: false }));
  }
});
```

### 3. [Modular System Integration][modular-integration]
The LogMonitor example shows how to build modular, reusable systems:

```typescript
// Dependency injection pattern for loose coupling
export function useActionLoggerWithCustomToast(toastSystem: ToastSystem) {
  return useActionLogger({ toastSystem });
}

// Store registry pattern for multi-instance management
const logMonitorStoreRegistry = LogMonitorStoreRegistry.getInstance();
const stores = logMonitorStoreRegistry.getStores(pageId, initialConfig);

// Pure function utilities for testability
export function createLogEntry(pageId: string, entry: LogEntryData): LogEntry {
  return {
    ...entry,
    id: generateLogEntryId(pageId),
    timestamp: getCurrentTimeString(),
  };
}
```

---

## Comparison with Traditional MVVM

| Aspect | Traditional MVVM | Context-Action MVVM |
|---|---|---|
| Data Binding | Often two-way binding | Unidirectional flow via actions |
| ViewModel | Typically class instances | Functional, composable handlers |
| Commands | Command objects (e.g., `ICommand`) | Simple `dispatch('action', payload)` calls |
| State Updates | Direct property setters | Decoupled store setters |
| Type Safety | Can be runtime-dependent | Compile-time safety is central |
| Debugging | Can involve complex binding chains | Linear, traceable action flow |
| Modularity | Often monolithic ViewModels | Composable, injectable handlers |
| Performance | View-driven optimization | Action-driven lazy evaluation |

## See Also

- [Store Integration](./store-integration.md) - Advanced store integration patterns
- [Action Pipeline](./action-pipeline.md) - Understanding the action execution system
- [Best Practices](./best-practices.md) - Development best practices and guidelines

<!-- Glossary Reference Links -->
[mvvm-pattern]: ../../ko/glossary/architecture-terms.md#mvvm-pattern
[action-handler]: ../../ko/glossary/core-concepts.md#action-handler
[viewmodel-layer]: ../../ko/glossary/architecture-terms.md#viewmodel-layer
[model-layer]: ../../ko/glossary/architecture-terms.md#model-layer
[view-layer]: ../../ko/glossary/architecture-terms.md#view-layer
[action-pipeline-system]: ../../ko/glossary/core-concepts.md#action-pipeline-system
[action-payload-map]: ../../ko/glossary/core-concepts.md#action-payload-map
[actionregister]: ../../ko/glossary/api-terms.md#actionregister
[pipeline-controller]: ../../ko/glossary/core-concepts.md#pipeline-controller
[store-integration-pattern]: ../../ko/glossary/core-concepts.md#store-integration-pattern
[lazy-evaluation]: ../../ko/glossary/architecture-terms.md#lazy-evaluation
[business-logic]: ../../ko/glossary/architecture-terms.md#business-logic
[decoupled-architecture]: ../../ko/glossary/architecture-terms.md#decoupled-architecture
[type-safety]: ../../ko/glossary/architecture-terms.md#type-safety
[performance-patterns]: ../../ko/glossary/architecture-terms.md#performance-patterns
[modular-integration]: ../../ko/glossary/architecture-terms.md#modular-integration
[storeprovider]: ../../ko/glossary/api-terms.md#storeprovider
[actionprovider]: ../../ko/glossary/api-terms.md#actionprovider
[action-dispatcher]: ../../ko/glossary/api-terms.md#action-dispatcher
[store-hooks]: ../../ko/glossary/api-terms.md#store-hooks
[cross-store-coordination]: ../../ko/glossary/api-terms.md#cross-store-coordination
[async-operations]: ../../ko/glossary/api-terms.md#async-operations
