---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: ko/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 1000
last_update: '2026-07-20T18:50:49.396Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter 결정

PostgreSQL Durable Operation Adapter 결정 이 문서는 durable-operation 계약을 위한 SQL backend 결정을 기록한다. 상태 전이는 tool-calling architecture guide가 소유하고, 이 문서는 선택한 SQL dialect와 adapter 경계만 다룬다. 결정 참조 SQL dialect로 PostgreSQL을 사용하고, @context-action/tool-protocol에는 driver-neutral query client를 주입한다. - createPostgresDurableOperationBackend()가 SQL record mapping과 조건부 CAS

Key points:
• `createPostgresDurableOperationBackend()`가 SQL record mapping과 조건부 CAS 문장을 소유한다.
• package는 `pg`, pool 구현, credential, connection lifecycle에 의존하지 않는다.
• application은...