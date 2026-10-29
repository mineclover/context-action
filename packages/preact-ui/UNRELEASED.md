# Unreleased — shared element interface candidate

- Re-export the existing facade/action-method/handle API from Core's optional
  `/element` entry; use the `/element/react` bridge over framework-neutral DOM bindings.
- Preserve existing call signatures and display names, but align omission,
  stable listeners, object listeners and HTML aliases with the Lit bridge.
- Preserve fail-fast property assignments (distinct from Lit's best-effort
  policy), best-effort omission cleanup, and direct facade setter/command errors.
- Public publication is **blocked** until the Core/UI cohort and minimum Core
  dependency version containing these subpaths are approved. Versions are unchanged.

[Shared requirements review](../core/docs/interop-review.en.md)
