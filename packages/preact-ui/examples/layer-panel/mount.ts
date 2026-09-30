import { mountTemplate } from '../../src/template.js';
import { createLayerPanelController } from './internal/controller.js';
import { emitSelectionRequest } from './internal/events.js';
import { createLayerPanelSession } from './internal/session.js';
import { LayerPanelView } from './internal/View.js';
import type { LayerItem, LayerPanelInput, LayerPanelMount } from './public.js';

/** The host receives semantic inputs, not MountInstance.update or View props. */
export function mountLayerPanel(
  host: HTMLElement,
  template: HTMLTemplateElement,
  initial: LayerPanelInput = {},
): LayerPanelMount {
  const controller = createLayerPanelController(initial);
  const session = createLayerPanelSession(controller,
    input => mountTemplate(host, template, LayerPanelView, input),
    id => emitSelectionRequest(host, id));
  function assertActive() {
    if (session.destroyed) throw new Error('Layer panel is destroyed');
  }
  return {
    get items() { return controller.getSnapshot().items; },
    set items(items: readonly LayerItem[]) { assertActive(); controller.setItems(items); },
    get selectedId() { return controller.getSnapshot().selectedId; },
    set selectedId(id: string | null) { assertActive(); controller.setSelectedId(id); },
    get disabled() { return controller.getSnapshot().disabled; },
    set disabled(value: boolean) { assertActive(); controller.setDisabled(value); },
    focusItem: session.focusItem,
    destroy: session.destroy,
  };
}
