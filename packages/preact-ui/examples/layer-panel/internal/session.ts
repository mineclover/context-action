import { createDisposalScope } from '../../../src/disposal-scope.js';
import type { MountInstance } from '../../../src/mount.js';
import type { LayerPanelController } from './controller.js';
import type { LayerPanelViewInput } from './View.js';

/** Component-specific session; it owns subscriptions and refs, never the model. */
export function createLayerPanelSession(
  controller: LayerPanelController,
  mount: (input: LayerPanelViewInput) => MountInstance<LayerPanelViewInput>,
  request: (id: string) => void,
) {
  const scope = createDisposalScope();
  const buttons = new Map<string, HTMLButtonElement>();
  let instance: MountInstance<LayerPanelViewInput> | undefined;
  const session = {
    get destroyed() { return scope.disposed; },
    focusItem(id: string): boolean {
      if (typeof id !== 'string') throw new TypeError('id must be a string');
      const button = buttons.get(id);
      const snapshot = controller.getSnapshot();
      if (scope.disposed || snapshot.disabled || !button?.isConnected || button.disabled || !snapshot.items.some(item => item.id === id)) return false;
      button.focus();
      return button.getRootNode() instanceof ShadowRoot
        ? (button.getRootNode() as ShadowRoot).activeElement === button
        : button.ownerDocument.activeElement === button;
    },
    destroy() { scope.dispose(); },
  };
  const callbacks = {
    onRequestSelect(id: string) {
      // Read the current authority, not the View's possibly old props.
      if (!scope.disposed && instance && controller.canRequest(id)) request(id);
    },
    itemRef(id: string, button: HTMLButtonElement | null) {
      if (button) buttons.set(id, button);
      else buttons.delete(id);
    },
  };
  const input = (): LayerPanelViewInput => ({ ...controller.getSnapshot(), ...callbacks });
  scope.add(() => buttons.clear());
  scope.add(controller.subscribe(() => {
    if (!instance || scope.disposed) return;
    try { instance.update(input()); } catch (error) {
      try { scope.dispose(); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Layer panel update failed');
      }
      throw error;
    }
  }));
  try {
    instance = mount(input());
    scope.add(() => instance?.destroy());
  } catch (error) {
    try { scope.dispose(); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Layer panel mount failed');
    }
    throw error;
  }
  return session;
}

export type LayerPanelSession = ReturnType<typeof createLayerPanelSession>;
