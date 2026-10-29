# Unreleased changes

These changes are not included in the published versions listed in [CHANGELOG.md](./CHANGELOG.md).
They do not authorize a version change or publication.

## Element host interop candidate

- Add the framework-neutral `./element` and injected-runtime `./element/react`
  public entries for DOM bindings, facades, and React host bridges.
- The current published Core version remains `1.2.6`; these entries are not
  present in that registry artifact. Publication is blocked until an approved
  Core/UI cohort publishes the new entry contract and the adapters move from
  local `workspace:*` wiring to a semver dependency floor.

## Action execution reliability

- Preserve uninvoked `once` handlers when a parallel/race precondition throws, including their cleanup ownership for a later dispatch.
- Prevent concurrent dispatches from invoking the same `once` observer after waiting for a higher-priority observer.
