import { createDisposalScope } from '../../../src/disposal-scope.js';
import type { MountInstance } from '../../../src/mount.js';
import type { LayerPanelController } from './controller.js';
import type { LayerPanelViewInput } from './View.js';

export interface LayerPanelOwnerSession {
  readonly destroyed: boolean;
  /** Current author-only View input; never expose this to consumers. */
  getInput(): LayerPanelViewInput;
  focusItem(id: string): boolean;
  destroy(): void;
}

/**
 * Creates the component-owned connection session without choosing a renderer.
 * The Custom Element adapter and template adapter both use this same owner;
 * only their mount function differs.
 */
export function createLayerPanelOwnerSession(
  controller: LayerPanelController,
  request: (id: string) => void,
  update: (input: LayerPanelViewInput) => void,
): LayerPanelOwnerSession {
  const scope = createDisposalScope();
  const buttons = new Map<string, HTMLButtonElement>();
  const session = {
    get destroyed() { return scope.disposed; },
    getInput(): LayerPanelViewInput { return input(); },
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
      if (!scope.disposed && controller.canRequest(id)) request(id);
    },
    itemRef(id: string, button: HTMLButtonElement | null) {
      if (button) buttons.set(id, button);
      else buttons.delete(id);
    },
  };
  const input = (): LayerPanelViewInput => ({ ...controller.getSnapshot(), ...callbacks });
  scope.add(() => buttons.clear());
  scope.add(controller.subscribe(() => {
    if (scope.disposed) return;
    try { update(input()); } catch (error) {
      try { scope.dispose(); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Layer panel update failed');
      }
      throw error;
    }
  }));
  return session;
}

/** Template/DOM adapter that mounts the shared owner session. */
export function createLayerPanelSession(
  controller: LayerPanelController,
  mount: (input: LayerPanelViewInput) => MountInstance<LayerPanelViewInput>,
  request: (id: string) => void,
) {
  let instance: MountInstance<LayerPanelViewInput> | undefined;
  const owner = createLayerPanelOwnerSession(controller, request, input => instance?.update(input));
  try {
    instance = mount(owner.getInput());
    return {
      get destroyed() { return owner.destroyed; },
      getInput: owner.getInput,
      focusItem: owner.focusItem,
      destroy() {
        const errors: unknown[] = [];
        try { instance?.destroy(); } catch (error) { errors.push(error); }
        try { owner.destroy(); } catch (error) { errors.push(error); }
        if (errors.length === 1) throw errors[0];
        if (errors.length > 1) throw new AggregateError(errors, 'Layer panel session disposal failed');
      },
    };
  } catch (error) {
    try { owner.destroy(); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Layer panel mount failed');
    }
    throw error;
  }
}

export type LayerPanelSession = ReturnType<typeof createLayerPanelSession>;
