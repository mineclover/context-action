# PostgreSQL Durable Operation Adapter 결정

이 문서는 durable-operation 계약을 위한 SQL backend 결정을 기록한다. 상태 전이는
tool-calling architecture guide가 소유하고, 이 문서는 선택한 SQL dialect와 adapter
경계만 다룬다.

## 결정

참조 SQL dialect로 PostgreSQL을 사용하고, `@context-action/tool-durable-operations`에는
driver-neutral query client를 주입한다.

- `createPostgresDurableOperationBackend()`가 SQL record mapping과 조건부 CAS 문장을 소유한다.
- package는 `pg`, pool 구현, credential, connection lifecycle에 의존하지 않는다.
- application은 `query(text, values)` client를 주입하고, export된
  `POSTGRES_DURABLE_OPERATION_SCHEMA_SQL` 또는
  `createPostgresDurableOperationSchemaSql(tableName)` migration을 자체 migration 시스템으로 실행한다.
- 기존 `createDurableOperationStore()`가 유일한 state machine이며 PostgreSQL은 record 저장과
  조건부 write 경계만 담당한다.

이는 저장소의 참조 결정이며 production database가 이미 확정됐다는 의미는 아니다. 운영
검증으로 인정하려면 실제 PostgreSQL service에서 adapter를 실행해야 한다.

## 동시성과 isolation 계약

backend CAS는 각각 하나의 PostgreSQL 문장이다.

- 신규 record: `INSERT ... ON CONFLICT DO NOTHING`
- revision 전이: `UPDATE ... WHERE operation_key = $1 AND revision = $n`
- prune: `DELETE ... WHERE operation_key = $1 AND revision = $2`

PostgreSQL 기본 `READ COMMITTED` isolation에서 unique-key와 row lock이 조건부 write를
atomic하게 만들므로 안전하다. Adapter는 read/CAS retry loop를 가로질러 transaction을
열어두지 않는다. application은 pool 또는 transaction wrapper를 observability 목적으로
사용할 수 있지만 조건절을 약화하거나 서로 무관한 작업을 하나의 connection transaction으로
묶으면 안 된다.

이 adapter는 외부 mutation의 exactly-once 실행을 보장하지 않는다. durable operation record를
조정할 뿐이며 provider는 별도의 idempotency 또는 inbox/outbox 경계를 가져야 한다.

## Schema와 migration 소유권

migration은 application-owned migration에서 실행할 수 있도록 string으로 export한다.

```ts
import {
  POSTGRES_DURABLE_OPERATION_SCHEMA_SQL,
} from '@context-action/tool-durable-operations';

await db.query(POSTGRES_DURABLE_OPERATION_SCHEMA_SQL);
```

Adapter가 migration을 자동 실행하지 않는다. Production schema 변경은 host의 일반적인
database migration 절차로 versioning·review·rollback해야 한다. application과 environment별로
table 또는 prefix를 분리한다.

## 검증 경계

저장소 테스트는 structural fake query client를 사용해 parameterized SQL shape, insert/update/delete
CAS, keyset pagination, lease reclaim, replay, retention prune을 검증한다. 실제 PostgreSQL
server, network, TLS, pool, migration, failover 설정은 증명하지 않는다.

Production 도입 전에는 다음을 포함한 opt-in integration fixture를 추가한다.

1. service가 실제 사용하는 `pg`/pool wrapper (repository smoke command는 `pg`가 설치된
   host에서 `pnpm tool-durable:verify:postgres`)
2. 격리 database에 적용한 versioned migration
3. 별도 connection에서 실행하는 동시 claim
4. lease reclaim, unknown reconciliation, replay, bounded prune
5. PostgreSQL version, isolation setting, 담당자, rollback 증거

배포 증거는 이 결정 문서가 아니라 [durable operation runbook](./durable-operation-operations.md)에
기록한다.
