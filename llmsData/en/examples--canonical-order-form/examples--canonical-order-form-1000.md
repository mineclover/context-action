---
document_id: examples--canonical-order-form
category: examples
source_path: en/examples/canonical-order-form.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.362Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Canonical Order Form Example

Canonical Order Form Example This example is the recommended implementation-first walkthrough for the repository. It is intentionally small, but complete enough to demonstrate why Context-Layered Architecture improves reliability. If you only read one example to understand the architecture, start with this one. What It Demonstrates - Store Context for persistent draft, validation, submission, and

Key points:
• `Store Context` for persistent draft, validation, submission, and activity state
• `Action Context` for user intent and orchestration
• `Ref Context` for imperative focus management after validation failure
• pure...