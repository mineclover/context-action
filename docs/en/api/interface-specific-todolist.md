# Interface Documentation Guide

Core functionality documentation for TypeDoc generated API references.

## 📋 Essential Structure

Streamlined documentation focusing on functionality, usage patterns, and TypeDoc links.

## 🎯 @context-action/core Interface Documentation

### 📚 Classes

#### ActionRegister  ✅ COMPLETED
- [x] **Core Methods**: `registerHandler()`, `dispatch()`, `unregisterHandler()`
- [x] **Usage**: Pipeline setup, handler priority, execution modes
- [x] **Link**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md) → **[actionregister-guide.md](./actionregister-guide.md)**

#### ReactActionError ✅ COMPLETED
- [x] **Properties**: `action`, `payload`, `handlerId`, `timestamp`
- [x] **Usage**: Error handling, type checking with `isReactActionError()`
- [x] **Link**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md) → **[reactactionerror-guide.md](./reactactionerror-guide.md)**

### 🔌 Interfaces

#### ActionPayloadMap  ✅ COMPLETED
- [x] **Structure**: `{ actionType: PayloadType }` type mapping
- [x] **Usage**: Action type definitions, extends pattern
- [x] **Link**: [`ActionPayloadMap.md`](./core/src/interfaces/ActionPayloadMap.md) → **[actionpayloadmap-guide.md](./actionpayloadmap-guide.md)**

#### PipelineController  ✅ COMPLETED
- [x] **Methods**: `abort()`, `getContext()`, `setResult()`
- [x] **Usage**: Handler execution control, error handling
- [x] **Link**: [`PipelineController.md`](./core/src/interfaces/PipelineController.md) → **[pipelinecontroller-guide.md](./pipelinecontroller-guide.md)**

#### HandlerConfig  ✅ COMPLETED
- [x] **Properties**: `priority`, `id`, `blocking`, `once`, `debounce`, `throttle`, `replaceExisting`, `cleanup`
- [x] **Usage**: Handler registration, priority ordering, timing control, and lifecycle management
- [x] **Link**: [`HandlerConfig.md`](./core/src/interfaces/HandlerConfig.md) → **[handlerconfig-guide.md](./handlerconfig-guide.md)**

#### ActionRegisterConfig  ✅ COMPLETED
- [x] **Properties**: `name`, `registry` with options like `debug`, `defaultExecutionMode`, etc.
- [x] **Usage**: ActionRegister initialization, performance tuning, debugging
- [x] **Link**: [`ActionRegisterConfig.md`](./core/src/interfaces/ActionRegisterConfig.md) → **[actionregisterconfig-guide.md](./actionregisterconfig-guide.md)**

#### DispatchOptions ✅ COMPLETED
- [x] **Properties**: Dynamic dispatch configuration
- [x] **Usage**: Per-action behavior overrides
- [x] **Link**: [`DispatchOptions.md`](./core/src/interfaces/DispatchOptions.md) → **[dispatchoptions-guide.md](./dispatchoptions-guide.md)**

#### ExecutionResult ✅ COMPLETED
- [x] **Structure**: Success/error status, results collection
- [x] **Usage**: Action execution outcomes, error handling
- [x] **Link**: [`ExecutionResult.md`](./core/src/interfaces/ExecutionResult.md) → **[executionresult-guide.md](./executionresult-guide.md)**

#### ActionDispatcher ✅ COMPLETED
- [x] **Methods**: Type-safe action dispatching interface
- [x] **Usage**: Dispatcher implementation contracts
- [x] **Link**: [`ActionDispatcher.md`](./core/src/interfaces/ActionDispatcher.md) → **[actiondispatcher-guide.md](./actiondispatcher-guide.md)**

### 🏷️ Type Aliases

#### ActionHandler  ✅ COMPLETED
- [x] **Type**: `(payload, controller) => Promise<any> | any`
- [x] **Usage**: Handler implementation, async/sync patterns
- [x] **Link**: [`ActionHandler.md`](./core/src/type-aliases/ActionHandler.md) → **[actionhandler-guide.md](./actionhandler-guide.md)**

