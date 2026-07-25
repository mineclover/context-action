# Durable Operation Operations Runbook

This runbook is the operational companion to the semantic contract in the
[Tool-calling editor architecture guide](../../concept/tool-calling-editor-architecture.md).
It covers deployment verification for the Redis and PostgreSQL reference backends and the
recovery boundary exposed by `@context-action/react`.

The guide above is the semantic source of truth. This page intentionally keeps
only deployment, incident, and resolver-operating procedures; package READMEs
should link here instead of repeating the durable state machine.

## Boundary and prerequisites

- `@context-action/tool-durable-operations` owns the durable-operation state
  machine and Redis/PostgreSQL backends.
- `@context-action/react` owns `ToolContext` and the
  `getOperationStatus()`/`recoverOperation()` registry surface.
- The application owns the domain status query, compensation decision, and
  downstream idempotency/outbox behavior.
- Redis must be reachable from every process that can execute the mutation.
  Use a TLS URL and an ACL user in staging/production; do not print the URL or
  credentials in logs.

## Deployment verification

Run the public-API smoke check against the exact Redis endpoint used by the
deployment. The command creates a unique key prefix and removes its records
when it exits.

```bash
REDIS_URL=rediss://user:password@redis.example.internal:6380 \
  pnpm tool-durable:verify:redis
```

The smoke check must report `status: "ok"` for all of these checks:

- atomic claim across two store instances;
- completed-result replay without a second owner;
- `unknown` record resolution with a revision check;
- stale revision rejection before reconciliation;
- lease expiry and reclaim by a second owner;
- terminal-record retention pruning.

The host-only JSON result also records the Redis server version. The PostgreSQL
smoke result records the server version and effective transaction isolation;
these values belong in the protected evidence record without including a
connection URL or credential.

Run the full integration suite as a second gate. It exercises eight concurrent
owners, lease expiry/reclaim, recovery, and bounded retention cleanup:

```bash
REDIS_URL=rediss://user:password@redis.example.internal:6380 \
  pnpm --filter @context-action/tool-durable-operations test
```

The CI workflow runs the smoke command and this suite with Redis 7. A staging
or production pass is still required because connectivity, TLS, ACL
permissions, failover behavior, and latency are deployment properties that CI
cannot prove.

### Verification evidence

Keep one short evidence record per target environment. A local Redis 7
container is useful for reproducing the contract but does not satisfy the
staging/production gate.

| Field | Required value |
| --- | --- |
| Environment | `local`, `staging`, or `production` |
| Commit | exact application commit SHA |
| Redis version | server major/minor from an operator-safe version check |
| Endpoint | hostname/port only; never the full URL or credentials |
| Smoke | command timestamp and `status: "ok"` |
| Integration | command timestamp and passed/skipped counts |
| Operator | responsible owner or automation run ID |
| Rollback | approved application/backend rollback decision |

The repository CI workflow runs the smoke and integration checks against
GitHub-hosted Redis 7 and PostgreSQL 16 service containers. It is a repository
contract check, not evidence that a production endpoint has the same TLS, ACL,
failover, latency, migration, or rollback properties. If a host deployment
pipeline emits the optional `context-action/durable-operation-verification@1`
record, it must keep only allow-listed host/version/isolation/check fields and
omit raw logs and credentials.

The repository includes a deterministic writer for that record. Give it a directory of raw command
logs (`preflight.log`, `redis.log`, `integration.log`, `postgres.log`, and `queue.log`) and pass
only metadata through environment variables; the writer redacts endpoint credentials and keeps
host/version/isolation/check fields only:

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
```

The generated JSON and Markdown are deployment evidence artifacts, not a substitute for the
provider admission checklist or the actual production endpoint checks.

## PostgreSQL deployment verification

The PostgreSQL adapter is driver-neutral and does not ship `pg` or run
migrations. The host service must apply the versioned
`POSTGRES_DURABLE_OPERATION_SCHEMA_SQL` migration through its normal migration
system, inject the production pool's `query(text, values)` surface, and run an
isolated integration fixture against the exact database version used by the
deployment.

The fixture must prove concurrent claims from separate connections, lease
reclaim, completed replay, unknown reconciliation, revision-checked pruning,
and the configured isolation level. A fake query client or a local-only test is
not production evidence. Record the PostgreSQL version, database host (without
credentials), migration revision, pool/owner, isolation setting, test output,
and rollback decision in the protected deployment record. If the SQL target is
not verified, keep mutations fail-closed even if the repository adapter tests
are green.

The repository smoke command is available when the host environment has an
optional `pg` installation:

```bash
DATABASE_URL=postgres://user:password@db.example.internal:5432/app \
  pnpm tool-durable:verify:postgres
