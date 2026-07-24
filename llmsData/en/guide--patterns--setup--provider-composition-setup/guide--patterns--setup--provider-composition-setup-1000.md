---
document_id: guide--patterns--setup--provider-composition-setup
category: guide
source_path: en/guide/patterns/setup/provider-composition-setup.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.175Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Provider Composition Setup

Provider Composition Setup Advanced provider composition utilities and patterns for managing multiple contexts in the Context-Action framework. Import Overview The composeProviders utility solves "Provider hell" by composing multiple Provider components into a single, clean component. This is essential for applications using multiple contexts (Store, Action, and RefContext). B

Key points:
• **[Context Splitting Patterns](../architecture/context-splitting.md)** - Uses provider composition
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses layer-based composition
• **[Domain Context...