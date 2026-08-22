# Durable Operation 운영 Runbook

> **개발 트랙 상태:** 이 runbook은 진행 중인 Durable 0.2 작업을 설명합니다.
> Core 1.1 / React 3 상태 관리 릴리즈의 선행 조건이 아니며, 해당 React artifact는
> 의도적으로 `@context-action/react/tools`를 출하하지 않습니다.

이 문서는 [Tool-calling editor architecture guide](../../concept/tool-calling-editor-architecture.md)의
의미론적 계약을 실제 Redis·PostgreSQL 배포 검증과 `@context-action/react/tools` recovery 경계에
적용하기 위한 운영 문서다.

위 guide가 semantic SSOT다. 이 페이지에는 배포·장애·resolver 운영 절차만 두며,
package README가 durable state machine을 다시 복사하지 않고 이 문서로 연결하도록
한다.

## 경계와 사전 조건

- `@context-action/tool-durable-operations`가 durable-operation 상태 머신과 Redis/PostgreSQL backend를 소유한다.
- `@context-action/react/tools`가 `ToolContext`와
  `getOperationStatus()`/`recoverOperation()` registry surface를 소유한다.
- 애플리케이션이 domain status query, compensation 결정, downstream
  idempotency/outbox 동작을 소유한다.
- mutation을 실행할 수 있는 모든 process에서 Redis에 접근할 수 있어야 한다.
  staging/production에서는 TLS URL과 ACL user를 사용하고 credential을 로그에
  출력하지 않는다.

## 배포 검증

배포가 실제 사용하는 Redis endpoint에 public API smoke check를 실행한다. 명령은
고유한 key prefix를 만들고 종료 시 자신의 record를 정리한다.

```bash
REDIS_URL=rediss://user:password@redis.example.internal:6380 \
  pnpm tool-durable:verify:redis
```

출력에서 다음 검사가 모두 `status: "ok"` 안에 포함되어야 한다.

- 두 store instance 간 atomic claim
- 두 번째 owner 없이 completed result replay
- full fence 검증을 거친 `unknown` record resolution
- reconciliation 전 stale fence 거부
- lease 만료 후 두 번째 owner의 reclaim
- prune/recreate 이후 과거 incarnation의 ABA 전이 거부
- terminal record retention prune

host만 포함하는 JSON 결과에는 Redis server version도 기록된다. PostgreSQL smoke
결과에는 server version과 실제 transaction isolation도 기록된다. 이 값들은
connection URL이나 credential을 포함하지 않고 protected evidence record에 남긴다.

두 번째 gate로 전체 integration suite도 실행한다. 이 suite는 8개 동시 owner,
lease 만료/reclaim, recovery, bounded retention cleanup을 검증한다.

```bash
REDIS_URL=rediss://user:password@redis.example.internal:6380 \
  pnpm --filter @context-action/tool-durable-operations test
```

repository CI는 Redis 7로 smoke command와 이 suite를 실행한다. 다만 TLS, ACL
권한, failover, 실제 latency와 연결성은 CI가 증명할 수 없는 배포 속성이므로
staging 또는 production endpoint에서도 별도로 통과시켜야 한다.

### 검증 증거 기록

대상 환경마다 짧은 evidence record를 하나씩 남긴다. 로컬 Redis 7 컨테이너는 계약을
재현하는 데 유용하지만 staging/production gate를 충족하지는 않는다.

| 항목 | 필수 값 |
| --- | --- |
| 환경 | `local`, `staging`, `production` 중 하나 |
| Commit | 애플리케이션의 정확한 commit SHA |
| Redis version | 운영자에게 안전한 version 확인 결과의 major/minor |
| Endpoint | hostname/port만 기록하고 full URL·credential은 기록하지 않음 |
| Smoke | 실행 시각과 `status: "ok"` |
| Integration | 실행 시각과 passed/skipped 개수 |
| Operator | 담당자 또는 automation run ID |
| Rollback | 승인된 application/backend rollback 판단 |

