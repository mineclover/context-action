---
document_id: en_concept_mvvm-core-architecture
category: concept
source_path: en/concept/mvvm-core-architecture.md
character_limit: 2000
last_update: '2025-08-28T07:34:22.267Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action MVVM Core Architecture

Context-Action MVVM Core Architecture Practical MVVM Implementation Guide for Prompt-Based Development 🎯 Architecture Overview Context-Action Framework implements a pure MVVM architecture where: - Model: createContext declarations (Store, Action, Ref) - ViewModel: Custom hooks that inject state and behavior  - View: Components consuming hooks with minimal internal state Core Principle "Declarative Context Definition + Hook-Based Injection = Pure MVVM" --- 📐 Three-Layer Architecture 🏗️ Model Layer: Context Declarations Role: Pre-define business logic, state management, and DOM references declaratively 🔗 ViewModel Layer: Hook-Based Injection & Composition Role: Create focused hooks for state and behavior, then compose them for complex page needs 🎨 View Layer: Pure Component Consumption with Hook Composition Role: Components consume composed ViewModel hooks tailored for their specific needs --- 🏢 Business Logic Layer: Action Handlers Role: Implement business logic separately from 

Key points:
• **Model**: `create~Context` declarations (Store, Action, Ref)
• **ViewModel**: Custom hooks that inject state and behavior
• **View**: Components consuming hooks with minimal internal state
• [ ] Create `~StoreContext` for state management
• [ ] Create `~ActionContext` for business actions
• [ ] Create `~RefContext` for DOM manipulation
• [ ] Export providers and hooks with domain-specific naming
• [ ] Create focused hooks first:
• [ ] Create composed hooks for pages:
• [ ] Keep hooks pure and focused on single responsibilities
• [ ] Enable hook composition for complex page requirements
• [ ] Return...