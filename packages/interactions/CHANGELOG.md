# Change Log

## [0.1.0] (2026-11-26)

### Initial release

- Extracted framework-neutral UI and ARIA interaction primitives (`createRovingFocusController` with orientation, typeahead, and virtual active-descendant support, `createPointerGestureSession`, and LIFO `createDismissLayer`) into a dedicated zero-dependency Foundation package `@context-action/interactions`.
- Preserved JSDoc comments in published `.d.ts` / `.d.cts` declarations (`removeComments: false`).
