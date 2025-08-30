---
document_id: en_guide_domain-context
category: guide
source_path: en/guide/architecture/domain-context.md
character_limit: 5000
last_update: '2025-08-30T10:42:09.453Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Domain Context Architecture

Domain Context Architecture The Context-Action framework implements document-centric context separation for perfect domain isolation and effective artifact management. This is the recommended approach for multi-domain applications and large teams. Key Difference from MVVM Architecture: - Domain Architecture: Focuses on business domains (User, Product, Order contexts) - MVVM Architecture: Focuses on architectural layers (Model, ViewModel, View layers) Both can be combined - use Domain Architecture to separate business concerns, then apply MVVM within each domain for architectural clarity. Context Separation Strategy Domain-Based Context Architecture - Business Context: Business logic, data processing, and domain rules - UI Context: Screen state, user interactions, and component behavior - Validation Context: Data validation, form processing, and error handling   - Design Context: Theme management, styling, layout, and visual states - Architecture Context: System configuration, infrastructure, and technical decisions Document-Based Context Design Each context is designed to manage its corresponding documentation and deliverables: - Design Documentation → Design Context (themes, component specifications, style guides) - Business Requirements → Business Context (workflows, rules, domain logic) - Architecture Documents → Architecture Context (system design, technical decisions) - Validation Specifications → Validation Context (rules, schemas, error handling) - UI Specifications → UI Context (interactions, state management, user flows) Implementation Patterns Business Context Implementation UI Context Implementation Design Context Implementation Provider Composition Strategies Hierarchical Domain Composition Modular Domain Composition Cross-Domain Communication Controlled Cross-Domain Integration Event-Driven Cross-Domain Communication Advanced Handler & Trigger Management Priority-Based Handler Execution Domain-Specific Trigger System Best Practices 1. Domain Isolation Principles - Clear Boundaries: Each domain should have well-defined responsibilities - Minimal Dependencies: Domains should minimize cross-domain dependencies - Document-Driven: Align context boundaries with documentation domains - Team Ownership: Different teams can own different domain contexts 2. Communication Patterns - Prefer Events: Use event-driven communication over direct dependencies - Controlled Integration: Use integration hooks for necessary cross-domain logic - Performance Layers: Use RefContext for performance-critical cross-domain updates - Type Safety: Maintain type safety across domain boundaries 3. Provider Organization - Hierarchical: Organize providers in dependency order - Modular: Support modular composition for different app configurations - Lazy Loading: Load domain pr

Key points:
• **Domain Architecture**: Focuses on **business domains** (User, Product, Order contexts)
• **MVVM Architecture**: Focuses on **architectural layers** (Model, ViewModel, View layers)
• **Business Context**: Business logic, data processing, and domain rules
• **UI Context**: Screen state, user interactions, and component behavior
• **Validation Context**: Data validation, form processing, and error handling
• **Design Context**: Theme management, styling, layout, and visual states
• **Architecture Context**: System configuration, infrastructure, and technical decisions
• **Design Documentation** → Design Context (themes, component specifications, style guides)
• **Business Requirements** → Business Context (workflows, rules, domain logic)
• **Architecture Documents** → Architecture Context (system design, technical decisions)
• **Validation Specifications** → Validation Context (rules, schemas, error handling)
• **UI Specifications** → UI Context (interactions, state management, user flows)
• **Clear Boundaries**: Each domain should have well-defined responsibilities
• **Minimal Dependencies**: Domains should minimize cross-domain dependencies
• **Document-Driven**: Align context boundaries with documentation domains
• **Team Ownership**: Different teams can own different domain contexts
• **Prefer Events**: Use event-driven communication over direct dependencies
• **Controlled Integration**: Use integration hooks for necessary cross-domain logic
• **Performance Layers**: Use RefContext for performance-critical cross-domain updates
• **Type Safety**: Maintain type safety across domain boundaries
• **Hierarchical**: Organize providers in dependency order
• **Modular**: Support modular composition for different app configurations
• **Lazy Loading**: Load domain providers on-demand
• **Feature...