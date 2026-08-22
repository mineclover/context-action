---
document_id: guide--testing-boundaries
category: guide
source_path: en/guide/testing-boundaries.md
character_limit: 1000
last_update: '2026-08-22T11:38:56.361Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Testing Context-Action by Boundary

Testing Context-Action by Boundary Context-Action has a small set of runtime primitives, but they cross several lifecycles: action registration, dispatch, store notification, React provider mounting, and user-visible rendering. Test each responsibility at the boundary that owns it instead of reproducing the same case in every example. Three test layers | Layer | Owner | Verify | Avoid | | --- | --- | ---

Key points:
• If the behavior can be expressed without React, add or update a core test.
• If it depends on provider, hook, or subscription lifetime, add a React
• If it is visible only after composing a route, add a co-located...