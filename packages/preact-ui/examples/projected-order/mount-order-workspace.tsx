import { connectSourceSignal } from '@context-action/preact';
import { createDisposalScope, mountPreact } from '../../src/index.js';
import type { MountInstance } from '../../src/index.js';
import { OrderContextProvider } from './contexts/order-contexts.js';
import type { OrderModel } from './handlers/order-handlers.js';
import { OrderWorkspaceView } from './views/OrderWorkspaceView.js';

let mountSequence = 0;

export interface OrderWorkspaceMount {
  readonly instance: MountInstance<void>;
  destroy(): void;
}

/**
 * Mounts the Projected Order Workspace onto any host DOM element.
 * Manages Signal connection and renderer lifecycle cleanly via DisposalScope.
 */
export function mountOrderWorkspace(
  host: HTMLElement,
  model: OrderModel,
): OrderWorkspaceMount {
  const scope = createDisposalScope();
  const idPrefix = `order-mount-${++mountSequence}`;
  const connection = connectSourceSignal(model.source);
  scope.add(() => connection.dispose());

  try {
    const instance = mountPreact(
      host,
      () => (
        <OrderContextProvider dispatch={model.dispatch} sourceSignal={connection.signal}>
          <OrderWorkspaceView idPrefix={idPrefix} />
        </OrderContextProvider>
      ),
      undefined,
    );

    scope.add(() => instance.destroy());

    return {
      instance,
      destroy() {
        scope.dispose();
      },
    };
  } catch (error) {
    try {
      scope.dispose();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Order workspace mount failed');
    }
    throw error;
  }
}