#### ExecutionMode ✅ COMPLETED
- [x] **Values**: `'sequential' | 'parallel' | 'race'`
- [x] **Usage**: Handler execution strategy selection
- [x] **Link**: [`ExecutionMode.md`](./core/src/type-aliases/ExecutionMode.md) → **[executionmode-guide.md](./executionmode-guide.md)**

#### UnregisterFunction ✅ COMPLETED
- [x] **Type**: `() => void`
- [x] **Usage**: Handler cleanup, memory management
- [x] **Link**: [`UnregisterFunction.md`](./core/src/type-aliases/UnregisterFunction.md) → **[unregisterfunction-guide.md](./unregisterfunction-guide.md)**

### ⚙️ Functions

#### Execution Functions
##### executeSequential ✅ COMPLETED
- [x] **Signature**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **Usage**: Priority-based handler execution
- [x] **Link**: [`executeSequential.md`](./core/src/functions/executeSequential.md) → **[executesequential-guide.md](./executesequential-guide.md)**

##### executeParallel   ✅ COMPLETED
- [x] **Signature**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **Usage**: Concurrent handler execution, performance optimization
- [x] **Link**: [`executeParallel.md`](./core/src/functions/executeParallel.md) → **[executeparallel-guide.md](./executeparallel-guide.md)**

##### executeRace ✅ COMPLETED
- [x] **Signature**: `(handlers, payload, options) => Promise<ExecutionResult>`
- [x] **Usage**: First successful result, fallback patterns
- [x] **Link**: [`executeRace.md`](./core/src/functions/executeRace.md) → **[executerace-guide.md](./executerace-guide.md)**

#### Factory Functions  
##### createActionHandler ✅ COMPLETED
- [x] **Signature**: `(handler, config?) => HandlerConfig`
- [x] **Usage**: Type-safe handler creation
- [x] **Link**: [`createActionHandler.md`](./core/src/functions/createActionHandler.md) → **[createactionhandler-guide.md](./createactionhandler-guide.md)**

##### createReactHandlerConfig ✅ COMPLETED
- [x] **Signature**: `(component, config) => HandlerConfig`
- [x] **Usage**: React integration, component lifecycle
- [x] **Link**: [`createReactHandlerConfig.md`](./core/src/functions/createReactHandlerConfig.md) → **[createreacthandlerconfig-guide.md](./createreacthandlerconfig-guide.md)**

##### createReactDispatcher ✅ COMPLETED
- [x] **Signature**: `(register, options?) => ActionDispatcher`
- [x] **Usage**: React-optimized dispatchers
- [x] **Link**: [`createReactDispatcher.md`](./core/src/functions/createReactDispatcher.md) → **[createreactdispatcher-guide.md](./createreactdispatcher-guide.md)**

#### Utilities
##### isReactActionError ✅ COMPLETED
- [x] **Signature**: `(error: any) => error is ReactActionError`
- [x] **Usage**: Type guard for error handling
- [x] **Link**: [`isReactActionError.md`](./core/src/functions/isReactActionError.md) → **[isreactactionerror-guide.md](./isreactactionerror-guide.md)**

### 🛠️ Variables

#### ReactDevUtils ✅ COMPLETED
- [x] **Type**: Development utilities object
- [x] **Usage**: Debug tools, React development patterns
- [x] **Link**: [`ReactDevUtils.md`](./core/src/variables/ReactDevUtils.md) → **[reactdevutils-guide.md](./reactdevutils-guide.md)**

## ⚛️ @context-action/react

### 📚 Classes

#### Store  ✅ COMPLETED
- [x] **Methods**: `getValue()`, `setValue()`, `update()`, `subscribe()`, `snapshot()`
- [x] **Usage**: Reactive state, subscriptions, validation
- [x] **Link**: [`Store.md`](./react/src/classes/Store.md) → **[store-guide.md](./store-guide.md)**

#### StoreManager ✅ COMPLETED
- [x] **Methods**: `register()`, `getStore()`, `getAllStores()`, `clear()`
- [x] **Usage**: Store registry, lifecycle management
- [x] **Link**: [`StoreManager.md`](./react/src/classes/StoreManager.md) → **[storemanager-guide.md](./storemanager-guide.md)**

