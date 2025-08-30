---
document_id: en_guide_composition
category: guide
source_path: en/guide/architecture/composition.md
character_limit: 1000
last_update: '2025-08-30T10:42:08.995Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pattern Composition

Pattern Composition For complex applications, compose all three patterns for maximum flexibility and separation of concerns. Overview The Context-Action framework provides three core patterns that can be composed together: - 🎯 Action Only Pattern: Pure action dispatching without stores - 🏪 Store Only Pattern: State management without actions   - 🔧 Ref Context Pattern: Direct DOM manipulation with zero

Key points:
• **🎯 Action Only Pattern**: Pure action dispatching without stores
• **🏪 Store Only Pattern**: State management without actions
• **🔧 Ref Context Pattern**: Direct DOM manipulation with zero re-renders
• **Always use...