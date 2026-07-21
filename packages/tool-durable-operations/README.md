# @context-action/tool-durable-operations

Durable idempotency and external side-effect adapters for Context-Action tool
mutations.

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
`DATABASE_URL` is not set. The protected GitHub workflow intentionally uses
the environment secret name `DATABASE_URL`.

These checks verify the persistence adapter and recovery contract; they do not
claim exactly-once behavior from an external provider.

The protected deployment workflow emits a sanitized
`context-action/durable-operation-verification@1` evidence record. It contains
step outcomes and allow-listed host/version/isolation/check fields only; raw
command logs remain in the workflow log and endpoint credentials are never
written to the artifact.

Use `pnpm tool-durable:verify:github --report-only` before dispatching the
workflow to check the local workflow contract, remote workflow, protected
environments, and required secret names without reading secret values.

Validate the checked-in workflow wiring before that remote check:

```bash
pnpm tool-durable:verify:workflow
```

This local gate verifies the referenced commands, evidence writer/schema, and
sanitized artifact path without contacting GitHub or reading endpoint secrets.

The uploaded JSON evidence is validated against
[`spec/durable-operation-verification-evidence.schema.json`](./spec/durable-operation-verification-evidence.schema.json)
before the artifact is accepted.

For unpublished workspace packages, the root local consumer smoke installs the
packed artifacts instead of querying npm:

```bash
pnpm verify:local-tool-consumers
```
