---
document_id: en_guide_domain-context
category: guide
source_path: en/guide/architecture/domain-context.md
character_limit: 2000
last_update: '2025-08-30T10:42:09.453Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Domain Context Architecture

Domain Context Architecture The Context-Action framework implements document-centric context separation for perfect domain isolation and effective artifact management. This is the recommended approach for multi-domain applications and large teams. Key Difference from MVVM Architecture: - Domain Architecture: Focuses on business domains (User, Product, Order contexts) - MVVM Architecture: Focuses on architectural layers (Model, ViewModel, View layers) Both can be combined - use Domain Architecture to separate business concerns, then apply MVVM within each domain for architectural clarity. Context Separation Strategy Domain-Based Context Architecture - Business Context: Business logic, data processing, and domain rules - UI Context: Screen state, user interactions, and component behavior - Validation Context: Data validation, form processing, and error handling   - Design Context: Theme management, styling, layout, and visual states - Architecture Context: System configuration, infrastructu

Key points:
• **Domain Architecture**: Focuses on **business domains** (User, Product, Order contexts)
• **MVVM Architecture**: Focuses on **architectural layers** (Model, ViewModel, View layers)
• **Business Context**: Business logic, data processing, and domain rules
• **UI Context**: Screen state, user interactions, and component behavior
• **Validation Context**: Data validation, form processing, and error handling
• **Design Context**: Theme management, styling, layout, and visual states
• **Architecture Context**: System configuration, infrastructure, and technical decisions
• **Design Documentation** → Design Context...