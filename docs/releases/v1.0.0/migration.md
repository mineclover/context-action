# v1.0 to v1.0.0 Candidate Migration Guide

**Status:** `documented candidate — owner operated`
**Roadmap revision:** `v1-r2`

This guide covers the compatibility decisions implemented in the v1 candidate.
It is not a release announcement; use the published release notes and recorded
version map for an actual upgrade.

## Core handlers

`register()` remains the default result-handler API. Prefer the phase-specific
APIs when the role is known:

```ts
register.registerGuard('save', validateSave);
register.registerResult('save', save);
register.registerObserver('save', observeSave);
```

`registerEffect()` remains supported for dynamic role selection during 1.x, but
now always requires an explicit `effectKind`:

```ts
register.registerEffect('save', validateSave, { effectKind: 'guard' });
register.registerEffect('save', observeSave, { effectKind: 'observer' });
```

The `blocking` shorthand remains supported in 1.x and is normalized by
`resolveHandlerConfig()`. New code should prefer explicit scheduling and error
policy options when their behavior matters.

## WebMCP

Import the React hook from its isolated experimental subpath:

```ts
import { useWebMCPToolScope } from '@context-action/react/webmcp';
```

Do not import it from `@context-action/react/tools`.

`beforeExecute` is removed. Use `afterExecute` for a detached post-commit
notification. Notification failures cannot change the canonical tool result.

`errorMode: 'result'` is removed. Use `errorMode: 'structured'` for a
structured browser response, or `errorMode: 'throw'` when the host should
receive an exception.

WebMCP remains experimental and browser-specific. Consumers must handle its
unsupported/SSR inert scope and must not rely on it as a stable 1.x contract.

## Verification

The packed Core consumer fixture is run by `pnpm verify:v1-core-migration`.
The experimental WebMCP type removals are covered by the WebMCP test suite.
Run the appropriate packed-consumer matrix again from the final RC commit.
