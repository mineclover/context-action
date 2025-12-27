/**
 * @context-action/mutative
 *
 * Mutative-based immutability and time-travel utilities.
 * Drop-in replacement for Immer with undo/redo capabilities.
 */

// Types
export type {
  // Patch types
  PatchesOption,
  TravelPatches,

  // Time travel types
  TimeTravelOptions,
  TimeTravelControls,
  ManualTimeTravelControls,
  TimeTravelListener,

  // Value types
  InitialValue,
  DraftFunction,
  Updater,
  Value,

  // Immutability types
  ImmutabilityOptions,
  ProduceOptions,

  // Re-exported mutative types
  Draft,
  Immutable,
  Patches,
  PatchesOptions,
} from './types';

// Immutable utilities
export {
  // Core produce
  produce,
  produceWithPatches,

  // Deep clone
  deepClone,
  safeGet,
  safeSet,

  // Patch application
  applyPatches,

  // Mutative utilities
  MutativeUtils,

  // Re-exported mutative functions
  isDraft,
  original,
  current,
  rawReturn,
  create,
  apply,

  // Configuration
  setGlobalImmutabilityOptions,
  getGlobalImmutabilityOptions,
} from './immutable';

// Time travel
export { TimeTravel, createTimeTravel } from './time-travel';

// Utilities
export {
  isObjectLike,
  isPlainObject,
  isPrimitive,
  hasOnlyArrayIndices,
  deepClone as deepCloneValue,
  isNonCloneableType,
} from './utils';
