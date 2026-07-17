import { existsSync, realpathSync } from 'node:fs';
import * as path from 'node:path';

import {
  DOCUMENT_INDEX_SCHEMA,
  type DocumentDefinition,
  type DocumentEntityBinding,
  indexDocuments,
} from './documents';
import {
  createRepositoryRevisionReader,
  type RepositoryRevision,
  type RepositoryRevisionReaderLike,
  RepositoryStateError,
  sameRepositoryRevision,
} from './revision';
import { createSemExecutionBudget, SemClient } from './sem-client';
import { parseSemEntities, type SemEntity } from './sem-json';

export const DOCUMENT_BINDING_VALIDATION_SCHEMA = 'sem-doc-binding-validation.v1' as const;

export interface DocumentBindingValidationRequest {
  readonly repositoryRoot: string;
  readonly docsRoot?: string;
  readonly noCache?: boolean;
  readonly engineVersion?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export type DocumentBindingIssueCode =
  | 'missing-sem-entity'
  | 'duplicate-sem-entity-id'
  | 'provenance-mismatch';

export interface DocumentBindingIssue {
  readonly severity: 'error';
  readonly code: DocumentBindingIssueCode;
  readonly symbol: string;
  readonly documentPath: string;
  readonly entityId: string;
  readonly message: string;
}

export interface DocumentBindingValidationSummary {
  readonly definitions: number;
  readonly bound: number;
  readonly unbound: number;
  readonly resolved: number;
  readonly unresolved: number;
  readonly errors: number;
}

export interface DocumentBindingValidationReport {
  readonly schemaVersion: typeof DOCUMENT_BINDING_VALIDATION_SCHEMA;
  readonly source: 'sem-doc';
  readonly valid: boolean;
  readonly repositoryRoot: string;
  readonly docsRoot: string;
  readonly revision: RepositoryRevision;
  readonly engine: {
    readonly name: 'sem';
    readonly version: string;
    readonly command: 'entities';
    readonly args: readonly string[];
  };
  readonly documentSchemaVersion: typeof DOCUMENT_INDEX_SCHEMA;
  readonly documentFiles: number;
  readonly semEntities: number;
  readonly summary: DocumentBindingValidationSummary;
  readonly issues: readonly DocumentBindingIssue[];
}

export interface DocumentBindingValidationServiceOptions {
  readonly client?: SemClient;
  readonly revisionReader?: RepositoryRevisionReaderLike;
}

/** Validates declared document SSOT bindings against a revision-pinned sem entity catalog. */
export class DocumentBindingValidationService {
  private readonly client: SemClient;
  private readonly revisionReader: RepositoryRevisionReaderLike;

  public constructor(options: DocumentBindingValidationServiceOptions = {}) {
    this.client = options.client ?? new SemClient();
    this.revisionReader = options.revisionReader ?? createRepositoryRevisionReader();
  }

