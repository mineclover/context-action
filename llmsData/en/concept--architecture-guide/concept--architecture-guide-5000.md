---
document_id: concept--architecture-guide
category: concept
source_path: en/concept/architecture-guide.md
character_limit: 5000
last_update: '2026-07-20T04:39:35.818Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Store Integration Architecture

Context-Action Store Integration Architecture 1. Overview & Core Concepts What is Context-Action Architecture? The Context-Action framework is a revolutionary state management system designed to overcome the fundamental limitations of existing libraries through document-centric context separation and effective artifact management. Project Philosophy The Context-Action framework addresses critical issues in modern state management: Problems with Existing Libraries: - High React Coupling: Tight integration makes component modularization and props handling difficult - Binary State Approach: Simple global/local state dichotomy fails to handle specific scope-based separation   - Inadequate Handler/Trigger Management: Poor support for complex interactions and business logic processing Context-Action's Solution: - Document-Artifact Centered Design: Context separation based on document themes and deliverable management - Perfect Separation of Concerns:    - View design in isolation → Design Context   - Development architecture in isolation → Architecture Context   - Business logic in isolation → Business Context     - Data validation in isolation → Validation Context - Clear Boundaries: Implementation results maintain distinct, well-defined domain boundaries - Effective Document-Artifact Management: State management library that actively supports the relationship between documentation and deliverables Architecture Implementation The framework implements a clean separation of concerns through an MVVM-inspired pattern with four core architectural strategies for complete domain isolation: - Actions handle business logic and coordination (ViewModel layer) via createActionContext - Declarative Store Pattern manages state with domain isolation (Model layer) via createStoreContext - RefContext provides direct DOM manipulation with zero re-renders (Performance layer) via createRefContext - Selective Subscription optimizes performance through strategic subscription management (Optimization layer) - Components render UI (View layer) - Context Boundaries isolate functional domains - Type-Safe Integration through domain-specific hooks Core Architecture Flow Context Separation Strategy Domain-Based Context Architecture - Business Context: Business logic, data processing, and domain rules (Actions + Stores) - UI Context: Screen state, user interactions, and component behavior (Stores + RefContext) - Performance Context: High-performance DOM manipulation and animations (RefContext + Selective Subscription) - Validation Context: Data validation, form processing, and error handling (Actions + Stores) - Design Context: Theme management, styling, layout, and visual states (Stores + RefContext) - Architecture Context: System configuration, infrastructure, and technical decisions (A

Key points:
• **High React Coupling**: Tight integration makes component modularization and props handling difficult
• **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation
• **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing
• **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
• **Perfect Separation of Concerns**:
• **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
• **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables
• **Actions** handle business logic and coordination (ViewModel layer) via `createActionContext`
• **Declarative Store Pattern** manages state with domain isolation (Model layer) via `createStoreContext`
• **RefContext** provides direct DOM manipulation with zero re-renders (Performance layer) via `createRefContext`
• **Selective Subscription** optimizes performance through strategic subscription management (Optimization layer)
• **Components** render UI (View layer)
• **Context Boundaries** isolate functional domains
• **Type-Safe Integration** through domain-specific hooks
• **Business Context**: Business logic, data processing, and domain rules (Actions + Stores)
• **UI Context**: Screen state, user interactions, and component behavior (Stores + RefContext)
• **Performance Context**: High-performance DOM manipulation and animations (RefContext + Selective Subscription)
• **Validation Context**: Data validation, form processing, and error handling (Actions + Stores)
• **Design Context**: Theme management, styling, layout, and visual states (Stores +...