repository CI workflow는 GitHub-hosted Redis 7과 PostgreSQL 16 service container에서
smoke와 integration 검증을 실행한다. 이것은 repository 계약을 검증하는 경로이지,
production endpoint의 TLS·ACL·failover·latency·migration·rollback 속성을 증명하는
배포 증거는 아니다. Host deployment pipeline이 선택적으로
`context-action/durable-operation-verification@1` record를 만들 때에는 허용된
host/version/isolation/check 필드만 남기고 원본 log와 credential을 제외해야 한다.

저장소에는 이 record를 만드는 결정적 writer가 포함되어 있다. raw command log
(`preflight.log`, `redis.log`, `integration.log`, `postgres.log`, `queue.log`) 디렉터리와
환경 메타데이터만 전달하면 endpoint credential을 redaction하고 host/version/isolation/check
필드만 남긴다.

```bash
TARGET_ENVIRONMENT=staging \
COMMIT_SHA="$GITHUB_SHA" \
RUN_ID="$GITHUB_RUN_ID" \
OPERATOR=durable-operations-ci \
PREFLIGHT_RESULT=success \
REDIS_RESULT=success \
INTEGRATION_RESULT=success \
POSTGRES_RESULT=success \
QUEUE_RESULT=success \
  pnpm tool-durable:write:evidence \
    -- --input reports/durable-operation/raw \
    --output reports/durable-operation/evidence

pnpm tool-durable:verify:evidence \
  -- --file reports/durable-operation/evidence/evidence.json

# 배포 gate: 모든 check가 존재하고 성공했는지 확인
pnpm tool-durable:verify:evidence:complete \
  -- --file reports/durable-operation/evidence/evidence.json
```

일반 verifier는 schema 형태만 확인한다. `:complete` gate는 누락·unknown·skipped·failed
check도 거부하므로 배포 마지막 gate로 사용한다. 생성된 JSON/Markdown은 deployment evidence
artifact이며 provider admission checklist나 실제 production endpoint 검증을 대신하지 않는다.

## PostgreSQL 배포 검증

PostgreSQL adapter는 driver-neutral이며 `pg`를 포함하거나 migration을 자동 실행하지 않는다.
Host service가 versioned `POSTGRES_DURABLE_OPERATION_SCHEMA_SQL` migration을 일반 migration
시스템으로 적용하고, production pool의 `query(text, values)` surface를 주입한 뒤, 배포에서
사용하는 정확한 database version에 대해 격리된 integration fixture를 실행해야 한다.

Fixture는 별도 connection에서의 동시 claim, lease reclaim, completed replay, unknown
reconciliation, full-fence prune, 설정된 isolation level을 증명해야 한다. Fake query client나
local-only test는 production 증거가 아니다. PostgreSQL version, credential을 제외한 DB host,
migration revision, pool/owner, isolation setting, test output, rollback 판단을 보호된 deployment
record에 기록한다. SQL target이 검증되지 않았다면 저장소 adapter test가 통과해도 mutation을
fail-closed로 유지한다.

Host 환경에 optional `pg`가 설치되어 있으면 repository smoke command를 실행할 수 있다.

```bash
DATABASE_URL=postgres://user:password@db.example.internal:5432/app \
  pnpm tool-durable:verify:postgres
```

이 command는 격리된 verification table을 만들고 종료 시 삭제한다. Application의 versioned
shared-table migration 적용이나 보호된 deployment evidence 기록을 대신하지 않는다. state
machine을 실행하기 전에 reference schema를 두 번 적용하고 필수 column과 `updated_at`
pruning index를 확인하므로 재시도 가능한 migration 단계도 검증하지만 host migration
소유권을 주장하지는 않는다.

CI repository test job은 매번 PostgreSQL 16 service container에서 같은 smoke command를
실행한다. 따라서 reference adapter가 실제 PostgreSQL server에서 동작하는지는 자동으로
확인하지만, production pool·version·isolation 설정·network path·migration rollout을
증명하는 것은 아니다.

