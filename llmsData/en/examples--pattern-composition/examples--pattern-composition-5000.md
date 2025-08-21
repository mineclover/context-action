---
document_id: examples--pattern-composition
category: examples
source_path: en/examples/pattern-composition.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.357Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Pattern Composition Example

This example demonstrates how to combine Action Only and Store Only patterns for complex applications with complete separation of concerns following MVVM architecture. Architecture Overview

Complete Application Example

1. Action Type Definitions

2. Store Configuration

3. Create Contexts

4. Action Handler Components

5. System Action Handlers

6. Main Application Component

7. Dashboard Component

8. Modal System

9. Performance Monitor

10. Navigation Component

Key Architecture Benefits

Perfect Separation of Concerns

1. View Layer: Components focus purely on UI rendering and user interaction
2. ViewModel Layer: Action handlers contain all business logic and coordination
3. Model Layer: Stores manage data with reactive updates and computed state

Pattern Composition Benefits

- Action Pattern: Handles complex business logic, API calls, and cross-cutting concerns
- Store Pattern: Manages reactive state with type safety and computed values  
- Clean Integration: Both patterns work together without conflicts or coupling

Type Safety Throughout

Best Practices Demonstrated

1. Handler Organization: Separate handler components for different domains
2. Error Boundaries: Comprehensive error handling with user feedback
3. Performance Monitoring: Built-in performance tracking and optimization
4. State Persistence: Automatic saving and loading of application state
5. Modal Management: Centralized modal system with type-safe data passing
6. Loading States: Granular loading indicators for different operations

Related

- Action Only Pattern - Pure action dispatching examples
- Store Only Pattern - Pure state management examples
- Main Patterns Guide - Pattern selection and architecture
- MVVM Architecture Guide - Architectural principles.
