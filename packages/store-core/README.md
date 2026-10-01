# @context-action/store-core

Framework-neutral contracts for Context-Action state and timeline adapters.

This package intentionally has no React, Mutative, immutable runtime, or DOM
dependency. Applications and integrations can provide their own `StateBackend`
or `TimelineBackend`. `@context-action/mutative` is one optional implementation.

The contracts are capability-oriented: a backend may support only snapshots and
subscriptions, or may additionally provide patches and timeline entry
identity. Consumers must not assume immutability or undo/redo unless the
backend exposes that capability.