### Incarnation fence 업그레이드

`incarnation` fence가 없는 구버전 worker와 새 worker를 동시에 mutation 경로에 두지 않는다.
구버전 worker는 revision만 비교하므로 새 record의 full fence를 우회할 수 있다. 배포 전
mutation consumer를 drain하고 쓰기를 중지한 뒤 모든 worker를 같은 버전으로 교체한다.

- PostgreSQL은 새 `POSTGRES_DURABLE_OPERATION_SCHEMA_SQL`을 먼저 적용한다. migration은 기존
  row에 결정적인 legacy incarnation을 채우고 column을 `NOT NULL`로 만든다.
- Redis와 IndexedDB의 legacy record는 새 store가 처음 읽을 때 revision 일치와 incarnation
  부재를 한 atomic operation으로 확인한 뒤 한 번만 backfill하고 다시 읽는다.
- rollout 전에 backup과 legacy pending/terminal sample을 보존하고, staging에서 backfill,
  claim, reconciliation, prune/recreate ABA 검사를 수행한다.
- rollback이 필요하면 mutation을 다시 중지한다. incarnation field를 삭제하거나 구버전
  worker를 새 worker와 함께 재가동하지 않는다.

backfill은 저장 형식 이행만 담당한다. 이미 불확실한 `unknown` 결과를 자동으로
`completed` 또는 `failed`로 바꾸지 않으며, 그 결정은 아래 recovery 절차를 따른다.

### CI fixture 검증

자동화된 repository 경로는 `.github/workflows/ci.yml`이다. test job이 Redis 7과
PostgreSQL 16 service container를 시작하고 public API smoke, durable-operation
integration suite, HTTP/queue bridge fixture를 실행한다. 동일한 검증은 application이
소유한 endpoint를 사용해 로컬에서도 실행할 수 있다.

```bash
REDIS_URL=redis://127.0.0.1:6379 \
  pnpm tool-durable:verify:redis
DATABASE_URL=postgres://user:password@127.0.0.1:5432/context_action \
  pnpm tool-durable:verify:postgres
pnpm tool-durable:verify:http
pnpm tool-durable:verify:queue
```

GitHub Environment는 이 저장소의 CI/CD 계약에서 의도적으로 제외한다.
Production 검증, endpoint owner, alert, retention, rollback 증거는 해당 자원을
소유한 application deployment pipeline에서 관리한다.

## 필수 runtime 설정

| 설정 | 규칙 |
| --- | --- |
| `REDIS_URL` | secret/configuration system에서 주입하고 commit·로그에 남기지 않는다. |
| `DATABASE_URL` / `POSTGRES_URL` | adapter smoke/integration fixture용 host-owned PostgreSQL secret이며 commit·로그에 남기지 않는다. |
| `keyPrefix` | application/environment별 prefix를 사용하며 무관한 application과 공유하지 않는다. |
| `durableOperationOwnerId` | 한 worker/process 수명 동안 안정적이고 동시 worker 사이에서는 유일해야 한다. |
| `durableOperationLeaseMs` | 정상 handler critical section보다 길게 잡되 큰 값으로 만료를 숨기지 않는다. |
| `retentionMs` | provider retry/reconciliation 창보다 길게 두고 terminal record를 scheduler로 정리한다. |
| `prunePageSize` / `maxPrunePages` | 한 번의 cleanup을 bounded하게 유지하고 큰 catalog는 여러 번 실행한다. |

Redis가 unavailable이면 cross-process durability가 필요한 mutation은
retryable `TOOL_IDEMPOTENCY_STORE_FAILED`로 fail closed해야 한다. mutation에 대해
Provider-local memory guard로 조용히 fallback하지 않는다.

## Observability retention과 redaction

