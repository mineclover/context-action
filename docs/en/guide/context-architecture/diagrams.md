# Context-Action Architectural Diagrams

## Overview

This document contains visual representations of the Context-Action framework's architecture, data flow patterns, and integration models. These diagrams help illustrate the context-based domain isolation concepts and implementation patterns.

## Overall Architecture Overview

### Context-Based Domain Architecture

```mermaid
graph TB
    subgraph "Context Boundaries"
        subgraph "Auth Domain"
            AuthComponent[Auth Components]
            AuthPipeline[Auth Action Pipeline]
            AuthStores[Auth Stores]
            
            AuthComponent -->|dispatch| AuthPipeline
            AuthPipeline <-->|get/set| AuthStores
            AuthStores -.->|subscribe| AuthComponent
        end
        
        subgraph "User Domain"
            UserComponent[User Components]
            UserPipeline[User Action Pipeline]
            UserStores[User Stores]
            
            UserComponent -->|dispatch| UserPipeline
            UserPipeline <-->|get/set| UserStores
            UserStores -.->|subscribe| UserComponent
        end
        
        subgraph "Shopping Domain"
            ShoppingComponent[Shopping Components]
            ShoppingPipeline[Shopping Action Pipeline]
            ShoppingStores[Shopping Stores]
            
            ShoppingComponent -->|dispatch| ShoppingPipeline
            ShoppingPipeline <-->|get/set| ShoppingStores
            ShoppingStores -.->|subscribe| ShoppingComponent
        end
    end
    
    subgraph "Cross-Context Layer"
        BridgeComponent[Bridge Components]
        EventBus[Event Bus]
        
        BridgeComponent -.->|coordinate| AuthPipeline
        BridgeComponent -.->|coordinate| UserPipeline
        BridgeComponent -.->|coordinate| ShoppingPipeline
        
        AuthPipeline -.->|events| EventBus
        UserPipeline -.->|events| EventBus
        ShoppingPipeline -.->|events| EventBus
    end
```

### MVVM Pattern with Context Isolation

```mermaid
graph LR
    subgraph "View Layer (React Components)"
        AuthView[Auth Components]
        UserView[User Components]
        ShoppingView[Shopping Components]
    end
    
    subgraph "ViewModel Layer (Action Pipelines)"
        AuthActions[Auth Actions]
        UserActions[User Actions]
        ShoppingActions[Shopping Actions]
    end
    
    subgraph "Model Layer (Stores)"
        AuthModel[Auth Stores]
        UserModel[User Stores]
        ShoppingModel[Shopping Stores]
    end
    
    subgraph "Context Boundaries"
        AuthBoundary[Auth Context]
        UserBoundary[User Context]
        ShoppingBoundary[Shopping Context]
    end
    
    AuthView <--> AuthActions
    AuthActions <--> AuthModel
    AuthBoundary -.->|isolates| AuthView
    AuthBoundary -.->|isolates| AuthActions
    AuthBoundary -.->|isolates| AuthModel
    
    UserView <--> UserActions
    UserActions <--> UserModel
    UserBoundary -.->|isolates| UserView
    UserBoundary -.->|isolates| UserActions
    UserBoundary -.->|isolates| UserModel
    
    ShoppingView <--> ShoppingActions
    ShoppingActions <--> ShoppingModel
    ShoppingBoundary -.->|isolates| ShoppingView
    ShoppingBoundary -.->|isolates| ShoppingActions
    ShoppingBoundary -.->|isolates| ShoppingModel
```

## Action Execution Flow Sequence

### Single Context Execution

```mermaid
sequenceDiagram
    participant Component as Shopping Component
    participant Dispatch as useAction()
    participant Pipeline as Shopping Pipeline
    participant Handler as addToCart Handler
    participant CartStore as Cart Store
    participant InventoryStore as Inventory Store
    participant Subscriber as UI Subscriber

    Component->>Dispatch: dispatch('addToCart', payload)
    Dispatch->>Pipeline: Execute within Shopping Context
    Pipeline->>Handler: Run handler with payload
    Handler->>CartStore: getValue() - Get current cart
    CartStore-->>Handler: Current cart data
    Handler->>InventoryStore: getValue() - Check inventory
    InventoryStore-->>Handler: Inventory data
    
    Note over Handler: Validate inventory<br/>Execute business logic<br/>Apply cart rules
    
    Handler->>CartStore: setValue(updatedCart)
    CartStore-->>Subscriber: Notify subscribers
    Handler-->>Pipeline: Complete
    Pipeline-->>Dispatch: Action complete
    Dispatch-->>Component: Promise resolved
    Subscriber->>Component: Re-render with new state
```

### Cross-Context Coordination Sequence

