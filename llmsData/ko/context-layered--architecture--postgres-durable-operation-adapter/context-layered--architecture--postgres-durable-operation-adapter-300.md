---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: ko/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 300
last_update: '2026-11-20T08:50:10.720Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter 결정

PostgreSQL Durable Operation Adapter 결정 이 문서는 durable-operation 계약을 위한 SQL backend 결정을 기록한다. 상태 전이는 tool-calling architecture guide가 소유하고, 이 문서는 선택한 S

Key points:
• `createPostgresDurableOperationBackend()`가 SQL record mapping과 조건부 CAS 문장을 소유한다.
•...