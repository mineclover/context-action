---
document_id: concept--store-conventions
category: concept
source_path: en/concept/store-conventions.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.340Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Conventions

Store Conventions Complete conventions for Store, TimeTravelStore, and MutableStore patterns in the Context-Action framework. 📋 Table of Contents 1. Store Types Overview 2. Store (Default) 3. TimeTravelStore 4. MutableStore Pattern 5. notifyPath/notifyPaths API 6. Event Loop Control 7. Performance Guidelines 8. Best Practices 9. Business Logic Separation --- Store Types Overview Context-Action Framewo

Key points:
• **Deep Freeze**: Values frozen to prevent accidental mutations
• **Copy-on-Write**: Efficient cloning with version-based caching
• **RAF Batching**: Multiple updates batched into single frame
• **Error Recovery**: Automatic...