# @context-action/tool-durable-operations

Durable idempotency and external side-effect adapters for Context-Action tool
mutations.

> **Development track:** Durable 0.2 is being stabilized separately from the
> Core 1.1 / React 2 state-management release. Its persistence, provider
> recovery, and migration contract is not published as part of that cohort.

This package starts after a canonical tool call has been validated. It owns
the mutation boundary: durable operation records, lease-aware claims,
`completed`/`failed`/`unknown` outcomes, status-first recovery, and thin HTTP,
queue, filesystem, or provider adapters.

Provider-neutral schemas, `tools/list`/`tools/call` contracts, provider
serialization, lifecycle events, and output/provenance contracts remain in
[`@context-action/tool-protocol`](../tool-protocol/README.md).

```ts
import {
  createDurableOperationStore,
  createDurableSideEffectRunner,
} from '@context-action/tool-durable-operations';

const store = createDurableOperationStore(atomicBackend);
const sideEffects = createDurableSideEffectRunner({
  store,
  ownerId: 'worker-1',
});

const result = await sideEffects.run({
  key: 'provider:charge:42',
  fingerprint: 'charge:42:v1',
  execute: async () => ({
    state: 'completed',
    result: { providerId: 'charge-42' },
  }),
});
```

The package does not retry ambiguous external effects. A timeout, lost HTTP
response, or lost queue acknowledgement is stored as `unknown` and must be
reconciled by the application before a new logical operation is attempted.
Failed and unknown transitions require a non-empty reason so recovery and
operator evidence cannot silently lose the outcome classification.
The package supplies driver-neutral IndexedDB, Redis, and PostgreSQL reference
backends; applications still own migrations, provider idempotency/inbox-outbox
contracts, retention, and rollback policy.

## Durable 0.2 fencing upgrade

Durable 0.2 uses an incarnation/revision fence to prevent a stale owner from
writing after a lease reclaim or prune/recreate cycle. Keep the `fence` returned
by a claim and pass it to every terminal or reconciliation transition:

```ts
const claim = await store.claim(key, fingerprint, ownerId);

if (claim.status === 'owner') {
  await store.complete(key, ownerId, result, claim.fence);
}
```

Do not run pre-fencing and fenced writers against the same mutation path during
the upgrade. An `unknown` outcome is deliberately not retried automatically:
look up the provider or domain status, then resolve it using the fence observed
before that decision. The repository durable-operations runbook describes the
required migration, endpoint verification, and recovery procedure.

For telemetry, prefer `createToolObservationSink()` from
`@context-action/tool-protocol`. It delivers a serialized metadata-only
projection and retention policy metadata to an application-owned sink without
forwarding the raw `ToolCallEvent`. Sink ownership, retention, and deletion
remain outside this package. If a custom sink needs the projection directly,
use `projectToolCallObservation()` and
`serializeToolObservabilityValue()` together; never persist the canonical event.

Local contract fixtures:

```bash
pnpm tool-durable:verify:http
pnpm tool-durable:verify:queue
```

Redis/PostgreSQL integration checks are opt-in and require application-owned
endpoints:

```bash
REDIS_URL=redis://127.0.0.1:6379 pnpm tool-durable:verify:redis
DATABASE_URL=postgres://user:password@127.0.0.1:5432/context_action \
  pnpm tool-durable:verify:postgres
```

The endpoint preflight accepts `POSTGRES_URL` as a local alias when
`DATABASE_URL` is not set.

These checks verify the persistence adapter and recovery contract; they do not
claim exactly-once behavior from an external provider.

The repository CI workflow runs the Redis 7 and PostgreSQL 16 checks against
GitHub-hosted service containers. This is the supported automated verification
path; it does not require GitHub Environments or environment-scoped endpoint
secrets. Production endpoint verification remains an application-owned
operations task outside this repository's CI.

The optional `context-action/durable-operation-verification@1` evidence schema
and writer can be used by an application deployment pipeline. They are not
coupled to this repository's CI workflow, and raw command logs and endpoint
credentials must never be uploaded as evidence.

The root command writes a sanitized JSON/Markdown pair from raw step logs:

```bash
TARGET_ENVIRONMENT=staging \
COMMIT_SHA="$GITHUB_SHA" \
RUN_ID="$GITHUB_RUN_ID" \
OPERATOR=durable-operations-ci \
  pnpm tool-durable:write:evidence \
    -- --input reports/durable-operation/raw \
    --output reports/durable-operation/evidence

pnpm tool-durable:verify:evidence \
  -- --file reports/durable-operation/evidence/evidence.json
```

The published package also exposes the writer as
`tool-durable-write-evidence`; it can be invoked from an application-owned
deployment job after installing this package. The schema remains in the
published `spec/` directory so the deployment pipeline can validate the
generated artifact with its own JSON Schema gate.

The uploaded JSON evidence is validated against
[`spec/durable-operation-verification-evidence.schema.json`](./spec/durable-operation-verification-evidence.schema.json)
before the artifact is accepted.

For unpublished workspace packages, the root local consumer smoke installs the
packed artifacts instead of querying npm:

```bash
pnpm verify:local-tool-consumers
```
