---
document_id: context-layered--migration-guide
category: context-layered
source_path: en/context-layered/migration-guide.md
character_limit: 2000
last_update: '2026-07-20T23:30:19.158Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Migration Guide: MVVM to Context-Layered Architecture

Migration Guide: MVVM to Context-Layered Architecture A comprehensive guide for migrating from traditional MVVM patterns to the advanced Context-Layered Architecture. 🎯 Migration Overview Context-Layered Architecture is an evolution of traditional MVVM patterns, specifically designed for real-world React applications using the Context-Action framework. It provides more practical, maintainable, and scalable solutions. Key Differences | Aspect | Traditional MVVM | Context-Layered | |--------|------------------|-----------------| | Focus | Conceptual layers (Model/View/ViewModel) | Practical implementation layers | | Structure | 4 layers (Model/View/ViewModel/Performance) | 6 layers (contexts/handlers/actions/hooks/views/MainPage) | | Business Logic | Mixed across ViewModel | Isolated in handlers with props-based DI | | Dependency Management | Context-based only | Props-based dependency injection | | Handler Registration | Component-level | Centralized with registry pattern | | Te

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
• [ ]...