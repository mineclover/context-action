---
document_id: context-layered--context-layered-guide
category: context-layered
source_path: en/context-layered/context-layered-guide.md
character_limit: 1000
last_update: '2026-07-20T10:49:26.183Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Architecture Guide

Context-Layered Architecture Guide A comprehensive architecture pattern for Context-Action framework applications, combining traditional layered architecture principles with React Context patterns and props-based dependency injection. 🎯 Architecture Overview Context-Layered Architecture is a specialized architectural pattern designed for React applications using the Context-Action f

Key points:
• **Usecase Boundary** owns one feature's state and execution contract.
• **Facade** exposes stable commands and a view model while hiding raw dispatch and store managers.
• **Recipe** composes Astryx...