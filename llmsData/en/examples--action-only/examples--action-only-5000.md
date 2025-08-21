---
document_id: examples--action-only
category: examples
source_path: en/examples/action-only.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.353Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Action Only Pattern Example

This example demonstrates the Action Only Pattern for pure action dispatching without state management, ideal for event systems, command patterns, and business logic orchestration. Use Cases

- Event tracking and analytics
- Command patterns and business logic
- Cross-component communication
- Side effects and API calls
- User interaction handling

Complete Example

1. Define Action Types

2. Create Action Context

3. Event Handler Components

4. User Interaction Components

5. API Integration Component

6. Main Application

7. System Monitoring

8. API Testing Component

9. Error Testing Component

Advanced Pipeline Control

Multi-Stage Processing

Handler Composition Patterns

Sequential Processing

Key Benefits

✅ Type Safety: Full TypeScript support with automatic type inference  
✅ Pipeline Control: Advanced control flow with abort, modify, and result management  
✅ Priority Execution: Handlers execute in priority order for predictable behavior  
✅ Error Resilience: Individual handler failures don't stop the entire pipeline  
✅ Automatic Cleanup: React integration handles registration/cleanup automatically  
✅ Lightweight: No state management overhead, focused on action processing

Best Practices

1. Use Handler Components: Create dedicated components for handler registration
2. Priority Planning: Assign priorities based on execution order needs
3. Error Handling: Use controller.abort() for critical failures, return errors for non-critical
4. Payload Enrichment: Use controller.modifyPayload() to add metadata
5. Result Sharing: Use controller.setResult() and getResults() for handler coordination
6. useCallback: Always wrap handlers with useCallback for performance

Related

- Action Pipeline Guide - Comprehensive action pipeline documentation
- ActionRegister API - Core action system
- PipelineController API - Pipeline control methods
- Pattern Composition Example - Combining with Store Pattern.
