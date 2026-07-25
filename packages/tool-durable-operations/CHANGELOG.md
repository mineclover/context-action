# Change Log

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
