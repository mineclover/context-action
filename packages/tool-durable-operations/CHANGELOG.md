# Change Log

## [0.2.0] (2026-08-11)

### Breaking Changes

- Replace revision-only durable-operation transitions with the required
  `DurableOperationFence` (`incarnation` plus `revision`) and require fencing
  capability support from stores and backends. Custom backend and store
  implementations must implement the full-fence compare-and-set contract.
- `complete`, `fail`, `markUnknown`, and `resolveUnknown` now require the
  claim's full fence. Migrate callers by retaining `claim.fence` and passing it
  to every terminal or recovery transition.

### Reliability fixes

- Prevent ABA writes across prune/recreate cycles in the reference, Redis,
  PostgreSQL, and IndexedDB backends; legacy persisted rows are backfilled
  atomically before they participate in a fenced transition.
- Record ambiguous cancellation and side-effect recovery using the original
  claim fence so a reclaimed owner cannot be overwritten.

## [0.1.1] (2026-07-25)

- Exposed the sanitized durable-operation evidence writer through the workspace
  `tool-durable:write:evidence` command and the published
  `tool-durable-write-evidence` CLI; documented schema validation.

## [0.1.0] (2026-07-21)

- Extracted durable operation records, side-effect runners, HTTP/queue bridges,
  IndexedDB, Redis, and PostgreSQL reference backends from
  `@context-action/tool-protocol`.
- Added contract smoke fixtures for authoritative completion, replay,
  ambiguous acknowledgement retention, and provider reconciliation.
