---
document_id: en_guide_composition
category: guide
source_path: en/guide/architecture/composition.md
character_limit: 2000
last_update: '2025-08-30T10:42:08.995Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pattern Composition

Pattern Composition For complex applications, compose all three patterns for maximum flexibility and separation of concerns. Overview The Context-Action framework provides three core patterns that can be composed together: - 🎯 Action Only Pattern: Pure action dispatching without stores - 🏪 Store Only Pattern: State management without actions   - 🔧 Ref Context Pattern: Direct DOM manipulation with zero re-renders Complete Composition Example Domain-Based Composition Business + UI Domain Separation Domain-Specific Logic Hooks Architecture Patterns MVVM Architecture Integration Performance Optimization Layer-Specific Optimizations Best Practices 1. Handler Registration (Critical) - Always use useCallback: All action handlers must be wrapped with useCallback to prevent infinite re-registration - Proper Dependencies: Include only necessary dependencies in the dependency array - Avoid Inline Functions: Never pass inline functions directly to action handlers > Important: For detailed handler regi

Key points:
• **🎯 Action Only Pattern**: Pure action dispatching without stores
• **🏪 Store Only Pattern**: State management without actions
• **🔧 Ref Context Pattern**: Direct DOM manipulation with zero re-renders
• **Always use useCallback**: All action handlers must be wrapped with `useCallback` to prevent infinite re-registration
• **Proper Dependencies**: Include only necessary dependencies in the dependency array
• **Avoid Inline Functions**: Never pass inline functions directly to action handlers
• **Start with Store Only** for simple state management
• **Add Action Only** when you need side effects or complex workflows
• **Add...