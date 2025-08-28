---
document_id: en_concept_mvvm-core-architecture
category: concept
source_path: en/concept/mvvm-core-architecture.md
character_limit: 5000
last_update: '2025-08-28T07:34:22.267Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action MVVM Core Architecture

Context-Action MVVM Core Architecture Practical MVVM Implementation Guide for Prompt-Based Development 🎯 Architecture Overview Context-Action Framework implements a pure MVVM architecture where: - Model: createContext declarations (Store, Action, Ref) - ViewModel: Custom hooks that inject state and behavior  - View: Components consuming hooks with minimal internal state Core Principle "Declarative Context Definition + Hook-Based Injection = Pure MVVM" --- 📐 Three-Layer Architecture 🏗️ Model Layer: Context Declarations Role: Pre-define business logic, state management, and DOM references declaratively 🔗 ViewModel Layer: Hook-Based Injection & Composition Role: Create focused hooks for state and behavior, then compose them for complex page needs 🎨 View Layer: Pure Component Consumption with Hook Composition Role: Components consume composed ViewModel hooks tailored for their specific needs --- 🏢 Business Logic Layer: Action Handlers Role: Implement business logic separately from UI through action handlers --- 🎭 Shared Components: Smart Widget Pattern Role: Handle complexity through Context-Action while maintaining reusability 📦 Simple Shared Components: Pure View 🧩 Smart Widget Pattern --- 🏗️ App Architecture: Provider Composition Role: Compose all contexts and business logic at the app level --- 📋 Implementation Checklist ✅ Model Layer (src/models/) - [ ] Create StoreContext for state management - [ ] Create ActionContext for business actions   - [ ] Create RefContext for DOM manipulation - [ ] Export providers and hooks with domain-specific naming ✅ ViewModel Layer (src/viewmodels/) - [ ] Create focused hooks first:   - [ ] State-only hooks (useUserState, useProductData)   - [ ] Actions-only hooks (useUserActions, useProductActions)   - [ ] Events-only hooks (useUserEvents, useFormEvents) - [ ] Create composed hooks for pages:   - [ ] Page-specific hooks (useUserProfilePage, useSettingsPage)   - [ ] Feature-specific hooks (useSearchFeature, useAdminFeature) - [ ] Keep hooks pure and focused on single responsibilities - [ ] Enable hook composition for complex page requirements - [ ] Return only what views need (no internal logic exposure) ✅ Business Logic Layer (src/business/) - [ ] Implement useActionHandler for business rules - [ ] Keep business logic separate from UI concerns - [ ] Handle validation, API calls, and side effects - [ ] Manage cross-store coordination ✅ View Layer (src/components/, src/pages/) - [ ] Consume ViewModel hooks only - [ ] Minimize internal state (prefer injected state) - [ ] Focus on pure rendering and user interactions - [ ] Delegate all logic to ViewModel layer ✅ Shared Components (src/shared/) - [ ] Decide component complexity:   - [ ] Simple components: Pure props, no hooks (Button, Input, Card)   - [ ] Sm

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
• [ ] Return only what views need (no internal logic exposure)
• [ ] Implement `useActionHandler` for business rules
• [ ] Keep business logic separate from UI concerns
• [ ] Handle validation, API calls, and side effects
• [ ] Manage cross-store coordination
• [ ] Consume ViewModel hooks only
• [ ] Minimize internal state (prefer injected state)
• [ ] Focus on pure rendering and user interactions
• [ ] Delegate all logic to ViewModel layer
• [ ] Decide component complexity:
• [ ] For simple components:
• [ ] For smart widgets:
• ❌ Never use `dispatch` or `useEffect` in components
• ❌ Never consume Context-Action directly in components
• ✅ Only consume custom hooks
• ✅ Focus purely on rendering
• ✅ All logic, effects, and dispatch calls in hooks
• ✅ Compose hooks for complex requirements
• ✅ Return only what components need
• **Model**: What data and capabilities exist
• **ViewModel**: How to use them in views
• **View**: What users see and interact with
• **Business**: Why and when things happen
• **Shared**: How to display information consistently
• **Model-First**: Define capabilities before implementation
• **Hook-Injection**: Consistent behavior patterns across all views
• **Pure Views**:...