#### StoreErrorBoundary ✅ COMPLETED
- [x] **Props**: Error boundary configuration
- [x] **Usage**: Store error isolation, recovery strategies
- [x] **Link**: [`StoreErrorBoundary.md`](./react/src/classes/StoreErrorBoundary.md) → **[storeerrorboundary-guide.md](./storeerrorboundary-guide.md)**

### 🔌 Interfaces

#### Action Context
##### ActionContextConfig ✅ COMPLETED
- [x] **Properties**: Action context configuration options
- [x] **Usage**: Context customization, pipeline configuration
- [x] **Link**: [`ActionContextConfig.md`](./react/src/interfaces/ActionContextConfig.md) → **[actioncontextconfig-guide.md](./actioncontextconfig-guide.md)**

##### ActionContextType ✅ COMPLETED
- [x] **Structure**: Action context type definition
- [x] **Usage**: Type-safe context validation
- [x] **Link**: [`ActionContextType.md`](./react/src/interfaces/ActionContextType.md) → **[actioncontexttype-guide.md](./actioncontexttype-guide.md)**

##### ActionContextReturn ✅ COMPLETED
- [x] **Properties**: `Provider`, `useActionDispatch`, `useActionHandler`, and other hooks
- [x] **Usage**: Hook implementation, context patterns
- [x] **Link**: [`ActionContextReturn.md`](./react/src/interfaces/ActionContextReturn.md) → **[actioncontextreturn-guide.md](./actioncontextreturn-guide.md)**

#### Ref Context
##### RefContextReturn ✅ COMPLETED
- [x] **Properties**: Provider, ref handler hooks
- [x] **Usage**: Direct DOM manipulation, zero rerenders
- [x] **Link**: [`RefContextReturn.md`](./react/src/interfaces/RefContextReturn.md) → **[refcontextreturn-guide.md](./refcontextreturn-guide.md)**

##### CreateRefContextOptions ✅ COMPLETED
- [x] **Properties**: Ref context configuration
- [x] **Usage**: Performance tuning, context customization
- [x] **Link**: [`CreateRefContextOptions.md`](./react/src/interfaces/CreateRefContextOptions.md) → **[createrefcontextoptions-guide.md](./createrefcontextoptions-guide.md)**

##### RefTarget ✅ COMPLETED
- [x] **Properties**: `target`, `isMounted`, `setRef`
- [x] **Usage**: Ref management, type-safe element operations
- [x] **Link**: [`RefTarget.md`](./react/src/interfaces/RefTarget.md) → **[reftarget-guide.md](./reftarget-guide.md)**

##### RefOperationResult ✅ COMPLETED
- [x] **Structure**: Operation result status and data
- [x] **Usage**: Operation result handling, error management
- [x] **Link**: [`RefOperationResult.md`](./react/src/interfaces/RefOperationResult.md) → **[refoperationresult-guide.md](./refoperationresult-guide.md)**

##### RefOperationOptions ✅ COMPLETED
- [x] **Properties**: Operation configuration options
- [x] **Usage**: Operation customization
- [x] **Link**: [`RefOperationOptions.md`](./react/src/interfaces/RefOperationOptions.md) → **[refoperationoptions-guide.md](./refoperationoptions-guide.md)**

#### Store Interfaces
##### StoreErrorBoundaryProps ✅ COMPLETED
- [x] **Properties**: Error boundary configuration
- [x] **Usage**: Error boundary setup, store error handling
- [x] **Link**: [`StoreErrorBoundaryProps.md`](./react/src/interfaces/StoreErrorBoundaryProps.md) → **[storeerrorboundaryprops-guide.md](./storeerrorboundaryprops-guide.md)**

##### Snapshot ✅ COMPLETED
- [x] **Structure**: Store snapshot data structure
- [x] **Usage**: State debugging, rollback functionality
- [x] **Link**: [`Snapshot.md`](./react/src/interfaces/Snapshot.md) → **[snapshot-guide.md](./snapshot-guide.md)**

##### IStore ✅ COMPLETED
- [x] **Methods**: Store interface contract methods
- [x] **Usage**: Store implementation contracts, custom stores
- [x] **Link**: [`IStore.md`](./react/src/interfaces/IStore.md) → **[istore-guide.md](./istore-guide.md)**

