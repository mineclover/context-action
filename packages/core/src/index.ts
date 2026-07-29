export { ActionRegister } from './ActionRegister.js';

export type {
  ActionPayloadMap,
  ActionSchemaLike,
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

// Validation Errors
export {
  ActionValidationError,
  ActionTimeoutError,
  ActionRegisterDestroyedError,
  isActionValidationError,
  isActionTimeoutError,
  isActionRegisterDestroyedError,
} from './errors.js';