```mermaid
sequenceDiagram
    participant Dashboard as Dashboard Component
    participant AuthDispatch as Auth Dispatch
    participant UserDispatch as User Dispatch
    participant ShoppingDispatch as Shopping Dispatch
    participant AuthPipeline as Auth Pipeline
    participant UserPipeline as User Pipeline
    participant ShoppingPipeline as Shopping Pipeline
    participant Stores as Various Stores

    Dashboard->>AuthDispatch: dispatch('logout')
    AuthDispatch->>AuthPipeline: Execute in Auth Context
    AuthPipeline->>Stores: Clear auth stores
    AuthPipeline-->>AuthDispatch: Auth logout complete
    
    Dashboard->>UserDispatch: dispatch('resetUser')
    UserDispatch->>UserPipeline: Execute in User Context
    UserPipeline->>Stores: Clear user stores
    UserPipeline-->>UserDispatch: User reset complete
    
    Dashboard->>ShoppingDispatch: dispatch('clearCart')
    ShoppingDispatch->>ShoppingPipeline: Execute in Shopping Context
    ShoppingPipeline->>Stores: Clear shopping stores
    ShoppingPipeline-->>ShoppingDispatch: Cart cleared
    
    Note over Dashboard: All contexts coordinated<br/>independently but orchestrated<br/>by Dashboard component
```

## Data Flow Patterns

### Intra-Context Data Flow

```mermaid
flowchart TD
    UserInteraction[User Interaction] --> Component[Shopping Component]
    Component --> ContextDispatch{Shopping Context Dispatch}
    ContextDispatch --> ActionPipeline[Shopping Action Pipeline]
    ActionPipeline --> Validation{Validate Action}
    
    Validation -->|Valid| Handler[Action Handler]
    Validation -->|Invalid| ErrorHandler[Error Handler]
    
    Handler --> ReadStores[Read Shopping Stores]
    ReadStores --> BusinessLogic[Shopping Business Logic]
    BusinessLogic --> UpdateStores[Update Shopping Stores]
    UpdateStores --> NotifySubscribers[Notify Shopping Subscribers]
    NotifySubscribers --> ComponentReRender[Shopping Component Re-render]
    ComponentReRender --> UpdatedUI[Updated Shopping UI]
    
    ErrorHandler --> ErrorStores[Update Error Stores]
    ErrorStores --> ErrorNotification[Error Notification]
```

### Cross-Context Data Flow

```mermaid
flowchart LR
    subgraph "Auth Context Flow"
        AuthComponent[Login Component] --> AuthDispatch[Auth Dispatch]
        AuthDispatch --> AuthPipeline[Auth Pipeline]
        AuthPipeline --> AuthStores[Auth Stores]
        AuthStores --> AuthEvent[Auth Success Event]
    end
    
    subgraph "Cross-Context Bridge"
        AuthEvent --> EventBus[Event Bus]
        EventBus --> UserEvent[User Load Event]
        EventBus --> ShoppingEvent[Cart Load Event]
    end
    
    subgraph "User Context Flow"
        UserEvent --> UserDispatch[User Dispatch]
        UserDispatch --> UserPipeline[User Pipeline]
        UserPipeline --> UserStores[User Stores]
        UserStores --> UserComponent[Profile Component]
    end
    
    subgraph "Shopping Context Flow"
        ShoppingEvent --> ShoppingDispatch[Shopping Dispatch]
        ShoppingDispatch --> ShoppingPipeline[Shopping Pipeline]
        ShoppingPipeline --> ShoppingStores[Shopping Stores]
        ShoppingStores --> ShoppingComponent[Cart Component]
    end
```

## Context Integration Patterns

### Provider Hierarchy Pattern

```mermaid
graph TD
    App[App Root] --> StoreProvider[Global Store Provider]
    StoreProvider --> AuthProvider[Auth Context Provider]
    AuthProvider --> UserProvider[User Context Provider]
    UserProvider --> ShoppingProvider[Shopping Context Provider]
    ShoppingProvider --> NotificationProvider[Notification Context Provider]
    NotificationProvider --> AppContent[App Content]
    
    subgraph "Context Isolation Boundaries"
        AuthBoundary[Auth Boundary]
        UserBoundary[User Boundary]
        ShoppingBoundary[Shopping Boundary]
        NotificationBoundary[Notification Boundary]
    end
    
    AuthProvider -.-> AuthBoundary
    UserProvider -.-> UserBoundary
    ShoppingProvider -.-> ShoppingBoundary
    NotificationProvider -.-> NotificationBoundary
```

### Parallel Context Pattern

