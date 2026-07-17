import {
  SEM_ADVISORY_SCHEMA,
  type SemAdvisoryEnvelope,
  type SemAdvisoryRequest,
} from './contracts';
import { SemClient } from './sem-client';
import {
  parseSemContext,
  parseSemDiff,
  parseSemEntities,
  parseSemImpact,
  type SemContextResult,
  type SemDiffResult,
  type SemEntity,
  type SemImpactResult,
} from './sem-json';

export function createSemAdvisoryEnvelope<TPayload>(
  request: SemAdvisoryRequest,
  payload: TPayload
): SemAdvisoryEnvelope<TPayload> {
  return {
    schemaVersion: SEM_ADVISORY_SCHEMA,
    source: 'sem',
    command: request.command,
    args: [...(request.args ?? [])],
    repositoryRoot: request.repositoryRoot,
    revision: request.revision,
    engine: {
      name: 'sem',
      version: request.engineVersion,
    },
    payload,
  };
}

/** Converts sem JSON output into advisory evidence without touching the canonical graph. */
export class SemAdvisoryProvider {
  public constructor(private readonly client: SemClient = new SemClient()) {}

  public analyze<TPayload>(request: SemAdvisoryRequest): SemAdvisoryEnvelope<TPayload> {
    const payload = this.client.runJson<TPayload>(request.command, request.args ?? [], {
      cwd: request.repositoryRoot,
    });
    return createSemAdvisoryEnvelope(request, payload);
  }

  public analyzeDiff(
    request: Omit<SemAdvisoryRequest, 'command'>
  ): SemAdvisoryEnvelope<SemDiffResult> {
    return this.analyzeTyped({ ...request, command: 'diff' }, parseSemDiff);
  }

  public analyzeImpact(
    request: Omit<SemAdvisoryRequest, 'command'>
  ): SemAdvisoryEnvelope<SemImpactResult> {
    return this.analyzeTyped({ ...request, command: 'impact' }, parseSemImpact);
  }

  public analyzeContext(
    request: Omit<SemAdvisoryRequest, 'command'>
  ): SemAdvisoryEnvelope<SemContextResult> {
    return this.analyzeTyped({ ...request, command: 'context' }, parseSemContext);
  }

  public analyzeEntities(
    request: Omit<SemAdvisoryRequest, 'command'>
  ): SemAdvisoryEnvelope<readonly SemEntity[]> {
    return this.analyzeTyped({ ...request, command: 'entities' }, parseSemEntities);
  }

  private analyzeTyped<TPayload>(
    request: SemAdvisoryRequest,
    parse: (value: unknown) => TPayload
  ): SemAdvisoryEnvelope<TPayload> {
    const payload = parse(
      this.client.runJson(request.command, request.args ?? [], {
        cwd: request.repositoryRoot,
      })
    );
    return createSemAdvisoryEnvelope(request, payload);
  }
}
