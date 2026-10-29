import type { ReadonlyTravelPatch } from 'travels';

/** Shared engine policy, not a dependency on either adapter implementation. */
export type ArrayPaths = { pathAsArray: true };
export type TravelsV3Patch = ReadonlyTravelPatch<ArrayPaths>;

export interface TravelsV3BackendOptions {
  readonly maxHistory?: number;
  readonly onListenerError?: (error: unknown) => void;
}