```

The command creates and drops an isolated verification table. It is not a
substitute for applying the application's versioned shared-table migration or
for recording the protected deployment evidence. Before exercising the state
machine it applies the reference schema twice and verifies the required columns
and `updated_at` pruning index, so a retryable migration step is covered without
claiming ownership of the host migration.

CI runs the same smoke command against a PostgreSQL 16 service container on
every repository test job. This proves the reference adapter against a real
server in automation, but it does not prove the production pool, version,
isolation setting, network path, or migration rollout.

### CI fixture verification

The automated repository path is `.github/workflows/ci.yml`. Its test job starts
Redis 7 and PostgreSQL 16 service containers and runs the public-API smoke checks,
the durable-operation integration suite, and the HTTP/queue bridge fixtures. Run
the same checks locally with application-owned endpoints:

```bash
REDIS_URL=redis://127.0.0.1:6379 \
  pnpm tool-durable:verify:redis
DATABASE_URL=postgres://user:password@127.0.0.1:5432/context_action \
  pnpm tool-durable:verify:postgres
pnpm tool-durable:verify:http
pnpm tool-durable:verify:queue
```

GitHub Environments are intentionally not part of this repository's CI/CD
contract. Production verification, endpoint ownership, alerting, retention,
and rollback evidence belong to the application deployment pipeline that owns
those resources.

## Required runtime settings

| Setting | Rule |
| --- | --- |
| `REDIS_URL` | Inject through the deployment secret/configuration system; never commit or log it. |
| `DATABASE_URL` / `POSTGRES_URL` | Host-owned PostgreSQL secret for the adapter smoke/integration fixture; never commit or log it. |
| `keyPrefix` | Use one application/environment prefix. Do not share a prefix across unrelated applications. |
| `durableOperationOwnerId` | Stable for one worker/process lifetime and unique across concurrent workers. |
| `durableOperationLeaseMs` | Longer than the normal handler critical section; monitor expiry rather than hiding it with a large value. |
| `retentionMs` | Long enough for provider retry/reconciliation windows; remove terminal records on a scheduled job. |
| `prunePageSize` / `maxPrunePages` | Keep cleanup bounded per invocation; schedule repeated runs for large catalogs. |

When Redis is unavailable, mutation execution must fail closed with the
retryable `TOOL_IDEMPOTENCY_STORE_FAILED` result. Do not silently fall back to
the Provider-local memory guard for a mutation that requires cross-process
durability.

## Observability retention and redaction

`ToolCallEvent.provenance` is safe numeric/lifecycle evidence, but the event's
canonical `request` may still contain arguments. Before a trace or diagnostic
is copied to telemetry, a user-facing export, or durable unknown-record
evidence, apply `createToolObservabilityPolicy()` and
`serializeToolObservabilityValue()` from `@context-action/tool-protocol`.
For server/provider telemetry, first call
`projectToolCallObservation(event, policy)`: it keeps lifecycle metadata,
argument names, content types, and bounded context metadata while omitting
request argument values, result content, structured payloads, and error
messages. Serialize that projection with the same policy before handing it to
the application-owned sink. Prefer `createToolObservationSink(sink, policy)`
for this boundary: its callback receives only a serialized projection and
policy/retention metadata, never the canonical event. A custom sink must still
apply both helpers before persistence.
`@context-action/react` applies `sanitizeToolCallDiagnostic()` automatically to
ambiguous and failed durable `ToolCallResult` values; custom durable runners remain
application-owned and must sanitize both diagnostic and reason before
`markUnknown()`.

| Sink | Minimum policy | Storage rule |
| --- | --- | --- |
| In-memory/UI trace | `maxBytes: 2,400`, `maxEntries: 24`, bounded retention | Display/copy the serialized redacted projection only; never persist the raw request. |
| Server telemetry | Default `maxBytes: 8,192`, bounded depth/collections, owner-selected retention | Record the policy version and environment owner; raw `ToolCallEvent.request` and credentials are prohibited. |
| Durable `unknown` diagnostic | Sanitize before `markUnknown()`/`resolveUnknown()`; keep only bounded identifiers, hashes, lengths, and status codes | Use the durable operation `retentionMs` for deletion; never use the diagnostic as a replay permission. |

The policy's `retentionMs` and `maxEntries` are metadata for the owning sink;
they do not prune Redis or create another state machine. Each deployment must
record the effective telemetry retention window, deletion job, and operator in
the protected evidence record. If a sink cannot apply the policy, disable its
export and keep the mutation/recovery path fail-closed.

## Recovery procedure

1. Read the record with `registry.getOperationStatus(toolName, key, context)`.
2. If it is `pending`, wait for the lease or investigate the owner; do not
   start a second logical operation with the same key.
3. If it is `completed` or `failed`, replay the recorded result and stop.
4. If it is `unknown`, call `registry.recoverOperation()` with an application
   resolver. The resolver queries the domain system, applies a safe
   compensation if required, or asks for an explicit operator decision.
5. The resolver returns a completed/failed resolution. The observed revision is
   checked atomically; a stale decision must be retried from a fresh status
   read.
6. If a genuinely new logical operation is required, generate a new
   idempotency key and retain the old record for audit/reconciliation.

`recoverOperation()` never invokes the mutation handler. This prevents an
uncertain provider result from being converted into an unguarded retry.

The repository's concrete single-file example is the Live Code Editor recovery
action. It reads the connected folder through
`WorkspaceFileSystemAdapter.readFile()`, compares the source exactly, and then
records a completed result with a read-only status query. `saveAll` is not
treated as a blind unit retry: its ambiguous result carries a bounded per-file
digest/length manifest, and recovery reads every target before recording
completion. Any missing or mismatched file leaves the record `unknown` for
manual reconciliation. A downstream outbox is still required for exactly-once
side effects outside this reference filesystem flow.

The browser filesystem reference exposes a persisted `folderScopeId`. Include
that scope with the workspace revision and path when deriving a filesystem
side-effect key; otherwise two destinations with identical paths could replay
one another's records.

## Provider adapter admission checklist

Do not add a production HTTP, queue, or provider adapter until an application
owner supplies the following contract. The generic runner and local fixtures
are reusable, but they are not provider evidence.

| Gate | Required evidence |
| --- | --- |
| Owner and target | Named service owner, environment, endpoint or queue, and rollback contact |
| Stable identity | Mapping from one domain operation to one idempotency key; fingerprint/version rules and scope (tenant, workspace, or account) |
| Authoritative acknowledgement | Provider fact that proves completion, plus a documented pre-send rejection and ambiguous/lost-ack classification |
| Reconciliation | Status/query or inbox lookup that can resolve `unknown` without invoking the mutation again |
| Duplicate behavior | Provider-owned idempotency, inbox/outbox, or equivalent duplicate suppression; same logical key must not publish/send twice |
| Runtime limits | Timeout, abort-drain, lease, retry, and rate-limit behavior for the actual client |
| Retention and rollback | Operation/telemetry retention, deletion job, alert thresholds, fail-closed rule, and rollback decision |
| Executable evidence | Duplicate delivery, pre-send failure, lost acknowledgement, lease reclaim, stale revision, recovery, and provider-specific integration tests |

The adapter may call `runHttpSideEffect()` or `runQueueSideEffect()` only after
these gates are recorded in the application-owned deployment evidence. A
non-2xx response, queue receipt, or client timeout is not by itself a
completion fact. If the provider cannot supply the acknowledgement or status
query contract, keep the integration out of the durable mutation boundary and
record the decision as an unresolved target rather than adding a synthetic
adapter.

The resolver is application-owned. A filesystem-backed save can, for example,
read the target file through its folder adapter before deciding:

```ts
const record = await registry.recoverOperation(
  'editor.saveFile',
  idempotencyKey,
  async (unknown) => {
    const file = await readFolderFile(path);
    if (file?.source !== expectedSource) {
      throw new Error('The folder does not contain the expected source.');
    }
    return { state: 'completed', result: unknown.result ?? confirmedResult };
  },
  { source: 'local', mode: 'direct', sessionId }
);
```

`readFolderFile` and `confirmedResult` belong to the application; the protocol
package must not invent them.

## Monitoring and rollback

Alert on:

- `TOOL_IDEMPOTENCY_STORE_FAILED` rate and Redis command latency;
- `TOOL_IDEMPOTENCY_UNKNOWN` count or age;
- pending records older than their lease;
- repeated CAS contention or failed prune runs;
- growth of the operation catalog beyond the expected retention window.

If the backend or schema change is unhealthy, pause new mutation traffic, keep
read/recovery traffic available, and resolve existing `unknown` records through
the domain procedure. Roll back the application/backend version without
deleting the operation prefix; deleting it removes the evidence needed to
decide whether an external side effect occurred.

This backend coordinates the operation record only. HTTP, queues, filesystem
writes, and provider mutations still require their own idempotency key or
outbox/inbox contract.
