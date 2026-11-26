# `@context-action/core` Test Suite

Boundary and runtime contract tests for `@context-action/core` (`2.0.0`) and `@context-action/core/element`, executed in Node via Jest (`--runInBand`) without React or DOM UI dependencies.

## Layout

```text
__tests__/
├── unit/              # Lifecycle, priority, dispatch options, queue, trace, execution modes, error guards
├── comprehensive/     # End-to-end ActionRegister, payload typing, no-handler, warning behavior
├── concurrency/       # Async/sync queue serialization & race isolation
├── edge-cases/        # Circular references, malformed payloads, bounds
├── feature-coverage/  # Filtering, result collection, memory management
├── individual-features/
├── production/        # Multi-stage workflow pipelines
├── schema/            # Schema/validation integration
├── type-safety/       # TypeScript payload/result inference contracts
└── working/           # Active practical scenario tests
```

## Commands

```bash
pnpm --filter @context-action/core test
pnpm --filter @context-action/core test:element
pnpm --filter @context-action/core type-check
```

## Canonical Guides

- [Testing Convention & Scenarios](../../../docs/en/context-layered/testing-convention.md) (`CA-TESTING-CONVENTION-001` — `T1`–`T4` & `S1`–`S6`)
- [Testing Context-Action by Boundary](../../../docs/en/guide/testing-boundaries.md)
- [Core Action Contracts](../docs/action-contracts.md)
