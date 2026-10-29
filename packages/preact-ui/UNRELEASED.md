# Unreleased — shared element interface candidate

- Re-export the existing facade/action-method/handle API from Core's optional
  `/element` entry; use the `/element/react` bridge over framework-neutral DOM bindings.
- Preserve existing call signatures and display names, but align omission,
  stable listeners, object listeners and HTML aliases with the Lit bridge.
- Preserve fail-fast property assignments (distinct from Lit's best-effort
  policy), best-effort omission cleanup, and direct facade setter/command errors.
- Public candidate publication targets `@context-action/preact@0.1.3` and
  `@context-action/preact-ui@0.2.1` after Core `1.3.0` is published first.

[Shared requirements review](../core/docs/interop-review.en.md)