  public analyze(request: DocumentBindingValidationRequest): DocumentBindingValidationReport {
    const revision = this.revisionReader.read(path.resolve(request.repositoryRoot));
    const repositoryRoot = revision.repositoryRoot;
    const docsRoot = repositoryPath(repositoryRoot, request.docsRoot ?? 'managed');
    validatePositiveInteger(request.timeoutMs, 'timeoutMs');
    validatePositiveInteger(request.maxOutputBytes, 'maxOutputBytes');
    const budget = createSemExecutionBudget({
      timeoutMs: request.timeoutMs ?? 120_000,
      maxOutputBytes: request.maxOutputBytes ?? 64 * 1024 * 1024,
    });
    const engineVersion = (
      request.engineVersion ?? this.client.version({ cwd: repositoryRoot, budget })
    ).trim();
    if (engineVersion.length === 0 || engineVersion === 'unknown') {
      throw new RepositoryStateError('sem version is required for binding validation provenance');
    }
    const args = [...(request.noCache === true ? ['--no-cache'] : []), '--json'];
    const entities = parseSemEntities(
      this.client.runJson('entities', args, { cwd: repositoryRoot, budget })
    );
    validateEntityPaths(repositoryRoot, entities);
    const index = indexDocuments(docsRoot);
    const result = validateBindings(index.definitions, entities);
    const after = this.revisionReader.read(repositoryRoot);
    if (!sameRepositoryRevision(revision, after)) {
      throw new RepositoryStateError(
        `Repository changed while document bindings were validated: ${revision.workingTreeDigest} -> ${after.workingTreeDigest}`
      );
    }
    return {
      schemaVersion: DOCUMENT_BINDING_VALIDATION_SCHEMA,
      source: 'sem-doc',
      valid: result.issues.length === 0,
      repositoryRoot,
      docsRoot,
      revision,
      engine: { name: 'sem', version: engineVersion, command: 'entities', args },
      documentSchemaVersion: DOCUMENT_INDEX_SCHEMA,
      documentFiles: index.files,
      semEntities: entities.length,
      summary: {
        definitions: index.definitions.length,
        bound: result.bound,
        unbound: index.definitions.length - result.bound,
        resolved: result.resolved,
        unresolved: result.bound - result.resolved,
        errors: result.issues.length,
      },
      issues: result.issues,
    };
  }
}

export function renderDocumentBindingValidationText(
  report: DocumentBindingValidationReport
): string {
  const lines = [
    `Document Entity Bindings: ${report.valid ? 'valid' : 'invalid'}`,
    `Revision: ${report.revision.gitHead} / ${report.revision.workingTreeDigest.slice(0, 12)}`,
    `Engine: sem ${report.engine.version}`,
    `Documents: ${report.documentFiles}`,
    `Definitions: ${report.summary.definitions}`,
    `Bound: ${report.summary.bound}`,
    `Unbound document checkpoints: ${report.summary.unbound}`,
    `Resolved bindings: ${report.summary.resolved}`,
    `Unresolved bindings: ${report.summary.unresolved}`,
    `Errors: ${report.summary.errors}`,
  ];
  for (const issue of report.issues) {
    lines.push(
      `  [${issue.code}] ${issue.documentPath} [[${issue.symbol}]] -> ${issue.entityId}: ${issue.message}`
    );
  }
  return `${lines.join('\n')}\n`;
}

function validateBindings(
  definitions: readonly DocumentDefinition[],
  entities: readonly SemEntity[]
): {
  readonly bound: number;
  readonly resolved: number;
  readonly issues: readonly DocumentBindingIssue[];
} {
  const entitiesById = new Map<string, SemEntity[]>();
  for (const entity of entities) {
    if (entity.id === undefined) continue;
    const matches = entitiesById.get(entity.id) ?? [];
    matches.push(entity);
    entitiesById.set(entity.id, matches);
  }
  const issues: DocumentBindingIssue[] = [];
  let bound = 0;
  let resolved = 0;
  for (const definition of definitions) {
    if (definition.entity === undefined) continue;
    bound += 1;
    const matches = entitiesById.get(definition.entity.id) ?? [];
    if (matches.length === 0) {
      issues.push(issue(definition, 'missing-sem-entity', 'entity ID is absent from sem entities'));
      continue;
    }
    if (matches.length > 1) {
      issues.push(
        issue(definition, 'duplicate-sem-entity-id', 'sem returned the entity ID more than once')
      );
      continue;
    }
    if (!matchesBinding(definition.entity, matches[0])) {
      issues.push(
        issue(
          definition,
          'provenance-mismatch',
          `sem reports ${matches[0].type} ${matches[0].name} in ${normalizeFile(matches[0].file)}`
        )
      );
      continue;
    }
    resolved += 1;
  }
  return { bound, resolved, issues };
}

function issue(
  definition: DocumentDefinition & { readonly entity?: DocumentEntityBinding },
  code: DocumentBindingIssueCode,
  message: string
): DocumentBindingIssue {
  const entityId = definition.entity?.id;
  if (entityId === undefined) throw new Error('binding issue requires entity metadata');
  return {
    severity: 'error',
    code,
    symbol: definition.symbol,
    documentPath: definition.documentPath,
    entityId,
    message,
  };
}

function matchesBinding(binding: DocumentEntityBinding, entity: SemEntity): boolean {
  return (
    entity.id === binding.id &&
    entity.name === binding.name &&
    entity.type === binding.type &&
    normalizeFile(entity.file) === binding.file
  );
}

function validateEntityPaths(repositoryRoot: string, entities: readonly SemEntity[]): void {
  for (const entity of entities) {
    const absolute = path.resolve(repositoryRoot, entity.file);
    if (!isWithinRoot(repositoryRoot, absolute)) {
      throw new RepositoryStateError(`sem entity file is outside the repository: ${entity.file}`);
    }
  }
}

function repositoryPath(repositoryRoot: string, value: string): string {
  const absolute = path.resolve(repositoryRoot, value);
  if (!isWithinRoot(repositoryRoot, absolute)) {
    throw new RepositoryStateError('docs root must be inside the repository');
  }
  if (!existsSync(absolute)) return absolute;
  let resolved: string;
  let canonicalRoot: string;
  try {
    canonicalRoot = realpathSync(repositoryRoot);
    resolved = realpathSync(absolute);
  } catch (error) {
    throw new RepositoryStateError(
      `docs root cannot be resolved: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!isWithinRoot(canonicalRoot, resolved)) {
    throw new RepositoryStateError('docs root escapes the repository through a symlink');
  }
  return resolved;
}

function validatePositiveInteger(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
    throw new RepositoryStateError(`${name} must be a positive integer`);
  }
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function normalizeFile(file: string): string {
  return path.posix.normalize(file.replaceAll('\\', '/')).replace(/^\.\//u, '');
}
