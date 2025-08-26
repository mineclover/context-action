---
document_id: guide--abort
category: guide
source_path: en/guide/pipeline/abort.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.280Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Abort Mechanisms

Stop pipeline execution when critical conditions are not met or errors occur. Basic Abort

controller.abort()

Stop pipeline execution immediately with an optional reason:

Abort with Context

Provide detailed abort information:

Abort Scenarios

Input Validation Abort

Security Abort

Business Logic Abort

Abort Result Handling

Handling Aborted Dispatch

React Error Boundaries with Abort

Abort vs Throw Error

Use Abort For
- ✅ Business logic violations
- ✅ Validation failures
- ✅ Permission denied
- ✅ Rate limiting
- ✅ Graceful operation termination

Use Throw Error For
- ❌ Unexpected system errors
- ❌ Network failures
- ❌ Programming errors
- ❌ Infrastructure issues

Early Abort Patterns

Guard Handlers

Validation Chain

Live Example: Abortable Search

See a comprehensive abort implementation in the Enhanced Abortable Search Demo:

This example demonstrates automatic search cancellation, component unmount cleanup, and graceful abort handling in real search scenarios. Related

- Priority System - Priority-based execution order  
- Blocking Operations - Control execution flow
- Result Handling - Collect and use abort information
- Dispatch Methods - Handle aborted dispatches.
