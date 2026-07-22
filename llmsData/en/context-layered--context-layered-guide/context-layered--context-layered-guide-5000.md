---
document_id: context-layered--context-layered-guide
category: context-layered
source_path: en/context-layered/context-layered-guide.md
character_limit: 5000
last_update: '2026-07-20T10:49:26.184Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Architecture Guide

Context-Layered Architecture Guide A comprehensive architecture pattern for Context-Action framework applications, combining traditional layered architecture principles with React Context patterns and props-based dependency injection. 🎯 Architecture Overview Context-Layered Architecture is a specialized architectural pattern designed for React applications using the Context-Action framework. It provides clear separation of concerns while leveraging React Context for state management and dependency injection. Core Principles 1. Layer Separation: Clear boundaries between different concerns 2. Context Integration: Built around React Context lifecycle 3. Props-based DI: Dependency injection through component props 4. Handler Isolation: Business logic isolated in dedicated handlers 5. Type Safety: Full TypeScript support across all layers 🏗️ Architecture Layers 6-Layer Structure Layer Responsibilities | Layer | Purpose | Key Features | |-------|---------|--------------| | Contexts | Type definitions & context creation | ActionPayloadMap, Store interfaces, Context providers | | Business | Pure domain rules and state transitions | Validation, calculation, event definitions | | Handlers | Business logic with props-based DI | Handler Registry registration, dependency injection | | Actions | Action dispatching & callbacks | dispatch calls, payload mapping, callback creation | | Hooks | Store value subscriptions | useStoreValue, computed values, data transformation | | Views | Pure UI components | Event handling, rendering, user interactions | | MainPage | Registry mounting & composition | Props injection, context setup, component orchestration | Usecase and Recipe Profile The six layers above describe the internal Context-Layered Runtime. When that runtime is connected to a design-system-based product UI, add the Usecase Boundary → Facade → Recipe profile: - Usecase Boundary owns one feature's state and execution contract. - Facade exposes stable commands and a view model while hiding raw dispatch and store managers. - Recipe composes Astryx primitives and maps the view model to controlled props. - Primitive components own visual states, accessibility, and intrinsic interaction. Read the complete convention in Usecase and Recipe Profile. 🔄 Data Flow 1. User Interaction → Action 2. Action → Handler (via Context) 3. Handler → Store Update 4. Store → View Update (Reactive) 🎯 Key Benefits Clear Separation of Concerns Each layer has a single, well-defined responsibility: - Contexts: Data structure definition - Business: Pure domain rules and state transitions - Handlers: Business logic execution - Actions: User action coordination - Hooks: Data access abstraction - Views: UI presentation - MainPage: System composition Props-based Dependency Inject

Key points:
• **Usecase Boundary** owns one feature's state and execution contract.
• **Facade** exposes stable commands and a view model while hiding raw dispatch and store managers.
• **Recipe** composes Astryx primitives and maps the view model to controlled props.
• **Primitive** components own visual states, accessibility, and intrinsic interaction.
• **Contexts**: Data structure definition
• **Business**: Pure domain rules and state transitions
• **Handlers**: Business logic execution
• **Actions**: User action coordination
• **Hooks**: Data access abstraction
• **Views**: UI presentation
• **MainPage**: System composition
• Handler registration within Context boundaries
• Every handler is registered by the domain Handler Registry, including one-handler features
• Automatic lifecycle management
• Type-safe context usage
• Easy to add new features following established patterns
• Clear guidelines for each layer
• Maintainable codebase structure
• [Folder Structure Guide](./architecture/folder-structure.md) - Detailed 6-layer structure
• [Handler Registry](./architecture/handler-registry.md) - ID and priority management
• [Architecture Governance and Evidence](./architecture/architecture-governance.md) - capability, symbol, and evidence contracts
• [Architecture Governance Usage](./architecture/architecture-governance-usage.md) - snapshot, history, diff, and intersection commands
• [ContextScope Symbol Graph](./architecture/context-scope-graph.md) - context grouping over complete symbol snapshots
• [Usecase and Recipe Profile](./usecase-recipe-profile.md) - Facade, Recipe, and design-system boundaries
• [Migration Guide](./migration-guide.md) - Migrate from traditional MVVM to Context-Layered
• [Next Work and Documentation Ownership](./next-work.md) - single backlog and...