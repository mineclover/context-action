# Unreleased changes

These changes do not authorize a version change or publication.

- Extract the existing batch/notification lifecycle methods into the
  framework-neutral `TransactionBatchControl` interface, inherited by
  `TransactionBackend` without changing existing implementations.
- Allow lifecycle authority to be scoped separately from stable participant
  identity, without adding React, Mutative or another runtime dependency.
- Separate ownership contracts and coordination protocols internally, preserving
  the root exports and reference-store runtime. Add `TransactionParticipantBackend`,
  `TransactionParticipant`, `TransactionMeta`, `TransactionOptions`,
  `TransactionHandle` and `TransactionCoordinatorPort` as shared type-only roles.
- Add optional-version `StateSnapshot` and an explicit snapshot parameter to
  `StateReader`; its default and `StateBackend` still require version tokens.
- Publishing consumers of this new type requires an approved coordinated
  version/floor decision; the current unchanged manifests are not release evidence.
