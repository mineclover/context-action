---
document_id: guide--domain-context
category: guide
source_path: en/guide/architecture/domain-context.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.299Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Domain Context Architecture

The Context-Action framework implements document-centric context separation for perfect domain isolation and effective artifact management. This is the recommended approach for multi-domain applications and large teams. Key Difference from MVVM Architecture:
- Domain Architecture: Focuses on business domains (User, Product, Order contexts)
- MVVM Architecture: Focuses on architectural layers (Model, ViewModel, View layers)

Both can be combined - use Domain Architecture to separate business concerns, then apply MVVM within each domain for architectural clarity.