`ToolCallEvent.provenance`는 안전한 숫자·lifecycle evidence지만 event의 canonical
`request`에는 arguments가 들어갈 수 있다. trace나 diagnostic을 telemetry, 사용자
export, durable unknown-record evidence로 복사하기 전에는
`@context-action/tool-protocol`의 `createToolObservabilityPolicy()`와
`serializeToolObservabilityValue()`를 적용한다.
server/provider telemetry는 먼저 `projectToolCallObservation(event, policy)`를
호출한다. 이 함수는 lifecycle metadata, argument 이름, content type, 제한된
context metadata만 남기고 request argument 값, result content, structured
payload, error message를 제거한다. projection을 같은 policy로 serialize한 뒤
application 소유 sink에 전달한다. 이 경계에는
`createToolObservationSink(sink, policy)` 사용을 권장한다. callback은 canonical
event가 아니라 serialized projection과 policy/retention metadata만 전달하므로
raw event를 sink에 넘기지 않는다. custom sink는 두 helper를 적용한 뒤에만 저장한다.
`@context-action/react/tools`는 ambiguous·failed durable `ToolCallResult`에
`sanitizeToolCallDiagnostic()`를 자동 적용한다. custom durable runner는 여전히
application 소유이므로 `markUnknown()` 전에 diagnostic과 reason을 직접 sanitize해야 한다.

| Sink | 최소 policy | 저장 규칙 |
| --- | --- | --- |
| In-memory/UI trace | `maxBytes: 2,400`, `maxEntries: 24`, bounded retention | redacted projection만 표시·복사하고 raw request는 저장하지 않는다. |
| Server telemetry | 기본 `maxBytes: 8,192`, depth/collection 제한, owner가 retention 선택 | policy version과 environment owner를 기록하고 raw `ToolCallEvent.request`와 credential은 금지한다. |
| Durable `unknown` diagnostic | `markUnknown()`/`resolveUnknown()` 전에 sanitize; bounded identifier·hash·length·status code만 유지 | durable operation `retentionMs`로 삭제하며 diagnostic을 replay 권한으로 사용하지 않는다. |

policy의 `retentionMs`와 `maxEntries`는 sink가 사용할 metadata이며 Redis를 prune하거나
다른 state machine을 만들지 않는다. 각 배포는 실제 telemetry retention window, 삭제 job,
operator를 보호된 evidence record에 남긴다. sink가 policy를 적용할 수 없으면 export를
끄고 mutation/recovery 경계를 fail-closed로 유지한다.

## Recovery 절차

1. `registry.getOperationStatus(toolName, key, context)`로 record를 읽는다.
2. `pending`이면 lease가 끝날 때까지 기다리거나 owner를 조사한다. 같은 key로
   두 번째 logical operation을 시작하지 않는다.
3. `completed` 또는 `failed`면 기록된 결과를 replay하고 종료한다.
4. `unknown`이면 application resolver를 넘겨 `registry.recoverOperation()`을
   호출한다. resolver는 domain system 조회, 안전한 compensation, 또는 명시적인
   operator 결정을 담당한다.
5. resolver가 completed/failed resolution을 반환하면 관찰한 `incarnation`과 `revision`
   전체 fence로 atomic 검증한다. stale decision은 새 status read부터 다시 수행한다.
6. 진짜 새 logical operation이 필요하면 새 idempotency key를 만들고 기존 record는
   audit/reconciliation을 위해 보존한다.

`recoverOperation()`은 mutation handler를 실행하지 않는다. 따라서 provider
결과가 불확실한 상태가 검증되지 않은 재시도로 바뀌지 않는다.

저장소의 실제 단일 파일 예제는 Live Code Editor recovery action이다. 연결된 folder를
`WorkspaceFileSystemAdapter.readFile()`로 읽고 source를 정확히 비교한 뒤 읽기 전용
status 조회와 함께 완료 결과를 기록한다. `saveAll`은 blind unit retry를 하지 않으며,
ambiguous result에 제한된 파일별 digest/길이 manifest를 담아 모든 대상 파일을 읽은
뒤 완료를 기록한다. 하나라도 없거나 다르면 record를 `unknown`으로 유지해 수동
reconciliation을 요구한다. 이 reference filesystem 흐름 밖의 exactly-once side effect에는
여전히 downstream outbox가 필요하다.

