# Production readiness

Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim.

## Decision summary

| Workload | Assessment | Required practice |
| --- | --- | --- |
| Local React UI and application state | Ready | Use `createStoreContext`, `useStoreValue`, and narrowly scoped contexts. |
| Typed action coordination | Ready | Keep domain work in handlers and make cancellation/timeout behavior explicit. |
| React 19.2 SSR and hydration | Ready for the verified versions | Keep the supported React and type-package versions aligned with the release cohort. |
| Undo/redo or high-frequency updates | Suitable after application measurement | Choose history and notification settings for the workload; do not rely on universal performance multipliers. |
| Cross-tab, worker, or server durable tool calls | Development track | Complete the Durable 0.2 fencing migration and validate the real persistence endpoint before a separate release decision. |
| Exactly-once remote side effects | Not promised by the library alone | Use provider idempotency keys, an inbox/outbox or equivalent, and domain reconciliation. |

The Store and Action layers are a good fit when state ownership, subscriptions, and action handling need clear boundaries. They are not a replacement for an application's authorization model, external-provider idempotency contract, or operational database ownership.

## Verified stabilization boundary

The protected release preflight covers strict source/test type checks, the React 19.2 minimum/current compatibility matrix, SSR/hydration checks, packed ESM/CJS and NodeNext consumers, package exports, examples, workflow/release safety, and durable adapter verification. Redis and PostgreSQL adapters are also exercised against CI service containers.

That evidence supports the library contract at the candidate commit. Before a production rollout, run the same preflight for the exact release candidate and exercise your staging or production-equivalent Redis/PostgreSQL endpoint, including credentials, TLS, migration, retention, and failover behavior.

## Intended state-management release

The immediate release target is the state-management surface:

| Package | Version | Why it matters |
| --- | --- | --- |
| `@context-action/core` | `1.1.0` | Stable action lifecycle and observer semantics. |
| `@context-action/react` | `3.0.0` | React lifecycle and SSR contract for the Store and Action APIs. |

Durable Operations 0.2 and its companion tool protocol work remain in active development. They are not a prerequisite for ordinary Store, Action, React 19.2, or SSR use.

## Responsibility and function contract

The release boundary is intentionally narrow. Treat the following table as the
selection rule when designing an application; a package should not silently
take over a responsibility from the next row.

| Concern | Owner | Function | Explicitly not responsible for |
| --- | --- | --- | --- |
| Action execution | `@context-action/core` | Registers handlers, orders execution, exposes cancellation, timeout, results, and observer lifecycle. | React rendering, state persistence, tool schemas, provider calls, authorization. |
| React state and composition | `@context-action/react` 3.0 | Creates Store/Action contexts, connects subscriptions to React, and preserves the verified React 19.2 and SSR lifecycle contract. | Database-backed work, cross-process recovery, provider/tool runtime. |
| Application domain | Your application | Defines state shape, business rules, authorization, API clients, and the meaning of success or failure. | Delegating business policy to a generic store or action registry. |
| Tool protocol — development track | `@context-action/tool-protocol` | Defines provider-neutral tool schemas, serialization, approval, and observable protocol metadata. | React state lifecycle or durable persistence. |
| Durable mutation recovery — development track | `@context-action/tool-durable-operations` | Coordinates a logical external mutation using records, leases, full fences, and an explicit `unknown` state. | Exactly-once guarantees from an external provider, application authorization, or domain reconciliation policy. |
| Persistence and external effects | Your infrastructure and provider | Supplies atomic storage, migrations, provider idempotency, status lookup, retention, alerting, and rollback. | Assuming a client-side library can infer whether an ambiguous remote mutation succeeded. |

For a normal React state-management application, the first three rows are the
complete path: use a Store for owned state, an Action handler for a state
transition or orchestration boundary, and application services for I/O and
authorization. Add the protocol or Durable tracks only when the problem
actually requires provider-tool interoperability or recovery across process
boundaries.

### Why Durable exists, and why it is separate

An in-memory promise or idempotency map cannot safely coordinate a mutation across browser tabs, workers, process restarts, or an uncertain provider response. Durable Operations was created to give those cases an application-owned record, lease, full incarnation/revision fence, and explicit `unknown` recovery path.

That problem has a different operational boundary from client state management: it requires a real persistence service, a provider/domain status lookup, and a defined reconciliation policy. Keeping it in development prevents a database and provider-recovery contract from becoming an accidental requirement for the core state-management release.

The source retains `@context-action/react/tools` for development, but the React 3 artifact intentionally omits that subpath while Durable 0.2 is withheld. The ordinary React root entry is independent of this development track.

## Durable operations: operational boundary

Durable operations protect against stale owners by requiring the full fence captured by a claim:

```ts
const claim = await store.claim(key, fingerprint, ownerId);

if (claim.status === 'owner') {
  await store.complete(key, ownerId, result, claim.fence);
}
```

Every terminal or reconciliation transition must use the fence observed before that decision. Do not run pre-fencing and fenced writers against the same mutation path during migration. If a call becomes `unknown`, query the provider or domain system first, then reconcile it with that captured fence; do not automatically re-execute an ambiguous external effect.

See the [durable operations runbook](/en/context-layered/architecture/durable-operation-operations) and the [tool-calling architecture](/en/concept/tool-calling-editor-architecture) for the complete recovery and migration rules.

## Production rollout checklist

- Pin and test the Core 1.1 / React 3 cohort together.
- Run `pnpm release:check` from the exact candidate commit.
- Use the packed-consumer and React compatibility checks as release gates, not only workspace tests.
- Roll out Core 1.1 / React 3 behind normal application canary and rollback controls.

If you opt into the separate Durable track, additionally validate
Redis/PostgreSQL in an application-owned staging environment; define durable
key, owner-ID, retention, pruning, alerting, and reconciliation policies; and
use provider idempotency keys plus a domain source of truth for externally
visible mutations.

## Recommendation

Use Context-Action now for typed React state and action orchestration when the team benefits from explicit context boundaries. Keep durable side-effect features on the development track until their separate operational checklist and release decision are complete. This is a strongly tested state-management foundation, not a promise that an arbitrary remote provider becomes exactly-once or that every workload receives the same performance result.