##### StoreConfig ✅ COMPLETED
- [x] **Properties**: `name`, `initialValue`, `registry`, `autoRegister`
- [x] **Usage**: Store initialization, validation, performance tuning
- [x] **Link**: [`StoreConfig.md`](./react/src/interfaces/StoreConfig.md) → **[storeconfig-guide.md](./storeconfig-guide.md)**

### 🏷️ Type Aliases

#### InitialStores ✅ COMPLETED
- [x] **Structure**: Store definition mapping types
- [x] **Usage**: Store context creation, type inference
- [x] **Link**: [`InitialStores.md`](./react/src/type-aliases/InitialStores.md) → **[initialstores-guide.md](./initialstores-guide.md)**

### ⚙️ Functions

#### Context Creation (Main Patterns)
##### createActionContext  ✅ COMPLETED
- [x] **Signature**: `<T>(name: string, config?) => ActionContextReturn<T>`
- [x] **Usage**: Action-Only pattern, business logic separation
- [x] **Link**: [`createActionContext.md`](./react/src/functions/createActionContext.md) → **[createactioncontext-guide.md](./createactioncontext-guide.md)**

##### createStoreContext  ✅ COMPLETED
- [x] **Signature**: `(name, stores) => StoreContextReturn` (2 overloads)
- [x] **Usage**: Store-Only pattern, type inference, HOC patterns
- [x] **Link**: [`createStoreContext.md`](./react/src/functions/createStoreContext.md) → **[createstorecontext-guide.md](./createstorecontext-guide.md)**

##### createRefContext ✅ COMPLETED
- [x] **Signature**: `<T>(name: string, options?) => RefContextReturn<T>`
- [x] **Usage**: RefContext pattern, zero rerenders, DOM manipulation
- [x] **Link**: [`createRefContext.md`](./react/src/functions/createRefContext.md) → **[createrefcontext-guide.md](./createrefcontext-guide.md)**

#### Store Functions
##### createStore ✅ COMPLETED
- [x] **Signature**: `<T>(config: StoreConfig<T>) => Store<T>`
- [x] **Usage**: Manual store creation, custom implementations
- [x] **Link**: [`createStore.md`](./react/src/functions/createStore.md) → **[createstore-guide.md](./createstore-guide.md)**

##### useStoreValue  ✅ COMPLETED
- [x] **Signature**: `<T>(store: Store<T>) => T`
- [x] **Usage**: Reactive subscription, component data binding
- [x] **Link**: [`useStoreValue.md`](./react/src/functions/useStoreValue.md) → **[usestorevalue-guide.md](./usestorevalue-guide.md)**

##### useStoreSelector ✅ COMPLETED
- [x] **Signature**: `<T, R>(store: Store<T>, selector: (value: T) => R) => R`
- [x] **Usage**: Selective subscription, performance optimization
- [x] **Link**: [`useStoreSelector.md`](./react/src/functions/useStoreSelector.md) → **[usestoreselector-guide.md](./usestoreselector-guide.md)**

## 📝 Documentation Template

### Core Structure
1. **Function/Interface Purpose** - Single line description
2. **Signature/Structure** - Type signature or interface structure  
3. **Usage Patterns** - Common implementation patterns
4. **TypeDoc Link** - Direct link to generated documentation

### Priority Levels
- **High**: Core patterns (ActionRegister, createStoreContext, useStoreValue)
- **Medium**: Advanced features (execution modes, configurations)
- **Low**: Utilities and debug tools

## 📊 Progress Tracking

### Core Package: 20 items
- [x] Classes: 2 items
- [x] Interfaces: 7 items  
- [x] Types: 3 items
- [x] Functions: 7 items
- [x] Variables: 1 item

### React Package: 22 items
- [x] Classes: 3 items
- [x] Interfaces: 12 items
- [x] Types: 1 item
- [x] Functions: 6 items

### Total: 42/42 completed (100%)

## ✅ Completed Guides (42/42)

