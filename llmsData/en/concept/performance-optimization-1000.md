---
document_id: en_concept_performance-optimization
category: concept
source_path: en/concept/performance-optimization.md
character_limit: 1000
last_update: '2025-08-30T03:55:10.919Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Optimization Guide

Performance Optimization Guide Filter Caching System The ActionRegister implements an intelligent filter caching system to optimize handler selection performance during dispatch operations. Overview Purpose: Cache handler selection results to avoid redundant filtering operations Scope: Per ActionRegister instance (shared across all components under the same Provider) Safety: Automatic cache in

Key points:
• **Handler IDs**: `{ handlerIds: ['auth', 'validation'] }` (exact string matching)
• **Exclusion IDs**: `{ excludeHandlerIds: ['analytics'] }` (exact string matching)
• **Priority ranges**: `{ priority: { min: 5,...