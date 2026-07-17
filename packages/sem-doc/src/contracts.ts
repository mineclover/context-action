/** Stable schema identifier for sem-derived, non-canonical analysis evidence. */
export const SEM_ADVISORY_SCHEMA = 'sem-advisory.v1' as const;

/** Read-only commands exposed by the sem adapter. */
export type SemCommand = 'diff' | 'impact' | 'blame' | 'log' | 'entities' | 'context';

export interface SemRevision {
  /** Git revision used for the analysis, when known. */
  readonly gitHead?: string;
  /** Digest of the working tree or overlay, when known. */
  readonly workingTreeDigest?: string;
}

export interface SemAdvisoryEnvelope<TPayload = unknown> {
  readonly schemaVersion: typeof SEM_ADVISORY_SCHEMA;
  readonly source: 'sem';
  readonly command: SemCommand;
  readonly args: readonly string[];
  readonly repositoryRoot: string;
  readonly revision: SemRevision;
  readonly engine: {
    readonly name: 'sem';
    readonly version: string;
  };
  readonly payload: TPayload;
}

export interface SemAdvisoryRequest {
  readonly command: SemCommand;
  readonly args?: readonly string[];
  readonly repositoryRoot: string;
  readonly revision: SemRevision;
  readonly engineVersion: string;
}
