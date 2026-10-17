import { definePreactElement } from '../../src/custom-element.js';
import { createLayerPanelController } from './internal/controller.js';
import { emitSelectionRequest } from './internal/events.js';
import { createLayerPanelOwnerSession } from './internal/session.js';
import type { LayerPanelOwnerSession } from './internal/session.js';
import { LayerPanelView } from './internal/View.js';
import type { LayerItem, LayerPanelContract, LayerPanelElement } from './public.js';

/** Explicit component registration. Importing this module requires no DOM. */
export function defineLayerPanel(tagName = 'ca-layer-panel'): { new(): LayerPanelElement } {
  const Element = definePreactElement<
    ReturnType<LayerPanelOwnerSession['getInput']>,
    LayerPanelContract
  >({
    tagName,
    observedAttributes: ['disabled'],
    upgradeProperties: ['items', 'selectedId', 'disabled'],
    setup(element, context) {
      const controller = createLayerPanelController();
      let ownerSession: LayerPanelOwnerSession | undefined;

      return {
        view: LayerPanelView,
        // The semantic API is instance-owned. Defining accessors on this
        // element (rather than putting state in the renderer) keeps public
        // properties valid while disconnected and across reconnects.
        expose: {
          get items() {
            return controller.getSnapshot().items;
          },
          set items(items: readonly LayerItem[]) {
            controller.setItems(items);
          },
          get selectedId() {
            return controller.getSnapshot().selectedId;
          },
          set selectedId(id: string | null) {
            controller.setSelectedId(id);
          },
          get disabled() {
            return controller.getSnapshot().disabled;
          },
          set disabled(value: boolean) {
            if (typeof value !== 'boolean') throw new TypeError('disabled must be boolean');
            element.toggleAttribute('disabled', value);
          },
          focusItem(id: string) {
            if (typeof id !== 'string') throw new TypeError('id must be a string');
            return ownerSession?.focusItem(id) ?? false;
          },
        },
        getInput() {
          if (!ownerSession) throw new Error('Layer panel connection session is not active');
          return ownerSession.getInput();
        },
        onConnect() {
          ownerSession = createLayerPanelOwnerSession(
            controller,
            id => emitSelectionRequest(element, id),
            () => context.requestUpdate(),
          );
        },
        onDisconnect() {
          const session = ownerSession;
          ownerSession = undefined;
          session?.destroy();
        },
        onAttributeChange(name, _oldValue, newValue) {
          if (name === 'disabled') controller.setDisabled(newValue !== null);
        },
      };
    },
  });

  return Element;
}
