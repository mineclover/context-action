---
document_id: guide--wait-then-execute
category: guide
source_path: en/guide/patterns/async/wait-then-execute.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.331Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Wait-Then-Execute Pattern

Pattern for safely executing DOM operations after ensuring element availability. Prerequisites

Required Setup: For complete RefContext setup instructions including type definitions, DOM element refs, and provider configuration, see RefContext Setup. This pattern demonstrates DOM waiting strategies using the setup patterns:
- Type definitions → DOM Element Refs
- Context creation → Basic RefContext Setup
- Provider setup → Provider Setup Patterns
- Advanced usage → Waiting for Multiple Refs

For Store and Action integration, see:
- Basic Store Setup - Store context for state management
- Basic Action Setup - Action context for business logic

Basic Pattern

Advanced Example

Store Integration Pattern

Action Handler Integration

Multi-Element Coordination

Sequential Operations

Best Practices

1. Always Check Element: Verify element exists after waiting (follows RefContext setup patterns)
2.
