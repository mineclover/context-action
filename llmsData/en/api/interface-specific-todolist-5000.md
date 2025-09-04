---
document_id: en_api_interface-specific-todolist
category: api
source_path: en/api/interface-specific-todolist.md
character_limit: 5000
last_update: '2025-09-02T15:04:22.364Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interface Documentation Guide

Interface Documentation Guide Core functionality documentation for TypeDoc generated API references. 📋 Essential Structure Streamlined documentation focusing on functionality, usage patterns, and TypeDoc links. 🎯 @context-action/core Interface Documentation 📚 Classes ActionRegister - [ ] Core Methods: registerHandler(), dispatch(), unregisterHandler() - [ ] Usage: Pipeline setup, handler priority, execution modes - [ ] Link: ActionRegister.md ReactActionError   - [ ] Properties: actionType, context, originalError - [ ] Usage: Error handling, type checking with isReactActionError() - [ ] Link: ReactActionError.md 🔌 Interfaces ActionPayloadMap - [ ] Structure: { actionType: PayloadType } type mapping - [ ] Usage: Action type definitions, extends pattern - [ ] Link: ActionPayloadMap.md PipelineController   - [ ] Methods: abort(), getContext(), setResult() - [ ] Usage: Handler execution control, error handling - [ ] Link: PipelineController.md HandlerConfig - [ ] Properties: priority, id, metadata - [ ] Usage: Handler registration, priority ordering - [ ] Link: HandlerConfig.md ActionRegisterConfig - [ ] Properties: Register initialization options - [ ] Usage: ActionRegister configuration, performance tuning - [ ] Link: ActionRegisterConfig.md DispatchOptions - [ ] Properties: Dynamic dispatch configuration - [ ] Usage: Per-action behavior overrides - [ ] Link: DispatchOptions.md ExecutionResult - [ ] Structure: Success/error status, results collection - [ ] Usage: Action execution outcomes, error handling - [ ] Link: ExecutionResult.md ActionDispatcher - [ ] Methods: Type-safe action dispatching interface - [ ] Usage: Dispatcher implementation contracts - [ ] Link: ActionDispatcher.md 🏷️ Type Aliases ActionHandler - [ ] Type: (payload, controller) => Promise<any> | any - [ ] Usage: Handler implementation, async/sync patterns - [ ] Link: ActionHandler.md ExecutionMode - [ ] Values: 'sequential' | 'parallel' | 'race' - [ ] Usage: Handler execution strategy selection - [ ] Link: ExecutionMode.md UnregisterFunction   - [ ] Type: () => void - [ ] Usage: Handler cleanup, memory management - [ ] Link: UnregisterFunction.md ⚙️ Functions Execution Functions executeSequential - [ ] Signature: (handlers, payload, options) => Promise<ExecutionResult> - [ ] Usage: Priority-based handler execution - [ ] Link: executeSequential.md executeParallel   - [ ] Signature: (handlers, payload, options) => Promise<ExecutionResult> - [ ] Usage: Concurrent handler execution, performance optimization - [ ] Link: executeParallel.md executeRace - [ ] Signature: (handlers, payload, options) => Promise<ExecutionResult> - [ ] Usage: First successful result, fallback patterns - [ ] Link: executeRace.md Factory Functions   createActionHandler - [ ] Signature: (handler, config?) => 

Key points:
• [ ] **Core Methods**: `registerHandler()`, `dispatch()`, `unregisterHandler()`
• [ ] **Usage**: Pipeline setup, handler priority, execution modes
• [ ] **Link**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md)
• [ ] **Properties**: `actionType`, `context`, `originalError`
• [ ] **Usage**: Error handling, type checking with `isReactActionError()`
• [ ] **Link**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md)
• [ ] **Structure**: `{ actionType: PayloadType }` type mapping
• [ ] **Usage**: Action type definitions, extends pattern
• [ ] **Link**: [`ActionPayloadMap.md`](./core/src/interfaces/ActionPayloadMap.md)
• [ ] **Methods**: `abort()`, `getContext()`, `setResult()`
• [ ] **Usage**: Handler execution control, error handling
• [ ] **Link**: [`PipelineController.md`](./core/src/interfaces/PipelineController.md)
• [ ] **Properties**: `priority`, `id`, `metadata`
• [ ] **Usage**: Handler registration, priority ordering
• [ ] **Link**: [`HandlerConfig.md`](./core/src/interfaces/HandlerConfig.md)
• [ ] **Properties**: Register initialization options
• [ ] **Usage**: ActionRegister configuration, performance tuning
• [ ] **Link**: [`ActionRegisterConfig.md`](./core/src/interfaces/ActionRegisterConfig.md)
• [ ] **Properties**: Dynamic dispatch configuration
• [ ] **Usage**: Per-action behavior overrides
• [ ] **Link**: [`DispatchOptions.md`](./core/src/interfaces/DispatchOptions.md)
• [ ] **Structure**: Success/error status, results collection
• [ ] **Usage**: Action execution outcomes, error handling
• [ ] **Link**: [`ExecutionResult.md`](./core/src/interfaces/ExecutionResult.md)
• [ ] **Methods**: Type-safe action dispatching interface
• [ ] **Usage**: Dispatcher implementation contracts
• [ ] **Link**:...