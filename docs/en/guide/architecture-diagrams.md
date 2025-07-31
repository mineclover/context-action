# Architecture Diagrams

This document provides comprehensive visual diagrams of the Context-Action framework architecture, showing how components, actions, and stores interact in various scenarios.

## 1. Overall Architecture Overview

```mermaid
graph TB
    subgraph "View Layer"
        UserProfile[UserProfile Component]
        CartView[CartView Component]
        SettingsPanel[SettingsPanel Component]
    end
    
    subgraph "ViewModel Layer (Action Pipeline)"
        ActionPipeline[Action Pipeline]
        UpdateUserHandler[updateUser Handler]
        CalculateTotalHandler[calculateTotal Handler]
        FetchUserDataHandler[fetchUserData Handler]
    end
    
    subgraph "Model Layer (Stores)"
        UserStore[User Store]
        SettingsStore[Settings Store]
        CartStore[Cart Store]
        UIStore[UI Store]
    end
    
    UserProfile -->|dispatch| ActionPipeline
    CartView -->|dispatch| ActionPipeline
    SettingsPanel -->|dispatch| ActionPipeline
    
    ActionPipeline -->|execute| UpdateUserHandler
    ActionPipeline -->|execute| CalculateTotalHandler
    ActionPipeline -->|execute| FetchUserDataHandler
    
    UpdateUserHandler <-->|getValue/setValue| UserStore
    UpdateUserHandler <-->|getValue| SettingsStore
    CalculateTotalHandler <-->|getValue/setValue| CartStore
    FetchUserDataHandler <-->|update| UIStore
    FetchUserDataHandler <-->|setValue| UserStore
    
    UserStore -.->|subscribe| UserProfile
    SettingsStore -.->|subscribe| UserProfile
    CartStore -.->|subscribe| CartView
    UIStore -.->|subscribe| SettingsPanel
```

This diagram shows the complete architecture with three distinct layers:
- **View Layer**: React components that render UI and dispatch actions
- **ViewModel Layer**: Action handlers that contain business logic
- **Model Layer**: Stores that manage application state

## 2. Action Execution Flow Sequence

```mermaid
sequenceDiagram
    participant UserProfile as UserProfile Component
    participant Dispatch as useActionDispatch
    participant ActionPipeline as Action Pipeline
    participant UpdateUserHandler as updateUser Handler
    participant UserStore as User Store
    participant SettingsStore as Settings Store
    participant ReRender as UI Re-render
    
    UserProfile->>Dispatch: dispatch('updateUser', payload)
    Dispatch->>ActionPipeline: Execute action
    ActionPipeline->>UpdateUserHandler: Run handler with payload
    
    UpdateUserHandler->>UserStore: getValue() - Get current user
    UserStore-->>UpdateUserHandler: Current user data
    
    UpdateUserHandler->>SettingsStore: getValue() - Get settings
    SettingsStore-->>UpdateUserHandler: Current settings
    
    Note over UpdateUserHandler: Execute business logic<br/>- Validate data<br/>- Transform payload<br/>- Apply business rules
    
    UpdateUserHandler->>UserStore: setValue(updatedUser)
    UserStore-->>ReRender: Notify subscribers
    
    UpdateUserHandler-->>ActionPipeline: Complete
    ActionPipeline-->>Dispatch: Action complete
    Dispatch-->>UserProfile: Promise resolved
    
    ReRender->>UserProfile: Re-render with new state
```

This sequence diagram illustrates the complete flow from user interaction to UI update, showing how lazy evaluation ensures fresh state values.

## 3. Cross-Store Coordination Pattern

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
        UpdateStores --> LogActivity[Add Activity Log]
    end
    
    subgraph "Store Layer"
        CartStore[Cart Store]
        OrderStore[Order Store]
        InventoryStore[Inventory Store]
        ActivityStore[Activity Store]
    end
    
    ClearCart -.-> CartStore
    CreateOrder -.-> OrderStore
    UpdateInventory -.-> InventoryStore
    LogActivity -.-> ActivityStore
```

This diagram demonstrates how a single action can coordinate updates across multiple stores, maintaining data consistency and business rules.

## 4. Component-Store-Action Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ComponentMount: Initial Render
    
    ComponentMount --> UserInteraction: Component Ready
    UserInteraction --> DispatchAction: User Event
    DispatchAction --> ActionPipeline: dispatch(action, payload)
    
    ActionPipeline --> HandlerExecution: Priority-based execution
    
    HandlerExecution --> StoreRead: getValue()
    StoreRead --> BusinessLogic: Current State
    
    BusinessLogic --> StoreWrite: setValue()/update()
    StoreWrite --> StoreNotification: Notify Subscribers
    
    StoreNotification --> ComponentMount: Re-render
    ComponentMount --> [*]: Updated UI
    
    HandlerExecution --> AbortAction: controller.abort()
    AbortAction --> ErrorHandling: Handle Error
    ErrorHandling --> ComponentMount: Error State
```