### Core Package (20/20)
- [x] **ActionRegister** → [actionregister-guide.md](./actionregister-guide.md)
- [x] **ActionPayloadMap** → [actionpayloadmap-guide.md](./actionpayloadmap-guide.md) 
- [x] **PipelineController** → [pipelinecontroller-guide.md](./pipelinecontroller-guide.md)
- [x] **ActionHandler** → [actionhandler-guide.md](./actionhandler-guide.md)
- [x] **HandlerConfig** → [handlerconfig-guide.md](./handlerconfig-guide.md)
- [x] **ActionRegisterConfig** → [actionregisterconfig-guide.md](./actionregisterconfig-guide.md)
- [x] **ExecutionMode** → [executionmode-guide.md](./executionmode-guide.md)
- [x] **ReactActionError** → [reactactionerror-guide.md](./reactactionerror-guide.md)
- [x] **DispatchOptions** → [dispatchoptions-guide.md](./dispatchoptions-guide.md)
- [x] **ExecutionResult** → [executionresult-guide.md](./executionresult-guide.md)
- [x] **ActionDispatcher** → [actiondispatcher-guide.md](./actiondispatcher-guide.md)
- [x] **UnregisterFunction** → [unregisterfunction-guide.md](./unregisterfunction-guide.md)
- [x] **createReactHandlerConfig** → [createreacthandlerconfig-guide.md](./createreacthandlerconfig-guide.md)
- [x] **createReactDispatcher** → [createreactdispatcher-guide.md](./createreactdispatcher-guide.md)
- [x] **executeSequential** → [executesequential-guide.md](./executesequential-guide.md)
- [x] **executeParallel** → [executeparallel-guide.md](./executeparallel-guide.md)
- [x] **executeRace** → [executerace-guide.md](./executerace-guide.md)
- [x] **createActionHandler** → [createactionhandler-guide.md](./createactionhandler-guide.md)
- [x] **isReactActionError** → [isreactactionerror-guide.md](./isreactactionerror-guide.md)
- [x] **ReactDevUtils** → [reactdevutils-guide.md](./reactdevutils-guide.md)

### React Package (22/22)  
- [x] **Store** → [store-guide.md](./store-guide.md)
- [x] **createActionContext** → [createactioncontext-guide.md](./createactioncontext-guide.md)
- [x] **createStoreContext** → [createstorecontext-guide.md](./createstorecontext-guide.md)
- [x] **useStoreValue** → [usestorevalue-guide.md](./usestorevalue-guide.md)
- [x] **StoreManager** → [storemanager-guide.md](./storemanager-guide.md)
- [x] **ActionContextReturn** → [actioncontextreturn-guide.md](./actioncontextreturn-guide.md)
- [x] **StoreConfig** → [storeconfig-guide.md](./storeconfig-guide.md)
- [x] **StoreErrorBoundary** → [storeerrorboundary-guide.md](./storeerrorboundary-guide.md)
- [x] **ActionContextConfig** → [actioncontextconfig-guide.md](./actioncontextconfig-guide.md)
- [x] **ActionContextType** → [actioncontexttype-guide.md](./actioncontexttype-guide.md)
- [x] **RefContextReturn** → [refcontextreturn-guide.md](./refcontextreturn-guide.md)
- [x] **CreateRefContextOptions** → [createrefcontextoptions-guide.md](./createrefcontextoptions-guide.md)
- [x] **RefTarget** → [reftarget-guide.md](./reftarget-guide.md)
- [x] **RefOperationResult** → [refoperationresult-guide.md](./refoperationresult-guide.md)
- [x] **RefOperationOptions** → [refoperationoptions-guide.md](./refoperationoptions-guide.md)
- [x] **StoreErrorBoundaryProps** → [storeerrorboundaryprops-guide.md](./storeerrorboundaryprops-guide.md)
- [x] **Snapshot** → [snapshot-guide.md](./snapshot-guide.md)
- [x] **IStore** → [istore-guide.md](./istore-guide.md)
- [x] **InitialStores** → [initialstores-guide.md](./initialstores-guide.md)
- [x] **createRefContext** → [createrefcontext-guide.md](./createrefcontext-guide.md)
- [x] **createStore** → [createstore-guide.md](./createstore-guide.md)
- [x] **useStoreSelector** → [usestoreselector-guide.md](./usestoreselector-guide.md)

## 🎯 Next Priority Targets

### Medium Priority React