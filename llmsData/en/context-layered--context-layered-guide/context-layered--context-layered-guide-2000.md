---
document_id: context-layered--context-layered-guide
category: context-layered
source_path: en/context-layered/context-layered-guide.md
character_limit: 2000
last_update: '2026-07-20T10:49:26.183Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Architecture Guide

Context-Layered Architecture Guide A comprehensive architecture pattern for Context-Action framework applications, combining traditional layered architecture principles with React Context patterns and props-based dependency injection. 🎯 Architecture Overview Context-Layered Architecture is a specialized architectural pattern designed for React applications using the Context-Action framework. It provides clear separation of concerns while leveraging React Context for state management and dependency injection. Core Principles 1. Layer Separation: Clear boundaries between different concerns 2. Context Integration: Built around React Context lifecycle 3. Props-based DI: Dependency injection through component props 4. Handler Isolation: Business logic isolated in dedicated handlers 5. Type Safety: Full TypeScript support across all layers 🏗️ Architecture Layers 6-Layer Structure Layer Responsibilities | Layer | Purpose | Key Features | |-------|---------|--------------| | Co

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
•...