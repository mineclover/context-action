# Unreleased changes

These changes target the approved Core 1.3.0 element interop cohort and remain
unpublished until the protected candidate workflow binds them to an immutable
release commit.

## Element host interop candidate

- Add the framework-neutral `./element` and injected-runtime `./element/react`
  public entries for DOM bindings, facades, and React host bridges.
- Core advances to `1.3.0` for the approved element interop cohort. The adapters
  depend on `@context-action/core@^1.3.0` and publish only after Core.

## Action execution reliability

- Preserve uninvoked `once` handlers when a parallel/race precondition throws, including their cleanup ownership for a later dispatch.
- Prevent concurrent dispatches from invoking the same `once` observer after waiting for a higher-priority observer.