browser filesystem reference는 persisted `folderScopeId`를 노출한다. filesystem
side-effect key를 만들 때 이 scope를 workspace revision·path와 함께 사용해야 하며,
그렇지 않으면 경로가 같은 두 대상이 서로의 record를 replay할 수 있다.

## Provider adapter 도입 admission checklist

application owner가 다음 계약을 제공하기 전에는 production HTTP·queue·provider
adapter를 추가하지 않는다. Generic runner와 local fixture는 재사용할 수 있지만
provider 증거를 대신하지 않는다.

| Gate | 필요한 증거 |
| --- | --- |
| Owner와 target | 담당 service owner, environment, endpoint 또는 queue, rollback 연락처 |
| Stable identity | domain operation 하나를 하나의 idempotency key로 매핑하는 규칙, fingerprint/version 규칙, scope(tenant·workspace·account) |
| Authoritative acknowledgement | 완료를 증명하는 provider 사실과 pre-send rejection·ambiguous/lost-ack 분류 |
| Reconciliation | mutation을 다시 호출하지 않고 `unknown`을 확정할 status/query 또는 inbox 조회 |
| Duplicate 동작 | provider 소유 idempotency·inbox/outbox 또는 동등한 중복 억제; 같은 logical key는 두 번 send/publish하지 않음 |
| Runtime limit | 실제 client의 timeout·abort-drain·lease·retry·rate-limit 동작 |
| Retention과 rollback | operation/telemetry 보존, 삭제 job, alert threshold, fail-closed 규칙, rollback 판단 |
| 실행 가능한 증거 | duplicate delivery, pre-send failure, lost acknowledgement, lease reclaim, stale fence, prune/recreate ABA, recovery, provider integration test |

이 gate를 application 소유 deployment evidence에 기록한 뒤에만
`runHttpSideEffect()` 또는 `runQueueSideEffect()`를 사용할 수 있다. Non-2xx 응답,
queue receipt, client timeout만으로 완료를 추측하지 않는다. Provider가 acknowledgement
또는 status query 계약을 제공하지 못하면 integration을 durable mutation 경계에 넣지
말고 unresolved target으로 기록하며 synthetic adapter를 추가하지 않는다.

resolver는 애플리케이션이 소유한다. 예를 들어 filesystem save는 folder adapter로
대상 파일을 다시 읽은 뒤 다음과 같이 결정할 수 있다.

```ts
const record = await registry.recoverOperation(
  'editor.saveFile',
  idempotencyKey,
  async (unknown) => {
    const file = await readFolderFile(path);
    if (file?.source !== expectedSource) {
      throw new Error('folder에 기대한 source가 없다.');
    }
    return { state: 'completed', result: unknown.result ?? confirmedResult };
  },
  { source: 'local', mode: 'direct', sessionId }
);
```

`readFolderFile`과 `confirmedResult`는 애플리케이션이 제공하며 protocol package가
임의로 만들지 않는다.

## 모니터링과 rollback

다음 항목을 모니터링한다.

- `TOOL_IDEMPOTENCY_STORE_FAILED` 비율과 Redis command latency
- `TOOL_IDEMPOTENCY_UNKNOWN` 개수와 age
- lease보다 오래된 pending record
- 반복되는 CAS contention 또는 prune 실패
- retention 기간보다 빠르게 증가하는 operation catalog

backend 또는 schema 변경이 비정상이면 새 mutation traffic을 중지하고 read/recovery
traffic은 유지한다. 기존 `unknown` record는 domain 절차로 확정한 뒤 application/backend
version을 rollback하며 operation prefix를 삭제하지 않는다. 삭제하면 외부 side effect
발생 여부를 판단할 증거가 사라진다.

이 backend가 조정하는 것은 operation record뿐이다. HTTP, queue, filesystem write,
provider mutation에는 별도의 idempotency key 또는 outbox/inbox 계약이 필요하다.
