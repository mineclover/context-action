# Change Log

## [1.0.1] (2026-08-10)

### Packaging correction

- Republish the already-documented 1.0.0 release notes in the immutable npm
  tarball. This patch changes no runtime API or declaration contract.

## [1.0.0] (2026-08-09)

### Stable Contracts

- Establish the framework-neutral action schema, JSON Schema, tool-call,
  approval, provider-adapter, and transport metadata contracts as the v1
  Tool Protocol surface.
- Keep durable-operation implementations in
  `@context-action/tool-durable-operations`; this package owns the portable
  contracts rather than a persistence backend.

### Breaking Changes from 0.x

- Consumers must import protocol and schema symbols from
  `@context-action/tool-protocol` rather than relying on Core or React
  re-exports removed during the v1 migration.

## [0.8.9] (2026-08-09)

- Added `ToolInteractionHandler`, `ToolCallOptions.interaction`, transport
  metadata, and WebMCP untrusted-content annotations to the public contract.

## [0.8.8] (2026-07-21)

- Durable operation records, side-effect runners, provider bridges, and
  persistence backends are now owned by the separate
  `@context-action/tool-durable-operations` package. The entries below describe
  the work originally prototyped in this package; new consumers should import
  those APIs from the dedicated package.
- Extracted JSON Schema types, Zod action schemas, MCP/provider adapters, tool
  call contracts, and approval queues from `@context-action/core`.
- `@context-action/react` continues to own `createToolContext`, but protocol
  symbols are now imported from this package directly.
- The package remains framework-neutral. Zod is a direct dependency because the
  root declaration exports the action-schema API.
- Added bounded promise-sharing idempotency primitives and the
  `ToolCallOptions.idempotencyKey` contract for safe mutation retries.
- Added `TOOL_IDEMPOTENCY_CONFLICT` for key reuse with a different argument
  fingerprint.
- Added framework-neutral `DurableOperationStore` contracts with lease-aware
  pending, replay, unknown, and owner-transition states.
- Added `createDurableOperationStore()` with revision-checked CAS and terminal
  record pruning over an application-provided atomic backend.
- Added `createIndexedDbDurableOperationBackend()` for browser multi-tab
  coordination using IndexedDB transactions and revision-checked CAS.
- Added optional `DurableOperationBackend.listPage()` scans and bounded
  `prunePageSize`/`maxPrunePages` cleanup settings for server backends.
- Added `DurableOperationStore.resolveUnknown()` for revision-checked domain
  reconciliation with an explicit recovery actor.
- Added `createRedisDurableOperationBackend()` with Lua CAS and sorted-set
  keyset scans through a driver-neutral client bridge.
- Added node-redis and ioredis structural bridge helpers; both remain optional
  dependencies, while CI runs the Redis integration suite against Redis 7.
- Added the opt-in `verify:redis` smoke command for staging/deployment endpoint
  verification without exposing a driver-specific cleanup API.
- Added `TOOL_IDEMPOTENCY_PENDING`, `TOOL_IDEMPOTENCY_UNKNOWN`, and
  `TOOL_IDEMPOTENCY_STORE_FAILED` for durable mutation recovery boundaries.
- Added `TOOL_EXECUTION_UNKNOWN` for handlers that may have applied a partial
  external side effect.
- `DurableOperationStore.markUnknown()` can retain a bounded diagnostic result
  for a later domain resolver; callers must redact source and credentials.
- Added `createDurableSideEffectRunner()` to reuse the durable operation state
  machine for HTTP, queue, filesystem, and provider side-effect adapters.
  Cancellation while an adapter drains is recorded as `unknown`; explicit
  domain reconciliation is required before another logical operation.
- Added `runHttpSideEffect()` as a thin HTTP bridge over the existing runner.
  Response classification remains application owned so a non-2xx response is
  not incorrectly treated as a failed mutation; ambiguous records use the
  runner's existing `recover()` method.
- Added validated `ToolCallEvent.provenance` lifecycle evidence with logical
  owner, timeout/output budgets, measured output bytes, elapsed time, and
  completed/failed/cancelled/unknown state mapping. The record is additive and
  is not a second durable-operation state machine.
- Added optional `ToolCallOptions.maxOutputBytes`; an exceeded result returns
  `TOOL_OUTPUT_LIMIT_EXCEEDED` before a durable completion transition.
- Added shared observability policy helpers for bounded redaction, safe
  serialization, and retention eligibility. Oversize payload markers also stay
  within the configured UTF-8 byte budget, including very small limits. The
  policy is opt-in at telemetry and diagnostic boundaries and does not alter
  durable operation transitions.
- Added `createToolObservationSink()` and the versioned sink record contract so
  provider/server telemetry callbacks receive only a serialized metadata
  projection plus retention policy metadata, never a raw `ToolCallEvent`.
- Added `sanitizeToolCallDiagnostic()` for unknown/failed `ToolCallResult` records.
  React durable-operation persistence now stores only bounded redacted error
  details for unknown and failed outcomes; successful replay results remain
  lossless.
- Added `sanitizeToolCallDiagnosticReason()` so ambiguous durable records do not
  persist handler-provided error-message payloads.
- Added `runQueueSideEffect()` as a thin enqueue/acknowledgement adapter over
  the existing durable runner. Queue completion and pre-enqueue rejection stay
  provider-owned; ambiguous acknowledgements remain `unknown` and require
  reconciliation.
- Added `createPostgresDurableOperationBackend()` with parameterized
  revision-checked SQL CAS, keyset pagination, explicit-null result handling,
  and an application-owned schema generator. The package keeps `pg` out of
  runtime dependencies; the optional `verify:postgres` smoke command uses the
  host-installed driver and an isolated verification table.
- Added the `verify:http` smoke fixture, which uses a real local `fetch`
  transport to verify Idempotency-Key replay, ambiguous acknowledgement
  retention, and status-query reconciliation through `runHttpSideEffect()`.
- Added the `verify:env` deployment preflight, which validates endpoint
  protocols and emits host-only metadata while requiring TLS Redis URLs for
  production.
- Added the `verify:queue` ephemeral publisher fixture, which verifies
  authoritative acknowledgement, replay without a second publish, lost-
  acknowledgement retention, and provider-status reconciliation through
  `runQueueSideEffect()`. It is explicitly a bridge contract check, not a
  production queue SDK integration.
