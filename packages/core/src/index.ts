export { ActionRegister } from './ActionRegister.js';

export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ActionDispatcher,
  ExecutionMode,
  DispatchOptions,
  ExecutionResult,
} from './types.js';

export { ActionGuard } from './action-guard.js';

export { executeSequential, executeParallel, executeRace } from './execution-modes.js';

// 🆕 React integration helpers (optional)
export {
  createActionHandler,
  createReactHandlerConfig,
  createReactDispatcher,
  ReactDevUtils,
  ReactActionError,
  isReactActionError
} from './react-helpers.js';

