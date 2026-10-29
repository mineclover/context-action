# Unreleased — shared element interface candidate

- Derive facade and React bridge behavior from Core's optional Element entries,
  preserving public names,
  aliases, generic compatibility annotations and both call forms.
- Capture property/event configuration at bridge creation; keep native Lit
  rendering, FACE, contexts and SSR/hydration in this package.
- Pass the host's React runtime into the common implementation to avoid a
  second hook dispatcher in multi-version workspaces.
- Public publication is **blocked** until the Core/UI dependency cohort and minimum
  Core version containing the new exports are approved. Versions are unchanged.

[Shared requirements review](../core/docs/interop-review.en.md)
