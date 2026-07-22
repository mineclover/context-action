---
document_id: context-layered--migration-guide
category: context-layered
source_path: en/context-layered/migration-guide.md
character_limit: 5000
last_update: '2026-07-20T23:30:19.158Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Migration Guide: MVVM to Context-Layered Architecture

Migration Guide: MVVM to Context-Layered Architecture A comprehensive guide for migrating from traditional MVVM patterns to the advanced Context-Layered Architecture. 🎯 Migration Overview Context-Layered Architecture is an evolution of traditional MVVM patterns, specifically designed for real-world React applications using the Context-Action framework. It provides more practical, maintainable, and scalable solutions. Key Differences | Aspect | Traditional MVVM | Context-Layered | |--------|------------------|-----------------| | Focus | Conceptual layers (Model/View/ViewModel) | Practical implementation layers | | Structure | 4 layers (Model/View/ViewModel/Performance) | 6 layers (contexts/handlers/actions/hooks/views/MainPage) | | Business Logic | Mixed across ViewModel | Isolated in handlers with props-based DI | | Dependency Management | Context-based only | Props-based dependency injection | | Handler Registration | Component-level | Centralized with registry pattern | | Testing | Component-focused | Layer-focused with mock injection | Current package-boundary migration The tool protocol is now a separate framework-neutral package. Install it only when action schemas or MCP/provider adapters are needed: Import defineAction, createActionSchema, listAllTools, and protocol types from @context-action/tool-protocol. @context-action/react owns createToolContext and React hooks; @context-action/core owns the action runtime. The old Core and React re-exports are removed. Durable mutation recovery is intentionally a separate optional package. Add @context-action/tool-durable-operations when the application needs durable operation records, cross-process claims, or HTTP/queue side-effect adapters; it is not required for provider-neutral schemas and discovery. The action context factory now requires an explicit context name: For a void action, dispatch options are the second argument so payload and options cannot be confused: @context-action/react supports React 18 and 19 through the same runtime and the react18 entry point is a compatibility path, not a separate runtime. The maintained @context-action/mutative-core / @context-action/mutative fork remains the immutable runtime contract; synchronize upstream changes via its UPSTREAM.md record. 🚀 Migration Strategy Phase 1: Structure Reorganization Before: Traditional MVVM Structure After: Context-Layered Structure Phase 2: Code Migration Patterns 1. Context Definition Migration Before (MVVM Model Layer): After (Context-Layered): 2. Business Logic Migration Before (MVVM ViewModel): After (Context-Layered Handlers): 3. Data Access Migration Before (Direct store access): After (Layered hooks): 4. Integration Point Migration Before (MVVM composition): After (Context-Layered composition): 📋 Migration Che

Key points:
• [ ] Analyze current MVVM structure
• [ ] Identify business logic scattered across components
• [ ] List external dependencies (APIs, services, utilities)
• [ ] Document current handler registration patterns
• [ ] Create new folder structure (contexts/handlers/actions/hooks/views)
• [ ] Set up handler registry with ID/priority management
• [ ] Define TypeScript interfaces for all layers
• [ ] Migrate context definitions to new structure
• [ ] Extract business logic into handlers with props-based DI
• [ ] Create action dispatch hooks
• [ ] Create data subscription hooks
• [ ] Refactor view components to use new hooks
• [ ] Update main page components to mount the Handler Registry
• [ ] Add proper error handling and logging
• [ ] Set up testing infrastructure for new layers
• [ ] Update documentation and team guidelines
• [ ] Run existing tests and fix failures
• [ ] Add new layer-specific tests
• [ ] Performance testing and optimization
• [ ] Code review and team feedback
• **Clear separation of concerns** across 6 distinct layers
• **Testable business logic** with dependency injection
• **Consistent patterns** across the entire application
• **Modular architecture** that scales with team size
• **Reusable handlers** across different modules
• **Centralized configuration** through registry pattern
• **TypeScript support** throughout all layers
• **Clear debugging** with isolated components
• **Faster development** with established patterns
• [Context-Layered Architecture Guide](./context-layered-guide.md)
• [Folder Structure Guide](./architecture/folder-structure.md)
• [Props-based Handler Patterns](./patterns/props-based-handlers.md)
• [Handler Registry Pattern](./architecture/handler-registry.md)
• [Traditional MVVM...