---
document_id: en_api_interface-specific-todolist
category: api
source_path: en/api/interface-specific-todolist.md
character_limit: 2000
last_update: '2025-09-02T15:04:22.363Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interface Documentation Guide

Interface Documentation Guide Core functionality documentation for TypeDoc generated API references. 📋 Essential Structure Streamlined documentation focusing on functionality, usage patterns, and TypeDoc links. 🎯 @context-action/core Interface Documentation 📚 Classes ActionRegister - [ ] Core Methods: registerHandler(), dispatch(), unregisterHandler() - [ ] Usage: Pipeline setup, handler priority, execution modes - [ ] Link: ActionRegister.md ReactActionError   - [ ] Properties: actionType, context, originalError - [ ] Usage: Error handling, type checking with isReactActionError() - [ ] Link: ReactActionError.md 🔌 Interfaces ActionPayloadMap - [ ] Structure: { actionType: PayloadType } type mapping - [ ] Usage: Action type definitions, extends pattern - [ ] Link: ActionPayloadMap.md PipelineController   - [ ] Methods: abort(), getContext(), setResult() - [ ] Usage: Handler execution control, error handling - [ ] Link: PipelineController.md HandlerConfig - [ ] Properties: priority,

Key points:
• [ ] **Core Methods**: `registerHandler()`, `dispatch()`, `unregisterHandler()`
• [ ] **Usage**: Pipeline setup, handler priority, execution modes
• [ ] **Link**: [`ActionRegister.md`](./core/src/classes/ActionRegister.md)
• [ ] **Properties**: `actionType`, `context`, `originalError`
• [ ] **Usage**: Error handling, type checking with `isReactActionError()`
• [ ] **Link**: [`ReactActionError.md`](./core/src/classes/ReactActionError.md)
• [ ] **Structure**: `{ actionType: PayloadType }` type mapping
• [ ] **Usage**: Action type definitions, extends pattern
• [ ] **Link**:...