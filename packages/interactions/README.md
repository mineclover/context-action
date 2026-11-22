# `@context-action/interactions`

Zero-dependency, framework-neutral headless UI and ARIA interaction primitives for Context-Action.

This Foundation package separates UI/ARIA mechanics from `@context-action/core` (action pipelines & DOM element transport) so consumers using only action pipelines or custom-element bindings pay zero bundle or concept overhead for interactive widget engines.

## Primitives

- **`createRovingFocusController(options)`** — WAI-ARIA composite focus helper supporting `'horizontal'`, `'vertical'`, and `'both'` orientations, `Arrow*` / `Home` / `End`, disabled-item skipping, looping, virtual `getActiveDescendant(idPrefix)`, explicit `move(direction, currentId?)`, and multi-character / cyclic label `typeahead`.
- **`createPointerGestureSession(options)`** — Pointer-capture drag/gesture lifecycle manager tracking primary-button filtering, `onStart` guard admission, `setPointerCapture` / `releasePointerCapture`, `deltaX` / `deltaY` and keyboard modifier snapshots, and `Escape` cancellation.
- **`createDismissLayer(options)`** — Per-`Document` LIFO overlay stack managing capture-phase `Escape` and multi-container outside `pointerdown` dismissal with zero listener leaks when all layers close.

## Example

<!-- @context-action-compile -->
```ts
import {
  createDismissLayer,
  createPointerGestureSession,
  createRovingFocusController,
} from '@context-action/interactions';

const roving = createRovingFocusController({
  orientation: 'vertical',
  typeahead: true,
  getItems: () => [
    { id: 'save', label: 'Save' },
    { id: 'delete', label: 'Delete' },
  ],
  getActiveId: () => 'save',
});

const gesture = createPointerGestureSession({
  onMove: snapshot => {
    void snapshot.deltaX;
  },
});

const layer = createDismissLayer({
  enabled: false,
  getContainers: () => [],
  onDismiss: () => {},
});

void [roving.getActiveDescendant('item-'), gesture.isActive(), layer.isTopMost];
```
