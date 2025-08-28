---
document_id: en_concept_mvvm-core-architecture
category: concept
source_path: en/concept/mvvm-core-architecture.md
character_limit: 1000
last_update: '2025-08-28T07:34:22.266Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action MVVM Core Architecture

Context-Action MVVM Core Architecture Practical MVVM Implementation Guide for Prompt-Based Development 🎯 Architecture Overview Context-Action Framework implements a pure MVVM architecture where: - Model: createContext declarations (Store, Action, Ref) - ViewModel: Custom hooks that inject state and behavior  - View: Components consuming hooks with minimal internal state Core Principle "Declarat

Key points:
• **Model**: `create~Context` declarations (Store, Action, Ref)
• **ViewModel**: Custom hooks that inject state and behavior
• **View**: Components consuming hooks with minimal internal state
• [ ] Create...