```mermaid
graph TD
    App[App Root] --> MainLayout[Main Layout]
    
    MainLayout --> AuthSection[Auth Section]
    MainLayout --> UserSection[User Section]
    MainLayout --> ShoppingSection[Shopping Section]
    
    AuthSection --> AuthProvider[Auth Context Provider]
    UserSection --> UserProvider[User Context Provider]
    ShoppingSection --> ShoppingProvider[Shopping Context Provider]
    
    AuthProvider --> AuthStoreProvider[Auth Store Provider]
    UserProvider --> UserStoreProvider[User Store Provider]
    ShoppingProvider --> ShoppingStoreProvider[Shopping Store Provider]
    
    AuthStoreProvider --> AuthComponents[Auth Components]
    UserStoreProvider --> UserComponents[User Components]
    ShoppingStoreProvider --> ShoppingComponents[Shopping Components]
```

## Complex Coordination Patterns

### Multi-Domain Checkout Flow

```mermaid
stateDiagram-v2
    [*] --> InitiateCheckout: User clicks checkout
    
    InitiateCheckout --> ValidateAuth: Shopping Context
    ValidateAuth --> AuthFailed: Auth Context
    ValidateAuth --> ValidateCart: Auth Context
    
    ValidateCart --> CartEmpty: Shopping Context
    ValidateCart --> ProcessPayment: Shopping Context
    
    ProcessPayment --> PaymentFailed: Payment Context
    ProcessPayment --> CreateOrder: Payment Context
    
    CreateOrder --> UpdateInventory: Shopping Context
    UpdateInventory --> UpdateUserHistory: User Context
    UpdateUserHistory --> SendNotification: Notification Context
    SendNotification --> CheckoutComplete: All Contexts
    
    CheckoutComplete --> [*]
    
    AuthFailed --> ShowAuthError: Notification Context
    ShowAuthError --> [*]
    
    CartEmpty --> ShowCartError: Notification Context
    ShowCartError --> [*]
    
    PaymentFailed --> ShowPaymentError: Notification Context
    ShowPaymentError --> [*]
```

### Event-Driven Cross-Context Communication

```mermaid
graph TB
    subgraph "Event Publishers"
        AuthContext[Auth Context] --> AuthEvents[Auth Events]
        UserContext[User Context] --> UserEvents[User Events]
        ShoppingContext[Shopping Context] --> ShoppingEvents[Shopping Events]
    end
    
    subgraph "Event Bus"
        AuthEvents --> EventBus[Central Event Bus]
        UserEvents --> EventBus
        ShoppingEvents --> EventBus
    end
    
    subgraph "Event Subscribers"
        EventBus --> AuthSubscribers[Auth Subscribers]
        EventBus --> UserSubscribers[User Subscribers]
        EventBus --> ShoppingSubscribers[Shopping Subscribers]
        EventBus --> NotificationSubscribers[Notification Subscribers]
    end
    
    subgraph "Event Handlers"
        AuthSubscribers --> HandleAuthEvents[Handle Auth Events]
        UserSubscribers --> HandleUserEvents[Handle User Events]
        ShoppingSubscribers --> HandleShoppingEvents[Handle Shopping Events]
        NotificationSubscribers --> HandleNotificationEvents[Handle Notification Events]
    end
```

## Performance Optimization Patterns

### Context Splitting for Performance

```mermaid
graph TD
    subgraph "Before: Monolithic Context"
        MonolithicUser[Large User Context]
        MonolithicUser --> ProfileData[Profile Data]
        MonolithicUser --> PreferencesData[Preferences Data]
        MonolithicUser --> ActivityData[Activity Data]
        MonolithicUser --> SettingsData[Settings Data]
        
        AllComponents[All User Components] --> MonolithicUser
    end
    
    subgraph "After: Split Contexts"
        ProfileContext[User Profile Context] --> ProfileData2[Profile Data]
        PreferencesContext[User Preferences Context] --> PreferencesData2[Preferences Data]
        ActivityContext[User Activity Context] --> ActivityData2[Activity Data]
        SettingsContext[User Settings Context] --> SettingsData2[Settings Data]
        
        ProfileComponents[Profile Components] --> ProfileContext
        PreferencesComponents[Preferences Components] --> PreferencesContext
        ActivityComponents[Activity Components] --> ActivityContext
        SettingsComponents[Settings Components] --> SettingsContext
    end
```

### Lazy Context Loading

```mermaid
graph TD
    AppStart[App Start] --> CoreContexts[Load Core Contexts]
    CoreContexts --> AuthContext[Auth Context]
    CoreContexts --> NavigationContext[Navigation Context]
    
    UserAction[User Action] --> LazyLoad{Need Feature Context?}
    LazyLoad -->|Yes| LoadFeatureContext[Load Feature Context]
    LazyLoad -->|No| ContinueExecution[Continue with Core Contexts]
    
    LoadFeatureContext --> ShoppingContext[Shopping Context]
    LoadFeatureContext --> PaymentContext[Payment Context]
    LoadFeatureContext --> ReportingContext[Reporting Context]
    
    ShoppingContext --> FeatureReady[Feature Ready]
    PaymentContext --> FeatureReady
    ReportingContext --> FeatureReady
    
    FeatureReady --> ExecuteFeature[Execute Feature]
    ContinueExecution --> ExecuteCore[Execute Core Feature]
```

