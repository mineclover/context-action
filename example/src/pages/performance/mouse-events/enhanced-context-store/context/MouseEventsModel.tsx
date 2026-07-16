/**
 * Compatibility exports for the legacy enhanced context-store model path.
 * New code should import contracts from `../contexts` and composition from
 * `../providers`.
 */

import {
  useMouseAction,
  useMouseActionHandler,
  useMouseOnMountStateChange,
  useMouseRef,
  useMouseRefMountChecker,
  useMouseRefMountState,
  useMouseStore,
} from '../contexts/EnhancedContextStoreContexts';
import { EnhancedContextStoreProvider } from '../providers/EnhancedContextStoreProvider';

export * from '../contexts/EnhancedContextStoreContexts';
export { EnhancedContextStoreProvider as MouseEventsModelProvider } from '../providers/EnhancedContextStoreProvider';

/** Legacy namespace shape retained for older enhanced mouse examples. */
export const MouseEventsModel = {
  useStore: useMouseStore,
  useActionDispatch: useMouseAction,
  useActionHandler: useMouseActionHandler,
  useRefHandler: useMouseRef,
  useRefMountState: useMouseRefMountState,
  useOnMountStateChange: useMouseOnMountStateChange,
  useRefMountChecker: useMouseRefMountChecker,
  Provider: EnhancedContextStoreProvider,
};
