# Unreleased changes

These changes are not included in the published versions listed in [CHANGELOG.md](./CHANGELOG.md).
They do not authorize a version change or publication.

## Action execution reliability

- Preserve uninvoked `once` handlers when a parallel/race precondition throws, including their cleanup ownership for a later dispatch.
- Prevent concurrent dispatches from invoking the same `once` observer after waiting for a higher-priority observer.
