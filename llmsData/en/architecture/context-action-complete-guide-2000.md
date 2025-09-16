---
document_id: en_architecture_context-action-complete-guide
category: architecture
source_path: en/architecture/context-action-complete-guide.md
character_limit: 2000
last_update: '2025-09-16T15:13:22.680Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework: Complete Implementation Guide

Context-Action Framework: Complete Implementation Guide A comprehensive implementation guide with practical patterns, folder structures, and development conventions for the Context-Action Framework. > For architectural principles and philosophy, see Context-Driven Architecture 📋 Table of Contents 1. Implementation Overview 2. Atomic Context Architecture 3. 5-Layer Architecture 4. Implementation Patterns 5. Sub-features Organization 6. Development Conventions 7. Quality & Performance --- Implementation Overview This guide provides concrete implementation patterns for the Context-Action Framework with the new 5-Layer Hook Architecture: ✅ Core Implementation Concepts - Atomic Context Structure - Each context as independent top-level folder - 5-Layer Hook Architecture - Specialized hook layers with single responsibilities - Delayed Evaluation Pattern - Handlers get latest values through store.getValue() - Selective Subscription Model - UI-focused selective state subscri

Key points:
• **Atomic Context Structure** - Each context as independent top-level folder
• **5-Layer Hook Architecture** - Specialized hook layers with single responsibilities
• **Delayed Evaluation Pattern** - Handlers get latest values through `store.getValue()`
• **Selective Subscription Model** - UI-focused selective state subscriptions
• **Execution State Observability** - Advanced patterns with useRef + useState + currying
• **Single-Layer Default** - Most contexts use flat structure within each layer
• **Hierarchical Organization** - Use `features/` only for large-scale...