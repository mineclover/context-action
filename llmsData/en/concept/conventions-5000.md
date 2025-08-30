---
document_id: en_concept_conventions
category: concept
source_path: en/concept/conventions.md
character_limit: 5000
last_update: '2025-08-30T10:42:21.676Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

Context-Action Framework Conventions This document defines coding conventions and best practices when using the Context-Action framework with its three core patterns: Actions, Stores, and RefContext. 📋 Table of Contents 1. MVVM Architecture Conventions 2. Naming Conventions 3. File Structure 4. Pattern Usage 5. Type Definitions 6. Code Style 7. Performance Guidelines 8. Error Handling 9. RefContext Conventions --- MVVM Architecture Conventions 🏗️ Core Architecture Pattern Context-Action Framework follows strict MVVM architecture with clear layer separation: - Model Layer: createContext declarations (src/models/) - ViewModel Layer: Custom hooks for behavior injection (src/viewmodels/) - Business Logic Layer: Action handlers for domain rules (src/business/) - View Layer: Pure components consuming ViewModels (src/components/, src/pages/) - Shared Layer: Pure view components with explicit props (src/shared/) 📁 Directory Structure Pattern 🎯 Layer Responsibility Rules ✅ Model Layer - Context Declarations Only ✅ ViewModel Layer - Behavior Injection Only ✅ Business Logic Layer - Domain Rules Only   ✅ View Layer - ViewModel Consumption Only ✅ Shared Layer - Pure View Only --- Naming Conventions 🏷️ Renaming Pattern The core convention of the Context-Action framework is domain-based renaming pattern for all three patterns. ✅ Store Pattern Renaming ✅ Action Pattern Renaming ✅ RefContext Pattern Renaming 🎯 Context Naming Rules Domain-Based Naming Action vs Store vs RefContext Distinction 🔤 Hook Naming Patterns Store Hook Naming Action Hook Naming RefContext Hook Naming --- File Structure 📁 MVVM Directory Structure (Recommended) 📁 Legacy Directory Structure (Migration Reference) 📄 MVVM File Naming Conventions Model Layer Files (src/models/) ViewModel Layer Files (src/viewmodels/) Business Logic Layer Files (src/business/) View Layer Files (src/components/, src/pages/) Shared Layer Files (src/shared/) --- Pattern Usage 🎯 Pattern Selection Guide Store Only Pattern Action Only Pattern   RefContext Only Pattern Pattern Composition 🔄 Provider Composition Patterns ✅ Context Separation Pattern (MVVM Requirement) 🎯 Context Separation Rules Rule 1: Provider Hierarchy for Context Isolation Rule 2: Hook Isolation Pattern Rule 3: Business Logic Isolation composeProviders Utility (Recommended) withProvider HOC Pattern (Convenience) Manual Provider Composition --- Type Definitions 🏷️ Interface Naming Action Payload Map Store Data Interface RefContext Type Interface 🎯 Generic Type Usage --- Code Style ✨ Component Patterns Store Usage Pattern Action Handler Pattern RefContext Usage Pattern 🎨 Import Organization --- Performance Guidelines ⚡ Store Optimization Comparison Strategy Selection Memoization Patterns 🔄 Action Optimization Debounce/Throttle Configuration ⚡ RefContext

Key points:
• **Model Layer**: `create~Context` declarations (`src/models/`)
• **ViewModel Layer**: Custom hooks for behavior injection (`src/viewmodels/`)
• **Business Logic Layer**: Action handlers for domain rules (`src/business/`)
• **View Layer**: Pure components consuming ViewModels (`src/components/`, `src/pages/`)
• **Shared Layer**: Pure view components with explicit props (`src/shared/`)
• [Pattern Guide](./pattern-guide.md) - Detailed pattern usage guide
• [Full Architecture Guide](./architecture-guide.md) - Complete architecture guide
• [Hooks Reference](./hooks-reference.md) - Hooks reference documentation
• [API Reference](../../api/) - API documentation
• [Basic Example](../../../example/) - Basic usage examples
• [Advanced Patterns](../../examples/) - Advanced pattern examples
• [Legacy Pattern Migration](./pattern-guide.md#migration-guide) - Migration from legacy patterns
• **Store Only**: Pure state management (forms, settings, cache)
• **Action Only**: Pure event handling (logging, tracking, notifications)
• **RefContext Only**: High-performance DOM manipulation (animations, real-time interactions)
• **Composition**: Complex business logic requiring multiple patterns (user management, interactive shopping cart)
• **Type inference (recommended)**: For most cases, code is concise and type safety is guaranteed
• **Explicit generics**: For complex type structures or strict type constraints
• **Use RefContext when**: Direct DOM manipulation needed, 60fps performance required, zero re-renders critical
• **Use regular state when**: Data needs to be displayed in UI, component re-rendering is acceptable
• **Combine both when**: Performance-critical operations alongside data display (e.g., real-time charts)
• **[MVVM Core Architecture](./mvvm-core-architecture.md)** - Complete MVVM...