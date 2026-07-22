---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: ko/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 2000
last_update: '2026-07-20T18:50:49.403Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter 결정

PostgreSQL Durable Operation Adapter 결정 이 문서는 durable-operation 계약을 위한 SQL backend 결정을 기록한다. 상태 전이는 tool-calling architecture guide가 소유하고, 이 문서는 선택한 SQL dialect와 adapter 경계만 다룬다. 결정 참조 SQL dialect로 PostgreSQL을 사용하고, @context-action/tool-protocol에는 driver-neutral query client를 주입한다. - createPostgresDurableOperationBackend()가 SQL record mapping과 조건부 CAS 문장을 소유한다. - package는 pg, pool 구현, credential, connection lifecycle에 의존하지 않는다. - application은 query(text, values) client를 주입하고, export된 POSTGRESDURABLEOPERATIONSCHEMASQL migration을 자체 migration 시스템으로 실행한다. - 기존 createDurableOperationStore()가 유일한 state machine이며 PostgreSQL은 record 저장과 조건부 write 경계만 담당한다. 이는 저장소의 참조 결정이며 production database가 이미 확정됐다는 의미는 아니다. 운영 검증으로 인정하려면 실제 PostgreSQL service에서 adapter를 실행해야 한다. 동시성과 isolation 계약 backend CAS는 각각 하나의 PostgreSQL 문장이다. - 신규 record: INSERT ... ON CONFLICT DO NOTHING - revision 전이: UPDATE ... WHERE operationkey = $1 AND revision = $n - prune: DELETE

Key points:
• `createPostgresDurableOperationBackend()`가 SQL record mapping과 조건부 CAS 문장을 소유한다.
• package는 `pg`, pool 구현, credential, connection lifecycle에 의존하지 않는다.
• application은 `query(text, values)` client를 주입하고, export된
• 기존 `createDurableOperationStore()`가 유일한 state machine이며 PostgreSQL은 record 저장과
• 신규 record: `INSERT ... ON CONFLICT DO NOTHING`
• revision 전이: `UPDATE ... WHERE operation_key = $1 AND revision = $n`
• prune: `DELETE ... WHERE operation_key = $1 AND revision = $2`
• service가 실제 사용하는 `pg`/pool wrapper
• 격리 database에 적용한 versioned migration
• 별도 connection에서 실행하는...