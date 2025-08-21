---
document_id: guide--action-handlers
category: guide
source_path: en/guide/action-handlers.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.359Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Handlers

Action handlers contain the business logic of your application. Learn how to implement, register, and manage handlers effectively for scalable, maintainable applications. Handler Implementation Pattern

Best Practice: useActionHandler Pattern

The recommended pattern for handler registration uses useActionHandler + useEffect for optimal performance and proper cleanup:

Handler Configuration Options

Handler Execution Flow

1. Sequential Mode (default): Handlers run in priority order
2. Parallel Mode: All handlers execute simultaneously
3. Race Mode: First handler to complete wins

Controller Methods

The controller provides methods to manage handler execution flow:

Advanced Handler Patterns

Error Handling

Validation Handlers

Side Effects Handlers

Result Collection

Collect results from multiple handlers:

Handler Organization Patterns

Domain-Specific Handler Files

Handler Composition

Testing Handlers

Unit Testing

Performance Considerations

Handler Optimization

Lazy Loading

Common Handler Anti-Patterns

❌ Missing Cleanup

❌ Stale Closures

❌ Missing Error Handling

Summary

Effective action handler implementation requires:

- Proper Registration: Use useActionHandler + useEffect pattern
- Memory Management: Always return cleanup functions
- Error Handling: Robust error handling with meaningful messages
- Performance: Stable handlers with useCallback
- Testing: Isolated unit tests for business logic
- Organization: Domain-specific handler files

Action handlers are the heart of your business logic - implement them correctly for maintainable, scalable applications. ---

::: tip Next Steps
- Learn Store Management for effective state handling
- Explore Cross-Domain Integration for multi-domain handlers
- See Testing Guide for comprehensive handler testing strategies
:::.
