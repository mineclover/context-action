# Unreleased changes

These changes are not included in the published versions listed in [CHANGELOG.md](./CHANGELOG.md).
They do not authorize a version change or publication.

## Cancellation and disposal reliability

- Give each Ref mount waiter its own deadline and abort cleanup; release grouped waits after settlement without affecting independent callers.
- Stop polling immediately on cancellation or Provider disposal, and avoid leaving intervals behind after an already-mounted ref succeeds.
- Ignore stale Ref setters after Provider disposal and fail new waits rather than recreating cleared state.
- Forward Provider/external cancellation to Ref operations, clear operation deadlines/listeners, and serialize actual work until settlement even after a caller times out or cancels.
- Ignore writes and queued updaters after Store disposal, including disposal triggered inside an updater or comparator.

## Provider and Ref isolation

- Keep Ref state and pending mount waits alive through StrictMode effect replay and Activity hide/reveal, reserving Provider cleanup for actual unmount.
- Read Ref mount state through the existing external-store subscription hook so callback refs attached before passive effects are observed, while keeping `setRef` stable across mount-state updates.

## Store subscription reliability

- Preserve full invalidation when patchable and unknown transitions share a notification frame so path subscribers cannot miss changes.
- Apply custom selection equality to `undefined` values and reset selection caches when switching Store instances in the basic value, selector, and path hooks.

## Basic package isolation

- Keep Action schema validation on core's structural `safeParse` contract instead of importing tool-protocol types into the default entry.
- Make WebMCP and tool-protocol optional peers for the explicit `/webmcp` adapter. Basic Action, Store, Context, and Ref use no longer installs these integrations; adapter users must install them explicitly.