This state diagram shows the complete lifecycle of a component interaction, including both successful execution and error handling paths.

## 5. Type Safety Flow

```mermaid
graph TD
    subgraph "Type Definitions"
        ActionPayloadMap[ActionPayloadMap Interface]
        StoreTypes[Store Type Definitions]
        ComponentProps[Component Props Types]
    end
    
    subgraph "Implementation"
        ActionHandlers[Action Handlers<br/>Strongly Typed Payloads]
        StoreValues[Store Values<br/>Type-safe getValue/setValue]
        ComponentHooks[Component Hooks<br/>Type-safe useStoreValue]
    end
    
    ActionPayloadMap --> ActionHandlers
    StoreTypes --> StoreValues
    ComponentProps --> ComponentHooks
    
    ActionHandlers <--> StoreValues
    StoreValues <--> ComponentHooks
    ComponentHooks --> ActionHandlers
```

This diagram illustrates how TypeScript types flow through the entire architecture, ensuring compile-time safety and better developer experience.

## 6. Data Flow Pattern

```mermaid
flowchart LR
    UserInteraction[User Interaction] --> Component[Component]
    Component --> DispatchAction{dispatch}
    DispatchAction --> ActionPipeline[Action Pipeline]
    ActionPipeline --> ActionHandler[Action Handler]
    ActionHandler --> ReadStore[Read Store State]
    ReadStore --> BusinessLogic[Business Logic]
    BusinessLogic --> UpdateStore[Update Store]
    UpdateStore --> NotifySubscribers[Notify Subscribers]
    NotifySubscribers --> ComponentReRender[Component Re-render]
    ComponentReRender --> UpdatedUI[Updated UI]
```

This flowchart shows the unidirectional data flow that ensures predictable state updates and easier debugging.

## 7. Error Handling Flow

```mermaid
graph TD
    ActionStart[Action Handler Starts] --> TryCatch{Try Block}
    TryCatch -->|Success| BusinessLogic[Execute Business Logic]
    TryCatch -->|Error| CatchBlock[Catch Block]
    
    BusinessLogic --> Validation{Validation}
    Validation -->|Valid| UpdateStores[Update Stores]
    Validation -->|Invalid| ControllerAbort[controller.abort()]
    
    UpdateStores --> ActionComplete[Action Complete]
    
    CatchBlock --> ErrorLogging[Log Error]
    ErrorLogging --> ErrorState[Set Error State]
    ErrorState --> ControllerAbort
    
    ControllerAbort --> ActionAborted[Action Aborted]
    ActionComplete --> ComponentReRender[Component Re-render]
    ActionAborted --> ComponentReRender
```

This diagram shows how errors are handled gracefully in the action pipeline, ensuring the application remains stable.

## 8. Store Subscription Pattern

```mermaid
graph LR
    subgraph "Components"
        ComponentA[Component A]
        ComponentB[Component B]
        ComponentC[Component C]
    end
    
    subgraph "Store Hooks"
        HookA[useStoreValue A]
        HookB[useStoreValue B]
        HookC[useStoreValue C]
    end
    
    subgraph "Stores"
        StoreX[Store X]
        StoreY[Store Y]
    end
    
    ComponentA --> HookA
    ComponentB --> HookB
    ComponentC --> HookC
    
    HookA --> StoreX
    HookB --> StoreX
    HookC --> StoreY
    
    StoreX -.->|notify| HookA
    StoreX -.->|notify| HookB
    StoreY -.->|notify| HookC
    
    HookA -.->|re-render| ComponentA
    HookB -.->|re-render| ComponentB
    HookC -.->|re-render| ComponentC
```

This diagram demonstrates how multiple components can subscribe to stores and receive updates only when relevant data changes.

## Usage

These diagrams can be used to:

1. **Understand Architecture**: Get a visual overview of how the framework components interact
2. **Design New Features**: Plan how new actions and stores will fit into the existing architecture
3. **Debug Issues**: Trace the flow of data and identify potential problem areas
4. **Documentation**: Include in technical documentation and architectural decision records
5. **Team Communication**: Share with team members to explain the system design

## Related Documentation

- [Architecture Overview](./architecture.md) - Comprehensive architecture guide
- [MVVM Architecture](./mvvm-architecture.md) - Detailed MVVM pattern explanation
- [Store Integration](./store-integration.md) - Advanced store integration patterns
- [Action Pipeline](./action-pipeline.md) - Action execution system details