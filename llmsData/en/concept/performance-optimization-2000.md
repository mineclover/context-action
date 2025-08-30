---
document_id: en_concept_performance-optimization
category: concept
source_path: en/concept/performance-optimization.md
character_limit: 2000
last_update: '2025-08-30T03:55:10.919Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Optimization Guide

Performance Optimization Guide Filter Caching System The ActionRegister implements an intelligent filter caching system to optimize handler selection performance during dispatch operations. Overview Purpose: Cache handler selection results to avoid redundant filtering operations Scope: Per ActionRegister instance (shared across all components under the same Provider) Safety: Automatic cache invalidation ensures data consistency Cache Architecture Cache Ownership Structure Cache Lifecycle 1. Creation: When ActionRegister instance is created 2. Population: During first filter operation for each unique filter combination 3. Invalidation: Automatic when handlers are registered/removed 4. Cleanup: When Provider unmounts or ActionRegister.destroy() is called What Gets Cached ✅ Cacheable Operations - Handler IDs: { handlerIds: ['auth', 'validation'] } (exact string matching) - Exclusion IDs: { excludeHandlerIds: ['analytics'] } (exact string matching) - Priority ranges: { priority: { min:

Key points:
• **Handler IDs**: `{ handlerIds: ['auth', 'validation'] }` (exact string matching)
• **Exclusion IDs**: `{ excludeHandlerIds: ['analytics'] }` (exact string matching)
• **Priority ranges**: `{ priority: { min: 5, max: 10 } }`
• **Combined conditions**: `{ handlerIds: ['user'], priority: { min: 3 } }`
• **Custom filter functions**: `{ custom: (config) => config.tags?.includes('prod') }`
• **Reason**: Function reference equality cannot be guaranteed across calls
• **Deterministic**: Same filter options always produce same key
• **Order-independent**: `handlerIds` are sorted for consistency
•...