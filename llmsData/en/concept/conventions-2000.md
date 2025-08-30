---
document_id: en_concept_conventions
category: concept
source_path: en/concept/conventions.md
character_limit: 2000
last_update: '2025-08-30T10:42:21.675Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

Context-Action Framework Conventions This document defines coding conventions and best practices when using the Context-Action framework with its three core patterns: Actions, Stores, and RefContext. 📋 Table of Contents 1. MVVM Architecture Conventions 2. Naming Conventions 3. File Structure 4. Pattern Usage 5. Type Definitions 6. Code Style 7. Performance Guidelines 8. Error Handling 9. RefContext Conventions --- MVVM Architecture Conventions 🏗️ Core Architecture Pattern Context-Action Framework follows strict MVVM architecture with clear layer separation: - Model Layer: createContext declarations (src/models/) - ViewModel Layer: Custom hooks for behavior injection (src/viewmodels/) - Business Logic Layer: Action handlers for domain rules (src/business/) - View Layer: Pure components consuming ViewModels (src/components/, src/pages/) - Shared Layer: Pure view components with explicit props (src/shared/) 📁 Directory Structure Pattern 🎯 Layer Responsibility Rules ✅ Model Layer - Context Declar

Key points:
• **Model Layer**: `create~Context` declarations (`src/models/`)
• **ViewModel Layer**: Custom hooks for behavior injection (`src/viewmodels/`)
• **Business Logic Layer**: Action handlers for domain rules (`src/business/`)
• **View Layer**: Pure components consuming ViewModels (`src/components/`, `src/pages/`)
• **Shared Layer**: Pure view components with explicit props (`src/shared/`)
• [Pattern Guide](./pattern-guide.md) - Detailed pattern usage guide
• [Full Architecture Guide](./architecture-guide.md) - Complete architecture guide
• [Hooks Reference](./hooks-reference.md) - Hooks reference documentation
•...