## Testing Architecture

### Context Isolation Testing

```mermaid
graph TB
    subgraph "Test Setup"
        TestCase[Test Case] --> MockProvider[Mock Context Provider]
        MockProvider --> MockStores[Mock Stores]
        MockProvider --> MockHandlers[Mock Handlers]
    end
    
    subgraph "Isolated Context"
        MockProvider --> IsolatedContext[Isolated Shopping Context]
        IsolatedContext --> TestComponent[Component Under Test]
        IsolatedContext --> TestHandlers[Test Handlers]
        IsolatedContext --> TestStores[Test Stores]
    end
    
    subgraph "Test Execution"
        TestComponent --> TriggerAction[Trigger Action]
        TriggerAction --> TestHandlers
        TestHandlers --> TestStores
        TestStores --> ValidateState[Validate State]
    end
    
    subgraph "Assertions"
        ValidateState --> AssertStoreState[Assert Store State]
        ValidateState --> AssertComponentState[Assert Component State]
        ValidateState --> AssertHandlerCalls[Assert Handler Calls]
    end
```

### Cross-Context Integration Testing

```mermaid
graph TB
    subgraph "Integration Test Setup"
        IntegrationTest[Integration Test] --> MultiContextProvider[Multi-Context Provider]
        MultiContextProvider --> AuthTestContext[Auth Test Context]
        MultiContextProvider --> UserTestContext[User Test Context]
        MultiContextProvider --> ShoppingTestContext[Shopping Test Context]
    end
    
    subgraph "Cross-Context Scenario"
        AuthTestContext --> LoginAction[Login Action]
        LoginAction --> CrossContextEvent[Cross-Context Event]
        CrossContextEvent --> UserLoadAction[User Load Action]
        CrossContextEvent --> CartLoadAction[Cart Load Action]
        
        UserTestContext --> UserLoadAction
        ShoppingTestContext --> CartLoadAction
    end
    
    subgraph "Integration Validation"
        UserLoadAction --> ValidateUserState[Validate User State]
        CartLoadAction --> ValidateCartState[Validate Cart State]
        ValidateUserState --> AssertIntegration[Assert Integration Success]
        ValidateCartState --> AssertIntegration
    end
```

## Type Safety Flow

### Context-Scoped Type Safety

```mermaid
graph TD
    subgraph "Type Definitions"
        AuthTypes[Auth Action Types]
        UserTypes[User Action Types]
        ShoppingTypes[Shopping Action Types]
        
        AuthPayloads[Auth Payload Types]
        UserPayloads[User Payload Types]
        ShoppingPayloads[Shopping Payload Types]
    end
    
    subgraph "Context Creation"
        AuthTypes --> AuthContext[Auth Context<AuthActions>]
        UserTypes --> UserContext[User Context<UserActions>]
        ShoppingTypes --> ShoppingContext[Shopping Context<ShoppingActions>]
    end
    
    subgraph "Type-Safe Usage"
        AuthContext --> AuthDispatch[Type-Safe Auth Dispatch]
        UserContext --> UserDispatch[Type-Safe User Dispatch]
        ShoppingContext --> ShoppingDispatch[Type-Safe Shopping Dispatch]
        
        AuthPayloads --> AuthDispatch
        UserPayloads --> UserDispatch
        ShoppingPayloads --> ShoppingDispatch
    end
    
    subgraph "Compile-Time Checking"
        AuthDispatch --> AuthTypeCheck[Auth Type Validation]
        UserDispatch --> UserTypeCheck[User Type Validation]
        ShoppingDispatch --> ShoppingTypeCheck[Shopping Type Validation]
        
        AuthTypeCheck --> CompileTimeError{Type Error?}
        UserTypeCheck --> CompileTimeError
        ShoppingTypeCheck --> CompileTimeError
        
        CompileTimeError -->|Yes| BuildFail[Build Failure]
        CompileTimeError -->|No| BuildSuccess[Build Success]
    end
```

## Next Steps

- **Implementation**: Use these diagrams as reference while implementing patterns from [patterns.md](./patterns.md)
- **Architecture Planning**: Reference these diagrams when designing context boundaries in [architecture.md](./architecture.md)
- **Integration**: Apply these visual patterns when following [integration.md](./integration.md) guidelines